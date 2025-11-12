const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Note: This should be the service key with more privileges

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240601_create_circuit_breakers.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error running migration:', error);
      return;
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the migration
runMigration(); 