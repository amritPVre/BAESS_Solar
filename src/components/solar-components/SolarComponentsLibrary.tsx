
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SolarPanel, SolarInverter, fetchSolarPanels, fetchSolarInverters, fetchPanelManufacturers, fetchInverterManufacturers } from "@/services/solarComponentsService";
import SolarPanelCard from "./SolarPanelCard";
import SolarInverterCard from "./SolarInverterCard";
import { Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SolarComponentsLibraryProps {
  onSelectPanel?: (panel: SolarPanel) => void;
  onSelectInverter?: (inverter: SolarInverter) => void;
  selectedPanelId?: string;
  selectedInverterId?: string;
}

const SolarComponentsLibrary: React.FC<SolarComponentsLibraryProps> = ({
  onSelectPanel,
  onSelectInverter,
  selectedPanelId,
  selectedInverterId,
}) => {
  const [activeTab, setActiveTab] = useState("panels");
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("all"); // Changed default value from "" to "all"

  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [inverters, setInverters] = useState<SolarInverter[]>([]);
  const [panelManufacturers, setPanelManufacturers] = useState<string[]>([]);
  const [inverterManufacturers, setInverterManufacturers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPanels = async () => {
    setIsLoading(true);
    // Pass empty string when filter is "all" for backward compatibility with the API
    const filterValue = manufacturerFilter === "all" ? "" : manufacturerFilter;
    const data = await fetchSolarPanels(searchQuery, filterValue);
    setPanels(data);
    setIsLoading(false);
  };

  const loadInverters = async () => {
    setIsLoading(true);
    // Pass empty string when filter is "all" for backward compatibility with the API
    const filterValue = manufacturerFilter === "all" ? "" : manufacturerFilter;
    const data = await fetchSolarInverters(searchQuery, filterValue);
    setInverters(data);
    setIsLoading(false);
  };

  const loadManufacturers = async () => {
    const panelMfrs = await fetchPanelManufacturers();
    setPanelManufacturers(panelMfrs);
    
    const inverterMfrs = await fetchInverterManufacturers();
    setInverterManufacturers(inverterMfrs);
  };

  useEffect(() => {
    loadManufacturers();
  }, []);

  useEffect(() => {
    if (activeTab === "panels") {
      loadPanels();
    } else {
      loadInverters();
    }
  }, [activeTab, searchQuery, manufacturerFilter]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery("");
    setManufacturerFilter("all"); // Changed from "" to "all"
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "panels") {
      loadPanels();
    } else {
      loadInverters();
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setManufacturerFilter("all"); // Changed from "" to "all"
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="panels" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <TabsList>
            <TabsTrigger value="panels">Solar Panels</TabsTrigger>
            <TabsTrigger value="inverters">Solar Inverters</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSearch} className="flex mt-4 sm:mt-0 w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={manufacturerFilter}
              onValueChange={setManufacturerFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {activeTab === "panels"
                  ? panelManufacturers.map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))
                  : inverterManufacturers.map((mfr) => (
                      <SelectItem key={mfr} value={mfr}>
                        {mfr}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>

            {(searchQuery || manufacturerFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>

        <TabsContent value="panels" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full" />
              ))}
            </div>
          ) : panels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {panels.map((panel) => (
                <SolarPanelCard
                  key={panel.id}
                  panel={panel}
                  onSelect={onSelectPanel}
                  isSelected={selectedPanelId === panel.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No solar panels found. Try adjusting your filters.</p>
              {searchQuery || manufacturerFilter !== "all" ? (
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inverters" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full" />
              ))}
            </div>
          ) : inverters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inverters.map((inverter) => (
                <SolarInverterCard
                  key={inverter.id}
                  inverter={inverter}
                  onSelect={onSelectInverter}
                  isSelected={selectedInverterId === inverter.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No solar inverters found. Try adjusting your filters.</p>
              {searchQuery || manufacturerFilter !== "all" ? (
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : null}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SolarComponentsLibrary;
