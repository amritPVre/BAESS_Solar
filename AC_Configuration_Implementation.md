# AC Side Configuration Implementation

## Overview
A comprehensive AC side configuration system has been implemented that mirrors PVsyst's AC ohmic losses allocation section. This allows users to configure the AC electrical infrastructure including transformers, cables, and circuit breakers for both LV and HV connections.

## Key Features

### 1. Voltage Level Selection
- **LV Connection**: 230V/380V/400V/415V/480V
- **HV Connection**: 11kV/12kV/20kV/33kV/66kV/110kV/132kV

### 2. LV Side Configuration
- **AC Combiner Panels**: Automatically calculated input breakers based on inverter output current
- **Outgoing Breakers**: Calculated as sum of all inverter output currents
- **Cable Selection**: Both input and output side AC cables
- **Circuit Breaker Selection**: Incomer and outgoing breakers with recommended ratings

### 3. HV Side Configuration
- **Inverter Duty Transformers (IDT)**: 
  - User configurable power rating (MVA)
  - Number of IDTs in the system
  - Primary voltage from inverters (typically 800V)
  - Secondary voltage (typically 33kV)
- **Power Transformer**: 
  - Optional 33kV/66kV step-up transformer
  - Configurable for total system power evacuation
  - User can enable/disable via checkbox
- **Transformer Losses**:
  - Copper losses (configurable)
  - Iron losses (configurable)

### 4. Cable Selection System
- **Automatic Derating**: Default conditions applied
  - Underground burial at 0.7m depth
  - Ground temperature: 40°C
  - Air temperature: 50°C
  - Cable spacing: 30cm apart
  - Thermal resistivity: 1.5
  - 4-core XLPE cables
- **Material Options**: Copper or Aluminum conductors
- **Cross Section Selection**: User selectable from available sizes
- **Current Ratings**: Displays both rated and derated current capacity

### 5. Circuit Breaker Selection
- **Automatic Sizing**: 1.25x safety factor applied
- **Breaker Types**: MCB, MCCB, ACB, VCB based on current and voltage requirements
- **Ratings Display**: Shows recommended ampere and voltage ratings

## Technical Implementation

### Database Schema
- `lv_cables` - Low voltage cable specifications
- `hv_cables` - High voltage cable specifications  
- `lv_derating_factors` - LV cable derating factors
- `hv_derating_factors` - HV cable derating factors
- `circuit_breaker_types` - MCB, MCCB, ACB, VCB types
- `circuit_breaker_ratings` - Detailed breaker specifications

### Services
- `cableSelectionService.ts` - Cable selection algorithms
- `circuitBreakerService.ts` - Breaker selection logic

### Components
- `ACSideConfiguration.tsx` - Main AC configuration interface
- Integrated into main calculator workflow between inverter selection and results

## Workflow Integration

1. **Component Selection** → Select panels and inverters
2. **Location Settings** → Define geographical parameters  
3. **PV Areas** → Configure array layout and perform energy calculation
4. **AC Configuration** → Configure electrical infrastructure
5. **Results** → View final system performance with AC losses

## Default Derating Conditions

All cables use standardized derating conditions:
- Installation: Underground buried at 0.7m depth
- Ambient temperature: 40°C ground, 50°C air
- Cable spacing: 30cm between cables
- Thermal resistivity: 1.5 K·m/W
- Cable type: 4-core XLPE insulated
- Conductor options: Copper or Aluminum

## Example Usage

### 50MW HV Plant Example:
- **Inverters**: 2.5MW Sungrow inverters (20 units)
- **IDTs**: 10MVA transformers (5 units)
  - Primary: 800V (from inverters)
  - Secondary: 33kV
- **Power Transformer**: 33kV/66kV, 50MVA
- **Point of Connection**: 66kV grid connection

### LV System Example:
- **Inverters**: 5kW inverters (10 units) 
- **AC Combiner**: Input breakers sized for individual inverter current
- **Main Breaker**: Sized for total system current
- **Cables**: Selected based on current capacity and voltage drop

## Benefits

1. **Comprehensive Design**: Complete AC electrical system design
2. **Automatic Calculations**: Intelligent component sizing
3. **Industry Standards**: Follows electrical engineering best practices
4. **Loss Analysis**: Accurate AC loss calculations for energy modeling
5. **Flexibility**: Supports both LV and HV applications
6. **Database Integration**: Leverages comprehensive component databases

This implementation provides a professional-grade AC electrical design tool that enhances the solar calculator's capability to produce complete system designs with proper electrical infrastructure. 