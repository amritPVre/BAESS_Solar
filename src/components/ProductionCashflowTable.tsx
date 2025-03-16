
import React, { useState } from "react";
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/utils/calculations";

interface ProductionCashflowTableProps {
  yearlyProduction: number[];
  yearlyCashFlow: number[];
  cumulativeCashFlow: number[];
}

const ProductionCashflowTable: React.FC<ProductionCashflowTableProps> = ({ 
  yearlyProduction, 
  yearlyCashFlow, 
  cumulativeCashFlow 
}) => {
  const [showAllYears, setShowAllYears] = useState(false);
  
  // Display only the first 5 years and the 25th year if not showing all
  const displayYears = showAllYears 
    ? Array.from({ length: 25 }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, 25];
  
  return (
    <div className="bg-white/50 rounded-lg p-2 overflow-auto">
      <Table>
        <TableCaption className="mt-4">
          {!showAllYears && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllYears(true)}
              className="mt-2"
            >
              Show All 25 Years
            </Button>
          )}
          {showAllYears && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllYears(false)}
              className="mt-2"
            >
              Show Less
            </Button>
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Energy Production (kWh)</TableHead>
            <TableHead>Cash Flow ($)</TableHead>
            <TableHead>Cumulative Cash Flow ($)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayYears.map(year => {
            const index = year - 1;
            return (
              <TableRow key={year} className={year === 25 && !showAllYears ? "border-t-2" : ""}>
                <TableCell>{year}</TableCell>
                <TableCell>{formatNumber(yearlyProduction[index] || 0)}</TableCell>
                <TableCell>{formatCurrency(yearlyCashFlow[index] || 0)}</TableCell>
                <TableCell>{formatCurrency(cumulativeCashFlow[index] || 0)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductionCashflowTable;
