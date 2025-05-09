
// Calculate yearly production over system lifetime (typically 25 years)

interface MonthData {
  Month: string;
  "Monthly Energy Production (kWh)": number;
}

export function calculateYearlyProduction(monthlyData: MonthData[]): number[] {
  // Calculate first year production total
  const firstYearProduction = monthlyData.reduce(
    (sum, month) => sum + month["Monthly Energy Production (kWh)"],
    0
  );
  
  // Create array for 25 years with degradation
  const yearlyProduction: number[] = [];
  const systemLifetime = 25;
  const annualDegradation = 0.005; // 0.5% annual degradation (common for PV systems)
  
  for (let year = 0; year < systemLifetime; year++) {
    const degradationFactor = Math.pow(1 - annualDegradation, year);
    yearlyProduction.push(firstYearProduction * degradationFactor);
  }
  
  return yearlyProduction;
}
