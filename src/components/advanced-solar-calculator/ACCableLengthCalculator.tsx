import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Cable, Calculator, Download, Zap, Info, CheckCircle, AlertTriangle } from "lucide-react";
import type { ACConfiguration } from "./ACSideConfiguration";

interface ACCableLengthCalculatorProps {
  acConfiguration: ACConfiguration;
  inverterCount: number;
  systemSize: number; // kW
  onCableLengthsChange?: (cableLengths: ACCableLengths) => void;
}

export interface ACCableLengths {
  // LV Connection Type
  lv: {
    inverterToLVPanel: {
      lengthPerInverter: number; // meters per inverter
      totalLength: number; // total length for all inverters
      inverterCount: number;
    };
    lvPanelToPoC: {
      length: number; // meters
    };
  };
  
  // HV Connection Type
  hv: {
    // For String Inverters
    string: {
      inverterToLVPanel: {
        lengthPerInverter: number; // meters per inverter
        totalLength: number; // total length for all inverters
        inverterCount: number;
      };
      lvPanelToIDT: {
        lengthPerPanel: number; // meters per LV panel
        totalLength: number; // total length for all panels
        panelCount: number;
      };
      idtToPowerTransformer: {
        lengthPerIDT: number; // meters per IDT
        totalLength: number; // total length for all IDTs
        idtCount: number;
      };
      powerTransformerToPoC: {
        length: number; // meters
      };
    };
    
    // For Central Inverters
    central: {
      inverterToIDT: {
        lengthPerInverter: number; // meters per inverter
        totalLength: number; // total length for all inverters
        inverterCount: number;
      };
      idtToPowerTransformer: {
        lengthPerIDT: number; // meters per IDT
        totalLength: number; // total length for all IDTs
        idtCount: number;
      };
      powerTransformerToPoC: {
        length: number; // meters
      };
    };
  };
  
  // Total lengths summary
  totalACCableLength: number;
  connectionType: 'LV' | 'HV';
  inverterType: 'STRING' | 'CENTRAL';
}

const ACCableLengthCalculator: React.FC<ACCableLengthCalculatorProps> = ({
  acConfiguration,
  inverterCount,
  systemSize,
  onCableLengthsChange
}) => {
  // State for cable lengths (meters)
  const [cableLengths, setCableLengths] = useState({
    // LV Configuration
    inverterToLVPanel: 50, // Default 50m per inverter
    lvPanelToPoC: 100, // Default 100m
    
    // HV Configuration - String Inverters
    inverterToLVPanelHV: 50, // Default 50m per inverter
    lvPanelToIDT: 200, // Default 200m per LV panel
    idtToPowerTransformer: 300, // Default 300m per IDT
    powerTransformerToPoC: 500, // Default 500m
    
    // HV Configuration - Central Inverters
    inverterToIDT: 100, // Default 100m per central inverter
  });

  // Calculate comprehensive cable lengths based on configuration
  const calculatedLengths = useMemo((): ACCableLengths => {
    const connectionType = acConfiguration.connectionType;
    const inverterType = acConfiguration.inverterType;
    
    let result: ACCableLengths = {
      lv: {
        inverterToLVPanel: {
          lengthPerInverter: 0,
          totalLength: 0,
          inverterCount: 0
        },
        lvPanelToPoC: {
          length: 0
        }
      },
      hv: {
        string: {
          inverterToLVPanel: {
            lengthPerInverter: 0,
            totalLength: 0,
            inverterCount: 0
          },
          lvPanelToIDT: {
            lengthPerPanel: 0,
            totalLength: 0,
            panelCount: 0
          },
          idtToPowerTransformer: {
            lengthPerIDT: 0,
            totalLength: 0,
            idtCount: 0
          },
          powerTransformerToPoC: {
            length: 0
          }
        },
        central: {
          inverterToIDT: {
            lengthPerInverter: 0,
            totalLength: 0,
            inverterCount: 0
          },
          idtToPowerTransformer: {
            lengthPerIDT: 0,
            totalLength: 0,
            idtCount: 0
          },
          powerTransformerToPoC: {
            length: 0
          }
        }
      },
      totalACCableLength: 0,
      connectionType,
      inverterType
    };

    if (connectionType === 'LV') {
      // LV Connection Type Calculations
      result.lv.inverterToLVPanel = {
        lengthPerInverter: cableLengths.inverterToLVPanel,
        totalLength: cableLengths.inverterToLVPanel * inverterCount,
        inverterCount
      };
      
      result.lv.lvPanelToPoC = {
        length: cableLengths.lvPanelToPoC
      };
      
      result.totalACCableLength = result.lv.inverterToLVPanel.totalLength + result.lv.lvPanelToPoC.length;
      
    } else if (connectionType === 'HV') {
      if (inverterType === 'STRING') {
        // HV String Inverter Configuration
        const lvPanelCount = acConfiguration.hvStringConfig?.lvACCombinerPanels.count || 1;
        const idtCount = acConfiguration.hvStringConfig?.idts.count || 1;
        
        result.hv.string.inverterToLVPanel = {
          lengthPerInverter: cableLengths.inverterToLVPanelHV,
          totalLength: cableLengths.inverterToLVPanelHV * inverterCount,
          inverterCount
        };
        
        result.hv.string.lvPanelToIDT = {
          lengthPerPanel: cableLengths.lvPanelToIDT,
          totalLength: cableLengths.lvPanelToIDT * lvPanelCount,
          panelCount: lvPanelCount
        };
        
        result.hv.string.idtToPowerTransformer = {
          lengthPerIDT: cableLengths.idtToPowerTransformer,
          totalLength: cableLengths.idtToPowerTransformer * idtCount,
          idtCount
        };
        
        result.hv.string.powerTransformerToPoC = {
          length: cableLengths.powerTransformerToPoC
        };
        
        result.totalACCableLength = 
          result.hv.string.inverterToLVPanel.totalLength +
          result.hv.string.lvPanelToIDT.totalLength +
          result.hv.string.idtToPowerTransformer.totalLength +
          result.hv.string.powerTransformerToPoC.length;
          
      } else if (inverterType === 'CENTRAL') {
        // HV Central Inverter Configuration
        const idtCount = acConfiguration.hvCentralConfig?.idts.count || 1;
        
        result.hv.central.inverterToIDT = {
          lengthPerInverter: cableLengths.inverterToIDT,
          totalLength: cableLengths.inverterToIDT * inverterCount,
          inverterCount
        };
        
        result.hv.central.idtToPowerTransformer = {
          lengthPerIDT: cableLengths.idtToPowerTransformer,
          totalLength: cableLengths.idtToPowerTransformer * idtCount,
          idtCount
        };
        
        result.hv.central.powerTransformerToPoC = {
          length: cableLengths.powerTransformerToPoC
        };
        
        result.totalACCableLength = 
          result.hv.central.inverterToIDT.totalLength +
          result.hv.central.idtToPowerTransformer.totalLength +
          result.hv.central.powerTransformerToPoC.length;
      }
    }

    return result;
  }, [acConfiguration, inverterCount, cableLengths]);

  // Notify parent component when cable lengths change
  useEffect(() => {
    if (onCableLengthsChange) {
      onCableLengthsChange(calculatedLengths);
    }
  }, [calculatedLengths, onCableLengthsChange]);

  const handleLengthChange = (key: string, value: number) => {
    setCableLengths(prev => ({
      ...prev,
      [key]: Math.max(1, value) // Ensure minimum 1 meter
    }));
  };

  const exportCableLengths = () => {
    const data = {
      systemInfo: {
        systemSize,
        inverterCount,
        connectionType: acConfiguration.connectionType,
        inverterType: acConfiguration.inverterType,
        timestamp: new Date().toISOString()
      },
      cableLengths: calculatedLengths
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ac-cable-lengths-${acConfiguration.connectionType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-t-lg">
        <CardTitle className="text-white flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Cable className="h-6 w-6 text-white" />
          </div>
          AC Cable Length Calculator
          <Badge className="bg-white/20 text-white border-0">
            {acConfiguration.connectionType} - {acConfiguration.inverterType}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Configuration Summary */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Connection Type:</span>
              <div className="font-semibold text-blue-700">{acConfiguration.connectionType}</div>
            </div>
            <div>
              <span className="text-gray-600">Inverter Type:</span>
              <div className="font-semibold text-blue-700">{acConfiguration.inverterType}</div>
            </div>
            <div>
              <span className="text-gray-600">Inverter Count:</span>
              <div className="font-semibold text-blue-700">{inverterCount}</div>
            </div>
            <div>
              <span className="text-gray-600">System Size:</span>
              <div className="font-semibold text-blue-700">{systemSize.toFixed(1)} kW</div>
            </div>
          </div>
        </div>

        {/* LV Connection Configuration */}
        {acConfiguration.connectionType === 'LV' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold text-gray-800">LV Connection Cable Lengths</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <Label className="text-sm font-medium text-gray-700">
                  Inverter to LV AC Panel (per inverter)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={cableLengths.inverterToLVPanel}
                  onChange={(e) => handleLengthChange('inverterToLVPanel', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.lv.inverterToLVPanel.totalLength}m 
                  ({inverterCount} inverters × {cableLengths.inverterToLVPanel}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-cyan-200">
                <Label className="text-sm font-medium text-gray-700">
                  LV AC Panel to PoC
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="2000"
                  value={cableLengths.lvPanelToPoC}
                  onChange={(e) => handleLengthChange('lvPanelToPoC', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Single run: {cableLengths.lvPanelToPoC}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HV String Inverter Configuration */}
        {acConfiguration.connectionType === 'HV' && acConfiguration.inverterType === 'STRING' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">HV String Inverter Cable Lengths</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <Label className="text-sm font-medium text-gray-700">
                  Inverter to LV AC Panel (per inverter)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={cableLengths.inverterToLVPanelHV}
                  onChange={(e) => handleLengthChange('inverterToLVPanelHV', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.hv.string.inverterToLVPanel.totalLength}m 
                  ({inverterCount} inverters × {cableLengths.inverterToLVPanelHV}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <Label className="text-sm font-medium text-gray-700">
                  LV AC Panel to IDT (per panel)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="2000"
                  value={cableLengths.lvPanelToIDT}
                  onChange={(e) => handleLengthChange('lvPanelToIDT', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.hv.string.lvPanelToIDT.totalLength}m 
                  ({calculatedLengths.hv.string.lvPanelToIDT.panelCount} panels × {cableLengths.lvPanelToIDT}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <Label className="text-sm font-medium text-gray-700">
                  IDT to Power Transformer (per IDT)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="2000"
                  value={cableLengths.idtToPowerTransformer}
                  onChange={(e) => handleLengthChange('idtToPowerTransformer', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.hv.string.idtToPowerTransformer.totalLength}m 
                  ({calculatedLengths.hv.string.idtToPowerTransformer.idtCount} IDTs × {cableLengths.idtToPowerTransformer}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <Label className="text-sm font-medium text-gray-700">
                  Power Transformer to PoC
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="3000"
                  value={cableLengths.powerTransformerToPoC}
                  onChange={(e) => handleLengthChange('powerTransformerToPoC', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Single run: {cableLengths.powerTransformerToPoC}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HV Central Inverter Configuration */}
        {acConfiguration.connectionType === 'HV' && acConfiguration.inverterType === 'CENTRAL' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">HV Central Inverter Cable Lengths</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <Label className="text-sm font-medium text-gray-700">
                  Inverter to IDT (per inverter)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={cableLengths.inverterToIDT}
                  onChange={(e) => handleLengthChange('inverterToIDT', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.hv.central.inverterToIDT.totalLength}m 
                  ({inverterCount} inverters × {cableLengths.inverterToIDT}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <Label className="text-sm font-medium text-gray-700">
                  IDT to Power Transformer (per IDT)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="2000"
                  value={cableLengths.idtToPowerTransformer}
                  onChange={(e) => handleLengthChange('idtToPowerTransformer', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Total: {calculatedLengths.hv.central.idtToPowerTransformer.totalLength}m 
                  ({calculatedLengths.hv.central.idtToPowerTransformer.idtCount} IDTs × {cableLengths.idtToPowerTransformer}m)
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-200 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">
                  Power Transformer to PoC
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="3000"
                  value={cableLengths.powerTransformerToPoC}
                  onChange={(e) => handleLengthChange('powerTransformerToPoC', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <div className="mt-2 text-xs text-gray-600">
                  Single run: {cableLengths.powerTransformerToPoC}m
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Total Cable Length Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Total AC Cable Length</h3>
                <p className="text-green-600 text-sm">All AC circuits combined</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-800">
                {calculatedLengths.totalACCableLength.toLocaleString()}m
              </div>
              <div className="text-green-600 text-sm">
                {(calculatedLengths.totalACCableLength / 1000).toFixed(2)} km
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button onClick={exportCableLengths} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Cable Lengths
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ACCableLengthCalculator;
