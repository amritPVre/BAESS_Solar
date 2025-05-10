
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseMapStateProps {
  initialLatitude: number;
  initialLongitude: number;
}

export const useMapState = ({ 
  initialLatitude, 
  initialLongitude 
}: UseMapStateProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userMapBounds, setUserMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState({ 
    lat: initialLatitude || 40.7128, 
    lng: initialLongitude || -74.0060 
  });
  const mapInitializedRef = useRef(false);
  const boundsChangeListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  
  // Update center when coordinates change
  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setMapCenter({ lat: initialLatitude, lng: initialLongitude });
    }
  }, [initialLatitude, initialLongitude]);

  // The updateMapCenter function that's debounced
  const updateMapCenter = useCallback(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        setMapCenter({ lat: center.lat(), lng: center.lng() });
      }
    }
  }, []);
  
  // Handle map loading
  const onMapLoaded = useCallback((loadedMap: google.maps.Map) => {
    console.log("Map loaded callback");
    
    // Prevent duplicate initializations
    if (mapInitializedRef.current && mapRef.current === loadedMap) {
      console.log("Map already initialized, skipping");
      return;
    }
    
    mapRef.current = loadedMap;
    mapInitializedRef.current = true;
    
    // Clean up previous listeners to avoid duplicates
    if (boundsChangeListenerRef.current) {
      google.maps.event.removeListener(boundsChangeListenerRef.current);
      boundsChangeListenerRef.current = null;
    }
    
    // Set up bounds change listener only once
    boundsChangeListenerRef.current = loadedMap.addListener('bounds_changed', () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
      
      timeoutIdRef.current = window.setTimeout(() => {
        if (mapRef.current && !mapRef.current.getStreetView().getVisible()) {
          setUserMapBounds(mapRef.current.getBounds() || null);
          updateMapCenter();
        }
        timeoutIdRef.current = null;
      }, 500);
    });
    
  }, [updateMapCenter]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (boundsChangeListenerRef.current && window.google && window.google.maps) {
        google.maps.event.removeListener(boundsChangeListenerRef.current);
      }
      
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    mapRef,
    userMapBounds,
    mapCenter,
    mapInitializedRef,
    updateMapCenter,
    onMapLoaded
  };
};
