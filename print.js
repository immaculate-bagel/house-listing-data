require("dotenv").config({ path: ".env" });
const request = require("request");
const fs = require("fs");

const { APIToken } = process.env;
const format = "CSV";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// A function to check if a download request has completed
function checkDownloadUntilComplete(options, callback = () => {}) {
  const downloadId = options;
  const downloadOptions = {
    url: `https://api.datafiniti.co/v4/downloads/${downloadId}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${APIToken}`,
      "Content-Type": "application/json"
    }
  };

  request(downloadOptions, async (error, response, body) => {
    if (error) {
      throw new Error(error);
    }

    let numFilesDownloaded = 0;
    const downloadResponse = JSON.parse(body);
    console.log(`Records downloaded: ${downloadResponse.num_downloaded}`);
    if (downloadResponse.status !== "completed") {
      await sleep(5000);
      checkDownloadUntilComplete(options, callback);
    } else {
      const { results } = downloadResponse;
      console.log(results);
      for (let i = 0; i < results.length; i++) {
        const filename = `${downloadId}_${i}.${format}`;
        const file = fs.createWriteStream(filename);
        request(results[i])
          .pipe(file)
          .on("end", () => {
            numFilesDownloaded += 1;
            if (numFilesDownloaded === results.length) {
              process.exit();
            }
          });
      }
    }
  });
}

const main = async () => {
  let uniqueIds = [];
  const downloadIds = [15150, 15151, 15157, 15158, 15159, 15160, 15096, 15097];
  const downloadOptions = {
    url: `https://api.datafiniti.co/v4/downloads`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${APIToken}`,
      "Content-Type": "application/json"
    }
  };
  await request(downloadOptions, async (error, response, body) => {
    if (error) {
      throw new Error(error);
    }
    const { records } = JSON.parse(response.body);
    const restOfIds = records.map(r => {
      return parseInt(r.id, 10);
    });
    uniqueIds = [...downloadIds, ...restOfIds]
      .filter((x, i, a) => a.indexOf(x) === i)
      .sort();
    uniqueIds.map(async id => {
      await checkDownloadUntilComplete(id);
    });
  });
};

main();
