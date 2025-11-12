# BOQ Input Parameters Mapping - Complete Reference

## Overview
This document provides a comprehensive mapping of all input parameters passed to the AI prompt for BOQ generation, organized by system type with both human-readable names and coding terminologies.

---

## 🔋 **COMMON PARAMETERS** (All System Types)

### **1. DC Side Inputs**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Structure Type | `dcInputs.structureType` | "ballasted" | PV Areas tab |
| Module Width | `dcInputs.moduleWidthMm` | 1134mm | PV Select tab |
| Module Length | `dcInputs.moduleLengthMm` | 2382mm | PV Select tab |
| Total Number of Tables | `dcInputs.totalNumberOfTables` | 13 | PV Areas tab |
| Module Layout per Table | `dcInputs.moduleLayoutPerTable` | "1L×15" | PV Areas tab |
| Total Rows (Ballasted Only) | `dcInputs.totalNumberOfRows` | 13 | Calculated |
| String Short-circuit Current | `dcInputs.stringShortCircuitCurrentA` | 14.29A | PV Select tab |
| Total Strings per Inverter | `dcInputs.totalNumberOfStringsPerInverter` | 20 | DC Config tab |
| Edge #1 Length | `dcInputs.edge1LengthM` | 45.88m | PV drawing area |
| Edge #2 Length | `dcInputs.edge2LengthM` | 30.59m | PV drawing area |
| Edge #3 Length | `dcInputs.edge3LengthM` | 45.88m | PV drawing area |
| Edge #4 Length | `dcInputs.edge4LengthM` | 30.59m | PV drawing area |

### **2. Lightning Protection Inputs**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Total Plant Area | `lightningProtection.totalPlantAreaM2` | 1403.46m² | PV Areas tab |
| Soil Type | `lightningProtection.soilType` | "loam" | Location tab |

### **3. AC Side - Common Inputs**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| System Type | `acCommon.systemType` | "LV_Connection" | AC Config tab |
| Number of Inverters | `acCommon.numberOfInverters` | 1 | DC Config tab |

### **4. Substation Inputs**
| English Name | Code Variable | Example Value | Notes |
|--------------|---------------|---------------|--------|
| Substation Grid Size | `substation.substationElectricalRoomGridSizeM2` | 900m² (LV) / 1600m² (HV) | 30×30m for LV, 40×40m for HV |
| Target Earthing Resistance | `substation.targetEarthingResistanceOhms` | 5Ω (LV) / 1Ω (HV) | Default based on system |

### **5. Fixed Preferences**
| English Name | Code Variable | Default Value | Notes |
|--------------|---------------|---------------|--------|
| String Side Protective Device | `fixedPreferences.stringSideProtectiveDevice` | "String fuse" | Always fixed |
| Preferred Material | `fixedPreferences.preferredMaterial` | "Tinned copper" | Always fixed |
| Earthing Cable Insulation | `fixedPreferences.preferredInsulationOfEarthingCables` | "PVC" | Always fixed |
| Rail Bonding Mode | `fixedPreferences.railBondingMode` | "Bonding clamps" | Always fixed |
| Structure Drop Rule | `fixedPreferences.structureDropRule` | "one drop per N tables" | Always fixed |

---

## ⚡ **LV CONNECTION SPECIFIC PARAMETERS**

### **AC Side - LV Connection Type**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Inverter Output Voltage | `lvConnection.inverterOutputVoltageV` | 400V | DC Config tab |
| Inverter Output Current (per unit) | `lvConnection.inverterOutputCurrentA` | 144.34A | Calculated |
| Inverters per LV Combiner | `lvConnection.numberOfInvertersConnectedToLVCombiner` | 1 | AC Config tab |
| LV Combiner Output Current | `lvConnection.lvCombinerPanelOutputCurrentA` | 144.34A | Calculated (inverters × current) |

### **Cable Parameters - Inverter to Combiner**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (Inv→Combiner) | `lvConnection.distanceInverterToCombinerM` | 10m | Design Summary |
| Cable Length per Circuit | `lvConnection.totalCableLengthPerInverterToCombinerM` | 10m | Distance × Runs |
| Complete Cable Length | `lvConnection.completeCableLengthInverterToCombinerM` | 10m | Per circuit × Inverters |
| Cable Cross-section | `lvConnection.acCableCrossSectionInverterToCombinerMm2` | "1R*70" | AC Config tab |

### **Cable Parameters - Combiner to PoC**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (Combiner→PoC) | `lvConnection.distanceCombinerToPoCM` | 10m | Design Summary |
| Cable Length per Circuit | `lvConnection.totalCableLengthPerCombinerToPoCM` | 20m | Distance × Runs |
| Complete Cable Length | `lvConnection.completeCableLengthCombinerToPoCM` | 20m | Per circuit × Combiners |
| Cable Cross-section | `lvConnection.acCableCrossSectionCombinerToPoCMm2` | "2R*95" | AC Config tab |

### **Circuit Breaker Parameters**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Combiner Incomer Breaker | `lvConnection.combinerIncomeBreakerRatingA` | 200A | AC Config tab |
| Combiner Outgoing Breaker | `lvConnection.combinerOutgoingBreakerRatingA` | 250A | AC Config tab |

---

## 🔌 **HV STRING INVERTER SPECIFIC PARAMETERS**

### **AC Side - HV Connection + String Inverter**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Number of String Inverters | `hvStringInverter.numberOfStringInverters` | 5 | DC Config tab |
| Inverter Output Voltage | `hvStringInverter.inverterOutputVoltageV` | 400V | DC Config tab |
| Inverter Output Current | `hvStringInverter.inverterOutputCurrentA` | 144.34A | Calculated |
| Inverters per LV Combiner | `hvStringInverter.invertersPerLVCombinerPanel` | 4 | AC Config tab |
| Total LV Combiner Panels | `hvStringInverter.totalLVCombinerPanels` | 2 | AC Config tab |

### **IDT (Inverter Duty Transformer) Details**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Quantity of IDTs | `hvStringInverter.quantityOfIDTs` | 1 | AC Config tab |
| Single IDT Rating | `hvStringInverter.singleIDTRatingMVA` | 2.5MVA | AC Config tab |
| IDT Impedance | `hvStringInverter.idtTransformerImpedancePercentage` | 6% | Default |
| IDT Input Voltage | `hvStringInverter.idtInputVoltageV` | 400V | AC Config tab |
| IDT Input Current | `hvStringInverter.idtInputCurrentA` | 3608A | AC Config tab |
| IDT Output Voltage | `hvStringInverter.idtOutputVoltageV` | 11000V | AC Config tab |
| IDT Output Current | `hvStringInverter.idtOutputCurrentA` | 131A | AC Config tab |

### **PT (Power Transformer) Details**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Quantity of PTs | `hvStringInverter.quantityOfPTs` | 1 | AC Config tab |
| Single PT Rating | `hvStringInverter.singlePTRatingMVA` | 2.5MVA | AC Config tab |
| PT Impedance | `hvStringInverter.ptTransformerImpedancePercentage` | 6% | Default |
| PT Input Voltage | `hvStringInverter.ptInputVoltageV` | 11000V | AC Config tab |
| PT Input Current | `hvStringInverter.ptInputCurrentA` | 131A | AC Config tab |
| PT Output Voltage | `hvStringInverter.ptOutputVoltageV` | 33000V | AC Config tab |
| PT Output Current | `hvStringInverter.ptOutputCurrentA` | 44A | AC Config tab |

### **Cable Parameters - String Inverter to Combiner**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (Inv→Combiner) | `hvStringInverter.distanceInverterToCombinerM` | 10m | Design Summary |
| Cable Length per Circuit | `hvStringInverter.totalCableLengthPerInverterToCombinerM` | 10m | Distance × Runs |
| Complete Cable Length | `hvStringInverter.completeCableLengthInverterToCombinerM` | 50m | Per circuit × Inverters |
| Cable Cross-section | `hvStringInverter.acCableCrossSectionInverterToCombinerMm2` | "1R*70" | AC Config tab |

### **Cable Parameters - Combiner to IDT**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (Combiner→IDT) | `hvStringInverter.distanceCombinerToIDTM` | 200m | Design Summary |
| Cable Length per Circuit | `hvStringInverter.totalCableLengthPerCombinerToIDTM` | 800m | Distance × Runs |
| Complete Cable Length | `hvStringInverter.completeCableLengthCombinerToIDTM` | 800m | Per circuit × Combiners |
| Cable Size | `hvStringInverter.cableSizeCombinerToIDTMm2` | "4R*120" | AC Config tab |

### **Cable Parameters - IDT to PT**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (IDT→PT) | `hvStringInverter.distanceIDTToPTM` | 100m | Design Summary |
| Cable Length per Circuit | `hvStringInverter.totalCableLengthPerIDTToPTM` | 100m | Distance × Runs |
| Complete Cable Length | `hvStringInverter.completeCableLengthIDTToPTM` | 100m | Per circuit × IDTs |
| Cable Size | `hvStringInverter.cableSizeIDTToPTMm2` | "1R*185" | AC Config tab |

### **Cable Parameters - PT to PoC**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (PT→PoC) | `hvStringInverter.distancePTToPoCM` | 100m | Design Summary |
| Cable Length per Circuit | `hvStringInverter.totalCableLengthPerPTToPoCM` | 100m | Distance × Runs |
| Complete Cable Length | `hvStringInverter.completeCableLengthPTToPoCM` | 100m | Per circuit × PTs |
| Cable Size | `hvStringInverter.cableSizePTToPoCMm2` | "1R*240" | AC Config tab |

### **Circuit Breaker Parameters**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Combiner Incomer Breaker | `hvStringInverter.combinerIncomeBreakerRatingA` | 200A | AC Config tab |
| Combiner Outgoing Breaker | `hvStringInverter.combinerOutgoingBreakerRatingA` | 400A | AC Config tab |
| CB Type (Inv→IDT) | `hvStringInverter.cbTypeInverterToIDT` | "ACB" | AC Config tab |
| CB Rating (Inv→IDT) | `hvStringInverter.cbRatingInverterToIDTA` | 4000A | AC Config tab |
| CB Type (IDT→PT) | `hvStringInverter.cbTypeIDTToPT` | "VCB" | AC Config tab |
| CB Rating (IDT→PT) | `hvStringInverter.cbRatingIDTToPTA` | 400A | AC Config tab |
| CB Type (PT→PoC) | `hvStringInverter.cbTypePTToPoC` | "VCB" | AC Config tab |
| CB Rating (PT→PoC) | `hvStringInverter.cbRatingPTToPoCA` | 200A | AC Config tab |

### **Transformer Earthing (HV Only)**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Number of IDTs | `transformerEarthing.numberOfIDTs` | 1 | AC Config tab |
| Number of PTs | `transformerEarthing.numberOfPTs` | 1 | Always 1 |
| Earthing Configuration | `transformerEarthing.transformerEarthing` | "2 earth pits for neutral + 2 for body" | Default |

---

## 🏭 **HV CENTRAL INVERTER SPECIFIC PARAMETERS**

### **AC Side - HV Connection + Central Inverter**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Number of Central Inverters | `hvCentralInverter.numberOfCentralInverters` | 2 | DC Config tab |

### **IDT (Inverter Duty Transformer) Details**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Quantity of IDTs | `hvCentralInverter.quantityOfIDTs` | 2 | AC Config tab |
| Single IDT Rating | `hvCentralInverter.singleIDTRatingMVA` | 2.5MVA | AC Config tab |
| IDT Impedance | `hvCentralInverter.idtTransformerImpedancePercentage` | 6% | Default |
| IDT Input Voltage | `hvCentralInverter.idtInputVoltageV` | 800V | AC Config tab |
| IDT Input Current | `hvCentralInverter.idtInputCurrentA` | 1804A | AC Config tab |
| IDT Output Voltage | `hvCentralInverter.idtOutputVoltageV` | 11000V | AC Config tab |
| IDT Output Current | `hvCentralInverter.idtOutputCurrentA` | 131A | AC Config tab |

### **PT (Power Transformer) Details**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Quantity of PTs | `hvCentralInverter.quantityOfPTs` | 1 | AC Config tab |
| Single PT Rating | `hvCentralInverter.singlePTRatingMVA` | 5.0MVA | AC Config tab |
| PT Impedance | `hvCentralInverter.ptTransformerImpedancePercentage` | 6% | Default |
| PT Input Voltage | `hvCentralInverter.ptInputVoltageV` | 11000V | AC Config tab |
| PT Input Current | `hvCentralInverter.ptInputCurrentA` | 262A | AC Config tab |
| PT Output Voltage | `hvCentralInverter.ptOutputVoltageV` | 33000V | AC Config tab |
| PT Output Current | `hvCentralInverter.ptOutputCurrentA` | 87A | AC Config tab |

### **Cable Parameters - Central Inverter to IDT**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (Central→IDT) | `hvCentralInverter.distanceInverterToIDTM` | 10m | Design Summary |
| Cable Length per Circuit | `hvCentralInverter.totalCableLengthPerInverterToIDTM` | 10m | Distance × Runs |
| Complete Cable Length | `hvCentralInverter.completeCableLengthInverterToIDTM` | 20m | Per circuit × Inverters |
| Cable Size | `hvCentralInverter.cableSizeInverterToIDTMm2` | "1R*185" | AC Config tab |

### **Cable Parameters - IDT to PT**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (IDT→PT) | `hvCentralInverter.distanceIDTToPTM` | 100m | Design Summary |
| Cable Length per Circuit | `hvCentralInverter.totalCableLengthPerIDTToPTM` | 100m | Distance × Runs |
| Complete Cable Length | `hvCentralInverter.completeLengthIDTToPTM` | 200m | Per circuit × IDTs |
| Cable Size | `hvCentralInverter.cableSizeIDTToPTMm2` | "1R*185" | AC Config tab |

### **Cable Parameters - PT to PoC**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Distance (PT→PoC) | `hvCentralInverter.distancePTToPoCM` | 100m | Design Summary |
| Cable Length per Circuit | `hvCentralInverter.totalCableLengthPerPTToPoCM` | 100m | Distance × Runs |
| Complete Cable Length | `hvCentralInverter.completeCableLengthPTToPoCM` | 100m | Per circuit × PTs |
| Cable Size | `hvCentralInverter.cableSizePTToPoCMm2` | "1R*240" | AC Config tab |

### **Circuit Breaker Parameters**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| CB Type (Central→IDT) | `hvCentralInverter.cbTypeCentralInverterToIDT` | "ACB" | AC Config tab |
| CB Rating (Central→IDT) | `hvCentralInverter.cbRatingCentralInverterToIDTA` | 2000A | AC Config tab |
| CB Type (IDT→PT) | `hvCentralInverter.cbTypeIDTToPT` | "VCB" | AC Config tab |
| CB Rating (IDT→PT) | `hvCentralInverter.cbRatingIDTToPTA` | 400A | AC Config tab |
| CB Type (PT→PoC) | `hvCentralInverter.cbTypePTToPoC` | "VCB" | AC Config tab |
| CB Rating (PT→PoC) | `hvCentralInverter.cbRatingPTToPoCA` | 200A | AC Config tab |

### **Transformer Earthing (HV Only)**
| English Name | Code Variable | Example Value | Source |
|--------------|---------------|---------------|---------|
| Number of IDTs | `transformerEarthing.numberOfIDTs` | 2 | AC Config tab |
| Number of PTs | `transformerEarthing.numberOfPTs` | 1 | Always 1 |
| Earthing Configuration | `transformerEarthing.transformerEarthing` | "2 earth pits for neutral + 2 for body" | Default |

---

## 📝 **CABLE FORMAT NOTATION**

### **Format**: `"[runs]R*[cross_section]"`
- **1R*70** = 1 Run × 70mm² cable
- **2R*95** = 2 Runs × 95mm² cable
- **4R*120** = 4 Runs × 120mm² cable

### **Distance Calculations**:
- **Distance**: Base distance (e.g., 10m)
- **Cable Length per Circuit**: Distance × Runs (e.g., 2R × 10m = 20m)
- **Complete Cable Length**: Per circuit × Number of units (e.g., 4 inverters × 20m = 80m)

---

## 🎯 **HOW TO USE THIS MAPPING**

1. **For Prompt Engineering**: Use the English names in your AI prompt rules
2. **For Code Debugging**: Use the Code Variables to trace parameter flow
3. **For Industry Standards**: Compare Example Values against your requirements
4. **For Validation**: Cross-check Sources to ensure data integrity

---

**Note**: All parameters with actual calculated values from your system are now flowing correctly to the AI prompt. Use this mapping to fine-tune your industry-specific BOQ generation rules!
