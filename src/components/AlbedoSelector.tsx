import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sun, Info, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AlbedoValue } from "@/integrations/supabase/types";

interface AlbedoSelectorProps {
  selectedAlbedo: number;
  onAlbedoChange: (albedo: number, surfaceType?: string) => void;
}

const AlbedoSelector: React.FC<AlbedoSelectorProps> = ({
  selectedAlbedo,
  onAlbedoChange,
}) => {
  const [albedoValues, setAlbedoValues] = useState<AlbedoValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurfaceType, setSelectedSurfaceType] = useState<string>("");

  const loadAlbedoValues = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('albedo_values')
        .select('*')
        .order('category')
        .order('albedo_value', { ascending: false });

      if (error) {
        console.error('Error loading albedo values:', error);
        toast.error('Failed to load surface types');
        return;
      }

      setAlbedoValues(data || []);
      
      // Set default selection if none selected
      if (selectedAlbedo === 0.2 && data) {
        const defaultValue = data.find(item => item.is_default) || data.find(item => item.surface_type.includes('Green grass'));
        if (defaultValue) {
          setSelectedSurfaceType(defaultValue.surface_type);
        }
      }
    } catch (error) {
      console.error('Error loading albedo values:', error);
      toast.error('Failed to load surface types');
    } finally {
      setLoading(false);
    }
  }, [selectedAlbedo]);

  useEffect(() => {
    loadAlbedoValues();
  }, [loadAlbedoValues]);

  const handleSurfaceTypeChange = (surfaceType: string) => {
    const selectedValue = albedoValues.find(item => item.surface_type === surfaceType);
    if (selectedValue) {
      setSelectedSurfaceType(surfaceType);
      onAlbedoChange(selectedValue.albedo_value, surfaceType);
    }
  };

  const groupedValues = React.useMemo(() => {
    const groups: Record<string, AlbedoValue[]> = {};
    albedoValues.forEach(value => {
      const category = value.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(value);
    });
    return groups;
  }, [albedoValues]);

  const selectedValueInfo = albedoValues.find(item => item.surface_type === selectedSurfaceType);

  return (
    <Card className="border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
          <Sun className="h-5 w-5" />
          Surface Albedo Selection
        </CardTitle>
        <CardDescription className="text-amber-600">
          Select the surface type around your solar installation to determine light reflection characteristics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Surface Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="surface-type" className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-600" />
            Surface Type
          </Label>
          <Select
            value={selectedSurfaceType}
            onValueChange={handleSurfaceTypeChange}
            disabled={loading}
          >
            <SelectTrigger className="border-amber-200 focus-visible:ring-amber-500">
              <SelectValue placeholder={loading ? "Loading surface types..." : "Select surface type"} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {loading ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </SelectItem>
              ) : (
                Object.entries(groupedValues).map(([category, values]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category}
                    </div>
                    {values.map((value) => (
                      <SelectItem key={value.id} value={value.surface_type}>
                        <div className="flex items-center justify-between w-full">
                          <span className="flex-1">{value.surface_type}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {value.albedo_value.toFixed(2)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                  </div>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Albedo Information */}
        {selectedValueInfo && (
          <div className="space-y-3">
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-amber-100 rounded-md border border-amber-200">
                  <span className="text-sm text-amber-800 font-medium">Albedo Value:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                    {selectedValueInfo.albedo_value.toFixed(2)}
                  </Badge>
                </div>
                
                {selectedValueInfo.albedo_range_min !== undefined && selectedValueInfo.albedo_range_max !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-orange-100 rounded-md border border-orange-200">
                    <span className="text-sm text-orange-800 font-medium">Typical Range:</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                      {selectedValueInfo.albedo_range_min.toFixed(2)} - {selectedValueInfo.albedo_range_max.toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Description</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    {selectedValueInfo.description || "Surface reflectivity coefficient"}
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Information */}
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-800">Impact on Solar Performance</span>
              </div>
              <p className="text-xs text-slate-600">
                Higher albedo values (reflective surfaces) can increase solar panel performance through reflected light, 
                especially beneficial for bifacial panels. Typical impact ranges from 0-15% additional energy yield.
              </p>
            </div>
          </div>
        )}

        {/* Quick Selection Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-amber-700">Quick Selection:</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Grass", type: "Green grass (healthy, wet)", value: 0.2 },
              { label: "Concrete", type: "White concrete", value: 0.55 },
              { label: "Asphalt", type: "Asphalt / black tar", value: 0.1 }
            ].map((quick) => (
              <Button
                key={quick.type}
                variant="outline"
                size="sm"
                onClick={() => handleSurfaceTypeChange(quick.type)}
                className={`text-xs border-amber-200 ${
                  selectedSurfaceType === quick.type 
                    ? 'bg-amber-100 text-amber-800 border-amber-400' 
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                {quick.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {quick.value}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbedoSelector; 