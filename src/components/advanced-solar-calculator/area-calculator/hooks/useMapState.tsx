
import { useState, useEffect, useRef, useCallback } from 'react';

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
  const isInternalBoundsChangeRef = useRef(false);
  
  // Update center when coordinates change
  useEffect(() => {
    if (initialLatitude && initialLongitude && !mapInitializedRef.current) {
      setMapCenter({ lat: initialLatitude, lng: initialLongitude });
    }
  }, [initialLatitude, initialLongitude]);

  // The updateMapCenter function - with debounce to prevent re-render loops
  const updateMapCenter = useCallback(() => {
    if (!mapRef.current) return;
    
    try {
      const center = mapRef.current.getCenter();
      if (center && !isInternalBoundsChangeRef.current) {
        // Set state only if values have changed
        const newCenter = { lat: center.lat(), lng: center.lng() };
        setMapCenter(prev => {
          if (Math.abs(prev.lat - newCenter.lat) > 0.0001 || 
              Math.abs(prev.lng - newCenter.lng) > 0.0001) {
            return newCenter;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error updating map center:", error);
    }
  }, []);
  
  // Handle map loading with protection against duplicate initializations
  const onMapLoaded = useCallback((loadedMap: google.maps.Map) => {
    console.log("Map loaded callback");
    
    // Prevent duplicate initializations
    if (mapInitializedRef.current && mapRef.current === loadedMap) {
      console.log("Map already initialized, skipping");
      return;
    }
    
    // Store map reference
    mapRef.current = loadedMap;
    mapInitializedRef.current = true;
    
    // Clean up previous listeners to avoid duplicates
    if (boundsChangeListenerRef.current) {
      google.maps.event.removeListener(boundsChangeListenerRef.current);
      boundsChangeListenerRef.current = null;
    }
    
    // Safely add bounds change listener with proper error handling
    if (window.google && window.google.maps && window.google.maps.event) {
      try {
        // Set up bounds change listener only once with strong debounce
        boundsChangeListenerRef.current = loadedMap.addListener('bounds_changed', () => {
          // Clear any pending timeout to prevent rapid updates
          if (timeoutIdRef.current) {
            window.clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
          
          // Debounce bounds updates to once per second
          timeoutIdRef.current = window.setTimeout(() => {
            if (!mapRef.current || mapRef.current.getStreetView().getVisible()) {
              return;
            }
            
            try {
              const bounds = mapRef.current.getBounds();
              if (bounds) {
                setUserMapBounds(bounds);
                updateMapCenter();
              }
            } catch (error) {
              console.error("Error in bounds_changed handler:", error);
            }
            
            timeoutIdRef.current = null;
          }, 1000); // 1 second debounce
        });
        
        console.log("Bounds change listener attached successfully");
      } catch (error) {
        console.error("Error attaching bounds change listener:", error);
      }
    }
  }, [updateMapCenter]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (boundsChangeListenerRef.current && window.google && window.google.maps) {
        google.maps.event.removeListener(boundsChangeListenerRef.current);
        boundsChangeListenerRef.current = null;
      }
      
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Reset initialization flag
      mapInitializedRef.current = false;
      mapRef.current = null;
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
