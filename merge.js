const fs = require("fs");
const csv = require("fast-csv");

fs.createReadStream(".csv")
  .pipe(csv.parse({ headers: true }))
  .on("data", row => console.log(row));
