const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the Excel file
const workbook = XLSX.readFile('./working-reference/All_breakers-ratings.xlsx');
const sheetName = workbook.SheetNames[0]; // Assuming the data is in the first sheet
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${data.length} circuit breaker records in Excel file.`);

// Function to populate the database
async function populateCircuitBreakers() {
  try {
    // First, clear the existing data
    const { error: deleteError } = await supabase
      .from('circuit_breakers')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      return;
    }

    console.log('Cleared existing circuit breaker data.');

    // Prepare the data for insertion
    const circuitBreakers = data.map((row, index) => ({
      id: `breaker-${row['Breaker Type'].toLowerCase()}-${row['Ampacity (A)']}`,
      breaker_type: row['Breaker Type'],
      ampacity: row['Ampacity (A)'],
      rated_voltage: row['Rated Voltage (kV)'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert the data in batches to avoid request size limits
    const batchSize = 50;
    for (let i = 0; i < circuitBreakers.length; i += batchSize) {
      const batch = circuitBreakers.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('circuit_breakers')
        .insert(batch)
        .select();

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records).`);
      }
    }

    console.log('Circuit breaker data population complete!');
  } catch (error) {
    console.error('Error populating circuit breakers:', error);
  }
}

// Run the population function
populateCircuitBreakers(); 