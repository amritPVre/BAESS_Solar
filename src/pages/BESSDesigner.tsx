import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, LineChart, Line } from 'recharts';
import { Sun, BatteryCharging, DollarSign, BarChart2, Home, ChevronRight, HelpCircle, Settings, Save, FilePlus, Trash2, XCircle, CheckCircle, Zap, TrendingUp, Fuel, Database, FileText, MapPin, RotateCw, Info, ClipboardList, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { CableSizing } from '@/components/CableSizing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useAICredits } from '@/hooks/useAICredits';
import type { HybridInverter, BatteryInverter } from '@/types/inverters';
import { getHybridInverters, getBatteryInverters, recommendInverters } from '@/services/inverterService';
import { getDCCables, calculateDCVoltageDrop } from '@/services/cableService';
import { 
    separateDayNightEnergy, 
    calculateBatteryCapacity,
    calculatePVCapacity,
    calculateBatteryInverterAC,
    calculateHybridInverterDC,
    calculatePVInverterAC,
    BATTERY_C_RATE,
    INVERTER_EFFICIENCY
} from '@/utils/bessCalculations';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Data Catalogs ---
const DEFAULT_LOAD_PROFILES = {
  'Residential': { weekday: [0.5,0.4,0.4,0.3,0.3,0.4,0.8,1.2,1.0,0.8,0.7,0.7,0.6,0.6,0.7,0.9,1.5,2.2,2.5,2.0,1.8,1.5,1.0,0.7], weekend: [0.6,0.5,0.5,0.4,0.4,0.5,0.7,0.9,1.1,1.3,1.4,1.5,1.4,1.3,1.2,1.2,1.6,2.0,2.3,2.1,1.9,1.6,1.2,0.8] },
  'Commercial': { weekday: [1.5,1.5,1.5,1.5,2.0,3.0,4.5,5.0,6.5,7.0,7.5,7.0,7.0,7.5,7.0,6.5,6.0,5.0,4.0,3.0,2.0,1.5,1.5,1.5], weekend: [1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0] },
  'Industrial': { weekday: [5,5,5,5,5,15,25,30,30,30,30,30,30,30,30,30,25,15,5,5,5,5,5,5], weekend: [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3] },
  'Utility Scale': { weekday: [-10,-10,-10,-10,-15,-20,0,0,0,0,0,0,0,0,10,20,30,30,25,15,5,0,-5,-10], weekend: [-5,-5,-5,-5,-10,-10,0,0,0,0,0,0,0,0,5,10,15,15,10,5,0,0,0,-5] }
};

const BATTERY_CATALOG_BY_APPLICATION = {
    'Residential': {
        'Lithium-Ion': [
            { id: 'RES-LFP-48V-100Ah', name: 'LFP 48V 100Ah', brand: 'PowerWall Home', capacity: 4.8, power: 2.4, dod: 90, efficiency: 95, cost: 1680, chemistry: 'LFP' },
            { id: 'RES-NMC-51.2V-150Ah', name: 'NMC 51.2V 150Ah', brand: 'BYD Battery-Box', capacity: 7.68, power: 3.84, dod: 90, efficiency: 95, cost: 2688, chemistry: 'NMC' },
            { id: 'RES-LFP-51.2V-200Ah', name: 'LFP 51.2V 200Ah', brand: 'Pylontech US3000C', capacity: 10.24, power: 5.12, dod: 90, efficiency: 95, cost: 3584, chemistry: 'LFP' },
            { id: 'RES-NMC-51.2V-280Ah', name: 'NMC 51.2V 280Ah', brand: 'Tesla Powerwall 2', capacity: 14.3, power: 7.15, dod: 90, efficiency: 96, cost: 5005, chemistry: 'NMC' },
            { id: 'RES-LFP-48V-300Ah', name: 'LFP 48V 300Ah', brand: 'Enphase IQ Battery', capacity: 14.4, power: 7.2, dod: 90, efficiency: 96, cost: 5040, chemistry: 'LFP' },
        ],
        'Lead-Acid': [
            { id: 'RES-LA-12V-100Ah', name: 'LA 12V 100Ah', brand: 'Trojan T-105', capacity: 1.2, power: 0.6, dod: 50, efficiency: 75, cost: 300, chemistry: 'AGM' },
            { id: 'RES-LA-12V-200Ah', name: 'LA 12V 200Ah', brand: 'Victron GEL', capacity: 2.4, power: 1.2, dod: 50, efficiency: 75, cost: 600, chemistry: 'GEL' },
            { id: 'RES-LA-48V-200Ah', name: 'LA 48V 200Ah', brand: 'Rolls S550', capacity: 9.6, power: 4.8, dod: 50, efficiency: 80, cost: 2400, chemistry: 'Flooded' },
        ]
    },
    'Commercial & Industrial': {
        'Lithium-Ion': [
            { id: 'CI-LFP-102.4V-200Ah', name: 'LFP 102.4V 200Ah', brand: 'Sungrow SBR160', capacity: 20.48, power: 10.24, dod: 90, efficiency: 95, cost: 7168, chemistry: 'LFP' },
            { id: 'CI-NMC-204.8V-200Ah', name: 'NMC 204.8V 200Ah', brand: 'LG Chem RESU', capacity: 40.96, power: 20.48, dod: 90, efficiency: 94, cost: 14336, chemistry: 'NMC' },
            { id: 'CI-LFP-240V-250Ah', name: 'LFP 240V 250Ah', brand: 'BYD Cube Pro', capacity: 60, power: 30, dod: 90, efficiency: 94, cost: 21000, chemistry: 'LFP' },
            { id: 'CI-NMC-320V-280Ah', name: 'NMC 320V 280Ah', brand: 'Huawei LUNA2000', capacity: 89.6, power: 44.8, dod: 90, efficiency: 94, cost: 31360, chemistry: 'NMC' },
            { id: 'CI-LFP-400V-300Ah', name: 'LFP 400V 300Ah', brand: 'Growatt ARO', capacity: 120, power: 60, dod: 90, efficiency: 94, cost: 42000, chemistry: 'LFP' },
            { id: 'CI-NCA-480V-350Ah', name: 'NCA 480V 350Ah', brand: 'Alpha ESS', capacity: 168, power: 84, dod: 90, efficiency: 93, cost: 58800, chemistry: 'NCA' },
            { id: 'CI-LFP-600V-400Ah', name: 'LFP 600V 400Ah', brand: 'CATL EnerC', capacity: 240, power: 120, dod: 90, efficiency: 93, cost: 84000, chemistry: 'LFP' },
        ],
        'Lead-Acid': [
            { id: 'CI-LA-48V-500Ah', name: 'LA 48V 500Ah', brand: 'Trojan Industrial', capacity: 24, power: 12, dod: 50, efficiency: 80, cost: 6000, chemistry: 'Flooded' },
            { id: 'CI-LA-96V-300Ah', name: 'LA 96V 300Ah', brand: 'Exide GNB', capacity: 28.8, power: 14.4, dod: 50, efficiency: 80, cost: 7200, chemistry: 'Flooded' },
            { id: 'CI-LA-120V-400Ah', name: 'LA 120V 400Ah', brand: 'EnerSys PowerSafe', capacity: 48, power: 24, dod: 50, efficiency: 75, cost: 12000, chemistry: 'VRLA' },
        ]
    },
    'Utility Scale': {
        'Lithium-Ion': [
            { id: 'UTIL-LFP-800V-350Ah', name: 'LFP 800V 350Ah', brand: 'Tesla Megapack', capacity: 280, power: 140, dod: 90, efficiency: 93, cost: 98000, chemistry: 'LFP' },
            { id: 'UTIL-NMC-1000V-400Ah', name: 'NMC 1000V 400Ah', brand: 'Fluence Gridstack', capacity: 400, power: 200, dod: 90, efficiency: 93, cost: 140000, chemistry: 'NMC' },
            { id: 'UTIL-LFP-1200V-500Ah', name: 'LFP 1200V 500Ah', brand: 'BYD Battery Box HVS', capacity: 600, power: 300, dod: 90, efficiency: 93, cost: 210000, chemistry: 'LFP' },
            { id: 'UTIL-NMC-1500V-500Ah', name: 'NMC 1500V 500Ah', brand: 'CATL Utility ESS', capacity: 750, power: 375, dod: 90, efficiency: 93, cost: 262500, chemistry: 'NMC' },
            { id: 'UTIL-LFP-1500V-600Ah', name: 'LFP 1500V 600Ah', brand: 'Sungrow PowerTitan', capacity: 900, power: 450, dod: 90, efficiency: 92, cost: 315000, chemistry: 'LFP' },
            { id: 'UTIL-NCA-1800V-700Ah', name: 'NCA 1800V 700Ah', brand: 'Samsung SDI E3', capacity: 1260, power: 630, dod: 90, efficiency: 92, cost: 441000, chemistry: 'NCA' },
            { id: 'UTIL-LFP-2000V-800Ah', name: 'LFP 2000V 800Ah', brand: 'CRRC Giant Battery', capacity: 1600, power: 800, dod: 90, efficiency: 92, cost: 560000, chemistry: 'LFP' },
            { id: 'UTIL-NMC-2500V-1000Ah', name: 'NMC 2500V 1000Ah', brand: 'Powin Stack', capacity: 2500, power: 1250, dod: 90, efficiency: 91, cost: 875000, chemistry: 'NMC' },
        ],
        'Lead-Acid': [
            { id: 'UTIL-LA-2V-1000Ah-x24', name: 'LA 2V 1000Ah x24', brand: 'C&D Technologies', capacity: 48, power: 24, dod: 50, efficiency: 75, cost: 12000, chemistry: 'Flooded' },
            { id: 'UTIL-LA-2V-1500Ah-x48', name: 'LA 2V 1500Ah x48', brand: 'Exide Classic', capacity: 144, power: 72, dod: 50, efficiency: 75, cost: 36000, chemistry: 'Flooded' },
            { id: 'UTIL-LA-2V-2000Ah-x60', name: 'LA 2V 2000Ah x60', brand: 'Hoppecke', capacity: 240, power: 120, dod: 50, efficiency: 75, cost: 60000, chemistry: 'OPzS' },
        ]
    }
};

// Backward compatibility - flatten all batteries for other components
const BATTERY_CATALOG = {
    'Lithium-Ion': [
        ...BATTERY_CATALOG_BY_APPLICATION['Residential']['Lithium-Ion'],
        ...BATTERY_CATALOG_BY_APPLICATION['Commercial & Industrial']['Lithium-Ion'],
        ...BATTERY_CATALOG_BY_APPLICATION['Utility Scale']['Lithium-Ion']
    ],
    'Lead-Acid': [
        ...BATTERY_CATALOG_BY_APPLICATION['Residential']['Lead-Acid'],
        ...BATTERY_CATALOG_BY_APPLICATION['Commercial & Industrial']['Lead-Acid'],
        ...BATTERY_CATALOG_BY_APPLICATION['Utility Scale']['Lead-Acid']
    ]
};

// --- Helper Functions ---
/**
 * Extracts voltage and ampere-hour values from battery name
 * Example: "LFP 48V 100Ah" => { voltage: 48, ampereHour: 100 }
 */
const extractBatterySpecs = (batteryName: string): { voltage: number; ampereHour: number } | null => {
    const voltageMatch = batteryName.match(/(\d+\.?\d*)V/);
    const ampereHourMatch = batteryName.match(/(\d+\.?\d*)Ah/);
    
    if (voltageMatch && ampereHourMatch) {
        return {
            voltage: parseFloat(voltageMatch[1]),
            ampereHour: parseFloat(ampereHourMatch[1])
        };
    }
    return null;
};

// --- Helper Components ---
const TooltipWrapper = ({ content, children }: { content: string; children: React.ReactNode }) => {
    const [show, setShow] = useState(false);
    return (<div className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>{children}{show && <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 rounded-md shadow-lg z-50">{content}</div>}</div>);
};

const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!show) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4"><div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XCircle className="h-6 w-6 text-gray-500" /></button></div><div className="p-4">{children}</div></div></div>);
};

const Notification = ({ message, type, onDismiss }: { message: string; type: string; onDismiss: () => void }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircle : XCircle;
    const colorClasses = isSuccess ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
    useEffect(() => { const timer = setTimeout(() => onDismiss(), 5000); return () => clearTimeout(timer); }, [onDismiss]);
    return (<div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg flex items-center z-50 ${colorClasses}`}><Icon className="h-5 w-5 mr-3" /><span>{message}</span><button onClick={onDismiss} className="ml-4 p-1 rounded-full hover:bg-black/10"><XCircle className="h-5 w-5" /></button></div>);
};

// --- Main Application Components ---

// =====================================================
// Navigation Items - Tab Order
// =====================================================
const NAV_ITEMS = [
  { id: 'project', label: 'Project Details', icon: Home },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'load', label: 'Daily Load Profile', icon: BarChart2 },
  { id: 'design-assist', label: 'Design Assist', icon: Settings },
  { id: 'battery', label: 'BESS Configuration', icon: Database },
  { id: 'pv', label: 'PV Sizing', icon: Sun },
  { id: 'cable', label: 'Cable Sizing', icon: Zap },
  { id: 'dg', label: 'DG Configuration', icon: Fuel },
  { id: 'sizing', label: 'Simulation Result', icon: BatteryCharging },
  { id: 'boq', label: 'BOQ', icon: ClipboardList },
  { id: 'costing', label: 'Project Costing', icon: DollarSign },
  { id: 'financial', label: 'Financial Analysis', icon: DollarSign },
  { id: 'summary', label: 'Summary Report', icon: FileText },
];

// =====================================================
// Tab Navigation Component - Next/Back Buttons
// =====================================================
// TabNavigation component removed - not currently in use

const Sidebar = ({ activePage, setActivePage, projectData, navigate }: any) => {
  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    disabled: (item.id === 'pv' && projectData.application === 'Utility Scale') ||
              (item.id === 'dg' && projectData.chargingSource !== 'Solar PV + DG Hybrid')
  }));

  return (
    <aside className="w-full md:w-72 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="relative cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => navigate('/dashboard')}
            title="Return to Dashboard"
          >
            <img 
              src="/BAESS_logo_v02.png" 
              alt="BAESS Labs" 
              className="h-16 w-auto object-contain drop-shadow-lg"
              onError={(e) => {
                // Fallback to v01 if v02 doesn't load
                const img = e.target as HTMLImageElement;
                img.src = "/BAESS_logo_v01 - Copy.PNG";
              }}
            />
          </div>
           <div className="text-center">
             <div className="flex items-center justify-center gap-2">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">BESS Designer</h2>
               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                 Beta
               </span>
             </div>
           </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => !item.disabled && setActivePage(item.id)} 
            disabled={item.disabled} 
            className={`
              w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden
              ${activePage === item.id 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-md'
              } 
              ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'}
            `}
          >
            {activePage === item.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
            )}
            <div className={`p-1.5 rounded-lg mr-3 ${activePage === item.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'} transition-colors`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="relative z-10">{item.label}</span>
            {!item.disabled && (
              <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${activePage === item.id ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto"><button className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"><Settings className="h-5 w-5 mr-3" /><span>Settings</span></button></div>
    </aside>
  );
};

const ProjectDetails = ({ projectData, setProjectData, setLoadData, setActivePage, projects, currentProjectId, handleLoadProject, handleNewProject, handleSaveProject, handleDeleteClick, authStatus }: any) => {
  const handleApplicationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newApplication = e.target.value;
    const newChargingSource = newApplication === 'Utility Scale' ? 'Grid Only' : projectData.chargingSource === 'Grid Only' ? 'Solar PV Only' : projectData.chargingSource;
    setProjectData({ ...projectData, application: newApplication, chargingSource: newChargingSource });
    if (DEFAULT_LOAD_PROFILES[newApplication as keyof typeof DEFAULT_LOAD_PROFILES]) setLoadData(DEFAULT_LOAD_PROFILES[newApplication as keyof typeof DEFAULT_LOAD_PROFILES]);
  };
  
  const getApplicationIcon = (app: string) => {
    switch(app) {
      case 'Residential': return '🏠';
      case 'Commercial': return '🏢';
      case 'Industrial': return '🏭';
      case 'Utility Scale': return '⚡';
      default: return '📍';
    }
  };
  
  return (
    <div className="space-y-6 p-6 bg-[#1a2332] min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-[#1e293b] border border-cyan-500/20 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Home className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Project Details</h2>
        </div>
        <p className="text-cyan-300/70 text-sm">Define the basic information and charging strategy for your BESS project</p>
      </div>

      {/* Project Management Section */}
      <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Save className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Project Management</CardTitle>
                <CardDescription className="text-cyan-300/70">Load, save, or create a new project</CardDescription>
              </div>
            </div>
            {authStatus === 'signed-in' && projects.length > 0 && (
              <span className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full font-medium border border-blue-500/30">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {authStatus === 'signed-in' ? (
            <div className="space-y-4">
              {/* Project Selector */}
              <div className="space-y-2">
                <Label htmlFor="project-select" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Select Project
                </Label>
                <div className="relative">
                  <select 
                    id="project-select"
                    value={currentProjectId || ''} 
                    onChange={(e) => handleLoadProject(e.target.value)} 
                    className="w-full px-4 py-3 pr-10 bg-[#0f1729] border border-slate-600/50 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 text-white text-sm shadow-sm transition-all appearance-none cursor-pointer [&>option]:bg-[#0f1729] [&>option]:text-white [&>option:checked]:bg-cyan-700 [&>option:hover]:bg-slate-700"
                    disabled={projects.length === 0}
                  >
                    <option value="" disabled className="text-slate-400">
                      {projects.length === 0 ? 'No saved projects' : 'Select a project'}
                    </option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none rotate-90" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleNewProject}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border border-emerald-500/50 shadow-lg hover:shadow-xl transition-all"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  <span className="font-semibold">New Project</span>
                </Button>
                <Button 
                  onClick={handleSaveProject}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border border-blue-500/50 shadow-lg hover:shadow-xl transition-all"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Save Project</span>
                </Button>
              </div>

              {/* Delete Button */}
              {currentProjectId && (
                <Button 
                  onClick={() => handleDeleteClick(currentProjectId)} 
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border border-red-500/50 shadow-lg hover:shadow-xl transition-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Delete Project</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  {authStatus === 'error' ? (
                    <XCircle className="h-8 w-8 text-red-400" />
                  ) : (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  )}
                </div>
                <p className="text-sm text-cyan-300">
                  {authStatus === 'error' ? 'Connection failed' : 'Connecting to database...'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards Grid - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information Card */}
        <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg hover:border-cyan-500/50 transition-all">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Project Information</CardTitle>
              <CardDescription className="text-cyan-300/70">Basic project identification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm font-semibold flex items-center gap-2 text-cyan-200">
              <span className="text-blue-400">📝</span>
              Project Name
            </Label>
            <Input 
              id="projectName" 
              placeholder="e.g., 'My Home Energy System'" 
              value={projectData.name} 
              onChange={(e) => setProjectData({...projectData, name: e.target.value})}
              className="bg-[#0f1729] border border-slate-600/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationName" className="text-sm font-semibold flex items-center gap-2 text-cyan-200">
              <MapPin className="h-4 w-4 text-green-400" />
              Location Name
            </Label>
            <Input 
              id="locationName" 
              placeholder="e.g., 'Palo Alto, CA'" 
              value={projectData.locationName} 
              onChange={(e) => setProjectData({...projectData, locationName: e.target.value})}
              className="bg-[#0f1729] border border-slate-600/50 text-white placeholder:text-slate-400 focus:border-green-400 focus:ring-1 focus:ring-green-400/20 h-11"
            />
          </div>
        </CardContent>
      </Card>

        {/* System Configuration Card */}
        <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg hover:border-cyan-500/50 transition-all">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Settings className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">System Configuration</CardTitle>
              <CardDescription className="text-cyan-300/70">Application type and charging strategy</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="applicationType" className="text-sm font-semibold flex items-center gap-2 text-cyan-200">
              <span className="text-lg">{getApplicationIcon(projectData.application)}</span>
              Application Type
            </Label>
            <div className="relative">
              <select 
                id="applicationType" 
                className="w-full h-11 px-4 pr-10 bg-[#0f1729] border border-slate-600/50 text-white rounded-lg focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all appearance-none cursor-pointer font-medium [&>option]:bg-[#0f1729] [&>option]:text-white [&>option:checked]:bg-cyan-700 [&>option:hover]:bg-slate-700" 
                value={projectData.application} 
                onChange={handleApplicationChange}
              >
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
                <option>Utility Scale</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none rotate-90" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chargingSource" className="text-sm font-semibold flex items-center gap-2 text-cyan-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              Primary Charging Source
              {projectData.application === 'Utility Scale' && (
                <span className="text-xs text-cyan-400/60 italic">(Grid only for utility scale)</span>
              )}
            </Label>
            <div className="relative">
              <select 
                id="chargingSource" 
                className="w-full h-11 px-4 pr-10 bg-[#0f1729] border border-slate-600/50 text-white rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all appearance-none cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#0f1729] [&>option]:text-white [&>option:checked]:bg-cyan-700 [&>option:hover]:bg-slate-700" 
                value={projectData.chargingSource} 
                onChange={(e) => setProjectData({...projectData, chargingSource: e.target.value})} 
                disabled={projectData.application === 'Utility Scale'}
              >
                <option>Solar PV Only</option>
                <option>Solar PV + Grid Hybrid</option>
                <option>Solar PV + DG Hybrid</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none rotate-90" />
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
      {/* End Cards Grid */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1e293b] border border-blue-500/30 rounded-xl shadow-lg hover:border-blue-400/50 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-2">Application</p>
                <p className="text-lg font-bold text-white">{projectData.application}</p>
              </div>
              <div className="text-3xl opacity-90">{getApplicationIcon(projectData.application)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e293b] border border-green-500/30 rounded-xl shadow-lg hover:border-green-400/50 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                <p className="text-xs text-green-400 uppercase tracking-wider font-semibold mb-2">Location</p>
                <p className="text-sm font-semibold text-white truncate">{projectData.locationName || 'Not set'}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e293b] border border-yellow-500/30 rounded-xl shadow-lg hover:border-yellow-400/50 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                <p className="text-xs text-yellow-400 uppercase tracking-wider font-semibold mb-2">Power Source</p>
                <p className="text-xs font-semibold text-white">{projectData.chargingSource}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const LocationPicker = ({ projectData, setProjectData, setActivePage }: any) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [isLoadingMeteo, setIsLoadingMeteo] = useState(false);
    const [meteoData, setMeteoData] = useState<any>(null);
    const [meteoDataSource, setMeteoDataSource] = useState(projectData.meteoDataSource || 'nsrdb');

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const timer = setTimeout(() => {
            if (typeof (window as any).L === 'undefined') {
                console.error("Leaflet library not loaded.");
                return;
            }

            if (!mapRef.current) {
                mapRef.current = (window as any).L.map(mapContainerRef.current).setView([projectData.coordinates.lat, projectData.coordinates.lng], 13);
                (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapRef.current);

                markerRef.current = (window as any).L.marker([projectData.coordinates.lat, projectData.coordinates.lng], {
                    draggable: true
                }).addTo(mapRef.current);

                markerRef.current.on('dragend', (event: any) => {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    setProjectData((prev: any) => ({ ...prev, coordinates: { lat: position.lat, lng: position.lng } }));
                    fetchMeteoData(position.lat, position.lng);
                });

                mapRef.current.on('click', (event: any) => {
                    const position = event.latlng;
                    markerRef.current.setLatLng(position);
                    setProjectData((prev: any) => ({ ...prev, coordinates: { lat: position.lat, lng: position.lng } }));
                    fetchMeteoData(position.lat, position.lng);
                });
            } else {
                mapRef.current.invalidateSize();
            }
        }, 150);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            const newLatLng = [projectData.coordinates.lat, projectData.coordinates.lng];
            mapRef.current.setView(newLatLng, mapRef.current.getZoom());
            markerRef.current.setLatLng(newLatLng);
        }
    }, [projectData.coordinates]);

    // Fetch meteorological data when component mounts
    useEffect(() => {
        if (projectData.coordinates.lat && projectData.coordinates.lng) {
            fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng);
        }
    }, []);

    const fetchMeteoData = async (lat: number, lng: number, dataSource?: string) => {
        setIsLoadingMeteo(true);
        const sourceToUse = dataSource || meteoDataSource;
        try {
            // Use NREL API key from environment or fallback to config
            const API_KEY = import.meta.env.VITE_NREL_API_KEY || 'zNZ118S4E62Nm7A4bCiBQO4eDS4Gx3jsYJ0kIjsL';
            
            console.log(`🌍 Fetching meteorological data for: Lat ${lat}, Lng ${lng}, Data Source: ${sourceToUse}`);
            
            // Build API URL with data source parameter
            let apiUrl = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${API_KEY}&lat=${lat}&lon=${lng}&system_capacity=1&module_type=0&losses=14&array_type=1&tilt=20&azimuth=180&timeframe=hourly`;
            
            // Add dataset parameter based on selected data source
            if (sourceToUse && sourceToUse !== 'nsrdb') {
                apiUrl += `&dataset=${sourceToUse}`;
            }
            
            console.log(`📡 API URL: ${apiUrl}`);
            
            // Call PVWatts API for basic system to get meteorological data
            const response = await fetch(apiUrl);

            const data = await response.json();
            
            // Check for API errors even if response is not ok
            if (!response.ok || (data.errors && data.errors.length > 0)) {
                const errorMsg = data.errors && data.errors.length > 0 ? 
                    data.errors.join(', ') : 
                    `API request failed with status ${response.status}`;
                throw new Error(errorMsg);
            }
            
            console.log('✅ PVWatts API Response:', data);
            console.log('📊 Raw Solar Data:', {
                solrad_annual: data.outputs?.solrad_annual,
                solrad_monthly: data.outputs?.solrad_monthly,
                ac_annual: data.outputs?.ac_annual,
                poa_monthly: data.outputs?.poa_monthly
            });
            
            if (data.station_info && data.outputs) {
                // Calculate temperature statistics from hourly data
                const avgTemp = data.outputs.tamb && data.outputs.tamb.length > 0 ? 
                    data.outputs.tamb.reduce((a: number, b: number) => a + b, 0) / data.outputs.tamb.length : 25;
                const minTemp = data.outputs.tamb && data.outputs.tamb.length > 0 ? 
                    Math.min(...data.outputs.tamb) : -10;
                const maxTemp = data.outputs.tamb && data.outputs.tamb.length > 0 ? 
                    Math.max(...data.outputs.tamb) : 45;
                
                // Calculate solar radiation
                // solrad_annual is the average daily solar radiation in kWh/m²/day
                // NOT the annual total! (This is the PVWatts API convention)
                const avgDailySolarRad = data.outputs.solrad_annual || 0;
                
                // Calculate annual total from monthly data if available
                // NOTE: solrad_monthly contains DAILY AVERAGES for each month, not monthly totals!
                let annualSolarRad = 0;
                if (data.outputs.solrad_monthly && Array.isArray(data.outputs.solrad_monthly)) {
                    // Days in each month (Jan, Feb, Mar, ..., Dec)
                    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    // Multiply each month's daily average by the number of days in that month
                    annualSolarRad = data.outputs.solrad_monthly.reduce((sum: number, dailyAvg: number, index: number) => {
                        return sum + (dailyAvg * daysInMonth[index]);
                    }, 0);
                } else {
                    // Fallback: multiply daily average by 365 days
                    annualSolarRad = avgDailySolarRad * 365;
                }
                
                console.log('🔆 Solar Radiation Calculated:', {
                    avgDailySolarRad,
                    annualSolarRad,
                    calculationMethod: data.outputs.solrad_monthly ? 'monthly_detailed' : 'annual_estimate',
                    monthly: data.outputs.solrad_monthly
                });

                const meteoInfo = {
                    location: data.station_info.location || 'Unknown',
                    city: data.station_info.city || 'Unknown',
                    state: data.station_info.state || 'Unknown',
                    elevation: data.station_info.elev || 0,
                    timezone: data.station_info.tz || 0,
                    solarResourceFile: data.station_info.solar_resource_file || 'Unknown',
                    avgAnnualTemp: avgTemp.toFixed(1),
                    minTemp: minTemp.toFixed(1),
                    maxTemp: maxTemp.toFixed(1),
                    avgDailySolarRad: avgDailySolarRad.toFixed(2),
                    annualSolarRad: annualSolarRad.toFixed(2),
                    capacityFactor: (data.outputs.capacity_factor || 0).toFixed(2)
                };

                console.log('📊 Processed Meteo Data:', meteoInfo);
                setMeteoData(meteoInfo);
                
                // Store avgDailySolarIrradiation in projectData for Design Assist
                setProjectData((prev: any) => ({ 
                    ...prev, 
                    avgDailySolarIrradiation: parseFloat(meteoInfo.avgDailySolarRad) 
                }));

                sonnerToast.success('Meteorological data fetched successfully!', {
                    description: `Location: ${meteoInfo.city}, ${meteoInfo.state}`
                });
            } else {
                throw new Error('Invalid response format from PVWatts API');
            }
        } catch (error) {
            console.error('❌ Error fetching meteorological data:', error);
            sonnerToast.error('Failed to fetch meteorological data', {
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            });
            setMeteoData(null);
        } finally {
            setIsLoadingMeteo(false);
        }
    };

    const handleMeteoDataSourceChange = async (value: string) => {
        setMeteoDataSource(value);
        setProjectData((prev: any) => ({ ...prev, meteoDataSource: value }));
        
        // Try to fetch with the new data source
        try {
            await fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng, value);
        } catch (error) {
            // If it fails and it's not NSRDB, try falling back to NSRDB
            if (value !== 'nsrdb') {
                sonnerToast.warning('Selected dataset not available for this location', {
                    description: 'Falling back to NSRDB dataset'
                });
                setMeteoDataSource('nsrdb');
                setProjectData((prev: any) => ({ ...prev, meteoDataSource: 'nsrdb' }));
                await fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng, 'nsrdb');
            }
        }
    };

    return (
        <div className="space-y-6 p-6 bg-[#1a2332] min-h-screen">
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <MapPin className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white">Project Location</CardTitle>
                            <CardDescription className="text-cyan-300/70">Interactive map - click or drag marker to update location</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div ref={mapContainerRef} style={{ height: '400px', width: '100%' }} className="rounded-lg border border-cyan-500/30 overflow-hidden shadow-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lat-input" className="flex items-center gap-2 text-cyan-200">
                                <MapPin className="h-4 w-4 text-blue-400" />
                                Latitude
                            </Label>
                            <Input 
                                id="lat-input"
                                type="number" 
                                step="0.000001"
                                value={projectData.coordinates.lat} 
                                onChange={(e) => {
                                    const newLat = parseFloat(e.target.value) || 0;
                                    setProjectData((prev: any) => ({ ...prev, coordinates: { ...prev.coordinates, lat: newLat } }));
                                }}
                                onBlur={() => fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng)}
                                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lng-input" className="flex items-center gap-2 text-cyan-200">
                                <MapPin className="h-4 w-4 text-green-400" />
                                Longitude
                            </Label>
                            <Input 
                                id="lng-input"
                                type="number" 
                                step="0.000001"
                                value={projectData.coordinates.lng}
                                onChange={(e) => {
                                    const newLng = parseFloat(e.target.value) || 0;
                                    setProjectData((prev: any) => ({ ...prev, coordinates: { ...prev.coordinates, lng: newLng } }));
                                }}
                                onBlur={() => fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng)}
                                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Meteorological Data Source Selection */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <Database className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white">Meteorological Data Source</CardTitle>
                            <CardDescription className="text-cyan-300/70">Solar radiation and weather data from NREL PVWatts</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-3">
                        <Label htmlFor="meteo-source" className="font-semibold flex items-center gap-2 text-cyan-200">
                            <Database className="h-4 w-4 text-indigo-400" />
                            Weather Data Source
                        </Label>
                        <div className="relative">
                            <select
                                id="meteo-source"
                                value={meteoDataSource}
                                onChange={(e) => handleMeteoDataSourceChange(e.target.value)}
                                className="w-full h-11 px-4 pr-10 bg-[#0f1729] border border-slate-600/50 text-white rounded-lg focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all appearance-none cursor-pointer font-medium [&>option]:bg-[#0f1729] [&>option]:text-white [&>option:checked]:bg-cyan-700 [&>option:hover]:bg-slate-700"
                            >
                                <option value="nsrdb">NSRDB - Global coverage (2020 TMY, Recommended for all locations)</option>
                                <option value="tmy2">TMY2 - US only (1961-1990 Archive)</option>
                                <option value="tmy3">TMY3 - US only (1991-2005 Archive)</option>
                                <option value="intl">International - Specific weather stations only</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400 pointer-events-none rotate-90" />
                        </div>
                        
                        {/* Info Cards */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2">
                                {/* NSRDB Info */}
                                <div className={`p-3 rounded-lg border transition-all ${meteoDataSource === 'nsrdb' ? 'bg-green-900/30 border-green-500/40' : 'bg-slate-800/50 border-slate-600/40'}`}>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className={`h-4 w-4 mt-0.5 ${meteoDataSource === 'nsrdb' ? 'text-green-400' : 'text-cyan-400/50'}`} />
                                        <div className="flex-1">
                                            <p className={`text-xs font-bold ${meteoDataSource === 'nsrdb' ? 'text-green-300' : 'text-cyan-200'}`}>
                                                NSRDB (Recommended)
                                            </p>
                                            <p className="text-xs text-cyan-300/60 mt-0.5">
                                                ✅ Works globally including US, India, Europe, Asia, Africa
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* TMY2/TMY3 Warning */}
                                {(meteoDataSource === 'tmy2' || meteoDataSource === 'tmy3') && (
                                    <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-500/40">
                                        <div className="flex items-start gap-2">
                                            <XCircle className="h-4 w-4 mt-0.5 text-amber-400" />
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-amber-300">
                                                    {meteoDataSource.toUpperCase()} - US Only
                                                </p>
                                                <p className="text-xs text-amber-300/70 mt-0.5">
                                                    ⚠️ This dataset only works for US locations. For international locations, use NSRDB.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* International Warning */}
                                {meteoDataSource === 'intl' && (
                                    <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-500/40">
                                        <div className="flex items-start gap-2">
                                            <HelpCircle className="h-4 w-4 mt-0.5 text-blue-400" />
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-blue-300">
                                                    International Dataset - Limited Coverage
                                                </p>
                                                <p className="text-xs text-blue-300/70 mt-0.5">
                                                    ℹ️ Only available for specific international weather stations. If unavailable, use NSRDB instead.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <Button 
                                    onClick={() => fetchMeteoData(projectData.coordinates.lat, projectData.coordinates.lng)}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoadingMeteo}
                                    className="flex items-center gap-2 bg-slate-800/80 border-cyan-500/30 text-cyan-100 hover:bg-slate-700 hover:border-cyan-400"
                                >
                                    <RotateCw className={`h-4 w-4 ${isLoadingMeteo ? 'animate-spin' : ''}`} />
                                    Refresh Data
                                </Button>
                                <div className="flex-1 p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/40">
                                    <p className="text-xs text-indigo-300">
                                        Auto-updates on location change
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLoadingMeteo && (
                        <div className="flex items-center justify-center p-8 bg-blue-900/20 rounded-lg border border-blue-500/30">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                <span className="text-cyan-100 font-medium">Fetching meteorological data...</span>
                            </div>
                        </div>
                    )}

                    {meteoData && !isLoadingMeteo && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-lg border border-green-500/40">
                                <h4 className="font-bold text-green-300 flex items-center gap-2 mb-3">
                                    <CheckCircle className="h-5 w-5" />
                                    Location Data Retrieved
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-cyan-300/60">Location:</span>
                                        <p className="font-semibold text-cyan-100">{meteoData.location}</p>
                                    </div>
                                    <div>
                                        <span className="text-cyan-300/60">City:</span>
                                        <p className="font-semibold text-cyan-100">{meteoData.city}, {meteoData.state}</p>
                                    </div>
                                    <div>
                                        <span className="text-cyan-300/60">Elevation:</span>
                                        <p className="font-semibold text-cyan-100">{meteoData.elevation} m</p>
                                    </div>
                                    <div>
                                        <span className="text-cyan-300/60">Timezone:</span>
                                        <p className="font-semibold text-cyan-100">UTC {meteoData.timezone > 0 ? '+' : ''}{meteoData.timezone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-[#2d3748] border border-amber-500/30 shadow-lg">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-amber-400">Avg Annual Solar Radiation</span>
                                            <Sun className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-amber-400">{meteoData.avgDailySolarRad} kWh/m²/day</p>
                                        <p className="text-xs text-cyan-300/70 mt-1">{meteoData.annualSolarRad} kWh/m²/year</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-[#2d3748] border border-blue-500/30 shadow-lg">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-blue-400">Average Temperature</span>
                                            <TrendingUp className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-blue-400">{meteoData.avgAnnualTemp}°C</p>
                                        <p className="text-xs text-cyan-300/70 mt-1">Range: {meteoData.minTemp}°C to {meteoData.maxTemp}°C</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30">
                                <p className="text-xs text-cyan-200">
                                    <span className="font-semibold">Data Source:</span> <span className="text-cyan-300/70">{meteoData.solarResourceFile}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const DesignAssist = ({ projectData, loadData, setPvParams, setSizingParams, setActivePage }: any) => {
    // ✅ UPDATED: Complete calculation methodology with day/night separation
    const hourlyData = loadData.weekday || [];
    
    // Get solar irradiation data
    const avgDailySolarIrradiation = projectData.avgDailySolarIrradiation || 5.0;
    
    // Step 1: Separate day and night energy
    const energySplit = useMemo(() => separateDayNightEnergy(hourlyData), [hourlyData]);
    const { daytimeEnergy, nighttimeEnergy, totalEnergy, peakDaytimeLoad, peakNighttimeLoad, peakLoad } = energySplit;
    
    // Calculate recommendations using new methodology
    const recommendations = useMemo(() => {
        // Design Parameters
        const solarUncertainty = 0.10;
        const pvSystemLosses = 0.15;
        const chargingEfficiency = 0.95;
        const dischargingEfficiency = 0.95;
        const daysOfAutonomy = 1;
        const depthOfDischarge80 = 0.80;
        const depthOfDischarge90 = 0.90;
        
        // ✅ PHASE 1: Battery Capacity (Based on nighttime energy ONLY)
        const battery80 = calculateBatteryCapacity(nighttimeEnergy, dischargingEfficiency, depthOfDischarge80, daysOfAutonomy);
        const battery90 = calculateBatteryCapacity(nighttimeEnergy, dischargingEfficiency, depthOfDischarge90, daysOfAutonomy);
        
        // ✅ PHASE 2: PV Capacity (Daytime load + Battery charging)
        const pvSizing = calculatePVCapacity(
            daytimeEnergy,
            nighttimeEnergy,
            avgDailySolarIrradiation,
            pvSystemLosses,
            chargingEfficiency,
            solarUncertainty
        );
        
        // ✅ PHASE 3: Inverter Sizing
        // AC Coupled: Battery Inverter
        const batteryInvAC = calculateBatteryInverterAC(
            battery80.nameplateCapacity,
            peakNighttimeLoad,
            BATTERY_C_RATE,
            1.2 // 20% safety margin
        );
        
        // DC Coupled: Hybrid Inverter
        const hybridInvDC = calculateHybridInverterDC(
            battery80.nameplateCapacity,
            peakLoad,
            pvSizing.pvCapacity,
            BATTERY_C_RATE,
            0.6 // 60% concurrent charging factor
        );
        
        // AC Coupled: PV Inverter
        const pvInvAC = calculatePVInverterAC(
            pvSizing.pvCapacity,
            1.25, // DC:AC ratio
            peakDaytimeLoad
        );
        
        return {
            // Energy Breakdown
            daytimeEnergy,
            nighttimeEnergy,
            totalEnergy,
            peakDaytimeLoad,
            peakNighttimeLoad,
            peakLoad,
            
            // PV System
            pvSize: pvSizing.pvCapacity,
            totalEnergyRequired: pvSizing.totalEnergyRequired,
            batteryChargingEnergy: pvSizing.batteryChargingEnergy,
            pvSystemLosses: pvSystemLosses * 100,
            pvSystemEfficiency: pvSizing.pvSystemEfficiency * 100,
            solarUncertainty: solarUncertainty * 100,
            adjustedSolarIrradiation: pvSizing.adjustedSolarIrradiation,
            pvWithOverloading: pvSizing.pvCapacity * 1.2, // PV capacity with 120% DC overloading
            
            // Battery System (80% DoD)
            batteryCapacity80DoD: battery80.nameplateCapacity,
            usableBatteryCapacity80: battery80.usableCapacity,
            depthOfDischarge80: depthOfDischarge80 * 100,
            
            // Battery System (90% DoD)
            batteryCapacity90DoD: battery90.nameplateCapacity,
            usableBatteryCapacity90: battery90.usableCapacity,
            depthOfDischarge90: depthOfDischarge90 * 100,
            
            // Efficiencies
            chargingEfficiency: chargingEfficiency * 100,
            dischargingEfficiency: dischargingEfficiency * 100,
            roundTripEfficiency: (chargingEfficiency * dischargingEfficiency) * 100,
            inverterEfficiency: INVERTER_EFFICIENCY * 100,
            
            // Inverter - DC Coupled (Hybrid)
            dcCoupledInverterRating: hybridInvDC.requiredRating,
            dcCoupledPeakLoadScenario: hybridInvDC.peakLoadScenario,
            dcCoupledPvOverloadScenario: hybridInvDC.pvOverloadScenario,
            dcCoupledLoadPlusChargingScenario: hybridInvDC.loadPlusChargingScenario,
            dcCoupledDischargingScenario: hybridInvDC.dischargingScenario,
            
            // Inverter - AC Coupled (Battery Inverter)
            acCoupledBatteryInverterRating: batteryInvAC.requiredRating,
            acCoupledBatteryDischargePower: batteryInvAC.dischargePower,
            acCoupledBatteryChargingPower: batteryInvAC.chargingPower,
            
            // Inverter - AC Coupled (PV Inverter)
            acCoupledPvInverterRating: pvInvAC.recommendedRating,
            acCoupledPvInverterByDcAcRatio: pvInvAC.ratingByDcAcRatio,
            acCoupledPvInverterByOverload: pvInvAC.ratingByOverload,
            
            // Battery C-Rate
            batteryCRate: BATTERY_C_RATE,
            batteryChargingRate: battery80.nameplateCapacity * BATTERY_C_RATE,
            batteryDischargingRate: battery80.nameplateCapacity * BATTERY_C_RATE,
            
            // General
            daysOfAutonomy,
        };
    }, [daytimeEnergy, nighttimeEnergy, peakLoad, peakDaytimeLoad, peakNighttimeLoad, avgDailySolarIrradiation]);
    
    const handleApplyRecommendations = () => {
        // Apply PV recommendations
        setPvParams((prev: any) => ({
            ...prev,
            systemSize: parseFloat(recommendations.pvSize.toFixed(2)),
            psh: avgDailySolarIrradiation,
        }));
        
        // Apply sizing recommendations
        setSizingParams((prev: any) => ({
            ...prev,
            autonomy: recommendations.daysOfAutonomy,
        }));
        
        sonnerToast.success('Design recommendations applied!', {
            description: `PV: ${recommendations.pvSize.toFixed(2)} kWp, Battery: ${recommendations.batteryCapacity80DoD.toFixed(2)} kWh (80% DoD)`
        });
    };
    
    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 min-h-screen">
            {/* Header Card */}
            <Card className="border border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-purple-500/30">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                            <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Design Assist</CardTitle>
                            <CardDescription className="text-base text-purple-200/70">
                                AI-powered system sizing recommendations based on your location and load profile
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Analysis Summary */}
            <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
                <CardHeader className="bg-slate-800/70 border-b border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg">
                            <BarChart2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Load & Solar Analysis</CardTitle>
                            <CardDescription className="text-blue-200/70">Key metrics from your project configuration</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* ✅ NEW: Energy Breakdown with Day/Night Split */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-cyan-200">☀️ Daytime Energy</span>
                                <Sun className="h-5 w-5 text-cyan-400" />
                            </div>
                            <p className="text-2xl font-bold text-cyan-100">{daytimeEnergy.toFixed(2)} kWh</p>
                            <p className="text-xs text-cyan-300/70 mt-1">6:00 AM - 6:00 PM (PV supplies)</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-200">🌙 Nighttime Energy</span>
                                <BatteryCharging className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-2xl font-bold text-purple-100">{nighttimeEnergy.toFixed(2)} kWh</p>
                            <p className="text-xs text-purple-300/70 mt-1">6:00 PM - 6:00 AM (Battery supplies)</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-blue-500/40 shadow-lg shadow-blue-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-200">📊 Total Daily Energy</span>
                                <Zap className="h-5 w-5 text-blue-400" />
                            </div>
                            <p className="text-2xl font-bold text-blue-100">{totalEnergy.toFixed(2)} kWh</p>
                            <p className="text-xs text-blue-300/70 mt-1">24-hour consumption</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-red-500/40 shadow-lg shadow-red-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-red-200">Peak Load (Overall)</span>
                                <TrendingUp className="h-5 w-5 text-red-400" />
                            </div>
                            <p className="text-2xl font-bold text-red-100">{peakLoad.toFixed(2)} kW</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-orange-500/40 shadow-lg shadow-orange-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-orange-200">Peak Daytime Load</span>
                                <Sun className="h-5 w-5 text-orange-400" />
                            </div>
                            <p className="text-2xl font-bold text-orange-100">{peakDaytimeLoad.toFixed(2)} kW</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-indigo-200">Peak Nighttime Load</span>
                                <BatteryCharging className="h-5 w-5 text-indigo-400" />
                            </div>
                            <p className="text-2xl font-bold text-indigo-100">{peakNighttimeLoad.toFixed(2)} kW</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/70 rounded-lg border border-amber-500/40 shadow-lg shadow-amber-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-amber-200">Solar Irradiation</span>
                                <Sun className="h-5 w-5 text-amber-400" />
                            </div>
                            <p className="text-2xl font-bold text-amber-100">{avgDailySolarIrradiation.toFixed(2)} kWh/m²/day</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Design Recommendations */}
            <Card className="border border-green-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
                <CardHeader className="bg-slate-800/70 border-b border-green-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">Recommended System Configuration</CardTitle>
                                <CardDescription className="text-green-200/70">Optimized sizing based on your requirements</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={handleApplyRecommendations}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                        >
                            Apply Recommendations
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* PV Recommendation */}
                        <div className="p-6 bg-slate-800/60 rounded-xl border border-yellow-500/40">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                                    <Sun className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent mb-2">Solar PV System</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm text-yellow-200/70 mb-1">Recommended Capacity</p>
                                            <p className="text-3xl font-bold text-yellow-300">{recommendations.pvSize.toFixed(2)} kWp</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-yellow-200/70 mb-1">System Efficiency</p>
                                            <p className="text-2xl font-bold text-yellow-300">{recommendations.pvSystemEfficiency.toFixed(0)}%</p>
                                            <p className="text-xs text-yellow-200/50 mt-0.5">(15% system losses)</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-yellow-200/70 mb-1">Solar Uncertainty</p>
                                            <p className="text-2xl font-bold text-yellow-300">{recommendations.solarUncertainty.toFixed(0)}%</p>
                                            <p className="text-xs text-yellow-200/50 mt-0.5">Safety margin</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-700/40 rounded-lg border border-yellow-500/20">
                                        <p className="text-xs text-yellow-100">
                                            <span className="font-semibold">Calculation Basis:</span>
                                        </p>
                                        <ul className="text-xs text-yellow-100/80 list-disc list-inside ml-2 mt-1 space-y-0.5">
                                            <li>Daily energy: {totalEnergy.toFixed(2)} kWh (Day: {daytimeEnergy.toFixed(1)} kWh + Night: {nighttimeEnergy.toFixed(1)} kWh)</li>
                                            <li>Adjusted solar irradiation: {recommendations.adjustedSolarIrradiation.toFixed(2)} kWh/m²/day (after {recommendations.solarUncertainty}% uncertainty)</li>
                                            <li>PV losses: Soiling, wiring, module quality, mismatch = {recommendations.pvSystemLosses.toFixed(0)}% total</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Battery Recommendation */}
                        <div className="p-6 bg-slate-800/60 rounded-xl border border-blue-500/40">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                                    <BatteryCharging className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent mb-2">Battery Energy Storage</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div className="p-3 bg-slate-700/40 rounded-lg border border-blue-500/30">
                                            <p className="text-xs text-blue-200/70 mb-1 font-medium">Conservative Sizing (80% DoD)</p>
                                            <p className="text-2xl font-bold text-blue-300">{recommendations.batteryCapacity80DoD.toFixed(2)} kWh</p>
                                            <p className="text-xs text-blue-200/50 mt-1">Longer battery lifespan</p>
                                        </div>
                                        <div className="p-3 bg-slate-700/40 rounded-lg border border-indigo-500/30">
                                            <p className="text-xs text-indigo-200/70 mb-1 font-medium">Li-ion Optimized (90% DoD)</p>
                                            <p className="text-2xl font-bold text-indigo-300">{recommendations.batteryCapacity90DoD.toFixed(2)} kWh</p>
                                            <p className="text-xs text-indigo-200/50 mt-1">Optimal for Li-ion chemistry</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div className="text-center p-2 bg-slate-700/40 rounded-lg border border-blue-500/20">
                                            <p className="text-xs text-blue-200/70 mb-1">Charging Efficiency</p>
                                            <p className="text-lg font-bold text-blue-300">{recommendations.chargingEfficiency.toFixed(0)}%</p>
                                        </div>
                                        <div className="text-center p-2 bg-slate-700/40 rounded-lg border border-blue-500/20">
                                            <p className="text-xs text-blue-200/70 mb-1">Discharging Efficiency</p>
                                            <p className="text-lg font-bold text-blue-300">{recommendations.dischargingEfficiency.toFixed(0)}%</p>
                                        </div>
                                        <div className="text-center p-2 bg-slate-700/40 rounded-lg border border-blue-500/20">
                                            <p className="text-xs text-blue-200/70 mb-1">Round-Trip Efficiency</p>
                                            <p className="text-lg font-bold text-blue-300">{recommendations.roundTripEfficiency.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-700/40 rounded-lg border border-blue-500/20">
                                        <p className="text-xs text-blue-100">
                                            <span className="font-semibold">Calculation Basis:</span>
                                        </p>
                                        <ul className="text-xs text-blue-100/80 list-disc list-inside ml-2 mt-1 space-y-0.5">
                                            <li>{recommendations.daysOfAutonomy} day autonomy requirement</li>
                                            <li>Conversion losses: {(100 - recommendations.roundTripEfficiency).toFixed(0)}% round-trip losses included</li>
                                            <li>80% DoD: Conservative, extends battery life (Lead-Acid, LFP)</li>
                                            <li>90% DoD: Optimal for modern Li-ion batteries (NMC, NCA)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inverter Recommendations - DC vs AC Coupled */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">Inverter Configuration Options</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* DC Coupled - Hybrid Inverter */}
                                <div className="p-5 bg-slate-800/60 rounded-xl border border-purple-500/40">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-md">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-purple-200">DC Coupled System</h4>
                                            <p className="text-xs text-purple-300/70">Single Hybrid Inverter</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-700/40 rounded-lg border border-purple-500/20 mb-3">
                                        <p className="text-sm text-purple-200/70 mb-1">Hybrid Inverter Rating</p>
                                        <p className="text-3xl font-bold text-purple-300">{recommendations.dcCoupledInverterRating.toFixed(2)} kW</p>
                                        <p className="text-xs text-purple-200/50 mt-1">120% DC overloading capable</p>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        <p className="text-xs font-semibold text-purple-200">Must Handle:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-slate-700/40 rounded border border-purple-500/20 text-center">
                                                <p className="text-xs text-purple-200/70">Peak Load</p>
                                                <p className="text-sm font-bold text-purple-300">{peakLoad.toFixed(2)} kW</p>
                                            </div>
                                            <div className="p-2 bg-slate-700/40 rounded border border-purple-500/20 text-center">
                                                <p className="text-xs text-purple-200/70">PV + Overload</p>
                                                <p className="text-sm font-bold text-purple-300">{recommendations.pvWithOverloading.toFixed(2)} kW</p>
                                            </div>
                                            <div className="p-2 bg-slate-700/40 rounded border border-purple-500/20 text-center">
                                                <p className="text-xs text-purple-200/70">Bat. Charge (0.5C)</p>
                                                <p className="text-sm font-bold text-purple-300">{recommendations.batteryChargingRate.toFixed(2)} kW</p>
                                            </div>
                                            <div className="p-2 bg-slate-700/40 rounded border border-purple-500/20 text-center">
                                                <p className="text-xs text-purple-200/70">Bat. Discharge (0.5C)</p>
                                                <p className="text-sm font-bold text-purple-300">{recommendations.batteryDischargingRate.toFixed(2)} kW</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 bg-slate-700/40 rounded-lg border border-purple-500/20">
                                        <p className="text-xs text-purple-100"><strong>Advantage:</strong> Lower cost, simpler installation, higher efficiency</p>
                                    </div>
                                </div>
                                
                                {/* AC Coupled - Separate Inverters */}
                                <div className="p-5 bg-slate-800/60 rounded-xl border border-cyan-500/40">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg shadow-md">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-cyan-200">AC Coupled System</h4>
                                            <p className="text-xs text-cyan-300/70">PV Inverter + Battery Inverter</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="p-3 bg-slate-700/40 rounded-lg border border-cyan-500/20">
                                            <p className="text-xs text-cyan-200/70 mb-1">PV Inverter</p>
                                            <p className="text-2xl font-bold text-cyan-300">{recommendations.acCoupledPvInverterRating.toFixed(2)} kW</p>
                                            <p className="text-xs text-cyan-200/50 mt-1">120% overload</p>
                                        </div>
                                        <div className="p-3 bg-slate-700/40 rounded-lg border border-cyan-500/20">
                                            <p className="text-xs text-cyan-200/70 mb-1">Battery Inverter</p>
                                            <p className="text-2xl font-bold text-cyan-300">{recommendations.acCoupledBatteryInverterRating.toFixed(2)} kW</p>
                                            <p className="text-xs text-cyan-200/50 mt-1">Bi-directional</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        <p className="text-xs font-semibold text-cyan-200">Battery Inverter Handles:</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-2 bg-slate-700/40 rounded border border-cyan-500/20 text-center">
                                                <p className="text-xs text-cyan-200/70">Peak Load</p>
                                                <p className="text-sm font-bold text-cyan-300">{peakLoad.toFixed(2)} kW</p>
                                            </div>
                                            <div className="p-2 bg-slate-700/40 rounded border border-cyan-500/20 text-center">
                                                <p className="text-xs text-cyan-200/70">Charge (0.5C)</p>
                                                <p className="text-sm font-bold text-cyan-300">{recommendations.batteryChargingRate.toFixed(2)} kW</p>
                                            </div>
                                            <div className="p-2 bg-slate-700/40 rounded border border-cyan-500/20 text-center">
                                                <p className="text-xs text-cyan-200/70">Discharge (0.5C)</p>
                                                <p className="text-sm font-bold text-cyan-300">{recommendations.batteryDischargingRate.toFixed(2)} kW</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 bg-slate-700/40 rounded-lg border border-cyan-500/20">
                                        <p className="text-xs text-cyan-100"><strong>Advantage:</strong> Flexible, can retrofit existing PV, better monitoring</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-slate-700/40 rounded-lg border border-purple-500/20">
                                <p className="text-xs text-purple-100">
                                    <span className="font-semibold">Note:</span> Battery C-rate: 0.5C for both charging and discharging (conservative, extends battery life). Based on {recommendations.batteryCapacity80DoD.toFixed(2)} kWh battery system (80% DoD).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="mt-6 p-4 bg-slate-800/60 rounded-lg border border-amber-500/40">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-lg flex-shrink-0">
                                <HelpCircle className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Important Notes - Comprehensive Design Approach:</p>
                                <ul className="text-xs text-amber-100/80 space-y-1 list-disc list-inside">
                                    <li><strong>Solar Irradiation:</strong> {recommendations.solarUncertainty.toFixed(0)}% uncertainty factor applied for conservative PV sizing</li>
                                    <li><strong>PV System Losses:</strong> {recommendations.pvSystemLosses.toFixed(0)}% total losses (soiling, wiring, module quality, mismatch, temperature)</li>
                                    <li><strong>Battery Conversion:</strong> {recommendations.roundTripEfficiency.toFixed(0)}% round-trip efficiency ({recommendations.chargingEfficiency.toFixed(0)}% charging × {recommendations.dischargingEfficiency.toFixed(0)}% discharging)</li>
                                    <li><strong>DoD Options:</strong> 80% DoD for conservative/longer life (Lead-Acid, LFP) | 90% DoD optimal for Li-ion (NMC, NCA)</li>
                                    <li><strong>Inverter Sizing:</strong> Based on battery system capacity, considering all scenarios (peak load, PV overload, battery charge/discharge)</li>
                                    <li><strong>Future Expansion:</strong> These are minimum recommended values - consider adding 10-20% margin for future growth</li>
                                    <li>Click "Apply Recommendations" to automatically populate PV Sizing and System Sizing parameters</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const LoadAnalysis = ({ loadData, setLoadData, applicationType, setSizingParams, sizingParams, setActivePage, projectData }: any) => {
    // Use weekday profile as the single daily profile
    const hourlyData = loadData.weekday || [];
    const dailyTotal = useMemo(() => hourlyData.reduce((sum: number, val: number) => sum + val, 0), [hourlyData]);
    const peakLoad = useMemo(() => Math.max(...hourlyData), [hourlyData]);
    const avgLoad = useMemo(() => dailyTotal / 24, [dailyTotal]);
    const chartData = hourlyData.map((load: number, hour: number) => ({ name: `${hour}:00`, 'Load (kW)': load }));
    
    const handleHourlyChange = (index: number, value: string) => { 
        const newHourly = [...hourlyData]; 
        newHourly[index] = parseFloat(value) || 0; 
        setLoadData({...loadData, weekday: newHourly}); 
    };
    
    const description = applicationType === 'Utility Scale' ? 
        "Define the charge (negative) and discharge (positive) profile for grid services." : 
        "Configure your daily energy consumption pattern and battery autonomy requirements.";
    
    return (
        <div className="space-y-6 p-6">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                            <BarChart2 className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-cyan-100">Daily Load Profile</h2>
                            <p className="text-cyan-300/60 text-sm">{description}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Days of Autonomy Selector - Compact */}
            <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-indigo-500/40 shadow-xl backdrop-blur-sm">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                                <BatteryCharging className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div className="flex items-center gap-4 flex-1">
                                <div>
                                    <Label htmlFor="autonomy-days" className="text-sm font-semibold text-cyan-100 flex items-center gap-2">
                                        Battery Autonomy
                                        <TooltipWrapper content="Number of days the battery can power your loads without any solar or grid charging. More days = larger battery capacity required.">
                                            <HelpCircle className="h-4 w-4 text-cyan-400/60 cursor-help" />
                                        </TooltipWrapper>
                                    </Label>
                                    <p className="text-xs text-cyan-300/60 mt-0.5">Days without charging</p>
                                </div>
                                <Input 
                                    id="autonomy-days"
                                    type="number" 
                                    min="1"
                                    max="5"
                                    value={sizingParams?.autonomy || 1}
                                    onChange={(e) => {
                                        const value = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                                        setSizingParams({...sizingParams, autonomy: value});
                                    }}
                                    className="w-24 h-10 text-center font-bold bg-[#0f1729] border border-slate-600/50 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                                />
                                <span className="text-xs text-cyan-300/60">days (1-5)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-indigo-500/40">
                            <div>
                                <p className="text-xs text-indigo-300 font-medium">Required Storage</p>
                                <p className="text-xl font-bold text-indigo-300">
                                    {(dailyTotal * (sizingParams?.autonomy || 1)).toFixed(2)} kWh
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Load Profile Chart */}
            <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/30 shadow-2xl backdrop-blur-sm">
                <CardHeader className="bg-slate-950/50 border-b border-cyan-500/20 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                            <TrendingUp className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-cyan-100">24-Hour Energy Consumption Pattern</CardTitle>
                            <CardDescription className="text-cyan-300/60">Visualize your hourly load distribution throughout the day</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={11} 
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <YAxis 
                                    unit=" kW" 
                                    fontSize={12} 
                                    domain={['auto', 'auto']}
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <Tooltip 
                                    cursor={{fill: 'rgba(6, 182, 212, 0.15)'}} 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(15, 23, 41, 0.95)', 
                                        border: '2px solid #06b6d4', 
                                        borderRadius: '0.75rem',
                                        padding: '12px'
                                    }} 
                                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '4px' }}
                                    itemStyle={{ color: '#06b6d4' }}
                                />
                                <Bar 
                                    dataKey="Load (kW)" 
                                    fill="url(#loadGradient)" 
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Load Data Grid & Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Hourly Data Input */}
                <Card className="xl:col-span-2 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/30 shadow-2xl backdrop-blur-sm">
                    <CardHeader className="bg-slate-950/50 border-b border-cyan-500/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-lg border border-slate-500/20">
                                <Settings className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <CardTitle className="text-cyan-100">Hourly Load Data Input</CardTitle>
                                <CardDescription className="text-cyan-300/60">Enter power consumption (kW) for each hour of the day</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {hourlyData.map((load: number, index: number) => (
                                <div key={index} className="relative group">
                                    <Label 
                                        htmlFor={`hour-${index}`} 
                                        className="text-xs font-semibold text-cyan-200 mb-1 block"
                                    >
                                        {`${String(index).padStart(2, '0')}:00`}
                                    </Label>
                                    <Input 
                                        id={`hour-${index}`} 
                                        type="number" 
                                        value={load} 
                                        onChange={(e) => handleHourlyChange(index, e.target.value)} 
                                        className="text-sm font-medium p-2 h-10 bg-slate-800/80 border border-cyan-500/30 text-cyan-100 focus:border-blue-400 transition-all group-hover:border-cyan-400"
                                        step="0.1"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Statistics */}
                <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-green-500/40 shadow-2xl backdrop-blur-sm">
                    <CardHeader className="bg-slate-950/50 border-b border-green-500/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                                <Zap className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-cyan-100">Load Summary</CardTitle>
                                <CardDescription className="text-cyan-300/60">Key metrics from your profile</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-blue-500/40 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-300">Total Daily Energy</span>
                                <Zap className="h-5 w-5 text-blue-400" />
                            </div>
                            <p className="text-3xl font-bold text-blue-300">{dailyTotal.toFixed(2)} kWh</p>
                            <p className="text-xs text-cyan-300/60 mt-1">Sum of all 24 hours</p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-red-500/40 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-red-300">Peak Load Demand</span>
                                <TrendingUp className="h-5 w-5 text-red-400" />
                            </div>
                            <p className="text-3xl font-bold text-red-300">{peakLoad.toFixed(2)} kW</p>
                            <p className="text-xs text-cyan-300/60 mt-1">Maximum hourly load</p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-green-500/40 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-300">Average Load</span>
                                <BarChart2 className="h-5 w-5 text-green-400" />
                            </div>
                            <p className="text-3xl font-bold text-green-300">{avgLoad.toFixed(2)} kW</p>
                            <p className="text-xs text-cyan-300/60 mt-1">Mean across 24 hours</p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-xl border border-purple-500/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-purple-300">Load Factor</span>
                                <CheckCircle className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-3xl font-bold text-purple-300">
                                {peakLoad > 0 ? ((avgLoad / peakLoad) * 100).toFixed(1) : 0}%
                            </p>
                            <p className="text-xs text-purple-300/70 mt-1">Average ÷ Peak × 100</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const PVSizing = ({ pvParams, setPvParams, pvResults, couplingType, bessCapacity, avgDailySolarIrradiation, batterySelection, daytimeEnergy, nighttimeEnergy }: any) => {
    const [pvModules, setPvModules] = useState<any[]>([]);
    const [pvInverters, setPvInverters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hybridInverter, setHybridInverter] = useState<any>(null);
    
    // ✅ Use pvParams for persistent state (moved from local state)
    const selectedModuleId = pvParams.selectedModuleId || '';
    const selectedPvInverterId = pvParams.selectedInverterId || '';
    const inverterQuantity = pvParams.inverterQuantity || 1;
    const stringsConfig = pvParams.stringsConfig || { modulesPerString: 20, strings: 2 };
    
    // Helper functions to update pvParams
    const setSelectedModuleId = (id: string) => {
        // Also save the module power when module is selected
        const module = pvModules.find(m => m.id === id);
        const modulePower = module?.max_power_w || module?.nominal_power_w || 630;
        setPvParams({...pvParams, selectedModuleId: id, moduleMaxPower: modulePower});
    };
    const setSelectedPvInverterId = (id: string) => setPvParams({...pvParams, selectedInverterId: id});
    const setInverterQuantity = (qty: number) => setPvParams({...pvParams, inverterQuantity: qty});
    const setStringsConfig = (config: any) => setPvParams({...pvParams, stringsConfig: config});

    // ✅ UPDATED: Calculate suggested PV capacity using correct methodology
    // PV must supply: Daytime Load + Battery Charging (for nighttime use)
    const pvSizing = useMemo(() => {
        // Check for undefined/null, but allow 0 values
        if (daytimeEnergy === undefined || nighttimeEnergy === undefined || !avgDailySolarIrradiation) {
            console.log('⚠️ PVSizing: Missing data', { daytimeEnergy, nighttimeEnergy, avgDailySolarIrradiation });
            return {
                totalEnergyRequired: 0,
                pvCapacity: 0,
                batteryChargingEnergy: 0,
                adjustedSolarIrradiation: 0
            };
        }
        console.log('✅ PVSizing: Calculating with', { daytimeEnergy, nighttimeEnergy, avgDailySolarIrradiation });
        return calculatePVCapacity(
            daytimeEnergy,
            nighttimeEnergy,
            avgDailySolarIrradiation,
            0.15, // PV system losses
            0.95, // Charging efficiency
            0.10  // Solar uncertainty
        );
    }, [daytimeEnergy, nighttimeEnergy, avgDailySolarIrradiation]);
    
    const suggestedPvCapacity = pvSizing.pvCapacity;
    const suggestedInverterCapacity = Math.ceil(suggestedPvCapacity / 1.2); // With 120% DC overload, rounded up
    
    // For DC coupled: get designed hybrid inverter capacity
    const designedHybridInverterCapacity = hybridInverter && couplingType === 'DC' ? 
        (hybridInverter.rated_ac_capacity_kw * (batterySelection?.inverterQuantity || 1)) : 0;
    const dcAcRatioForHybrid = designedHybridInverterCapacity > 0 ? (suggestedPvCapacity / designedHybridInverterCapacity) : 0;

    // Load PV modules from Supabase
    useEffect(() => {
        loadPvModules();
    }, []);

    const loadPvModules = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('solar_panels')
                .select('*')
                .order('nominal_power_w', { ascending: false });
            
            if (error) throw error;
            // Map to expected structure
            const mappedData = data?.map((panel: any) => ({
                ...panel,
                max_power_w: panel.nominal_power_w,
                v_mp_v: panel.vmp_v,
                i_mp_a: panel.imp_a,
                v_oc_v: panel.voc_v,
                i_sc_a: panel.isc_a,
                efficiency: panel.efficiency_percent
            })) || [];
            setPvModules(mappedData);
        } catch (error) {
            console.error('Error loading PV modules:', error);
            sonnerToast.error('Failed to load PV modules');
        } finally {
            setLoading(false);
        }
    };

    // Load PV inverters from Supabase
    const loadPvInverters = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('solar_inverters')
                .select('*')
                .order('nominal_ac_power_kw', { ascending: true });
            
            if (error) throw error;
            // Map to expected structure
            const mappedData = data?.map((inv: any) => ({
                ...inv,
                ac_nom_power_w: inv.nominal_ac_power_kw * 1000,
                dc_max_power_w: inv.maximum_ac_power_kw ? inv.maximum_ac_power_kw * 1000 : inv.nominal_ac_power_kw * 1200,
                mppt_min_v: inv.min_mpp_voltage_v,
                mppt_max_v: inv.nominal_mpp_voltage_v,
                max_input_voltage_v: inv.max_dc_voltage_v,
                mppt_channels: inv.total_mppt || 2
            })) || [];
            setPvInverters(mappedData);
        } catch (error) {
            console.error('Error loading PV inverters:', error);
            sonnerToast.error('Failed to load PV inverters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (couplingType === 'AC') {
            loadPvInverters();
        } else if (couplingType === 'DC') {
            loadHybridInverter();
        }
    }, [couplingType, batterySelection?.selectedInverterId]);
    
    // Load hybrid inverter for DC coupled system
    const loadHybridInverter = async () => {
        if (!batterySelection?.selectedInverterId) return;
        
        setLoading(true);
        try {
            const data = await getHybridInverters({});
            const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
            setHybridInverter(inv);
        } catch (error) {
            console.error('Error loading hybrid inverter:', error);
            sonnerToast.error('Failed to load hybrid inverter details');
        } finally {
            setLoading(false);
        }
    };

    const selectedModule = useMemo(() => {
        if (!selectedModuleId) return null;
        return pvModules.find(m => m.id === selectedModuleId);
    }, [pvModules, selectedModuleId]);

    const selectedPvInverter = useMemo(() => {
        if (!selectedPvInverterId) return null;
        return pvInverters.find(inv => inv.id === selectedPvInverterId);
    }, [pvInverters, selectedPvInverterId]);

    // Calculate total system capacity
    const totalModules = stringsConfig.modulesPerString * stringsConfig.strings;
    const totalSystemCapacity = selectedModule ? (selectedModule.max_power_w * totalModules) / 1000 : 0;
    
    // ✅ FIX: Calculate DC/AC Ratio based on coupling type
    // For AC coupled: use PV inverter capacity
    // For DC coupled: use hybrid inverter capacity
    const totalInverterCapacity = couplingType === 'DC' 
        ? designedHybridInverterCapacity  // Use hybrid inverter AC capacity for DC coupled
        : (selectedPvInverter ? (selectedPvInverter.ac_nom_power_w * inverterQuantity) / 1000 : 0); // Use PV inverter for AC coupled
    
    const dcAcRatio = totalInverterCapacity > 0 ? (totalSystemCapacity / totalInverterCapacity) : 0;

    // Generate IV curve data for selected panel
    const generateIVCurveData = (panel: any) => {
        if (!panel?.v_mp_v || !panel?.i_mp_a || !panel?.v_oc_v || !panel?.i_sc_a) return [];
        
        const data = [];
        const points = 50;
        
        for (let i = 0; i <= points; i++) {
            const voltage = (panel.v_oc_v * i) / points;
            let current;
            
            if (voltage <= panel.v_mp_v) {
                // Linear approximation from Isc to Imp
                current = panel.i_sc_a - ((panel.i_sc_a - panel.i_mp_a) * voltage) / panel.v_mp_v;
            } else {
                // Exponential decay from Imp to 0
                const factor = (voltage - panel.v_mp_v) / (panel.v_oc_v - panel.v_mp_v);
                current = panel.i_mp_a * Math.exp(-3 * factor);
            }
            
            data.push({
                voltage: parseFloat(voltage.toFixed(2)),
                current: parseFloat(Math.max(0, current).toFixed(3)),
                power: parseFloat((voltage * Math.max(0, current)).toFixed(2))
            });
        }
        
        return data;
    };

    const ivCurveData = selectedModule ? generateIVCurveData(selectedModule) : [];

    return (
        <div className="space-y-6">
            {/* TOP SECTION - Suggested PV Configuration - Reduced Height */}
            <Card className="border border-amber-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-amber-500/30">
                <CardHeader className="pb-3 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20">
                            <Sun className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent">
                                ☀️ Suggested PV Configuration
                            </CardTitle>
                            <CardDescription className="text-xs text-amber-300/70">
                                {couplingType === 'DC' ? '⚡ DC Coupled System' : '🔌 AC Coupled System'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/80 rounded-lg border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-indigo-200 tracking-wide uppercase">BESS Capacity</p>
                                <BatteryCharging className="h-4 w-4 text-indigo-400" />
                            </div>
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">{(bessCapacity || 0).toFixed(2)} kWh</p>
                            <p className="text-xs text-indigo-200/70 mt-1">From BESS Config</p>
                        </div>
                        
                        <div className="p-4 bg-slate-800/80 rounded-lg border border-amber-500/40 shadow-lg shadow-amber-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-amber-200 tracking-wide uppercase">Suggested PV</p>
                                <Sun className="h-4 w-4 text-amber-400" />
                            </div>
                            {suggestedPvCapacity > 0 ? (
                                <>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">{suggestedPvCapacity.toFixed(2)} kWp</p>
                                    <p className="text-xs text-amber-200/70 mt-1">
                                        Irradiation: {avgDailySolarIrradiation ? avgDailySolarIrradiation.toFixed(2) : '5.00'} kWh/m²/day
                                    </p>
                                    <p className="text-xs text-amber-200/50 mt-0.5">Day: {daytimeEnergy?.toFixed(1)} + Night: {nighttimeEnergy?.toFixed(1)} kWh</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xl font-bold text-amber-300/50">-- kWp</p>
                                    <p className="text-xs text-amber-200/70 mt-1">⚠️ Configure load profile first</p>
                                </>
                            )}
                        </div>
                        
                                {couplingType === 'AC' ? (
                                    <div className="p-4 bg-slate-800/80 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-purple-200 tracking-wide uppercase">Suggested AC Capacity</p>
                                            <Zap className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{suggestedInverterCapacity} kW</p>
                                        <p className="text-xs text-purple-200/70 mt-1">120% DC overload</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-800/80 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-purple-200 tracking-wide uppercase">Designed Inverter AC</p>
                                            <Zap className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                            {designedHybridInverterCapacity > 0 ? `${designedHybridInverterCapacity.toFixed(2)} kW` : '--'}
                                        </p>
                                        <p className="text-xs text-purple-200/70 mt-1">
                                            DC/AC: {dcAcRatioForHybrid > 0 ? dcAcRatioForHybrid.toFixed(2) : '--'}
                                        </p>
                                    </div>
                                )}
                    </div>
                </CardContent>
            </Card>

            {/* PV MODULE SELECTION & MOUNTING STRUCTURE - 2 Column Layout (SHARED for AC & DC) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: PV Module Selection */}
                <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-blue-500/30">
                    <CardHeader className="pb-3 border-b border-blue-500/20">
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                            ⚡ PV Module Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RotateCw className="h-6 w-6 animate-spin text-blue-400" />
                                <span className="ml-2 text-blue-200">Loading modules...</span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-blue-200">Manufacturer</Label>
                                                <select 
                                                    className="w-full px-3 py-2 bg-slate-800 text-blue-100 border-2 border-blue-500/40 rounded-lg font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                                                    value={pvModules.find(m => m.id === selectedModuleId)?.manufacturer || ''}
                                                    onChange={(e) => {
                                                        const firstModuleOfManufacturer = pvModules.find(m => m.manufacturer === e.target.value);
                                                        if (firstModuleOfManufacturer) {
                                                            setSelectedModuleId(firstModuleOfManufacturer.id);
                                                        }
                                                    }}
                                                >
                                                    <option value="" className="bg-slate-800">-- Select Manufacturer --</option>
                                                    {Array.from(new Set(pvModules.map(m => m.manufacturer))).map((mfr) => (
                                                        <option key={mfr} value={mfr} className="bg-slate-800">{mfr}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-blue-200">Model</Label>
                                                <select 
                                                    className="w-full px-3 py-2 bg-slate-800 text-blue-100 border-2 border-blue-500/40 rounded-lg font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                                                    value={selectedModuleId}
                                                    onChange={(e) => setSelectedModuleId(e.target.value)}
                                                    disabled={!pvModules.find(m => m.id === selectedModuleId)?.manufacturer && !selectedModuleId}
                                                >
                                                    <option value="" className="bg-slate-800">-- Select Model --</option>
                                                    {pvModules
                                                        .filter(m => !selectedModuleId || m.manufacturer === pvModules.find(mod => mod.id === selectedModuleId)?.manufacturer || m.id === selectedModuleId)
                                                        .map((mod) => (
                                                            <option key={mod.id} value={mod.id} className="bg-slate-800">
                                                                {mod.model} - {mod.max_power_w}W
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedModule && (
                                            <div className="p-4 bg-slate-800/70 rounded-lg border border-blue-500/40 space-y-2">
                                                <h4 className="font-bold text-blue-200 mb-3">{selectedModule.manufacturer} {selectedModule.model}</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-blue-200/70">Max Power</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.max_power_w} W</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/70">Efficiency</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.efficiency}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/70">Vmp</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.v_mp_v} V</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/70">Imp</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.i_mp_a} A</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/70">Voc</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.v_oc_v} V</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-200/70">Isc</p>
                                                        <p className="font-bold text-blue-100">{selectedModule.i_sc_a} A</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* RIGHT: Mounting Structure Configuration */}
                        <Card className="border border-green-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-green-500/30">
                <CardHeader className="pb-3 border-b border-green-500/20">
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                        🏗️ Mounting Structure Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Mounting Type Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-green-200">Mounting Type</Label>
                        <select 
                            className="w-full px-3 py-2 bg-slate-800 text-white border-2 border-green-500/40 rounded-lg font-medium focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
                            style={{
                                color: 'white'
                            }}
                            value={pvParams.mountingType || 'Ground-mount'}
                            onChange={(e) => setPvParams({...pvParams, mountingType: e.target.value})}
                        >
                            <option value="Ground-mount" style={{backgroundColor: '#1e293b', color: 'white'}}>Ground-mount</option>
                            <option value="Elevated Rooftop" style={{backgroundColor: '#1e293b', color: 'white'}}>Elevated Rooftop</option>
                            <option value="Ballasted" style={{backgroundColor: '#1e293b', color: 'white'}}>Ballasted</option>
                            <option value="Flash-mount" style={{backgroundColor: '#1e293b', color: 'white'}}>Flash-mount</option>
                        </select>
                    </div>

                    {/* Structure Configuration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-green-200">Modules per Row</Label>
                            <Input 
                                type="number"
                                min="1"
                                value={pvParams.modulesPerRow || 10}
                                onChange={(e) => setPvParams({...pvParams, modulesPerRow: parseInt(e.target.value) || 1})}
                                className="bg-slate-800/80 text-green-100 border-2 border-green-500/40 focus:border-green-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-green-200">Rows per Table</Label>
                            <Input 
                                type="number"
                                min="1"
                                value={pvParams.rowsPerTable || 2}
                                onChange={(e) => setPvParams({...pvParams, rowsPerTable: parseInt(e.target.value) || 1})}
                                className="bg-slate-800/80 text-green-100 border-2 border-green-500/40 focus:border-green-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-green-200">Total Tables</Label>
                            <Input 
                                type="number"
                                min="1"
                                value={pvParams.totalTables || 2}
                                onChange={(e) => setPvParams({...pvParams, totalTables: parseInt(e.target.value) || 1})}
                                className="bg-slate-800/80 text-green-100 border-2 border-green-500/40 focus:border-green-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-green-200">Module Orientation</Label>
                            <select 
                                className="w-full px-3 py-2 bg-slate-800 text-white border-2 border-green-500/40 rounded-lg font-medium focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
                                style={{
                                    color: 'white'
                                }}
                                value={pvParams.moduleOrientation || 'Portrait'}
                                onChange={(e) => setPvParams({...pvParams, moduleOrientation: e.target.value})}
                            >
                                <option value="Portrait" style={{backgroundColor: '#1e293b', color: 'white'}}>Portrait</option>
                                <option value="Landscape" style={{backgroundColor: '#1e293b', color: 'white'}}>Landscape</option>
                            </select>
                        </div>
                    </div>

                    {/* Configuration Summary */}
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-semibold text-green-200">Configuration Summary:</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-green-100/80">
                            <div>
                                <span className="text-green-300/70">Type:</span>
                                <span className="ml-1 font-semibold">{pvParams.mountingType || 'Ground-mount'}</span>
                            </div>
                            <div>
                                <span className="text-green-300/70">Modules/Row:</span>
                                <span className="ml-1 font-semibold">{pvParams.modulesPerRow || 10}</span>
                            </div>
                            <div>
                                <span className="text-green-300/70">Rows/Table:</span>
                                <span className="ml-1 font-semibold">{pvParams.rowsPerTable || 2}</span>
                            </div>
                            <div>
                                <span className="text-green-300/70">Tables:</span>
                                <span className="ml-1 font-semibold">{pvParams.totalTables || 2}</span>
                            </div>
                            <div>
                                <span className="text-green-300/70">Orientation:</span>
                                <span className="ml-1 font-semibold">{pvParams.moduleOrientation || 'Portrait'}</span>
                            </div>
                            <div>
                                <span className="text-green-300/70">Total Modules/Table:</span>
                                <span className="ml-1 font-semibold">{(pvParams.modulesPerRow || 10) * (pvParams.rowsPerTable || 2)}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-green-300/70">System Total Modules:</span>
                                <span className="ml-1 font-semibold">{(pvParams.modulesPerRow || 10) * (pvParams.rowsPerTable || 2) * (pvParams.totalTables || 2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
                    </div>
                    
                    {/* IV CURVE & MODULE DIMENSIONS - Full Width Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT: IV Curve Visualization */}
                        <Card className="border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-cyan-500/30">
                            <CardHeader className="pb-3 border-b border-cyan-500/20">
                                <CardTitle className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                    📊 I-V Curve
                                </CardTitle>
                                <p className="text-xs text-cyan-200/70 mt-1">Electrical performance under Standard Test Conditions (STC)</p>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {selectedModule && ivCurveData.length > 0 ? (
                                    <>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={ivCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis 
                                                        dataKey="voltage" 
                                                        stroke="#67e8f9"
                                                        fontSize={11}
                                                        label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -10, style: { fill: '#a5f3fc' } }}
                                                    />
                                                    <YAxis 
                                                        stroke="#67e8f9"
                                                        fontSize={11}
                                                        label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', style: { fill: '#a5f3fc', textAnchor: 'middle' } }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                                            border: '1px solid #06b6d4',
                                                            borderRadius: '8px',
                                                            color: '#a5f3fc'
                                                        }}
                                                        formatter={(value: number, name: string) => [
                                                            `${value} ${name === 'current' ? 'A' : name === 'voltage' ? 'V' : 'W'}`,
                                                            name === 'current' ? 'Current' : name === 'voltage' ? 'Voltage' : 'Power'
                                                        ]}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="current" 
                                                        stroke="#06b6d4" 
                                                        strokeWidth={3}
                                                        dot={false}
                                                        name="current"
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="power" 
                                                        stroke="#f59e0b" 
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        dot={false}
                                                        name="power"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        {/* Key Performance Points */}
                                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-cyan-500/20">
                                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                                                <p className="text-xs text-cyan-200/70">Voc</p>
                                                <p className="font-bold text-cyan-100">{selectedModule.v_oc_v}V</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                                                <p className="text-xs text-cyan-200/70">Isc</p>
                                                <p className="font-bold text-cyan-100">{selectedModule.i_sc_a}A</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                                                <p className="text-xs text-cyan-200/70">Vmp</p>
                                                <p className="font-bold text-cyan-100">{selectedModule.v_mp_v}V</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                                                <p className="text-xs text-cyan-200/70">Imp</p>
                                                <p className="font-bold text-cyan-100">{selectedModule.i_mp_a}A</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 w-full bg-slate-800/30 rounded-lg border border-cyan-500/20 flex items-center justify-center">
                                        <p className="text-cyan-300/50 text-sm">Select a module to view I-V curve</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* RIGHT: Solar Module Dimensions */}
                        <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-blue-500/30">
                            <CardHeader className="pb-3 border-b border-blue-500/20">
                                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
                                    <Sun className="h-5 w-5 text-blue-400" />
                                    Solar Module Dimensions
                                </CardTitle>
                                <p className="text-xs text-blue-200/70 mt-1">Technical drawing with actual proportions</p>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {selectedModule ? (
                                    <div className="space-y-4">
                                        {/* Solar Panel SVG */}
                                        <div className="bg-slate-700/30 p-4 rounded-lg border border-blue-500/20">
                                            <svg 
                                                viewBox="0 0 400 300" 
                                                className="w-full h-48"
                                            >
                                                <defs>
                                                    {/* Solar cell pattern */}
                                                    <pattern id="solarCells" patternUnits="userSpaceOnUse" width="16" height="16">
                                                        <rect width="15" height="15" fill="#1e293b" stroke="#334155" strokeWidth="0.3" rx="1"/>
                                                        <circle cx="7.5" cy="7.5" r="0.8" fill="#64748b" opacity="0.6"/>
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
                                                    
                                                    {/* Dimension arrows */}
                                                    <marker id="dimArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                                                        <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6"/>
                                                    </marker>
                                                </defs>
                                                
                                                {(() => {
                                                    const length = selectedModule.module_length || selectedModule.length || 2278;
                                                    const width = selectedModule.module_width || selectedModule.width || 1134;
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
                                                            
                                                            {/* Busbar lines */}
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
                                                            
                                                            {/* Dimension Lines */}
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
                                                                className="text-xs font-bold fill-blue-300"
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
                                                                className="text-xs font-bold fill-blue-300"
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
                                                                fill="#94a3b8"
                                                                rx="1"
                                                            />
                                                            <text 
                                                                x={panelX + panelWidth + 50} 
                                                                y={panelY + panelHeight / 2 + 4} 
                                                                className="text-xs font-medium fill-slate-300"
                                                            >
                                                                ~40mm
                                                            </text>
                                                        </g>
                                                    );
                                                })()}
                                            </svg>
                                        </div>
                                        
                                        {/* Technical Specifications */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                            <div className="bg-slate-800/80 p-2 rounded-lg border border-blue-500/20">
                                                <p className="text-xs text-blue-200/70">Panel Area</p>
                                                <p className="font-bold text-blue-100">{selectedModule.panel_area_m2?.toFixed(2) || '2.58'} m²</p>
                                            </div>
                                            <div className="bg-slate-800/80 p-2 rounded-lg border border-blue-500/20">
                                                <p className="text-xs text-blue-200/70">Power Density</p>
                                                <p className="font-bold text-blue-100">
                                                    {selectedModule.panel_area_m2 && selectedModule.max_power_w ? (selectedModule.max_power_w / selectedModule.panel_area_m2).toFixed(0) : '219'} W/m²
                                                </p>
                                            </div>
                                            <div className="bg-slate-800/80 p-2 rounded-lg border border-blue-500/20">
                                                <p className="text-xs text-blue-200/70">Weight</p>
                                                <p className="font-bold text-blue-100">~22 kg</p>
                                            </div>
                                            <div className="bg-slate-800/80 p-2 rounded-lg border border-blue-500/20">
                                                <p className="text-xs text-blue-200/70">Frame Type</p>
                                                <p className="font-bold text-blue-100">Aluminum</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-slate-800/30 rounded-lg border border-blue-500/20 flex items-center justify-center">
                                        <p className="text-blue-300/50 text-sm">Select a module to view dimensions</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* INVERTER SELECTION & STRING SIZING - 2 Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT: PV Inverter Selection (AC) or Hybrid Inverter Details (DC) */}
                        {couplingType === 'AC' ? (
                            <Card className="border border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-purple-500/30">
                                <CardHeader className="pb-3 border-b border-purple-500/20">
                                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                        🔌 PV Inverter Selection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <RotateCw className="h-6 w-6 animate-spin text-purple-400" />
                                            <span className="ml-2 text-purple-200">Loading inverters...</span>
                                        </div>
                                    ) : (
                                        <>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-purple-200">Manufacturer</Label>
                                                <select 
                                                    className="w-full px-3 py-2 bg-slate-800 text-purple-100 border-2 border-purple-500/40 rounded-lg font-medium focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                                    value={pvInverters.find(inv => inv.id === selectedPvInverterId)?.manufacturer || ''}
                                                    onChange={(e) => {
                                                        const firstInverterOfManufacturer = pvInverters.find(inv => inv.manufacturer === e.target.value);
                                                        if (firstInverterOfManufacturer) {
                                                            setSelectedPvInverterId(firstInverterOfManufacturer.id);
                                                        }
                                                    }}
                                                >
                                                    <option value="" className="bg-slate-800">-- Select Manufacturer --</option>
                                                    {Array.from(new Set(pvInverters.map(inv => inv.manufacturer))).map((mfr) => (
                                                        <option key={mfr} value={mfr} className="bg-slate-800">{mfr}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-purple-200">Model</Label>
                                                <select 
                                                    className="w-full px-3 py-2 bg-slate-800 text-purple-100 border-2 border-purple-500/40 rounded-lg font-medium focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                                    value={selectedPvInverterId}
                                                    onChange={(e) => setSelectedPvInverterId(e.target.value)}
                                                    disabled={!pvInverters.find(inv => inv.id === selectedPvInverterId)?.manufacturer && !selectedPvInverterId}
                                                >
                                                    <option value="" className="bg-slate-800">-- Select Model --</option>
                                                    {pvInverters
                                                        .filter(inv => !selectedPvInverterId || inv.manufacturer === pvInverters.find(i => i.id === selectedPvInverterId)?.manufacturer || inv.id === selectedPvInverterId)
                                                        .map((inv) => (
                                                            <option key={inv.id} value={inv.id} className="bg-slate-800">
                                                                {inv.model} - {(inv.ac_nom_power_w / 1000).toFixed(1)}kW
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-purple-200">Quantity</Label>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                value={inverterQuantity}
                                                onChange={(e) => setInverterQuantity(parseInt(e.target.value) || 1)}
                                                className="bg-slate-800 text-purple-100 border-2 border-purple-500/40"
                                            />
                                        </div>

                                        {selectedPvInverter && (
                                            <div className="p-4 bg-slate-800/70 rounded-lg border border-purple-500/40">
                                                <h4 className="font-bold text-purple-200 mb-3">{selectedPvInverter.manufacturer} {selectedPvInverter.model}</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-purple-200/70">AC Power</p>
                                                        <p className="font-bold text-purple-100">{(selectedPvInverter.ac_nom_power_w / 1000).toFixed(2)} kW</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-purple-200/70">Max DC Power</p>
                                                        <p className="font-bold text-purple-100">{(selectedPvInverter.dc_max_power_w / 1000).toFixed(2)} kW</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-purple-200/70">MPPT Range</p>
                                                        <p className="font-bold text-purple-100">{selectedPvInverter.mppt_min_v}-{selectedPvInverter.mppt_max_v}V</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-purple-200/70">Max Voc</p>
                                                        <p className="font-bold text-purple-100">{selectedPvInverter.max_input_voltage_v}V</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-purple-200/70">Total Capacity</p>
                                                        <p className="font-bold text-purple-100">{((selectedPvInverter.ac_nom_power_w / 1000) * inverterQuantity).toFixed(2)} kW</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-purple-200/70">MPPT Inputs</p>
                                                        <p className="font-bold text-purple-100">{selectedPvInverter.mppt_channels}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        ) : (
                            // DC Coupled: Show Hybrid Inverter PV Details
                            <Card className="border border-violet-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-violet-500/30">
                                <CardHeader className="pb-3 border-b border-violet-500/20">
                                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                                        ⚡ Hybrid Inverter - PV Side Parameters
                                    </CardTitle>
                                    <p className="text-xs text-violet-200/70 mt-1">Selected from BESS Configuration</p>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <RotateCw className="h-6 w-6 animate-spin text-violet-400" />
                                            <span className="ml-2 text-violet-200">Loading hybrid inverter...</span>
                                        </div>
                                    ) : hybridInverter ? (
                                        <>
                                            <div className="p-4 bg-slate-800/70 rounded-lg border border-violet-500/40 mb-4">
                                                <h4 className="font-bold text-violet-200 mb-3">{hybridInverter.supplier} {hybridInverter.model}</h4>
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="p-2 bg-slate-800/50 rounded border border-violet-500/20">
                                                        <p className="text-violet-200/70 mb-1">AC Capacity</p>
                                                        <p className="font-bold text-violet-100">{hybridInverter.rated_ac_capacity_kw} kW</p>
                                                    </div>
                                                    <div className="p-2 bg-slate-800/50 rounded border border-violet-500/20">
                                                        <p className="text-violet-200/70 mb-1">Quantity</p>
                                                        <p className="font-bold text-violet-100">{batterySelection?.inverterQuantity || 1}x</p>
                                                    </div>
                                                    <div className="p-2 bg-slate-800/50 rounded border border-violet-500/20">
                                                        <p className="text-violet-200/70 mb-1">Total AC Capacity</p>
                                                        <p className="font-bold text-violet-100">
                                                            {(hybridInverter.rated_ac_capacity_kw * (batterySelection?.inverterQuantity || 1)).toFixed(2)} kW
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-slate-800/50 rounded border border-violet-500/20">
                                                        <p className="text-violet-200/70 mb-1">Max PV Capacity</p>
                                                        <p className="font-bold text-violet-100">{hybridInverter.max_pv_capacity_kwp} kWp</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/30">
                                                <h5 className="font-bold text-violet-200 mb-3 text-sm">PV Input Specifications</h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-violet-200/70">Max DC Voltage</p>
                                                        <p className="font-bold text-violet-100">{hybridInverter.max_pv_dc_voltage_v} V</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-violet-200/70">MPPT Range</p>
                                                        <p className="font-bold text-violet-100">
                                                            {hybridInverter.mppt_voltage_range_min_v}-{hybridInverter.mppt_voltage_range_max_v}V
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-violet-200/70">Max DC Input Current</p>
                                                        <p className="font-bold text-violet-100">{hybridInverter.max_pv_dc_input_current_a} A</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-violet-200/70">AC Voltage</p>
                                                        <p className="font-bold text-violet-100">{hybridInverter.operating_ac_voltage_v} V</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                                <p className="text-xs text-emerald-200">
                                                    <strong>Note:</strong> This hybrid inverter connects directly to the PV array on the DC bus, 
                                                    handling both PV generation and battery charging/discharging.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-violet-300/70 text-sm">No hybrid inverter selected in BESS Configuration</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* RIGHT: String Sizing */}
                        <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-emerald-500/30">
                            <CardHeader className="pb-3 border-b border-emerald-500/20">
                                <CardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                    🔢 String Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {selectedModule && (couplingType === 'AC' ? selectedPvInverter : hybridInverter) ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-emerald-200">Modules per String</Label>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                value={stringsConfig.modulesPerString}
                                                onChange={(e) => setStringsConfig({...stringsConfig, modulesPerString: parseInt(e.target.value) || 1})}
                                                className="bg-slate-800 text-emerald-100 border-2 border-emerald-500/40"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-emerald-200">Number of Strings</Label>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                value={stringsConfig.strings}
                                                onChange={(e) => setStringsConfig({...stringsConfig, strings: parseInt(e.target.value) || 1})}
                                                className="bg-slate-800 text-emerald-100 border-2 border-emerald-500/40"
                                            />
                                        </div>

                                        <div className="p-4 bg-slate-800/70 rounded-lg border border-emerald-500/40 space-y-3">
                                            <h4 className="font-bold text-emerald-200">String Calculations</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-200/70">String Vmp</span>
                                                    <span className="font-bold text-emerald-100">{(selectedModule.v_mp_v * stringsConfig.modulesPerString).toFixed(1)} V</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-200/70">String Voc</span>
                                                    <span className="font-bold text-emerald-100">{(selectedModule.v_oc_v * stringsConfig.modulesPerString).toFixed(1)} V</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-200/70">String Power</span>
                                                    <span className="font-bold text-emerald-100">{((selectedModule.max_power_w * stringsConfig.modulesPerString) / 1000).toFixed(2)} kW</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-emerald-200/70">Total Modules</span>
                                                    <span className="font-bold text-emerald-100">{totalModules}</span>
                                                </div>
                                                <div className="flex justify-between border-t border-emerald-500/20 pt-2 mt-2">
                                                    <span className="text-emerald-200">Total System</span>
                                                    <span className="font-bold text-xl bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">{totalSystemCapacity.toFixed(2)} kWp</span>
                                                </div>
                                            </div>

                                            {/* Validation - AC Coupled */}
                                            {couplingType === 'AC' && selectedPvInverter && (
                                                <>
                                                    {selectedModule.v_oc_v * stringsConfig.modulesPerString > selectedPvInverter.max_input_voltage_v && (
                                                        <div className="p-2 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-200">
                                                            ⚠️ String Voc exceeds inverter max voltage!
                                                        </div>
                                                    )}
                                                    {selectedModule.v_mp_v * stringsConfig.modulesPerString < selectedPvInverter.mppt_min_v && (
                                                        <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-200">
                                                            ⚠️ String Vmp below MPPT minimum!
                                                        </div>
                                                    )}
                                                    {selectedModule.v_mp_v * stringsConfig.modulesPerString >= selectedPvInverter.mppt_min_v && 
                                                     selectedModule.v_mp_v * stringsConfig.modulesPerString <= selectedPvInverter.mppt_max_v &&
                                                     selectedModule.v_oc_v * stringsConfig.modulesPerString <= selectedPvInverter.max_input_voltage_v && (
                                                        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs text-emerald-200">
                                                            ✓ String configuration valid!
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            
                                            {/* Validation - DC Coupled */}
                                            {couplingType === 'DC' && hybridInverter && (
                                                <>
                                                    {selectedModule.v_oc_v * stringsConfig.modulesPerString > hybridInverter.max_pv_dc_voltage_v && (
                                                        <div className="p-2 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-200">
                                                            ⚠️ String Voc exceeds hybrid inverter max DC voltage!
                                                        </div>
                                                    )}
                                                    {selectedModule.v_mp_v * stringsConfig.modulesPerString < hybridInverter.mppt_voltage_range_min_v && (
                                                        <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-200">
                                                            ⚠️ String Vmp below hybrid inverter MPPT minimum!
                                                        </div>
                                                    )}
                                                    {selectedModule.v_mp_v * stringsConfig.modulesPerString >= hybridInverter.mppt_voltage_range_min_v && 
                                                     selectedModule.v_mp_v * stringsConfig.modulesPerString <= hybridInverter.mppt_voltage_range_max_v &&
                                                     selectedModule.v_oc_v * stringsConfig.modulesPerString <= hybridInverter.max_pv_dc_voltage_v && (
                                                        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs text-emerald-200">
                                                            ✓ String configuration valid for hybrid inverter!
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 flex items-center justify-center">
                                        <p className="text-emerald-300/50 text-sm text-center">Select module and inverter<br/>to configure strings</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* SYSTEM SUMMARY - Full Width */}
                    <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-indigo-500/30">
                        <CardHeader className="pb-3 border-b border-indigo-500/20">
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
                                📋 PV System Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="p-4 bg-slate-800/70 rounded-lg border border-blue-500/40">
                                    <p className="text-xs text-blue-200/70 mb-1">PV Module</p>
                                    <p className="font-bold text-blue-100">{selectedModule ? `${selectedModule.manufacturer} ${selectedModule.model}` : 'Not selected'}</p>
                                    <p className="text-xs text-blue-200/70 mt-1">{selectedModule ? `${selectedModule.max_power_w}W` : '--'}</p>
                                </div>
                                <div className="p-4 bg-slate-800/70 rounded-lg border border-emerald-500/40">
                                    <p className="text-xs text-emerald-200/70 mb-1">Total PV Capacity</p>
                                    <p className="font-bold text-2xl bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                        {totalSystemCapacity.toFixed(2)} kWp
                                    </p>
                                    <p className="text-xs text-emerald-200/70 mt-1">{totalModules} modules total</p>
                                </div>
                                <div className="p-4 bg-slate-800/70 rounded-lg border border-purple-500/40">
                                    <p className="text-xs text-purple-200/70 mb-1">
                                        {couplingType === 'DC' ? 'Hybrid Inverter(s)' : 'PV Inverter(s)'}
                                    </p>
                                    {couplingType === 'DC' ? (
                                        <>
                                            <p className="font-bold text-purple-100">
                                                {hybridInverter ? `${hybridInverter.supplier} ${hybridInverter.model}` : 'Not selected'}
                                            </p>
                                            <p className="text-xs text-purple-200/70 mt-1">
                                                {hybridInverter && batterySelection?.inverterQuantity ? 
                                                    `${batterySelection.inverterQuantity}x ${hybridInverter.rated_ac_capacity_kw.toFixed(1)}kW` : '--'}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-purple-100">
                                                {selectedPvInverter ? `${selectedPvInverter.manufacturer} ${selectedPvInverter.model}` : 'Not selected'}
                                            </p>
                                            <p className="text-xs text-purple-200/70 mt-1">
                                                {selectedPvInverter ? `${inverterQuantity}x ${(selectedPvInverter.ac_nom_power_w / 1000).toFixed(1)}kW` : '--'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-800/70 rounded-lg border border-amber-500/40">
                                    <p className="text-xs text-amber-200/70 mb-1">String Configuration</p>
                                    <p className="font-bold text-amber-100">{stringsConfig.modulesPerString} x {stringsConfig.strings}</p>
                                    <p className="text-xs text-amber-200/70 mt-1">{stringsConfig.modulesPerString} modules/string, {stringsConfig.strings} strings</p>
                                </div>
                                <div className="p-4 bg-slate-800/70 rounded-lg border border-cyan-500/40">
                                    <p className="text-xs text-cyan-200/70 mb-1">DC/AC Ratio</p>
                                    <p className="font-bold text-2xl bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                        {dcAcRatio > 0 ? dcAcRatio.toFixed(2) : '--'}
                                    </p>
                                    <p className="text-xs text-cyan-200/70 mt-1">
                                        {dcAcRatio >= 1.15 && dcAcRatio <= 1.35 ? '✓ Optimal range' : 
                                         dcAcRatio > 0 && dcAcRatio < 1.15 ? '⚠️ Below optimal' : 
                                         dcAcRatio > 1.35 ? '⚠️ Above optimal' : 'Configure system'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
        </div>
    );
};

const DGConfig = ({ dgParams, setDgParams }: any) => (<Card><CardHeader><CardTitle>DG Set Configuration</CardTitle><CardDescription>Define the parameters for the backup Diesel Generator.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="dgCapacity">DG Capacity (kW)</Label><Input id="dgCapacity" type="number" value={dgParams.capacity} onChange={(e) => setDgParams({...dgParams, capacity: parseFloat(e.target.value) || 0})}/></div><div className="space-y-2"><Label htmlFor="dgFuelConsumption">Fuel Consumption (liters/kWh)</Label><Input id="dgFuelConsumption" type="number" value={dgParams.fuelConsumption} onChange={(e) => setDgParams({...dgParams, fuelConsumption: parseFloat(e.target.value) || 0})}/></div><div className="space-y-2"><Label htmlFor="dgFuelCost">Fuel Cost ($/liter)</Label><Input id="dgFuelCost" type="number" value={dgParams.fuelCost} onChange={(e) => setDgParams({...dgParams, fuelCost: parseFloat(e.target.value) || 0})}/></div></CardContent></Card>);

const BatterySelection = ({ batterySelection, setBatterySelection, loadData, sizingParams, projectData, setActivePage }: any) => {
    const [showCouplingModal, setShowCouplingModal] = useState(!batterySelection.couplingType);
    const [activeAppTab, setActiveAppTab] = useState('Residential');
    const [selectedInverter, setSelectedInverter] = useState<any>(null);
    
    // ✅ PHASE 1: NEW BATTERY CAPACITY CALCULATION (Based on nighttime energy only)
    const hourlyData = loadData.weekday || [];
    
    // Separate day and night energy consumption
    const energySplit = useMemo(() => separateDayNightEnergy(hourlyData), [hourlyData]);
    const { daytimeEnergy, nighttimeEnergy, totalEnergy } = energySplit;
    
    // Calculate suggested battery capacity using NIGHTTIME energy only
    const daysOfAutonomy = sizingParams?.autonomy || 1;
    const depthOfDischarge = 0.80; // Default for suggestion, actual battery DoD will be used for selected battery
    const dischargingEfficiency = 0.95;
    
    const batterySizing = useMemo(() => 
        calculateBatteryCapacity(nighttimeEnergy, dischargingEfficiency, depthOfDischarge, daysOfAutonomy),
        [nighttimeEnergy, dischargingEfficiency, depthOfDischarge, daysOfAutonomy]
    );
    
    const suggestedBatteryCapacity = batterySizing.nameplateCapacity;
    
    const handleSelectBattery = (battery: any) => { 
        setBatterySelection({ ...batterySelection, selectedBatteryId: battery.id }); 
    };
    
    const handleCouplingSelection = (type: 'DC' | 'AC') => {
        setBatterySelection({ ...batterySelection, couplingType: type });
        setShowCouplingModal(false);
    };
    
    const availableBatteries = BATTERY_CATALOG_BY_APPLICATION[activeAppTab as keyof typeof BATTERY_CATALOG_BY_APPLICATION]?.[batterySelection.technology as keyof typeof BATTERY_CATALOG_BY_APPLICATION['Residential']] || [];
    
    const selectedBattery = useMemo(() => {
        return BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
    }, [batterySelection]);
    
    // ✅ MANUAL BATTERY QUANTITY OVERRIDE
    // Calculate suggested quantity, but allow manual override
    const suggestedBatteryQuantity = selectedBattery ? Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity) : 0;
    
    // Use manual quantity if set, otherwise use suggested quantity
    const numberOfBatteries = batterySelection.manualBatteryQuantity !== undefined 
        ? batterySelection.manualBatteryQuantity 
        : suggestedBatteryQuantity;
        
    const totalBatteryCapacity = selectedBattery ? numberOfBatteries * selectedBattery.capacity : 0;
    
    // Load selected inverter for right column summary
    useEffect(() => {
        if (batterySelection.selectedInverterId) {
            loadSelectedInverter();
        }
    }, [batterySelection.selectedInverterId, batterySelection.couplingType]);
    
    const loadSelectedInverter = async () => {
        try {
            if (batterySelection.couplingType === 'DC') {
                const data = await getHybridInverters({});
                const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
                setSelectedInverter(inv);
            } else {
                const data = await getBatteryInverters({});
                const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
                setSelectedInverter(inv);
            }
        } catch (error) {
            console.error('Error loading selected inverter:', error);
        }
    };
    
    // Calculate inverter metrics for right column summary
    const inverterQuantity = batterySelection.inverterQuantity || 1;
    const isHybrid = batterySelection.couplingType === 'DC';
    const totalInverterCapacity = selectedInverter ? 
        (isHybrid ? selectedInverter.rated_ac_capacity_kw : selectedInverter.rated_inverter_ac_capacity_kw) * inverterQuantity 
        : 0;
    
    return (
        <div className="space-y-6">
            {/* Coupling Type Selection Modal - Cannot be dismissed */}
            {showCouplingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl m-4 overflow-hidden border-2 border-blue-500">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Zap className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Select System Coupling Type</h3>
                                    <p className="text-blue-100 mt-1">Choose how your BESS will be configured</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                This selection determines the inverter architecture and cannot be changed later without starting a new design.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* DC Coupled */}
                                <div 
                                    onClick={() => handleCouplingSelection('DC')}
                                    className="p-6 rounded-xl border-2 border-purple-300 hover:border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 cursor-pointer transition-all hover:shadow-lg"
                                >
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <div className="p-4 bg-purple-600 rounded-full">
                                            <Zap className="h-8 w-8 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">DC Coupled System</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Single Hybrid Inverter</p>
                                        <div className="space-y-2 text-left w-full">
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Lower cost</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Simpler installation</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Higher efficiency (~95%)</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Direct DC charging</p>
                                        </div>
                                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                                            Select DC Coupled
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* AC Coupled */}
                                <div 
                                    onClick={() => handleCouplingSelection('AC')}
                                    className="p-6 rounded-xl border-2 border-cyan-300 hover:border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 cursor-pointer transition-all hover:shadow-lg"
                                >
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <div className="p-4 bg-cyan-600 rounded-full">
                                            <Zap className="h-8 w-8 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">AC Coupled System</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">PV + Battery Inverters</p>
                                        <div className="space-y-2 text-left w-full">
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> More flexible</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Can retrofit existing PV</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Better monitoring</p>
                                            <p className="text-xs text-gray-700 dark:text-gray-300"><strong>✓</strong> Independent optimization</p>
                                        </div>
                                        <Button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700">
                                            Select AC Coupled
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    <strong>Note:</strong> This choice affects inverter sizing, system cost, and performance characteristics. Review the Design Assist section for recommendations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* FULL WIDTH - Required Energy and Suggested BESS Capacity - Dark Futuristic Theme */}
            <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-indigo-500/30">
                <CardHeader className="border-b border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/30">
                                <Database className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                                    🔋 BESS Configuration
                                </CardTitle>
                                <CardDescription className="text-base text-indigo-300/70 mt-1">
                                    {batterySelection.couplingType === 'DC' ? '⚡ DC Coupled System (Hybrid Inverter)' : 
                                     batterySelection.couplingType === 'AC' ? '🔌 AC Coupled System (Separate Inverters)' : 
                                     '⚙️ Battery Energy Storage System'}
                                </CardDescription>
                            </div>
                        </div>
                        {batterySelection.couplingType && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowCouplingModal(true)}
                                className="text-xs border-indigo-500/30 bg-indigo-900/30 hover:bg-indigo-800/50 text-indigo-300 hover:text-indigo-200"
                            >
                                <RotateCw className="h-3 w-3 mr-1" />
                                Change Coupling
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-indigo-500/40 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-indigo-200 tracking-wide uppercase">Daily Energy Consumption</p>
                                <Zap className="h-6 w-6 text-indigo-400" />
                            </div>
                            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">{totalEnergy.toFixed(2)} kWh</p>
                            
                            {/* ✅ Day/Night Energy Breakdown */}
                            <div className="mt-3 pt-3 border-t border-indigo-500/30">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-cyan-300/70">☀️ Daytime (PV Direct)</p>
                                        <p className="font-bold text-cyan-200">{daytimeEnergy.toFixed(1)} kWh</p>
                                    </div>
                                    <div className="bg-purple-500/10 rounded px-2 py-1 border border-purple-500/30">
                                        <p className="text-purple-300/90 font-semibold">🌙 Nighttime (Battery)</p>
                                        <p className="font-bold text-purple-200 text-lg">{nighttimeEnergy.toFixed(1)} kWh</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-purple-200/80 mt-2 font-semibold">⚡ Battery sized for {nighttimeEnergy.toFixed(1)} kWh nighttime energy only</p>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-purple-500/40 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-purple-200 tracking-wide uppercase">Suggested Battery Capacity</p>
                                <BatteryCharging className="h-6 w-6 text-purple-400" />
                            </div>
                            <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{suggestedBatteryCapacity.toFixed(2)} kWh</p>
                            <p className="text-xs text-purple-200/70 mt-2">🔋 Based on {nighttimeEnergy.toFixed(1)} kWh nighttime energy</p>
                            <p className="text-xs text-purple-200/70 mt-1">📊 {daysOfAutonomy} day autonomy @ 80% DoD</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* TWO COLUMN LAYOUT - 2/3 + 1/3 Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN (2/3 width - span 2 columns) - Battery Selection & Inverter Selection */}
                <div className="lg:col-span-2 space-y-6">
                {/* Left: Battery Selection - Dark Theme */}
                <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-emerald-500/30">
                    <CardHeader className="border-b border-emerald-500/20">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                    🔋 Battery Selection
                                </CardTitle>
                            </div>
                            
                            {/* Battery Technology Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="batteryTech" className="text-sm font-semibold text-emerald-200">Battery Technology</Label>
                                <select 
                                    id="batteryTech" 
                                    className="w-full px-3 py-2 bg-slate-800 text-emerald-100 border-2 border-emerald-500/40 rounded-lg font-medium focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" 
                                    value={batterySelection.technology} 
                                    onChange={(e) => setBatterySelection({ ...batterySelection, technology: e.target.value, selectedBatteryId: null })}
                                >
                                    <option className="bg-slate-800 text-emerald-100">Lithium-Ion</option>
                                    <option className="bg-slate-800 text-emerald-100">Lead-Acid</option>
                                </select>
                            </div>
                            
                            {/* Application Type Tabs */}
                            <div className="flex gap-2 border-b border-emerald-500/20">
                                {(['Residential', 'Commercial & Industrial', 'Utility Scale'] as const).map((appType) => (
                                    <button
                                        key={appType}
                                        onClick={() => setActiveAppTab(appType)}
                                        className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all ${
                                            activeAppTab === appType
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                                                : 'text-emerald-200 hover:text-emerald-100 hover:bg-slate-800/70 border border-emerald-500/30'
                                        }`}
                                    >
                                        {appType}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-800/70 rounded-lg border border-emerald-500/40">
                                <p className="text-sm text-emerald-200">
                                    <strong className="text-emerald-100">Showing:</strong> {batterySelection.technology} batteries for {activeAppTab} applications
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {availableBatteries.map((b: any) => (
                                    <div 
                                        key={b.id} 
                                        onClick={() => handleSelectBattery(b)} 
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            batterySelection.selectedBatteryId === b.id 
                                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-900/60 to-teal-900/60 shadow-xl shadow-emerald-500/30' 
                                                : 'border-emerald-500/30 bg-slate-800/60 hover:border-emerald-400 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-emerald-500/10'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-sm text-emerald-100">{b.name}</h4>
                                            {batterySelection.selectedBatteryId === b.id && (
                                                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-emerald-200/70 mb-2">{b.brand}</p>
                                        <div className="space-y-1">
                                            <p className="text-xs text-emerald-200">
                                                <strong className="text-emerald-100">Capacity:</strong> {b.capacity} kWh
                                            </p>
                                            <p className="text-xs text-emerald-200">
                                                <strong className="text-emerald-100">Power:</strong> {b.power} kW
                                            </p>
                                            <p className="text-xs text-emerald-200">
                                                <strong className="text-emerald-100">Chemistry:</strong> {b.chemistry}
                                            </p>
                                            <p className="text-xs text-emerald-200">
                                                <strong className="text-emerald-100">DoD:</strong> {b.dod}% | <strong className="text-emerald-100">Eff:</strong> {b.efficiency}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Inverter Selection Section */}
                {batterySelection.couplingType && selectedBattery && (
                <InverterSelectionSection 
                    couplingType={batterySelection.couplingType}
                    application={projectData.application}
                    selectedBatteryVoltage={selectedBattery.capacity > 50 ? 400 : 48}
                    requiredCapacity={selectedBattery.power * Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity)}
                    selectedInverterId={batterySelection.selectedInverterId}
                    inverterQuantity={batterySelection.inverterQuantity}
                    setSelectedInverterId={(id: string) => setBatterySelection({...batterySelection, selectedInverterId: id})}
                    setInverterQuantity={(qty: number) => setBatterySelection({...batterySelection, inverterQuantity: qty})}
                />
                )}
                
                {/* Component Summary - Full Width in Column 1 */}
                {selectedBattery && (
                    <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-indigo-500/30">
                        <CardHeader className="pb-3 border-b border-indigo-500/20">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-400" />
                                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent font-bold">
                                    Component Summary
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-3 gap-3">
                                {/* System Type */}
                                <div className="p-3 bg-slate-800/70 rounded-lg border border-indigo-500/40">
                                    <p className="text-xs text-indigo-200/70 font-medium mb-2">System Type</p>
                                    <p className="text-sm font-bold text-indigo-200">
                                        {batterySelection.couplingType === 'DC' ? '⚡ DC Coupled' : '🔌 AC Coupled'}
                                    </p>
                                </div>
                                
                                {/* Battery Pack */}
                                <div className="p-3 bg-slate-800/70 rounded-lg border border-cyan-500/40">
                                    <p className="text-xs text-cyan-200/70 font-medium mb-2">Battery Pack</p>
                                    <p className="text-sm font-bold text-cyan-200">{selectedBattery.name}</p>
                                    <p className="text-xs text-cyan-300">{numberOfBatteries} x {selectedBattery.capacity} kWh</p>
                                </div>
                                
                                {/* Inverter */}
                                {selectedInverter ? (
                                    <div className="p-3 bg-slate-800/70 rounded-lg border border-amber-500/40">
                                        <p className="text-xs text-amber-200/70 font-medium mb-2">Inverter{inverterQuantity > 1 ? 's' : ''}</p>
                                        <p className="text-sm font-bold text-amber-200">{selectedInverter.model}</p>
                                        <p className="text-xs text-amber-300">
                                            {inverterQuantity} x {isHybrid ? selectedInverter.rated_ac_capacity_kw : selectedInverter.rated_inverter_ac_capacity_kw} kW
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-800/70 rounded-lg border border-gray-500/40">
                                        <p className="text-xs text-gray-200/70 font-medium mb-2">Inverter</p>
                                        <p className="text-sm font-bold text-gray-400">Not Selected</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
                </div>
                
                {/* RIGHT COLUMN (1/3 width - span 1 column) - BESS Config, Inverter Capacity, System Summary */}
                <div className="lg:col-span-1 space-y-6">
                    {/* BESS Configuration based on Selected Battery - Simplified - Dark Theme */}
                    {selectedBattery && (
                        <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-emerald-500/30">
                            <CardHeader className="border-b border-emerald-500/20">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <BatteryCharging className="h-5 w-5 text-emerald-400" />
                                    <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                        BESS Configuration
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {/* 2-Column Grid for Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Total BESS Capacity */}
                                    <div className="p-3 bg-slate-800/80 rounded-lg border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                                        <p className="text-xs text-emerald-200 mb-2 font-semibold">Total BESS Capacity</p>
                                        <p className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                            {(Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity) * selectedBattery.capacity).toFixed(2)} kWh
                                        </p>
                                    </div>
                                    
                                    {/* Max Output Power */}
                                    <div className="p-3 bg-slate-800/80 rounded-lg border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                                        <p className="text-xs text-cyan-200 mb-2 font-semibold">Max Output Power</p>
                                        <p className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                            {(selectedBattery.power * Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity)).toFixed(2)} kW
                                        </p>
                                    </div>
                                    
                                    {/* Usable Total Energy */}
                                    <div className="p-3 bg-slate-800/80 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/10">
                                        <p className="text-xs text-purple-200 mb-2 font-semibold">Usable Total Energy</p>
                                        <p className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                            {((Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity) * selectedBattery.capacity) * (selectedBattery.dod / 100)).toFixed(2)} kWh
                                        </p>
                                        <p className="text-xs text-purple-300 mt-1">@ {selectedBattery.dod}% DoD</p>
                                    </div>
                                    
                                    {/* Total Batteries Required */}
                                    <div className="p-3 bg-slate-800/80 rounded-lg border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-indigo-200 font-semibold">Total Batteries</p>
                                            {numberOfBatteries !== suggestedBatteryQuantity && (
                                                <button 
                                                    onClick={() => setBatterySelection({...batterySelection, manualBatteryQuantity: undefined})}
                                                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                                                    title="Reset to suggested quantity"
                                                >
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={numberOfBatteries}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 1;
                                                    setBatterySelection({...batterySelection, manualBatteryQuantity: value});
                                                }}
                                                className="w-16 px-2 py-1 text-xl font-bold bg-slate-700/80 border border-indigo-500/60 rounded-lg text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                            <span className="text-sm text-indigo-200 font-semibold">units</span>
                                        </div>
                                        {suggestedBatteryQuantity !== numberOfBatteries && (
                                            <p className="text-xs text-yellow-300 mt-1">
                                                ⚠️ Suggested: {suggestedBatteryQuantity}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Battery String Configuration */}
                    {selectedBattery && (() => {
                        const batterySpecs = extractBatterySpecs(selectedBattery.name);
                        if (!batterySpecs) return null;
                        
                        const { voltage, ampereHour } = batterySpecs;
                        const batteriesInSeries = batterySelection.batteriesInSeries || 1;
                        const batteriesInParallel = batterySelection.batteriesInParallel || 1;
                        const totalVoltage = voltage * batteriesInSeries;
                        const totalCurrent = ampereHour * batteriesInParallel;
                        const totalModules = batteriesInSeries * batteriesInParallel;
                        
                        return (
                            <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-blue-500/30">
                                <CardHeader className="border-b border-blue-500/20 pb-3">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-400" />
                                        <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                            Battery String Configuration
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm text-blue-300/70 mt-1">
                                        Configure series/parallel arrangement
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3">
                                    {/* Single Battery Specs */}
                                    <div className="p-2 bg-slate-800/60 rounded-lg border border-blue-500/30">
                                        <p className="text-xs text-blue-200 mb-2 font-semibold">Single Battery Unit</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-blue-300/70">Voltage:</span>
                                                <span className="ml-2 text-blue-200 font-semibold">{voltage}V</span>
                                            </div>
                                            <div>
                                                <span className="text-blue-300/70">Capacity:</span>
                                                <span className="ml-2 text-blue-200 font-semibold">{ampereHour}Ah</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* String Configuration Inputs - Side by Side */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm text-blue-200 mb-2 flex items-center gap-1">
                                                <span>Batteries in Series</span>
                                                <TooltipWrapper content="Increases total voltage (V = V₁ × n)">
                                                    <Info className="h-3 w-3 text-blue-400" />
                                                </TooltipWrapper>
                                            </Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={batteriesInSeries}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 1;
                                                    setBatterySelection({
                                                        ...batterySelection,
                                                        batteriesInSeries: value
                                                    });
                                                }}
                                                className="bg-slate-700/80 border-blue-500/60 text-blue-100 focus:border-blue-400"
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="text-sm text-blue-200 mb-2 flex items-center gap-1">
                                                <span>Batteries in Parallel</span>
                                                <TooltipWrapper content="Increases total capacity (I = I₁ × n)">
                                                    <Info className="h-3 w-3 text-blue-400" />
                                                </TooltipWrapper>
                                            </Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={batteriesInParallel}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 1;
                                                    setBatterySelection({
                                                        ...batterySelection,
                                                        batteriesInParallel: value
                                                    });
                                                }}
                                                className="bg-slate-700/80 border-blue-500/60 text-blue-100 focus:border-blue-400"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Total Pack Specifications */}
                                    <div className="p-2 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/40 shadow-lg shadow-blue-500/20">
                                        <p className="text-xs text-blue-200 mb-2 font-semibold uppercase tracking-wide">Battery Pack Specifications</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 bg-slate-800/60 rounded-lg">
                                                <p className="text-xs text-blue-300/80 mb-1">Total Voltage</p>
                                                <p className="text-lg font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                                    {totalVoltage.toFixed(1)} V
                                                </p>
                                            </div>
                                            <div className="p-2 bg-slate-800/60 rounded-lg">
                                                <p className="text-xs text-cyan-300/80 mb-1">Total Current</p>
                                                <p className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                                                    {totalCurrent.toFixed(1)} A
                                                </p>
                                            </div>
                                            <div className="p-2 bg-slate-800/60 rounded-lg">
                                                <p className="text-xs text-purple-300/80 mb-1">Total Modules</p>
                                                <p className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                                    {totalModules} units
                                                </p>
                                            </div>
                                            <div className="p-2 bg-slate-800/60 rounded-lg">
                                                <p className="text-xs text-emerald-300/80 mb-1">Pack Energy</p>
                                                <p className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                                    {((totalVoltage * totalCurrent) / 1000).toFixed(2)} kWh
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Configuration Summary */}
                                    <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                                        <p className="text-xs text-blue-300 leading-relaxed">
                                            <strong>{batteriesInSeries}</strong> {batteriesInSeries === 1 ? 'battery' : 'batteries'} in series × <strong>{batteriesInParallel}</strong> parallel {batteriesInParallel === 1 ? 'string' : 'strings'} = <strong>{totalModules}</strong> total {totalModules === 1 ? 'module' : 'modules'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                    
                    {/* Battery Pack Electrical Specs - Full Width in Column 2 */}
                    {selectedBattery && (() => {
                        const batterySpecs = extractBatterySpecs(selectedBattery.name);
                        if (!batterySpecs) return null;
                        
                        const { voltage, ampereHour } = batterySpecs;
                        const batteriesInSeries = batterySelection.batteriesInSeries || 1;
                        const batteriesInParallel = batterySelection.batteriesInParallel || 1;
                        const totalVoltage = voltage * batteriesInSeries;
                        const totalCurrent = ampereHour * batteriesInParallel;
                        const totalModules = batteriesInSeries * batteriesInParallel;
                        
                        return (
                            <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-blue-500/30">
                                <CardHeader className="pb-3 border-b border-blue-500/20">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-blue-400" />
                                        <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent font-bold">
                                            Pack Electrical Specs
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-800/70 rounded-lg border border-blue-500/40">
                                            <p className="text-xs text-blue-200/70 font-medium mb-2">Voltage</p>
                                            <p className="text-xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                                {totalVoltage.toFixed(1)} V
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-800/70 rounded-lg border border-cyan-500/40">
                                            <p className="text-xs text-cyan-200/70 font-medium mb-2">Current</p>
                                            <p className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                                                {totalCurrent.toFixed(1)} A
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-800/70 rounded-lg border border-purple-500/40">
                                            <p className="text-xs text-purple-200/70 font-medium mb-2">Total Modules</p>
                                            <p className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                                {totalModules}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-800/70 rounded-lg border border-emerald-500/40">
                                            <p className="text-xs text-emerald-200/70 font-medium mb-2">Configuration</p>
                                            <p className="text-base font-bold text-emerald-200">
                                                {batteriesInSeries}S × {batteriesInParallel}P
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                    
                    {/* Spacer to align with Inverter Selection */}
                    {batterySelection.couplingType && selectedBattery && !batterySelection.selectedInverterId && (
                        <div className="h-48"></div>
                    )}
                    
                    {/* Required Inverter Capacity - Small Section */}
                    {batterySelection.couplingType && selectedBattery && (
                        <Card className="border border-amber-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl shadow-amber-500/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-400" />
                                    <span className="text-amber-100">Required Inverter Capacity</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="p-4 bg-slate-800/80 rounded-lg border border-amber-500/40 shadow-lg shadow-amber-500/10">
                                    <p className="text-xs text-amber-200 mb-2 font-semibold">
                                        {batterySelection.couplingType === 'DC' ? 'Hybrid Inverter (DC Coupled)' : 'Battery Inverter (AC Coupled)'}
                                    </p>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">
                                        {(selectedBattery.power * Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity)).toFixed(2)} kW
                                    </p>
                                </div>
                                {batterySelection.couplingType === 'AC' && (
                                    <p className="text-xs text-cyan-200 p-3 bg-slate-800/60 rounded-lg border border-cyan-500/40">
                                        <strong className="text-cyan-300">Note:</strong> PV Inverter sizing available in PV Sizing section
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Overall System Summary - Suggested vs Designed Comparison Only */}
                    {selectedBattery && (
                        <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-indigo-500/30">
                            <CardHeader className="pb-3 border-b border-indigo-500/20">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-400" />
                                    <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent font-bold">
                                        Overall System Summary
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {/* Two Column: Suggested vs Designed */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-slate-800/80 rounded-xl border border-purple-500/40 shadow-xl shadow-purple-500/10">
                                        <p className="text-xs text-purple-200 mb-3 font-bold tracking-wide uppercase">Suggested</p>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-purple-200/70 font-medium">BESS Capacity</p>
                                                <p className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                                    {suggestedBatteryCapacity.toFixed(2)} kWh
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-200/70 font-medium">Inverter Capacity</p>
                                                <p className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                                    {(selectedBattery.power * Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity)).toFixed(2)} kW
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                                        <p className="text-xs text-emerald-200 mb-3 font-bold tracking-wide uppercase">Designed</p>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-emerald-200/70 font-medium">BESS Capacity</p>
                                                <p className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                                    {totalBatteryCapacity.toFixed(2)} kWh
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-emerald-200/70 font-medium">Inverter Capacity</p>
                                                <p className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                                    {selectedInverter ? totalInverterCapacity.toFixed(2) : '--'} kW
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// Inverter Selection Section Component - Redesigned for Manual Selection
const InverterSelectionSection = ({ couplingType, application, selectedBatteryVoltage, requiredCapacity, selectedInverterId, inverterQuantity, setSelectedInverterId, setInverterQuantity }: any) => {
    const [inverters, setInverters] = useState<(HybridInverter | BatteryInverter)[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedManufacturer, setSelectedManufacturer] = useState('');
    
    // Map application types to database format
    const mapApplicationType = (app: string) => {
        if (app === 'Commercial & Industrial' || app === 'Commercial') return 'C&I';
        if (app === 'Utility Scale') return 'Utility Scale';
        return app; // 'Residential' stays the same
    };
    
    useEffect(() => {
        loadInverters();
    }, [couplingType, application]);
    
    const loadInverters = async () => {
        setLoading(true);
        try {
            const mappedApplication = mapApplicationType(application);
            console.log(`🔍 Loading inverters for: ${mappedApplication}, Type: ${couplingType}`);
            
            // ✅ FIX: Load ALL inverters (no application filter) to show all manufacturers and models
            // Users can select any inverter regardless of application type
            const filters = {};  // No filters - show all inverters
            
            let data;
            if (couplingType === 'DC') {
                data = await getHybridInverters(filters);
                console.log(`✅ Loaded ${data.length} hybrid inverters`);
                console.log(`📊 Unique manufacturers:`, [...new Set(data.map((inv: any) => inv.supplier))]);
            } else {
                data = await getBatteryInverters(filters);
                console.log(`✅ Loaded ${data.length} battery inverters`);
                console.log(`📊 Unique manufacturers:`, [...new Set(data.map((inv: any) => inv.manufacturer))]);
            }
            
            setInverters(data);
        } catch (error) {
            console.error('Error loading inverters:', error);
            sonnerToast.error('Failed to load inverters');
        } finally {
            setLoading(false);
        }
    };
    
    // Get unique manufacturers
    const manufacturers = useMemo(() => {
        const uniqueManufacturers = [...new Set(inverters.map((inv: any) => inv.supplier || inv.manufacturer))];
        return uniqueManufacturers.sort();
    }, [inverters]);
    
    // Filter models by selected manufacturer
    const availableModels = useMemo(() => {
        if (!selectedManufacturer) return [];
        return inverters.filter((inv: any) => 
            (inv.supplier || inv.manufacturer) === selectedManufacturer
        );
    }, [inverters, selectedManufacturer]);
    
    const selectedInverter = useMemo(() => {
        return inverters.find((inv: any) => inv.id === selectedInverterId);
    }, [inverters, selectedInverterId]);
    
    const isHybrid = couplingType === 'DC';
    
    // Calculate total capacity and check if it meets requirements
    const totalCapacity = selectedInverter ? 
        (isHybrid ? (selectedInverter as any).rated_ac_capacity_kw : (selectedInverter as any).rated_inverter_ac_capacity_kw) * inverterQuantity 
        : 0;
    
    const meetsRequirement = totalCapacity >= requiredCapacity * 0.9; // Within 90% is acceptable
    const exceedsRequirement = totalCapacity > requiredCapacity * 1.3; // More than 130% is caution
    
    return (
        <Card className={`border ${isHybrid ? 'border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900' : 'border-cyan-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900'} backdrop-blur-md shadow-2xl ${isHybrid ? 'shadow-purple-500/30' : 'shadow-cyan-500/30'}`}>
            <CardHeader className={`border-b ${isHybrid ? 'border-purple-500/20' : 'border-cyan-500/20'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isHybrid ? 'bg-gradient-to-br from-purple-600 to-violet-600' : 'bg-gradient-to-br from-cyan-600 to-blue-600'} shadow-lg`}>
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className={`text-xl font-bold ${isHybrid ? 'bg-gradient-to-r from-purple-300 to-violet-300' : 'bg-gradient-to-r from-cyan-300 to-blue-300'} bg-clip-text text-transparent`}>
                            ⚡ Inverter Selection
                        </CardTitle>
                        <CardDescription className={`text-sm ${isHybrid ? 'text-purple-300/70' : 'text-cyan-300/70'}`}>
                            {isHybrid ? '🔋 Select Hybrid Inverter (DC Coupled)' : '🔌 Select Battery Inverter (AC Coupled)'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <RotateCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">Loading inverters...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 3 Column Grid Layout for Manufacturer, Model, and Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Manufacturer Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="manufacturer" className="text-sm font-semibold">Manufacturer</Label>
                                <select
                                    id="manufacturer"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium"
                                    value={selectedManufacturer}
                                    onChange={(e) => {
                                        setSelectedManufacturer(e.target.value);
                                        setSelectedInverterId(''); // Reset selection when manufacturer changes
                                    }}
                                >
                                    <option value="">-- Select --</option>
                                    {manufacturers.map((manufacturer) => (
                                        <option key={manufacturer} value={manufacturer}>
                                            {manufacturer}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Model Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="model" className="text-sm font-semibold">Model</Label>
                                <select
                                    id="model"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium"
                                    value={selectedInverterId}
                                    onChange={(e) => setSelectedInverterId(e.target.value)}
                                    disabled={!selectedManufacturer}
                                >
                                    <option value="">-- Select --</option>
                                    {availableModels.map((inv: any) => {
                                        const capacity = isHybrid ? inv.rated_ac_capacity_kw : inv.rated_inverter_ac_capacity_kw;
                                        return (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.model} - {capacity} kW
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            
                            {/* Quantity Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-sm font-semibold">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={inverterQuantity || 1}
                                    onChange={(e) => setInverterQuantity(parseInt(e.target.value) || 1)}
                                    disabled={!selectedInverter}
                                    className="border-2"
                                />
                            </div>
                        </div>
                        
                        {/* Selection Summary - 4 Column Layout with Dark Theme */}
                        {selectedInverter && (
                            <div className={`p-5 rounded-xl border ${
                                meetsRequirement && !exceedsRequirement
                                    ? 'bg-slate-800/70 border-emerald-500/50 shadow-xl shadow-emerald-500/30'
                                    : 'bg-slate-800/70 border-amber-500/50 shadow-xl shadow-amber-500/30'
                            }`}>
                                <div className="flex items-center gap-2 mb-4">
                                    {meetsRequirement && !exceedsRequirement ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            <p className="font-bold text-emerald-200">✓ Configuration Valid</p>
                                        </>
                                    ) : (
                                        <>
                                            <HelpCircle className="h-5 w-5 text-amber-400" />
                                            <p className="font-bold text-amber-200">
                                                ⚠ {!meetsRequirement ? 'Capacity Below Requirement' : 'Capacity Exceeds Significantly'}
                                            </p>
                                        </>
                                    )}
                                </div>
                                
                                {/* 4 Column Grid for Key Info */}
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                    <div className="p-3 bg-slate-900/80 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/10">
                                        <p className="text-xs text-purple-200 mb-1 font-semibold">Manufacturer</p>
                                        <p className="font-bold text-sm text-purple-100">{(selectedInverter as any).supplier || (selectedInverter as any).manufacturer}</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                                        <p className="text-xs text-cyan-200 mb-1 font-semibold">Model</p>
                                        <p className="font-bold text-sm text-cyan-100">{(selectedInverter as any).model}</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/80 rounded-lg border border-amber-500/40 shadow-lg shadow-amber-500/10">
                                        <p className="text-xs text-amber-200 mb-1 font-semibold">Unit Capacity</p>
                                        <p className="font-bold text-sm text-amber-100">{isHybrid ? (selectedInverter as any).rated_ac_capacity_kw : (selectedInverter as any).rated_inverter_ac_capacity_kw} kW</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/80 rounded-lg border border-pink-500/40 shadow-lg shadow-pink-500/10">
                                        <p className="text-xs text-pink-200 mb-1 font-semibold">Quantity</p>
                                        <p className="font-bold text-sm text-pink-100">{inverterQuantity} unit{inverterQuantity > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                
                                {/* Total Capacity - Full Width */}
                                <div className="p-4 bg-slate-900/90 rounded-lg border border-blue-500/40 shadow-lg shadow-blue-500/10">
                                    <p className="text-xs text-blue-200 mb-2 font-semibold">Total Inverter Capacity</p>
                                    <p className={`font-bold text-2xl ${
                                        meetsRequirement && !exceedsRequirement
                                            ? 'bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent'
                                            : 'bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent'
                                    }`}>
                                        {totalCapacity.toFixed(2)} kW
                                    </p>
                                    <p className="text-xs text-gray-300 mt-2">
                                        <span className="text-blue-300 font-medium">Required:</span> {requiredCapacity.toFixed(2)} kW | 
                                        <span className={totalCapacity >= requiredCapacity ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                                            {' '}Difference: {(totalCapacity - requiredCapacity).toFixed(2)} kW
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// System Summary Section Component
const SystemSummarySection = ({ batterySelection, selectedBattery, suggestedBatteryCapacity, totalEnergy }: any) => {
    const [selectedInverter, setSelectedInverter] = useState<any>(null);
    
    useEffect(() => {
        if (batterySelection.selectedInverterId) {
            loadSelectedInverter();
        }
    }, [batterySelection.selectedInverterId, batterySelection.couplingType]);
    
    const loadSelectedInverter = async () => {
        try {
            if (batterySelection.couplingType === 'DC') {
                const data = await getHybridInverters({});
                const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
                setSelectedInverter(inv);
            } else {
                const data = await getBatteryInverters({});
                const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
                setSelectedInverter(inv);
            }
        } catch (error) {
            console.error('Error loading selected inverter:', error);
        }
    };
    
    const totalBatteryCapacity = Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity) * selectedBattery.capacity;
    const numberOfBatteries = Math.ceil(suggestedBatteryCapacity / selectedBattery.capacity);
    
    const inverterQuantity = batterySelection.inverterQuantity || 1;
    const isHybrid = batterySelection.couplingType === 'DC';
    const totalInverterCapacity = selectedInverter ? 
        (isHybrid ? selectedInverter.rated_ac_capacity_kw : selectedInverter.rated_inverter_ac_capacity_kw) * inverterQuantity 
        : 0;
    
    return (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Overall System Summary</CardTitle>
                        <CardDescription className="text-base">
                            Complete BESS configuration overview
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* System Type */}
                <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border-2 border-indigo-300 dark:border-indigo-600">
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">System Configuration</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {batterySelection.couplingType === 'DC' ? 'DC Coupled (Hybrid Inverter)' : 'AC Coupled (Separate Inverters)'}
                    </p>
                </div>
                
                {/* Energy Requirements */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Daily Energy</p>
                        <p className="text-lg font-bold text-blue-600">{totalEnergy.toFixed(2)} kWh</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Required Storage</p>
                        <p className="text-lg font-bold text-purple-600">{suggestedBatteryCapacity.toFixed(2)} kWh</p>
                    </div>
                </div>
                
                {/* Battery Summary */}
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">Battery System</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Model</p>
                            <p className="font-bold text-sm">{selectedBattery.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Units</p>
                            <p className="font-bold text-lg text-green-600">{numberOfBatteries}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Capacity</p>
                            <p className="font-bold text-lg text-green-600">{totalBatteryCapacity.toFixed(2)} kWh</p>
                        </div>
                    </div>
                </div>
                
                {/* Inverter Summary */}
                {selectedInverter && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-3">
                            {batterySelection.couplingType === 'DC' ? 'Hybrid Inverter' : 'Battery Inverter'}
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Manufacturer</p>
                                <p className="font-bold text-sm">{selectedInverter.supplier || selectedInverter.manufacturer}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Model</p>
                                <p className="font-bold text-sm">{selectedInverter.model}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Capacity</p>
                                <p className="font-bold text-lg text-orange-600">
                                    {batterySelection.couplingType === 'DC' ? selectedInverter.rated_ac_capacity_kw : selectedInverter.rated_inverter_ac_capacity_kw} kW
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ===========================================
// Project Costing Component
// ===========================================
const ProjectCosting = ({ 
  projectData, 
  batterySelection, 
  pvParams, 
  pvResults,
  selectedHybridInverter,
  selectedPvInverter,
  selectedBatteryInverter,
  cableParams,
  aiGeneratedItems,
  pricingData,
  setPricingData,
  editedPrices,
  setEditedPrices,
  devCosts,
  setDevCosts,
  setCalculatedTotalProjectCost
}: any) => {
  const [loading, setLoading] = useState(false);

  // Get system data - MOVED BEFORE HOOKS
  const pvModulePower = pvResults?.modulePower || 630;
  const totalModules = pvResults?.totalModules || 0;
  const pvCapacityKW = (totalModules * pvModulePower / 1000);
  
  const batteryTech = batterySelection.technology || 'Lithium-Ion';
  const selectedBattery = useMemo(() => {
    const catalog = BATTERY_CATALOG[batteryTech as keyof typeof BATTERY_CATALOG];
    return catalog?.find((b: any) => b.id === batterySelection.selectedBatteryId) || null;
  }, [batteryTech, batterySelection.selectedBatteryId]);
  
  const numberOfBatteries = batterySelection.manualBatteryQuantity || 
    ((batterySelection.batteriesInSeries || 1) * (batterySelection.batteriesInParallel || 1)) || 0;
  
  // Add battery voltage calculation - parse from name if not in database
  const singleBatteryVoltage = selectedBattery?.voltage || 
    selectedBattery?.nominal_voltage || 
    (() => {
      // Try to parse voltage from battery name (e.g., "NMC 51.2V 150Ah" → 51.2)
      const batteryName = selectedBattery?.name || '';
      const voltageMatch = batteryName.match(/(\d+\.?\d*)\s*V/i);
      return voltageMatch ? parseFloat(voltageMatch[1]) : 0;
    })();
  
  // Add battery capacity
  const batteryCapacity = selectedBattery?.capacity || 0;
  
  const couplingType = batterySelection.couplingType;
  const inverterData = couplingType === 'DC' ? selectedHybridInverter : (selectedPvInverter || selectedBatteryInverter);
  
  // Fix inverter power calculation - use correct field name from database
  const inverterPowerKW = couplingType === 'DC'
    ? ((selectedHybridInverter?.rated_ac_capacity_kw || 0) * (batterySelection.inverterQuantity || 1))
    : ((selectedPvInverter?.rated_power_kw || selectedBatteryInverter?.rated_ac_capacity_kw || 0) * (pvParams?.inverterQuantity || batterySelection.inverterQuantity || 1));
  
  const inverterModel = inverterData?.model || inverterData?.inverter_model || 'N/A';
  const inverterType = couplingType === 'DC' ? 'Hybrid' : 'PV + Battery';
  
  // Calculate fixed prices
  const pvModulesPrice = pvCapacityKW * 150;
  const inverterPrice = couplingType === 'DC' 
    ? (inverterPowerKW * 100)
    : ((selectedPvInverter?.rated_power_kw || 0) * (pvParams?.inverterQuantity || 1) * 70) + 
      ((selectedBatteryInverter?.rated_ac_capacity_kw || 0) * (batterySelection.inverterQuantity || 1) * 65);
  
  // Add battery pricing: $200 per kWh for Lithium-Ion
  const batteryTotalCapacityKWh = numberOfBatteries * batteryCapacity;
  const batteryPrice = batteryTotalCapacityKWh * 200; // $200 per kWh
  
  // Calculate total project cost (to pass to Financial Analysis)
  const calculatedTotalProjectCost = useMemo(() => {
    const bosElectricalCost = pricingData?.componentPricing?.reduce((sum: number, category: any) => {
      return sum + (category.items?.reduce((itemSum: number, item: any) => itemSum + (item.total || 0), 0) || 0);
    }, 0) || 0;
    
    const equipmentCost = pvModulesPrice + inverterPrice + batteryPrice + bosElectricalCost;
    const devCostTotal = Object.values(devCosts).reduce((sum, val) => sum + (val as number), 0) * equipmentCost / 100;
    const total = equipmentCost + devCostTotal;
    
    console.log('💰 ProjectCosting - Total Calculation:', {
      pvModulesPrice,
      inverterPrice,
      batteryPrice,
      bosElectricalCost,
      equipmentCost,
      devCostTotal,
      total
    });
    
    return total;
  }, [pvModulesPrice, inverterPrice, batteryPrice, pricingData, devCosts]);
  
  // Update parent state when total changes
  useEffect(() => {
    if (setCalculatedTotalProjectCost) {
      setCalculatedTotalProjectCost(calculatedTotalProjectCost);
      console.log('✅ Updated Parent Total Project Cost:', calculatedTotalProjectCost);
    }
  }, [calculatedTotalProjectCost, setCalculatedTotalProjectCost]);
  
  // Debug logging - COMPREHENSIVE
  console.log('💰 Costing Debug - FULL:', {
    pvCapacityKW,
    pvModulesPrice,
    couplingType,
    inverterPowerKW,
    inverterPrice,
    inverterQuantity: batterySelection.inverterQuantity,
    selectedHybridInverter: selectedHybridInverter ? {
      model: selectedHybridInverter.model,
      rated_inverter_ac_capacity_kw: selectedHybridInverter.rated_inverter_ac_capacity_kw,
      rated_ac_capacity_kw: selectedHybridInverter.rated_ac_capacity_kw,
      rated_power_kw: selectedHybridInverter.rated_power_kw,
      allFields: Object.keys(selectedHybridInverter)
    } : null,
    selectedPvInverter: selectedPvInverter?.model || null,
    selectedBatteryInverter: selectedBatteryInverter?.model || null,
    batteryInfo: {
      selectedBattery: selectedBattery?.name || selectedBattery?.model,
      numberOfBatteries,
      capacity: selectedBattery?.capacity,
      totalCapacityKWh: batteryTotalCapacityKWh,
      voltage: selectedBattery?.voltage || selectedBattery?.nominal_voltage,
      singleBatteryVoltage,
      batteryPrice
    }
  });

  // Reset edited prices when new pricing data is generated
  useEffect(() => {
    if (pricingData) {
      setEditedPrices({});
    }
  }, [pricingData]);

  // Recalculate totals when prices are edited
  const recalculatedSummary = useMemo(() => {
    if (!pricingData) return null;
    
    let totalBOS = 0;
    pricingData.componentPricing.forEach((category: any, idx: number) => {
      category.items.forEach((item: any, i: number) => {
        const itemKey = `${idx}-${i}`;
        const currentUnitPrice = editedPrices[itemKey] !== undefined ? editedPrices[itemKey] : item.unitPrice;
        totalBOS += currentUnitPrice * item.qty;
      });
    });
    
    const subtotal = pvModulesPrice + inverterPrice + batteryPrice + totalBOS;
    const contingency = subtotal * 0.05;
    const total = subtotal + contingency;
    
    return {
      ...pricingData.summary,
      batteries: batteryPrice,
      electricalBOS: totalBOS,
      subtotal: subtotal,
      contingency: contingency,
      total: total
    };
  }, [pricingData, editedPrices, pvModulesPrice, inverterPrice, batteryPrice]);

  const generatePricing = async () => {
    setLoading(true);
    try {
      // Check and deduct AI credits FIRST (1 credit for pricing generation)
      const creditSuccess = await checkAndDeduct(
        currentProjectId,
        'boq_pricing',
        'BESS BOQ Pricing'
      );
      
      if (!creditSuccess) {
        setLoading(false);
        return;
      }
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert('Gemini API key not configured');
        setLoading(false);
        return;
      }

      // Build component list from AI BOQ
      const boqComponents = aiGeneratedItems.map((item: any) => 
        `${item.description} (${item.unit}: ${item.qty})`
      ).join(', ');

      const prompt = `You are a procurement specialist with expertise in Solar PV + Battery Storage systems. Generate market-based pricing for South East Asia and East Asia regions.

PROJECT SUMMARY:
- PV System: ${pvCapacityKW.toFixed(2)} kW (${totalModules} modules)
- Battery: ${numberOfBatteries} × ${selectedBattery?.capacity || 0}kWh ${batteryTech}
- Inverter: ${inverterPowerKW.toFixed(2)}kW ${inverterType}
- Location: ${projectData.locationName || 'Asia'}

FIXED PRICING (DO NOT CHANGE):
1. PV Modules: ${pvCapacityKW.toFixed(2)} kW @ $150/kW = $${pvModulesPrice.toFixed(2)}
2. Inverter: ${inverterPowerKW.toFixed(2)}kW ${inverterType} @ $${couplingType === 'DC' ? '100' : '70/65'}/kW = $${inverterPrice.toFixed(2)}

BOS COMPONENTS TO PRICE:
${boqComponents}

Generate realistic 2025 market prices for:
- PV Mounting Structure items (Foundation, Rails, Clamps, Hardware)
- Battery Racking System (Rack structure, accessories, bus bars)
- Earthing System components (Electrodes, GI strips, bonding cables, clamps)
- Lightning Protection (DC SPDs, AC SPDs, down conductors, air terminals)
- Cable Management (Cable trays, conduits, glands, ties)
- Distribution Boxes (DCDB, ACDB with MCBs, isolators, meters, busbars)
- Safety Equipment (Warning signs, extinguishers, PPE)
- Installation Materials & Testing

CRITICAL: For EACH item provide:
- "name": Short item name
- "specification": DETAILED technical specs (material, size, standard, rating) - NEVER use just unit like "Nos" or "Lumpsum"
- "qty": Numeric quantity
- "unit": Unit type (Nos, Mtrs, Set, Lumpsum)
- "unitPrice": Price per unit in USD
- "total": qty × unitPrice

EXAMPLE of CORRECT specification:
{
  "name": "Foundation Posts",
  "specification": "Galvanized steel posts, 100×100mm, L=2m, with concrete foundation 300×300×600mm, M20 grade, as per IS 2062",
  "qty": 8,
  "unit": "Nos",
  "unitPrice": 35,
  "total": 280
}

WRONG specification examples (DO NOT USE):
❌ "specification": "Nos"
❌ "specification": "Lumpsum"
❌ "specification": "Set"

Return ONLY valid JSON:
{
  "componentPricing": [
    {"category": "PV Mounting Structure", "items": [{"name": "...", "specification": "detailed technical spec here...", "qty": X, "unit": "Nos", "unitPrice": Y, "total": Z}]},
    {"category": "Battery Racking", "items": [...]},
    {"category": "Earthing System", "items": [...]},
    {"category": "Lightning Protection", "items": [...]},
    {"category": "Cable Management", "items": [...]},
    {"category": "Distribution & Protection", "items": [...]},
    {"category": "Safety & Testing", "items": [...]}
  ],
  "summary": {
    "pvModules": ${pvModulesPrice.toFixed(2)},
    "inverter": ${inverterPrice.toFixed(2)},
    "batteries": X,
    "mountingStructure": X,
    "electricalBOS": X,
    "installation": X,
    "subtotal": X,
    "contingency": X,
    "total": X,
    "currency": "USD"
  }
}

Use realistic market prices. Include 10-15% for installation labor and 5% contingency.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "contents": [{
            "parts": [{
              "text": prompt
            }]
          }],
          "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 6000
          }
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      let aiResponse = data.candidates[0].content.parts[0].text;
      
      console.log('🔍 Raw AI Response:', aiResponse);
      
      // Extract JSON - robust extraction
      aiResponse = aiResponse.trim();
      
      // Method 1: Look for JSON in markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        aiResponse = codeBlockMatch[1].trim();
      } else {
        // Method 2: Find first { and last }
        const firstBrace = aiResponse.indexOf('{');
        const lastBrace = aiResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          aiResponse = aiResponse.substring(firstBrace, lastBrace + 1);
        }
      }
      
      console.log('🔍 Cleaned AI Response:', aiResponse);
      
      // Validate JSON is complete (not truncated)
      if (!aiResponse.trim().endsWith('}') && !aiResponse.trim().endsWith(']')) {
        throw new Error('Incomplete JSON response - possibly truncated. Try increasing max_tokens.');
      }
      
      const pricing = JSON.parse(aiResponse);
      
      // ===== ADD FIXED-PRICE EQUIPMENT TO PRICING DATA =====
      console.log('💰 Adding Fixed-Price Equipment to Pricing Data');
      
      // Prepare fixed equipment categories
      const fixedEquipment = [];
      
      // 1. PV Modules
      if (pvCapacityKW > 0 && totalModules > 0) {
        fixedEquipment.push({
          category: "Solar PV Modules",
          items: [{
            name: "Solar PV Panels",
            specification: `High-efficiency monocrystalline solar panels, ${pvModulePower}Wp per module, with 25-year linear power warranty, IEC 61215 & IEC 61730 certified`,
            qty: totalModules,
            unit: "Nos",
            unitPrice: parseFloat((pvModulesPrice / totalModules).toFixed(2)),
            total: pvModulesPrice
          }]
        });
        console.log(`  ✅ Added PV Modules: ${totalModules} × $${(pvModulesPrice / totalModules).toFixed(2)} = $${pvModulesPrice}`);
      }
      
      // 2. Batteries
      if (numberOfBatteries > 0 && selectedBattery) {
        const batteryPrice = numberOfBatteries * (selectedBattery.capacity || 0) * 200; // $200/kWh
        fixedEquipment.push({
          category: "Battery Energy Storage",
          items: [{
            name: `${batteryTech} Battery Pack`,
            specification: `${selectedBattery.name || 'Battery Pack'}, ${selectedBattery.capacity || 0}kWh capacity per unit, ${singleBatteryVoltage}V nominal voltage, with integrated BMS, DOD 90%, 6000+ cycles @ 80% EOL, UL 1973 & IEC 62619 certified`,
            qty: numberOfBatteries,
            unit: "Nos",
            unitPrice: parseFloat(((selectedBattery.capacity || 0) * 200).toFixed(2)),
            total: batteryPrice
          }]
        });
        console.log(`  ✅ Added Batteries: ${numberOfBatteries} × $${((selectedBattery.capacity || 0) * 200).toFixed(2)} = $${batteryPrice}`);
      }
      
      // 3. Inverters
      if (inverterPowerKW > 0) {
        fixedEquipment.push({
          category: "Power Conversion System",
          items: [{
            name: `${inverterType}`,
            specification: `${inverterType}, ${inverterPowerKW.toFixed(2)}kW rated power, ${couplingType === 'DC' ? 'with integrated MPPT and battery charge controller' : 'grid-tied with anti-islanding protection'}, efficiency >97%, IP65 rated, IEC 62109 certified`,
            qty: 1,
            unit: "Set",
            unitPrice: inverterPrice,
            total: inverterPrice
          }]
        });
        console.log(`  ✅ Added Inverter: ${inverterPowerKW.toFixed(2)}kW × $${(inverterPrice/inverterPowerKW).toFixed(2)}/kW = $${inverterPrice}`);
      }
      
      // 4. DC Cables (from cable sizing)
      const dcCables = [];
      if (cableParams?.dcPv) {
        const dcPvLength = cableParams.dcPv.cableLength || 0;
        const dcPvCrossSection = cableParams.dcPv.selectedCable?.cross_section || 4;
        const dcPvPrice = dcPvLength * 1.5; // Approximate $1.5/meter for DC cable
        dcCables.push({
          name: "DC Cable - PV to Inverter",
          specification: `${cableParams.dcPv.selectedCable?.material || 'Copper'} conductor, ${dcPvCrossSection}mm², ${cableParams.dcPv.selectedCable?.insulation_type || 'XLPE'} insulation, 1kV DC rated, UV resistant, IEC 60227 compliant`,
          qty: parseFloat(dcPvLength.toFixed(2)),
          unit: "Mtrs",
          unitPrice: 1.5,
          total: parseFloat(dcPvPrice.toFixed(2))
        });
        console.log(`  ✅ Added DC PV Cable: ${dcPvLength.toFixed(2)}m × $1.5/m = $${dcPvPrice.toFixed(2)}`);
      }
      
      if (cableParams?.dcBattery) {
        const dcBattLength = cableParams.dcBattery.cableLength || 0;
        const dcBattCrossSection = cableParams.dcBattery.selectedCable?.cross_section || 10;
        const dcBattPrice = dcBattLength * 2.5; // Approximate $2.5/meter for battery DC cable
        dcCables.push({
          name: "DC Cable - Battery to Inverter",
          specification: `${cableParams.dcBattery.selectedCable?.material || 'Copper'} conductor, ${dcBattCrossSection}mm², ${cableParams.dcBattery.selectedCable?.insulation_type || 'XLPE'} insulation, 1kV DC rated, low smoke zero halogen, IEC 60227 compliant`,
          qty: parseFloat(dcBattLength.toFixed(2)),
          unit: "Mtrs",
          unitPrice: 2.5,
          total: parseFloat(dcBattPrice.toFixed(2))
        });
        console.log(`  ✅ Added DC Battery Cable: ${dcBattLength.toFixed(2)}m × $2.5/m = $${dcBattPrice.toFixed(2)}`);
      }
      
      // 5. AC Cables (from cable sizing)
      const acCables = [];
      if (cableParams?.acHybrid) {
        const acLength = cableParams.acHybrid.cableLength || 0;
        const acCrossSection = cableParams.acHybrid.selectedCable?.cross_section || 4;
        const acPrice = acLength * 2.0; // Approximate $2.0/meter for AC cable
        acCables.push({
          name: "AC Cable - Inverter to Grid",
          specification: `${cableParams.acHybrid.selectedCable?.material || 'Copper'} conductor, ${acCrossSection}mm², ${cableParams.acHybrid.cableRuns || 4}-core, ${cableParams.acHybrid.selectedCable?.insulation_type || 'XLPE'} insulation, 0.6/1kV AC rated, armored, IEC 60502 compliant`,
          qty: parseFloat(acLength.toFixed(2)),
          unit: "Mtrs",
          unitPrice: 2.0,
          total: parseFloat(acPrice.toFixed(2))
        });
        console.log(`  ✅ Added AC Cable: ${acLength.toFixed(2)}m × $2.0/m = $${acPrice.toFixed(2)}`);
      }
      
      // Add cables category if we have cables
      if (dcCables.length > 0 || acCables.length > 0) {
        fixedEquipment.push({
          category: "Cables & Wiring",
          items: [...dcCables, ...acCables]
        });
      }
      
      // Merge fixed equipment with AI-generated BOS
      const enhancedPricingData = {
        ...pricing,
        componentPricing: [
          ...fixedEquipment,
          ...(pricing.componentPricing || [])
        ]
      };
      
      console.log('✅ Enhanced Pricing Data with Equipment:', enhancedPricingData);
      setPricingData(enhancedPricingData);
    } catch (error) {
      console.error('Pricing Error:', error);
      alert('Failed to generate pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/30 shadow-2xl backdrop-blur-sm">
        <CardHeader className="border-b border-cyan-500/20 pb-4 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-lg border border-green-500/20">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-cyan-100">
                  Project Cost Estimate
                </CardTitle>
                <CardDescription className="text-cyan-300/60">
                  AI-powered market-based pricing for South East & East Asia
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={generatePricing} 
              disabled={loading || !aiGeneratedItems || aiGeneratedItems.length === 0}
              className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white border border-green-500/50"
            >
              {loading ? (
                <><RotateCw className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <>💰 Generate Pricing</>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {!pricingData && !loading && (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20">
              <div className="p-4 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-green-500/30">
                <DollarSign className="h-12 w-12 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-100 mb-3">Generate Cost Estimate</h3>
              <p className="text-cyan-200/60 max-w-md mx-auto">
                Complete BOQ generation first, then click "Generate Pricing" to get AI-powered cost estimates
              </p>
            </div>
          )}

          {pricingData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/40 rounded-xl backdrop-blur-sm hover:border-blue-400/60 transition-all">
                  <p className="text-xs font-semibold text-blue-300/80 mb-2 uppercase tracking-wider">PV Modules</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-blue-300 to-blue-200 bg-clip-text text-transparent">
                    ${pvModulesPrice?.toLocaleString()}
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-500/20">
                    <p className="text-xs text-blue-300/70">{pvModulePower}Wp × {totalModules} modules</p>
                    <p className="text-xs text-blue-300/70">{pvCapacityKW.toFixed(2)} kW Total</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/40 rounded-xl backdrop-blur-sm hover:border-green-400/60 transition-all">
                  <p className="text-xs font-semibold text-green-300/80 mb-2 uppercase tracking-wider">Inverter</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-300 to-green-200 bg-clip-text text-transparent">
                    ${inverterPrice?.toLocaleString()}
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-500/20">
                    <p className="text-xs text-green-300/70">{inverterModel}</p>
                    <p className="text-xs text-green-300/70">{inverterPowerKW.toFixed(2)} kW {inverterType}</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/40 rounded-xl backdrop-blur-sm hover:border-amber-400/60 transition-all">
                  <p className="text-xs font-semibold text-amber-300/80 mb-2 uppercase tracking-wider">Batteries</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-amber-300 to-amber-200 bg-clip-text text-transparent">
                    ${batteryPrice?.toLocaleString()}
                  </p>
                  <div className="mt-2 pt-2 border-t border-amber-500/20">
                    <p className="text-xs text-amber-300/70">{numberOfBatteries} × {batteryCapacity}kWh</p>
                    <p className="text-xs text-amber-300/70">{batteryTotalCapacityKWh.toFixed(2)} kWh Total @ ${singleBatteryVoltage}V</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/40 rounded-xl backdrop-blur-sm hover:border-purple-400/60 transition-all">
                  <p className="text-xs font-semibold text-purple-300/80 mb-2 uppercase tracking-wider">Electrical BOS</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-300 to-purple-200 bg-clip-text text-transparent">
                    ${recalculatedSummary?.electricalBOS?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                  </p>
                  <div className="mt-2 pt-2 border-t border-purple-500/20">
                    <p className="text-xs text-purple-300/70">Mounting, Cables, Protection</p>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/40 rounded-xl backdrop-blur-sm hover:border-cyan-400/60 transition-all">
                  <p className="text-xs font-semibold text-cyan-300/80 mb-2 uppercase tracking-wider">Total Project</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-cyan-300 to-cyan-200 bg-clip-text text-transparent">
                    ${recalculatedSummary?.total?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                  </p>
                  <div className="mt-2 pt-2 border-t border-cyan-500/20">
                    <p className="text-xs text-cyan-300/70">Incl. Installation & Contingency</p>
                  </div>
                </div>
              </div>

              {/* Detailed Pricing */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-cyan-300/70">
                  💡 <span className="italic">Unit prices are editable. Click to modify and totals will update automatically.</span>
                </p>
                {Object.keys(editedPrices).length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditedPrices({})}
                    className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/30"
                  >
                    Reset Prices
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {pricingData.componentPricing.map((category: any, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-cyan-500/40 rounded-xl overflow-hidden backdrop-blur-sm hover:border-cyan-400/60 transition-all">
                    <div className="p-4 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-cyan-500/30">
                      <h4 className="font-bold text-lg text-cyan-100">{category.category}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead className="bg-slate-900/80 border-b border-cyan-500/30">
                          <tr>
                            <th className="p-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider w-[18%]">Item</th>
                            <th className="p-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider w-[42%]">Specification</th>
                            <th className="p-3 text-center text-xs font-semibold text-cyan-300 uppercase tracking-wider w-[12%]">Qty</th>
                            <th className="p-3 text-right text-xs font-semibold text-cyan-300 uppercase tracking-wider w-[14%]">Unit Price</th>
                            <th className="p-3 text-right text-xs font-semibold text-cyan-300 uppercase tracking-wider w-[14%]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.items.map((item: any, i: number) => {
                            const itemKey = `${idx}-${i}`;
                            const currentUnitPrice = editedPrices[itemKey] !== undefined ? editedPrices[itemKey] : item.unitPrice;
                            const calculatedTotal = currentUnitPrice * item.qty;
                            
                            return (
                              <tr key={i} className="border-t border-cyan-500/20 hover:bg-cyan-900/20 transition-colors">
                                <td className="p-3 text-sm text-cyan-100 break-words">{item.name}</td>
                                <td className="p-3 text-sm text-cyan-200/70 break-words whitespace-normal">
                                  {item.specification || '-'}
                                </td>
                                <td className="p-3 text-center text-sm text-cyan-200/80">{item.qty} {item.unit}</td>
                                <td className="p-3 text-right">
                                  <input
                                    type="number"
                                    value={currentUnitPrice}
                                    onChange={(e) => {
                                      const newPrice = parseFloat(e.target.value) || 0;
                                      setEditedPrices(prev => ({...prev, [itemKey]: newPrice}));
                                    }}
                                    className="w-24 px-2 py-1 text-sm text-right bg-slate-800/80 border border-cyan-500/30 rounded text-cyan-200 focus:border-cyan-400 focus:outline-none"
                                  />
                                </td>
                                <td className="p-3 text-right text-sm font-bold text-green-300">
                                  ${calculatedTotal?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* Development Costs Section */}
              <div className="mt-8 bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-cyan-500/40 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 bg-gradient-to-r from-orange-900/50 to-amber-900/50 border-b border-amber-500/30">
                  <h4 className="font-bold text-lg text-amber-100">📋 Project Development Costs (% of Equipment Cost)</h4>
                  <p className="text-xs text-amber-200/60 mt-1">Based on Equipment Cost: ${(pvModulesPrice + inverterPrice + batteryPrice + (recalculatedSummary?.electricalBOS || 0)).toLocaleString()}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {key: 'designEngineering', label: 'Design Engineering Cost', value: devCosts.designEngineering},
                      {key: 'statutoryApproval', label: 'Statutory Approval Fees', value: devCosts.statutoryApproval},
                      {key: 'projectManagement', label: 'Project Management Fees', value: devCosts.projectManagement},
                      {key: 'installationCommissioning', label: 'Installation and Commissioning Cost', value: devCosts.installationCommissioning},
                      {key: 'landAcquisition', label: 'Land Acquisition/Purchase Cost', value: devCosts.landAcquisition},
                      {key: 'landDevelopment', label: 'Land Development Cost', value: devCosts.landDevelopment},
                      {key: 'taxesDuties', label: 'Taxes and Duty Fees', value: devCosts.taxesDuties},
                      {key: 'insurance', label: 'Insurance Fees', value: devCosts.insurance},
                      {key: 'internationalLogistics', label: 'International Logistics Cost', value: devCosts.internationalLogistics},
                      {key: 'domesticLogistics', label: 'Domestic Logistics to the Site Cost', value: devCosts.domesticLogistics},
                      {key: 'financeManagement', label: 'Finance Management Fees', value: devCosts.financeManagement},
                      {key: 'contingencies', label: 'Contingencies', value: devCosts.contingencies},
                    ].map((item) => {
                      const equipmentCost = pvModulesPrice + inverterPrice + batteryPrice + (recalculatedSummary?.electricalBOS || 0);
                      const itemCost = (equipmentCost * item.value / 100);
                      return (
                        <div key={item.key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                          <label className="text-sm text-cyan-200 flex-1">{item.label}</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.1"
                              value={item.value}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                setDevCosts(prev => ({...prev, [item.key]: newValue}));
                              }}
                              className="w-20 px-2 py-1 text-sm text-right bg-slate-800/80 border border-cyan-500/30 rounded text-cyan-200 focus:border-cyan-400 focus:outline-none"
                            />
                            <span className="text-cyan-300 text-sm w-4">%</span>
                            <span className="text-green-300 font-bold text-sm w-28 text-right">
                              ${itemCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Total Costs Summary */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-500/30">
                      <span className="text-base font-semibold text-amber-200">Development Costs Subtotal:</span>
                      <span className="text-xl font-bold text-amber-300">
                        ${(() => {
                          const equipmentCost = pvModulesPrice + inverterPrice + batteryPrice + (recalculatedSummary?.electricalBOS || 0);
                          const totalDevCosts = Object.values(devCosts).reduce((sum, val) => sum + val, 0) * equipmentCost / 100;
                          return totalDevCosts.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg border border-green-500/50 shadow-lg">
                      <div>
                        <span className="text-lg font-bold text-green-200">TOTAL PROJECT COST:</span>
                        <p className="text-xs text-green-300/60 mt-1">Equipment + Development Costs</p>
                      </div>
                      <span className="text-3xl font-bold text-green-300">
                        ${(() => {
                          const equipmentCost = pvModulesPrice + inverterPrice + batteryPrice + (recalculatedSummary?.electricalBOS || 0);
                          const totalDevCosts = Object.values(devCosts).reduce((sum, val) => sum + val, 0) * equipmentCost / 100;
                          const totalProjectCost = equipmentCost + totalDevCosts;
                          return totalProjectCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/30">
                      <span className="text-base font-semibold text-blue-200">Cost per Wp:</span>
                      <span className="text-xl font-bold text-blue-300">
                        ${(() => {
                          const equipmentCost = pvModulesPrice + inverterPrice + batteryPrice + (recalculatedSummary?.electricalBOS || 0);
                          const totalDevCosts = Object.values(devCosts).reduce((sum, val) => sum + val, 0) * equipmentCost / 100;
                          const totalProjectCost = equipmentCost + totalDevCosts;
                          const pvCapacityW = pvCapacityKW * 1000;
                          const costPerWp = pvCapacityW > 0 ? totalProjectCost / pvCapacityW : 0;
                          return costPerWp.toFixed(3);
                        })()}
                        /Wp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// BOQ Component
// ===========================================
const BOQTable = ({ 
  projectData, 
  batterySelection, 
  pvParams, 
  pvResults, 
  acHybridCableParams, 
  acPvCableParams, 
  acBattCableParams, 
  dcPvCableParams, 
  dcBattCableParams, 
  onUpdateCableParams,
  aiGenerating,
  setAiGenerating,
  aiGeneratedItems,
  setAiGeneratedItems,
  selectedHybridInverter,
  selectedPvInverter,
  selectedBatteryInverter,
  cableParams
}: any) => {
  // Fix battery lookup - handle undefined technology gracefully
  const batteryTech = batterySelection.technology || 'Lithium-Ion';
  const selectedBattery = useMemo(() => {
    const catalog = BATTERY_CATALOG[batteryTech as keyof typeof BATTERY_CATALOG];
    if (!catalog) {
      console.warn('⚠️ Battery catalog not found for technology:', batteryTech);
      return null;
    }
    const battery = catalog.find((b: any) => b.id === batterySelection.selectedBatteryId);
    if (!battery && batterySelection.selectedBatteryId) {
      console.warn('⚠️ Battery not found:', batterySelection.selectedBatteryId, 'in', batteryTech);
    }
    return battery || null;
  }, [batteryTech, batterySelection.selectedBatteryId]);
  
  const [showCableInput, setShowCableInput] = useState(false);
  
  // Get PV data
  const pvModulePower = pvResults?.modulePower || pvParams?.moduleMaxPower || 630;
  const totalModules = pvResults?.totalModules || 0;
  const modulesPerString = pvResults?.modulesPerString || 20;
  const numberOfStrings = pvResults?.strings || 2;
  
  // Get Battery data
  // Calculate suggested quantity if manual not set
  const suggestedBatteryQty = selectedBattery && pvResults?.systemCapacity 
    ? Math.ceil((pvResults.systemCapacity * 2) / selectedBattery.capacity) 
    : 0;
  
  // Fix: Handle undefined values for series/parallel
  const inSeries = batterySelection.batteriesInSeries || 1;
  const inParallel = batterySelection.batteriesInParallel || 1;
  const calculatedQty = inSeries * inParallel;
  
  const numberOfBatteries = batterySelection.manualBatteryQuantity !== undefined && batterySelection.manualBatteryQuantity !== null
    ? batterySelection.manualBatteryQuantity 
    : (calculatedQty > 1 ? calculatedQty : suggestedBatteryQty) || 0;
    
  const batteryCapacity = selectedBattery?.capacity || 0;
  // Fix: Get single battery voltage - parse from name if not in database
  const singleBatteryVoltage = selectedBattery?.voltage || 
    selectedBattery?.nominal_voltage || 
    (() => {
      // Try to parse voltage from battery name (e.g., "NMC 51.2V 150Ah" → 51.2)
      const batteryName = selectedBattery?.name || '';
      const voltageMatch = batteryName.match(/(\d+\.?\d*)\s*V/i);
      return voltageMatch ? parseFloat(voltageMatch[1]) : 0;
    })();
  const batteryPackVoltage = singleBatteryVoltage * inSeries;
  
  console.log('🔋 BOQ Battery Debug:', {
    selectedBattery: selectedBattery?.model || selectedBattery?.name || 'Not found',
    batteryId: batterySelection.selectedBatteryId,
    technology: batteryTech,
    manualQuantity: batterySelection.manualBatteryQuantity,
    inSeries,
    inParallel,
    calculatedQty,
    suggestedQty: suggestedBatteryQty,
    finalQuantity: numberOfBatteries
  });
  
  // Get Inverter data
  const couplingType = batterySelection.couplingType;
  const inverterQuantity = batterySelection.inverterQuantity || pvParams?.inverterQuantity || 1;
  
  // Estimate battery racking based on battery size
  const estimateBatteryRacking = () => {
    if (!selectedBattery || !numberOfBatteries) return { racks: 0, rackSize: '-' };
    
    // Rule: Assume 4-6 batteries per rack for LFP/NMC, 2-4 per rack for Lead Acid
    const batteryPerRack = batterySelection.technology === 'lead_acid' ? 4 : 6;
    const numberOfRacks = Math.ceil(numberOfBatteries / batteryPerRack);
    
    // Estimate rack size based on battery dimensions
    const rackSize = batterySelection.technology === 'lead_acid' 
      ? '1200×600×2000 mm' 
      : '1200×800×2000 mm';
    
    return { racks: numberOfRacks, rackSize };
  };
  
  const batteryRacking = estimateBatteryRacking();
  
  // AI Generation function for additional BOQ items
  const generateAIBOQ = async () => {
    setAiGenerating(true);
    try {
      // Check and deduct AI credits FIRST (1 credit for BOQ generation)
      const creditSuccess = await checkAndDeduct(
        currentProjectId,
        'boq_generation',
        'BESS BOQ Generation'
      );
      
      if (!creditSuccess) {
        setAiGenerating(false);
        return;
      }
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        alert('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
        setAiGenerating(false);
        return;
      }

      // Get inverter details for context
      const inverterData = couplingType === 'DC'
        ? selectedHybridInverter
        : (selectedPvInverter || selectedBatteryInverter);
      
      const projectContext = {
        // PV System
        pvCapacity: (totalModules * pvModulePower / 1000).toFixed(2) + ' kW',
        pvStrings: numberOfStrings,
        modulesPerString: modulesPerString,
        totalModules: totalModules,
        mountingType: pvParams?.mountingType || 'Fixed Tilt',
        modulesPerRow: pvParams?.modulesPerRow || 10,
        rowsPerTable: pvParams?.rowsPerTable || 2,
        totalTables: pvParams?.totalTables || Math.ceil(totalModules / (pvParams?.modulesPerRow * pvParams?.rowsPerTable || 20)),
        moduleOrientation: pvParams?.moduleOrientation || 'Portrait',
        
        // Battery System
        batteryCapacity: (numberOfBatteries * batteryCapacity).toFixed(2) + ' kWh',
        batteryTechnology: batterySelection.technology,
        numberOfBatteries: numberOfBatteries,
        singleBatteryVoltage: singleBatteryVoltage,
        singleBatteryCapacity: batteryCapacity,
        batteriesInSeries: inSeries,
        batteriesInParallel: inParallel,
        totalPackVoltage: (singleBatteryVoltage * inSeries).toFixed(1),
        maxBatteryCurrent: 150, // Default, TODO: Get from battery specs
        
        // Inverter System
        couplingType: couplingType,
        inverterModel: inverterData?.model || 'Unknown',
        inverterCount: inverterQuantity,
        inverterPowerKW: couplingType === 'DC'
          ? ((selectedHybridInverter?.rated_inverter_ac_capacity_kw || 0) * inverterQuantity)
          : ((selectedPvInverter?.rated_power_kw || 0) * inverterQuantity),
        inverterACVoltage: inverterData?.operating_ac_voltage_v || 400,
        inverterACCurrent: (cableParams?.acHybrid?.operatingCurrent || cableParams?.acPv?.operatingCurrent || 0).toFixed(2),
        inverterPhase: '3-Phase', // TODO: Detect from inverter
        
        // Cable Sizing Results
        dcPvCableSize: cableParams?.dcPv?.selectedCableSize || 0,
        dcBatteryCableSize: cableParams?.dcBatt?.selectedCableSize || 0,
        acCableSize: cableParams?.acHybrid?.selectedCableSize || cableParams?.acPv?.selectedCableSize || 0,
        
        // Site Information
        projectType: 'Residential', // TODO: Get from project data
        location: projectData.locationName || 'Unknown',
        climate: 'Tropical', // TODO: Detect from location
        installationType: pvParams?.mountingType || 'Ground-mount',
        
        // Standards
        standards: ['IEC 62446', 'IS 16221', 'CEA Regulations'],
        country: 'India'
      };

      const prompt = `You are a senior electrical engineer with 15+ years of experience in Solar PV + BESS projects. You follow IEC and Indian Standards (IS). Create a detailed, accurate BOQ ready for procurement.

===PROJECT DETAILS===
PV System: ${projectContext.pvCapacity}, ${projectContext.pvStrings} strings × ${projectContext.modulesPerString} modules = ${projectContext.totalModules} total
Mounting: ${projectContext.mountingType}, ${projectContext.totalTables} tables/arrays, ${projectContext.modulesPerRow} modules/row × ${projectContext.rowsPerTable} rows, ${projectContext.moduleOrientation} orientation
Battery: ${projectContext.batteryCapacity}, ${projectContext.numberOfBatteries} units of ${projectContext.singleBatteryCapacity}kWh ${projectContext.singleBatteryVoltage}V ${projectContext.batteryTechnology}, Config: ${projectContext.batteriesInSeries}S${projectContext.batteriesInParallel}P (${projectContext.totalPackVoltage}V pack)
Inverter: ${projectContext.couplingType} coupled, ${projectContext.inverterModel}, ${projectContext.inverterCount}× ${projectContext.inverterPowerKW}kW, ${projectContext.inverterPhase}, ${projectContext.inverterACVoltage}V AC, ${projectContext.inverterACCurrent}A
Cables: DC PV ${projectContext.dcPvCableSize}mm², DC Battery ${projectContext.dcBatteryCableSize}mm², AC ${projectContext.acCableSize}mm²
Site: ${projectContext.projectType}, ${projectContext.location}, ${projectContext.climate}, ${projectContext.installationType}

===STANDARDS REFERENCE===
Use ONLY standard ratings - never custom values!

MCB/MCCB Standards: 6A,10A,16A,20A,25A,32A,40A,50A,63A,80A,100A,125A
DC MCB: 2-pole, 1000V DC, C-curve, 6kA(residential)/10kA(commercial), per IEC 60947-2
AC MCB: 4-pole(3P+N), 400V AC, C-curve, 6-10kA, per IEC 60898
Selection: Current × 1.25 → round UP to next standard

Fuses (gPV): 10A,12A,15A,16A,20A,25A,32A sizes: 10×38mm(≤32A), 14×51mm(≤63A), per IEC 60269-6
Selection: Current × 1.5 → round up

Isolators: 32A,40A,63A,80A,100A,125A,160A,200A,250A
DC: 4-pole, 1000V, IP65, lockable red/yellow handle
AC: 4-pole, 415V, IP65, lockable handle
Selection: MCB rating × 1.2 → round up

SPDs:
DC PV: Type 2, 1000V DC, 40kA(8/20μs), Up<2.5kV, IEC 61643-11
DC Battery: Type 2, ${projectContext.totalPackVoltage}V(+20%), 40kA, visual indication
AC Main: Type 1+2, 3P+N, 400V, Iimp 12.5kA(10/350μs)+Imax 40kA(8/20μs), Up<1.5kV
AC Inverter: Type 2, 3P, 400V, 40kA, Up<1.2kV, DIN rail

Cable Glands(Brass IP68): 6mm²→16mm M16, 10mm²→20mm M20, 25mm²→25mm M25, 50-70mm²→40mm M40, 95-120mm²→50mm M50

===CALCULATION RULES===
0. PV Mounting Structure (${projectContext.mountingType}): ${projectContext.totalModules} modules, ${projectContext.totalTables} arrays
   Fixed Tilt Standards: Rail length 6m(std), Foundation: RCC/steel posts @3m spacing OR ground screws
   Module clamps: Mid clamps=(modules_per_row-1)×rows×arrays, End clamps=2×rows×arrays
   Generate 4-6 items: a)Foundation System(piers/screws/ballast) b)Main Rails(Aluminum 6063-T6,40×40mm) c)Cross Rails d)Mid Clamps e)End Clamps f)Hardware Kit(bolts M8×25mm SS304,washers,cable ties)
   Ground/Roof: Add specific items: Ground=Earth lugs+bonding, Roof=Roof hooks+flashings+sealant
   Carport: Add: Carport columns(H=3-4m),Roof beams,Purlins,Gutter system
   Floating: Add: Floats(HDPE),Anchoring system,Walkways

1. Battery Racks: LFP/NMC: 5 batt/rack, Lead Acid: 3/rack. Racks = ROUNDUP(${projectContext.numberOfBatteries}/5)=? 
   Dimensions: Width=5×500mm, D=800mm, H=2000mm, Load=(5×30kg)×1.5=?
   Generate 3 items: a)Rack Structure b)Accessories Kit c)Bus Bars (qty=(batt-1)×2×parallel)

2. Earthing: Electrodes=ROUNDUP(${projectContext.pvCapacity.replace(' kW','')}/5)+${projectContext.inverterCount} min 2
   Pits=Electrodes, GI Strip=(40+5×kW)×1.2, Bonding=(inv+2DB+PV+racks)×3×1.2
   Generate 6 items: a)Electrodes 14.2mm×3m IS3043 b)Pits 600×600×600mm c)GI 50×6mm IS2629 d)Bonding 70mm² e)Clamps f)Testing

3. Lightning: DC SPD PV: 1-2(>10kW=2), Battery: 1, AC Type1+2 Main: 1, AC Type2 Inverter: ${projectContext.inverterCount}, Down conductors 50mm² 6m(ground)/24m(roof), Air terminals 12mm×1.5m: 2(ground)/4(roof)

4. Cable Mgmt: Tray 200mm for AC ${projectContext.acCableSize}mm², 100mm for DC ${projectContext.dcPvCableSize}mm². Length ~30m main+10m PV. Conduit 32mm 30% of tray. Glands: PV ${projectContext.pvStrings}×2, Battery 2, AC 4

5. DCDB: Input ${projectContext.pvStrings}PV+${projectContext.batteriesInParallel}Batt. PV MCB: Istring×1.25→16A typ. Batt MCB: 150A×1.25=188A→200A. Main Isolator: sum×1.25. Size 600×400×250mm IP65
   Generate 12 items: a)DCDB box b)PV MCBs(${projectContext.pvStrings}) c)Batt MCB(${projectContext.batteriesInParallel}) d)Main Isolator e)gPV Fuses f)ACDB box g)AC MCB(${projectContext.inverterACCurrent}A×1.25=${(parseFloat(projectContext.inverterACCurrent)*1.25).toFixed(1)}A→32A) h)AC Isolator i)Energy Meter j)CTs(3) k)Bus bars l)Neutral+Earth bars

6. Safety: Warning signs set, CO2 extinguisher 4.5kg IS15683, First aid, PPE kit

7. Install Materials: Cable lugs(${projectContext.dcPvCableSize},${projectContext.dcBatteryCableSize},${projectContext.acCableSize}mm²), Heat shrink, Tape, Sealing compound, Anti-corrosion

8. Testing: System test per IEC62446, As-built docs

===OUTPUT FORMAT===
Return ONLY valid JSON array. MUST follow standards above!
[{"description":"Item Name","specification":"detailed spec with standard ref","unit":"Nos/Mtrs/Set/Lumpsum","qty":calculated_number or "-"}]

✓ Calculate ALL quantities precisely ✓ Use ONLY standard ratings ✓ Include standard refs (IEC/IS) ✓ Specify IP ratings ✓ Break complex items into multiple lines ✓ INCLUDE PV mounting structure items
✗ DO NOT include: solar panels, batteries, main inverters, PV-to-inv cables, batt-to-inv cables (already in BOQ) ✗ DO NOT use non-standard ratings ✗ DO NOT use "As required"

Generate comprehensive BOS BOQ now:`;

      console.log('🤖 Calling Google Gemini AI API...');
      console.log('📦 Project Context:', projectContext);
      console.log('🔌 Inverter Data:', {
        coupling: couplingType,
        hybrid: selectedHybridInverter?.model,
        pv: selectedPvInverter?.model,
        battery: selectedBatteryInverter?.model
      });
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "contents": [{
            "parts": [{
              "text": prompt
            }]
          }],
          "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 6000
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      console.log('✅ API Response received');

      const data = await response.json();
      let aiResponse = data.candidates[0].content.parts[0].text;
      
      console.log('🔍 Raw AI BOQ Response:', aiResponse);
      
      // Extract JSON - robust extraction
      aiResponse = aiResponse.trim();
      
      // Method 1: Look for JSON in markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        aiResponse = codeBlockMatch[1].trim();
      } else {
        // Method 2: Find first [ and last ] (for array) or { and } (for object)
        const firstBracket = aiResponse.indexOf('[');
        const lastBracket = aiResponse.lastIndexOf(']');
        const firstBrace = aiResponse.indexOf('{');
        const lastBrace = aiResponse.lastIndexOf('}');
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          aiResponse = aiResponse.substring(firstBracket, lastBracket + 1);
        } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          aiResponse = aiResponse.substring(firstBrace, lastBrace + 1);
        }
      }
      
      console.log('🔍 Cleaned AI BOQ Response:', aiResponse);
      
      // Validate JSON is complete (not truncated)
      if (!aiResponse.trim().endsWith('}') && !aiResponse.trim().endsWith(']')) {
        throw new Error('Incomplete JSON response - possibly truncated. Try increasing max_tokens.');
      }
      
      const parsedItems = JSON.parse(aiResponse);
      setAiGeneratedItems(parsedItems);
      console.log('✨ AI Generated BOQ Items:', parsedItems);
      
    } catch (error) {
      console.error('AI BOQ Generation Error:', error);
      alert('Failed to generate AI BOQ. Please check console for details.');
    } finally {
      setAiGenerating(false);
    }
  };
  
  // Build BOQ items
  const boqItems = [];
  let slNo = 1;
  
  // 1. Solar PV Panels
  if (totalModules > 0) {
    boqItems.push({
      slNo: slNo++,
      description: 'Solar PV Modules',
      specification: `${pvModulePower}Wp Monocrystalline PERC, Bifacial`,
      unit: 'Nos',
      qty: totalModules
    });
  }
  
  // 2-3. PV Mounting Structure - Now AI Generated (moved to AI prompt)
  
  // 3. Batteries
  console.log('🔋 BOQ Battery Check - FULL:', { 
    numberOfBatteries, 
    batteryCapacity, 
    singleBatteryVoltage,
    selectedBattery: selectedBattery ? {
      name: selectedBattery.name,
      model: selectedBattery.model,
      voltage: selectedBattery.voltage,
      nominal_voltage: selectedBattery.nominal_voltage,
      capacity: selectedBattery.capacity,
      allFields: Object.keys(selectedBattery)
    } : null,
    batterySelection: {
      selectedBatteryId: batterySelection.selectedBatteryId,
      technology: batterySelection.technology,
      batteriesInSeries: batterySelection.batteriesInSeries,
      batteriesInParallel: batterySelection.batteriesInParallel
    }
  });
  
  if (numberOfBatteries > 0 && selectedBattery) {
    boqItems.push({
      slNo: slNo++,
      description: `Battery Modules - ${(batterySelection.technology || 'Lithium-Ion').toUpperCase()}`,
      specification: `${batteryCapacity}kWh, ${singleBatteryVoltage}V, ${selectedBattery?.model || selectedBattery?.name || 'Standard'}`,
      unit: 'Nos',
      qty: numberOfBatteries
    });
  }
  
  // 4. Battery Racking System - Now handled by AI generation
  // Removed from here, will be generated by AI
  
  // 5. Inverters
  if (couplingType === 'DC') {
    // Hybrid Inverter
    boqItems.push({
      slNo: slNo++,
      description: 'Hybrid Inverter (Solar + Battery)',
      specification: `${batterySelection.selectedInverterModel || 'Hybrid Inverter'}, 3-Phase`,
      unit: 'Nos',
      qty: inverterQuantity
    });
  } else {
    // AC Coupled: PV Inverter + Battery Inverter
    boqItems.push({
      slNo: slNo++,
      description: 'PV Inverter',
      specification: `${pvParams?.selectedInverterModel || 'PV Inverter'}, 3-Phase`,
      unit: 'Nos',
      qty: inverterQuantity
    });
    
    boqItems.push({
      slNo: slNo++,
      description: 'Battery Inverter',
      specification: `${batterySelection.selectedInverterModel || 'Battery Inverter'}, 3-Phase`,
      unit: 'Nos',
      qty: inverterQuantity
    });
  }
  
  // 6. DC Cables - PV Array
  if (dcPvCableParams?.selectedCableSize && dcPvCableParams.selectedCableSize > 0) {
    const dcPvCableLength = dcPvCableParams.cableLength || 0;
    const numberOfStrings = dcPvCableParams.numberOfStrings || pvResults?.strings || numberOfStrings || 1;
    // Calculate total: 2 × length × number of strings (for +ve and -ve)
    const totalDcPvLength = 2 * dcPvCableLength * numberOfStrings;
    const material = dcPvCableParams.material || 'Copper';
    const insulation = dcPvCableParams.insulation || 'XLPE';
    const designCurrent = dcPvCableParams.designCurrent || 0;
    
    boqItems.push({
      slNo: slNo++,
      description: 'DC Cable - PV Array to Inverter (+ve & -ve)',
      specification: `${dcPvCableParams.selectedCableSize}mm² ${material} single core, ${insulation}, UV resistant, Design Current: ${designCurrent.toFixed(1)}A`,
      unit: 'Mtrs',
      qty: Math.round(totalDcPvLength)
    });
  } else if (totalModules > 0) {
    // Placeholder when cable sizing not done
    boqItems.push({
      slNo: slNo++,
      description: 'DC Cable - PV Array to Inverter (+ve & -ve)',
      specification: 'To be determined from Cable Sizing tab',
      unit: 'Mtrs',
      qty: '-'
    });
  }
  
  // 7. DC Cables - Battery
  if (dcBattCableParams?.selectedCableSize && dcBattCableParams.selectedCableSize > 0) {
    const dcBattCableLength = dcBattCableParams.cableLength || 0;
    const numberOfParallel = dcBattCableParams.numberOfParallel || inParallel || 1;
    // Calculate total: 2 × length × number of parallel strings (for +ve and -ve)
    const totalDcBattLength = 2 * dcBattCableLength * numberOfParallel;
    const material = dcBattCableParams.material || 'Copper';
    const insulation = dcBattCableParams.insulation || 'XLPE';
    const designCurrent = dcBattCableParams.designCurrent || 0;
    
    boqItems.push({
      slNo: slNo++,
      description: 'DC Cable - Battery to Inverter (+ve & -ve)',
      specification: `${dcBattCableParams.selectedCableSize}mm² ${material} single core, ${insulation}, Design Current: ${designCurrent.toFixed(1)}A`,
      unit: 'Mtrs',
      qty: Math.round(totalDcBattLength)
    });
  } else if (numberOfBatteries > 0 && couplingType === 'DC') {
    // Placeholder when cable sizing not done
    boqItems.push({
      slNo: slNo++,
      description: 'DC Cable - Battery to Inverter (+ve & -ve)',
      specification: 'To be determined from Cable Sizing tab',
      unit: 'Mtrs',
      qty: '-'
    });
  }
  
  // 8. AC Cables
  if (couplingType === 'DC' && acHybridCableParams?.selectedCableSize && acHybridCableParams.selectedCableSize > 0) {
    const acCableLength = acHybridCableParams.cableLength || 0;
    const acCableRuns = acHybridCableParams.cableRuns || 1;
    const totalAcLength = acCableLength * acCableRuns;
    const material = acHybridCableParams.material || 'Copper';
    const insulation = acHybridCableParams.insulation || '4-Core XLPE Armoured';
    const designCurrent = acHybridCableParams.designCurrent || 0;
    
    boqItems.push({
      slNo: slNo++,
      description: 'AC Cable - Hybrid Inverter to Main LV Panel',
      specification: `${acHybridCableParams.selectedCableSize}mm² ${material} ${insulation}, ${acCableRuns} runs, Design Current: ${designCurrent.toFixed(1)}A`,
      unit: 'Mtrs',
      qty: Math.round(totalAcLength)
    });
  } else if (couplingType === 'DC') {
    // Placeholder for DC coupled when cable sizing not done
    boqItems.push({
      slNo: slNo++,
      description: 'AC Cable - Hybrid Inverter to Main LV Panel',
      specification: 'To be determined from Cable Sizing tab',
      unit: 'Mtrs',
      qty: '-'
    });
  } else if (couplingType === 'AC') {
    // PV Inverter AC Cable
    if (acPvCableParams?.selectedCableSize && acPvCableParams.selectedCableSize > 0) {
      const acPvCableRuns = acPvCableParams.cableRuns || 1;
      const acPvLength = (acPvCableParams.cableLength || 0) * acPvCableRuns;
      const material = acPvCableParams.material || 'Copper';
      const insulation = acPvCableParams.insulation || '4-Core XLPE Armoured';
      const designCurrent = acPvCableParams.designCurrent || 0;
      
      boqItems.push({
        slNo: slNo++,
        description: 'AC Cable - PV Inverter to Main LV Panel',
        specification: `${acPvCableParams.selectedCableSize}mm² ${material} ${insulation}, ${acPvCableRuns} runs, Design Current: ${designCurrent.toFixed(1)}A`,
        unit: 'Mtrs',
        qty: Math.round(acPvLength)
      });
    } else {
      boqItems.push({
        slNo: slNo++,
        description: 'AC Cable - PV Inverter to Main LV Panel',
        specification: 'To be determined from Cable Sizing tab',
        unit: 'Mtrs',
        qty: '-'
      });
    }
    
    // Battery Inverter AC Cable
    if (acBattCableParams?.selectedCableSize && acBattCableParams.selectedCableSize > 0) {
      const acBattCableRuns = acBattCableParams.cableRuns || 1;
      const acBattLength = (acBattCableParams.cableLength || 0) * acBattCableRuns;
      const material = acBattCableParams.material || 'Copper';
      const insulation = acBattCableParams.insulation || '4-Core XLPE Armoured';
      const designCurrent = acBattCableParams.designCurrent || 0;
      
      boqItems.push({
        slNo: slNo++,
        description: 'AC Cable - Battery Inverter to Main LV Panel',
        specification: `${acBattCableParams.selectedCableSize}mm² ${material} ${insulation}, ${acBattCableRuns} runs, Design Current: ${designCurrent.toFixed(1)}A`,
        unit: 'Mtrs',
        qty: Math.round(acBattLength)
      });
    } else {
      boqItems.push({
        slNo: slNo++,
        description: 'AC Cable - Battery Inverter to Main LV Panel',
        specification: 'To be determined from Cable Sizing tab',
        unit: 'Mtrs',
        qty: '-'
      });
    }
  }
  
  // 9. Electrical BOS & Battery Racking (AI-Generated Only)
  if (aiGeneratedItems.length > 0) {
    // Use AI-generated detailed items
    aiGeneratedItems.forEach((item) => {
      boqItems.push({
        slNo: slNo++,
        description: item.description,
        specification: item.specification,
        unit: item.unit,
        qty: item.qty
      });
    });
  }
  // Note: No default lumpsum items - BOQ only shows after AI generation

  return (
    <div className="space-y-6 p-6">
      <Card className="border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <CardHeader className="border-b border-cyan-500/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Bill of Quantities (BOQ)
                </CardTitle>
                <CardDescription className="text-cyan-200/60 mt-1">
                  Major components for {projectData.projectName || 'BESS Project'}
                </CardDescription>
              </div>
            </div>
            
            <Button
              onClick={generateAIBOQ}
              disabled={aiGenerating || !numberOfBatteries}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {aiGenerating ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating AI BOQ...
                </>
              ) : (
                <>
                  ✨ AI Assisted BOQ Generation
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {aiGeneratedItems.length === 0 && !aiGenerating ? (
            // Show message before AI generation
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                <ClipboardList className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-cyan-100 mb-2">
                AI-Assisted BOQ Generation
              </h3>
              <p className="text-cyan-200/60 mb-6 max-w-2xl mx-auto">
                Click the <span className="font-semibold text-purple-300">✨ AI Assisted BOQ Generation</span> button above to generate a detailed Bill of Quantities with:
              </p>
              <ul className="text-left max-w-md mx-auto text-cyan-200/80 space-y-2 mb-6">
                <li>• Battery Racking System with specifications and quantities</li>
                <li>• Detailed Earthing System components</li>
                <li>• Lightning Protection System with SPDs</li>
                <li>• Cable Management (trays, conduits, accessories)</li>
                <li>• AC/DC Distribution Boxes with MCBs, isolators, fuses</li>
                <li>• Other Electrical BOS items specific to your project</li>
              </ul>
              <p className="text-xs text-yellow-300/80">
                ⚡ This will use AI to analyze your system and generate professional BOQ specifications
              </p>
            </div>
          ) : (
            // Show BOQ table after AI generation
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cyan-900/30 border-b-2 border-cyan-500/50">
                    <th className="p-3 text-left text-cyan-100 font-semibold text-sm">Sl No</th>
                    <th className="p-3 text-left text-cyan-100 font-semibold text-sm">Description</th>
                    <th className="p-3 text-left text-cyan-100 font-semibold text-sm">Specification</th>
                    <th className="p-3 text-left text-cyan-100 font-semibold text-sm">Unit</th>
                    <th className="p-3 text-right text-cyan-100 font-semibold text-sm">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {boqItems.map((item, index) => (
                    <tr 
                      key={index}
                      className={`border-b border-cyan-500/20 hover:bg-cyan-900/20 transition-colors ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'
                      }`}
                    >
                      <td className="p-3 text-cyan-200 font-medium">{item.slNo}</td>
                      <td className="p-3 text-cyan-100">{item.description}</td>
                      <td className="p-3 text-cyan-200/80 text-sm">{item.specification}</td>
                      <td className="p-3 text-cyan-200">{item.unit}</td>
                      <td className="p-3 text-right text-cyan-100 font-semibold">
                        {item.unit === 'Lumpsum' ? '-' : item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            {aiGeneratedItems.length > 0 && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-200">
                  <span className="font-semibold">✨ AI-Generated Items:</span> The detailed BOS components have been generated using AI. 
                  Review the specifications and quantities, and adjust as needed for your specific project requirements.
                </p>
              </div>
            )}
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-200">
                <span className="font-semibold">Note:</span> This BOQ includes major components only. 
                <br/><br/>
                <span className="font-semibold">✅ Cable Data Auto-Sync:</span> Cable specifications and quantities are automatically fetched from the <span className="font-semibold">Cable Sizing</span> tab. 
                Complete your cable sizing first, and the BOQ will update automatically with:
                <br/>
                • Cable material (Copper/Aluminum)
                <br/>
                • Cable insulation type (XLPE/Armoured)
                <br/>
                • Cross-section area (mm²)
                <br/>
                • Design current (A)
                <br/>
                • Total cable length (calculated with 2× factor for DC +ve/-ve polarity)
                <br/><br/>
                <span className="font-semibold">AI Generation:</span> Click <span className="font-semibold">✨ AI Generate BOS Details</span> button to get detailed specifications for electrical BOS items, 
                battery racking, and distribution systems using AI. 
                <br/><br/>
                Additional items such as installation materials, civil works, commissioning, and miscellaneous 
                hardware may be required. Please consult with your engineering team for a complete project BOQ.
              </p>
            </div>
            
            {!import.meta.env.VITE_OPENROUTER_API_KEY && (
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-200">
                  <span className="font-semibold">ℹ️ Setup AI BOQ Generation:</span> To enable AI-powered BOQ generation, 
                  add your OpenRouter API key as <code className="px-1 py-0.5 bg-slate-700 rounded">VITE_OPENROUTER_API_KEY</code> in your <code className="px-1 py-0.5 bg-slate-700 rounded">.env</code> file.
                  Get your free API key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-400">openrouter.ai</a>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// Simulation Result Component
// ===========================================
const SimulationResult = ({ projectData, batterySelection, pvParams, loadData, bessCapacity, pvResults, sizingResults, setActivePage, energySplit, setAnnualPVProductionKWh }: any) => {
  const selectedBattery = BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
  
  // ✅ Get ACTUAL designed PV capacity from PV sizing
  // Priority: pvResults.systemCapacity > calculated from pvParams > fallback
  let pvCapacity = 0;
  let pvModulePower = 630; // Default
  let modulesPerString = 20; // Default
  let numberOfStrings = 2; // Default
  let totalModules = 0;
  
  if (pvResults?.systemCapacity && pvResults.systemCapacity > 0) {
    // Use actual designed capacity from PV Sizing if available
    pvCapacity = pvResults.systemCapacity;
    totalModules = pvResults.totalModules || 40;
    pvModulePower = pvResults.modulePower || 630;
    modulesPerString = pvResults.modulesPerString || 20;
    numberOfStrings = pvResults.strings || 2;
  } else if (pvParams?.moduleMaxPower) {
    // Calculate from pvParams if available
    pvModulePower = pvParams.moduleMaxPower;
    modulesPerString = pvParams.modulesPerString || 20;
    numberOfStrings = pvParams.numberOfStrings || 2;
    totalModules = modulesPerString * numberOfStrings;
    pvCapacity = (pvModulePower * totalModules) / 1000;
  } else {
    // Fallback calculation
    totalModules = modulesPerString * numberOfStrings;
    pvCapacity = (pvModulePower * totalModules) / 1000;
  }
  
  console.log('📊 SimulationResult - PV Capacity:', {
    source: pvResults?.systemCapacity ? 'pvResults' : (pvParams?.moduleMaxPower ? 'pvParams' : 'fallback'),
    pvModulePower,
    modulesPerString,
    numberOfStrings,
    totalModules,
    pvCapacity: pvCapacity.toFixed(2) + ' kWp',
    pvResults,
    pvParams
  });
  
  // Get inverter capacity
  const inverterCapacity = batterySelection.couplingType === 'DC' 
    ? (batterySelection.selectedInverterId ? 
        (batterySelection.hybridInverterCapacity || 0) * (batterySelection.inverterQuantity || 1) 
        : 0)
    : (batterySelection.selectedInverterId ? 
        (batterySelection.batteryInverterCapacity || 0) * (batterySelection.inverterQuantity || 1) 
        : 0);
  
  // Calculate daily, monthly, and annual energy values
  const dailyConsumption = energySplit?.totalEnergy || 0;
  const monthlyConsumption = dailyConsumption * 30;
  const annualConsumption = dailyConsumption * 365;
  
  // PV Energy Production with actual capacity
  const avgDailySolarIrr = projectData.avgDailySolarIrradiation || 5;
  const pvSystemLosses = 0.15;
  const dailyPVProduction = pvCapacity * avgDailySolarIrr * (1 - pvSystemLosses);
  const monthlyPVProduction = dailyPVProduction * 30;
  const annualPVProduction = dailyPVProduction * 365;
  
  // ✅ Specific Production (kWh/kWp/year)
  const specificProduction = pvCapacity > 0 ? annualPVProduction / pvCapacity : 0;
  
  // Store annual PV production for use in Financial Analysis
  useEffect(() => {
    if (setAnnualPVProductionKWh) {
      setAnnualPVProductionKWh(annualPVProduction);
      console.log('✅ Updated Annual PV Production:', annualPVProduction.toFixed(2), 'kWh/year');
    }
  }, [annualPVProduction, setAnnualPVProductionKWh]);
  
  // Battery Metrics
  const batteryDoD = selectedBattery?.dod || 90;
  const batteryEfficiency = 0.95;
  const dailyBatteryThroughput = energySplit?.nighttimeEnergy || 0;
  const dailyBatteryLoss = dailyBatteryThroughput * (1 - batteryEfficiency);
  const monthlyBatteryLoss = dailyBatteryLoss * 30;
  const annualBatteryLoss = dailyBatteryLoss * 365;
  
  // Monthly data for charts
  const monthlyData = [
    {month: 'Jan', pv: monthlyPVProduction * 0.8, load: monthlyConsumption, battery: dailyBatteryThroughput * 31},
    {month: 'Feb', pv: monthlyPVProduction * 0.85, load: monthlyConsumption * 0.95, battery: dailyBatteryThroughput * 28},
    {month: 'Mar', pv: monthlyPVProduction * 0.95, load: monthlyConsumption, battery: dailyBatteryThroughput * 31},
    {month: 'Apr', pv: monthlyPVProduction * 1.05, load: monthlyConsumption * 1.05, battery: dailyBatteryThroughput * 30},
    {month: 'May', pv: monthlyPVProduction * 1.1, load: monthlyConsumption * 1.1, battery: dailyBatteryThroughput * 31},
    {month: 'Jun', pv: monthlyPVProduction * 1.15, load: monthlyConsumption * 1.15, battery: dailyBatteryThroughput * 30},
    {month: 'Jul', pv: monthlyPVProduction * 1.2, load: monthlyConsumption * 1.2, battery: dailyBatteryThroughput * 31},
    {month: 'Aug', pv: monthlyPVProduction * 1.15, load: monthlyConsumption * 1.15, battery: dailyBatteryThroughput * 31},
    {month: 'Sep', pv: monthlyPVProduction * 1.05, load: monthlyConsumption * 1.05, battery: dailyBatteryThroughput * 30},
    {month: 'Oct', pv: monthlyPVProduction * 0.95, load: monthlyConsumption, battery: dailyBatteryThroughput * 31},
    {month: 'Nov', pv: monthlyPVProduction * 0.85, load: monthlyConsumption * 0.95, battery: dailyBatteryThroughput * 30},
    {month: 'Dec', pv: monthlyPVProduction * 0.8, load: monthlyConsumption * 0.9, battery: dailyBatteryThroughput * 31},
  ];
  
  // ✅ Daily hourly data for 24-hour chart
  const hourlyLoad = loadData.weekday || Array(24).fill(dailyConsumption / 24);
  const dailyHourlyData = Array.from({ length: 24 }, (_, hour) => {
    // PV generation (bell curve from 6am to 6pm)
    const sunHours = hour >= 6 && hour < 18;
    const pvFactor = sunHours ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
    const pvGeneration = (dailyPVProduction / 5) * pvFactor; // Spread over ~5 effective sun hours
    
    // Load consumption
    const load = hourlyLoad[hour] || dailyConsumption / 24;
    
    // Battery: Charging during day (when PV > load), Discharging at night
    const netEnergy = pvGeneration - load;
    const batteryCharge = sunHours && netEnergy > 0 ? netEnergy : 0;
    const batteryDischarge = !sunHours || netEnergy < 0 ? Math.abs(Math.min(0, netEnergy)) : 0;
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      pv: pvGeneration,
      load: load,
      batteryCharge: batteryCharge,
      batteryDischarge: -batteryDischarge, // Negative for visual effect
    };
  });
  
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BatteryCharging className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Simulation Result</h2>
          </div>
          <p className="text-indigo-100 text-sm">Comprehensive energy analysis and system performance simulation</p>
        </div>
      </div>
      
      {/* Overall System Summary */}
      <Card className="border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            📊 System Design Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/70 rounded-lg border border-amber-500/40">
              <p className="text-xs text-amber-200/70 mb-2">PV System Capacity</p>
              <p className="text-2xl font-bold text-amber-300">{pvCapacity.toFixed(2)} kWp</p>
              <p className="text-xs text-amber-200/50 mt-1">{totalModules} modules</p>
            </div>
            <div className="p-4 bg-slate-800/70 rounded-lg border border-emerald-500/40">
              <p className="text-xs text-emerald-200/70 mb-2">BESS Capacity</p>
              <p className="text-2xl font-bold text-emerald-300">{bessCapacity.toFixed(2)} kWh</p>
              <p className="text-xs text-emerald-200/50 mt-1">{selectedBattery ? `${Math.ceil(bessCapacity / selectedBattery.capacity)} units` : 'Battery Storage'}</p>
            </div>
            <div className="p-4 bg-slate-800/70 rounded-lg border border-cyan-500/40">
              <p className="text-xs text-cyan-200/70 mb-2">Total AC Capacity</p>
              <p className="text-2xl font-bold text-cyan-300">{inverterCapacity > 0 ? inverterCapacity.toFixed(2) : '--'} kW</p>
              <p className="text-xs text-cyan-200/50 mt-1">{batterySelection.couplingType === 'DC' ? 'Hybrid Inverter' : 'Battery Inverter'}</p>
            </div>
            <div className="p-4 bg-slate-800/70 rounded-lg border border-purple-500/40">
              <p className="text-xs text-purple-200/70 mb-2">System Type</p>
              <p className="text-2xl font-bold text-purple-300">{batterySelection.couplingType === 'DC' ? 'DC Coupled' : 'AC Coupled'}</p>
              <p className="text-xs text-purple-200/50 mt-1">{projectData.application}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Component Specifications */}
      <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            🔧 Component Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PV Module */}
            <div className="p-4 bg-slate-800/60 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-5 w-5 text-yellow-400" />
                <p className="font-bold text-yellow-200">PV Modules</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Module Power:</span>
                  <span className="text-yellow-200 font-semibold">{pvModulePower}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">String Config:</span>
                  <span className="text-yellow-200 font-semibold">{modulesPerString} × {numberOfStrings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Modules:</span>
                  <span className="text-yellow-200 font-semibold">{totalModules} units</span>
                </div>
                <div className="flex justify-between border-t border-yellow-500/20 pt-2 mt-2">
                  <span className="text-gray-300 font-medium">Total Capacity:</span>
                  <span className="text-yellow-300 font-bold">{pvCapacity.toFixed(2)} kWp</span>
                </div>
              </div>
            </div>
            
            {/* Battery */}
            <div className="p-4 bg-slate-800/60 rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <BatteryCharging className="h-5 w-5 text-emerald-400" />
                <p className="font-bold text-emerald-200">Battery Storage</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Technology:</span>
                  <span className="text-emerald-200 font-semibold">{selectedBattery?.chemistry || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unit Capacity:</span>
                  <span className="text-emerald-200 font-semibold">{selectedBattery?.capacity.toFixed(2) || '0'} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-emerald-200 font-semibold">{selectedBattery ? Math.ceil(bessCapacity / selectedBattery.capacity) : 0} units</span>
                </div>
                <div className="flex justify-between border-t border-emerald-500/20 pt-2 mt-2">
                  <span className="text-gray-300 font-medium">Total Capacity:</span>
                  <span className="text-emerald-300 font-bold">{bessCapacity.toFixed(2)} kWh</span>
                </div>
              </div>
            </div>
            
            {/* Inverter */}
            <div className="p-4 bg-slate-800/60 rounded-lg border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-cyan-400" />
                <p className="font-bold text-cyan-200">{batterySelection.couplingType === 'DC' ? 'Hybrid Inverter' : 'Battery Inverter'}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-cyan-200 font-semibold">{batterySelection.couplingType === 'DC' ? 'DC Coupled' : 'AC Coupled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unit Capacity:</span>
                  <span className="text-cyan-200 font-semibold">{inverterCapacity > 0 ? (inverterCapacity / (batterySelection.inverterQuantity || 1)).toFixed(2) : '--'} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-cyan-200 font-semibold">{batterySelection.inverterQuantity || 0} units</span>
                </div>
                <div className="flex justify-between border-t border-cyan-500/20 pt-2 mt-2">
                  <span className="text-gray-300 font-medium">Total AC Capacity:</span>
                  <span className="text-cyan-300 font-bold">{inverterCapacity > 0 ? inverterCapacity.toFixed(2) : '--'} kW</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Energy Simulation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solar PV Energy */}
        <Card className="border border-yellow-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
              ☀️ Solar PV Energy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-yellow-200/70">Daily Average</p>
              <p className="text-xl font-bold text-yellow-300">{dailyPVProduction.toFixed(2)} kWh/day</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-yellow-200/70">Monthly Total</p>
              <p className="text-xl font-bold text-yellow-300">{monthlyPVProduction.toFixed(0)} kWh/month</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-yellow-200/70">Annual Production</p>
              <p className="text-xl font-bold text-yellow-300">{(annualPVProduction / 1000).toFixed(2)} MWh/year</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-yellow-200/70">Specific Production</p>
              <p className="text-xl font-bold text-yellow-300">{specificProduction.toFixed(0)} kWh/kWp/year</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
              <p className="text-xs text-amber-300">System Losses: {(pvSystemLosses * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Load Energy Consumption */}
        <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              ⚡ Energy Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-blue-200/70">Daily Average</p>
              <p className="text-xl font-bold text-blue-300">{dailyConsumption.toFixed(2)} kWh/day</p>
              <p className="text-xs text-cyan-300 mt-1">Day: {energySplit?.daytimeEnergy.toFixed(1)} | Night: {energySplit?.nighttimeEnergy.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-blue-200/70">Monthly Total</p>
              <p className="text-xl font-bold text-blue-300">{monthlyConsumption.toFixed(0)} kWh/month</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-blue-200/70">Annual Consumption</p>
              <p className="text-xl font-bold text-blue-300">{(annualConsumption / 1000).toFixed(2)} MWh/year</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
              <p className="text-xs text-blue-300">Peak Load: {energySplit?.peakLoad.toFixed(2)} kW</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Battery Storage */}
        <Card className="border border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              🔋 Battery Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-purple-200/70">Daily Throughput</p>
              <p className="text-xl font-bold text-purple-300">{dailyBatteryThroughput.toFixed(2)} kWh/day</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-purple-200/70">Usable Capacity</p>
              <p className="text-xl font-bold text-purple-300">{(bessCapacity * (batteryDoD / 100)).toFixed(2)} kWh</p>
              <p className="text-xs text-pink-300 mt-1">@ {batteryDoD}% DoD</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg">
              <p className="text-xs text-purple-200/70">Annual Losses</p>
              <p className="text-xl font-bold text-purple-300">{annualBatteryLoss.toFixed(0)} kWh/year</p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded border border-purple-500/30">
              <p className="text-xs text-purple-300">Round-trip Efficiency: {(batteryEfficiency * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Energy Simulation Charts - Full Width Single Column */}
      {/* Monthly Energy Chart */}
      <Card className="border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            📈 Monthly Energy Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: any) => Number(value).toFixed(2) + ' kWh'}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="pv" fill="#fbbf24" name="PV Production" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="load" fill="#3b82f6" name="Load Consumption" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="battery" fill="#a855f7" name="Battery Throughput" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Daily Average Chart */}
      <Card className="border border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            ⏰ Daily Average Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyHourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={70} />
                  <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: any) => Number(value).toFixed(2) + ' kWh'}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="pv" fill="#fbbf24" stroke="#fbbf24" name="PV Generation" />
                  <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={2} name="Load Consumption" dot={false} />
                  <Bar dataKey="batteryCharge" fill="#10b981" name="Battery Charging" />
                  <Bar dataKey="batteryDischarge" fill="#ef4444" name="Battery Discharging" />
                </ComposedChart>
              </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SystemSizing = ({ sizingParams, setSizingParams, sizingResults }: any) => (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>BESS Sizing Parameters</CardTitle><CardDescription>Adjust general parameters. Specifics are from the selected battery.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="autonomy">Days of Autonomy<TooltipWrapper content="How many days the system should run on battery alone without any charging from PV or grid."><HelpCircle className="inline-block ml-1 h-4 w-4 text-gray-400 cursor-help" /></TooltipWrapper></Label><Input id="autonomy" type="number" value={sizingParams.autonomy} onChange={(e) => setSizingParams({...sizingParams, autonomy: parseFloat(e.target.value) || 0})}/></div></CardContent></Card><Card><CardHeader><CardTitle>Sizing Results</CardTitle><CardDescription>The calculated system requirements based on your inputs.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><div><p className="text-sm text-blue-800 dark:text-blue-200">Required Battery Units</p><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{sizingResults.numberOfBatteries}</p></div><Database className="h-10 w-10 text-blue-500" /></div><div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-lg"><div><p className="text-sm text-green-800 dark:text-green-200">Total Battery Capacity</p><p className="text-3xl font-bold text-green-600 dark:text-green-400">{sizingResults.totalCapacity.toFixed(2)} kWh</p></div><BatteryCharging className="h-10 w-10 text-green-500" /></div><div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg"><div><p className="text-sm text-yellow-800 dark:text-yellow-200">Total Inverter Power</p><p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{sizingResults.totalPower.toFixed(2)} kW</p></div><Zap className="h-10 w-10 text-yellow-500" /></div></CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle>Average Day Energy Flow</CardTitle><CardDescription>Simulated energy flow between load, PV, and the grid/battery.</CardDescription></CardHeader><CardContent><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={sizingResults.energyFlow} margin={{top: 5, right: 20, left: -10, bottom: 5}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" /><XAxis dataKey="name" fontSize={10} /><YAxis unit="kW" fontSize={10} /><Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155', borderRadius: '0.5rem' }} /><Legend /><Bar dataKey="Load" fill="#8884d8" barSize={20} /><Area type="monotone" dataKey="PV Generation" fill="#82ca9d" stroke="#82ca9d" /><Area type="monotone" dataKey="Net Load" fill="#ffc658" stroke="#ffc658" /></ComposedChart></ResponsiveContainer></div></CardContent></Card></div>);

const FinancialAnalysis = ({ 
  projectData, 
  financialParams, 
  setFinancialParams, 
  financialResults,
  calculatedTotalProjectCost,
  annualPVProductionKWh,
  pricingData,
  devCosts,
  batterySelection,
  pvParams,
  pvResults,
  selectedHybridInverter,
  selectedPvInverter,
  selectedBatteryInverter
}: any) => {
  const isUtility = projectData.application === 'Utility Scale';
  
  // Use total project cost directly from ProjectCosting component
  const totalProjectCost = useMemo(() => {
    console.log('\n💰 ========== USING PROJECT COST FROM PROJECT COSTING TAB ==========');
    console.log('📊 Received from ProjectCosting component:', calculatedTotalProjectCost);
    console.log('💵 TOTAL PROJECT COST: $' + (calculatedTotalProjectCost || 0).toFixed(2));
    console.log('====================================================================\n');
    
    return calculatedTotalProjectCost || 0;
  }, [calculatedTotalProjectCost]);
  
  // Auto-update initial investment when pricing data changes
  useEffect(() => {
    console.log('\n🔄 ========== FINANCIAL PARAMS UPDATE CHECK ==========');
    console.log('💵 Total Project Cost from ProjectCosting:', totalProjectCost);
    console.log('⚡ Annual PV Production from Simulation:', annualPVProductionKWh, 'kWh/year');
    console.log('💰 Current Initial Investment:', financialParams.initialInvestment);
    console.log('📊 Should Update Initial Investment?', totalProjectCost > 0 && totalProjectCost !== financialParams.initialInvestment);
    
    if (totalProjectCost > 0 && totalProjectCost !== financialParams.initialInvestment) {
      console.log('✅ Updating Initial Investment to: $' + totalProjectCost.toFixed(2));
      setFinancialParams((prev: any) => ({
        ...prev,
        initialInvestment: totalProjectCost
      }));
    } else if (totalProjectCost === 0) {
      console.log('⚠️ WARNING: Total Project Cost is $0 - Please visit Project Costing tab first!');
    }
    console.log('====================================================\n');
  }, [totalProjectCost, annualPVProductionKWh]);
  
  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  const pieData = [
    { name: 'Battery Cost', value: parseFloat(financialResults.costs.batteryCost.toFixed(2)) },
    { name: 'PV System Cost', value: parseFloat(financialResults.costs.pvCost.toFixed(2)) },
    { name: 'DG Set Cost', value: parseFloat(financialResults.costs.dgCost.toFixed(2)) },
    { name: 'Other Costs', value: parseFloat(financialResults.costs.otherCosts.toFixed(2)) },
  ].filter((d: any) => d.value > 0);
  
  return (
    <div className="space-y-6 p-6 bg-[#1a2332] min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-[#1e293b] border border-cyan-500/20 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
            <DollarSign className="h-6 w-6 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Financial Analysis</h2>
        </div>
        <p className="text-cyan-300/70 text-sm">Comprehensive financial evaluation of your BESS project</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Financial Parameters Card */}
        <Card className="xl:col-span-1 bg-[#1e293b] border border-slate-700/50 shadow-lg">
          <CardHeader className="border-b border-slate-700/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Financial Parameters</CardTitle>
                <CardDescription className="text-cyan-300/70">Enter cost & long-term assumptions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 pt-6">
            {/* Initial Investment */}
            <div className="space-y-2">
              <Label htmlFor="initialInvestment" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-400" />
                Initial Project Investment ($)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Total upfront capital required for the project. Auto-populated from Project Costing tab including equipment, installation, and development costs.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="initialInvestment" 
                type="number" 
                value={financialParams.initialInvestment || totalProjectCost}
                onChange={(e) => setFinancialParams({...financialParams, initialInvestment: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                placeholder="Auto-populated from Project Costing"
              />
              {totalProjectCost > 0 && (
                <p className="text-xs text-cyan-400">
                  From Project Costing: ${totalProjectCost.toFixed(2).toLocaleString()}
                </p>
              )}
            </div>
            
            {/* Incentives/Rebates */}
            <div className="space-y-2">
              <Label htmlFor="incentives" className="text-sm font-semibold text-cyan-200">
                Incentives/Rebates ($)
              </Label>
              <Input 
                id="incentives" 
                type="number" 
                value={financialParams.incentives}
                onChange={(e) => setFinancialParams({...financialParams, incentives: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
              />
            </div>
            
            {/* Project Lifespan */}
            <div className="space-y-2">
              <Label htmlFor="projectLifespan" className="text-sm font-semibold text-cyan-200">
                Project Lifespan (years)
              </Label>
              <Input 
                id="projectLifespan" 
                type="number" 
                value={financialParams.projectLifespan}
                onChange={(e) => setFinancialParams({...financialParams, projectLifespan: parseInt(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
            
            {/* BESS Lifespan */}
            <div className="space-y-2">
              <Label htmlFor="bessLifespan" className="text-sm font-semibold text-cyan-200">
                BESS Lifespan (years)
              </Label>
              <Input 
                id="bessLifespan" 
                type="number" 
                value={financialParams.bessLifespan}
                onChange={(e) => setFinancialParams({...financialParams, bessLifespan: parseInt(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
            
            {/* Discount Rate */}
            <div className="space-y-2">
              <Label htmlFor="discountRate" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                Discount Rate (%)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Rate used to calculate present value of future cash flows (NPV). Represents required rate of return or cost of capital. Typical range: 5-10% for renewable energy projects.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="discountRate" 
                type="number" 
                value={financialParams.discountRate}
                onChange={(e) => setFinancialParams({...financialParams, discountRate: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
            
            {/* PV Degradation */}
            <div className="space-y-2">
              <Label htmlFor="pvDegradation" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                PV Annual Degradation (%)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Annual reduction in PV system output due to aging. Typical value is 0.5% per year for quality modules with 25-year warranty.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="pvDegradation" 
                type="number" 
                value={financialParams.pvDegradation}
                onChange={(e) => setFinancialParams({...financialParams, pvDegradation: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
              />
            </div>
            
            {/* Battery Degradation */}
            <div className="space-y-2">
              <Label htmlFor="batteryDegradation" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                Battery Annual Degradation (%)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Annual capacity fade of battery system. Typical value is 2-3% per year for lithium-ion batteries. Affects available storage capacity over time.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="batteryDegradation" 
                type="number" 
                value={financialParams.batteryDegradation}
                onChange={(e) => setFinancialParams({...financialParams, batteryDegradation: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20"
              />
            </div>
            
            {/* Annual Maintenance Cost */}
            <div className="space-y-2">
              <Label htmlFor="annualMaintenanceCost" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                Annual O&M Cost ($)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Yearly Operations & Maintenance costs including cleaning, inspections, repairs, and monitoring. Typically 1-2% of initial investment for solar+BESS projects.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="annualMaintenanceCost" 
                type="number" 
                value={financialParams.annualMaintenanceCost}
                onChange={(e) => setFinancialParams({...financialParams, annualMaintenanceCost: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20"
              />
            </div>
            
            {/* Maintenance Escalation */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceEscalation" className="text-sm font-semibold text-cyan-200">
                O&M Escalation (%)
              </Label>
              <Input 
                id="maintenanceEscalation" 
                type="number" 
                value={financialParams.maintenanceEscalation}
                onChange={(e) => setFinancialParams({...financialParams, maintenanceEscalation: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20"
              />
            </div>
            
            {/* Maintenance Escalation Frequency */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceEscalationFrequency" className="text-sm font-semibold text-cyan-200">
                O&M Escalation Every (years)
              </Label>
              <Input 
                id="maintenanceEscalationFrequency" 
                type="number" 
                value={financialParams.maintenanceEscalationFrequency}
                onChange={(e) => setFinancialParams({...financialParams, maintenanceEscalationFrequency: parseInt(e.target.value) || 1})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20"
              />
            </div>
            
            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                Tax Rate on Gross Profit (%)
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-500/50 text-slate-100 max-w-xs">
                      <p>Corporate or income tax rate applied to project's annual gross profit (Revenue - Costs). Typical values: 20% for residential projects, 25% for commercial/utility scale projects.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </Label>
              <Input 
                id="taxRate" 
                type="number" 
                value={financialParams.taxRate}
                onChange={(e) => setFinancialParams({...financialParams, taxRate: parseFloat(e.target.value) || 0})}
                className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                placeholder="20"
              />
              <p className="text-xs text-slate-400">
                Typical: 20% (Residential), 25% (Commercial/Utility)
              </p>
            </div>
            
            {/* Electricity Rate & Escalation */}
            {!isUtility && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="electricityRate" className="text-sm font-semibold text-cyan-200">
                    Current Electricity Rate ($/kWh)
                  </Label>
                  <Input 
                    id="electricityRate" 
                    type="number" 
                    value={financialParams.electricityRate}
                    onChange={(e) => setFinancialParams({...financialParams, electricityRate: parseFloat(e.target.value) || 0})}
                    className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="electricityEscalation" className="text-sm font-semibold text-cyan-200">
                    Electricity Tariff Escalation (%)
                  </Label>
                  <Input 
                    id="electricityEscalation" 
                    type="number" 
                    value={financialParams.electricityEscalation}
                    onChange={(e) => setFinancialParams({...financialParams, electricityEscalation: parseFloat(e.target.value) || 0})}
                    className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="electricityEscalationFrequency" className="text-sm font-semibold text-cyan-200">
                    Tariff Escalation Every (years)
                  </Label>
                  <Input 
                    id="electricityEscalationFrequency" 
                    type="number" 
                    value={financialParams.electricityEscalationFrequency}
                    onChange={(e) => setFinancialParams({...financialParams, electricityEscalationFrequency: parseInt(e.target.value) || 1})}
                    className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                  />
                </div>
              </>
            )}
            
            {/* Utility Scale - Arbitrage Spread */}
            {isUtility && (
              <div className="space-y-2">
                <Label htmlFor="arbitrageSpread" className="text-sm font-semibold text-cyan-200">
                  Avg. Arbitrage Spread ($/kWh)
                </Label>
                <Input 
                  id="arbitrageSpread" 
                  type="number" 
                  value={financialParams.arbitrageSpread}
                  onChange={(e) => setFinancialParams({...financialParams, arbitrageSpread: parseFloat(e.target.value) || 0})}
                  className="bg-[#0f1729] border border-slate-600/50 text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Results Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
            <CardHeader className="border-b border-slate-700/50 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Financial Summary</CardTitle>
                  <CardDescription className="text-cyan-300/70">Key metrics for investment evaluation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-6">
              <div className="p-4 bg-[#0f1729] border border-slate-600/50 rounded-lg">
                <p className="text-sm text-cyan-400 uppercase tracking-wider mb-2">NPV</p>
                <p className={`font-bold text-xl ${financialResults.npv > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {financialResults.npv.toLocaleString('en-US', {style:'currency', currency:'USD', minimumFractionDigits:0})}
                </p>
              </div>
              <div className="p-4 bg-[#0f1729] border border-slate-600/50 rounded-lg">
                <p className="text-sm text-cyan-400 uppercase tracking-wider mb-2">IRR</p>
                <p className="font-bold text-xl text-blue-400">
                  {isFinite(financialResults.irr) ? `${financialResults.irr.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-[#0f1729] border border-slate-600/50 rounded-lg">
                <p className="text-sm text-cyan-400 uppercase tracking-wider mb-2">Payback</p>
                <p className="font-bold text-xl text-purple-400">
                  {isFinite(financialResults.paybackPeriod) ? `${financialResults.paybackPeriod.toFixed(1)} yrs` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-[#0f1729] border border-slate-600/50 rounded-lg">
                <p className="text-sm text-cyan-400 uppercase tracking-wider mb-2">LCOE</p>
                <p className="font-bold text-xl text-yellow-400">
                  {isFinite(financialResults.lcoe) ? financialResults.lcoe.toLocaleString('en-US', {style:'currency', currency:'USD', minimumFractionDigits: 3}) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Cost Breakdown */}
          <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
            <CardHeader className="border-b border-slate-700/50 pb-4">
              <CardTitle className="text-lg text-white">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-96 w-full pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    fill="#8884d8" 
                    label
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 41, 0.95)', 
                      border: '1px solid #06b6d4', 
                      borderRadius: '0.5rem',
                      color: '#e2e8f0'
                    }}
                    itemStyle={{
                      color: '#e2e8f0'
                    }}
                    labelStyle={{
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Lifetime Net Cash Flow */}
          <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
            <CardHeader className="border-b border-slate-700/50 pb-4">
              <CardTitle className="text-lg text-white">Lifetime Net Cash Flow</CardTitle>
            </CardHeader>
            <CardContent className="h-80 w-full pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialResults.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)"/>
                  <XAxis 
                    dataKey="year" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    formatter={(value) => (value as number).toLocaleString('en-US', {style:'currency', currency:'USD'})}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 41, 0.95)', 
                      border: '1px solid #06b6d4', 
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Net Cash Flow" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* 25-Year Detailed Cash Flow Projection */}
          <Card className="bg-[#1e293b] border border-slate-700/50 shadow-lg">
            <CardHeader className="border-b border-slate-700/50 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <BarChart2 className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{financialParams.projectLifespan || 25}-Year Detailed Cash Flow Projection</CardTitle>
                  <CardDescription className="text-cyan-300/70">Complete financial breakdown by year</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600/50">
                      <th className="text-left py-3 px-2 text-cyan-400 font-semibold">Year</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">PV Production (kWh)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Tariff ($/kWh)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Revenue ($)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">O&M Cost ($)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Gross Profit ($)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Tax ($)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Net Profit ($)</th>
                      <th className="text-right py-3 px-2 text-cyan-400 font-semibold">Cumulative ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialResults.cashFlow && financialResults.cashFlow.map((row: any, index: number) => (
                      <tr 
                        key={row.year} 
                        className={`border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors ${
                          row.batteryReplacement > 0 ? 'bg-orange-900/20' : ''
                        }`}
                      >
                        <td className="py-2 px-2 text-white font-medium">{row.year}</td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {row.energyKWh.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          ${row.tariff.toFixed(3)}
                        </td>
                        <td className="py-2 px-2 text-right text-green-400">
                          ${row.revenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                        <td className="py-2 px-2 text-right text-red-400">
                          ${row.omCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                        <td className="py-2 px-2 text-right text-white font-semibold">
                          ${row.grossProfit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                        <td className="py-2 px-2 text-right text-orange-400">
                          ${row.tax.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                        <td className="py-2 px-2 text-right text-blue-400 font-semibold">
                          ${row.netProfit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                        <td className={`py-2 px-2 text-right font-bold ${
                          row.cumulative >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${row.cumulative.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-cyan-500/50">
                    <tr className="bg-slate-800/50">
                      <td className="py-3 px-2 text-cyan-400 font-bold">TOTAL</td>
                      <td className="py-3 px-2 text-right text-white font-bold">
                        {financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.energyKWh, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2"></td>
                      <td className="py-3 px-2 text-right text-green-400 font-bold">
                        ${financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.revenue, 0).toLocaleString('en-US', {minimumFractionDigits: 0})}
                      </td>
                      <td className="py-3 px-2 text-right text-red-400 font-bold">
                        ${financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.omCost, 0).toLocaleString('en-US', {minimumFractionDigits: 0})}
                      </td>
                      <td className="py-3 px-2 text-right text-white font-bold">
                        ${financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.grossProfit, 0).toLocaleString('en-US', {minimumFractionDigits: 0})}
                      </td>
                      <td className="py-3 px-2 text-right text-orange-400 font-bold">
                        ${financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.tax, 0).toLocaleString('en-US', {minimumFractionDigits: 0})}
                      </td>
                      <td className="py-3 px-2 text-right text-blue-400 font-bold">
                        ${financialResults.cashFlow?.reduce((sum: number, row: any) => sum + row.netProfit, 0).toLocaleString('en-US', {minimumFractionDigits: 0})}
                      </td>
                      <td className="py-3 px-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Legend */}
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">
                  <strong className="text-cyan-400">Note:</strong>
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• <span className="text-orange-400">Orange highlighted rows</span> indicate battery replacement years</li>
                  <li>• Tariff escalates every {financialParams.electricityEscalationFrequency} year(s) by {financialParams.electricityEscalation}%</li>
                  <li>• O&M costs escalate every {financialParams.maintenanceEscalationFrequency} year(s) by {financialParams.maintenanceEscalation}%</li>
                  <li>• Tax rate: {financialParams.taxRate}% on gross profit</li>
                  {(projectData.application === 'Commercial' || projectData.application === 'Utility Scale') && (
                    <li>• Grid export tax: 15% applied to export revenue</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SummaryReport = ({ allData, cableParams, loadData, annualPVProductionKWh, selectedHybridInverter, selectedBatteryInverter }: any) => {
    const { projectData, sizingResults, financialResults, batterySelection, pvParams, dgParams, pvResults } = allData;
    const { toast } = useToast();
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    const selectedBattery = useMemo(() => {
        return BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
    }, [batterySelection]);
    
    // Use the inverter passed from parent based on coupling type
    const selectedInverter = batterySelection.couplingType === 'DC' ? selectedHybridInverter : selectedBatteryInverter;
    
    const isUtility = projectData.application === 'Utility Scale';
    const showDG = projectData.chargingSource === 'Solar PV + DG Hybrid';
    
    // Calculate daily averages
    const avgDailyLoad = loadData?.weekday ? 
        (loadData.weekday.reduce((sum: number, val: number) => sum + val, 0) * 5 + 
         loadData.weekend.reduce((sum: number, val: number) => sum + val, 0) * 2) / 7 : 0;
    
    const monthlyLoad = avgDailyLoad * 30;
    const annualLoad = avgDailyLoad * 365;
    
    const dailyBatteryCharge = selectedBattery ? selectedBattery.capacity * 0.9 : 0; // Assume 90% DOD
    const dailyBatteryDischarge = dailyBatteryCharge * 0.95; // 95% round-trip efficiency
    
    // Get module specs
    const totalModules = pvResults?.totalModules || 0;
    const modulePower = pvResults?.modulePower || 0;
    
    // Calculate total AC capacity - use correct field name from database
    const inverterACCapacity = selectedInverter ? 
        ((selectedInverter.rated_ac_capacity_kw || selectedInverter.rated_inverter_ac_capacity_kw || selectedInverter.rated_power_kw || 0) * (batterySelection.inverterQuantity || 1)) : 0;
    
    // Get inverter model name
    const inverterModel = selectedInverter?.model || selectedInverter?.inverter_model || 'Not Selected';
    const inverterRatedPower = selectedInverter?.rated_ac_capacity_kw || selectedInverter?.rated_inverter_ac_capacity_kw || selectedInverter?.rated_power_kw || 0;
    
    // PDF Generation Function
    const generatePDF = async () => {
        try {
            setIsGeneratingPDF(true);
            toast({ title: "Generating PDF...", description: "Please wait while we create your report" });
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPos = 20;
            
            // Helper function to add new page
            const addNewPage = () => {
                pdf.addPage();
                yPos = 20;
            };
            
            // Helper function to check if we need a new page
            const checkNewPage = (requiredSpace: number) => {
                if (yPos + requiredSpace > pageHeight - 20) {
                    addNewPage();
                }
            };
            
            // --- PAGE 1: Header & Project Info ---
            pdf.setFillColor(10, 15, 26);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Title
            pdf.setTextColor(34, 211, 238); // cyan-400
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PROJECT SUMMARY REPORT', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;
            pdf.setTextColor(148, 163, 184); // slate-400
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(projectData.name, pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 20;
            
            // Section 1: Project Details
            pdf.setFillColor(30, 41, 59); // bg-[#1e293b]
            pdf.roundedRect(15, yPos, pageWidth - 30, 55, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(34, 211, 238);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('📍 PROJECT DETAILS & LOCATION', 20, yPos);
            
            yPos += 10;
            pdf.setTextColor(226, 232, 240); // slate-200
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Project Name: ${projectData.name}`, 20, yPos);
            yPos += 6;
            pdf.text(`Application: ${projectData.application}`, 20, yPos);
            yPos += 6;
            pdf.text(`Energy Source: ${projectData.chargingSource}`, 20, yPos);
            yPos += 6;
            pdf.text(`Location: ${projectData.locationName}`, 20, yPos);
            yPos += 6;
            pdf.text(`Coordinates: ${projectData.coordinates.lat.toFixed(4)}°, ${projectData.coordinates.lng.toFixed(4)}°`, 20, yPos);
            
            yPos += 20;
            
            // Section 2: Energy Consumption
            checkNewPage(50);
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(250, 204, 21); // yellow-400
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('⚡ ENERGY CONSUMPTION SUMMARY', 20, yPos);
            
            yPos += 10;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const safeDailyLoad = avgDailyLoad || 0;
            const safeMonthlyLoad = monthlyLoad || 0;
            const safeAnnualLoadPDF = annualLoad || 0;
            pdf.text(`Daily Average Load: ${safeDailyLoad.toFixed(2)} kWh/day`, 20, yPos);
            yPos += 6;
            pdf.text(`Monthly Average Load: ${safeMonthlyLoad.toFixed(2)} kWh/month`, 20, yPos);
            yPos += 6;
            pdf.text(`Annual Load: ${safeAnnualLoadPDF.toFixed(2)} kWh/year`, 20, yPos);
            
            yPos += 20;
            
            // Section 3: System Components
            checkNewPage(80);
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 75, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(74, 222, 128); // green-400
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('🔋 SYSTEM COMPONENTS', 20, yPos);
            
            yPos += 12;
            pdf.setTextColor(103, 232, 249); // cyan-300
            pdf.setFontSize(11);
            pdf.text('Solar PV Modules:', 20, yPos);
            yPos += 6;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            pdf.text(`  Make & Model: High-Efficiency Monocrystalline`, 20, yPos);
            yPos += 5;
            const safeModulePower = modulePower || 0;
            const safeTotalModules = totalModules || 0;
            pdf.text(`  Power/Module: ${safeModulePower}W  |  Quantity: ${safeTotalModules}  |  Total: ${(safeModulePower * safeTotalModules / 1000).toFixed(2)} kWp`, 20, yPos);
            
            yPos += 10;
            pdf.setTextColor(147, 197, 253); // blue-300
            pdf.setFontSize(11);
            pdf.text('Inverter System:', 20, yPos);
            yPos += 6;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            pdf.text(`  Make & Model: ${inverterModel}`, 20, yPos);
            yPos += 5;
            const safeInverterRatedPower = inverterRatedPower || 0;
            pdf.text(`  Type: ${batterySelection.couplingType || 'N/A'}  |  Quantity: ${batterySelection.inverterQuantity || 0}  |  Rated Power: ${safeInverterRatedPower.toFixed(2)} kW each`, 20, yPos);
            
            yPos += 10;
            pdf.setTextColor(216, 180, 254); // purple-300
            pdf.setFontSize(11);
            pdf.text('Battery Storage:', 20, yPos);
            yPos += 6;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            pdf.text(`  Make & Model: ${selectedBattery?.name || 'Not Selected'}`, 20, yPos);
            yPos += 5;
            const safeTotalCapacity = sizingResults?.totalCapacity || 0;
            pdf.text(`  Technology: ${batterySelection.technology || 'N/A'}  |  Quantity: ${batterySelection.quantity || 0}  |  Total: ${safeTotalCapacity.toFixed(2)} kWh`, 20, yPos);
            
            yPos += 20;
            
            // Section 4: System Capacities
            checkNewPage(50);
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(129, 140, 248); // indigo-400
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('⚙️ SYSTEM CAPACITIES', 20, yPos);
            
            yPos += 10;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const safePVCapacity = ((safeModulePower * safeTotalModules / 1000) || 0);
            const safeBatteryCapacity = sizingResults?.totalCapacity || 0;
            const safeInverterACCapacity = inverterACCapacity || 0;
            const safeBatteryPower = sizingResults?.totalPower || 0;
            pdf.text(`Solar PV Capacity: ${safePVCapacity.toFixed(2)} kWp DC`, 20, yPos);
            yPos += 6;
            pdf.text(`Battery Storage: ${safeBatteryCapacity.toFixed(2)} kWh Total`, 20, yPos);
            yPos += 6;
            pdf.text(`Inverter Power: ${safeInverterACCapacity.toFixed(2)} kW AC`, 20, yPos);
            yPos += 6;
            pdf.text(`Battery Power: ${safeBatteryPower.toFixed(2)} kW Peak`, 20, yPos);
            
            yPos += 20;
            
            // Section 5 & 6: Cable Sizing
            checkNewPage(90);
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 85, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(251, 146, 60); // orange-400
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('🔌 CABLE SIZING', 20, yPos);
            
            yPos += 12;
            pdf.setTextColor(251, 191, 36); // amber-400
            pdf.setFontSize(11);
            pdf.text('DC Cables:', 20, yPos);
            yPos += 7;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            
            if (cableParams?.dcPv?.material && cableParams?.dcPv?.crossSection) {
                const dcPvLength = cableParams.dcPv.length || 0;
                const dcPvVoltageDrop = cableParams.dcPv.voltageDrop || 0;
                pdf.text(`  PV to Inverter: ${cableParams.dcPv.material}, ${cableParams.dcPv.crossSection} mm², ${cableParams.dcPv.runs || 0} runs, ${dcPvLength.toFixed(2)}m`, 20, yPos);
                yPos += 5;
                pdf.text(`    Voltage Drop: ${dcPvVoltageDrop.toFixed(2)}%`, 20, yPos);
            } else {
                pdf.text('  PV to Inverter: Not configured', 20, yPos);
            }
            
            yPos += 7;
            if (cableParams?.dcBattery?.material && cableParams?.dcBattery?.crossSection) {
                const dcBatteryLength = cableParams.dcBattery.length || 0;
                const dcBatteryVoltageDrop = cableParams.dcBattery.voltageDrop || 0;
                pdf.text(`  Battery to Inverter: ${cableParams.dcBattery.material}, ${cableParams.dcBattery.crossSection} mm², ${cableParams.dcBattery.runs || 0} runs, ${dcBatteryLength.toFixed(2)}m`, 20, yPos);
                yPos += 5;
                pdf.text(`    Voltage Drop: ${dcBatteryVoltageDrop.toFixed(2)}%`, 20, yPos);
            } else {
                pdf.text('  Battery to Inverter: Not configured', 20, yPos);
            }
            
            yPos += 10;
            pdf.setTextColor(74, 222, 128); // green-400
            pdf.setFontSize(11);
            pdf.text('AC Cables:', 20, yPos);
            yPos += 7;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            
            if ((cableParams?.acHybrid?.material || cableParams?.acPv?.material) && 
                (cableParams?.acHybrid?.crossSection || cableParams?.acPv?.crossSection)) {
                const acCable = cableParams.acHybrid || cableParams.acPv;
                const acLength = acCable.length || 0;
                const acVoltageDrop = acCable.voltageDrop || 0;
                pdf.text(`  Inverter to Load/Grid: ${acCable.material}, ${acCable.crossSection} mm², ${acCable.runs || 0} runs, ${acLength.toFixed(2)}m`, 20, yPos);
                yPos += 5;
                pdf.text(`    Voltage Drop: ${acVoltageDrop.toFixed(2)}%`, 20, yPos);
            } else {
                pdf.text('  Inverter to Load/Grid: Not configured', 20, yPos);
            }
            
            yPos += 20;
            
            // Section 7: Energy Summary
            checkNewPage(60);
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, pageWidth - 30, 55, 3, 3, 'F');
            
            yPos += 8;
            pdf.setTextColor(34, 211, 238); // cyan-400
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('⚡ ENERGY PRODUCTION & STORAGE', 20, yPos);
            
            yPos += 12;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(10);
            pdf.text('Annual Values:', 20, yPos);
            yPos += 7;
            pdf.setFontSize(9);
            const safeAnnualPV = annualPVProductionKWh || 0;
            const safeAnnualLoad = annualLoad || 0;
            pdf.text(`  Solar PV Production: ${safeAnnualPV.toFixed(2)} kWh/year`, 20, yPos);
            yPos += 5;
            pdf.text(`  Annual Consumption: ${safeAnnualLoad.toFixed(2)} kWh/year`, 20, yPos);
            
            yPos += 10;
            pdf.setFontSize(10);
            pdf.text('Daily Averages:', 20, yPos);
            yPos += 7;
            pdf.setFontSize(9);
            pdf.text(`  Solar PV Production: ${(safeAnnualPV / 365).toFixed(2)} kWh/day`, 20, yPos);
            yPos += 5;
            pdf.text(`  Battery Charge: ${(dailyBatteryCharge || 0).toFixed(2)} kWh/day`, 20, yPos);
            yPos += 5;
            pdf.text(`  Battery Discharge: ${(dailyBatteryDischarge || 0).toFixed(2)} kWh/day`, 20, yPos);
            
            // --- NEW PAGE: Financial Summary ---
            addNewPage();
            
            // Financial Summary Header
            pdf.setFillColor(10, 15, 26);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            
            pdf.setTextColor(34, 211, 238);
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('FINANCIAL SUMMARY', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;
            
            // Key Financial Metrics
            pdf.setFillColor(30, 41, 59);
            pdf.roundedRect(15, yPos, (pageWidth - 40) / 2, 60, 3, 3, 'F');
            pdf.roundedRect(25 + (pageWidth - 40) / 2, yPos, (pageWidth - 40) / 2, 60, 3, 3, 'F');
            
            // Left column - Key Metrics
            let leftY = yPos + 8;
            pdf.setTextColor(16, 185, 129); // emerald-400
            pdf.setFontSize(12);
            pdf.text('Key Financial Metrics', 20, leftY);
            
            leftY += 10;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            const safeNPV = financialResults?.npv || 0;
            const safeIRR = financialResults?.irr || 0;
            const safePayback = financialResults?.paybackPeriod || 0;
            const safeLCOE = financialResults?.lcoe || 0;
            pdf.text(`NPV: $${safeNPV.toLocaleString()}`, 20, leftY);
            leftY += 6;
            pdf.text(`IRR: ${safeIRR.toFixed(2)}%`, 20, leftY);
            leftY += 6;
            pdf.text(`Payback: ${safePayback.toFixed(1)} years`, 20, leftY);
            leftY += 6;
            pdf.text(`LCOE: $${safeLCOE.toFixed(4)}/kWh`, 20, leftY);
            
            // Right column - Financial Parameters
            let rightX = 25 + (pageWidth - 40) / 2;
            let rightY = yPos + 8;
            pdf.setTextColor(34, 211, 238);
            pdf.setFontSize(12);
            pdf.text('Financial Parameters', rightX + 5, rightY);
            
            rightY += 10;
            pdf.setTextColor(226, 232, 240);
            pdf.setFontSize(9);
            const safeTotalCost = financialResults?.costs?.totalProjectCost || 0;
            pdf.text(`Initial Investment: $${safeTotalCost.toLocaleString()}`, rightX + 5, rightY);
            rightY += 6;
            pdf.text(`Discount Rate: ${financialResults?.inputs?.discountRate || 8}%`, rightX + 5, rightY);
            rightY += 6;
            pdf.text(`PV Degradation: ${financialResults?.inputs?.pvDegradation || 0.5}%/year`, rightX + 5, rightY);
            rightY += 6;
            pdf.text(`O&M Cost: $${(financialResults?.inputs?.annualMaintenanceCost || 0).toLocaleString()}/year`, rightX + 5, rightY);
            
            yPos += 75;
            
            // 25-Year Cash Flow Table
            pdf.setTextColor(34, 211, 238);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('25-YEAR FINANCIAL PROJECTION', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 10;
            
            // Prepare table data
            const tableData = (financialResults?.detailedCashFlow || []).map((row: any) => [
                row.year || 0,
                (row.energyKWh || 0).toLocaleString(),
                `$${(row.revenue || 0).toLocaleString()}`,
                `$${(row.costs || 0).toLocaleString()}`,
                `$${(row.netCashFlow || 0).toLocaleString()}`,
                `$${(row.cumulativeCashFlow || 0).toLocaleString()}`
            ]);
            
            autoTable(pdf, {
                startY: yPos,
                head: [['Year', 'PV Production (kWh)', 'Revenue ($)', 'Costs ($)', 'Net Cash Flow ($)', 'Cumulative ($)']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [34, 211, 238],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    fillColor: [15, 23, 41],
                    textColor: [226, 232, 240],
                    fontSize: 7,
                    halign: 'right'
                },
                alternateRowStyles: {
                    fillColor: [20, 30, 50]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'right', cellWidth: 35 },
                    2: { halign: 'right', cellWidth: 25 },
                    3: { halign: 'right', cellWidth: 25 },
                    4: { halign: 'right', cellWidth: 30 },
                    5: { halign: 'right', cellWidth: 30 }
                },
                margin: { left: 15, right: 15 }
            });
            
            // Save PDF
            pdf.save(`${projectData.name}_Summary_Report.pdf`);
            
            toast({ 
                title: "PDF Generated Successfully!", 
                description: "Your report has been downloaded",
                variant: "default"
            });
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({ 
                title: "Error Generating PDF", 
                description: "Please try again",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-[#0a0f1a] min-h-screen">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 p-8 shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIyZDNlZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30">
                                <FileText className="h-8 w-8 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Project Summary Report
                                </h1>
                                <p className="text-cyan-200 text-sm mt-1">{projectData.name}</p>
                            </div>
                        </div>
                        <Button
                            onClick={generatePDF}
                            disabled={isGeneratingPDF}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-5 w-5" />
                                    Download Report (Beta)
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-slate-300 text-sm">
                        Comprehensive overview of your Solar PV + BESS system design, components, and financial analysis
                    </p>
                </div>
            </div>
            
            {/* Section 1: Project Details & Location */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                <CardHeader className="border-b border-cyan-500/20 pb-4">
                    <CardTitle className="text-xl text-cyan-400 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Project Details & Location
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Info */}
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Project Name</p>
                                <p className="text-xl font-bold text-cyan-300">{projectData.name}</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Application Type</p>
                                <p className="text-xl font-bold text-blue-300">{projectData.application}</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Energy Source</p>
                                <p className="text-xl font-bold text-purple-300">{isUtility ? 'Grid Arbitrage' : projectData.chargingSource}</p>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Location</p>
                                <p className="text-lg font-bold text-green-300">{projectData.locationName}</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Coordinates: {projectData.coordinates.lat.toFixed(4)}°, {projectData.coordinates.lng.toFixed(4)}°
                                </p>
                            </div>
                        </div>
                        
                        {/* Interactive Map */}
                        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden relative h-[300px]">
                            <MapContainer
                                center={[projectData.coordinates.lat, projectData.coordinates.lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[projectData.coordinates.lat, projectData.coordinates.lng]}>
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-bold text-cyan-600">{projectData.name}</p>
                                            <p className="text-xs text-slate-600 mt-1">{projectData.locationName}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {projectData.coordinates.lat.toFixed(4)}°, {projectData.coordinates.lng.toFixed(4)}°
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Section 2: Energy Consumption Summary */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                <CardHeader className="border-b border-yellow-500/20 pb-4">
                    <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Energy Consumption Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-xl border border-yellow-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-yellow-200/70 uppercase tracking-wider">Daily Average</p>
                                <Sun className="h-5 w-5 text-yellow-400" />
                            </div>
                            <p className="text-4xl font-bold text-yellow-300 mb-1">{avgDailyLoad.toFixed(2)}</p>
                            <p className="text-xs text-yellow-200/60">kWh / day</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-orange-600/10 to-red-600/10 rounded-xl border border-orange-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-orange-200/70 uppercase tracking-wider">Monthly Average</p>
                                <TrendingUp className="h-5 w-5 text-orange-400" />
                            </div>
                            <p className="text-4xl font-bold text-orange-300 mb-1">{monthlyLoad.toFixed(2)}</p>
                            <p className="text-xs text-orange-200/60">kWh / month</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-red-600/10 to-pink-600/10 rounded-xl border border-red-500/30">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-red-200/70 uppercase tracking-wider">Annual Total</p>
                                <BarChart2 className="h-5 w-5 text-red-400" />
                            </div>
                            <p className="text-4xl font-bold text-red-300 mb-1">{annualLoad.toFixed(2)}</p>
                            <p className="text-xs text-red-200/60">kWh / year</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Section 3: Components Used */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                <CardHeader className="border-b border-green-500/20 pb-4">
                    <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        System Components
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Solar Panels */}
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Sun className="h-6 w-6 text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-green-300">Solar PV Modules</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">Make & Model</p>
                                    <p className="text-base font-bold text-cyan-300">High-Efficiency Monocrystalline</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Power/Module</p>
                                        <p className="text-2xl font-bold text-yellow-300">{modulePower}W</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Quantity</p>
                                        <p className="text-2xl font-bold text-yellow-300">{totalModules}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <p className="text-xs text-slate-400">Total Capacity</p>
                                    <p className="text-xl font-bold text-green-300">{(modulePower * totalModules / 1000).toFixed(2)} kWp</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Inverter */}
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Zap className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-blue-300">Inverter System</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">Make & Model</p>
                                    <p className="text-base font-bold text-cyan-300">{inverterModel}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Type</p>
                                        <p className="text-sm font-bold text-blue-300">{batterySelection.couplingType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Quantity</p>
                                        <p className="text-2xl font-bold text-blue-300">{batterySelection.inverterQuantity || 0}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <p className="text-xs text-slate-400">Rated Power (Each)</p>
                                    <p className="text-xl font-bold text-blue-300">{inverterRatedPower.toFixed(2)} kW</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Battery */}
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <BatteryCharging className="h-6 w-6 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-purple-300">Battery Storage</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400">Make & Model</p>
                                    <p className="text-base font-bold text-cyan-300">{selectedBattery?.name || 'Not Selected'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Technology</p>
                                        <p className="text-sm font-bold text-purple-300">{batterySelection.technology}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Quantity</p>
                                        <p className="text-2xl font-bold text-purple-300">{sizingResults.numberOfBatteries}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <p className="text-xs text-slate-400">Total Capacity</p>
                                    <p className="text-xl font-bold text-purple-300">{sizingResults.totalCapacity.toFixed(2)} kWh</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Section 4: System Capacities */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                <CardHeader className="border-b border-indigo-500/20 pb-4">
                    <CardTitle className="text-xl text-indigo-400 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Capacities
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-5 bg-gradient-to-br from-yellow-600/10 via-orange-600/10 to-yellow-600/10 rounded-xl border border-yellow-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Sun className="h-5 w-5 text-yellow-400" />
                                <p className="text-xs text-yellow-200/70 uppercase tracking-wider">Solar PV</p>
                            </div>
                            <p className="text-3xl font-bold text-yellow-300">{(modulePower * totalModules / 1000).toFixed(2)}</p>
                            <p className="text-sm text-yellow-200/60 mt-1">kWp DC</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-purple-600/10 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <BatteryCharging className="h-5 w-5 text-purple-400" />
                                <p className="text-xs text-purple-200/70 uppercase tracking-wider">Battery Storage</p>
                            </div>
                            <p className="text-3xl font-bold text-purple-300">{sizingResults.totalCapacity.toFixed(2)}</p>
                            <p className="text-sm text-purple-200/60 mt-1">kWh Total</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-blue-600/10 via-cyan-600/10 to-blue-600/10 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="h-5 w-5 text-blue-400" />
                                <p className="text-xs text-blue-200/70 uppercase tracking-wider">Inverter Power</p>
                            </div>
                            <p className="text-3xl font-bold text-blue-300">{inverterACCapacity.toFixed(2)}</p>
                            <p className="text-sm text-blue-200/60 mt-1">kW AC</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-green-600/10 via-emerald-600/10 to-green-600/10 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Database className="h-5 w-5 text-green-400" />
                                <p className="text-xs text-green-200/70 uppercase tracking-wider">Battery Power</p>
                            </div>
                            <p className="text-3xl font-bold text-green-300">{sizingResults.totalPower.toFixed(2)}</p>
                            <p className="text-sm text-green-200/60 mt-1">kW Peak</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Section 5 & 6: Cable Sizing - DC & AC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DC Cable */}
                <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                    <CardHeader className="border-b border-orange-500/20 pb-4">
                        <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            DC Cable Sizing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {/* PV to Inverter */}
                        {cableParams?.dcPv && (
                            <div className="p-4 bg-orange-600/10 rounded-lg border border-orange-500/30">
                                <p className="text-sm font-semibold text-orange-300 mb-3">PV to Inverter</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Material</p>
                                        <p className="text-base font-bold text-orange-200">Copper</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Cross Section</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcPv.selectedCableSize} mm²</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Runs</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcPv.cableRuns}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Total Length</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcPv.cableLength} m</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Battery to Inverter */}
                        {cableParams?.dcBatt && (
                            <div className="p-4 bg-orange-600/10 rounded-lg border border-orange-500/30">
                                <p className="text-sm font-semibold text-orange-300 mb-3">Battery to Inverter</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Material</p>
                                        <p className="text-base font-bold text-orange-200">Copper</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Cross Section</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcBatt.selectedCableSize} mm²</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Runs</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcBatt.cableRuns}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Total Length</p>
                                        <p className="text-base font-bold text-orange-200">{cableParams.dcBatt.cableLength} m</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* AC Cable */}
                <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                    <CardHeader className="border-b border-green-500/20 pb-4">
                        <CardTitle className="text-lg text-green-400 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            AC Cable Sizing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {cableParams?.acHybrid && (
                            <div className="p-4 bg-green-600/10 rounded-lg border border-green-500/30">
                                <p className="text-sm font-semibold text-green-300 mb-3">Inverter to Load/Grid</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Material</p>
                                        <p className="text-base font-bold text-green-200">Copper</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Cross Section</p>
                                        <p className="text-base font-bold text-green-200">{cableParams.acHybrid.selectedCableSize} mm²</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Runs</p>
                                        <p className="text-base font-bold text-green-200">{cableParams.acHybrid.cableRuns}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Total Length</p>
                                        <p className="text-base font-bold text-green-200">{cableParams.acHybrid.cableLength} m</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {/* Section 7: Energy Summary */}
            <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                <CardHeader className="border-b border-cyan-500/20 pb-4">
                    <CardTitle className="text-xl text-cyan-400 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Energy Production & Storage Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Annual Values */}
                        <div className="p-5 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-xl border border-yellow-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Sun className="h-5 w-5 text-yellow-400" />
                                <p className="text-xs text-yellow-200/70 uppercase">Annual PV Production</p>
                            </div>
                            <p className="text-3xl font-bold text-yellow-300">{(annualPVProductionKWh || pvResults.dailyGeneration * 365).toFixed(2)}</p>
                            <p className="text-xs text-yellow-200/60 mt-1">kWh / year</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <BatteryCharging className="h-5 w-5 text-purple-400" />
                                <p className="text-xs text-purple-200/70 uppercase">Annual Battery Storage</p>
                            </div>
                            <p className="text-3xl font-bold text-purple-300">{(dailyBatteryCharge * 365).toFixed(2)}</p>
                            <p className="text-xs text-purple-200/60 mt-1">kWh / year</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Home className="h-5 w-5 text-blue-400" />
                                <p className="text-xs text-blue-200/70 uppercase">Annual Consumption</p>
                            </div>
                            <p className="text-3xl font-bold text-blue-300">{annualLoad.toFixed(2)}</p>
                            <p className="text-xs text-blue-200/60 mt-1">kWh / year</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl border border-green-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-green-400" />
                                <p className="text-xs text-green-200/70 uppercase">Self-Sufficiency</p>
                            </div>
                            <p className="text-3xl font-bold text-green-300">{((annualPVProductionKWh || pvResults.dailyGeneration * 365) / annualLoad * 100).toFixed(1)}%</p>
                            <p className="text-xs text-green-200/60 mt-1">Energy Independence</p>
                        </div>
                        {/* Daily Averages */}
                        <div className="p-5 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 rounded-xl border border-yellow-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sun className="h-4 w-4 text-yellow-400" />
                                <p className="text-xs text-yellow-200/60 uppercase">Daily Avg PV</p>
                            </div>
                            <p className="text-2xl font-bold text-yellow-300">{pvResults.dailyGeneration.toFixed(2)}</p>
                            <p className="text-xs text-yellow-200/50 mt-1">kWh / day</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-xl border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <BatteryCharging className="h-4 w-4 text-purple-400" />
                                <p className="text-xs text-purple-200/60 uppercase">Daily Avg Charge</p>
                            </div>
                            <p className="text-2xl font-bold text-purple-300">{dailyBatteryCharge.toFixed(2)}</p>
                            <p className="text-xs text-purple-200/50 mt-1">kWh / day</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-pink-600/5 to-purple-600/5 rounded-xl border border-pink-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <BatteryCharging className="h-4 w-4 text-pink-400" />
                                <p className="text-xs text-pink-200/60 uppercase">Daily Avg Discharge</p>
                            </div>
                            <p className="text-2xl font-bold text-pink-300">{dailyBatteryDischarge.toFixed(2)}</p>
                            <p className="text-xs text-pink-200/50 mt-1">kWh / day</p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 rounded-xl border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Home className="h-4 w-4 text-blue-400" />
                                <p className="text-xs text-blue-200/60 uppercase">Daily Avg Load</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-300">{avgDailyLoad.toFixed(2)}</p>
                            <p className="text-xs text-blue-200/50 mt-1">kWh / day</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Section 8: Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Metrics */}
                <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                    <CardHeader className="border-b border-emerald-500/20 pb-4">
                        <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Key Financial Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-lg border border-green-500/30">
                            <p className="text-xs text-green-200/70 uppercase mb-2">Net Present Value (NPV)</p>
                            <p className="text-3xl font-bold text-green-300">${financialResults.npv.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-lg border border-blue-500/30">
                                <p className="text-xs text-blue-200/70 uppercase mb-2">IRR</p>
                                <p className="text-2xl font-bold text-blue-300">{isFinite(financialResults.irr) ? `${financialResults.irr.toFixed(2)}%` : 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-500/30">
                                <p className="text-xs text-purple-200/70 uppercase mb-2">Payback</p>
                                <p className="text-2xl font-bold text-purple-300">{isFinite(financialResults.paybackPeriod) ? `${financialResults.paybackPeriod.toFixed(1)} yrs` : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 rounded-lg border border-yellow-500/30">
                            <p className="text-xs text-yellow-200/70 uppercase mb-2">LCOE</p>
                            <p className="text-2xl font-bold text-yellow-300">${financialResults.lcoe.toFixed(3)} / kWh</p>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Financial Inputs */}
                <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
                    <CardHeader className="border-b border-cyan-500/20 pb-4">
                        <CardTitle className="text-lg text-cyan-400 flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">Initial Investment</p>
                            <p className="text-lg font-bold text-cyan-300">${financialResults.costs.initialInvestment.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">Project Lifespan</p>
                            <p className="text-lg font-bold text-blue-300">{allData.financialParams.projectLifespan} years</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">Discount Rate</p>
                            <p className="text-lg font-bold text-purple-300">{allData.financialParams.discountRate}%</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">PV Degradation</p>
                            <p className="text-lg font-bold text-yellow-300">{allData.financialParams.pvDegradation}% / year</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">O&M Cost</p>
                            <p className="text-lg font-bold text-green-300">${allData.financialParams.annualMaintenanceCost} / year</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400">Electricity Rate</p>
                            <p className="text-lg font-bold text-orange-300">${allData.financialParams.electricityRate} / kWh</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- Default State Factory ---
  const createDefaultState = () => ({
    projectData: { name: 'New Project', locationName: 'Palo Alto, California', application: 'Residential', chargingSource: 'Solar PV Only', coordinates: { lat: 37.39, lng: -122.08 }, meteoDataSource: 'nsrdb', avgDailySolarIrradiation: 5.5 },
    loadData: DEFAULT_LOAD_PROFILES['Residential'],
    pvParams: { systemSize: 5, psh: 4.5, systemLosses: 15, mountingType: 'Ground-mount', modulesPerRow: 10, rowsPerTable: 2, totalTables: 2, moduleOrientation: 'Portrait' },
    dgParams: { capacity: 10, fuelConsumption: 0.3, fuelCost: 1.5 },
    batterySelection: { technology: 'Lithium-Ion', selectedBatteryId: 'RES-NMC-51.2V-280Ah', couplingType: '', selectedInverterId: '', inverterQuantity: 1, batteriesInSeries: 1, batteriesInParallel: 1 }, // Added coupling type, inverter, quantity, and string config
    sizingParams: { autonomy: 1 },
    financialParams: { 
        initialInvestment: 0, // Will be populated from Project Costing
        incentives: 0, 
        projectLifespan: 25, 
        bessLifespan: 15, 
        discountRate: 5, 
        pvDegradation: 0.5, 
        batteryDegradation: 2.5,
        annualMaintenanceCost: 1000,
        maintenanceEscalation: 5,
        maintenanceEscalationFrequency: 2, // Years
        electricityRate: 0.22, 
        electricityEscalation: 2, 
        electricityEscalationFrequency: 1, // Years
        arbitrageSpread: 0.05,
        taxRate: 20 // Default tax rate (20% for Residential, can be changed) 
    },
});

export default function BESSDesigner() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('project');
  const [authStatus, setAuthStatus] = useState('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // AI Credits Integration
  const { balance, checkAndDeduct, refreshBalance } = useAICredits();
  
  // --- Project & Data State ---
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState(createDefaultState().projectData);
  const [loadData, setLoadData] = useState(createDefaultState().loadData);
  const [pvParams, setPvParams] = useState(createDefaultState().pvParams);
  const [dgParams, setDgParams] = useState(createDefaultState().dgParams);
  const [batterySelection, setBatterySelection] = useState(createDefaultState().batterySelection);
  const [sizingParams, setSizingParams] = useState(createDefaultState().sizingParams);
  const [financialParams, setFinancialParams] = useState(createDefaultState().financialParams);

  // --- Cable Sizing Parameters (for BOQ) ---
  const [cableParams, setCableParams] = useState({
    dcPv: { selectedCableSize: 0, cableLength: 0, cableRuns: 0 },
    dcBatt: { selectedCableSize: 0, cableLength: 0, cableRuns: 0 },
    acHybrid: { selectedCableSize: 0, cableLength: 0, cableRuns: 0 },
    acPv: { selectedCableSize: 0, cableLength: 0, cableRuns: 0 },
    acBatt: { selectedCableSize: 0, cableLength: 0, cableRuns: 0 }
  });

  // --- AI BOQ State (persists across tab switches) ---
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedItems, setAiGeneratedItems] = useState<any[]>([]);

  // --- Project Costing State (persists across tab switches) ---
  const [pricingData, setPricingData] = useState<any>(null);
  const [editedPrices, setEditedPrices] = useState<{[key: string]: number}>({});
  const [calculatedTotalProjectCost, setCalculatedTotalProjectCost] = useState<number>(0);
  const [annualPVProductionKWh, setAnnualPVProductionKWh] = useState<number>(0);
  const [devCosts, setDevCosts] = useState({
    designEngineering: 1,
    statutoryApproval: 1,
    projectManagement: 2,
    installationCommissioning: 10,
    landAcquisition: 3,
    landDevelopment: 1,
    taxesDuties: 5,
    insurance: 1,
    internationalLogistics: 2,
    domesticLogistics: 1,
    financeManagement: 1,
    contingencies: 3
  });

  // --- UI State ---
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  // --- Inverter State for Cable Sizing ---
  const [selectedHybridInverter, setSelectedHybridInverter] = useState<any>(null);
  const [selectedBatteryInverter, setSelectedBatteryInverter] = useState<any>(null);
  const [selectedPvInverter, setSelectedPvInverter] = useState<any>(null);

  // ✅ Calculate energy split at top level for all components
  const energySplit = useMemo(() => {
    const hourlyData = loadData.weekday || [];
    const split = separateDayNightEnergy(hourlyData);
    console.log('🔍 Main: Energy Split Calculated', { 
      daytimeEnergy: split.daytimeEnergy, 
      nighttimeEnergy: split.nighttimeEnergy,
      totalEnergy: split.totalEnergy,
      hasData: hourlyData.length > 0
    });
    return split;
  }, [loadData]);

  // --- Load selected inverters for cable sizing ---
  useEffect(() => {
    const loadInverters = async () => {
      try {
        // Load Hybrid Inverter (DC Coupled)
        if (batterySelection.couplingType === 'DC' && batterySelection.selectedInverterId) {
          const data = await getHybridInverters({});
          const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
          setSelectedHybridInverter(inv || null);
        }
        
        // Load Battery Inverter (AC Coupled)
        if (batterySelection.couplingType === 'AC' && batterySelection.selectedInverterId) {
          const data = await getBatteryInverters({});
          const inv = data.find((i: any) => i.id === batterySelection.selectedInverterId);
          setSelectedBatteryInverter(inv || null);
        }
      } catch (error) {
        console.error('Error loading inverters for cable sizing:', error);
      }
    };
    loadInverters();
  }, [batterySelection.couplingType, batterySelection.selectedInverterId]);

  // Load PV Inverter for AC coupled system
  useEffect(() => {
    const loadPvInverter = async () => {
      if (pvParams.selectedInverterId) {
        try {
          const { data, error } = await supabase
            .from('solar_inverters')
            .select('*')
            .eq('id', pvParams.selectedInverterId)
            .single();
          
          if (!error && data) {
            setSelectedPvInverter(data);
          }
        } catch (error) {
          console.error('Error loading PV inverter for cable sizing:', error);
        }
      }
    };
    loadPvInverter();
  }, [pvParams.selectedInverterId]);

  // --- Load Leaflet CSS ---
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // --- Auth & Data Loading ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setAuthStatus('signed-in');
        loadProjects(user.id);
      } else {
        setAuthStatus('error');
      }
    };
    checkAuth();
  }, []);

  const loadProjects = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('bess_projects')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0 && !currentProjectId) {
        handleLoadProject(data[0].id);
      } else if (data && data.length === 0 && !currentProjectId) {
        handleNewProject();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({ title: 'Error', description: 'Could not load projects.', variant: 'destructive' });
    }
  };

  // --- Project Management ---
  const handleSaveProject = async () => {
    if (!userId) {
      toast({ title: 'Error', description: 'Must be signed in to save.', variant: 'destructive' });
      return;
    }

    const fullProjectData = {
      user_id: userId,
      name: projectData.name,
      project_data: { projectData, loadData, pvParams, dgParams, batterySelection, sizingParams, financialParams }
    };

    try {
      if (currentProjectId) {
        const { error } = await supabase
          .from('bess_projects')
          .update(fullProjectData)
          .eq('id', currentProjectId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bess_projects')
          .insert([fullProjectData])
          .select()
          .single();
        
        if (error) throw error;
        if (data) setCurrentProjectId(data.id);
      }

      toast({ title: 'Success', description: `Project '${projectData.name}' saved!` });
      if (userId) loadProjects(userId);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({ title: 'Error', description: 'Failed to save project.', variant: 'destructive' });
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('bess_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data && data.project_data) {
        const def = createDefaultState();
        const pd = data.project_data;
        setProjectData(pd.projectData || def.projectData);
        setLoadData(pd.loadData || def.loadData);
        setPvParams(pd.pvParams || def.pvParams);
        setDgParams(pd.dgParams || def.dgParams);
        setBatterySelection(pd.batterySelection || def.batterySelection);
        setSizingParams(pd.sizingParams || def.sizingParams);
        setFinancialParams(pd.financialParams || def.financialParams);
        setCurrentProjectId(projectId);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({ title: 'Error', description: 'Failed to load project.', variant: 'destructive' });
    }
  };

  const handleNewProject = () => {
    const def = createDefaultState();
    setProjectData(def.projectData);
    setLoadData(def.loadData);
    setPvParams(def.pvParams);
    setDgParams(def.dgParams);
    setBatterySelection(def.batterySelection);
    setSizingParams(def.sizingParams);
    setFinancialParams(def.financialParams);
    setCurrentProjectId(null);
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!userId || !projectToDelete) return;

    try {
      const { error } = await supabase
        .from('bess_projects')
        .delete()
        .eq('id', projectToDelete);

      if (error) throw error;

      toast({ title: 'Success', description: 'Project deleted.' });
      handleNewProject();
      if (userId) loadProjects(userId);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'Error', description: 'Failed to delete project.', variant: 'destructive' });
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  // --- Core Calculation Logic ---
  const selectedBattery = useMemo(() => {
      return BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId) || BATTERY_CATALOG['Lithium-Ion'][0];
  }, [batterySelection]);

  const pvResults = useMemo(() => {
    // ✅ Calculate PV capacity from actual module selection and string configuration
    const stringsConfig = pvParams.stringsConfig || { modulesPerString: 20, strings: 2 };
    const selectedModulePower = pvParams.moduleMaxPower || 630; // Watts
    
    const modulesPerString = stringsConfig.modulesPerString || 20;
    const numberOfStrings = stringsConfig.strings || 2;
    const totalModules = modulesPerString * numberOfStrings;
    const systemCapacity = (selectedModulePower * totalModules) / 1000; // kWp
    
    const { systemSize, psh, systemLosses } = pvParams;
    const isUtility = projectData.application === 'Utility Scale';
    // Use calculated capacity if available, otherwise fall back to systemSize
    const effectiveSize = systemCapacity > 0 ? systemCapacity : (isUtility ? 0 : systemSize);
    const dailyGeneration = effectiveSize * psh * (1 - systemLosses / 100);
    const generationDistribution = [0,0,0,0,0,0.05,0.2,0.5,0.8,1,1.1,1.2,1.2,1.1,1,0.8,0.5,0.2,0.05,0,0,0,0,0];
    const totalDistribution = generationDistribution.reduce((a, b) => a + b, 0);
    const hourlyGeneration = totalDistribution > 0 ? generationDistribution.map(v => (v / totalDistribution) * dailyGeneration) : Array(24).fill(0);
    
    // ✅ Return complete module details for simulation
    return { 
      dailyGeneration, 
      hourlyGeneration,
      systemCapacity: effectiveSize,
      totalModules,
      modulePower: selectedModulePower,
      modulesPerString,
      strings: numberOfStrings
    };
  }, [pvParams, projectData.application]);

  const sizingResults = useMemo(() => {
    const avgLoadProfile = Array(24).fill(0).map((_, i) => ((loadData.weekday?.[i] || 0) * 5 + (loadData.weekend?.[i] || 0) * 2) / 7);
    const netLoadProfile = avgLoadProfile.map((load, hour) => load - pvResults.hourlyGeneration[hour]);
    let cumulativeEnergy = 0, minCumulative = 0, maxCumulative = 0;
    netLoadProfile.forEach(net => { cumulativeEnergy += net; if (cumulativeEnergy < minCumulative) minCumulative = cumulativeEnergy; if (cumulativeEnergy > maxCumulative) maxCumulative = cumulativeEnergy; });
    const requiredEnergy = maxCumulative - minCumulative;
    const usableCapacity = selectedBattery.capacity * (selectedBattery.dod / 100);
    const numberOfBatteries = usableCapacity > 0 ? Math.ceil((requiredEnergy * sizingParams.autonomy) / usableCapacity) : 0;
    const totalCapacity = numberOfBatteries * selectedBattery.capacity;
    const totalPower = numberOfBatteries * selectedBattery.power;
    const energyFlow = avgLoadProfile.map((load, i) => ({ name: `${i}:00`, 'Load': load, 'PV Generation': pvResults.hourlyGeneration[i], 'Net Load': netLoadProfile[i] }));
    return { numberOfBatteries, totalCapacity, totalPower, energyFlow };
  }, [loadData, pvResults, sizingParams, selectedBattery]);

  const financialResults = useMemo(() => {
    console.log('📊 ===== FINANCIAL RESULTS CALCULATION =====');
    console.log('📋 Financial Params:', financialParams);
    console.log('⚡ PV Results:', pvResults);
    console.log('🔋 Sizing Results:', sizingResults);
    console.log('🏠 Project Data:', projectData);
    
    const { numberOfBatteries } = sizingResults;
    const { systemSize } = pvParams;
    const { capacity: dgCapacity } = dgParams;
    const { 
      initialInvestment,
      incentives,
      projectLifespan,
      bessLifespan,
      discountRate,
      pvDegradation,
      batteryDegradation,
      annualMaintenanceCost,
      maintenanceEscalation,
      maintenanceEscalationFrequency,
      electricityRate,
      electricityEscalation,
      electricityEscalationFrequency,
      arbitrageSpread,
      taxRate
    } = financialParams;
    
    const isUtility = projectData.application === 'Utility Scale';
    const isCommercial = projectData.application === 'Commercial';
    const showDG = projectData.chargingSource === 'Solar PV + DG Hybrid';
    
    console.log('💰 Initial Investment from params:', initialInvestment);
    console.log('🎁 Incentives:', incentives);
    
    // Use initialInvestment from params (auto-populated from Project Costing)
    const netInitialInvestment = (initialInvestment || 0) - (incentives || 0);
    console.log('💵 Net Initial Investment:', netInitialInvestment);
    
    // Use energy metrics directly from Simulation Result
    console.log('\n⚡ ========== USING ENERGY METRICS FROM SIMULATION RESULT ==========');
    console.log('📊 Received Annual PV Production:', annualPVProductionKWh, 'kWh/year');
    
    const totalAnnualPV_year1 = annualPVProductionKWh || 0;
    console.log('⚡ Total Annual PV (Year 1) - WILL USE THIS VALUE:', totalAnnualPV_year1.toFixed(2), 'kWh');
    console.log('⚡ In MWh/year:', (totalAnnualPV_year1 / 1000).toFixed(2), 'MWh/year');
    
    if (totalAnnualPV_year1 === 0) {
      console.log('⚠️ WARNING: Annual PV Production is 0 - Please visit Simulation Result tab first!');
    }
    
    console.log('\n📊 Sizing Results:', sizingResults);
    const avgDailyLoad = sizingResults?.energyFlow ? 
      sizingResults.energyFlow.reduce((s: number, v: any) => s + (v.Load || 0), 0) : 0;
    console.log('📊 Avg Daily Load:', avgDailyLoad, 'kWh');
    
    const totalAnnualLoad = avgDailyLoad * 365;
    console.log('📊 Total Annual Load:', totalAnnualLoad, 'kWh');
    console.log('======================================\n');
    
    // Battery capacity (kWh)
    const batteryCapacityKWh = selectedBattery?.capacity ? 
      numberOfBatteries * selectedBattery.capacity : 0;
    
    // Grid export tax rate (for C&I and Utility)
    const gridExportTaxRate = (isCommercial || isUtility) ? 0.15 : 0; // 15% tax on export
    
    let detailedCashFlow = [];
    let cumulativeCashFlow = -netInitialInvestment;
    let paybackPeriod = Infinity;
    let totalEnergyDelivered = 0;

    for (let year = 1; year <= projectLifespan; year++) {
      // PV degradation
      const pvDegradationFactor = Math.pow(1 - pvDegradation / 100, year - 1);
      
      // Battery degradation
      const batteryDegradationFactor = Math.pow(1 - batteryDegradation / 100, year - 1);
      
      // Current year PV generation
      const currentAnnualPV = totalAnnualPV_year1 * pvDegradationFactor;
      
      // Current year battery capacity
      const currentBatteryCapacity = batteryCapacityKWh * batteryDegradationFactor;
      
      // Electricity tariff (with escalation frequency)
      const tariffEscalations = Math.floor((year - 1) / electricityEscalationFrequency);
      const currentElectricityRate = electricityRate * 
        Math.pow(1 + electricityEscalation / 100, tariffEscalations);
      
      // Calculate energy flows
      let energyFromPV = Math.min(totalAnnualLoad, currentAnnualPV);
      let energyFromBattery = 0;
      let energyToGrid = 0;
      let energyFromGrid = 0;
      
      if (currentAnnualPV > totalAnnualLoad) {
        // Excess PV - charge battery and export
        const excess = currentAnnualPV - totalAnnualLoad;
        energyToGrid = excess; // All excess goes to grid (simplified model)
        energyFromBattery = 0; // Battery not needed when PV exceeds load
      } else {
        // PV deficit - use battery or grid
        const deficit = totalAnnualLoad - currentAnnualPV;
        energyFromBattery = Math.min(deficit, currentBatteryCapacity);
        energyFromGrid = Math.max(0, deficit - currentBatteryCapacity);
      }
      
      // Revenue calculations
      let annualRevenue = 0;
      let gridExportRevenue = 0;
      let gridExportTax = 0;
      
      if (isUtility) {
        // Utility scale: Arbitrage revenue
        const dailyArbitrageEnergy = currentBatteryCapacity / 365;
        const annualArbitrageEnergy = dailyArbitrageEnergy * 365;
        annualRevenue = annualArbitrageEnergy * (arbitrageSpread || 0.05);
      } else {
        // Residential/Commercial: Savings from self-consumption
        const energyConsumed = energyFromPV + energyFromBattery;
        annualRevenue = energyConsumed * currentElectricityRate;
        
        // Grid export revenue (if applicable)
        if (energyToGrid > 0) {
          const exportRate = currentElectricityRate * 0.75; // Feed-in tariff (75% of retail)
          gridExportRevenue = energyToGrid * exportRate;
          gridExportTax = gridExportRevenue * gridExportTaxRate;
          annualRevenue += (gridExportRevenue - gridExportTax);
        }
      }
      
      // Cost calculations
      let annualCosts = 0;
      
      // O&M costs (with escalation frequency)
      const omEscalations = Math.floor((year - 1) / maintenanceEscalationFrequency);
      const currentOMCost = annualMaintenanceCost * 
        Math.pow(1 + maintenanceEscalation / 100, omEscalations);
      annualCosts += currentOMCost;
      
      // Grid energy costs
      if (energyFromGrid > 0) {
        annualCosts += energyFromGrid * currentElectricityRate;
      }
      
      // DG costs (if applicable)
      if (showDG) {
        const dgEnergy = Math.max(0, totalAnnualLoad - currentAnnualPV - currentBatteryCapacity);
        annualCosts += dgEnergy * (dgParams.fuelConsumption || 0.3) * (dgParams.fuelCost || 1.5);
      }
      
      // Battery replacement cost (every bessLifespan years)
      let batteryReplacementCost = 0;
      if (year % (bessLifespan || 15) === 0 && year < projectLifespan) {
        // Assume battery replacement is 70% of original battery cost
        const batteryCostFromInvestment = netInitialInvestment * 0.4; // Assume 40% is battery
        batteryReplacementCost = batteryCostFromInvestment * 0.7;
        annualCosts += batteryReplacementCost;
      }
      
      // Net profit/cash flow
      const grossProfit = annualRevenue - annualCosts;
      // Use tax rate from input parameters
      const tax = Math.max(0, grossProfit * (taxRate / 100));
      const netProfit = grossProfit - tax;
      
      // Discounted cash flow
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      const discountedCashFlow = netProfit / discountFactor;
      
      // Cumulative cash flow
      cumulativeCashFlow += netProfit;
      
      // Track payback period
      if (cumulativeCashFlow >= 0 && paybackPeriod === Infinity) {
        const prevCumulative = cumulativeCashFlow - netProfit;
        paybackPeriod = year - 1 + Math.abs(prevCumulative) / netProfit;
      }
      
      // Total energy delivered
      totalEnergyDelivered += (energyFromPV + energyFromBattery);
      
      // Store detailed cash flow data
      detailedCashFlow.push({
        year,
        energyKWh: Math.round(currentAnnualPV), // Show total PV production, not just load consumption
        tariff: currentElectricityRate,
        revenue: annualRevenue,
        omCost: currentOMCost,
        gridCost: energyFromGrid * currentElectricityRate,
        batteryReplacement: batteryReplacementCost,
        grossProfit: grossProfit,
        tax: tax,
        netProfit: netProfit,
        discountedCashFlow: discountedCashFlow,
        cumulative: cumulativeCashFlow,
        "Net Cash Flow": netProfit // For chart
      });
      
      // Log first year data
      if (year === 1) {
        console.log('\n📅 ========== YEAR 1 ENERGY FLOW ==========');
        console.log('☀️ Total PV Production:', currentAnnualPV.toFixed(2), 'kWh/year');
        console.log('🏠 Total Annual Load:', totalAnnualLoad.toFixed(2), 'kWh/year');
        console.log('✅ PV Used for Load:', energyFromPV.toFixed(2), 'kWh');
        console.log('🔋 Battery to Load:', energyFromBattery.toFixed(2), 'kWh');
        console.log('📤 Exported to Grid:', energyToGrid.toFixed(2), 'kWh');
        console.log('📥 Imported from Grid:', energyFromGrid.toFixed(2), 'kWh');
        console.log('⚡ Total Energy for Load:', (energyFromPV + energyFromBattery + energyFromGrid).toFixed(2), 'kWh');
        console.log('\n📊 Table Display:');
        console.log('  Energy Column (in 25-Year Table):', Math.round(currentAnnualPV), 'kWh ← Shows Total PV Production');
        console.log('\n💰 Financial Data:');
        console.log('  Tariff Rate:', currentElectricityRate.toFixed(4), '$/kWh');
        console.log('  Revenue/Savings:', annualRevenue.toFixed(2), '$');
        console.log('  O&M Cost:', currentOMCost.toFixed(2), '$');
        console.log('  Gross Profit:', grossProfit.toFixed(2), '$');
        console.log('  Tax:', tax.toFixed(2), '$');
        console.log('  Net Profit:', netProfit.toFixed(2), '$');
        console.log('==========================================\n');
      }
    }

    // Calculate NPV
    const npv = detailedCashFlow.reduce((acc, flow) => acc + flow.discountedCashFlow, 0);
    
    // Calculate IRR using Newton-Raphson method
    let irr = 0.1;
    for (let i = 0; i < 50; i++) {
      let npvAtIrr = -netInitialInvestment;
      let derivative = 0;
      
      for (let year = 1; year <= detailedCashFlow.length; year++) {
        const cashFlow = detailedCashFlow[year - 1].netProfit;
        npvAtIrr += cashFlow / Math.pow(1 + irr, year);
        derivative -= year * cashFlow / Math.pow(1 + irr, year + 1);
      }
      
      if (Math.abs(npvAtIrr) < 1) break;
      if (Math.abs(derivative) < 0.0001) break;
      
      irr = irr - npvAtIrr / derivative;
      
      // Prevent infinite loops with unrealistic IRR
      if (irr < -0.99 || irr > 10) {
        irr = NaN;
        break;
      }
    }
    const finalIrr = isFinite(irr) && !isNaN(irr) ? irr * 100 : NaN;
    
    // Calculate LCOE
    const totalLifetimeEnergy = detailedCashFlow.reduce((acc, flow) => acc + flow.energyKWh, 0);
    const totalDiscountedCosts = detailedCashFlow.reduce((acc, flow) => 
      acc + (flow.omCost + flow.gridCost + flow.batteryReplacement) / 
      Math.pow(1 + discountRate / 100, flow.year), netInitialInvestment);
    const lcoe = totalLifetimeEnergy > 0 ? totalDiscountedCosts / totalLifetimeEnergy : Infinity;
    
    // Cost breakdown for pie chart
    const totalBatteryCost = netInitialInvestment * 0.40;
    const totalPVCost = netInitialInvestment * 0.45;
    const totalOtherCosts = netInitialInvestment * 0.15;

    console.log('📊 ===== FINAL FINANCIAL METRICS =====');
    console.log('💰 NPV:', npv);
    console.log('📈 IRR:', finalIrr, '%');
    console.log('⏱️ Payback Period:', paybackPeriod, 'years');
    console.log('💡 LCOE:', lcoe, '$/kWh');
    console.log('📊 Cost Breakdown:');
    console.log('  Battery Cost:', totalBatteryCost);
    console.log('  PV Cost:', totalPVCost);
    console.log('  Other Costs:', totalOtherCosts);
    console.log('  Initial Investment:', netInitialInvestment);
    console.log('📋 Cashflow Array Length:', detailedCashFlow.length, 'years');

    return { 
      costs: { 
        batteryCost: totalBatteryCost, 
        pvCost: totalPVCost, 
        dgCost: 0, 
        otherCosts: totalOtherCosts, 
        initialInvestment: netInitialInvestment 
      }, 
      npv, 
      irr: finalIrr, 
      paybackPeriod: isFinite(paybackPeriod) ? paybackPeriod : NaN, 
      lcoe, 
      cashFlow: detailedCashFlow 
    };
  }, [sizingResults, pvResults, financialParams, projectData, loadData, selectedBattery, dgParams, pvParams]);

  const handleResetCurrentTab = () => {
    // Reset data for current tab
    const defaultState = createDefaultState();
    switch (activePage) {
      case 'project':
        setProjectData(defaultState.projectData);
        break;
      case 'load':
        setLoadData(defaultState.loadData);
        break;
      case 'pv':
        setPvParams(defaultState.pvParams);
        break;
      case 'battery':
        setBatterySelection(defaultState.batterySelection);
        break;
      case 'sizing':
        setSizingParams(defaultState.sizingParams);
        break;
      case 'financial':
        setFinancialParams(defaultState.financialParams);
        break;
      case 'dg':
        setDgParams(defaultState.dgParams);
        break;
    }
    toast({
      title: "Tab Reset",
      description: `Current tab has been reset to default values.`,
    });
  };

  const handleResetAll = () => {
    const defaultState = createDefaultState();
    setProjectData(defaultState.projectData);
    setLoadData(defaultState.loadData);
    setPvParams(defaultState.pvParams);
    setDgParams(defaultState.dgParams);
    setBatterySelection(defaultState.batterySelection);
    setSizingParams(defaultState.sizingParams);
    setFinancialParams(defaultState.financialParams);
    setAiGeneratedItems([]);
    setPricingData(null);
    setEditedPrices({});
    setCalculatedTotalProjectCost(0);
    setAnnualPVProductionKWh(0);
    setDevCosts({
      designEngineering: 1,
      statutoryApproval: 1,
      projectManagement: 2,
      installationCommissioning: 10,
      landAcquisition: 3,
      landDevelopment: 1,
      taxesDuties: 5,
      insurance: 1,
      internationalLogistics: 2,
      domesticLogistics: 1,
      financeManagement: 1,
      contingencies: 3
    });
    toast({
      title: "All Reset",
      description: "All tabs have been reset to default values.",
    });
  };

  const renderPage = () => {
    const allData = { projectData, loadData, pvParams, dgParams, batterySelection, sizingParams, financialParams, sizingResults, pvResults, financialResults, selectedBattery };
    switch (activePage) {
      case 'project': return <ProjectDetails 
        projectData={projectData} 
        setProjectData={setProjectData} 
        setLoadData={setLoadData} 
        setActivePage={setActivePage}
        projects={projects}
        currentProjectId={currentProjectId}
        handleLoadProject={handleLoadProject}
        handleNewProject={handleNewProject}
        handleSaveProject={handleSaveProject}
        handleDeleteClick={handleDeleteClick}
        authStatus={authStatus}
      />;
      case 'location': return <LocationPicker projectData={projectData} setProjectData={setProjectData} setActivePage={setActivePage} />;
      case 'load': return <LoadAnalysis loadData={loadData} setLoadData={setLoadData} applicationType={projectData.application} setSizingParams={setSizingParams} sizingParams={sizingParams} setActivePage={setActivePage} projectData={projectData} />;
      case 'design-assist': return <DesignAssist projectData={projectData} loadData={loadData} setPvParams={setPvParams} setSizingParams={setSizingParams} setActivePage={setActivePage} projectData={projectData} />;
      case 'pv': {
        // ✅ FIX: Calculate BESS capacity using ACTUAL DESIGNED capacity from BESS Config tab
        const selectedBatt = BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
        const hourlyData = loadData.weekday || [];
        
        // Use nighttime energy for BESS sizing (not total daily energy)
        const energySplit = separateDayNightEnergy(hourlyData);
        const { nighttimeEnergy } = energySplit;
        
        // Calculate suggested battery capacity using nighttime energy only
        const daysOfAut = sizingParams?.autonomy || 1;
        const depthOfDischarge = 0.80;
        const dischargingEff = 0.95;
        const batterySizing = calculateBatteryCapacity(nighttimeEnergy, dischargingEff, depthOfDischarge, daysOfAut);
        const suggestedBessCapacity = batterySizing.nameplateCapacity;
        
        // Use manual battery quantity if set, otherwise calculate
        const suggestedBatteryQuantity = selectedBatt ? Math.ceil(suggestedBessCapacity / selectedBatt.capacity) : 0;
        const numberOfBatt = batterySelection.manualBatteryQuantity !== undefined 
            ? batterySelection.manualBatteryQuantity 
            : suggestedBatteryQuantity;
        
        // This is the ACTUAL DESIGNED BESS capacity from BESS Config tab
        const totalBessCapacity = selectedBatt ? numberOfBatt * selectedBatt.capacity : 0;
        
        return <PVSizing 
          pvParams={pvParams} 
          setPvParams={setPvParams} 
          pvResults={pvResults} 
          couplingType={batterySelection.couplingType} 
          bessCapacity={totalBessCapacity} 
          avgDailySolarIrradiation={projectData.avgDailySolarIrradiation}
          batterySelection={batterySelection}
          daytimeEnergy={energySplit.daytimeEnergy}
          nighttimeEnergy={energySplit.nighttimeEnergy}
          setActivePage={setActivePage}
          projectData={projectData}
        />;
      }
      case 'cable': {
        // Get battery pack electrical specs
        const selectedBatt = BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
        let batteryPackVoltage = 0;
        let batteryPackCurrent = 0;
        
        if (selectedBatt) {
          const batterySpecs = extractBatterySpecs(selectedBatt.name);
          if (batterySpecs) {
            const batteriesInSeries = batterySelection.batteriesInSeries || 1;
            const batteriesInParallel = batterySelection.batteriesInParallel || 1;
            batteryPackVoltage = batterySpecs.voltage * batteriesInSeries;
            batteryPackCurrent = batterySpecs.ampereHour * batteriesInParallel;
          }
        }
        
        // Get PV system specs from PV configuration
        // Use typical values for now - these should ideally come from PV Sizing tab
        // For a 20-module string with 49.5V Voc per module and 13.5A Isc
        const stringsConfig = pvParams.stringsConfig || { modulesPerString: 20, strings: 2 };
        const pvVoltage = 49.5 * (stringsConfig.modulesPerString || 20); // Typical Voc * modules per string = ~990V
        const pvCurrent = 13.5; // Typical Isc for a solar module
        const pvStrings = stringsConfig.strings || 2;
        
        return (
          <div className="space-y-6">
            <Card className="border border-blue-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-2xl shadow-blue-500/30">
              <CardHeader className="pb-3 border-b border-blue-500/20">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-3">
                  <Zap className="h-7 w-7 text-blue-400" />
                  DC + AC Cable Sizing
                </CardTitle>
                <CardDescription className="text-blue-200/70 mt-2">
                  Design and size electrical cables for DC and AC connections based on system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CableSizing
                  couplingType={batterySelection.couplingType}
                  pvVoltage={pvVoltage}
                  pvCurrent={pvCurrent}
                  pvStrings={pvStrings}
                  batteryVoltage={batteryPackVoltage}
                  batteryCurrent={batteryPackCurrent}
                  hybridInverter={selectedHybridInverter}
                  batteryInverter={selectedBatteryInverter}
                  pvInverter={selectedPvInverter}
                  inverterQuantity={batterySelection.couplingType === 'DC' ? batterySelection.inverterQuantity : pvParams.inverterQuantity}
                  onCableParamsChange={setCableParams}
                />
              </CardContent>
            </Card>
          </div>
        );
      }
      case 'dg': return <DGConfig dgParams={dgParams} setDgParams={setDgParams} />;
      case 'battery': return <BatterySelection batterySelection={batterySelection} setBatterySelection={setBatterySelection} loadData={loadData} sizingParams={sizingParams} projectData={projectData} setActivePage={setActivePage} />;
      case 'sizing': {
        // Calculate totalBessCapacity for SimulationResult
        const selectedBatt = BATTERY_CATALOG[batterySelection.technology as keyof typeof BATTERY_CATALOG]?.find((b: any) => b.id === batterySelection.selectedBatteryId);
        const hourlyData = loadData.weekday || [];
        const energySplit = separateDayNightEnergy(hourlyData);
        const daysOfAut = sizingParams?.autonomy || 1;
        const depthOfDischarge = 0.80;
        const dischargingEff = 0.95;
        const batterySizing = calculateBatteryCapacity(energySplit.nighttimeEnergy, dischargingEff, depthOfDischarge, daysOfAut);
        const suggestedBessCapacity = batterySizing.nameplateCapacity;
        const suggestedBatteryQuantity = selectedBatt ? Math.ceil(suggestedBessCapacity / selectedBatt.capacity) : 0;
        const numberOfBatt = batterySelection.manualBatteryQuantity !== undefined 
            ? batterySelection.manualBatteryQuantity 
            : suggestedBatteryQuantity;
        const totalBessCapacity = selectedBatt ? numberOfBatt * selectedBatt.capacity : 0;
        
        return <SimulationResult 
          projectData={projectData} 
          batterySelection={batterySelection} 
          pvParams={pvParams} 
          loadData={loadData} 
          bessCapacity={totalBessCapacity} 
          pvResults={pvResults} 
          sizingResults={sizingResults} 
          setActivePage={setActivePage} 
          energySplit={energySplit}
          setAnnualPVProductionKWh={setAnnualPVProductionKWh}
        />;
      }
      case 'boq': {
        return <BOQTable 
          projectData={projectData}
          batterySelection={batterySelection}
          pvParams={pvParams}
          pvResults={pvResults}
          acHybridCableParams={cableParams.acHybrid}
          acPvCableParams={cableParams.acPv}
          acBattCableParams={cableParams.acBatt}
          dcPvCableParams={cableParams.dcPv}
          dcBattCableParams={cableParams.dcBatt}
          onUpdateCableParams={setCableParams}
          aiGenerating={aiGenerating}
          setAiGenerating={setAiGenerating}
          aiGeneratedItems={aiGeneratedItems}
          setAiGeneratedItems={setAiGeneratedItems}
          selectedHybridInverter={selectedHybridInverter}
          selectedPvInverter={selectedPvInverter}
          selectedBatteryInverter={selectedBatteryInverter}
          cableParams={cableParams}
        />;
      }
      case 'costing': {
        return <ProjectCosting
          projectData={projectData}
          batterySelection={batterySelection}
          pvParams={pvParams}
          pvResults={pvResults}
          selectedHybridInverter={selectedHybridInverter}
          selectedPvInverter={selectedPvInverter}
          selectedBatteryInverter={selectedBatteryInverter}
          cableParams={cableParams}
          aiGeneratedItems={aiGeneratedItems}
          pricingData={pricingData}
          setPricingData={setPricingData}
          editedPrices={editedPrices}
          setEditedPrices={setEditedPrices}
          devCosts={devCosts}
          setDevCosts={setDevCosts}
          setCalculatedTotalProjectCost={setCalculatedTotalProjectCost}
        />;
      }
      case 'financial': return <FinancialAnalysis 
        projectData={projectData} 
        financialParams={financialParams} 
        setFinancialParams={setFinancialParams} 
        financialResults={financialResults} 
        setActivePage={setActivePage}
        calculatedTotalProjectCost={calculatedTotalProjectCost}
        annualPVProductionKWh={annualPVProductionKWh}
        pricingData={pricingData}
        devCosts={devCosts}
        batterySelection={batterySelection}
        pvParams={pvParams}
        pvResults={pvResults}
        selectedHybridInverter={selectedHybridInverter}
        selectedPvInverter={selectedPvInverter}
        selectedBatteryInverter={selectedBatteryInverter}
      />;
      case 'summary': return <SummaryReport allData={allData} cableParams={cableParams} loadData={loadData} annualPVProductionKWh={annualPVProductionKWh} selectedHybridInverter={selectedHybridInverter} selectedBatteryInverter={selectedBatteryInverter} />;
      default: return <ProjectDetails projectData={projectData} setProjectData={setProjectData} setLoadData={setLoadData} setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a2332] font-sans text-gray-100">
      {/* Header Section */}
      <header className="bg-[#1e293b] border-b border-slate-700/50 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => navigate('/dashboard')}
            title="Return to Dashboard"
          >
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-500/30">
              <Sun className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-emerald-400">BAESS Labs</span> <span className="text-slate-400">|</span> <span className="text-white">BESS Designer</span>
              </h1>
            </div>
          </div>
          
          {/* Right Side - All Buttons in One Row */}
          <div className="flex items-center gap-3">
            {/* AI Credits */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg px-4 py-2 shadow-md">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-white font-semibold text-sm">AI CREDITS</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ∞
              </span>
            </div>
            
            {/* Enterprise Badge */}
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">Enterprise</span>
            </div>
            
            {/* Reset Current Tab Button */}
            <Button
              onClick={handleResetCurrentTab}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all hover:shadow-xl flex items-center gap-2 border border-orange-500/50"
            >
              <RotateCw className="h-4 w-4" />
              <span className="font-semibold">Reset Current Tab</span>
            </Button>
            
            {/* Reset All Button */}
            <Button
              onClick={handleResetAll}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all hover:shadow-xl flex items-center gap-2 border border-red-500/50"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="font-semibold">Reset All</span>
            </Button>
            
            {/* Return to Dashboard Button */}
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg shadow-lg transition-all hover:shadow-xl flex items-center gap-2 border border-blue-500/50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-semibold">Return to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          projectData={projectData}
          navigate={navigate}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">{renderPage()}</main>
      </div>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: ''})}/>
      <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete this project? This action cannot be undone.</p>
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDeleteProject}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

