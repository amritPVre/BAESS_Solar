
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientDetails from "@/components/ClientDetails";
import CompanyDetails from "@/components/CompanyDetails";
import SolarPVDetails from "@/components/SolarPVDetails";
import FinancialDetails from "@/components/FinancialDetails";
import ResultsDisplay from "@/components/ResultsDisplay";
import EnvironmentalBenefits from "@/components/EnvironmentalBenefits";
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
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from 'framer-motion';

const SolarCalculator: React.FC = () => {
  // Client details
  const [clientName, setClientName] = useState("John Doe");
  const [clientEmail, setClientEmail] = useState("john@example.com");
  const [clientPhone, setClientPhone] = useState("(123) 456-7890");
  const [clientAddress, setClientAddress] = useState("123 Solar Street");
  
  // Company details
  const [companyName, setCompanyName] = useState("Solar Solutions Inc.");
  const [companyContact, setCompanyContact] = useState("Jane Smith");
  const [companyEmail, setCompanyEmail] = useState("contact@solarsolutions.com");
  const [companyPhone, setCompanyPhone] = useState("(987) 654-3210");
  
  // Solar PV System details
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
  
  // Financial details
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
  
  // Calculation results
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
  
  // Calculate performance ratio based on inputs
  const calculatePerformanceRatio = () => {
    // Base performance ratio
    let pr = 0.8;
    
    // Adjust for inverter efficiency
    pr *= (inverterEfficiency / 100);
    
    // Adjust for panel efficiency
    if (panelEfficiency > 22) {
      pr *= 1.05;
    } else if (panelEfficiency < 18) {
      pr *= 0.95;
    }
    
    // Adjust for orientation
    if (orientation === "south") {
      pr *= 1.05;
    } else if (orientation === "north") {
      pr *= 0.8;
    } else {
      pr *= 0.95;
    }
    
    // Adjust for shading
    pr *= (1 - (shadingFactor / 100));
    
    return pr;
  };
  
  const calculateResults = () => {
    setCalculating(true);
    
    // Simulate calculation delay for UX
    setTimeout(() => {
      try {
        // Calculate performance ratio
        const performanceRatio = calculatePerformanceRatio();
        
        // Calculate annual energy production (kWh)
        const annualProduction = systemSize * solarIrradiance * 365 * performanceRatio;
        
        // Calculate yearly production with degradation
        const production = calculateYearlyProduction(
          systemSize,
          solarIrradiance,
          performanceRatio,
          degradationRate
        );
        setYearlyProduction(production);
        
        // Calculate LCOE
        const calculatedLCOE = calculateLevelizedCostOfEnergy(
          systemCost - incentives,
          annualProduction,
          maintenanceCost,
          25
        );
        setLCOE(calculatedLCOE);
        
        // Calculate annual revenue
        const calculatedAnnualRevenue = calculateAnnualRevenue(
          annualProduction,
          electricityRate
        );
        setAnnualRevenue(calculatedAnnualRevenue);
        
        // Calculate annual cost
        const calculatedAnnualCost = calculateAnnualCost(
          maintenanceCost,
          financingOption === "loan" ? (systemCost - incentives) * (interestRate / 100) : 0
        );
        setAnnualCost(calculatedAnnualCost);
        
        // Calculate net present value
        const calculatedNPV = calculateNetPresentValue(
          systemCost - incentives,
          calculatedAnnualRevenue - calculatedAnnualCost,
          discountRate,
          25
        );
        setNetPresentValue(calculatedNPV);
        
        // Calculate IRR
        const calculatedIRR = calculateInternalRateOfReturn(
          systemCost - incentives,
          calculatedAnnualRevenue - calculatedAnnualCost,
          25
        );
        setIRR(calculatedIRR);
        
        // Calculate payback period
        const calculatedPaybackPeriod = calculatePaybackPeriod(
          systemCost - incentives,
          calculatedAnnualRevenue - calculatedAnnualCost
        );
        setPaybackPeriod(calculatedPaybackPeriod);
        
        // Calculate yearly revenue (with electricity price escalation)
        const yearlyRevenue = production.map((prod, index) => {
          return prod * electricityRate * Math.pow(1 + (electricityEscalationRate / 100), index);
        });
        
        // Calculate yearly costs (with maintenance escalation)
        const yearlyOperationalCost = Array(25).fill(0).map((_, index) => {
          return maintenanceCost * Math.pow(1 + (maintenanceEscalationRate / 100), index);
        });
        
        // Calculate yearly cash flow
        const calculatedYearlyCashFlow = calculateYearlyCashFlow(
          systemCost - incentives,
          yearlyRevenue,
          yearlyOperationalCost
        );
        setYearlyCashFlow(calculatedYearlyCashFlow);
        
        // Calculate cumulative cash flow
        const calculatedCumulativeCashFlow = calculateCumulativeCashFlow(calculatedYearlyCashFlow);
        setCumulativeCashFlow(calculatedCumulativeCashFlow);
        
        // Calculate environmental benefits
        const calculatedCO2Reduction = calculateCO2Reduction(annualProduction);
        setCO2Reduction(calculatedCO2Reduction);
        
        // Calculate trees equivalent (approximate: 1 tree absorbs ~22kg CO2 per year)
        setTreesEquivalent(calculatedCO2Reduction / 22);
        
        // Calculate vehicle miles offset (approximate: 404 grams CO2 per mile)
        setVehicleMilesOffset(calculatedCO2Reduction * 1000 / 404);
        
        setShowResults(true);
        setActiveTab("results");
        toast.success("Calculations completed successfully!");
      } catch (error) {
        console.error("Calculation error:", error);
        toast.error("Error performing calculations. Please check your inputs.");
      } finally {
        setCalculating(false);
      }
    }, 1500);
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
        <TabsList className="grid grid-cols-5 mb-8 w-full md:w-auto mx-auto">
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="solar">Solar PV</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="results" disabled={!showResults}>Results</TabsTrigger>
          <TabsTrigger value="environmental" disabled={!showResults}>Environmental</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="w-full h-[calc(100vh-200px)] min-h-[600px]">
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
                onClick={() => setActiveTab("solar")}
                className="bg-solar hover:bg-solar-dark text-white"
              >
                Next: Solar PV Details
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="solar" className="space-y-8 mt-2">
            <SolarPVDetails
              systemSize={systemSize}
              setSystemSize={setSystemSize}
              panelType={panelType}
              setPanelType={setPanelType}
              panelEfficiency={panelEfficiency}
              setPanelEfficiency={setPanelEfficiency}
              inverterType={inverterType}
              setInverterType={setInverterType}
              inverterEfficiency={inverterEfficiency}
              setInverterEfficiency={setInverterEfficiency}
              roofType={roofType}
              setRoofType={setRoofType}
              roofAngle={roofAngle}
              setRoofAngle={setRoofAngle}
              orientation={orientation}
              setOrientation={setOrientation}
              solarIrradiance={solarIrradiance}
              setSolarIrradiance={setSolarIrradiance}
              shadingFactor={shadingFactor}
              setShadingFactor={setShadingFactor}
            />
            
            <div className="flex justify-between mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("client")}
              >
                Back
              </Button>
              <Button 
                onClick={() => setActiveTab("financial")}
                className="bg-solar hover:bg-solar-dark text-white"
              >
                Next: Financial Details
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
                onClick={() => setActiveTab("solar")}
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
              />
            )}
            
            <div className="flex justify-between mt-8 mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("financial")}
              >
                Back
              </Button>
              <Button 
                onClick={() => setActiveTab("environmental")}
                className="bg-solar hover:bg-solar-dark text-white"
              >
                View Environmental Benefits
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="environmental" className="mt-2">
            {showResults && (
              <EnvironmentalBenefits
                co2Reduction={co2Reduction}
                treesEquivalent={treesEquivalent}
                vehicleMilesOffset={vehicleMilesOffset}
              />
            )}
            
            <div className="flex justify-start mt-8 mb-10">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("results")}
              >
                Back to Results
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default SolarCalculator;
