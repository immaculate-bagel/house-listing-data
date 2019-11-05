require("dotenv").config({ path: ".env" });
const request = require("request");
const fs = require("fs");

const { APIToken } = process.env;
const format = "CSV";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// A function to check if a download request has completed
function checkDownloadUntilComplete(options, callback) {
  const { downloadId } = options;
  const downloadOptions = {
    url: `https://api.datafiniti.co/v4/downloads/${downloadId}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${APIToken}`,
      "Content-Type": "application/json"
    }
  };

  const end = (i, results, filename, exit) => {
    console.log(`File ${i + 1} out of ${results.length} saved: ${filename}`);
    if (exit) process.exit();
  };

  request(downloadOptions, async body => {
    let numFilesDownloaded = 0;
    const downloadResponse = JSON.parse(body);
    console.log(`Records downloaded: ${downloadResponse.num_downloaded}`);
    if (downloadResponse.status !== "completed") {
      // NEED A SLEEP FUNCTION HERE!
      await sleep(5000);
      checkDownloadUntilComplete(options, callback);
    } else {
      const { results } = downloadResponse;
      console.log(results);
      for (let i = 0; i < results.length; i++) {
        const filename = `print_${downloadId}_${i}.${format}`;
        const file = fs.createWriteStream(filename);
        request(results[i])
          .pipe(file)
          .on(
            "end",
            end(
              i,
              results,
              filename,
              (numFilesDownloaded += 1) === results.length
            )
          );
      }
    }
  });
}

// Initiate the download request.
request({}, () => {
  //   const downloadId = 15151;
  const downloadId = 15097;
  // Check on status of the download request.
  checkDownloadUntilComplete({ downloadId }, () => {});
});
