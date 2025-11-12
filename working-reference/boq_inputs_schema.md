# Solar PV BOQ Inputs Schema

This file defines the JSON schema / structure for inputs that the BOQParameterManager
should provide to the LLM prompt. Your IDE agent can import this schema directly.

## JSON Schema

```json
{
  "dcInputs": {
    "structureType": "ballasted | elevated_roof | ground_mount | shed | carport",
    "moduleWidthMm": 0,
    "moduleLengthMm": 0,
    "totalNumberOfTables": 0,
    "moduleLayoutPerTable": "e.g., 2P×5",
    "totalNumberOfRows": 0,
    "stringShortCircuitCurrentA": 0,
    "totalNumberOfStringsPerInverter": 0,
    "edge1LengthM": 0,
    "edge2LengthM": 0,
    "edge3LengthM": 0,
    "edge4LengthM": 0
  },
  "lightningProtection": {
    "totalPlantAreaM2": 0,
    "soilType": "saturated_clay | clay | loam | moist_sand | dry_sand | rock"
  },
  "acCommon": {
    "systemType": "LV_Connection | HV_Connection",
    "numberOfInverters": 0
  },
  "lvConnection": {
    "inverterOutputVoltageV": 0,
    "inverterOutputCurrentA": 0,
    "numberOfInvertersConnectedToLVCombiner": 0,
    "lvCombinerPanelOutputCurrentA": 0,
    "distanceInverterToCombinerM": 0,
    "acCableCrossSectionInverterToCombinerMm2": "e.g., 2R*16",
    "distanceCombinerToPoCM": 0,
    "acCableCrossSectionCombinerToPoCMm2": "e.g., 1R*50",
    "combinerIncomeBreakerRatingA": 0,
    "combinerOutgoingBreakerRatingA": 0
  },
  "hvStringInverter": {
    "numberOfStringInverters": 0,
    "inverterOutputVoltageV": 0,
    "inverterOutputCurrentA": 0,
    "quantityOfIDTs": 0,
    "singleIDTRatingMVA": 0,
    "idtInputVoltageV": 0,
    "idtInputCurrentA": 0,
    "idtOutputVoltageV": 0,
    "idtOutputCurrentA": 0,
    "quantityOfPTs": 0,
    "singlePTRatingMVA": 0,
    "ptInputVoltageV": 0,
    "ptInputCurrentA": 0,
    "ptOutputVoltageV": 0,
    "ptOutputCurrentA": 0,
    "distanceInverterToCombinerM": 0,
    "distanceCombinerToIDTM": 0,
    "distanceIDTToPTM": 0,
    "distancePTToPoCM": 0,
    "cableSizeCombinerToIDTMm2": "e.g., 1R*95",
    "cableSizeIDTToPTMm2": "e.g., 1R*185",
    "cableSizePTToPoCMm2": "e.g., 1R*240",
    "cbRatingIDTToPTA": 0,
    "cbTypeIDTToPT": "VCB",
    "cbRatingPTToPoCA": 0,
    "cbTypePTToPoC": "VCB"
  },
  "hvCentralInverter": {
    "numberOfCentralInverters": 0,
    "quantityOfIDTs": 0,
    "singleIDTRatingMVA": 0,
    "idtInputVoltageV": 0,
    "idtInputCurrentA": 0,
    "idtOutputVoltageV": 0,
    "idtOutputCurrentA": 0,
    "quantityOfPTs": 0,
    "singlePTRatingMVA": 0,
    "ptInputVoltageV": 0,
    "ptInputCurrentA": 0,
    "ptOutputVoltageV": 0,
    "ptOutputCurrentA": 0,
    "distanceInverterToIDTM": 0,
    "distanceIDTToPTM": 0,
    "distancePTToPoCM": 0,
    "cableSizeInverterToIDTMm2": "e.g., 1R*185",
    "cableSizeIDTToPTMm2": "e.g., 1R*185",
    "cableSizePTToPoCMm2": "e.g., 1R*240",
    "cbRatingCentralInverterToIDTA": 0,
    "cbTypeCentralInverterToIDT": "VCB",
    "cbRatingIDTToPTA": 0,
    "cbTypeIDTToPT": "VCB",
    "cbRatingPTToPoCA": 0,
    "cbTypePTToPoC": "VCB"
  },
  "substation": {
    "substationElectricalRoomGridSizeM2": 900,
    "targetEarthingResistanceOhms": 5
  },
  "fixedPreferences": {
    "stringSideProtectiveDevice": "String fuse",
    "preferredMaterial": "Tinned copper",
    "preferredInsulationOfEarthingCables": "PVC",
    "railBondingMode": "Bonding clamps",
    "structureDropRule": "one drop per N tables"
  },
  "transformerEarthing": {
    "numberOfIDTs": 0,
    "numberOfPTs": 0,
    "transformerEarthing": "Neutral and body earthing with 4 pits (2 neutral, 2 body)"
  }
}
```

---

## Notes
- All numeric values default to 0 if not provided by extraction.
- Strings use enumerations or examples where applicable.
- This schema can be serialized into `boqInputs.json` for re-use inside the BOQ prompt.
