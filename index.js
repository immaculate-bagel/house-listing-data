const csv = require("csv-parser");
const fs = require("fs");
const fetch = require("node-fetch");
const zipCodes = [];

const readCSV = path => {
  fs.createReadStream(path)
    .pipe(csv())
    .on("data", data => zipCodes.push(data))
    .on("end", () => {
      zipCodes.map(async zipCode => {
        const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=3&srsearch=${zipCode.search}`;
        await fetch(endpoint)
          .then(res => res.json())
          .then(data => {
            fs.appendFile(
              "results.json",
              JSON.stringify(data.query.search),
              err => {
                if (err) throw err;
                console.log("Data written to file");
              }
            );
          });
      });
    });
};

readCSV("testInputs.csv");
