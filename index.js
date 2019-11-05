require('dotenv').config({ path: '.env' });

const request = require('request');
const fs = require('fs');
const csv = require('csv-parser');

const zipCodes = [];

const { APIToken } = process.env;
const format = 'CSV';
const view = 'property_flat_prices';
const download = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

fs.createReadStream('zipcodes.csv')
  .pipe(csv())
  .on('data', (data) => zipCodes.push(`postalCode:${data.zip}`))
  .on('end', () => {
    const requestOptions = {
      url: 'https://api.datafiniti.co/v4/properties/search',
      method: 'POST',
      json: {
        query: `(${zipCodes.join(
          ' OR ',
        )}) AND propertyType:"Single Family Dwelling"`,
        format,
        num_records: 1,
        view,
        download,
      },
      headers: {
        Authorization: `Bearer ${APIToken}`,
        'Content-Type': 'application/json',
      },
    };

    // A function to check if a download request has completed
    function checkDownloadUntilComplete(options, callback) {
      const { downloadId } = options;
      const downloadOptions = {
        url: `https://api.datafiniti.co/v4/downloads/${downloadId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${APIToken}`,
          'Content-Type': 'application/json',
        },
      };

      request(downloadOptions, async (error, response, body) => {
        let numFilesDownloaded = 0;
        const downloadResponse = JSON.parse(body);
        if (downloadResponse.status !== 'completed') {
          // NEED A SLEEP FUNCTION HERE!
          await sleep(5000);
          checkDownloadUntilComplete(options, callback);
        } else {
          const { results } = downloadResponse;
          for (let i = 0; i < results.length; i++) {
            const filename = `${downloadId}_${i}.${format}`;
            const file = fs.createWriteStream(filename);
            request(results[i])
              .pipe(file)
              .on('end', () => {
                numFilesDownloaded += 1;
                if (numFilesDownloaded === results.length) {
                  process.exit();
                }
              });
          }
        }
      });
    }

    // Initiate the download request.
    request(requestOptions, (error, response, body) => {
      const requestResponse = body;
      const downloadId = requestResponse.id;
      checkDownloadUntilComplete(
        { downloadId },
        (completedError, completedResponse) => {},
      );
    });
  });
