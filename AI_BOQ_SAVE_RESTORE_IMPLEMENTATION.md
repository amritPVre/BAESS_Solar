# AI BOQ Save & Restore Implementation

## Problem Statement
When users reopened a saved project and visited the AI BOQ tab, the already generated BOQ data (both unpriced and priced line items) was getting reset to default/empty values. This forced users to rerun the LLM model and make unnecessary API calls, adding to costs.

## Root Cause
The `DetailedBOQGenerator` component was initializing its state with `initialBOQData` prop only on first mount using `useState`. When a project was loaded later and the `initialBOQData` prop changed, the component's state wasn't updating because `useState` only uses the initial value on the first render.

## Solution Implemented

### 1. Added BOQ Data Restoration Hook
**File:** `src/components/advanced-solar-calculator/DetailedBOQGenerator.tsx`

Added a `useEffect` hook that watches for changes in the `initialBOQData` prop and restores all BOQ-related states when a project is loaded:

```typescript
// Restore BOQ data from initialBOQData when project is loaded
useEffect(() => {
  if (initialBOQData) {
    console.log('🔄 Restoring AI BOQ data from saved project:', {
      generatedBOQCount: initialBOQData.generatedBOQ?.length || 0,
      mergedBOQCount: initialBOQData.mergedBOQ?.length || 0,
      pricedBOQCount: initialBOQData.pricedBOQ?.length || 0,
      hasGenerationTimestamp: !!initialBOQData.generationTimestamp,
      hasPricingTimestamp: !!initialBOQData.pricingTimestamp,
      selectedAIModel: initialBOQData.selectedAIModel
    });

    // Restore all BOQ states
    if (initialBOQData.generatedBOQ && initialBOQData.generatedBOQ.length > 0) {
      setGeneratedBOQ(initialBOQData.generatedBOQ);
    }
    if (initialBOQData.mergedBOQ && initialBOQData.mergedBOQ.length > 0) {
      setMergedBOQ(initialBOQData.mergedBOQ);
    }
    if (initialBOQData.pricedBOQ && initialBOQData.pricedBOQ.length > 0) {
      setPricedBOQ(initialBOQData.pricedBOQ);
    }
    if (initialBOQData.generationTimestamp) {
      setGenerationTimestamp(new Date(initialBOQData.generationTimestamp));
    }
    if (initialBOQData.pricingTimestamp) {
      setPricingTimestamp(new Date(initialBOQData.pricingTimestamp));
    }
    if (initialBOQData.selectedAIModel) {
      setSelectedAIModel(initialBOQData.selectedAIModel);
    }
    if (initialBOQData.additionalCosts && initialBOQData.additionalCosts.length > 0) {
      setAdditionalCosts(initialBOQData.additionalCosts);
    }

    console.log('✅ AI BOQ data restored successfully');
  }
}, [initialBOQData]);
```

### 2. Enhanced Auto-Save Functionality
**File:** `src/components/advanced-solar-calculator/index.tsx`

Added `comprehensiveBOQData` to the auto-save dependency array to ensure that when BOQ data changes, it triggers an auto-save after 30 seconds:

```typescript
useEffect(() => {
  // Only auto-save if user is logged in, has a project name, and something has changed
  if (!user || !projectName || !latitude) return;

  const autoSaveTimer = setTimeout(() => {
    handleAutoSave();
  }, 30000); // Auto-save every 30 seconds

  return () => clearTimeout(autoSaveTimer);
}, [
  projectName, latitude, longitude, city, country, selectedPanel, selectedInverter,
  polygonConfigs, results, acConfiguration, detailedLosses, boqDataForReport,
  comprehensiveBOQData, // ADDED THIS
  financialResultsForReport, user, handleAutoSave
]);
```

## Existing Infrastructure (Already Working)

The following infrastructure was already in place and working correctly:

1. **State Management:** `comprehensiveBOQData` state variable exists
2. **Update Handler:** `handleComprehensiveBOQDataUpdate` callback function
3. **Save Logic:** BOQ data is being saved in both manual save and auto-save
4. **Load Logic:** BOQ data is being loaded when project is reopened
5. **Props Passing:** `initialBOQData` is being passed to `DetailedBOQGenerator`
6. **Child-to-Parent Updates:** Existing `useEffect` sends BOQ updates to parent

## Data Flow

### When Generating BOQ:
1. User generates BOQ → States update in DetailedBOQGenerator
2. Existing useEffect detects state change → Calls `onComprehensiveBOQDataUpdate`
3. Parent component updates `comprehensiveBOQData` state
4. Auto-save triggers after 30 seconds → Saves to database

### When Loading Project:
1. Project loads from database → `comprehensiveBOQData` populated
2. `initialBOQData` prop passed to DetailedBOQGenerator with saved data
3. **NEW:** useEffect detects `initialBOQData` change → Restores all states
4. User sees previously generated BOQ without needing to regenerate

## Saved Data Structure

```typescript
{
  generatedBOQ: Array<ParsedBOQRow>, // AI-generated line items
  mergedBOQ: Array<ParsedBOQRow>,    // System + AI merged items
  pricedBOQ: Array<...>,              // Items with unit prices
  generationTimestamp: string | null, // When BOQ was generated
  pricingTimestamp: string | null,    // When pricing was applied
  selectedAIModel: 'openai' | 'gemini', // Which AI model was used
  additionalCosts: Array<{           // Project cost percentages
    id: number;
    name: string;
    percentage: number;
    enabled: boolean;
  }>
}
```

## Benefits

1. **Cost Savings:** Eliminates unnecessary API calls to LLM services
2. **Better UX:** Users can review their previously generated BOQ immediately
3. **Data Persistence:** All BOQ generation work is preserved across sessions
4. **Auto-Save Support:** BOQ changes trigger auto-save for better data safety

## Testing Instructions

### Test Case 1: Generate and Save BOQ
1. Open Advanced Solar Calculator
2. Complete system design (panels, inverters, areas, etc.)
3. Navigate to AI BOQ tab
4. Generate BOQ using AI
5. Generate pricing for BOQ items
6. Click "Save Project" or wait 30 seconds for auto-save
7. Note the generated item counts and timestamps

### Test Case 2: Load Project and Verify BOQ
1. Close the browser/app
2. Open the saved project
3. Navigate to AI BOQ tab
4. **Expected Result:** 
   - Generated BOQ items appear immediately
   - Priced BOQ items appear immediately
   - Timestamps match the saved values
   - No need to regenerate BOQ

### Test Case 3: Auto-Save Verification
1. Generate BOQ in a new/existing project
2. Wait 30 seconds without manually saving
3. Refresh the page or reload the project
4. Navigate to AI BOQ tab
5. **Expected Result:** BOQ data is preserved from auto-save

### Verification via Console Logs
Check browser console for these log messages:
- When loading: `🔄 Restoring AI BOQ data from saved project:`
- When loading: `✅ AI BOQ data restored successfully`
- When saving: `📊 Received comprehensive BOQ data update:`

## Files Modified

1. `src/components/advanced-solar-calculator/DetailedBOQGenerator.tsx`
   - Added useEffect hook for restoring BOQ data from initialBOQData prop

2. `src/components/advanced-solar-calculator/index.tsx`
   - Added comprehensiveBOQData to auto-save dependency array

## Potential Issues & Troubleshooting

### Issue: BOQ not restoring
**Check:**
- Browser console for restoration logs
- Database to ensure data is being saved correctly
- `initialBOQData` prop is not null when component renders

### Issue: Auto-save not triggering for BOQ
**Check:**
- comprehensiveBOQData is in the dependency array (line ~817)
- User is logged in and project has a name
- 30-second timer is completing

### Issue: Stale BOQ data appearing
**Check:**
- The useEffect dependency array includes [initialBOQData]
- No caching issues in browser

## Future Enhancements

1. Add loading indicator when restoring large BOQ datasets
2. Implement BOQ version history for tracking changes
3. Add conflict resolution if local BOQ differs from saved BOQ
4. Implement incremental saves for very large BOQ datasets
5. Add export/import functionality for BOQ data

