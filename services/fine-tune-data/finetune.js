const fs = require("fs");

function appendToCSV(filePath, newString, stringArray, label) {
  // Combine all elements into a single array
  const dataArray = [
    `condition: ${newString}, All posts: [${stringArray.join(";")}]`,
    label,
  ];

  // Join the array elements with commas to create a CSV row
  const csvLine = dataArray.map((item) => `"${item}"`).join(",") + "\n";

  // Append the new line to the CSV file
  fs.appendFile(filePath, csvLine, (err) => {
    if (err) {
      console.error("Error appending to CSV file:", err);
    } else {
      console.log("Data appended successfully to", filePath);
    }
  });
}

appendToCSV(
  "./services/fine-tune-data/data.csv",
  "When I get married",
  ["My dad got married again", "I am a lost cause"],
  "no"
);
