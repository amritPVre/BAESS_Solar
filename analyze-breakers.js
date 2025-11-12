import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('./working-reference/Breaker-rating.xlsx');

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log('Sheets in workbook:', sheetNames);

// Process each sheet
sheetNames.forEach(sheetName => {
  console.log(`\nAnalyzing sheet: ${sheetName}`);
  
  // Get the worksheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  if (data.length > 0) {
    // Display the first row to understand the structure
    console.log('First row sample:');
    console.log(data[0]);
    
    // Display column names
    console.log('Column names:');
    console.log(Object.keys(data[0]));
    
    // Display total rows
    console.log(`Total rows: ${data.length}`);
  } else {
    console.log('No data found in this sheet');
  }
});

// Save the full data structure for reference
const allData = {};
sheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  allData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
});

fs.writeFileSync('breaker-data.json', JSON.stringify(allData, null, 2));
console.log('\nFull data saved to breaker-data.json'); 