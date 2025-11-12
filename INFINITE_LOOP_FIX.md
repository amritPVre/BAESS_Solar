# Infinite Loop & Database Error Fix

## Issues Identified

### 1. **Infinite Loop Problem**
The restoration logic was causing an infinite loop:
```
Data restored → States update → Send-to-parent effect triggers → 
Parent updates → Prop changes → Restoration triggers again! 🔄
```

### 2. **Database Schema Error**
```
Could not find the 'comprehensive_boq_data' column in the 
advanced_calculator_projects' in the schema cache
```
The database table was missing the required column.

## Solutions Implemented

### Fix 1: Added Restoration Flag to Prevent Infinite Loop

**File:** `src/components/advanced-solar-calculator/DetailedBOQGenerator.tsx`

#### Added State Flag
```typescript
// Flag to prevent send-to-parent effect during restoration
const [isRestoringData, setIsRestoringData] = useState(false);
```

#### Updated Restoration useEffect
```typescript
useEffect(() => {
  if (initialBOQData && !isRestoringData) {
    // Set flag to prevent triggering send-to-parent effect
    setIsRestoringData(true);
    
    // Restore all data...
    setGeneratedBOQ(initialBOQData.generatedBOQ);
    setMergedBOQ(initialBOQData.mergedBOQ);
    setPricedBOQ(initialBOQData.pricedBOQ);
    // ... more restoration
    
    // Reset flag after restoration is complete
    setTimeout(() => setIsRestoringData(false), 100);
  }
}, [initialBOQData, isRestoringData]);
```

#### Updated Send-to-Parent useEffect
```typescript
useEffect(() => {
  // Don't send updates while restoring data to prevent infinite loop
  if (isRestoringData) {
    console.log('🔒 Skipping parent update during data restoration');
    return;
  }
  
  // Normal update logic...
  if (onComprehensiveBOQDataUpdate && (generatedBOQ.length > 0 || ...)) {
    onComprehensiveBOQDataUpdate(comprehensiveData);
  }
}, [generatedBOQ, mergedBOQ, pricedBOQ, ..., isRestoringData]);
```

### Fix 2: Added Database Column

**File:** `supabase/migrations/20250125_add_comprehensive_boq_data.sql`

```sql
-- Add comprehensive_boq_data column to store detailed AI BOQ data
ALTER TABLE public.advanced_calculator_projects 
ADD COLUMN IF NOT EXISTS comprehensive_boq_data JSONB;

-- Add comment to the column
COMMENT ON COLUMN public.advanced_calculator_projects.comprehensive_boq_data 
IS 'Stores comprehensive AI-generated BOQ data including generated, merged, and priced line items with timestamps and AI model info';
```

## How the Fix Works

### Restoration Flow (Fixed)
```
1. Project Loads
   └─> initialBOQData prop populated
       
2. Restoration useEffect Triggers
   └─> Check: !isRestoringData? YES
       └─> Set isRestoringData = true
           └─> Restore all states
               └─> Set timeout to reset flag (100ms)

3. Send-to-Parent useEffect Triggered by State Changes
   └─> Check: isRestoringData? YES
       └─> ✅ SKIP UPDATE (Prevents infinite loop!)
       
4. After 100ms: isRestoringData = false
   └─> Normal operations resume
```

### Why This Works

1. **Restoration Guard**: The `!isRestoringData` check in restoration useEffect prevents it from running multiple times
2. **Send Guard**: The `isRestoringData` check in send-to-parent useEffect prevents updates during restoration
3. **Timeout Reset**: The 100ms delay ensures all state updates complete before resetting the flag
4. **Dependency Array**: Including `isRestoringData` in dependencies ensures proper synchronization

## Installation Instructions

### Step 1: Run Database Migration

You need to run the new migration to add the `comprehensive_boq_data` column:

#### Option A: Using Supabase CLI (Recommended)
```bash
# Navigate to project directory
cd c:\Users\amrit\Desktop\Solar_all_app\sunny-finance-toolkit

# Run the migration
supabase db push

# Or if using Supabase locally
supabase migration up
```

#### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250125_add_comprehensive_boq_data.sql`
4. Click **Run** to execute the migration

#### Option C: Using Direct SQL (If you have database access)
```sql
ALTER TABLE public.advanced_calculator_projects 
ADD COLUMN IF NOT EXISTS comprehensive_boq_data JSONB;

COMMENT ON COLUMN public.advanced_calculator_projects.comprehensive_boq_data 
IS 'Stores comprehensive AI-generated BOQ data including generated, merged, and priced line items with timestamps and AI model info';
```

### Step 2: Verify Migration

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'advanced_calculator_projects' 
  AND column_name = 'comprehensive_boq_data';

-- Should return:
-- column_name              | data_type
-- comprehensive_boq_data   | jsonb
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
# or
bun run dev
```

### Step 4: Clear Browser Cache & Reload

1. Open Developer Tools (F12)
2. Right-click refresh button → **Empty Cache and Hard Reload**
3. Or clear site data: Dev Tools → Application → Clear Storage → Clear site data

## Testing the Fix

### Test 1: Verify No Infinite Loop
1. Open browser console (F12)
2. Load a saved project with AI BOQ data
3. Navigate to AI BOQ tab
4. **Expected Console Logs (should appear ONCE):**
   ```
   🔄 Restoring AI BOQ data from saved project: {...}
   ✅ AI BOQ data restored successfully
   🔒 Skipping parent update during data restoration
   ```
5. **Should NOT see:** Repeated restoration logs

### Test 2: Verify Data Restoration
1. Open a project with previously generated BOQ
2. Navigate to AI BOQ tab
3. **Expected Result:**
   - Generated BOQ items appear immediately
   - Priced BOQ items appear immediately
   - Timestamps are correct
   - No API calls made

### Test 3: Verify Saving Still Works
1. Generate new BOQ or modify existing
2. Wait 30 seconds for auto-save (or manually save)
3. **Expected in console:**
   ```
   📦 Sending comprehensive BOQ data to parent: {...}
   📊 Received comprehensive BOQ data update: {...}
   ✅ Auto-saved successfully
   ```
4. **Should NOT see:** Database errors about missing column

### Test 4: Verify New Changes Are Saved
1. Make changes to BOQ (add/edit items)
2. Save project
3. Reload project
4. Navigate to AI BOQ tab
5. **Expected:** All changes are preserved

## Troubleshooting

### Issue: Still seeing infinite loop
**Solution:**
- Clear browser cache completely
- Restart dev server
- Check that you're using the latest code

### Issue: Database error persists
**Solution:**
- Verify migration ran successfully
- Check Supabase dashboard → Table Editor → advanced_calculator_projects
- Look for `comprehensive_boq_data` column
- If not present, run migration again

### Issue: Data not restoring
**Solution:**
- Check browser console for errors
- Verify `initialBOQData` prop has data
- Check that restoration logs appear
- Ensure `isRestoringData` flag is working

### Issue: Data not saving
**Solution:**
- Check that column exists in database
- Verify user is authenticated
- Check for other console errors
- Ensure `onComprehensiveBOQDataUpdate` is being called after flag resets

## Technical Details

### State Management Flow

```typescript
// Component Mount
isRestoringData = false
generatedBOQ = []
mergedBOQ = []
pricedBOQ = []

// Project Loads
initialBOQData = { generatedBOQ: [...], mergedBOQ: [...], ... }

// Restoration Effect Runs
isRestoringData = true  // Guard set
generatedBOQ = [... restored data ...]  // State updates
mergedBOQ = [... restored data ...]
pricedBOQ = [... restored data ...]

// Send-to-Parent Effect Tries to Run
if (isRestoringData) return;  // BLOCKED! ✅

// After 100ms
isRestoringData = false  // Guard removed

// Future user changes
generatedBOQ = [... user made changes ...]  // State updates
// Send-to-Parent Effect Runs
if (isRestoringData) return;  // PASSES (false)
onComprehensiveBOQDataUpdate(...)  // SENT! ✅
```

### Dependency Management

#### Restoration useEffect Dependencies
```typescript
[initialBOQData, isRestoringData]
```
- `initialBOQData`: Triggers when project loads
- `isRestoringData`: Prevents re-triggering during restoration

#### Send-to-Parent useEffect Dependencies
```typescript
[generatedBOQ, mergedBOQ, pricedBOQ, generationTimestamp, 
 pricingTimestamp, selectedAIModel, additionalCosts, 
 onComprehensiveBOQDataUpdate, isRestoringData]
```
- All BOQ-related states: Triggers when user makes changes
- `isRestoringData`: Blocks during restoration phase

### Timing Considerations

The 100ms timeout was chosen because:
1. **State Updates Are Async**: React batches state updates
2. **Multiple setState Calls**: We make several in succession
3. **Effect Re-runs**: Need time for effects to complete
4. **User Perception**: 100ms is imperceptible to users
5. **Safety Margin**: Ensures all updates complete before resuming

## Files Modified

1. **src/components/advanced-solar-calculator/DetailedBOQGenerator.tsx**
   - Added `isRestoringData` state flag
   - Updated restoration useEffect with guard
   - Updated send-to-parent useEffect with guard check

2. **supabase/migrations/20250125_add_comprehensive_boq_data.sql** *(NEW)*
   - Adds `comprehensive_boq_data` JSONB column
   - Adds column comment

## Migration Safety

The migration is safe because:
- Uses `IF NOT EXISTS` clause
- Only adds a column (doesn't modify existing data)
- Uses JSONB type (flexible, no schema required)
- Doesn't break existing functionality
- Can be rolled back if needed

## Rollback Plan (If Needed)

If you need to rollback:

```sql
-- Remove the column
ALTER TABLE public.advanced_calculator_projects 
DROP COLUMN IF EXISTS comprehensive_boq_data;
```

However, this will lose any saved BOQ data.

## Performance Impact

- **Minimal**: Single flag check per render
- **100ms Delay**: Imperceptible to users
- **Database**: JSONB column is efficient for queries
- **Memory**: No significant increase

## Security Considerations

- **RLS Policies**: Existing policies apply to new column
- **User Isolation**: Data isolated per user
- **JSONB Validation**: PostgreSQL validates JSON structure
- **No XSS Risk**: Data not rendered directly as HTML

## Next Steps

After applying this fix:
1. Monitor console logs for any issues
2. Test with multiple projects
3. Verify auto-save works correctly
4. Check that data persists across sessions
5. Confirm no performance degradation

