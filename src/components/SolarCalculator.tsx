import React from "react";
// Assuming these are the existing imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolarCalculatorProps } from "@/types/components";
import { SolarProject } from "@/types/solarProject";

const SolarCalculator: React.FC<SolarCalculatorProps> = ({
  projectData,
  initialLocation,
  onSaveProject
}) => {
  // Initialize state with initialLocation if provided
  const [location, setLocation] = React.useState(initialLocation || {
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: "America/New_York",
    country: "United States",
    city: "New York"
  });
  
  // Other state variables and logic from the original component
  const [activeTab, setActiveTab] = React.useState("system");
  const [projectDetails, setProjectDetails] = React.useState(projectData || {
    name: "New Solar Project",
    systemSize: 10,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    companyName: "",
    companyContact: "",
    companyEmail: "",
    companyPhone: "",
    knowsAnnualEnergy: false,
    manualAnnualEnergy: 0,
    annualEnergy: 0,
    panelType: "monocrystalline",
    panelEfficiency: 20,
    inverterType: "string",
    inverterEfficiency: 95,
    roofType: "asphalt",
    roofAngle: 30,
    orientation: "south",
    solarIrradiance: 5,
    shadingFactor: 10,
    location: {
      lat: 40.7128,
      lng: -74.0060
    },
    timezone: "America/New_York",
    country: "United States",
    city: "New York",
    systemCost: 25000,
    electricityRate: 0.15,
    electricityEscalationRate: 2,
    incentives: 5000,
    financingOption: "cash",
    loanTerm: 10,
    interestRate: 5,
    maintenanceCost: 200,
    maintenanceEscalationRate: 3,
    degradationRate: 0.5,
    discountRate: 8,
    lcoe: 0,
    annualRevenue: 0,
    annualCost: 0,
    netPresentValue: 0,
    irr: 0,
    paybackPeriod: {
      years: 0,
      months: 0
    },
    co2Reduction: 0,
    treesEquivalent: 0,
    vehicleMilesOffset: 0,
    yearlyProduction: [],
    yearlyCashFlow: [],
    cumulativeCashFlow: []
  });
  
  // Use projectData if provided
  React.useEffect(() => {
    if (projectData) {
      setProjectDetails(projectData);
      
      // If projectData has location information, use it
      if (projectData.location) {
        setLocation({
          latitude: projectData.location.lat,
          longitude: projectData.location.lng,
          timezone: projectData.timezone || location.timezone,
          country: projectData.country || location.country,
          city: projectData.city || location.city
        });
      }
    }
  }, [projectData]);
  
  // Handle location changes
  const handleLocationChange = (field: string, value: any) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle project details changes
  const handleProjectDetailsChange = (field: string, value: any) => {
    setProjectDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle project save
  const handleSave = () => {
    if (onSaveProject && projectData) {
      const updatedProject: SolarProject = {
        ...projectData,
        ...projectDetails,
        location: {
          lat: location.latitude,
          lng: location.longitude
        },
        timezone: location.timezone,
        country: location.country,
        city: location.city,
        updatedAt: new Date().toISOString()
      };
      onSaveProject(updatedProject);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Solar System Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="system">System Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system">
              {/* System details form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemSize">System Size (kW)</Label>
                  <Input 
                    id="systemSize"
                    type="number"
                    value={projectDetails.systemSize}
                    onChange={(e) => handleProjectDetailsChange('systemSize', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input 
                    id="clientName"
                    type="text"
                    value={projectDetails.clientName}
                    onChange={(e) => handleProjectDetailsChange('clientName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input 
                    id="clientEmail"
                    type="email"
                    value={projectDetails.clientEmail}
                    onChange={(e) => handleProjectDetailsChange('clientEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input 
                    id="clientPhone"
                    type="tel"
                    value={projectDetails.clientPhone}
                    onChange={(e) => handleProjectDetailsChange('clientPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Input 
                    id="clientAddress"
                    type="text"
                    value={projectDetails.clientAddress}
                    onChange={(e) => handleProjectDetailsChange('clientAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName"
                    type="text"
                    value={projectDetails.companyName}
                    onChange={(e) => handleProjectDetailsChange('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyContact">Company Contact</Label>
                  <Input 
                    id="companyContact"
                    type="text"
                    value={projectDetails.companyContact}
                    onChange={(e) => handleProjectDetailsChange('companyContact', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input 
                    id="companyEmail"
                    type="email"
                    value={projectDetails.companyEmail}
                    onChange={(e) => handleProjectDetailsChange('companyEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input 
                    id="companyPhone"
                    type="tel"
                    value={projectDetails.companyPhone}
                    onChange={(e) => handleProjectDetailsChange('companyPhone', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location">
              {/* Location form using the initialLocation data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude"
                    type="number"
                    value={location.latitude}
                    onChange={(e) => handleLocationChange('latitude', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude"
                    type="number"
                    value={location.longitude}
                    onChange={(e) => handleLocationChange('longitude', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input 
                    id="timezone"
                    value={location.timezone}
                    onChange={(e) => handleLocationChange('timezone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country"
                    value={location.country}
                    onChange={(e) => handleLocationChange('country', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city"
                    value={location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="financial">
              {/* Financial inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial form fields */}
                <div className="space-y-2">
                  <Label htmlFor="systemCost">System Cost</Label>
                  <Input 
                    id="systemCost"
                    type="number"
                    value={projectDetails.systemCost}
                    onChange={(e) => handleProjectDetailsChange('systemCost', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricityRate">Electricity Rate</Label>
                  <Input 
                    id="electricityRate"
                    type="number"
                    value={projectDetails.electricityRate}
                    onChange={(e) => handleProjectDetailsChange('electricityRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricityEscalationRate">Electricity Escalation Rate</Label>
                  <Input 
                    id="electricityEscalationRate"
                    type="number"
                    value={projectDetails.electricityEscalationRate}
                    onChange={(e) => handleProjectDetailsChange('electricityEscalationRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incentives">Incentives</Label>
                  <Input 
                    id="incentives"
                    type="number"
                    value={projectDetails.incentives}
                    onChange={(e) => handleProjectDetailsChange('incentives', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="financingOption">Financing Option</Label>
                  <Select value={projectDetails.financingOption} onValueChange={(value) => handleProjectDetailsChange('financingOption', value)}>
                    <SelectTrigger id="financingOption">
                      <SelectValue placeholder="Select financing option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanTerm">Loan Term</Label>
                  <Input 
                    id="loanTerm"
                    type="number"
                    value={projectDetails.loanTerm}
                    onChange={(e) => handleProjectDetailsChange('loanTerm', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate</Label>
                  <Input 
                    id="interestRate"
                    type="number"
                    value={projectDetails.interestRate}
                    onChange={(e) => handleProjectDetailsChange('interestRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceCost">Maintenance Cost</Label>
                  <Input 
                    id="maintenanceCost"
                    type="number"
                    value={projectDetails.maintenanceCost}
                    onChange={(e) => handleProjectDetailsChange('maintenanceCost', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceEscalationRate">Maintenance Escalation Rate</Label>
                  <Input 
                    id="maintenanceEscalationRate"
                    type="number"
                    value={projectDetails.maintenanceEscalationRate}
                    onChange={(e) => handleProjectDetailsChange('maintenanceEscalationRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degradationRate">Degradation Rate</Label>
                  <Input 
                    id="degradationRate"
                    type="number"
                    value={projectDetails.degradationRate}
                    onChange={(e) => handleProjectDetailsChange('degradationRate', parseFloat(e.target.value))}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="discountRate">Discount Rate</Label>
                  <Input 
                    id="discountRate"
                    type="number"
                    value={projectDetails.discountRate}
                    onChange={(e) => handleProjectDetailsChange('discountRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              {/* Results display */}
              <div className="space-y-4">
                {/* Results content */}
                <div>
                  <Label>LCOE</Label>
                  <Input type="number" value={projectDetails.lcoe} readOnly />
                </div>
                <div>
                  <Label>Annual Revenue</Label>
                  <Input type="number" value={projectDetails.annualRevenue} readOnly />
                </div>
                <div>
                  <Label>Annual Cost</Label>
                  <Input type="number" value={projectDetails.annualCost} readOnly />
                </div>
                <div>
                  <Label>Net Present Value</Label>
                  <Input type="number" value={projectDetails.netPresentValue} readOnly />
                </div>
                <div>
                  <Label>IRR</Label>
                  <Input type="number" value={projectDetails.irr} readOnly />
                </div>
                <div>
                  <Label>Payback Period (Years)</Label>
                  <Input type="number" value={projectDetails.paybackPeriod.years} readOnly />
                </div>
                <div>
                  <Label>Payback Period (Months)</Label>
                  <Input type="number" value={projectDetails.paybackPeriod.months} readOnly />
                </div>
                <div>
                  <Label>CO2 Reduction</Label>
                  <Input type="number" value={projectDetails.co2Reduction} readOnly />
                </div>
                <div>
                  <Label>Trees Equivalent</Label>
                  <Input type="number" value={projectDetails.treesEquivalent} readOnly />
                </div>
                <div>
                  <Label>Vehicle Miles Offset</Label>
                  <Input type="number" value={projectDetails.vehicleMilesOffset} readOnly />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave}>Save Project</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolarCalculator;
