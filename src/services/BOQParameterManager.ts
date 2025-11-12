// BOQ Parameter Manager Service
// Manages session storage and extraction of parameters for AI LLM BOQ calculations

import { 
  BOQParameters, 
  DCInputs, 
  LightningProtectionInputs,
  ACCommonInputs,
  LVConnectionInputs,
  HVStringInverterInputs,
  HVCentralInverterInputs,
  SubstationInputs,
  DEFAULT_FIXED_PREFERENCES,
  getDefaultSubstationInputs,
  DEFAULT_TRANSFORMER_EARTHING
} from '../types/boq-parameters';

export class BOQParameterManager {
  private static instance: BOQParameterManager;
  private parameters: Partial<BOQParameters> = {};
  private sessionId: string;

  private constructor() {
    this.sessionId = `boq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public static getInstance(): BOQParameterManager {
    if (!BOQParameterManager.instance) {
      BOQParameterManager.instance = new BOQParameterManager();
    }
    return BOQParameterManager.instance;
  }

  // Extract DC inputs from PV areas and PV select tabs
  public extractDCInputs(options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    polygonConfigs?: Record<string, any>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedPanel?: Record<string, any>;
    structureType?: string;
    totalStringCount?: number;
    averageStringCurrent?: number;
  }): DCInputs {
    const { polygonConfigs, selectedPanel, structureType, totalStringCount, averageStringCurrent } = options;
    
    // Debug logging
    console.log('🔍 BOQ Debug - extractDCInputs called with:', {
      polygonConfigsLength: polygonConfigs?.length,
      selectedPanelKeys: selectedPanel ? Object.keys(selectedPanel) : 'null',
      structureType,
      totalStringCount
    });
    
    if (polygonConfigs?.[0]) {
      console.log('🔍 BOQ Debug - First polygon config:', polygonConfigs[0]);
      console.log('🔍 BOQ Debug - Table layout properties:', {
        tableLayoutRows: polygonConfigs[0]?.tableLayoutRows,
        rows: polygonConfigs[0]?.rows,
        tableRows: polygonConfigs[0]?.tableRows,
        structureType: polygonConfigs[0]?.structureType
      });
    }
    
    if (selectedPanel) {
      console.log('🔍 BOQ Debug - Selected panel properties:', selectedPanel);
    }
    
    // Calculate total tables from polygon configs
    const totalTables = polygonConfigs?.reduce((sum, config) => sum + (config.tableCount || 0), 0) || 0;
    const totalModules = polygonConfigs?.reduce((sum, config) => sum + (config.moduleCount || 0), 0) || 0;
    
    console.log('🔍 BOQ Debug - Totals calculated:', { 
      totalTables, 
      totalModules, 
      modulesPerTable: totalTables > 0 ? Math.round(totalModules / totalTables) : 0 
    });
    
    // Calculate total rows for different structure types
    let totalRows = 0;
    const firstConfig = polygonConfigs?.[0];
    
    if (firstConfig?.structureType === 'ballasted') {
      // For ballasted: total rows = total tables (each table is 1 row)
      totalRows = totalTables;
      console.log('🔍 BOQ Debug - Ballasted rows calculation: totalTables =', totalTables);
    } else if (firstConfig?.structureType === 'fixed_tilt' || firstConfig?.structureType === 'ground_mount_tables') {
      // For elevated and ground mount: try to get from tableLayoutRows property
      totalRows = polygonConfigs?.reduce((sum, config) => {
        const rows = config.tableLayoutRows || config.rows || config.tableRows || 0;
        return sum + rows;
      }, 0) || 0;
      console.log('🔍 BOQ Debug - Elevated/Ground-mount rows calculation: tableLayoutRows =', totalRows);
      
      // If tableLayoutRows is not available, estimate from total tables
      if (totalRows === 0 && totalTables > 0) {
        // Estimate rows based on typical layouts
        if (firstConfig?.structureType === 'ground_mount_tables') {
          // Ground mount: typically 3-4 tables per row
          totalRows = Math.ceil(totalTables / 3.5);
        } else if (firstConfig?.structureType === 'fixed_tilt') {
          // Elevated: typically 2-4 tables per row  
          totalRows = Math.ceil(totalTables / 3);
        }
        console.log('🔍 BOQ Debug - Estimated rows from total tables:', { totalTables, estimatedRows: totalRows });
      }
    } else {
      // For other structures: try to get from any available properties
      totalRows = polygonConfigs?.reduce((sum, config) => {
        const rows = config.tableLayoutRows || config.rows || config.tableRows || 0;
        return sum + rows;
      }, 0) || 0;
    }

    // Determine module layout per table
    let moduleLayout = "Unknown";
    
    if (firstConfig && totalTables > 0) {
      const modulesPerTable = Math.round(totalModules / totalTables);
      const orientation = firstConfig.orientation === 'portrait' ? 'P' : 'L';
      
      if (firstConfig.structureType === 'ballasted') {
        // Ballasted: Always 1 row per table
        moduleLayout = `1${orientation}×${modulesPerTable}`;
      } else if (firstConfig.tableConfig) {
        // Other structures: Use actual table configuration
        const rows = firstConfig.tableConfig.rowsPerTable || firstConfig.tableConfig.rows || 1;
        const modules = firstConfig.tableConfig.modulesPerRow || firstConfig.tableConfig.modules || modulesPerTable;
        moduleLayout = `${rows}${orientation}×${modules}`;
      } else if (firstConfig.rows && firstConfig.modulesPerRow) {
        // Alternative structure
        moduleLayout = `${firstConfig.rows}${orientation}×${firstConfig.modulesPerRow}`;
      } else {
        // Fallback: assume square-ish layout
        const estimatedRows = Math.ceil(Math.sqrt(modulesPerTable));
        const estimatedModulesPerRow = Math.ceil(modulesPerTable / estimatedRows);
        moduleLayout = `${estimatedRows}${orientation}×${estimatedModulesPerRow}`;
      }
    }

    // Extract short circuit current with multiple fallback properties
    console.log('🔍 BOQ Debug - Complete selectedPanel object:', selectedPanel);
    console.log('🔍 BOQ Debug - selectedPanel keys:', selectedPanel ? Object.keys(selectedPanel) : 'null');
    console.log('🔍 BOQ Debug - Searching for Isc in selectedPanel:', {
      isc_a: selectedPanel?.isc_a,
      short_circuit_current: selectedPanel?.short_circuit_current,
      isc: selectedPanel?.isc,
      shortCircuitCurrent: selectedPanel?.shortCircuitCurrent,
      isc_stc: selectedPanel?.isc_stc,
      Isc: selectedPanel?.Isc,
      ISC: selectedPanel?.ISC,
      current_isc: selectedPanel?.current_isc,
      module_isc: selectedPanel?.module_isc,
      iv_curve: selectedPanel?.iv_curve,
      specifications: selectedPanel?.specifications,
      electrical: selectedPanel?.electrical,
      specs: selectedPanel?.specs,
      parameters: selectedPanel?.parameters
    });
    
    const shortCircuitCurrent = 
      selectedPanel?.isc_a ||
      selectedPanel?.short_circuit_current || 
      selectedPanel?.isc || 
      selectedPanel?.shortCircuitCurrent ||
      selectedPanel?.isc_stc ||
      selectedPanel?.Isc ||
      selectedPanel?.ISC ||
      selectedPanel?.current_isc ||
      selectedPanel?.module_isc ||
      selectedPanel?.specifications?.isc ||
      selectedPanel?.electrical?.isc ||
      selectedPanel?.specs?.isc ||
      selectedPanel?.parameters?.isc ||
      selectedPanel?.iv_curve?.isc ||
      selectedPanel?.electrical_specs?.isc ||
      selectedPanel?.electrical_parameters?.isc ||
      selectedPanel?.stc?.isc ||
      selectedPanel?.stc_conditions?.isc ||
      0;

    // Extract edge dimensions from drawn PV areas
    let edge1Length = 0, edge2Length = 0, edge3Length = 0, edge4Length = 0;
    
    if (firstConfig?.edges || firstConfig?.edgeDimensions || firstConfig?.dimensions) {
      console.log('🔍 BOQ Debug - Extracting edge dimensions from polygon config...');
      
      // Try different property names where edge dimensions might be stored
      const edges = firstConfig?.edges || firstConfig?.edgeDimensions || firstConfig?.dimensions?.edges;
      const bounds = firstConfig?.bounds;
      
      if (edges && Array.isArray(edges)) {
        // If edges are stored as an array
        edge1Length = edges[0]?.length || edges[0] || 0;
        edge2Length = edges[1]?.length || edges[1] || 0;
        edge3Length = edges[2]?.length || edges[2] || 0;
        edge4Length = edges[3]?.length || edges[3] || 0;
        console.log('📏 BOQ Debug - Edge dimensions from edges array:', { edge1Length, edge2Length, edge3Length, edge4Length });
      } else if (bounds) {
        // Calculate from bounds if available (width/height)
        const width = bounds.width || (bounds.right - bounds.left) || 0;
        const height = bounds.height || (bounds.bottom - bounds.top) || 0;
        edge1Length = width;
        edge2Length = height;
        edge3Length = width;
        edge4Length = height;
        console.log('📏 BOQ Debug - Edge dimensions calculated from bounds:', { width, height, edge1Length, edge2Length, edge3Length, edge4Length });
      } else if (firstConfig?.width && firstConfig?.height) {
        // Direct width/height properties
        edge1Length = firstConfig.width;
        edge2Length = firstConfig.height;
        edge3Length = firstConfig.width;
        edge4Length = firstConfig.height;
        console.log('📏 BOQ Debug - Edge dimensions from width/height:', { edge1Length, edge2Length, edge3Length, edge4Length });
      } else {
        // Try to extract from polygon points if available
        const points = firstConfig?.points || firstConfig?.vertices || firstConfig?.polygon;
        if (points && Array.isArray(points) && points.length >= 4) {
          // Calculate edge lengths from polygon points
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const calculateDistance = (p1: any, p2: any) => {
            const dx = (p2.x || p2[0]) - (p1.x || p1[0]);
            const dy = (p2.y || p2[1]) - (p1.y || p1[1]);
            return Math.sqrt(dx * dx + dy * dy);
          };
          
          edge1Length = calculateDistance(points[0], points[1]);
          edge2Length = calculateDistance(points[1], points[2]);
          edge3Length = calculateDistance(points[2], points[3]);
          edge4Length = calculateDistance(points[3], points[0]);
          console.log('📏 BOQ Debug - Edge dimensions calculated from polygon points:', { edge1Length, edge2Length, edge3Length, edge4Length });
        }
      }
    }
    
    // If no edge dimensions found, use fallback values
    if (edge1Length === 0 && edge2Length === 0 && edge3Length === 0 && edge4Length === 0) {
      console.log('📏 BOQ Debug - No edge dimensions found, using fallback based on area');
      const totalArea = polygonConfigs?.reduce((sum, config) => sum + (config.area || 0), 0) || 0;
      if (totalArea > 0) {
        // Assume rectangular area, estimate dimensions
        const aspectRatio = 1.5; // Common solar installation aspect ratio
        const width = Math.sqrt(totalArea * aspectRatio);
        const height = totalArea / width;
        edge1Length = width;
        edge2Length = height;
        edge3Length = width;
        edge4Length = height;
        console.log('📏 BOQ Debug - Edge dimensions estimated from total area:', { totalArea, edge1Length, edge2Length, edge3Length, edge4Length });
      }
    }

    const dcInputs: DCInputs = {
      structureType: structureType || firstConfig?.structureType || 'unknown',
      moduleWidthMm: selectedPanel?.module_width || selectedPanel?.width || selectedPanel?.dimensions?.width || 0,
      moduleLengthMm: selectedPanel?.module_length || selectedPanel?.length || selectedPanel?.dimensions?.length || 0,
      totalNumberOfTables: totalTables,
      moduleLayoutPerTable: moduleLayout,
      totalNumberOfRows: totalRows > 0 ? totalRows : undefined, // Include rows for all structure types when available
      stringShortCircuitCurrentA: shortCircuitCurrent,
      totalNumberOfStringsPerInverter: totalStringCount || 0,
      
      // Edge dimensions from drawn PV area
      edge1LengthM: Math.round(edge1Length * 100) / 100, // Round to 2 decimal places
      edge2LengthM: Math.round(edge2Length * 100) / 100,
      edge3LengthM: Math.round(edge3Length * 100) / 100,
      edge4LengthM: Math.round(edge4Length * 100) / 100
    };

    console.log('🔍 BOQ Debug - Final extracted Isc value:', shortCircuitCurrent);
    console.log('🔍 BOQ Debug - totalStringCount parameter received:', totalStringCount);
    console.log('🔍 BOQ Debug - Key inverter properties extracted:', {
      'total_string_inputs (EXPECTED 8)': totalStringCount,
      'isc_a from panel (EXPECTED 13.97)': shortCircuitCurrent
    });
    
    console.log('🔍 BOQ Debug - Total rows calculation result:', {
      structureType: firstConfig?.structureType,
      totalRows: totalRows,
      totalTables: totalTables,
      willBeIncludedInBOQ: totalRows > 0
    });
    
    // Additional debug for numeric searches
    if (selectedPanel?.specifications) {
      console.log('🔍 BOQ Debug - specifications numeric values:', Object.values(selectedPanel.specifications).filter(val => typeof val === 'number'));
    }
    if (selectedPanel?.electrical) {
      console.log('🔍 BOQ Debug - electrical numeric values:', Object.values(selectedPanel.electrical).filter(val => typeof val === 'number'));
    }
    if (selectedPanel?.specs) {
      console.log('🔍 BOQ Debug - specs numeric values:', Object.values(selectedPanel.specs).filter(val => typeof val === 'number'));
    }
    
    console.log('🔍 BOQ Debug - Module layout calculation:', {
      structureType: firstConfig?.structureType,
      orientation: firstConfig?.orientation,
      moduleLayout,
      totalRows: dcInputs.totalNumberOfRows,
      stringShortCircuitCurrentA: dcInputs.stringShortCircuitCurrentA,
      totalStringsPerInverter: dcInputs.totalNumberOfStringsPerInverter
    });
    
    console.log('✅ BOQ Debug - Extracted DC inputs with edge dimensions:', dcInputs);
    console.log('📏 BOQ Debug - Edge dimensions summary:', {
      edge1LengthM: dcInputs.edge1LengthM,
      edge2LengthM: dcInputs.edge2LengthM,
      edge3LengthM: dcInputs.edge3LengthM,
      edge4LengthM: dcInputs.edge4LengthM
    });
    this.parameters.dcInputs = dcInputs;
    return dcInputs;
  }

  // Extract lightning protection inputs from location and PV areas
  public extractLightningProtectionInputs(options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    polygonConfigs?: Record<string, any>[];
    soilType?: string;
  }): LightningProtectionInputs {
    const { polygonConfigs, soilType } = options;
    
    const totalArea = polygonConfigs?.reduce((sum, config) => sum + (config.area || 0), 0) || 0;
    
    const lightningInputs: LightningProtectionInputs = {
      totalPlantAreaM2: totalArea,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      soilType: (soilType as any) || 'loam'
    };

    this.parameters.lightningProtection = lightningInputs;
    return lightningInputs;
  }

  // Extract AC common inputs
  public extractACCommonInputs(options: {
    connectionType?: 'LV' | 'HV';
    manualInverterCount?: number;
  }): ACCommonInputs {
    const { connectionType, manualInverterCount } = options;
    
    const acCommon: ACCommonInputs = {
      systemType: connectionType === 'LV' ? 'LV_Connection' : 'HV_Connection',
      numberOfInverters: manualInverterCount || 0
    };

    this.parameters.acCommon = acCommon;
    return acCommon;
  }

  // Extract LV connection inputs (when connectionType = 'LV')
  public extractLVConnectionInputs(options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedInverter?: Record<string, any>;
    manualInverterCount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acConfiguration?: Record<string, any>;
    // Cable and breaker data would come from AC Config calculations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cableData?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breakerData?: Record<string, any>;
  }): LVConnectionInputs {
    const { selectedInverter, manualInverterCount, acConfiguration, cableData, breakerData } = options;
    
    console.log('🔧 BOQ Debug - Extracting LV Connection inputs...');
    console.log('🔧 BOQ Debug - selectedInverter:', selectedInverter);
    console.log('🔧 BOQ Debug - acConfiguration keys:', acConfiguration ? Object.keys(acConfiguration) : 'null');
    console.log('🔧 BOQ Debug - acConfiguration.selectedCables available:', !!acConfiguration?.selectedCables);
    console.log('🔧 BOQ Debug - acConfiguration.inputCables available:', !!acConfiguration?.inputCables);
    console.log('🔧 BOQ Debug - acConfiguration.outputCables available:', !!acConfiguration?.outputCables);
    console.log('🔧 BOQ Debug - acConfiguration.selectedBreakers available:', !!acConfiguration?.selectedBreakers);
    console.log('🔧 BOQ Debug - acConfiguration.inputBreaker available:', !!acConfiguration?.inputBreaker);
    console.log('🔧 BOQ Debug - acConfiguration.outputBreaker available:', !!acConfiguration?.outputBreaker);
    console.log('🔧 BOQ Debug - cableData:', cableData);
    console.log('🔧 BOQ Debug - breakerData:', breakerData);
    
    // Calculate inverter output voltage
    const inverterOutputVoltage = selectedInverter?.nominal_ac_voltage_v || 
                                  selectedInverter?.output_voltage || 
                                  acConfiguration?.pocVoltage || 
                                  400;
    
    // Calculate inverter output current using the formula:
    // Inverter output current in A = Inverter AC capacity in kW / (Inverter voltage * 1.732 / 1000)
    const inverterACCapacityKW = selectedInverter?.nominal_ac_power_kw || 
                                 selectedInverter?.maximum_ac_power_kw || 
                                 selectedInverter?.power_kw || 
                                 selectedInverter?.ac_power || 
                                 40; // Fallback to 40kW
                                 
    const calculatedOutputCurrent = inverterACCapacityKW / (inverterOutputVoltage * 1.732 / 1000);
    
    console.log('🔧 BOQ Debug - Inverter output current calculation:');
    console.log(`  - AC Capacity: ${inverterACCapacityKW} kW`);
    console.log(`  - Voltage: ${inverterOutputVoltage} V`);
    console.log(`  - Formula: ${inverterACCapacityKW} / (${inverterOutputVoltage} * 1.732 / 1000) = ${calculatedOutputCurrent.toFixed(2)} A`);
    
    // Initialize cable data - NO FALLBACK VALUES, only actual extracted data
    const extractedCableData = {
      inverterToCombinerDistance: null as number | null,
      inverterToCombinerCrossSection: null as string | null,
      combinerToPoCDistance: null as number | null,
      combinerToPoCCrossSection: null as string | null
    };

    console.log('🚨 NO FALLBACKS: Starting with NULL values, will only use REAL extracted data');

    // Extract from selectedCables Map if available
    if (acConfiguration?.selectedCables && acConfiguration.selectedCables.size > 0) {
      console.log('🔧 BOQ Debug - Found selectedCables Map, extracting actual values...');
      console.log('🔧 BOQ Debug - selectedCables keys:', Array.from(acConfiguration.selectedCables.keys()));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedCables.forEach((cableInfo: any, key: string) => {
        console.log(`🔧 BOQ Debug - Cable ${key}:`, cableInfo);
        const lowerKey = key.toLowerCase();
        
        // Match: 'input-Inverter to AC Combiner Panel' or similar inverter to combiner connections
        if ((lowerKey.includes('inverter') && lowerKey.includes('combiner')) || 
            (lowerKey.includes('input') && lowerKey.includes('combiner'))) {
          // Only extract if actual values exist - NO FALLBACKS
          if (cableInfo.length && cableInfo.cable?.cross_section_mm2) {
            const length = cableInfo.length;
            const numberOfRuns = cableInfo.numberOfRuns || 1;
            const crossSection = Number(cableInfo.cable.cross_section_mm2);
            const formattedCrossSection = `${numberOfRuns}R*${crossSection}`;
            extractedCableData.inverterToCombinerDistance = length;
            extractedCableData.inverterToCombinerCrossSection = formattedCrossSection;
            console.log(`📏 ✅ REAL DATA FOUND - Inverter-Combiner: length=${length}m, crossSection=${formattedCrossSection}mm²`);
            console.log(`📏 Cable object details:`, {length: cableInfo.length, cable: cableInfo.cable, numberOfRuns: numberOfRuns});
          } else {
            console.log(`📏 ❌ INCOMPLETE DATA - Inverter-Combiner cable missing length or cross-section:`, cableInfo);
          }
        } 
        // Match: 'output-AC Combiner Panel to PoC' or similar combiner to PoC connections  
        else if ((lowerKey.includes('combiner') && lowerKey.includes('poc')) || 
                 (lowerKey.includes('output') && lowerKey.includes('poc'))) {
          // Only extract if actual values exist - NO FALLBACKS
          if (cableInfo.length && cableInfo.cable?.cross_section_mm2) {
            const length = cableInfo.length;
            const numberOfRuns = cableInfo.numberOfRuns || 1;
            const crossSection = Number(cableInfo.cable.cross_section_mm2);
            const formattedCrossSection = `${numberOfRuns}R*${crossSection}`;
            extractedCableData.combinerToPoCDistance = length;
            extractedCableData.combinerToPoCCrossSection = formattedCrossSection;
            console.log(`📏 ✅ REAL DATA FOUND - Combiner-PoC: length=${length}m, crossSection=${formattedCrossSection}mm²`);
            console.log(`📏 Cable object details:`, {length: cableInfo.length, cable: cableInfo.cable, numberOfRuns: numberOfRuns});
          } else {
            console.log(`📏 ❌ INCOMPLETE DATA - Combiner-PoC cable missing length or cross-section:`, cableInfo);
          }
        }
      });
    } else {
      console.log('🚨 NO FALLBACKS: selectedCables Map not found or empty - will use NULL values');
    }
    
    // Initialize breaker data - NO FALLBACK VALUES, only actual extracted data
    const extractedBreakerData = {
      incomeBreakerRating: null as number | null,
      outgoingBreakerRating: null as number | null
    };

    console.log('🚨 NO FALLBACKS: Starting with NULL breaker ratings, will only use REAL extracted data');

    // Extract from selectedBreakers Map if available
    if (acConfiguration?.selectedBreakers && acConfiguration.selectedBreakers.size > 0) {
      console.log('🔧 BOQ Debug - Found selectedBreakers Map, extracting actual ratings...');
      console.log('🔧 BOQ Debug - selectedBreakers keys:', Array.from(acConfiguration.selectedBreakers.keys()));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedBreakers.forEach((breakerInfo: any, key: string) => {
        console.log(`🔧 BOQ Debug - Breaker ${key}:`, breakerInfo);
        console.log(`🔧 BOQ Debug - Breaker object detailed:`, {
          completeBreaker: breakerInfo.breaker,
          breakerKeys: breakerInfo.breaker ? Object.keys(breakerInfo.breaker) : 'null',
          sectionType: breakerInfo.sectionType
        });
        const lowerKey = key.toLowerCase();
        
        // Match income/input breakers: 'individual-Individual Inverter Breaker', 'input-...', 'income-...'
        if (lowerKey.includes('input') || lowerKey.includes('income') || lowerKey.includes('individual') || 
            breakerInfo.sectionType === 'input' || breakerInfo.sectionType === 'individual') {
          // Only extract if actual rating exists - NO FALLBACKS
          const rating = breakerInfo.breaker?.ampacity ||          // PRIMARY (same as Design Summary)
                        breakerInfo.breaker?.current_rating_a || 
                        breakerInfo.breaker?.rated_current_a || 
                        breakerInfo.breaker?.rating_a || 
                        breakerInfo.breaker?.ampere_rating || 
                        breakerInfo.breaker?.rating || 
                        breakerInfo.breaker?.current_rating || 
                        breakerInfo.breaker?.nominal_current || 
                        breakerInfo.breaker?.rated_current || 
                        breakerInfo.current_rating_a ||
                        breakerInfo.rated_current_a;
          
          if (rating && rating > 0) {
            extractedBreakerData.incomeBreakerRating = rating;
            console.log(`⚡ ✅ REAL DATA FOUND - Income Breaker: rating=${rating}A`);
            console.log(`⚡ Rating extraction tried:`, {
              ampacity: breakerInfo.breaker?.ampacity,              // Added primary property  
              current_rating_a: breakerInfo.breaker?.current_rating_a,
              rated_current_a: breakerInfo.breaker?.rated_current_a,
              rating_a: breakerInfo.breaker?.rating_a,
              rating: breakerInfo.breaker?.rating,
              finalRating: rating
            });
          } else {
            console.log(`⚡ ❌ NO RATING FOUND - Income Breaker missing ampacity/rating:`, breakerInfo);
          }
        } 
        // Match outgoing breakers: 'outgoing-AC Combiner Panel Outgoing Breaker', 'output-...'
        else if (lowerKey.includes('output') || lowerKey.includes('outgoing') || 
                 breakerInfo.sectionType === 'output' || breakerInfo.sectionType === 'outgoing') {
          // Only extract if actual rating exists - NO FALLBACKS
          const rating = breakerInfo.breaker?.ampacity ||          // PRIMARY (same as Design Summary)
                        breakerInfo.breaker?.current_rating_a || 
                        breakerInfo.breaker?.rated_current_a || 
                        breakerInfo.breaker?.rating_a || 
                        breakerInfo.breaker?.ampere_rating || 
                        breakerInfo.breaker?.rating || 
                        breakerInfo.breaker?.current_rating || 
                        breakerInfo.breaker?.nominal_current || 
                        breakerInfo.breaker?.rated_current || 
                        breakerInfo.current_rating_a ||
                        breakerInfo.rated_current_a;
                        
          if (rating && rating > 0) {
            extractedBreakerData.outgoingBreakerRating = rating;
            console.log(`⚡ ✅ REAL DATA FOUND - Outgoing Breaker: rating=${rating}A`);
            console.log(`⚡ Rating extraction tried:`, {
              ampacity: breakerInfo.breaker?.ampacity,              // Added primary property
              current_rating_a: breakerInfo.breaker?.current_rating_a,
              rated_current_a: breakerInfo.breaker?.rated_current_a,
              rating_a: breakerInfo.breaker?.rating_a,
              rating: breakerInfo.breaker?.rating,
              finalRating: rating
            });
          } else {
            console.log(`⚡ ❌ NO RATING FOUND - Outgoing Breaker missing ampacity/rating:`, breakerInfo);
          }
        }
      });
    } else {
      console.log('🚨 NO FALLBACKS: selectedBreakers Map not found or empty - will use NULL values');
    }
    
    console.log('🚨 FINAL CHECK - Extracted cable data (NULL = No Real Data Found):', extractedCableData);
    console.log('🚨 FINAL CHECK - Extracted breaker data (NULL = No Real Data Found):', extractedBreakerData);
    
    // Check if we have real data - throw error if all null
    if (!extractedCableData.inverterToCombinerDistance || !extractedCableData.inverterToCombinerCrossSection ||
        !extractedCableData.combinerToPoCDistance || !extractedCableData.combinerToPoCCrossSection) {
      console.error('❌ CRITICAL ERROR: No real cable data found in selectedCables Map!');
      console.error('❌ Available selectedCables keys:', acConfiguration?.selectedCables ? Array.from(acConfiguration.selectedCables.keys()) : 'None');
      throw new Error('No real cable data found in AC Configuration. Please ensure cables are properly configured in the AC Config tab.');
    }
    
    if (!extractedBreakerData.incomeBreakerRating || !extractedBreakerData.outgoingBreakerRating) {
      console.error('❌ CRITICAL ERROR: No real breaker data found in selectedBreakers Map!');
      console.error('❌ Available selectedBreakers keys:', acConfiguration?.selectedBreakers ? Array.from(acConfiguration.selectedBreakers.keys()) : 'None');
      throw new Error('No real breaker data found in AC Configuration. Please ensure breakers are properly configured in the AC Config tab.');
    }
    
    // Calculate actual total cable lengths for LV Connection (Distance × Runs × Circuits)  
    const numberOfLVInverters = manualInverterCount || 0;
    const numberOfCombinerPanels = 1; // Usually 1 combiner panel for LV connection
    
    // Extract number of runs from cross-section strings like "5R*240"
    const getLVRunsFromCrossSection = (crossSectionStr: string): number => {
      if (typeof crossSectionStr === 'string') {
        const match = crossSectionStr.match(/(\d+)R\*/);
        return match ? parseInt(match[1], 10) : 1;
      }
      return 1;
    };
    
    const lvInverterToCombinerRuns = getLVRunsFromCrossSection(extractedCableData.inverterToCombinerCrossSection!);
    const lvCombinerToPoCRuns = getLVRunsFromCrossSection(extractedCableData.combinerToPoCCrossSection!);
    
    // Calculate total cable lengths using the correct formula
    const totalLVCableLengths = {
      // Inverter to Combiner: Distance × Runs × Number of Inverters
      inverterToCombinerDistance: extractedCableData.inverterToCombinerDistance! * lvInverterToCombinerRuns * numberOfLVInverters,
      // Combiner to PoC: Distance × Runs × Number of Combiner Panels
      combinerToPoCDistance: extractedCableData.combinerToPoCDistance! * lvCombinerToPoCRuns * numberOfCombinerPanels
    };
    
    console.log('✅ USING REAL DATA - LV Connection Cable Length Calculations:');
    console.log(`   Inverter-to-Combiner:`);
    console.log(`     1. Distance: ${extractedCableData.inverterToCombinerDistance}m`);
    console.log(`     2. Total per circuit: ${extractedCableData.inverterToCombinerDistance}m × ${lvInverterToCombinerRuns} runs = ${extractedCableData.inverterToCombinerDistance! * lvInverterToCombinerRuns}m`);
    console.log(`     3. Complete length: ${extractedCableData.inverterToCombinerDistance! * lvInverterToCombinerRuns}m × ${numberOfLVInverters} inverters = ${totalLVCableLengths.inverterToCombinerDistance}m`);
    console.log(`   Combiner-to-PoC:`);
    console.log(`     1. Distance: ${extractedCableData.combinerToPoCDistance}m`);
    console.log(`     2. Total per circuit: ${extractedCableData.combinerToPoCDistance}m × ${lvCombinerToPoCRuns} runs = ${extractedCableData.combinerToPoCDistance! * lvCombinerToPoCRuns}m`);
    console.log(`     3. Complete length: ${extractedCableData.combinerToPoCDistance! * lvCombinerToPoCRuns}m × ${numberOfCombinerPanels} panels = ${totalLVCableLengths.combinerToPoCDistance}m`);
    
    // Calculate LV Combiner Panel Output Current
    const numberOfInverters = manualInverterCount || 0;
    const singleInverterOutputCurrentA = Math.round(calculatedOutputCurrent * 100) / 100;
    const lvCombinerPanelOutputCurrentA = Math.round(numberOfInverters * singleInverterOutputCurrentA * 100) / 100;
    
    console.log('🔧 BOQ Debug - LV Combiner Panel Output Current Calculation:');
    console.log(`   Number of inverters: ${numberOfInverters}`);
    console.log(`   Single inverter output current: ${singleInverterOutputCurrentA}A`);
    console.log(`   LV Combiner Panel Output Current = ${numberOfInverters} × ${singleInverterOutputCurrentA}A = ${lvCombinerPanelOutputCurrentA}A`);
    
    const lvInputs: LVConnectionInputs = {
      inverterOutputVoltageV: inverterOutputVoltage,
      inverterOutputCurrentA: singleInverterOutputCurrentA,
      
      // LV Combiner Panel Details
      numberOfInvertersConnectedToLVCombiner: numberOfInverters,
      lvCombinerPanelOutputCurrentA: lvCombinerPanelOutputCurrentA, // Calculated: Number of inverters × Single inverter output current
      
      // Inverter to Combiner Cable Parameters (3 separate values) - USING REAL EXTRACTED DATA
      distanceInverterToCombinerM: extractedCableData.inverterToCombinerDistance!, // Real distance from selectedCables
      totalCableLengthPerInverterToCombinerM: extractedCableData.inverterToCombinerDistance! * lvInverterToCombinerRuns, // Distance × Runs
      completeCableLengthInverterToCombinerM: totalLVCableLengths.inverterToCombinerDistance, // Total for all inverters
      acCableCrossSectionInverterToCombinerMm2: extractedCableData.inverterToCombinerCrossSection!, // Real cross-section from selectedCables
      
      // Combiner to PoC Cable Parameters (3 separate values) - USING REAL EXTRACTED DATA
      distanceCombinerToPoCM: extractedCableData.combinerToPoCDistance!, // Real distance from selectedCables
      totalCableLengthPerCombinerToPoCM: extractedCableData.combinerToPoCDistance! * lvCombinerToPoCRuns, // Distance × Runs
      completeCableLengthCombinerToPoCM: totalLVCableLengths.combinerToPoCDistance, // Total for all combiners
      acCableCrossSectionCombinerToPoCMm2: extractedCableData.combinerToPoCCrossSection!, // Real cross-section from selectedCables
      
      // Breaker Ratings - USING REAL EXTRACTED DATA
      combinerIncomeBreakerRatingA: extractedBreakerData.incomeBreakerRating!, // Real rating from selectedBreakers
      combinerOutgoingBreakerRatingA: extractedBreakerData.outgoingBreakerRating! // Real rating from selectedBreakers
    };

    console.log('✅ BOQ Debug - Final LV Connection inputs:', lvInputs);
    this.parameters.lvConnection = lvInputs;
    return lvInputs;
  }

  // Extract HV String Inverter inputs
  public extractHVStringInverterInputs(options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedInverter?: Record<string, any>;
    manualInverterCount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acConfiguration?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cableData?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breakerData?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformerData?: Record<string, any>;
  }): HVStringInverterInputs {
    const { selectedInverter, manualInverterCount, acConfiguration, cableData, breakerData, transformerData } = options;
    
    console.log('🔧 BOQ Debug - Extracting HV String Inverter inputs...');
    console.log('🔧 BOQ Debug - acConfiguration.hvStringConfig available:', !!acConfiguration?.hvStringConfig);
    console.log('🔧 BOQ Debug - hvStringConfig details:', acConfiguration?.hvStringConfig);
    
    // Extract from hvStringConfig (same as Design Summary)
    const hvStringConfig = acConfiguration?.hvStringConfig;
    
    // Extract LV Combiner Panel details (same as Design Summary)
    const lvPanelCount = hvStringConfig?.lvACCombinerPanels?.count || Math.ceil((manualInverterCount || 0) / 8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lvPanelInputs = hvStringConfig?.lvACCombinerPanels?.configurations?.reduce((sum: number, config: any) => sum + config.inputs, 0) || 0;
    
    // Extract IDT details (same as Design Summary) 
    const idtCount = hvStringConfig?.idts?.count || Math.ceil((manualInverterCount || 0) / 8);
    const idtConfig = hvStringConfig?.idts?.configurations?.[0];
    
    // Extract PT details (same as Design Summary)
    const ptConfig = hvStringConfig?.powerTransformer;
    
    // Extract cable lengths and cross-sections from selectedCables (same as Design Summary logic)
    const actualLengths = {
      inverterToLVPanel: 50,
      lvPanelToIDT: 200, 
      idtToPowerTransformer: 300,
      powerTransformerToPoC: 500
    };
    
    const actualCrossSections = {
      inverterToLVPanel: "1R*16", // Include number of runs in format "4R*120"
      lvPanelToIDT: "1R*95",
      idtToPowerTransformer: "1R*185", 
      powerTransformerToPoC: "1R*240"
    };
    
    if (acConfiguration?.selectedCables && acConfiguration.selectedCables.size > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedCables.forEach((cableData: any, key: string) => {
        const lowerKey = key.toLowerCase();
        console.log(`🔧 BOQ Debug - HV String Cable ${key}:`, {
          length: cableData.length,
          crossSection: cableData.cable?.cross_section_mm2,
          cable: cableData.cable
        });
        
        // Fix key matching based on actual keys from console log
        // Extract number of runs and cross section for proper "4R*120" format
        const numberOfRuns = cableData.numberOfRuns || 1;
        const crossSection = cableData.cable?.cross_section_mm2 || 16;
        const formattedCrossSection = `${numberOfRuns}R*${crossSection}`;
        
        if (lowerKey.includes('input') && lowerKey.includes('inverter')) {
          // 'input-Inverter Input Cables' - this is inverter to combiner
          actualLengths.inverterToLVPanel = cableData.length || 50;
          actualCrossSections.inverterToLVPanel = formattedCrossSection;
          console.log(`📏 MATCHED Inverter-to-Combiner: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else if (lowerKey.includes('output') && lowerKey.includes('panel') && lowerKey.includes('idt')) {
          // 'output-Panel to IDT Connection Cable' - this is combiner to IDT
          actualLengths.lvPanelToIDT = cableData.length || 200;
          actualCrossSections.lvPanelToIDT = formattedCrossSection;
          console.log(`📏 MATCHED Combiner-to-IDT: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else if (lowerKey.includes('idt_to_transformer') || (lowerKey.includes('idt') && lowerKey.includes('power') && lowerKey.includes('transformer'))) {
          // 'idt_to_transformer-IDT 1 to Power Transformer' - this is IDT to PT
          actualLengths.idtToPowerTransformer = cableData.length || 300;  
          actualCrossSections.idtToPowerTransformer = formattedCrossSection;
          console.log(`📏 MATCHED IDT-to-PT: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else if (lowerKey.includes('transformer_to_poc') || (lowerKey.includes('power') && lowerKey.includes('transformer') && lowerKey.includes('point'))) {
          // 'transformer_to_poc-Power Transformer to Point of Connection' - this is PT to PoC
          actualLengths.powerTransformerToPoC = cableData.length || 500;
          actualCrossSections.powerTransformerToPoC = formattedCrossSection;
          console.log(`📏 MATCHED PT-to-PoC: ${cableData.length}m, ${formattedCrossSection}mm²`);
        }
      });
    }
    
    // Extract breaker ratings from selectedBreakers (same as LV Connection logic) 
    const extractedBreakerData = {
      combinerIncomeBreakerRating: 100,
      combinerOutgoingBreakerRating: 63,
      // IDT-to-PT and PT-to-PoC breakers (the ones showing fallback values)
      idtToPTType: "VCB",  // cb Type I D T To P T
      idtToPTRating: 630,  // cb Rating I D T To P T A
      ptToPoCType: "VCB",  // cb Type P T To Po C
      ptToPoCRating: 630   // cb Rating P T To Po C A
    };
    
    if (acConfiguration?.selectedBreakers && acConfiguration.selectedBreakers.size > 0) {
      console.log('🔧 BOQ Debug - HV String selectedBreakers keys:', Array.from(acConfiguration.selectedBreakers.keys()));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedBreakers.forEach((breakerInfo: any, key: string) => {
        console.log(`🔧 BOQ Debug - HV String Breaker ${key}:`, breakerInfo);
        const lowerKey = key.toLowerCase();
        
        // Fix breaker matching based on actual keys from console log
        if (lowerKey.includes('individual') && lowerKey.includes('inverter')) {
          // 'individual-Individual Inverter Breaker' - this is income breaker
          extractedBreakerData.combinerIncomeBreakerRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 100;
          console.log(`⚡ MATCHED Income Breaker (Individual): ${extractedBreakerData.combinerIncomeBreakerRating}A`);
        } else if (lowerKey.includes('outgoing') && lowerKey.includes('panel')) {
          // 'outgoing-Panel Output Breaker' - this is outgoing breaker
          extractedBreakerData.combinerOutgoingBreakerRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 63;
          console.log(`⚡ MATCHED Outgoing Breaker (Panel): ${extractedBreakerData.combinerOutgoingBreakerRating}A`);
        } else if (lowerKey.includes('idt_output') || (lowerKey.includes('idt') && lowerKey.includes('output'))) {
          // 'idt_output-IDT 1 - Output Breaker (HV)' - this is IDT-to-PT breaker
          extractedBreakerData.idtToPTType = breakerInfo.breaker?.breaker_type || "VCB";
          extractedBreakerData.idtToPTRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 630;
          console.log(`⚡ MATCHED IDT-to-PT Breaker: ${extractedBreakerData.idtToPTRating}A ${extractedBreakerData.idtToPTType}`);
        } else if (lowerKey.includes('power_transformer') || (lowerKey.includes('power') && lowerKey.includes('transformer') && lowerKey.includes('grid'))) {
          // 'power_transformer-Power Transformer - Grid Connection Breaker' - this is PT-to-PoC breaker
          extractedBreakerData.ptToPoCType = breakerInfo.breaker?.breaker_type || "VCB";
          extractedBreakerData.ptToPoCRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 630;
          console.log(`⚡ MATCHED PT-to-PoC Breaker: ${extractedBreakerData.ptToPoCRating}A ${extractedBreakerData.ptToPoCType}`);
        }
      });
    }
    
    // Calculate currents using formulas provided by user
    const inverterPowerKW = selectedInverter?.nominal_ac_power_kw || selectedInverter?.maximum_ac_power_kw || 40;
    const inverterVoltageV = selectedInverter?.nominal_ac_voltage_v || 400;
    
    // Formula: inverter Output Current A = inverter Power capacity in kW/(Inverter output Voltage in V*1.732/1000)
    const inverterOutputCurrentA = inverterPowerKW / (inverterVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: idt Input Current A = (Total connected LV combiner panels per IDT * Single LV Combiner Panel Power capacity in kW) / (Inverter Output voltage in V * 1.732/1000)
    const singleLVCombinerPowerKW = (manualInverterCount * inverterPowerKW) / lvPanelCount; // Total power divided by panels
    const idtInputCurrentA = (lvPanelInputs * singleLVCombinerPowerKW) / (inverterVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: idt Output Current A = (IDT Power rating in MVA * 1000) / (IDT output Voltage * 1.732/1000)
    const idtPowerRatingMVA = idtConfig?.powerRating || 1.0;
    const idtOutputVoltageV = idtConfig?.secondaryVoltage || 11000;
    const idtOutputCurrentA = (idtPowerRatingMVA * 1000) / (idtOutputVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: pt Input Current A = (Total no of IDT * IDT Power rating in MVA * 1000) / (IDT output Voltage * 1.732/1000)
    const ptInputCurrentA = (idtCount * idtPowerRatingMVA * 1000) / (idtOutputVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: pt Output Current A = (PT Power rating in MVA * 1000) / (PT output Voltage * 1.732/1000)
    const ptPowerRatingMVA = ptConfig?.powerRating || idtPowerRatingMVA; // PT rating often same as IDT rating
    const ptOutputVoltageV = ptConfig?.secondaryVoltage || 33000;
    const ptOutputCurrentA = (ptPowerRatingMVA * 1000) / (ptOutputVoltageV * 1.732 / 1000);
    
    console.log('📋 BOQ Debug - Current Calculation Formulas Used:');
    console.log('🔌 Inverter Output Current A = Inverter Power (kW) / (Inverter Voltage (V) * 1.732 / 1000)');
    console.log(`   = ${inverterPowerKW} / (${inverterVoltageV} * 1.732 / 1000) = ${inverterOutputCurrentA.toFixed(2)}A`);
    
    console.log('⚡ IDT Input Current A = (Total connected LV combiner panels per IDT * Single LV Combiner Panel Power capacity in kW) / (Inverter Output voltage in V * 1.732/1000)');
    console.log(`   = (${lvPanelInputs} * ${singleLVCombinerPowerKW.toFixed(2)}) / (${inverterVoltageV} * 1.732 / 1000) = ${idtInputCurrentA.toFixed(2)}A`);
    
    console.log('🔄 IDT Output Current A = (IDT Power MVA * 1000) / (IDT Output Voltage V * 1.732/1000)');
    console.log(`   = (${idtPowerRatingMVA} * 1000) / (${idtOutputVoltageV} * 1.732 / 1000) = ${idtOutputCurrentA.toFixed(2)}A`);
    
    console.log('⚡ PT Input Current A = (Total no of IDT * IDT Power MVA * 1000) / (IDT Output Voltage V * 1.732/1000)');
    console.log(`   = (${idtCount} * ${idtPowerRatingMVA} * 1000) / (${idtOutputVoltageV} * 1.732 / 1000) = ${ptInputCurrentA.toFixed(2)}A`);
    
    console.log('🔄 PT Output Current A = (PT Power MVA * 1000) / (PT Output Voltage V * 1.732/1000)');
    console.log(`   = (${ptPowerRatingMVA} * 1000) / (${ptOutputVoltageV} * 1.732 / 1000) = ${ptOutputCurrentA.toFixed(2)}A`);
    
    // Calculate actual total cable lengths for HV String (Distance × Runs × Circuits)
    const numberOfStringInverters = manualInverterCount || 0;
    const numberOfStringIDTs = idtCount;
    const numberOfStringPTs = ptConfig ? 1 : 0;
    
    // Extract number of runs from cross-section strings like "5R*240"
    const getStringRunsFromCrossSection = (crossSectionStr: string): number => {
      const match = crossSectionStr.match(/(\d+)R\*/);
      return match ? parseInt(match[1], 10) : 1;
    };
    
    const stringInverterToLVPanelRuns = getStringRunsFromCrossSection(actualCrossSections.inverterToLVPanel);
    const stringLVPanelToIDTRuns = getStringRunsFromCrossSection(actualCrossSections.lvPanelToIDT);
    const stringIDTToPTRuns = getStringRunsFromCrossSection(actualCrossSections.idtToPowerTransformer);
    const stringPTToPoCRuns = getStringRunsFromCrossSection(actualCrossSections.powerTransformerToPoC);
    
    // Calculate total cable lengths using the correct formula
    const totalStringCableLengths = {
      // String Inverter to LV Panel: Distance × Runs × Number of Inverters
      inverterToLVPanel: actualLengths.inverterToLVPanel * stringInverterToLVPanelRuns * numberOfStringInverters,
      // LV Panel to IDT: Distance × Runs × Number of LV Panels (usually 1)
      lvPanelToIDT: actualLengths.lvPanelToIDT * stringLVPanelToIDTRuns * lvPanelCount,
      // IDT to PT: Distance × Runs × Number of IDTs
      idtToPowerTransformer: actualLengths.idtToPowerTransformer * stringIDTToPTRuns * numberOfStringIDTs,
      // PT to PoC: Distance × Runs × Number of PTs
      powerTransformerToPoC: actualLengths.powerTransformerToPoC * stringPTToPoCRuns * numberOfStringPTs
    };
    
    console.log('🔧 BOQ Debug - HV String Cable Length Calculations (3-Parameter System):');
    console.log(`   String Inverter-to-LV Panel:`);
    console.log(`     1. Distance: ${actualLengths.inverterToLVPanel}m`);
    console.log(`     2. Total per circuit: ${actualLengths.inverterToLVPanel}m × ${stringInverterToLVPanelRuns} runs = ${actualLengths.inverterToLVPanel * stringInverterToLVPanelRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.inverterToLVPanel * stringInverterToLVPanelRuns}m × ${numberOfStringInverters} inverters = ${totalStringCableLengths.inverterToLVPanel}m`);
    console.log(`   LV Panel-to-IDT:`);
    console.log(`     1. Distance: ${actualLengths.lvPanelToIDT}m`);
    console.log(`     2. Total per circuit: ${actualLengths.lvPanelToIDT}m × ${stringLVPanelToIDTRuns} runs = ${actualLengths.lvPanelToIDT * stringLVPanelToIDTRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.lvPanelToIDT * stringLVPanelToIDTRuns}m × ${lvPanelCount} panels = ${totalStringCableLengths.lvPanelToIDT}m`);
    console.log(`   IDT-to-PT:`);
    console.log(`     1. Distance: ${actualLengths.idtToPowerTransformer}m`);
    console.log(`     2. Total per circuit: ${actualLengths.idtToPowerTransformer}m × ${stringIDTToPTRuns} runs = ${actualLengths.idtToPowerTransformer * stringIDTToPTRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.idtToPowerTransformer * stringIDTToPTRuns}m × ${numberOfStringIDTs} IDTs = ${totalStringCableLengths.idtToPowerTransformer}m`);
    console.log(`   PT-to-PoC:`);
    console.log(`     1. Distance: ${actualLengths.powerTransformerToPoC}m`);
    console.log(`     2. Total per circuit: ${actualLengths.powerTransformerToPoC}m × ${stringPTToPoCRuns} runs = ${actualLengths.powerTransformerToPoC * stringPTToPoCRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.powerTransformerToPoC * stringPTToPoCRuns}m × ${numberOfStringPTs} PTs = ${totalStringCableLengths.powerTransformerToPoC}m`);
    
    console.log('🔧 BOQ Debug - HV String Transformer Ratings:');
    console.log(`   Single IDT Rating: ${idtPowerRatingMVA} MVA (Impedance: 6%)`);
    console.log(`   Single PT Rating: ${ptPowerRatingMVA} MVA (Impedance: 6%)`);
    
    console.log('🔧 BOQ Debug - HV String extracted breakers for IDT-to-PT and PT-to-PoC:');
    console.log(`   IDT-to-PT: ${extractedBreakerData.idtToPTRating}A ${extractedBreakerData.idtToPTType}`);
    console.log(`   PT-to-PoC: ${extractedBreakerData.ptToPoCRating}A ${extractedBreakerData.ptToPoCType}`);
    
    console.log('🔧 BOQ Debug - HV String extracted data:', {
      lvPanelCount,
      lvPanelInputs,
      idtCount,
      idtConfig: idtConfig ? Object.keys(idtConfig) : 'null',
      ptConfig: ptConfig ? Object.keys(ptConfig) : 'null', 
      actualLengths,
      actualCrossSections,
      extractedBreakerData,
      calculatedCurrents: {
        inverterOutputCurrentA: inverterOutputCurrentA.toFixed(2),
        idtInputCurrentA: idtInputCurrentA.toFixed(2),
        idtOutputCurrentA: idtOutputCurrentA.toFixed(2),
        ptInputCurrentA: ptInputCurrentA.toFixed(2),
        ptOutputCurrentA: ptOutputCurrentA.toFixed(2)
      }
    });
    
    const hvStringInputs: HVStringInverterInputs = {
      numberOfStringInverters: manualInverterCount || 0,
      
      // Use formula-calculated current values
      inverterOutputVoltageV: inverterVoltageV,
      inverterOutputCurrentA: Math.round(inverterOutputCurrentA * 100) / 100, // Round to 2 decimal places
      
      invertersPerLVCombinerPanel: lvPanelInputs > 0 ? Math.ceil(lvPanelInputs / lvPanelCount) : 6,
      totalLVCombinerPanels: lvPanelCount,
      
      // Parameters not required for HV String design (set to 0 as per user feedback)
      distanceCombinerToPoCM: 0, // Not required for HV String (uses PT to PoC instead)
      acCableCrossSectionCombinerToPoCMm2: "0R*0", // Not required for HV String
      
      // IDT Details (extracted from hvStringConfig like Design Summary)
      quantityOfIDTs: idtCount,
      singleIDTRatingMVA: idtPowerRatingMVA, // Single IDT rating in MVA
      idtTransformerImpedancePercentage: 6, // IDT transformer impedance (default 6%)
      idtInputVoltageV: idtConfig?.primaryVoltage || transformerData?.idtInputVoltage || inverterVoltageV,
      idtInputCurrentA: Math.round(idtInputCurrentA * 100) / 100, // Use calculated formula
      idtOutputVoltageV: idtOutputVoltageV,
      idtOutputCurrentA: Math.round(idtOutputCurrentA * 100) / 100, // Use calculated formula
      
      // PT Details (extracted from hvStringConfig like Design Summary)
      quantityOfPTs: ptConfig ? 1 : 0,
      singlePTRatingMVA: ptPowerRatingMVA, // Power Transformer rating in MVA
      ptTransformerImpedancePercentage: 6, // PT transformer impedance (default 6%)
      ptInputVoltageV: idtOutputVoltageV, // PT input = IDT output
      ptInputCurrentA: Math.round(ptInputCurrentA * 100) / 100, // Use calculated formula
      ptOutputVoltageV: ptOutputVoltageV,
      ptOutputCurrentA: Math.round(ptOutputCurrentA * 100) / 100, // Use calculated formula
      
      // String Inverter to Combiner Cable Parameters (3 separate values)
      distanceInverterToCombinerM: actualLengths.inverterToLVPanel, // Original distance
      totalCableLengthPerInverterToCombinerM: actualLengths.inverterToLVPanel * stringInverterToLVPanelRuns, // Distance × Runs
      completeCableLengthInverterToCombinerM: totalStringCableLengths.inverterToLVPanel, // Total for all inverters
      acCableCrossSectionInverterToCombinerMm2: actualCrossSections.inverterToLVPanel,
      
      // Combiner to IDT Cable Parameters (3 separate values)
      distanceCombinerToIDTM: actualLengths.lvPanelToIDT, // Original distance
      totalCableLengthPerCombinerToIDTM: actualLengths.lvPanelToIDT * stringLVPanelToIDTRuns, // Distance × Runs
      completeCableLengthCombinerToIDTM: totalStringCableLengths.lvPanelToIDT, // Total for all combiners
      cableSizeCombinerToIDTMm2: actualCrossSections.lvPanelToIDT,
      
      // IDT to PT Cable Parameters (3 separate values)
      distanceIDTToPTM: actualLengths.idtToPowerTransformer, // Original distance
      totalCableLengthPerIDTToPTM: actualLengths.idtToPowerTransformer * stringIDTToPTRuns, // Distance × Runs
      completeCableLengthIDTToPTM: totalStringCableLengths.idtToPowerTransformer, // Total for all IDTs
      cableSizeIDTToPTMm2: actualCrossSections.idtToPowerTransformer,
      
      // PT to PoC Cable Parameters (3 separate values)
      distancePTToPoCM: actualLengths.powerTransformerToPoC, // Original distance
      totalCableLengthPerPTToPoCM: actualLengths.powerTransformerToPoC * stringPTToPoCRuns, // Distance × Runs
      completeCableLengthPTToPoCM: totalStringCableLengths.powerTransformerToPoC, // Total for all PTs
      cableSizePTToPoCMm2: actualCrossSections.powerTransformerToPoC,
      
      // Circuit Breaker Details (extracted from selectedBreakers like LV Connection)
      combinerIncomeBreakerRatingA: extractedBreakerData.combinerIncomeBreakerRating,
      combinerOutgoingBreakerRatingA: extractedBreakerData.combinerOutgoingBreakerRating,
      
      // Parameters not required for HV String design (as per user feedback) - set to empty/0
      cbTypeInverterToIDT: "", // Not required for HV String
      cbRatingInverterToIDTA: 0, // Not required for HV String
      
      cbTypeIDTToPT: extractedBreakerData.idtToPTType,
      cbRatingIDTToPTA: extractedBreakerData.idtToPTRating,
      cbTypePTToPoC: extractedBreakerData.ptToPoCType,
      cbRatingPTToPoCA: extractedBreakerData.ptToPoCRating
    };

    console.log('✅ BOQ Debug - Final HV String inputs:', hvStringInputs);
    this.parameters.hvStringInverter = hvStringInputs;
    return hvStringInputs;
  }

  // Extract HV Central Inverter inputs
  public extractHVCentralInverterInputs(options: {
    manualInverterCount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acConfiguration?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cableData?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breakerData?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformerData?: Record<string, any>;
  }): HVCentralInverterInputs {
    const { manualInverterCount, acConfiguration, cableData, breakerData, transformerData } = options;
    
    console.log('🔧 BOQ Debug - Extracting HV Central Inverter inputs...');
    console.log('🔧 BOQ Debug - acConfiguration.hvCentralConfig available:', !!acConfiguration?.hvCentralConfig);
    console.log('🔧 BOQ Debug - hvCentralConfig details:', acConfiguration?.hvCentralConfig);
    
    // Extract from hvCentralConfig (same as Design Summary)
    const hvCentralConfig = acConfiguration?.hvCentralConfig;
    
    // Extract IDT details (same as Design Summary) 
    const idtCount = hvCentralConfig?.idts?.count || Math.ceil((manualInverterCount || 0) / 2);
    const idtConfig = hvCentralConfig?.idts?.configurations?.[0];
    
    // Extract PT details (same as Design Summary)
    const ptConfig = hvCentralConfig?.powerTransformer;
    
    // Extract cable lengths and cross-sections from selectedCables (same as Design Summary logic)
    const actualLengths = {
      centralToIDT: 100,
      idtToPowerTransformer: 300,
      powerTransformerToPoC: 500
    };
    
    const actualCrossSections = {
      centralToIDT: "1R*185", // Include number of runs in format "4R*120"
      idtToPowerTransformer: "1R*185",
      powerTransformerToPoC: "1R*240"
    };
    
    if (acConfiguration?.selectedCables && acConfiguration.selectedCables.size > 0) {
      console.log('🔧 BOQ Debug - HV Central selectedCables keys:', Array.from(acConfiguration.selectedCables.keys()));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedCables.forEach((cableData: any, key: string) => {
        const lowerKey = key.toLowerCase();
        console.log(`🔧 BOQ Debug - HV Central Cable ${key}:`, {
          length: cableData.length,
          crossSection: cableData.cable?.cross_section_mm2,
          cable: cableData.cable
        });
        
        // Extract number of runs and cross section for proper "4R*120" format
        const numberOfRuns = cableData.numberOfRuns || 1;
        const crossSection = cableData.cable?.cross_section_mm2 || 185;
        const formattedCrossSection = `${numberOfRuns}R*${crossSection}`;
        
        // Fix key matching based on actual keys from console log
        console.log(`🔍 Trying to match key: "${lowerKey}"`);
        
        if (lowerKey.includes('output') && lowerKey.includes('inv') && lowerKey.includes('idt')) {
          // 'output-Inv to IDT (Max 3)' - this is Central to IDT
          actualLengths.centralToIDT = cableData.length || 100;
          actualCrossSections.centralToIDT = formattedCrossSection;
          console.log(`📏 MATCHED Central-to-IDT: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else if (lowerKey.includes('idt_to_transformer') || (lowerKey.includes('idt') && lowerKey.includes('pt'))) {
          // 'idt_to_transformer-IDT → PT (×2)' - this is IDT to PT
          actualLengths.idtToPowerTransformer = cableData.length || 300;
          actualCrossSections.idtToPowerTransformer = formattedCrossSection;
          console.log(`📏 MATCHED IDT-to-PT: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else if (lowerKey.includes('transformer_to_poc') || (lowerKey.includes('pt') && lowerKey.includes('poc'))) {
          // 'transformer_to_poc-PT → PoC' - this is PT to PoC
          actualLengths.powerTransformerToPoC = cableData.length || 500;
          actualCrossSections.powerTransformerToPoC = formattedCrossSection;
          console.log(`📏 MATCHED PT-to-PoC: ${cableData.length}m, ${formattedCrossSection}mm²`);
        } else {
          console.log(`❌ NO MATCH for key: "${key}" (lowercase: "${lowerKey}")`);
        }
      });
    }
    
    // Extract breaker ratings from selectedBreakers (same logic as HV String)
    const extractedBreakerData = {
      // Central Inverter to IDT breakers (the ones showing fallback values)
      centralInverterToIDTType: "VCB",  // cb Type Central Inverter To I D T
      centralInverterToIDTRating: 1250, // cb Rating Central Inverter To I D T A
      // IDT-to-PT and PT-to-PoC breakers 
      idtToPTType: "VCB",  // cb Type I D T To P T
      idtToPTRating: 630,  // cb Rating I D T To P T A
      ptToPoCType: "VCB",  // cb Type P T To Po C
      ptToPoCRating: 630   // cb Rating P T To Po C A
    };
    
    if (acConfiguration?.selectedBreakers && acConfiguration.selectedBreakers.size > 0) {
      console.log('🔧 BOQ Debug - HV Central selectedBreakers keys:', Array.from(acConfiguration.selectedBreakers.keys()));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acConfiguration.selectedBreakers.forEach((breakerInfo: any, key: string) => {
        console.log(`🔧 BOQ Debug - HV Central Breaker ${key}:`, breakerInfo);
        const lowerKey = key.toLowerCase();
        
        // Central Inverter to IDT breaker extraction - Fix key matching based on actual keys
        console.log(`🔍 Trying to match breaker key: "${lowerKey}"`);
        
        if (lowerKey.includes('individual') && lowerKey.includes('inv') && lowerKey.includes('idt')) {
          // 'individual-Inv → IDT (Individual Inverter)' - this is Central to IDT breaker  
          extractedBreakerData.centralInverterToIDTType = breakerInfo.breaker?.breaker_type || "VCB";
          extractedBreakerData.centralInverterToIDTRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 1250;
          console.log(`⚡ MATCHED Central-to-IDT Breaker: ${extractedBreakerData.centralInverterToIDTRating}A ${extractedBreakerData.centralInverterToIDTType}`);
        } 
        // IDT to PT breaker extraction (same as HV String)
        else if (lowerKey.includes('idt_output') || (lowerKey.includes('idt') && lowerKey.includes('output'))) {
          // 'idt_output-IDT 1 - Output Breaker (HV)' - this is IDT-to-PT breaker
          extractedBreakerData.idtToPTType = breakerInfo.breaker?.breaker_type || "VCB";
          extractedBreakerData.idtToPTRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 630;
          console.log(`⚡ MATCHED HV Central IDT-to-PT Breaker: ${extractedBreakerData.idtToPTRating}A ${extractedBreakerData.idtToPTType}`);
        } 
        // PT to PoC breaker extraction (same as HV String)
        else if (lowerKey.includes('power_transformer') || (lowerKey.includes('power') && lowerKey.includes('transformer') && lowerKey.includes('grid'))) {
          // 'power_transformer-Power Transformer - Grid Connection Breaker' - this is PT-to-PoC breaker
          extractedBreakerData.ptToPoCType = breakerInfo.breaker?.breaker_type || "VCB";
          extractedBreakerData.ptToPoCRating = breakerInfo.breaker?.ampacity || breakerInfo.breaker?.current_rating_a || 630;
          console.log(`⚡ MATCHED HV Central PT-to-PoC Breaker: ${extractedBreakerData.ptToPoCRating}A ${extractedBreakerData.ptToPoCType}`);
        }
        else {
          console.log(`❌ NO BREAKER MATCH for key: "${key}" (lowercase: "${lowerKey}")`);
        }
      });
    }
    
    // Calculate currents using formulas provided by user (same as HV String except IDT Input)
    const inverterPowerKW = 1000; // Central inverters are typically 1MW
    const inverterVoltageV = 1500; // Central inverter output voltage
    
    // Formula: inverter Output Current A = inverter Power capacity in kW/(Inverter output Voltage in V*1.732/1000)
    const inverterOutputCurrentA = inverterPowerKW / (inverterVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula for Central: idt Input Current A = (No of Inverters connected to one IDT * Single Inverter output current)
    const invertersPerIDT = Math.ceil((manualInverterCount || 0) / idtCount);
    const idtInputCurrentA = invertersPerIDT * inverterOutputCurrentA;
    
    // CORRECTED Formula: idt Output Current A = (IDT Power rating in MVA * 1000) / (IDT output Voltage * 1.732/1000)
    const idtPowerRatingMVA = idtConfig?.powerRating || 2.5;
    const idtOutputVoltageV = idtConfig?.secondaryVoltage || 11000;
    const idtOutputCurrentA = (idtPowerRatingMVA * 1000) / (idtOutputVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: pt Input Current A = (Total no of IDT * IDT Power rating in MVA * 1000) / (IDT output Voltage * 1.732/1000)
    const ptInputCurrentA = (idtCount * idtPowerRatingMVA * 1000) / (idtOutputVoltageV * 1.732 / 1000);
    
    // CORRECTED Formula: pt Output Current A = (PT Power rating in MVA * 1000) / (PT output Voltage * 1.732/1000)
    const ptPowerRatingMVA = ptConfig?.powerRating || idtPowerRatingMVA; // PT rating often same as IDT rating
    const ptOutputVoltageV = ptConfig?.secondaryVoltage || 33000;
    const ptOutputCurrentA = (ptPowerRatingMVA * 1000) / (ptOutputVoltageV * 1.732 / 1000);
    
    console.log('📋 BOQ Debug - HV Central Current Calculation Formulas Used:');
    console.log('🔌 Inverter Output Current A = Inverter Power (kW) / (Inverter Voltage (V) * 1.732 / 1000)');
    console.log(`   = ${inverterPowerKW} / (${inverterVoltageV} * 1.732 / 1000) = ${inverterOutputCurrentA.toFixed(2)}A`);
    
    console.log('⚡ IDT Input Current A = (No of Inverters connected to one IDT * Single Inverter output current)');
    console.log(`   = (${invertersPerIDT} * ${inverterOutputCurrentA.toFixed(2)}) = ${idtInputCurrentA.toFixed(2)}A`);
    
    console.log('🔄 IDT Output Current A = (IDT Power MVA * 1000) / (IDT Output Voltage V * 1.732/1000)');
    console.log(`   = (${idtPowerRatingMVA} * 1000) / (${idtOutputVoltageV} * 1.732 / 1000) = ${idtOutputCurrentA.toFixed(2)}A`);
    
    console.log('⚡ PT Input Current A = (Total no of IDT * IDT Power MVA * 1000) / (IDT Output Voltage V * 1.732/1000)');
    console.log(`   = (${idtCount} * ${idtPowerRatingMVA} * 1000) / (${idtOutputVoltageV} * 1.732 / 1000) = ${ptInputCurrentA.toFixed(2)}A`);
    
    console.log('🔄 PT Output Current A = (PT Power MVA * 1000) / (PT Output Voltage V * 1.732/1000)');
    console.log(`   = (${ptPowerRatingMVA} * 1000) / (${ptOutputVoltageV} * 1.732 / 1000) = ${ptOutputCurrentA.toFixed(2)}A`);
    
    // Calculate actual total cable lengths (Distance × Runs × Circuits)
    const numberOfInverters = manualInverterCount || 0;
    const numberOfIDTs = idtCount;
    const numberOfPTs = ptConfig ? 1 : 0;
    
    // Extract number of runs from cross-section strings like "5R*240"
    const getRunsFromCrossSection = (crossSectionStr: string): number => {
      const match = crossSectionStr.match(/(\d+)R\*/);
      return match ? parseInt(match[1], 10) : 1;
    };
    
    const inverterToIDTRuns = getRunsFromCrossSection(actualCrossSections.centralToIDT);
    const idtToPTRuns = getRunsFromCrossSection(actualCrossSections.idtToPowerTransformer);
    const ptToPoCRuns = getRunsFromCrossSection(actualCrossSections.powerTransformerToPoC);
    
    // Calculate total cable lengths using the correct formula
    const totalCableLengths = {
      // Inverter to IDT: Distance × Runs × Number of Inverters
      centralToIDT: actualLengths.centralToIDT * inverterToIDTRuns * numberOfInverters,
      // IDT to PT: Distance × Runs × Number of IDTs
      idtToPowerTransformer: actualLengths.idtToPowerTransformer * idtToPTRuns * numberOfIDTs,
      // PT to PoC: Distance × Runs × Number of PTs
      powerTransformerToPoC: actualLengths.powerTransformerToPoC * ptToPoCRuns * numberOfPTs
    };
    
    console.log('🔧 BOQ Debug - HV Central Cable Length Calculations (3-Parameter System):');
    console.log(`   Central Inverter-to-IDT:`);
    console.log(`     1. Distance: ${actualLengths.centralToIDT}m`);
    console.log(`     2. Total per circuit: ${actualLengths.centralToIDT}m × ${inverterToIDTRuns} runs = ${actualLengths.centralToIDT * inverterToIDTRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.centralToIDT * inverterToIDTRuns}m × ${numberOfInverters} inverters = ${totalCableLengths.centralToIDT}m`);
    console.log(`   IDT-to-PT:`);
    console.log(`     1. Distance: ${actualLengths.idtToPowerTransformer}m`);
    console.log(`     2. Total per circuit: ${actualLengths.idtToPowerTransformer}m × ${idtToPTRuns} runs = ${actualLengths.idtToPowerTransformer * idtToPTRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.idtToPowerTransformer * idtToPTRuns}m × ${numberOfIDTs} IDTs = ${totalCableLengths.idtToPowerTransformer}m`);
    console.log(`   PT-to-PoC:`);
    console.log(`     1. Distance: ${actualLengths.powerTransformerToPoC}m`);
    console.log(`     2. Total per circuit: ${actualLengths.powerTransformerToPoC}m × ${ptToPoCRuns} runs = ${actualLengths.powerTransformerToPoC * ptToPoCRuns}m`);
    console.log(`     3. Complete length: ${actualLengths.powerTransformerToPoC * ptToPoCRuns}m × ${numberOfPTs} PTs = ${totalCableLengths.powerTransformerToPoC}m`);
    
    console.log('🔧 BOQ Debug - HV Central Transformer Ratings:');
    console.log(`   Single IDT Rating: ${idtPowerRatingMVA} MVA (Impedance: 6%)`);
    console.log(`   Single PT Rating: ${ptPowerRatingMVA} MVA (Impedance: 6%)`);
    
    console.log('🔧 BOQ Debug - HV Central Final Extracted Values:');
    console.log(`   Original Distances:`, actualLengths);
    console.log(`   Total Cable Lengths:`, totalCableLengths);
    console.log(`   Cable Cross-Sections:`, actualCrossSections);
    console.log('🔧 BOQ Debug - HV Central extracted breakers:');
    console.log(`   Central-to-IDT: ${extractedBreakerData.centralInverterToIDTRating}A ${extractedBreakerData.centralInverterToIDTType}`);
    console.log(`   IDT-to-PT: ${extractedBreakerData.idtToPTRating}A ${extractedBreakerData.idtToPTType}`);
    console.log(`   PT-to-PoC: ${extractedBreakerData.ptToPoCRating}A ${extractedBreakerData.ptToPoCType}`);
    
    console.log('🔧 BOQ Debug - HV Central extracted data:', {
      idtCount,
      idtConfig: idtConfig ? Object.keys(idtConfig) : 'null',
      ptConfig: ptConfig ? Object.keys(ptConfig) : 'null', 
      actualLengths,
      extractedBreakerData,
      calculatedCurrents: {
        inverterOutputCurrentA: inverterOutputCurrentA.toFixed(2),
        idtInputCurrentA: idtInputCurrentA.toFixed(2),
        idtOutputCurrentA: idtOutputCurrentA.toFixed(2),
        ptInputCurrentA: ptInputCurrentA.toFixed(2),
        ptOutputCurrentA: ptOutputCurrentA.toFixed(2)
      }
    });
    
    const hvCentralInputs: HVCentralInverterInputs = {
      numberOfCentralInverters: manualInverterCount || 0,
      
      // IDT Details (extracted from hvCentralConfig like Design Summary)
      quantityOfIDTs: idtCount,
      singleIDTRatingMVA: idtPowerRatingMVA, // Single IDT rating in MVA
      idtTransformerImpedancePercentage: 6, // IDT transformer impedance (default 6%)
      idtInputVoltageV: idtConfig?.primaryVoltage || transformerData?.idtInputVoltage || inverterVoltageV,
      idtInputCurrentA: Math.round(idtInputCurrentA * 100) / 100, // Use calculated formula
      idtOutputVoltageV: idtOutputVoltageV,
      idtOutputCurrentA: Math.round(idtOutputCurrentA * 100) / 100, // Use calculated formula
      
      // PT Details (extracted from hvCentralConfig like Design Summary)
      quantityOfPTs: ptConfig ? 1 : 0,
      singlePTRatingMVA: ptPowerRatingMVA, // Power Transformer rating in MVA
      ptTransformerImpedancePercentage: 6, // PT transformer impedance (default 6%)
      ptInputVoltageV: ptConfig?.primaryVoltage || transformerData?.ptInputVoltage || idtOutputVoltageV,
      ptInputCurrentA: Math.round(ptInputCurrentA * 100) / 100, // Use calculated formula
      ptOutputVoltageV: ptOutputVoltageV,
      ptOutputCurrentA: Math.round(ptOutputCurrentA * 100) / 100, // Use calculated formula
      
      // Central Inverter to IDT Cable Parameters (3 separate values)
      distanceInverterToIDTM: actualLengths.centralToIDT, // Original distance
      totalCableLengthPerInverterToIDTM: actualLengths.centralToIDT * inverterToIDTRuns, // Distance × Runs
      completeCableLengthInverterToIDTM: totalCableLengths.centralToIDT, // Total for all inverters
      cableSizeInverterToIDTMm2: actualCrossSections.centralToIDT,
      
      // IDT to PT Cable Parameters (3 separate values)
      distanceIDTToPTM: actualLengths.idtToPowerTransformer, // Original distance
      totalCableLengthPerIDTToPTM: actualLengths.idtToPowerTransformer * idtToPTRuns, // Distance × Runs
      completeCableLengthIDTToPTM: totalCableLengths.idtToPowerTransformer, // Total for all IDTs
      cableSizeIDTToPTMm2: actualCrossSections.idtToPowerTransformer,
      
      // PT to PoC Cable Parameters (3 separate values)
      distancePTToPoCM: actualLengths.powerTransformerToPoC, // Original distance
      totalCableLengthPerPTToPoCM: actualLengths.powerTransformerToPoC * ptToPoCRuns, // Distance × Runs
      completeCableLengthPTToPoCM: totalCableLengths.powerTransformerToPoC, // Total for all PTs
      cableSizePTToPoCMm2: actualCrossSections.powerTransformerToPoC,
      
      // Circuit Breaker Details (extracted from selectedBreakers like Design Summary)
      cbTypeCentralInverterToIDT: extractedBreakerData.centralInverterToIDTType,
      cbRatingCentralInverterToIDTA: extractedBreakerData.centralInverterToIDTRating,
      cbTypeIDTToPT: extractedBreakerData.idtToPTType, 
      cbRatingIDTToPTA: extractedBreakerData.idtToPTRating,
      cbTypePTToPoC: extractedBreakerData.ptToPoCType,
      cbRatingPTToPoCA: extractedBreakerData.ptToPoCRating
    };

    this.parameters.hvCentralInverter = hvCentralInputs;
    return hvCentralInputs;
  }

  // Get complete BOQ parameters for AI LLM prompt
  public getCompleteBOQParameters(calculationType: 'LV' | 'HV_String' | 'HV_Central'): BOQParameters {
    if (!this.parameters.dcInputs) {
      throw new Error('DC inputs not extracted yet');
    }
    if (!this.parameters.lightningProtection) {
      throw new Error('Lightning protection inputs not extracted yet');
    }
    if (!this.parameters.acCommon) {
      throw new Error('AC common inputs not extracted yet');
    }

    const systemType = this.parameters.acCommon.systemType;
    const isHVSystem = systemType === 'HV_Connection';
    
    console.log('🔍 BOQ Debug - Complete parameters for system type:', systemType, isHVSystem ? '(HV System)' : '(LV System)');
    
    const completeParameters: BOQParameters = {
      dcInputs: this.parameters.dcInputs,
      lightningProtection: this.parameters.lightningProtection,
      acCommon: this.parameters.acCommon,
      substation: getDefaultSubstationInputs(systemType),
      fixedPreferences: DEFAULT_FIXED_PREFERENCES,
      timestamp: new Date(),
      sessionId: this.sessionId,
      calculationType
    };

    // Only include transformer earthing for HV systems (not for LV)
    if (isHVSystem) {
      completeParameters.transformerEarthing = {
        ...DEFAULT_TRANSFORMER_EARTHING,
        numberOfIDTs: this.parameters.hvStringInverter?.quantityOfIDTs || 
                     this.parameters.hvCentralInverter?.quantityOfIDTs || 0,
        numberOfPTs: 1 // Always 1 for HV systems
      };
    }

    // Add connection-specific parameters
    if (calculationType === 'LV' && this.parameters.lvConnection) {
      completeParameters.lvConnection = this.parameters.lvConnection;
    } else if (calculationType === 'HV_String' && this.parameters.hvStringInverter) {
      completeParameters.hvStringInverter = this.parameters.hvStringInverter;
    } else if (calculationType === 'HV_Central' && this.parameters.hvCentralInverter) {
      completeParameters.hvCentralInverter = this.parameters.hvCentralInverter;
    }

    return completeParameters;
  }

  // Format parameters for AI LLM prompt
  public formatForAIPrompt(calculationType: 'LV' | 'HV_String' | 'HV_Central'): string {
    const params = this.getCompleteBOQParameters(calculationType);
    
    let prompt = `# Solar PV BOQ Calculation Parameters\n\n`;
    prompt += `**System Type:** ${params.calculationType}\n`;
    prompt += `**Calculation Date:** ${params.timestamp.toISOString()}\n`;
    prompt += `**Session ID:** ${params.sessionId}\n\n`;

    // DC Side Inputs
    prompt += `## 1. DC Side Inputs\n`;
    prompt += `- Structure Type: ${params.dcInputs.structureType}\n`;
    prompt += `- Module Width: ${params.dcInputs.moduleWidthMm}mm\n`;
    prompt += `- Module Length: ${params.dcInputs.moduleLengthMm}mm\n`;
    prompt += `- Total Number of Tables: ${params.dcInputs.totalNumberOfTables}\n`;
    prompt += `- Module Layout per Table: ${params.dcInputs.moduleLayoutPerTable}\n`;
    if (params.dcInputs.totalNumberOfRows) {
      prompt += `- Total Number of Rows (Ballasted): ${params.dcInputs.totalNumberOfRows}\n`;
    }
    prompt += `- String Short-circuit Current: ${params.dcInputs.stringShortCircuitCurrentA}A\n`;
    prompt += `- Total Strings per Inverter: ${params.dcInputs.totalNumberOfStringsPerInverter}\n`;
    prompt += `- Edge #1 Length: ${params.dcInputs.edge1LengthM}m\n`;
    prompt += `- Edge #2 Length: ${params.dcInputs.edge2LengthM}m\n`;
    prompt += `- Edge #3 Length: ${params.dcInputs.edge3LengthM}m\n`;
    prompt += `- Edge #4 Length: ${params.dcInputs.edge4LengthM}m\n\n`;

    // Lightning Protection
    prompt += `## 2. Lightning Protection Inputs\n`;
    prompt += `- Total Plant Area: ${params.lightningProtection.totalPlantAreaM2}m²\n`;
    prompt += `- Soil Type: ${params.lightningProtection.soilType}\n\n`;

    // AC Common
    prompt += `## 3. AC Side - Common Inputs\n`;
    prompt += `- System Type: ${params.acCommon.systemType}\n`;
    prompt += `- Number of Inverters: ${params.acCommon.numberOfInverters}\n\n`;

    // Connection-specific inputs
    if (calculationType === 'LV' && params.lvConnection) {
      prompt += `## 4. AC Side - LV Connection Type\n`;
      prompt += `- Inverter Output Voltage: ${params.lvConnection.inverterOutputVoltageV}V\n`;
      prompt += `- Inverter Output Current: ${params.lvConnection.inverterOutputCurrentA}A per inverter\n`;
      
      prompt += `\n### LV Combiner Panel Details:\n`;
      prompt += `- Number of Inverters Connected to LV Combiner: ${params.lvConnection.numberOfInvertersConnectedToLVCombiner}\n`;
      prompt += `- LV Combiner Panel Output Current: ${params.lvConnection.lvCombinerPanelOutputCurrentA}A (${params.lvConnection.numberOfInvertersConnectedToLVCombiner} × ${params.lvConnection.inverterOutputCurrentA}A)\n`;
      
      prompt += `\n### Cable Details:\n`;
      prompt += `- Distance Inverter to Combiner: ${params.lvConnection.distanceInverterToCombinerM}m\n`;
      prompt += `- AC Cable Cross-section (Inv→Combiner): ${params.lvConnection.acCableCrossSectionInverterToCombinerMm2}mm²\n`;
      prompt += `- Distance Combiner to PoC: ${params.lvConnection.distanceCombinerToPoCM}m\n`;
      prompt += `- AC Cable Cross-section (Combiner→PoC): ${params.lvConnection.acCableCrossSectionCombinerToPoCMm2}mm²\n`;
      
      prompt += `\n### Breaker Details:\n`;
      prompt += `- Combiner Incomer Breaker Rating: ${params.lvConnection.combinerIncomeBreakerRatingA}A\n`;
      prompt += `- Combiner Outgoing Breaker Rating: ${params.lvConnection.combinerOutgoingBreakerRatingA}A\n\n`;
    }

    if (calculationType === 'HV_String' && params.hvStringInverter) {
      prompt += `## 4. AC Side - HV Connection + String Inverter\n`;
      prompt += `- Number of String Inverters: ${params.hvStringInverter.numberOfStringInverters}\n`;
      prompt += `- Inverter Output Voltage: ${params.hvStringInverter.inverterOutputVoltageV}V\n`;
      prompt += `- Inverter Output Current: ${params.hvStringInverter.inverterOutputCurrentA}A per inverter\n`;
      
      prompt += `\n### IDT Details:\n`;
      prompt += `- Quantity of IDTs: ${params.hvStringInverter.quantityOfIDTs}\n`;
      prompt += `- IDT Input Voltage: ${params.hvStringInverter.idtInputVoltageV}V\n`;
      prompt += `- IDT Output Voltage: ${params.hvStringInverter.idtOutputVoltageV}V\n`;
      
      prompt += `\n### PT Details:\n`;
      prompt += `- Quantity of PTs: ${params.hvStringInverter.quantityOfPTs}\n`;
      prompt += `- PT Input Voltage: ${params.hvStringInverter.ptInputVoltageV}V\n`;
      prompt += `- PT Output Voltage: ${params.hvStringInverter.ptOutputVoltageV}V\n`;
      
      prompt += `\n### Cable Details:\n`;
      prompt += `- Distance Inverter to Combiner: ${params.hvStringInverter.distanceInverterToCombinerM}m\n`;
      prompt += `- Distance Combiner to IDT: ${params.hvStringInverter.distanceCombinerToIDTM}m\n`;
      prompt += `- Distance IDT to PT: ${params.hvStringInverter.distanceIDTToPTM}m\n`;
      prompt += `- Distance PT to PoC: ${params.hvStringInverter.distancePTToPoCM}m\n`;
      
      prompt += `\n### Transformer Details:\n`;
      prompt += `- IDT MVA Rating: ${params.hvStringInverter.singleIDTRatingMVA}MVA (Impedance: ${params.hvStringInverter.idtTransformerImpedancePercentage}%)\n`;
      prompt += `- PT MVA Rating: ${params.hvStringInverter.singlePTRatingMVA}MVA (Impedance: ${params.hvStringInverter.ptTransformerImpedancePercentage}%)\n\n`;
    }

    if (calculationType === 'HV_Central' && params.hvCentralInverter) {
      prompt += `## 4. AC Side - HV Connection + Central Inverter\n`;
      prompt += `- Number of Central Inverters: ${params.hvCentralInverter.numberOfCentralInverters}\n`;
      
      prompt += `\n### IDT Details:\n`;
      prompt += `- Quantity of IDTs: ${params.hvCentralInverter.quantityOfIDTs}\n`;
      prompt += `- IDT Input Voltage: ${params.hvCentralInverter.idtInputVoltageV}V\n`;
      prompt += `- IDT Output Voltage: ${params.hvCentralInverter.idtOutputVoltageV}V\n`;
      
      prompt += `\n### PT Details:\n`;
      prompt += `- Quantity of PTs: ${params.hvCentralInverter.quantityOfPTs}\n`;
      prompt += `- PT Input Voltage: ${params.hvCentralInverter.ptInputVoltageV}V\n`;
      prompt += `- PT Output Voltage: ${params.hvCentralInverter.ptOutputVoltageV}V\n\n`;
    }

    // Substation
    prompt += `## 7. Substation Inputs\n`;
    prompt += `- Substation/Electrical Room Grid Size: ${params.substation.substationElectricalRoomGridSizeM2}m² (${Math.sqrt(params.substation.substationElectricalRoomGridSizeM2)}×${Math.sqrt(params.substation.substationElectricalRoomGridSizeM2)}m)\n`;
    prompt += `- Target Earthing Resistance: ${params.substation.targetEarthingResistanceOhms}Ω\n\n`;

    // Fixed Preferences
    prompt += `## 8. Fixed Preferences\n`;
    prompt += `- String Side Protective Device: ${params.fixedPreferences.stringSideProtectiveDevice}\n`;
    prompt += `- Preferred Material: ${params.fixedPreferences.preferredMaterial}\n`;
    prompt += `- Preferred Insulation of Earthing Cables: ${params.fixedPreferences.preferredInsulationOfEarthingCables}\n`;
    prompt += `- Rail Bonding Mode: ${params.fixedPreferences.railBondingMode}\n`;
    prompt += `- Structure Drop Rule: ${params.fixedPreferences.structureDropRule}\n\n`;

    // Transformer Earthing - Only for HV systems
    if (params.transformerEarthing) {
      prompt += `## 9. Transformer Earthing Inputs (HV Systems Only)\n`;
      prompt += `- Number of IDTs: ${params.transformerEarthing.numberOfIDTs}\n`;
      prompt += `- Number of PTs: ${params.transformerEarthing.numberOfPTs}\n`;
      prompt += `- Transformer Earthing: ${params.transformerEarthing.transformerEarthing}\n\n`;
    }

    return prompt;
  }

  // Clear session data
  public clearSession(): void {
    this.parameters = {};
    this.sessionId = `boq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current session parameters (for debugging)
  public getCurrentParameters(): Partial<BOQParameters> {
    // Include substation, fixedPreferences, and transformerEarthing in current parameters
    const systemType = this.parameters.acCommon?.systemType || 'LV_Connection';
    const isHVSystem = systemType === 'HV_Connection';
    
    console.log('🔍 BOQ Debug - System type detected:', systemType, isHVSystem ? '(HV System)' : '(LV System)');
    
    const currentParams: Partial<BOQParameters> = { 
      ...this.parameters,
      substation: getDefaultSubstationInputs(systemType),
      fixedPreferences: DEFAULT_FIXED_PREFERENCES,
      timestamp: new Date(),
      sessionId: this.sessionId,
      calculationType: systemType === 'LV_Connection' ? 'LV' : 
                      (this.parameters.hvStringInverter ? 'HV_String' : 'HV_Central')
    };

    // Only include transformer earthing for HV systems (not for LV)
    if (isHVSystem) {
      currentParams.transformerEarthing = {
        ...DEFAULT_TRANSFORMER_EARTHING,
        numberOfIDTs: this.parameters.hvStringInverter?.quantityOfIDTs || 
                     this.parameters.hvCentralInverter?.quantityOfIDTs || 0,
        numberOfPTs: 1 // Always 1 for HV systems
      };
      console.log('🔍 BOQ Debug - Including transformer earthing for HV system:', currentParams.transformerEarthing);
    } else {
      console.log('🔍 BOQ Debug - Excluding transformer earthing for LV system (no transformers)');
    }

    return currentParams;
  }
}

// Export singleton instance
export const boqParameterManager = BOQParameterManager.getInstance();
