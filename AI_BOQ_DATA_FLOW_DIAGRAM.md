# AI BOQ Data Flow Architecture

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                 │
└────────┬────────────────────────────────────────────────┬───────────┘
         │                                                 │
         │ Generate BOQ                                    │ Load Project
         │                                                 │
         ▼                                                 ▼
┌────────────────────────────────────────┐    ┌──────────────────────────┐
│   DetailedBOQGenerator Component       │    │   Project Load Service   │
│                                        │    │                          │
│  ┌──────────────────────────────┐    │    │  Fetches from Database:  │
│  │ Generate BOQ via AI          │    │    │  - comprehensive_boq_data│
│  │ Apply Pricing                │    │    └────────────┬─────────────┘
│  │                               │    │                 │
│  │ States Updated:               │    │                 │
│  │ - generatedBOQ []             │    │                 │
│  │ - mergedBOQ []                │    │                 │
│  │ - pricedBOQ []                │    │                 │
│  │ - timestamps                  │    │                 │
│  │ - selectedAIModel             │    │                 │
│  │ - additionalCosts             │    │                 │
│  └──────────┬───────────────────┘    │                 │
│             │                         │                 │
│             ▼                         │                 │
│  ┌──────────────────────────────┐    │                 │
│  │ useEffect (line 580)         │    │                 │
│  │ Watches: generatedBOQ,       │    │                 │
│  │          mergedBOQ,           │    │                 │
│  │          pricedBOQ, etc.      │    │                 │
│  │                               │    │                 │
│  │ Calls:                        │    │                 │
│  │ onComprehensiveBOQDataUpdate()│───┼─────────┐       │
│  └───────────────────────────────┘    │         │       │
└────────────────────────────────────────┘         │       │
                                                   │       │
         ┌─────────────────────────────────────────┘       │
         │                                                 │
         ▼                                                 │
┌────────────────────────────────────────┐                │
│   AdvancedSolarCalculator (Parent)     │                │
│                                        │                │
│  State: comprehensiveBOQData           │                │
│                                        │                │
│  handleComprehensiveBOQDataUpdate()    │                │
│  → Updates comprehensiveBOQData        │                │
│                                        │                │
│  Triggers Auto-Save (30s timer)        │                │
│  dependency: comprehensiveBOQData      │◀───────────────┘
│                                        │    initialBOQData prop
└───────┬────────────────────────────────┘
        │
        │ Save Project / Auto-Save
        │
        ▼
┌────────────────────────────────────────┐
│   Database (Supabase)                  │
│                                        │
│  advanced_calculator_projects table:   │
│  - comprehensive_boq_data (JSONB)      │
│    {                                   │
│      generatedBOQ: [...],              │
│      mergedBOQ: [...],                 │
│      pricedBOQ: [...],                 │
│      generationTimestamp: "...",       │
│      pricingTimestamp: "...",          │
│      selectedAIModel: "openai",        │
│      additionalCosts: [...]            │
│    }                                   │
└────────────────────────────────────────┘
```

## Restoration Flow (NEW Implementation)

```
┌────────────────────────────────────────┐
│   User Opens Saved Project             │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│   AdvancedSolarCalculator              │
│                                        │
│  loadProjectFromURL()                  │
│  - Loads from database                 │
│  - Sets comprehensiveBOQData state     │
│  - Passes as initialBOQData prop       │
└────────┬───────────────────────────────┘
         │
         │ initialBOQData prop
         │
         ▼
┌────────────────────────────────────────┐
│   DetailedBOQGenerator Component       │
│                                        │
│  ┌──────────────────────────────┐    │
│  │ NEW useEffect (line 421)     │    │
│  │ Watches: [initialBOQData]    │    │
│  │                               │    │
│  │ When initialBOQData changes:  │    │
│  │ ✓ setGeneratedBOQ()           │    │
│  │ ✓ setMergedBOQ()              │    │
│  │ ✓ setPricedBOQ()              │    │
│  │ ✓ setGenerationTimestamp()    │    │
│  │ ✓ setPricingTimestamp()       │    │
│  │ ✓ setSelectedAIModel()        │    │
│  │ ✓ setAdditionalCosts()        │    │
│  │                               │    │
│  │ Result: All BOQ data restored!│    │
│  └───────────────────────────────┘    │
│                                        │
│  User sees previously generated BOQ    │
│  No need to regenerate! 🎉             │
└────────────────────────────────────────┘
```

## Component State Lifecycle

### Before Fix:
```
1. Component Mounts
   └─> useState(initialBOQData?.generatedBOQ || [])
       └─> initialBOQData is null
           └─> State initialized as []

2. Project Loads (later)
   └─> initialBOQData prop updates with saved data
       └─> ❌ State doesn't update (useState only runs once)
           └─> User sees empty BOQ ❌
```

### After Fix:
```
1. Component Mounts
   └─> useState(initialBOQData?.generatedBOQ || [])
       └─> initialBOQData is null
           └─> State initialized as []

2. Project Loads (later)
   └─> initialBOQData prop updates with saved data
       └─> useEffect detects change
           └─> ✅ All states restored with saved data
               └─> User sees previously generated BOQ ✅
```

## Auto-Save Trigger Chain

```
User Action (Generate BOQ)
    ↓
State Changes (generatedBOQ, pricedBOQ, etc.)
    ↓
useEffect in DetailedBOQGenerator (line 580)
    ↓
onComprehensiveBOQDataUpdate() called
    ↓
Parent state updated (comprehensiveBOQData)
    ↓
useEffect in AdvancedSolarCalculator (line 805)
    ↓
Auto-save timer started (30 seconds)
    ↓
handleAutoSave() called
    ↓
Data saved to database
    ↓
Toast: "Auto-saved successfully" ✅
```

## Key Implementation Details

### 1. useState vs useEffect Pattern
```typescript
// INITIAL STATE - Only runs once on mount
const [generatedBOQ, setGeneratedBOQ] = useState(
  initialBOQData?.generatedBOQ || []
);

// RESTORATION EFFECT - Runs when prop changes
useEffect(() => {
  if (initialBOQData?.generatedBOQ) {
    setGeneratedBOQ(initialBOQData.generatedBOQ);
  }
}, [initialBOQData]);
```

### 2. Prop-to-State Synchronization
```typescript
// Parent passes saved data as prop
<DetailedBOQGenerator
  initialBOQData={comprehensiveBOQData}  // From database
  onComprehensiveBOQDataUpdate={handleUpdate}  // For updates
/>

// Child component watches prop and syncs state
useEffect(() => {
  // When initialBOQData prop changes, update all states
  if (initialBOQData) {
    setGeneratedBOQ(initialBOQData.generatedBOQ);
    // ... restore all other states
  }
}, [initialBOQData]);
```

### 3. Bidirectional Data Binding
```typescript
// Child → Parent (when user generates BOQ)
useEffect(() => {
  if (generatedBOQ.length > 0) {
    onComprehensiveBOQDataUpdate({
      generatedBOQ,
      mergedBOQ,
      pricedBOQ,
      // ... all BOQ data
    });
  }
}, [generatedBOQ, mergedBOQ, pricedBOQ, ...]);

// Parent → Child (when project loads)
useEffect(() => {
  if (initialBOQData) {
    setGeneratedBOQ(initialBOQData.generatedBOQ);
    // ... restore all states
  }
}, [initialBOQData]);
```

## Performance Considerations

### Auto-Save Debouncing
- Timer: 30 seconds
- Prevents excessive database writes
- Only triggers if data actually changed
- Cancels previous timer on new changes

### State Update Batching
- All BOQ states updated in single useEffect
- React batches updates automatically
- Single re-render instead of multiple

### Conditional Restoration
```typescript
// Only restore if data exists
if (initialBOQData.generatedBOQ && initialBOQData.generatedBOQ.length > 0) {
  setGeneratedBOQ(initialBOQData.generatedBOQ);
}
```

## Error Handling & Edge Cases

### 1. Empty BOQ Data
```typescript
// Handles case where BOQ arrays are empty
initialBOQData?.generatedBOQ || []
```

### 2. Invalid Timestamps
```typescript
// Safely parses timestamp strings
initialBOQData?.generationTimestamp 
  ? new Date(initialBOQData.generationTimestamp) 
  : null
```

### 3. Missing Additional Costs
```typescript
// Falls back to defaults if not saved
initialBOQData?.additionalCosts || [
  { id: 1, name: 'Design Engineering Cost', percentage: 1, enabled: true },
  // ... default costs
]
```

### 4. Null Safety
```typescript
// Always checks if initialBOQData exists
if (initialBOQData) {
  // Only then access nested properties
}
```

