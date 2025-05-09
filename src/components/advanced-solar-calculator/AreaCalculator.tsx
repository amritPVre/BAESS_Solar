import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import type { SolarPanel } from '../types/components';
import { Layers, Map } from 'lucide-react'; // Replaced LayersThree with Layers

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface AreaCalculatorProps {
  selectedPanel: SolarPanel;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: any[]) => void;
}

const AreaCalculator: React.FC<AreaCalculatorProps> = ({ selectedPanel, onCapacityCalculated }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState<google.maps.LatLng[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<any[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);

  const center = useMemo(() => ({ lat: 40.7128, lng: -74.0060 }), []);
  const zoom = 12;

  const onLoad = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);
  }, []);

  useEffect(() => {
    if (map) {
      const calculateAreaAndCapacity = () => {
        let area = 0;
        let capacity = 0;
        let moduleCount = 0;
        const configs: any[] = [];

        polygons.forEach((polygon, index) => {
          const path = polygon.getPath();
          const polygonArea = google.maps.geometry.spherical.computeArea(path);
          area += polygonArea;

          const tiltAngle = 30;
          const azimuth = 180;
          const structureType = 'fixed_tilt';

          const polygonAreaM2 = polygonArea;
          const modulesPerArea = polygonAreaM2 / (selectedPanel.length! * selectedPanel.width!);
          const moduleCountForPolygon = Math.floor(modulesPerArea);
          moduleCount += moduleCountForPolygon;

          const capacityForPolygon = (moduleCountForPolygon * selectedPanel.power) / 1000;
          capacity += capacityForPolygon;

          configs.push({
            area: polygonAreaM2,
            tiltAngle,
            azimuth,
            structureType,
            moduleCount: moduleCountForPolygon,
            capacityKw: capacityForPolygon,
            polygon: polygon,
            path: path,
          });
        });

        setTotalArea(area);
        setTotalCapacity(capacity);
        setTotalModules(moduleCount);
        setPolygonConfigs(configs);

        onCapacityCalculated(capacity, area, moduleCount, configs);
      };

      calculateAreaAndCapacity();
    }
  }, [polygons, selectedPanel, map, onCapacityCalculated]);

  const startDrawing = () => {
    setDrawingMode(true);
    setCurrentPath([]);
  };

  const stopDrawing = () => {
    setDrawingMode(false);
    if (map && currentPath.length > 2) {
      const newPolygon = new google.maps.Polygon({
        paths: currentPath,
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0000FF",
        fillOpacity: 0.35,
        editable: true,
        draggable: true,
      });

      newPolygon.setMap(map);
      setPolygons((prevPolygons) => [...prevPolygons, newPolygon]);

      newPolygon.addListener('mouseup', () => {
        // Trigger recalculation when the polygon is moved
        if (map) {
          const calculateAreaAndCapacity = () => {
            let area = 0;
            let capacity = 0;
            let moduleCount = 0;
            const configs: any[] = [];

            polygons.forEach((polygon, index) => {
              const path = polygon.getPath();
              const polygonArea = google.maps.geometry.spherical.computeArea(path);
              area += polygonArea;

              const tiltAngle = 30;
              const azimuth = 180;
              const structureType = 'fixed_tilt';

              const polygonAreaM2 = polygonArea;
              const modulesPerArea = polygonAreaM2 / (selectedPanel.length! * selectedPanel.width!);
              const moduleCountForPolygon = Math.floor(modulesPerArea);
              moduleCount += moduleCountForPolygon;

              const capacityForPolygon = (moduleCountForPolygon * selectedPanel.power) / 1000;
              capacity += capacityForPolygon;

              configs.push({
                area: polygonAreaM2,
                tiltAngle,
                azimuth,
                structureType,
                moduleCount: moduleCountForPolygon,
                capacityKw: capacityForPolygon,
                polygon: polygon,
                path: path,
              });
            });

            setTotalArea(area);
            setTotalCapacity(capacity);
            setTotalModules(moduleCount);
            setPolygonConfigs(configs);

            onCapacityCalculated(capacity, area, moduleCount, configs);
          };

          calculateAreaAndCapacity();
        }
      });
    }
    setCurrentPath([]);
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (drawingMode && event.latLng) {
      setCurrentPath((prevPath) => [...prevPath, event.latLng!]);
    }
  };

  const clearLastPoint = () => {
    if (drawingMode) {
      setCurrentPath((prevPath) => prevPath.slice(0, -1));
    }
  };

  const clearAllPolygons = () => {
    polygons.forEach((polygon) => {
      polygon.setMap(null);
    });
    setPolygons([]);
    setTotalArea(0);
    setTotalCapacity(0);
    setTotalModules(0);
    setPolygonConfigs([]);
    onCapacityCalculated(0, 0, 0, []);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Define PV Installation Area</h2>
        <div className="space-x-2">
          <button
            onClick={startDrawing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            disabled={drawingMode}
          >
            Start Drawing
          </button>
          <button
            onClick={stopDrawing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            disabled={!drawingMode}
          >
            Stop Drawing
          </button>
          <button
            onClick={clearLastPoint}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700"
            disabled={!drawingMode || currentPath.length === 0}
          >
            Clear Last Point
          </button>
          <button
            onClick={clearAllPolygons}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="flex-grow relative">
        <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={["geometry"]}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={zoom}
            onLoad={onLoad}
            onClick={handleMapClick}
          >
            {currentPath.length > 0 && drawingMode && (
              <google.maps.Polyline
                path={currentPath}
                strokeColor="#FF0000"
                strokeOpacity={0.8}
                strokeWeight={2}
              />
            )}
            {polygons.map((polygon, index) => (
              <React.Fragment key={index}>
                {polygon.getPath().getArray().map((latLng, i) => (
                  <google.maps.Marker
                    key={`${index}-${i}`}
                    position={latLng}
                    label={`${i + 1}`}
                  />
                ))}
              </React.Fragment>
            ))}
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold">Calculation Results</h3>
        <p>Total Area: {totalArea.toFixed(2)} m²</p>
        <p>Total Capacity: {totalCapacity.toFixed(2)} kW</p>
        <p>Total Modules: {totalModules}</p>
      </div>
    </div>
  );
};

export default AreaCalculator;
