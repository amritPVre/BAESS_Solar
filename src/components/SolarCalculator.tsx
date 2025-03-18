
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientDetails from "@/components/ClientDetails";
import CompanyDetails from "@/components/CompanyDetails";
import SolarPVDetails from "@/components/SolarPVDetails";
import FinancialDetails from "@/components/FinancialDetails";
import ResultsDisplay from "@/components/ResultsDisplay";
import EnvironmentalBenefits from "@/components/EnvironmentalBenefits";
import AnnualEnergyCheck from "@/components/AnnualEnergyCheck";
import AdvancedSolarInputs from "@/components/AdvancedSolarInputs";
import ElectricityDetails from "@/components/ElectricityDetails";
import FinancialMetricsDisplay from "@/components/FinancialMetricsDisplay";
import { 
  calculateLevelizedCostOfEnergy, 
  calculateAnnualRevenue, 
  calculateAnnualCost, 
  calculateNetPresentValue, 
  calculateInternalRateOfReturn, 
  calculatePaybackPeriod,
  calculateCO2Reduction,
  calculateYearlyProduction,
  calculateYearlyCashFlow,
  calculateCumulativeCashFlow
} from "@/utils/calculations";
import { 
  FinancialCalculator, 
  ElectricityData, 
  ProjectCost, 
  OMParams, 
  FinancialMetrics 
} from "@/utils/financialCalculator";
import { SolarCalculationResult } from "@/types/solarCalculations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSolarProjects } from "@/hooks/useSolarProjects";
import { SolarProject } from "@/types/solarProject";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { User, Calculator, Check, Home, DollarSign, FileBarChart, PanelRight } from "lucide-react";

interface SolarCalculatorProps {
  projectData?: SolarProject;
  onSaveProject?: (project: SolarProject) => Promise<void>;
}

const SolarCalculator: React.FC<SolarCalculatorProps> = ({ projectData, onSaveProject }) => {
  const { isAuthenticated } = useAuth();
  const { saveProject } = useSolarProjects();
  const navigate = useNavigate();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  
  // Client Details
  const [clientName, setClientName] = useState("John Doe");
  const [clientEmail, setClientEmail] = useState("john@example.com");
  const [clientPhone, setClientPhone] = useState("(123) 456-7890");
  const [clientAddress, setClientAddress] = useState("123 Solar Street");
  
  // Company Details
  const [companyName, setCompanyName] = useState("Solar Solutions Inc.");
  const [companyContact, setCompanyContact] = useState("Jane Smith");
  const [companyEmail, setCompanyEmail] = useState("contact@solarsolutions.com");
  const [companyPhone, setCompanyPhone] = useState("(987) 654-3210");
  
  // Energy Check
  const [knowsAnnualEnergy, setKnowsAnnualEnergy] = useState<boolean | null>(null);
  const [manualAnnualEnergy, setManualAnnualEnergy] = useState<number>(12000);
  
  // Solar PV Details (Basic)
  const [systemSize, setSystemSize] = useState(10);
  const [panelType, setPanelType] = useState("monocrystalline");
  const [panelEfficiency, setPanelEfficiency] = useState(20);
  const [inverterType, setInverterType] = useState("string");
  const [inverterEfficiency, setInverterEfficiency] = useState(97);
  const [roofType, setRoofType] = useState("asphalt");
  const [roofAngle, setRoofAngle] = useState(30);
  const [orientation, setOrientation] = useState("south");
  const [solarIrradiance, setSolarIrradiance] = useState(5);
  const [shadingFactor, setShadingFactor] = useState(5);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [timezone, setTimezone] = useState("America/New_York");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("New York");
  
  // Advanced Solar Calculation Results
  const [advancedCalculationResults, setAdvancedCalculationResults] = useState<SolarCalculationResult | null>(null);
  
  // Financial Details
  const [systemCost, setSystemCost] = useState(30000);
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [electricityEscalationRate, setElectricityEscalationRate] = useState(3);
  const [incentives, setIncentives] = useState(9000);
  const [financingOption, setFinancingOption] = useState("cash");
  const [loanTerm, setLoanTerm] = useState(15);
  const [interestRate, setInterestRate] = useState(4.5);
  const [maintenanceCost, setMaintenanceCost] = useState(200);
  const [maintenanceEscalationRate, setMaintenanceEscalationRate] = useState(2);
  const [degradationRate, setDegradationRate] = useState(0.5);
  const [discountRate, setDiscountRate] = useState(5);
  
  // Financial Calculation Objects
  const [financialCalculator] = useState(new FinancialCalculator());
  const [financialInputs, setFinancialInputs] = useState<{
    project_cost: ProjectCost | null;
    om_params: OMParams | null;
    electricity_data: ElectricityData | null;
  }>({
    project_cost: null,
    om_params: null,
    electricity_data: null
  });
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  
  // Legacy Financial Results
  const [lcoe, setLCOE] = useState(0);
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [annualCost, setAnnualCost] = useState(0);
  const [netPresentValue, setNetPresentValue] = useState(0);
  const [irr, setIRR] = useState(0);
  const [paybackPeriod, setPaybackPeriod] = useState({ years: 0, months: 0 });
  const [co2Reduction, setCO2Reduction] = useState(0);
  const [treesEquivalent, setTreesEquivalent] = useState(0);
  const [vehicleMilesOffset, setVehicleMilesOffset] = useState(0);
  const [yearlyProduction, setYearlyProduction] = useState<number[]>([]);
  const [yearlyCashFlow, setYearlyCashFlow] = useState<number[]>([]);
  const [cumulativeCashFlow, setCumulativeCashFlow] = useState<number[]>([]);
  
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("client");
  const [calculating, setCalculating] = useState(false);
  
  // Load project data if provided
  useEffect(() => {
    if (projectData) {
      setClientName(projectData.clientName);
      setClientEmail(projectData.clientEmail);
      setClientPhone(projectData.clientPhone);
      setClientAddress(projectData.clientAddress);
      
      setCompanyName(projectData.companyName);
      setCompanyContact(projectData.companyContact);
      setCompanyEmail(projectData.companyEmail);
      setCompanyPhone(projectData.companyPhone);
      
      setKnowsAnnualEnergy(projectData.knowsAnnualEnergy);
      setManualAnnualEnergy(projectData.manualAnnualEnergy);
      
      setSystemSize(projectData.systemSize);
      setPanelType(projectData.panelType);
      setPanelEfficiency(projectData.panelEfficiency);
      setInverterType(projectData.inverterType);
      setInverterEfficiency(projectData.inverterEfficiency);
      setRoofType(projectData.roofType);
      setRoofAngle(projectData.roofAngle);
      setOrientation(projectData.orientation);
      setSolarIrradiance(projectData.solarIrradiance);
      setShadingFactor(projectData.shadingFactor);
      setLocation(projectData.location);
      setTimezone(projectData.timezone);
      setCountry(projectData.country);
      setCity(projectData.city);
      
      setSystemCost(projectData.systemCost);
      setElectricityRate(projectData.electricityRate);
      setElectricityEscalationRate(projectData.electricityEscalationRate);
      setIncentives(projectData.incentives);
      setFinancingOption(projectData.financingOption);
      setLoanTerm(projectData.loanTerm);
      setInterestRate(projectData.interestRate);
      setMaintenanceCost(projectData.maintenanceCost);
      setMaintenanceEscalationRate(projectData.maintenanceEscalationRate);
      setDegradationRate(projectData.degradationRate);
      setDiscountRate(projectData.discountRate);
      
      setLCOE(projectData.lcoe);
      setAnnualRevenue(projectData.annualRevenue);
      setAnnualCost(projectData.annualCost);
      setNetPresentValue(projectData.netPresentValue);
      setIRR(projectData.irr);
      setPaybackPeriod(projectData.paybackPeriod);
      setCO2Reduction(projectData.co2Reduction);
      setTreesEquivalent(projectData.treesEquivalent);
      setVehicleMilesOffset(projectData.vehicleMilesOffset);
      setYearlyProduction(projectData.yearlyProduction);
      setYearlyCashFlow(projectData.yearlyCashFlow);
      setCumulativeCashFlow(projectData.cumulativeCashFlow);
      
      setShowResults(true);
      setProjectName(projectData.name);
    }
  }, [projectData]);
  
  // Handle advanced calculation completion
  const handleAdvancedCalculationComplete = (results: SolarCalculationResult) => {
    setAdvancedCalculationResults(results);
    
    // Update the system size to match the calculated capacity
    setSystemSize(results.system.calculated_capacity);
    
    // Set yearly production
    setYearlyProduction(results.yearlyProduction);
    
    // Move to next step
    setActiveTab("electricity");
    toast.success("Advanced energy calculations completed, now continue with electricity details");
  };
  
  // Handle electricity data save
  const handleElectricityDataSave = (electricityData: ElectricityData) => {
    // Save electricity data to financial inputs
    setFinancialInputs(prev => ({
      ...prev,
      electricity_data: electricityData
    }));
    
    // Update the electricity rate
    if (electricityData.tariff.type === "flat" && electricityData.tariff.rate) {
      setElectricityRate(electricityData.tariff.rate);
    }
    
    // Move to financial details tab
    setActiveTab("financial");
    toast.success("Electricity data saved, now complete the financial details");
  };
  
  // Set up financial calculations when entering financial tab
  useEffect(() => {
    if (activeTab === "financial") {
      // Initialize project cost
      const annualEnergy = knowsAnnualEnergy ? manualAnnualEnergy : 
        (advancedCalculationResults ? advancedCalculationResults.energy.metrics.total_yearly : 0);
      
      if (annualEnergy > 0) {
        // Calculate project cost using financial calculator
        const projectCost = financialCalculator.calculate_project_cost(systemSize);
        setFinancialInputs(prev => ({
          ...prev,
          project_cost: {
            ...projectCost,
            cost_local: systemCost,
            cost_per_kw_actual: systemCost / systemSize
          }
        }));
        
        // Calculate O&M parameters
        const omParams = financialCalculator.calculate_om_parameters(systemCost);
        
        // Update the maintenance cost to match
        setMaintenanceCost(omParams.yearly_om_cost);
        
        // Update financial inputs
        setFinancialInputs(prev => ({
          ...prev,
          om_params: {
            ...omParams,
            // Convert percent to decimal for escalation rates
            om_escalation: maintenanceEscalationRate / 100,
            tariff_escalation: electricityEscalationRate / 100
          }
        }));
      }
    }
  }, [activeTab, financialCalculator, systemSize, systemCost, knowsAnnualEnergy, manualAnnualEnergy, advancedCalculationResults, maintenanceEscalationRate, electricityEscalationRate]);
  
  const calculateResults = () => {
    setCalculating(true);
    
    setTimeout(() => {
      try {
        const { project_cost, om_params, electricity_data } = financialInputs;
        
        if (!project_cost || !om_params || !electricity_data) {
          toast.error("Missing required financial inputs");
          setCalculating(false);
          return;
        }
        
        // Get actual yearly generation
        const yearlyGeneration = knowsAnnualEnergy ? manualAnnualEnergy : 
          (advancedCalculationResults ? advancedCalculationResults.energy.metrics.total_yearly : 0);
        
        if (yearlyGeneration <= 0) {
          toast.error("Invalid energy generation amount");
          setCalculating(false);
          return;
        }
        
        // Calculate financial metrics
        const netProjectCost = systemCost - incentives;
        const metrics = financialCalculator.calculate_financial_metrics(
          electricity_data,
          netProjectCost,
          om_params,
          yearlyGeneration,
          degradationRate / 100
        );
        
        setFinancialMetrics(metrics);
        
        // Legacy calculations for backward compatibility
        const calculatedLCOE = calculateLevelizedCostOfEnergy(
          netProjectCost,
          yearlyGeneration,
          maintenanceCost,
          25
        );
        setLCOE(calculatedLCOE);
        
        const calculatedAnnualRevenue = calculateAnnualRevenue(
          yearlyGeneration,
          electricityRate
        );
        setAnnualRevenue(calculatedAnnualRevenue);
        
        const calculatedAnnualCost = calculateAnnualCost(
          maintenanceCost,
          financingOption === "loan" ? netProjectCost * (interestRate / 100) : 0
        );
        setAnnualCost(calculatedAnnualCost);
        
        const calculatedNPV = calculateNetPresentValue(
          netProjectCost,
          calculatedAnnualRevenue - calculatedAnnualCost,
          discountRate,
          25
        );
        setNetPresentValue(calculatedNPV);
        
        const calculatedIRR = calculateInternalRateOfReturn(
          netProjectCost,
          calculatedAnnualRevenue - calculatedAnnualCost,
          25
        );
        setIRR(calculatedIRR);
        
        const calculatedPaybackPeriod = calculatePaybackPeriod(
          netProjectCost,
          calculatedAnnualRevenue - calculatedAnnualCost
        );
        setPaybackPeriod(calculatedPaybackPeriod);
        
        // Save yearly cash flows
        setYearlyCashFlow(metrics.cash_flows);
        
        // Calculate cumulative cash flow
        const cumulativeCF = metrics.cash_flows.reduce(
          (acc: number[], val, idx) => {
            const prevTotal = idx > 0 ? acc[idx - 1] : 0;
            acc.push(prevTotal + val);
            return acc;
          }, 
          []
        );
        setCumulativeCashFlow(cumulativeCF);
        
        // Environmental benefits
        const calculatedCO2Reduction = calculateCO2Reduction(yearlyGeneration);
        setCO2Reduction(calculatedCO2Reduction);
        
        setTreesEquivalent(calculatedCO2Reduction / 22);
        
        setVehicleMilesOffset(calculatedCO2Reduction * 1000 / 404);
        
        setShowResults(true);
        setActiveTab("results");
        toast.success("Financial calculations completed successfully!");
      } catch (error) {
        console.error("Calculation error:", error);
        toast.error("Error performing calculations. Please check your inputs.");
      } finally {
        setCalculating(false);
      }
    }, 1500);
  };
  
  const handleSaveProject = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save your project");
      navigate("/auth");
      return;
    }
    
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    
    try {
      if (projectData && onSaveProject) {
        const updatedProject: SolarProject = {
          ...projectData,
          name: projectName,
          clientName,
          clientEmail,
          clientPhone,
          clientAddress,
          companyName,
          companyContact,
          companyEmail,
          companyPhone,
          knowsAnnualEnergy: !!knowsAnnualEnergy,
          manualAnnualEnergy,
          annualEnergy: knowsAnnualEnergy ? manualAnnualEnergy : 
            (advancedCalculationResults ? advancedCalculationResults.energy.metrics.total_yearly : 0),
          systemSize,
          panelType,
          panelEfficiency,
          inverterType,
          inverterEfficiency,
          roofType,
          roofAngle,
          orientation,
          solarIrradiance,
          shadingFactor,
          location,
          timezone,
          country,
          city,
          systemCost,
          electricityRate,
          electricityEscalationRate,
          incentives,
          financingOption,
          loanTerm,
          interestRate,
          maintenanceCost,
          maintenanceEscalationRate,
          degradationRate,
          discountRate,
          lcoe,
          annualRevenue,
          annualCost,
          netPresentValue,
          irr,
          paybackPeriod,
          co2Reduction,
          treesEquivalent,
          vehicleMilesOffset,
          yearlyProduction,
          yearlyCashFlow,
          cumulativeCashFlow,
        };
        
        await onSaveProject(updatedProject);
        toast.success("Project updated successfully!");
      } else {
        const newProject = {
          name: projectName,
          clientName,
          clientEmail,
          clientPhone,
          clientAddress,
          companyName,
          companyContact,
          companyEmail,
          companyPhone,
          knowsAnnualEnergy: !!knowsAnnualEnergy,
          manualAnnualEnergy,
          annualEnergy: knowsAnnualEnergy ? manualAnnualEnergy : 
            (advancedCalculationResults ? advancedCalculationResults.energy.metrics.total_yearly : 0),
          systemSize,
          panelType,
          panelEfficiency,
          inverterType,
          inverterEfficiency,
          roofType,
          roofAngle,
          orientation,
          solarIrradiance,
          shadingFactor,
          location,
          timezone,
          country,
          city,
          systemCost,
          electricityRate,
          electricityEscalationRate,
          incentives,
          financingOption,
          loanTerm,
          interestRate,
          maintenanceCost,
          maintenanceEscalationRate,
          degradationRate,
          discountRate,
          lcoe,
          annualRevenue,
          annualCost,
          netPresentValue,
          irr,
          paybackPeriod,
          co2Reduction,
          treesEquivalent,
          vehicleMilesOffset,
          yearlyProduction,
          yearlyCashFlow,
          cumulativeCashFlow,
        };
        
        const savedProject = await saveProject(newProject);
        toast.success("Project saved successfully!");
        navigate(`/project/${savedProject.id}`);
      }
      
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project");
    }
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Solar PV System Financial Calculator</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Analyze the financial impact of your solar investment with our comprehensive calculator
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8 w-full mx-auto overflow-auto">
          <TabsTrigger value="client" className="flex items-center">
            <Home className="h-4 w-4 mr-2 hidden sm:inline" />
            Client
          </TabsTrigger>
          <TabsTrigger value="energyCheck" className="flex items-center">
            <Check className="h-4 w-4 mr-2 hidden sm:inline" />
            Energy Check
          </TabsTrigger>
          <TabsTrigger value="advanced" disabled={knowsAnnualEnergy === null || knowsAnnualEnergy === true} className="flex items-center">
            <Calculator className="h-4 w-4 mr-2 hidden sm:inline" />
            Advanced Solar
          </TabsTrigger>
          <TabsTrigger value="electricity" disabled={knowsAnnualEnergy === null || (knowsAnnualEnergy === false && !advancedCalculationResults)} className="flex items-center">
            <PanelRight className="h-4 w-4 mr-2 hidden sm:inline" />
            Electricity
          </TabsTrigger>
          <TabsTrigger value="financial" disabled={knowsAnnualEnergy === null || (knowsAnnualEnergy === false && !financialInputs.electricity_data)} className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 hidden sm:inline" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!showResults} className="flex items-center">
            <FileBarChart className="h-4 w-4 mr-2 hidden sm:inline" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <div className="min-h-[600px]">
          <TabsContent value="client" className="space-y-8 mt-2">
            <ClientDetails
              clientName={clientName}
              setClientName={setClientName}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              clientAddress={clientAddress}
              setClientAddress={setClientAddress}
            />
            
            <CompanyDetails
              companyName={companyName}
              setCompanyName={setCompanyName}
              companyContact={companyContact}
              setCompanyContact={setCompanyContact}
              companyEmail={companyEmail}
              setCompanyEmail={setCompanyEmail}
              companyPhone={companyPhone}
              setCompanyPhone={setCompanyPhone}
            />
            
            <div className="flex justify-end mb-10">
              <Button 
                onClick={() => setActiveTab("energyCheck")}
                className="bg-solar hover:bg-solar-dark text-white"
              >
                Next: Energy Check
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="energyCheck" className="space-y-8 mt-2">
            <AnnualEnergyCheck
              knowsAnnualEnergy={knowsAnnualEnergy}
              setKnowsAnnualEnergy={setKnowsAnnualEnergy}
              manualAnnualEnergy={manualAnnualEnergy}
              setManualAnnualEnergy={setManualAnnualEnergy}
            />
            
            <div className="flex justify-between mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("client")}
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  if (knowsAnnualEnergy) {
                    setActiveTab("electricity");
                  } else {
                    setActiveTab("advanced");
                  }
                }}
                className="bg-solar hover:bg-solar-dark text-white"
                disabled={knowsAnnualEnergy === null}
              >
                {knowsAnnualEnergy ? "Next: Electricity Details" : "Next: Advanced Solar Details"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-8 mt-2">
            <AdvancedSolarInputs
              latitude={location.lat}
              longitude={location.lng}
              setLatitude={(lat) => setLocation(prev => ({ ...prev, lat }))}
              setLongitude={(lng) => setLocation(prev => ({ ...prev, lng }))}
              timezone={timezone}
              setTimezone={setTimezone}
              capacity={systemSize}
              setCapacity={setSystemSize}
              onCalculationComplete={handleAdvancedCalculationComplete}
              country={country}
              city={city}
            />
            
            <div className="flex justify-between mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("energyCheck")}
              >
                Back
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="electricity" className="space-y-8 mt-2">
            <ElectricityDetails
              currency={financialCalculator.current_settings.currency}
              currencySymbol={financialCalculator.current_settings.currency_symbol}
              defaultTariff={financialCalculator.current_settings.regional_data.default_tariff}
              onSave={handleElectricityDataSave}
              yearlyGeneration={
                knowsAnnualEnergy 
                  ? manualAnnualEnergy 
                  : (advancedCalculationResults ? advancedCalculationResults.energy.metrics.total_yearly : 0)
              }
            />
            
            <div className="flex justify-between mb-10">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (knowsAnnualEnergy) {
                    setActiveTab("energyCheck");
                  } else {
                    setActiveTab("advanced");
                  }
                }}
              >
                Back
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-8 mt-2">
            <FinancialDetails
              systemCost={systemCost}
              setSystemCost={setSystemCost}
              electricityRate={electricityRate}
              setElectricityRate={setElectricityRate}
              electricityEscalationRate={electricityEscalationRate}
              setElectricityEscalationRate={setElectricityEscalationRate}
              incentives={incentives}
              setIncentives={setIncentives}
              financingOption={financingOption}
              setFinancingOption={setFinancingOption}
              loanTerm={loanTerm}
              setLoanTerm={setLoanTerm}
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              maintenanceCost={maintenanceCost}
              setMaintenanceCost={setMaintenanceCost}
              maintenanceEscalationRate={maintenanceEscalationRate}
              setMaintenanceEscalationRate={setMaintenanceEscalationRate}
              degradationRate={degradationRate}
              setDegradationRate={setDegradationRate}
              discountRate={discountRate}
              setDiscountRate={setDiscountRate}
            />
            
            <div className="flex justify-between mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("electricity")}
              >
                Back
              </Button>
              <Button 
                onClick={calculateResults}
                className="bg-solar hover:bg-solar-dark text-white"
                disabled={calculating}
              >
                {calculating ? 'Calculating...' : 'Calculate Results'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="mt-2">
            {showResults && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Results Summary</h2>
                  
                  <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-solar hover:bg-solar-dark text-white">
                        {projectData ? "Update Project" : "Save Project"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{projectData ? "Update Project" : "Save Project"}</DialogTitle>
                        <DialogDescription>
                          {projectData 
                            ? "Update your solar PV project details."
                            : "Give your project a name to save it to your dashboard."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input 
                          id="projectName" 
                          value={projectName} 
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g., Residential Solar - John Smith"
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveProject}>
                          {projectData ? "Update Project" : "Save Project"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Display calculated results */}
                <div className="space-y-8">
                  {/* Legacy Results Display for now */}
                  <ResultsDisplay
                    lcoe={lcoe}
                    annualRevenue={annualRevenue}
                    annualCost={annualCost}
                    netPresentValue={netPresentValue}
                    irr={irr}
                    paybackPeriod={paybackPeriod}
                    yearlyProduction={yearlyProduction}
                    yearlyCashFlow={yearlyCashFlow}
                    cumulativeCashFlow={cumulativeCashFlow}
                    clientName={clientName}
                    clientEmail={clientEmail}
                    clientAddress={clientAddress}
                    companyName={companyName}
                    companyContact={companyContact}
                    systemSize={systemSize}
                    panelType={panelType}
                    co2Reduction={co2Reduction}
                    treesEquivalent={treesEquivalent}
                    vehicleMilesOffset={vehicleMilesOffset}
                    location={location}
                    timezone={timezone}
                    country={country}
                    city={city}
                  />

                  {/* New Financial Metrics Display */}
                  {financialMetrics && (
                    <FinancialMetricsDisplay 
                      financialMetrics={financialMetrics}
                      currencySymbol={financialCalculator.current_settings.currency_symbol}
                    />
                  )}

                  <EnvironmentalBenefits
                    co2Reduction={co2Reduction}
                    treesEquivalent={treesEquivalent}
                    vehicleMilesOffset={vehicleMilesOffset}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8 mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("financial")}
              >
                Back to Financial Details
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SolarCalculator;
