
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export const DrawingInstructions: React.FC = () => {
  return (
    <Card className="bg-blue-50 border-blue-200 mb-4">
      <CardContent className="p-4">
        <h3 className="text-blue-800 font-medium mb-2">Drawing Instructions:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Select a structure type from the dropdown below</li>
          <li>Click a drawing tool button (polygon or rectangle)</li>
          <li>Draw on the map to define your installation area</li>
          <li>You can draw multiple areas with different structure types</li>
          <li>Areas are editable - drag the points to reshape them</li>
          <li>Click on the edge markers to set the array azimuth</li>
        </ol>
      </CardContent>
    </Card>
  );
};
