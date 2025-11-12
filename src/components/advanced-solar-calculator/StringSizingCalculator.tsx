import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Calculator, Thermometer, Zap, Info } from "lucide-react";

interface StringSizingCalculatorProps {
  selectedPanel: any;
  selectedInverter: any;
  lowestTemperature: number;
  highestTemperature: number;
}

interface StringSizingResult {
  minStringLength: number;
  maxStringLength: number;
  recommendedStringLength: number;
  stringVoltageAtMinTemp: number;
  stringVoltageAtMaxTemp: number;
  stringVmpAtMinTemp: number;
  stringVmpAtMaxTemp: number;
  safetyMarginLow: number;
  safetyMarginHigh: number;
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
}

const StringSizingCalculator: React.FC<StringSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  lowestTemperature,
  highestTemperature
}) => {
  // State for manual inputs with defaults
  const [manualVoc, setManualVoc] = useState<number>(0);
  const [manualVmp, setManualVmp] = useState<number>(0);
  const [manualIsc, setManualIsc] = useState<number>(0);
  const [manualImp, setManualImp] = useState<number>(0);
  const [tempCoeffVoc, setTempCoeffVoc] = useState<number>(-0.28); // %/°C typical for silicon
  const [tempCoeffVmp, setTempCoeffVmp] = useState<number>(-0.38); // %/°C typical for silicon
  const [tempCoeffIsc, setTempCoeffIsc] = useState<number>(0.05); // %/°C typical for silicon
  const [safetyMargin, setSafetyMargin] = useState<number>(5); // % safety margin
  
  const [calculationResult, setCalculationResult] = useState<StringSizingResult | null>(null);
  const [useManualValues, setUseManualValues] = useState(false);

  // Initialize values from selected panel
  useEffect(() => {
    if (selectedPanel) {
      setManualVoc(selectedPanel.voc || 45.0);
      setManualVmp(selectedPanel.vmp || 37.0);
      setManualIsc(selectedPanel.isc || 11.5);
      setManualImp(selectedPanel.imp || 10.8);
      
      // Set temperature coefficients if available, otherwise use typical values
      setTempCoeffVoc(selectedPanel.temp_coeff_voc || -0.28);
      setTempCoeffVmp(selectedPanel.temp_coeff_vmp || -0.38);
      setTempCoeffIsc(selectedPanel.temp_coeff_isc || 0.05);
    }
  }, [selectedPanel]);

  // Calculate temperature-corrected voltages following IEC 61215 standards
  const calculateTemperatureCorrection = (
    stcValue: number, 
    temperature: number, 
    tempCoeff: number
  ): number => {
    // IEC formula: Value_T = Value_STC * (1 + (T - 25) * TempCoeff / 100)
    return stcValue * (1 + (temperature - 25) * tempCoeff / 100);
  };

  // Main string sizing calculation following PVsyst logic
  const calculateStringSizing = (): StringSizingResult => {
    if (!selectedInverter) {
      return {
        minStringLength: 0,
        maxStringLength: 0,
        recommendedStringLength: 0,
        stringVoltageAtMinTemp: 0,
        stringVoltageAtMaxTemp: 0,
        stringVmpAtMinTemp: 0,
        stringVmpAtMaxTemp: 0,
        safetyMarginLow: 0,
        safetyMarginHigh: 0,
        isValid: false,
        warnings: ["No inverter selected"],
        recommendations: []
      };
    }

    const voc = useManualValues ? manualVoc : (selectedPanel?.voc || manualVoc);
    const vmp = useManualValues ? manualVmp : (selectedPanel?.vmp || manualVmp);
    
    // Get inverter specifications
    const mpptMin = selectedInverter.mppt_min_voltage || 125;
    const mpptMax = selectedInverter.mppt_max_voltage || 850;
    const maxDcVoltage = selectedInverter.max_dc_voltage || 1000;
    
    // Temperature corrected voltages
    const vocAtMinTemp = calculateTemperatureCorrection(voc, lowestTemperature, tempCoeffVoc);
    const vocAtMaxTemp = calculateTemperatureCorrection(voc, highestTemperature, tempCoeffVoc);
    const vmpAtMinTemp = calculateTemperatureCorrection(vmp, lowestTemperature, tempCoeffVmp);
    const vmpAtMaxTemp = calculateTemperatureCorrection(vmp, highestTemperature, tempCoeffVmp);

    // Calculate string length limits following IEC and PVsyst methodology
    
    // 1. Maximum string length limited by max DC voltage at minimum temperature
    // Apply safety margin to max DC voltage
    const maxDcWithSafety = maxDcVoltage * (1 - safetyMargin / 100);
    const maxStringLengthByVoc = Math.floor(maxDcWithSafety / vocAtMinTemp);
    
    // 2. Maximum string length limited by MPPT max voltage at minimum temperature  
    const maxStringLengthByMppt = Math.floor(mpptMax / vmpAtMinTemp);
    
    // 3. Minimum string length by MPPT min voltage at maximum temperature
    const minStringLengthByMppt = Math.ceil(mpptMin / vmpAtMaxTemp);
    
    // Take the most restrictive limits
    const maxStringLength = Math.min(maxStringLengthByVoc, maxStringLengthByMppt);
    const minStringLength = Math.max(1, minStringLengthByMppt);
    
    // Calculate recommended string length (optimal for MPPT)
    // Target middle of MPPT window at STC conditions
    const targetVoltage = (mpptMin + mpptMax) / 2;
    const recommendedStringLength = Math.round(targetVoltage / vmp);
    const finalRecommended = Math.max(minStringLength, Math.min(maxStringLength, recommendedStringLength));
    
    // Calculate actual voltages for recommended string length
    const stringVocAtMinTemp = finalRecommended * vocAtMinTemp;
    const stringVocAtMaxTemp = finalRecommended * vocAtMaxTemp;
    const stringVmpAtMinTemp = finalRecommended * vmpAtMinTemp;
    const stringVmpAtMaxTemp = finalRecommended * vmpAtMaxTemp;
    
    // Calculate safety margins
    const safetyMarginLow = ((stringVmpAtMaxTemp - mpptMin) / mpptMin) * 100;
    const safetyMarginHigh = ((maxDcVoltage - stringVocAtMinTemp) / maxDcVoltage) * 100;
    
    // Validation and warnings
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    let isValid = true;
    
    if (minStringLength > maxStringLength) {
      isValid = false;
      warnings.push("No valid string configuration possible with current parameters");
    }
    
    if (stringVocAtMinTemp > maxDcVoltage) {
      warnings.push(`String Voc at ${lowestTemperature}°C exceeds inverter max DC voltage`);
      isValid = false;
    }
    
    if (stringVmpAtMaxTemp < mpptMin) {
      warnings.push(`String Vmp at ${highestTemperature}°C below MPPT minimum voltage`);
      isValid = false;
    }
    
    if (stringVmpAtMinTemp > mpptMax) {
      warnings.push(`String Vmp at ${lowestTemperature}°C exceeds MPPT maximum voltage`);
    }
    
    if (safetyMarginLow < 5) {
      warnings.push("Low safety margin at high temperature");
    }
    
    if (safetyMarginHigh < 10) {
      warnings.push("Low safety margin for maximum voltage");
    }
    
    // Recommendations
    if (isValid) {
      recommendations.push(`Recommended string length: ${finalRecommended} modules`);
      
      if (finalRecommended === minStringLength && finalRecommended === maxStringLength) {
        recommendations.push("Only one string configuration is possible");
      } else {
        recommendations.push(`Valid range: ${minStringLength} to ${maxStringLength} modules per string`);
      }
      
      if (safetyMarginLow > 10 && safetyMarginHigh > 15) {
        recommendations.push("Excellent safety margins maintained");
      }
    }
    
    return {
      minStringLength,
      maxStringLength,
      recommendedStringLength: finalRecommended,
      stringVoltageAtMinTemp: stringVocAtMinTemp,
      stringVoltageAtMaxTemp: stringVocAtMaxTemp,
      stringVmpAtMinTemp,
      stringVmpAtMaxTemp,
      safetyMarginLow,
      safetyMarginHigh,
      isValid,
      warnings,
      recommendations
    };
  };

  // Recalculate when parameters change
  useEffect(() => {
    if (selectedPanel && selectedInverter) {
      const result = calculateStringSizing();
      setCalculationResult(result);
    }
  }, [
    selectedPanel, 
    selectedInverter, 
    lowestTemperature, 
    highestTemperature,
    manualVoc,
    manualVmp,
    tempCoeffVoc,
    tempCoeffVmp,
    safetyMargin,
    useManualValues
  ]);

  if (!selectedPanel || !selectedInverter) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            String Sizing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Please select both panel and inverter to perform string sizing calculations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            String Sizing Calculator
            <Badge variant="outline">IEC/PVsyst Standards</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle for manual values */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useManualValues"
              checked={useManualValues}
              onChange={(e) => setUseManualValues(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="useManualValues" className="text-sm font-medium">
              Override with manual values
            </Label>
          </div>

          {/* Panel Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voc">Voc (V) @ STC</Label>
              <Input
                id="voc"
                type="number"
                step="0.1"
                value={manualVoc}
                onChange={(e) => setManualVoc(Number(e.target.value))}
                disabled={!useManualValues}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vmp">Vmp (V) @ STC</Label>
              <Input
                id="vmp"
                type="number"
                step="0.1"
                value={manualVmp}
                onChange={(e) => setManualVmp(Number(e.target.value))}
                disabled={!useManualValues}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isc">Isc (A) @ STC</Label>
              <Input
                id="isc"
                type="number"
                step="0.1"
                value={manualIsc}
                onChange={(e) => setManualIsc(Number(e.target.value))}
                disabled={!useManualValues}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp">Imp (A) @ STC</Label>
              <Input
                id="imp"
                type="number"
                step="0.1"
                value={manualImp}
                onChange={(e) => setManualImp(Number(e.target.value))}
                disabled={!useManualValues}
                className="text-center"
              />
            </div>
          </div>

          {/* Temperature Coefficients */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              Temperature Coefficients (%/°C)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempCoeffVoc">Voc Temperature Coefficient</Label>
                <Input
                  id="tempCoeffVoc"
                  type="number"
                  step="0.01"
                  value={tempCoeffVoc}
                  onChange={(e) => setTempCoeffVoc(Number(e.target.value))}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempCoeffVmp">Vmp Temperature Coefficient</Label>
                <Input
                  id="tempCoeffVmp"
                  type="number"
                  step="0.01"
                  value={tempCoeffVmp}
                  onChange={(e) => setTempCoeffVmp(Number(e.target.value))}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safetyMargin">Safety Margin (%)</Label>
                <Input
                  id="safetyMargin"
                  type="number"
                  step="1"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(Number(e.target.value))}
                  className="text-center"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              String Sizing Results
              {calculationResult.isValid ? (
                <Badge className="bg-green-100 text-green-800">Valid Configuration</Badge>
              ) : (
                <Badge variant="destructive">Invalid Configuration</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {calculationResult.recommendedStringLength}
                  </div>
                  <div className="text-sm text-blue-700">Recommended String Length</div>
                  <div className="text-xs text-blue-600 mt-1">modules per string</div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-900">
                    {calculationResult.minStringLength} - {calculationResult.maxStringLength}
                  </div>
                  <div className="text-sm text-green-700">Valid Range</div>
                  <div className="text-xs text-green-600 mt-1">modules per string</div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-900">
                    {calculationResult.safetyMarginHigh.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700">Safety Margin</div>
                  <div className="text-xs text-purple-600 mt-1">voltage headroom</div>
                </div>
              </div>
            </div>

            {/* Detailed Voltage Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium">Voltage Analysis</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Parameter</th>
                      <th className="border border-gray-300 p-2 text-center">At {lowestTemperature}°C</th>
                      <th className="border border-gray-300 p-2 text-center">At {highestTemperature}°C</th>
                      <th className="border border-gray-300 p-2 text-center">Limit</th>
                      <th className="border border-gray-300 p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">String Voc</td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVoltageAtMinTemp.toFixed(1)} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVoltageAtMaxTemp.toFixed(1)} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        ≤ {selectedInverter.max_dc_voltage} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVoltageAtMinTemp <= selectedInverter.max_dc_voltage ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">String Vmp</td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVmpAtMinTemp.toFixed(1)} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVmpAtMaxTemp.toFixed(1)} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {selectedInverter.mppt_min_voltage} - {selectedInverter.mppt_max_voltage} V
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {calculationResult.stringVmpAtMaxTemp >= selectedInverter.mppt_min_voltage && 
                         calculationResult.stringVmpAtMinTemp <= selectedInverter.mppt_max_voltage ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings and Recommendations */}
            {calculationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h4>
                <div className="space-y-1">
                  {calculationResult.warnings.map((warning, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calculationResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {calculationResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StringSizingCalculator; 