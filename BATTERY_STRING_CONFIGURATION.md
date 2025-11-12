# Battery String Configuration - BESS Designer

## Overview
The Battery String Configuration feature allows users to configure batteries in series and parallel arrangements to achieve the desired voltage and current for their BESS (Battery Energy Storage System).

## Location
The Battery String Configuration section is located in the **BESS Configuration** tab, right side column, positioned below the main "BESS Configuration" metrics card and above the "Required Inverter Capacity" section.

## Features

### 1. **Single Battery Unit Display**
Shows the voltage and ampere-hour (Ah) capacity of the selected battery module:
- **Voltage**: Extracted from battery name (e.g., "LFP 48V 100Ah" → 48V)
- **Capacity**: Extracted from battery name (e.g., "LFP 48V 100Ah" → 100Ah)

### 2. **String Configuration Inputs**

#### Batteries in Series
- **Purpose**: Increases total voltage
- **Formula**: Total Voltage = Single Battery Voltage × Batteries in Series
- **Minimum**: 1
- **Example**: 4 batteries of 48V in series = 192V

#### Batteries in Parallel
- **Purpose**: Increases total current/capacity
- **Formula**: Total Current = Single Battery Current × Batteries in Parallel
- **Minimum**: 1
- **Example**: 3 strings of 100Ah in parallel = 300A

### 3. **Battery Pack Specifications**
Real-time calculations displayed for the configured battery pack:

- **Total Voltage (V)**: `Single Battery Voltage × Batteries in Series`
- **Total Current (A)**: `Single Battery Capacity (Ah) × Batteries in Parallel`
- **Total Modules**: `Batteries in Series × Batteries in Parallel`
- **Pack Energy (kWh)**: `(Total Voltage × Total Current) / 1000`

### 4. **Configuration Summary**
A human-readable summary of the configuration:
- Example: "4 batteries in series × 3 parallel strings = 12 total modules"

## Data Structure

### State Management
```typescript
batterySelection: {
  technology: 'Lithium-Ion',
  selectedBatteryId: 'RES-NMC-51.2V-280Ah',
  couplingType: 'DC' | 'AC',
  selectedInverterId: string,
  inverterQuantity: number,
  batteriesInSeries: number,    // Default: 1
  batteriesInParallel: number   // Default: 1
}
```

## Electrical Principles

### Series Connection
- **Voltage**: Adds up (V_total = V₁ + V₂ + ... + Vₙ)
- **Current**: Remains the same (I_total = I₁ = I₂ = ... = Iₙ)
- **Use Case**: When higher voltage is needed for the system

### Parallel Connection
- **Voltage**: Remains the same (V_total = V₁ = V₂ = ... = Vₙ)
- **Current**: Adds up (I_total = I₁ + I₂ + ... + Iₙ)
- **Use Case**: When higher capacity/current is needed for the system

### Combined Series-Parallel
- **Voltage**: V_total = V_single × Batteries_in_series
- **Current**: I_total = I_single × Batteries_in_parallel
- **Total Modules**: Series × Parallel
- **Energy**: kWh = (V_total × I_total) / 1000

## Helper Functions

### `extractBatterySpecs()`
Extracts voltage and ampere-hour values from battery name string:
```typescript
extractBatterySpecs("LFP 48V 100Ah")
// Returns: { voltage: 48, ampereHour: 100 }
```

## Use Cases

### Example 1: Residential System (48V)
- **Single Battery**: 48V, 100Ah
- **Configuration**: 1 in series × 4 in parallel
- **Result**: 48V, 400A, 19.2 kWh

### Example 2: Commercial System (240V)
- **Single Battery**: 48V, 200Ah
- **Configuration**: 5 in series × 3 in parallel
- **Result**: 240V, 600A, 144 kWh

### Example 3: Utility Scale (1200V)
- **Single Battery**: 240V, 250Ah
- **Configuration**: 5 in series × 2 in parallel
- **Result**: 1200V, 500A, 600 kWh

## Integration with Cable Sizing

The battery pack voltage and current calculated here will be used in the **Cable Sizing** tab for:
1. **DC Cable Sizing**: Battery pack output to Battery/Hybrid Inverter
   - Cable ampacity must handle the total current
   - Voltage drop calculation uses the total voltage
   - Cable length from battery to inverter

2. **Short Circuit Protection**: Proper sizing of breakers and fuses based on total current

## UI Design
- **Theme**: Dark futuristic with blue gradient accents
- **Color Scheme**: 
  - Border: `border-blue-500/40`
  - Background: `bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900`
  - Text: Blue gradients (`from-blue-300 to-cyan-300`)
- **Icons**: Database icon from lucide-react
- **Interactive**: Real-time calculation updates on input change

## Future Enhancements
1. **Voltage Validation**: Check if total voltage is compatible with selected inverter
2. **Current Validation**: Check if total current is compatible with inverter DC input
3. **Battery Management System (BMS)**: Add BMS selection and compatibility check
4. **Temperature Derating**: Add temperature-based capacity adjustments
5. **State of Charge (SOC)**: Display SOC-based available energy
6. **Cycle Life**: Show expected cycle life based on configuration

## Related Files
- `src/pages/BESSDesigner.tsx`: Main implementation (lines 96-112, 3210-3338)
- `src/services/cableService.ts`: DC cable sizing service (to be used)
- `src/types/cables.ts`: Cable type definitions (to be used)

## Testing Checklist
- [ ] Verify voltage extraction from all battery types
- [ ] Test series calculation (1-20 batteries)
- [ ] Test parallel calculation (1-20 strings)
- [ ] Verify total module count calculation
- [ ] Check pack energy calculation accuracy
- [ ] Test with different battery voltages (12V, 48V, 240V, 800V, etc.)
- [ ] Validate state persistence across tab navigation
- [ ] Check UI responsiveness on different screen sizes
- [ ] Verify tooltip displays correctly

## Version History
- **v1.0** (2025-02-03): Initial implementation with series/parallel configuration

