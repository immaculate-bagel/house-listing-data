require("dotenv").config({ path: ".env" });

var request = require("request");
var fs = require("fs");

// Set your API parameters here.
var API_token = process.env.API_TOKEN;
var view_name = "property_flat_prices";
var format = "CSV";
var query = 'country:US AND propertyType:"Single Family Dwelling"';
var num_records = 1;
var download = true;

var request_options = {
  url: "https://api.datafiniti.co/v4/properties/search",
  method: "POST",
  json: {
    query: query,
    num_records: num_records,
    view_name: view_name,
    format: format,
    download: download
  },
  headers: {
    Authorization: "Bearer " + API_token,
    "Content-Type": "application/json"
  }
};

console.log(request_options);

// A function to check if a download request has completed
function checkDownloadUntilComplete(options, callback) {
  var download_id = options.download_id;
  var download_options = {
    url: "https://api.datafiniti.co/v4/downloads/" + download_id,
    method: "GET",
    headers: {
      Authorization: "Bearer " + API_token,
      "Content-Type": "application/json"
    }
  };

  request(download_options, async function(error, response, body) {
    var num_files_downloaded = 0;
    var download_response = JSON.parse(body);
    console.log(download_response);
    console.log("Records downloaded: " + download_response.num_downloaded);
    if (download_response.status !== "completed") {
      // NEED A SLEEP FUNCTION HERE!
      await sleep(5000);
      checkDownloadUntilComplete(options, callback);
    } else {
      var results = download_response.results;
      console.log(results);
      for (var i = 0; i < results.length; i++) {
        var filename = download_id + "_" + i + "." + format;
        var file = fs.createWriteStream(filename);
        request(results[i])
          .pipe(file)
          .on("end", function() {
            console.log(
              "File " +
                (i + 1) +
                " out of " +
                results.length +
                " saved: " +
                filename
            );
            num_files_downloaded++;
            if (num_files_downloaded === results.length) process.exit();
          });
      }
    }
  });
}

// Initiate the download request.
request(request_options, function(error, response, body) {
  var request_response = body;
  var download_id = request_response.id;

  // Check on status of the download request.
  checkDownloadUntilComplete({ download_id: download_id }, function(
    error,
    response
  ) {});
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
