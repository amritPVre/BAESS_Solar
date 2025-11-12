
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PolygonInfo, StructureType } from '../types';
import { DEFAULT_POLYGON_OPTIONS } from '../constants';

interface UsePolygonManagerProps {
  onPolygonChange: () => void;
}

export const usePolygonManager = ({ onPolygonChange }: UsePolygonManagerProps) => {
  const [polygons, setPolygons] = useState<PolygonInfo[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(0);
  
  // Define polygon draw options (memoized)
  const polygonDrawOptions = useMemo(() => DEFAULT_POLYGON_OPTIONS, []);

  // Add a polygon to the state
  const addPolygon = useCallback((polygon: google.maps.Polygon, area: number, azimuth: number = 180) => {
    setPolygons(prev => [...prev, { polygon, area, azimuth }]);
    onPolygonChange();
  }, [onPolygonChange]);

  // Update a polygon's properties
  const updatePolygon = useCallback((index: number, updates: Partial<PolygonInfo>) => {
    setPolygons(prevPolygons => 
      prevPolygons.map((poly, idx) => 
        idx === index ? { ...poly, ...updates } : poly
      )
    );
    onPolygonChange();
  }, [onPolygonChange]);

  // Update polygon azimuth
  const updatePolygonAzimuth = useCallback((polygonIndex: number, azimuth: number) => {
    setPolygons(prevPolygons => prevPolygons.map((poly, idx) => 
      idx === polygonIndex 
        ? { ...poly, azimuth } 
        : poly
    ));
    onPolygonChange();
  }, [onPolygonChange]);

  // Clear all polygons
  const clearAllPolygons = useCallback(() => {
    polygons.forEach(({ polygon }) => {
      polygon.setMap(null);
    });
    
    setPolygons([]);
    setTotalArea(0);
    onPolygonChange();
  }, [polygons, onPolygonChange]);

  // Update total area calculation
  useEffect(() => {
    if (polygons.length === 0) {
      setTotalArea(0);
      return;
    }

    const calculatedTotalArea = polygons.reduce((sum, poly) => sum + poly.area, 0);
    setTotalArea(calculatedTotalArea);
  }, [polygons]);

  // Select a polygon
  const selectPolygon = useCallback((index: number) => {
    setSelectedPolygonIndex(index);
    
    // Update styling of polygons to highlight the selected one
    polygons.forEach((poly, idx) => {
      const options = {...polygonDrawOptions};
      if (idx === index) {
        options.fillColor = "#FF6600";
        options.fillOpacity = 0.0;  // Keep transparent even when selected
        options.strokeColor = "#FF6600";
        options.strokeWeight = 3;   // Make border thicker to show selection
      }
      poly.polygon.setOptions(options);
    });
  }, [polygons, polygonDrawOptions]);

  return {
    polygons,
    setPolygons,
    totalArea,
    selectedPolygonIndex,
    setSelectedPolygonIndex,
    polygonDrawOptions,
    addPolygon,
    updatePolygon,
    updatePolygonAzimuth,
    clearAllPolygons,
    selectPolygon
  };
};
