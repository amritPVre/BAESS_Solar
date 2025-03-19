
import React from "react";
import { Loader2, Info } from "lucide-react";

interface DesignCanvasUIProps {
  mapLoaded: boolean;
  mapError: string | null;
  activeTool: "select" | "building" | "panel" | "delete";
  apiKeyEntered: boolean;
}

export const DesignCanvasUI: React.FC<DesignCanvasUIProps> = ({
  mapLoaded,
  mapError,
  activeTool,
  apiKeyEntered
}) => {
  return (
    <>
      {/* Drawing mode indicator */}
      {mapLoaded && activeTool !== 'select' && (
        <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-md shadow-sm text-sm z-20 animate-pulse">
          Drawing Mode: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md shadow-sm text-sm text-gray-600 z-10">
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#7f8c8d] mr-2 rounded-sm"></span>
          Building
        </p>
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#2980b9] mr-2 rounded-sm"></span>
          Solar Panel
        </p>
      </div>
      
      {/* Error display */}
      {mapError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-800 p-2 text-sm z-10">
          {mapError}
        </div>
      )}
      
      {/* Loading indicator */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-solar" />
            <p className="mt-2 text-solar-dark">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Active tool indicator */}
      {mapLoaded && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded-md shadow-sm text-sm z-10">
          <p className="font-medium">
            Active Tool: <span className="text-solar">{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</span>
          </p>
        </div>
      )}
      
      {/* Instructions overlay when drawing mode is active */}
      {mapLoaded && (activeTool === 'building' || activeTool === 'panel') && (
        <div className="absolute top-14 right-2 bg-yellow-50 p-2 rounded-md shadow-sm text-sm z-10 border border-yellow-200 max-w-xs">
          <p className="font-medium text-yellow-800">Drawing Instructions:</p>
          <ol className="text-xs text-yellow-700 list-decimal pl-4 mt-1 space-y-1">
            <li>Click and drag to draw a {activeTool === 'building' ? 'building' : 'solar panel'}</li>
            <li>Release mouse button to finish</li>
            <li>Use the Select tool to move or resize later</li>
          </ol>
        </div>
      )}
      
      {/* OpenStreetMap attribution notice */}
      <div className="absolute bottom-8 left-2 bg-white/80 px-2 py-1 rounded-md text-xs text-gray-600 z-10">
        Powered by OpenStreetMap
      </div>
    </>
  );
};
