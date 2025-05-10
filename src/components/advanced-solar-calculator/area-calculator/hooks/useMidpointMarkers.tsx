
import { useEffect, useRef, useCallback } from 'react';
import { EdgeMidpoint, PolygonInfo } from '../types';

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
  const selectedMidpointIdxRef = useRef<number | null>(null);

  // Create and manage midpoint markers
  useEffect(() => {
    // Clear existing midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      marker.map = null;
    });
    midpointMarkersRef.current = [];
    
    // Only create new markers if we have map and valid polygons
    if (map && window.google && window.google.maps.geometry && window.google.maps.geometry.spherical && window.google.maps.marker) {
      const { spherical } = window.google.maps.geometry;
      const { PinElement } = window.google.maps.marker;
      const newMidpointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      
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
            
            const solarAzimuth = (normalizedHeading + 90) % 360;
            const markerTooltip = `Set Azimuth (${solarAzimuth.toFixed(1)}°)`;
            
            const midpointData: EdgeMidpoint = {
              polygonIndex,
              edgeIndex: i,
              position: { lat: midpointLatLng.lat(), lng: midpointLatLng.lng() },
              heading: solarAzimuth
            };

            const polygonAzimuth = polyInfo.azimuth || 180;
            const isSelected = solarAzimuth === polygonAzimuth;
            const pin = new PinElement({
              scale: isSelected ? 1.2 : 0.7,  
              background: isSelected ? '#FFCC00' : '#FFFF00',
              borderColor: isSelected ? '#FF0000' : '#000000',
              glyphColor: '#000000'
            });

            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: midpointData.position,
              map: map,
              content: pin.element,
              title: markerTooltip,
              zIndex: 3
            });

            const currentMarkerIndex = newMidpointMarkers.length;
            marker.addListener('gmp-click', () => onMidpointClick(midpointData, currentMarkerIndex));
            
            newMidpointMarkers.push(marker);
            
            if (isSelected) {
              selectedMidpointIdxRef.current = currentMarkerIndex;
            }
          }
        }
      });
      
      midpointMarkersRef.current = newMidpointMarkers;
    }
    
    return () => {
      // Cleanup markers when component unmounts
      midpointMarkersRef.current.forEach(marker => {
        marker.map = null;
      });
      midpointMarkersRef.current = [];
    };
  }, [map, polygons, onMidpointClick, layoutAzimuth]);

  // Handle midpoint selection
  const selectMidpointByEdge = useCallback((polygonIndex: number, edgeIndex: number): void => {
    if (!window.google || !window.google.maps.geometry || !window.google.maps.geometry.spherical) {
      return;
    }
    
    if (polygonIndex < 0 || polygonIndex >= polygons.length) {
      return;
    }
    
    const polygon = polygons[polygonIndex].polygon;
    const path = polygon.getPath();
    
    if (edgeIndex < 0 || edgeIndex >= path.getLength()) {
      return;
    }
    
    const { spherical } = window.google.maps.geometry;
    const startPoint = path.getAt(edgeIndex)!;
    const endPoint = path.getAt((edgeIndex + 1) % path.getLength())!;
    const heading = spherical.computeHeading(startPoint, endPoint);
    const normalizedHeading = (heading < 0) ? heading + 360 : heading;
    const solarAzimuth = (normalizedHeading + 90) % 360;
    
    // Find and update the appropriate marker
    midpointMarkersRef.current.forEach((marker, idx) => {
      if (marker.title && marker.title.includes(`Set Azimuth (${solarAzimuth.toFixed(1)}°)`)) {
        const selectedPin = new google.maps.marker.PinElement({
          scale: 1.0,
          background: '#FFCC00',
          borderColor: '#FF0000',
          glyphColor: '#000000'
        });
        marker.content = selectedPin.element;
        selectedMidpointIdxRef.current = idx;
      } else {
        const regularPin = new google.maps.marker.PinElement({
          scale: 0.7,
          background: '#FFFF00',
          borderColor: '#000000',
          glyphColor: '#000000'
        });
        marker.content = regularPin.element;
      }
    });
  }, [polygons]);
  
  return {
    midpointMarkersRef,
    selectedMidpointIdx: selectedMidpointIdxRef.current,
    selectMidpointByEdge
  };
};
