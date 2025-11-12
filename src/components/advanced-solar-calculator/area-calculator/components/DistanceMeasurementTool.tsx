import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ruler, X } from 'lucide-react';

interface DistanceMeasurementToolProps {
  map: google.maps.Map | null;
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
}

interface Measurement {
  id: string;
  start: google.maps.LatLng;
  end: google.maps.LatLng;
  line: google.maps.Polyline;
  label: google.maps.InfoWindow;
  distance: number;
}

export const DistanceMeasurementTool: React.FC<DistanceMeasurementToolProps> = ({ 
  map, 
  drawingManagerRef 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  
  // Use refs to avoid useCallback dependency issues
  const clickCountRef = useRef(0);
  const firstPointRef = useRef<google.maps.LatLng | null>(null);
  const tempLineRef = useRef<google.maps.Polyline | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const mouseMoveListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const previousDrawingModeRef = useRef<google.maps.drawing.OverlayType | null>(null);

  const calculateDistance = (start: google.maps.LatLng, end: google.maps.LatLng): number => {
    return google.maps.geometry.spherical.computeDistanceBetween(start, end);
  };

  const formatDistance = (meters: number): string => {
    return `${meters.toFixed(1)}m`;
  };

  const createFinalMeasurement = useCallback((start: google.maps.LatLng, end: google.maps.LatLng) => {
    if (!map) return;
    
    console.log('📐 Creating final measurement');
    
    const distance = calculateDistance(start, end);
    const midPoint = google.maps.geometry.spherical.interpolate(start, end, 0.5);
    
    // Create final line
    const line = new google.maps.Polyline({
      path: [start, end],
      geodesic: true,
      strokeColor: '#DC2626', // Red
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: map,
    });

    // Create distance label
    const label = new google.maps.InfoWindow({
      position: midPoint,
      content: `<div style="padding: 2px 6px; font-size: 12px; font-weight: bold; color: #DC2626;">${formatDistance(distance)}</div>`,
      disableAutoPan: true
    });
    
    label.open(map);

    const measurement: Measurement = {
      id: Date.now().toString(),
      start,
      end,
      line,
      label,
      distance
    };

    setMeasurements(prev => [...prev, measurement]);
    console.log('✅ Final measurement created:', formatDistance(distance));
  }, [map]);

  // Create a stable event handler using useRef to avoid re-renders
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng || !map) return;
    
    console.log('👆 Map clicked! Event:', event);
    console.log('📍 LatLng:', `${event.latLng.lat()},${event.latLng.lng()}`);
    console.log('📊 Current click count:', clickCountRef.current);
    
    if (clickCountRef.current === 0) {
      // First click
      console.log('🎯 First click - starting measurement');
      firstPointRef.current = event.latLng;
      clickCountRef.current = 1;
      
      // Create temporary line for preview
      const tempLine = new google.maps.Polyline({
        path: [event.latLng, event.latLng],
        geodesic: true,
        strokeColor: '#4F46E5', // Blue
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map: map,
      });
      tempLineRef.current = tempLine;
      console.log('📏 Temporary line created');
      
      // Add mouse move listener for live preview
      if (mouseMoveListenerRef.current) {
        google.maps.event.removeListener(mouseMoveListenerRef.current);
      }
      
      mouseMoveListenerRef.current = google.maps.event.addListener(map, 'mousemove', (moveEvent: google.maps.MapMouseEvent) => {
        if (tempLine && event.latLng && moveEvent.latLng) {
          tempLine.setPath([event.latLng, moveEvent.latLng]);
        }
      });
      console.log('🖱️ Mouse move listener added');
      
    } else if (clickCountRef.current === 1 && firstPointRef.current) {
      // Second click
      console.log('🎯 Second click - completing measurement');
      
      // Remove temporary line
      if (tempLineRef.current) {
        tempLineRef.current.setMap(null);
        tempLineRef.current = null;
      }
      
      // Remove mouse move listener
      if (mouseMoveListenerRef.current) {
        google.maps.event.removeListener(mouseMoveListenerRef.current);
        mouseMoveListenerRef.current = null;
      }
      
      // Create final measurement
      createFinalMeasurement(firstPointRef.current, event.latLng);
      
      // Reset for next measurement
      clickCountRef.current = 0;
      firstPointRef.current = null;
      console.log('🔄 Reset for next measurement');
    }
  }, [map, createFinalMeasurement]);

  const toggleTool = () => {
    console.log('🔧 Distance tool toggle clicked, current state:', isActive);
    setIsActive(!isActive);
  };

  const clearAllMeasurements = () => {
    console.log('🧹 Clearing all measurements');
    measurements.forEach(measurement => {
      measurement.line.setMap(null);
      measurement.label.close();
    });
    setMeasurements([]);
  };

  // Main effect for activating/deactivating the tool
  useEffect(() => {
    if (!map) return;

    if (isActive) {
      console.log('✅ Distance tool activated');
      
      // Store and disable drawing manager
      if (drawingManagerRef.current) {
        console.log('📝 Current drawing mode:', drawingManagerRef.current.getDrawingMode());
        previousDrawingModeRef.current = drawingManagerRef.current.getDrawingMode();
        drawingManagerRef.current.setDrawingMode(null);
        drawingManagerRef.current.setMap(null);
        console.log('❌ Drawing manager disabled and removed');
      }
      
      // Set map options for measurement mode
      map.setOptions({ 
        draggableCursor: 'crosshair',
        disableDoubleClickZoom: true
      });
      
      // Reset state only once when activating
      clickCountRef.current = 0;
      firstPointRef.current = null;
      
      // Clean up any existing temporary line
      if (tempLineRef.current) {
        tempLineRef.current.setMap(null);
        tempLineRef.current = null;
      }
      
      // Clean up any existing listener before adding new one
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
      
      // Add click listener
      clickListenerRef.current = google.maps.event.addListener(map, 'click', handleMapClick);
      console.log('✅ Click listener added successfully');
      
    } else {
      console.log('❌ Distance tool deactivated');
      
      // Clean up all listeners
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
      
      if (mouseMoveListenerRef.current) {
        google.maps.event.removeListener(mouseMoveListenerRef.current);
        mouseMoveListenerRef.current = null;
      }
      
      // Clean up temporary line
      if (tempLineRef.current) {
        tempLineRef.current.setMap(null);
        tempLineRef.current = null;
      }
      
      // Reset map options
      map.setOptions({ 
        draggableCursor: '',
        disableDoubleClickZoom: false
      });
      
      // Restore drawing manager
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(map);
        if (previousDrawingModeRef.current !== null) {
          drawingManagerRef.current.setDrawingMode(previousDrawingModeRef.current);
          console.log('🔄 Restored drawing mode:', previousDrawingModeRef.current);
        }
      }
      
      // Reset state on deactivation
      clickCountRef.current = 0;
      firstPointRef.current = null;
    }

    // Cleanup function
    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
      if (mouseMoveListenerRef.current) {
        google.maps.event.removeListener(mouseMoveListenerRef.current);
      }
      if (tempLineRef.current) {
        tempLineRef.current.setMap(null);
      }
    };
  }, [isActive, map, drawingManagerRef, handleMapClick]);

  if (!map) return null;

  const getStatusText = () => {
    if (!isActive) return null;
    if (clickCountRef.current === 0) return 'Click first point';
    if (clickCountRef.current === 1) return 'Click second point';
    return null;
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Toggle Button */}
      <button
        onClick={toggleTool}
        className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-lg transition-all duration-200 ${
          isActive
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title={isActive ? 'Disable distance measurement' : 'Enable distance measurement'}
      >
        <Ruler className="w-5 h-5" />
      </button>

      {/* Clear All Button */}
      {measurements.length > 0 && (
        <button
          onClick={clearAllMeasurements}
          className="flex items-center justify-center w-10 h-10 rounded-lg shadow-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
          title="Clear all measurements"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Status Indicator */}
      {isActive && (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
          {getStatusText()}
          <div className="text-xs text-gray-500 mt-1">
            Drawing is disabled while measuring
          </div>
        </div>
      )}
    </div>
  );
}; 