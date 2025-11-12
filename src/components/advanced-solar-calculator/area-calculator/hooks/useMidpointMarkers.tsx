import { useEffect, useRef, useState, useCallback } from 'react';
import { PolygonInfo, EdgeMidpoint } from '../types';

interface UseMidpointMarkersProps {
  map: google.maps.Map | null;
  polygons: PolygonInfo[];
  selectedPolygonIndex: number | null;
  layoutAzimuth: number;
  onMidpointClick: (midpoint: EdgeMidpoint, markerIndex: number) => void;
}

export const useMidpointMarkers = ({
  map,
  polygons,
  selectedPolygonIndex,
  layoutAzimuth,
  onMidpointClick
}: UseMidpointMarkersProps) => {
  const midpointMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedMidpointIdx, setSelectedMidpointIdx] = useState<number | null>(null);
  
  // To prevent infinite re-renders, store the last processed polygon data
  const lastProcessedPolygonsRef = useRef<string>('');
  const lastSelectedPolygonRef = useRef<number | null>(null);
  const lastLayoutAzimuthRef = useRef<number>(0);
  
  // Memoize the handler function to prevent recreating it on every render
  const handleMidpointClick = useCallback((midpoint: EdgeMidpoint, markerIndex: number) => {
    setSelectedMidpointIdx(markerIndex);
    onMidpointClick(midpoint, markerIndex);
  }, [onMidpointClick]);

  // Helper function to safely remove markers
  const clearMarkers = useCallback(() => {
    if (midpointMarkersRef.current.length > 0) {
      console.log(`Clearing ${midpointMarkersRef.current.length} midpoint markers`);
      
      midpointMarkersRef.current.forEach(marker => {
        if (marker) {
          try {
            // First check if the marker is valid
            if (marker instanceof Object && 'map' in marker) {
              // Use null assignment for cleanup
              marker.map = null;
            }
          } catch (err) {
            console.warn("Error clearing midpoint marker:", err);
          }
        }
      });
      
      // Reset the markers array
      midpointMarkersRef.current = [];
    }
  }, []);

  useEffect(() => {
    // Skip if map is not available or window.google is not defined
    if (!map || !window.google || !window.google.maps.geometry || !window.google.maps.geometry.spherical || !window.google.maps.marker) {
      return;
    }
    
    // Calculate a hash of the current polygon state to compare with the last processed state
    const currentPolygonsHash = JSON.stringify(
      polygons.map(p => ({
        id: p.polygon.getPath().getArray().map(point => `${point.lat()},${point.lng()}`).join('|'),
        azimuth: p.azimuth
      }))
    );
    
    // Check if we need to update the markers
    const needsUpdate = 
      currentPolygonsHash !== lastProcessedPolygonsRef.current ||
      selectedPolygonIndex !== lastSelectedPolygonRef.current ||
      layoutAzimuth !== lastLayoutAzimuthRef.current;
      
    if (!needsUpdate) {
      return; // Skip update if nothing has changed
    }
    
    // Update refs
    lastProcessedPolygonsRef.current = currentPolygonsHash;
    lastSelectedPolygonRef.current = selectedPolygonIndex;
    lastLayoutAzimuthRef.current = layoutAzimuth;
    
    // Clear existing midpoint markers safely
    clearMarkers();
    
    // Skip creation if there are no polygons
    if (polygons.length === 0 || !map) {
      return;
    }
    
    const { spherical } = window.google.maps.geometry;
    const { PinElement } = window.google.maps.marker;
    const newMidpointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    
    try {
      // Process each polygon to create edge midpoint markers
      polygons.forEach((polyInfo, polygonIndex) => {
        const path = polyInfo.polygon.getPath();
        const pathLength = path.getLength();
        
        if (pathLength >= 2) {
          for (let i = 0; i < pathLength; i++) {
            const startPoint = path.getAt(i)!;
            const endPoint = path.getAt((i + 1) % pathLength)!;
            
            const midpointLatLng = new google.maps.LatLng(
              (startPoint.lat() + endPoint.lat()) / 2,
              (startPoint.lng() + endPoint.lng()) / 2
            );
            
            const heading = spherical.computeHeading(startPoint, endPoint);
            const normalizedHeading = (heading < 0) ? heading + 360 : heading;
            
            // Fix the solar azimuth calculation
            // The solar azimuth should be perpendicular to the edge, but in the right direction
            // For a South-facing array (180°), the edge runs East-West
            // For an East-facing array (90°), the edge runs North-South
            let solarAzimuth = (normalizedHeading - 90) % 360; // Changed from +90 to -90
            
            // Ensure azimuth is in range 0-360
            if (solarAzimuth < 0) {
              solarAzimuth += 360;
            }
            
            const markerTooltip = `Set Azimuth (${solarAzimuth.toFixed(1)}°)`;
            
            const midpointData: EdgeMidpoint = {
              polygonIndex,
              edgeIndex: i,
              position: { lat: midpointLatLng.lat(), lng: midpointLatLng.lng() },
              heading: solarAzimuth
            };

            // Determine if this marker should be highlighted
            const polygonAzimuth = polyInfo.azimuth || 180;
            const isSelected = (polygonIndex === selectedPolygonIndex) && 
                              (Math.abs(solarAzimuth - polygonAzimuth) < 1);
            
            const pin = new PinElement({
              scale: isSelected ? 1.2 : 0.7,
              background: isSelected ? '#FFCC00' : '#FFFF00',
              borderColor: isSelected ? '#FF0000' : '#000000',
              glyphColor: '#000000'
            });

            try {
              const marker = new google.maps.marker.AdvancedMarkerElement({
                position: midpointData.position,
                map: map,
                content: pin.element,
                title: markerTooltip,
                zIndex: 3
              });

              const currentMarkerIndex = newMidpointMarkers.length;
              
              // Use a closure to capture the current values for the event handler
              ((mData, mIndex) => {
                marker.addListener('click', () => {
                  handleMidpointClick(mData, mIndex);
                });
              })(midpointData, currentMarkerIndex);
              
              newMidpointMarkers.push(marker);
              
              if (isSelected) {
                setSelectedMidpointIdx(currentMarkerIndex);
              }
            } catch (err) {
              console.warn("Error creating marker:", err);
            }
          }
        }
      });
    
      midpointMarkersRef.current = newMidpointMarkers;
    } catch (err) {
      console.error("Error processing polygons for markers:", err);
    }
    
  }, [map, polygons, selectedPolygonIndex, layoutAzimuth, handleMidpointClick, clearMarkers]);

  // Clean up markers when component unmounts
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    midpointMarkersRef,
    selectedMidpointIdx,
    setSelectedMidpointIdx
  };
};
