import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SolarPanel, SolarInverter, fetchSolarPanels, fetchSolarInverters, fetchPanelManufacturers, fetchInverterManufacturers } from "@/services/solarComponentsService";
import { toast } from "sonner";
import { Component as PanelIcon, Zap, Ruler, Lightbulb, Search, Activity, Box } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ComponentSelectorProps {
  onPanelSelect: (panel: SolarPanel | null) => void;
  selectedPanel: SolarPanel | null;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  onPanelSelect,
  selectedPanel
}) => {
  // States for manufacturer selection
  const [panelManufacturers, setPanelManufacturers] = useState<string[]>([]);
  
  // States for selected manufacturers
  const [selectedPanelManufacturer, setSelectedPanelManufacturer] = useState<string>("");
  
  // States for components lists
  const [availablePanels, setAvailablePanels] = useState<SolarPanel[]>([]);
  
  // Loading states
  const [loadingPanelManufacturers, setLoadingPanelManufacturers] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(false);

  // Fetch manufacturers on initial load
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        setLoadingPanelManufacturers(true);
        
        const panelMfrs = await fetchPanelManufacturers();
        
        setPanelManufacturers(panelMfrs);
      } catch (error) {
        console.error("Failed to load manufacturers:", error);
        toast.error("Failed to load component manufacturers");
      } finally {
        setLoadingPanelManufacturers(false);
      }
    };
    
    loadManufacturers();
  }, []);

  // Load panels when manufacturer is selected
  useEffect(() => {
    const loadPanels = async () => {
      if (!selectedPanelManufacturer) {
        setAvailablePanels([]);
        return;
      }
      
      try {
        setLoadingPanels(true);
        const panels = await fetchSolarPanels("", selectedPanelManufacturer);
        setAvailablePanels(panels);
      } catch (error) {
        console.error("Failed to load panels:", error);
        toast.error("Failed to load solar panels");
      } finally {
        setLoadingPanels(false);
      }
    };
    
    loadPanels();
  }, [selectedPanelManufacturer]);

  // Handle panel selection
  const handlePanelSelect = (panelId: string) => {
    const panel = availablePanels.find(p => p.id === panelId);
    if (panel) {
      onPanelSelect(panel);
    }
  };

  // Generate IV curve data for selected panel
  const generateIVCurveData = (panel: SolarPanel) => {
    if (!panel.vmp_v || !panel.imp_a || !panel.voc_v || !panel.isc_a) return [];
    
    const data = [];
    const points = 50;
    
    for (let i = 0; i <= points; i++) {
      const voltage = (panel.voc_v * i) / points;
      let current;
      
      if (voltage <= panel.vmp_v) {
        // Linear approximation from Isc to Imp
        current = panel.isc_a - ((panel.isc_a - panel.imp_a) * voltage) / panel.vmp_v;
      } else {
        // Exponential decay from Imp to 0
        const factor = (voltage - panel.vmp_v) / (panel.voc_v - panel.vmp_v);
        current = panel.imp_a * Math.exp(-3 * factor);
      }
      
      data.push({
        voltage: parseFloat(voltage.toFixed(2)),
        current: parseFloat(Math.max(0, current).toFixed(3)),
        power: parseFloat((voltage * Math.max(0, current)).toFixed(2))
      });
    }
    
    return data;
  };

  const ivCurveData = selectedPanel ? generateIVCurveData(selectedPanel) : [];

  return (
    <div className="space-y-6">
      {/* Main Component Selection Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
              <PanelIcon className="h-6 w-6" />
            </div>
            Solar Panel Selection
          </CardTitle>
          <p className="text-muted-foreground mt-2">Choose your high-performance photovoltaic module</p>
        </CardHeader>
        <CardContent className="pt-0 relative z-10">
          <div className="grid grid-cols-1 gap-6">
            {/* Panel Selection */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    Manufacturer
                  </label>
                <Select
                  value={selectedPanelManufacturer}
                  onValueChange={setSelectedPanelManufacturer}
                >
                    <SelectTrigger className="w-full h-12 border-2 border-blue-200/50 bg-white/70 backdrop-blur-sm hover:border-blue-400 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-300 hover:shadow-lg font-medium">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md rounded-lg border-2">
                    {loadingPanelManufacturers ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      panelManufacturers.map(manufacturer => (
                          <SelectItem key={manufacturer} value={manufacturer} className="hover:bg-blue-50">
                          {manufacturer}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    Model
                  </label>
                <Select
                  value={selectedPanel?.id || ""}
                  onValueChange={handlePanelSelect}
                  disabled={!selectedPanelManufacturer || loadingPanels}
                >
                    <SelectTrigger className="w-full h-12 border-2 border-indigo-200/50 bg-white/70 backdrop-blur-sm hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 rounded-lg transition-all duration-300 hover:shadow-lg font-medium disabled:opacity-50">
                    <SelectValue placeholder="Select panel model" />
                  </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md rounded-lg border-2">
                    {loadingPanels ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : availablePanels.length > 0 ? (
                      <SelectGroup>
                        {availablePanels.map(panel => (
                            <SelectItem key={panel.id} value={panel.id} className="hover:bg-blue-50">
                              <div className="flex items-center justify-between w-full">
                                <span>{panel.model}</span>
                                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                                  {panel.nominal_power_w}W
                                </Badge>
                              </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : selectedPanelManufacturer ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                        No panels found for this manufacturer
                      </div>
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                        Select a manufacturer first
                      </div>
                    )}
                  </SelectContent>
                </Select>
                </div>
              </div>

              {/* Selected Panel Details */}
              {selectedPanel && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Panel Specifications */}
                  <Card className="border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-teal-50 h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                        <Lightbulb className="h-5 w-5" />
                        Panel Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                            <p className="font-bold text-lg text-slate-800">{selectedPanel.manufacturer} {selectedPanel.model}</p>
                            <Badge variant="outline" className="mt-2 bg-white/70">
                        {selectedPanel.technology || "Standard"}
                      </Badge>
                    </div>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg px-3 py-1">
                            {selectedPanel.nominal_power_w}W
                          </Badge>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vmp / Imp</p>
                              <p className="font-semibold">{selectedPanel.vmp_v}V / {selectedPanel.imp_a}A</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60">
                            <Ruler className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Dimensions</p>
                              <p className="font-semibold">{selectedPanel.module_length}×{selectedPanel.module_width}mm</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 col-span-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Module Efficiency</p>
                              <p className="font-semibold">{selectedPanel.efficiency_percent?.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 col-span-2">
                            <Box className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Module Type</p>
                              <p className="font-semibold">
                                {selectedPanel.bifaciality === 0 || selectedPanel.bifaciality === null 
                                  ? "Mono Facial" 
                                  : `Bi-Facial (${(selectedPanel.bifaciality * 100).toFixed(0)}%)`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Realistic PV Module Visualization */}
                  <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                        <Box className="h-5 w-5" />
                        Solar Module Dimensions
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Technical drawing with actual proportions</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Realistic Solar Panel SVG */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 overflow-hidden">
                          <svg 
                            viewBox="0 0 400 300" 
                            className="w-full h-64 mx-auto"
                            style={{ maxWidth: '500px' }}
                          >
                            <defs>
                              {/* Solar cell pattern */}
                              <pattern id="solarCells" patternUnits="userSpaceOnUse" width="16" height="16">
                                <rect width="15" height="15" fill="#1e293b" stroke="#334155" strokeWidth="0.3" rx="1"/>
                                <circle cx="7.5" cy="7.5" r="0.8" fill="#64748b" opacity="0.6"/>
                                <rect width="15" height="15" fill="none" stroke="#475569" strokeWidth="0.2"/>
                              </pattern>
                              
                              {/* Frame gradient */}
                              <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e2e8f0"/>
                                <stop offset="50%" stopColor="#cbd5e1"/>
                                <stop offset="100%" stopColor="#94a3b8"/>
                              </linearGradient>
                              
                              {/* Glass reflection */}
                              <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.4)"/>
                                <stop offset="30%" stopColor="rgba(255,255,255,0.1)"/>
                                <stop offset="70%" stopColor="rgba(255,255,255,0.05)"/>
                                <stop offset="100%" stopColor="rgba(255,255,255,0.2)"/>
                              </linearGradient>
                              
                              {/* Junction box */}
                              <linearGradient id="junctionBox" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#374151"/>
                                <stop offset="100%" stopColor="#1f2937"/>
                              </linearGradient>
                            </defs>
                            
                            {/* Calculate proportional dimensions */}
                            {(() => {
                              const length = selectedPanel.module_length || 2000;
                              const width = selectedPanel.module_width || 1000;
                              const aspectRatio = width / length;
                              
                              // Panel dimensions in SVG coordinates
                              const panelWidth = 280;
                              const panelHeight = panelWidth * aspectRatio;
                              const panelX = (400 - panelWidth) / 2;
                              const panelY = (300 - panelHeight) / 2;
                              
                              return (
                                <g>
                                  {/* Panel Frame */}
                                  <rect
                                    x={panelX - 4}
                                    y={panelY - 4}
                                    width={panelWidth + 8}
                                    height={panelHeight + 8}
                                    fill="url(#frameGradient)"
                                    stroke="#64748b"
                                    strokeWidth="1"
                                    rx="6"
                                  />
                                  
                                  {/* Solar Cells Area */}
                                  <rect
                                    x={panelX}
                                    y={panelY}
                                    width={panelWidth}
                                    height={panelHeight}
                                    fill="url(#solarCells)"
                                    stroke="#334155"
                                    strokeWidth="1"
                                    rx="3"
                                  />
                                  
                                  {/* Glass reflection overlay */}
                                  <rect
                                    x={panelX}
                                    y={panelY}
                                    width={panelWidth}
                                    height={panelHeight}
                                    fill="url(#glassReflection)"
                                    rx="3"
                                  />
                                  
                                  {/* Busbar lines (simplified) */}
                                  {Array.from({ length: Math.floor(panelWidth / 45) }, (_, i) => (
                                    <line
                                      key={i}
                                      x1={panelX + 20 + i * 45}
                                      y1={panelY + 5}
                                      x2={panelX + 20 + i * 45}
                                      y2={panelY + panelHeight - 5}
                                      stroke="#94a3b8"
                                      strokeWidth="0.5"
                                      opacity="0.7"
                                    />
                                  ))}
                                  
                                  {/* Junction Box */}
                                  <rect
                                    x={panelX + panelWidth - 25}
                                    y={panelY + panelHeight + 6}
                                    width="20"
                                    height="12"
                                    fill="url(#junctionBox)"
                                    stroke="#1f2937"
                                    strokeWidth="0.5"
                                    rx="2"
                                  />
                                  
                                  {/* Dimension Lines and Text */}
                                  {/* Length dimension */}
                                  <line 
                                    x1={panelX} 
                                    y1={panelY - 20} 
                                    x2={panelX + panelWidth} 
                                    y2={panelY - 20} 
                                    stroke="#3b82f6" 
                                    strokeWidth="1.5"
                                    markerStart="url(#dimArrow)"
                                    markerEnd="url(#dimArrow)"
                                  />
                                  <text 
                                    x={panelX + panelWidth / 2} 
                                    y={panelY - 25} 
                                    textAnchor="middle" 
                                    className="text-xs font-bold fill-blue-600"
                                  >
                                    {length}mm
                                  </text>
                                  
                                  {/* Width dimension */}
                                  <line 
                                    x1={panelX - 20} 
                                    y1={panelY} 
                                    x2={panelX - 20} 
                                    y2={panelY + panelHeight} 
                                    stroke="#3b82f6" 
                                    strokeWidth="1.5"
                                    markerStart="url(#dimArrow)"
                                    markerEnd="url(#dimArrow)"
                                  />
                                  <text 
                                    x={panelX - 25} 
                                    y={panelY + panelHeight / 2} 
                                    textAnchor="middle" 
                                    className="text-xs font-bold fill-blue-600"
                                    transform={`rotate(-90, ${panelX - 25}, ${panelY + panelHeight / 2})`}
                                  >
                                    {width}mm
                                  </text>
                                  
                                  {/* Thickness indicator */}
                                  <rect
                                    x={panelX + panelWidth + 15}
                                    y={panelY + panelHeight / 2 - 1}
                                    width="30"
                                    height="2"
                                    fill="#64748b"
                                    rx="1"
                                  />
                                  <text 
                                    x={panelX + panelWidth + 50} 
                                    y={panelY + panelHeight / 2 + 4} 
                                    className="text-xs font-medium fill-slate-600"
                                  >
                                    ~40mm
                                  </text>
                                </g>
                              );
                            })()}
                            
                            {/* Dimension arrows */}
                            <defs>
                              <marker id="dimArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6"/>
                              </marker>
                            </defs>
                          </svg>
                        </div>
                        
                        {/* Technical Specifications */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted-foreground">Panel Area</p>
                            <p className="font-bold text-slate-700">{selectedPanel.panel_area_m2?.toFixed(2)} m²</p>
                          </div>
                          <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted-foreground">Power Density</p>
                            <p className="font-bold text-slate-700">
                              {selectedPanel.panel_area_m2 ? (selectedPanel.nominal_power_w / selectedPanel.panel_area_m2).toFixed(0) : 'N/A'} W/m²
                            </p>
                  </div>
                          <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted-foreground">Weight</p>
                            <p className="font-bold text-slate-700">~22 kg</p>
                    </div>
                          <div className="bg-white/80 p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-muted-foreground">Frame Type</p>
                            <p className="font-bold text-slate-700">Aluminum</p>
                    </div>
                    </div>
                  </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* IV Curve Chart */}
              {selectedPanel && ivCurveData.length > 0 && (
                <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-orange-50 to-red-50 mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                      <Activity className="h-5 w-5" />
                      Current-Voltage (IV) Characteristic Curve
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Electrical performance characteristics under Standard Test Conditions (STC)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ivCurveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="voltage" 
                            stroke="#64748b"
                            fontSize={12}
                            label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
                          />
                          <YAxis 
                            stroke="#64748b"
                            fontSize={12}
                            label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number, name: string) => [
                              `${value} ${name === 'current' ? 'A' : name === 'voltage' ? 'V' : 'W'}`,
                              name === 'current' ? 'Current' : name === 'voltage' ? 'Voltage' : 'Power'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="current" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={false}
                            name="current"
                          />
                          {/* Add power curve as secondary line */}
                          <Line 
                            type="monotone" 
                            dataKey="power" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="power"
                          />
                        </LineChart>
                      </ResponsiveContainer>
            </div>

                    {/* Key Performance Points */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-orange-200">
                      <div className="text-center p-2 bg-white/70 rounded-lg">
                        <p className="text-xs text-muted-foreground">Voc</p>
                        <p className="font-bold text-orange-700">{selectedPanel.voc_v}V</p>
                      </div>
                      <div className="text-center p-2 bg-white/70 rounded-lg">
                        <p className="text-xs text-muted-foreground">Isc</p>
                        <p className="font-bold text-orange-700">{selectedPanel.isc_a}A</p>
                      </div>
                      <div className="text-center p-2 bg-white/70 rounded-lg">
                        <p className="text-xs text-muted-foreground">Vmp</p>
                        <p className="font-bold text-orange-700">{selectedPanel.vmp_v}V</p>
                      </div>
                      <div className="text-center p-2 bg-white/70 rounded-lg">
                        <p className="text-xs text-muted-foreground">Imp</p>
                        <p className="font-bold text-orange-700">{selectedPanel.imp_a}A</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentSelector;
