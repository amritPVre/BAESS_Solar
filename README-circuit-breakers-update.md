# Circuit Breakers Database Update

This document outlines the steps to update the circuit breakers database table in Supabase to match the simplified structure from the Excel file.

## Changes Made

1. Updated the circuit breaker service (`src/services/circuitBreakerService.ts`) to use a simplified data structure:
   - Replaced `CircuitBreakerType` and `CircuitBreakerRating` with a single `CircuitBreaker` type
   - Updated all functions to work with the new structure
   - Simplified the selection logic

2. Added the new `circuit_breakers` table to Supabase types (`src/integrations/supabase/types.ts`)

3. Updated the AC Configuration component (`src/components/advanced-solar-calculator/ACSideConfiguration.tsx`) to use the new circuit breaker structure

4. Created SQL migration script to create the new table (`supabase/migrations/20240601_create_circuit_breakers.sql`)

5. Created scripts to populate the database with data from the Excel file:
   - `populate-breakers.js` (ES modules version)
   - `populate-breakers.cjs` (CommonJS version)

## Implementation Steps

### 1. Create the Circuit Breakers Table in Supabase

You can create the table in one of two ways:

#### Option A: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `supabase/migrations/20240601_create_circuit_breakers.sql`
4. Run the SQL script

#### Option B: Using the Migration Script

1. Add your Supabase credentials to a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_KEY=your-service-key
   ```

2. Run the migration script:
   ```
   node run-migration.js
   ```

### 2. Populate the Circuit Breakers Table

1. Make sure your Supabase credentials are in the `.env` file
2. Run the population script:
   ```
   node populate-breakers.cjs
   ```

### 3. Update the Application Code

The application code has already been updated to use the new circuit breaker structure. The changes include:

- Updated type definitions
- Updated service functions
- Updated component to display the new data structure

## New Circuit Breaker Structure

The new circuit breaker structure is simplified to match the Excel file:

```typescript
export type CircuitBreaker = {
  id: string;
  breaker_type: 'MCB' | 'MCCB' | 'ACB' | 'VCB';
  ampacity: number;
  rated_voltage: number;
  created_at: string;
  updated_at: string;
};
```

This structure directly maps to the columns in the Excel file:
- `breaker_type` corresponds to "Breaker Type"
- `ampacity` corresponds to "Ampacity (A)"
- `rated_voltage` corresponds to "Rated Voltage (kV)"

## Troubleshooting

If you encounter any issues:

1. Check that the circuit_breakers table was created successfully in Supabase
2. Verify that the data was populated correctly
3. Check the browser console for any error messages
4. Ensure that the Supabase client is properly initialized with the correct credentials 