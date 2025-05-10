
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
  }, []);

  // The bounds change listener with debouncing
  useEffect(() => {
    if (!mapRef.current) return;
    
    let isInternalBoundsChange = false;
    let boundsChangedTimeoutId: number | null = null;
    
    const boundsChangedListener = mapRef.current.addListener('bounds_changed', () => {
      if (
        mapRef.current && 
        !mapRef.current.getStreetView().getVisible() && 
        !isInternalBoundsChange
      ) {
        // Debounce bounds updates to prevent rapid state changes
        if (boundsChangedTimeoutId) {
          window.clearTimeout(boundsChangedTimeoutId);
        }
        
        boundsChangedTimeoutId = window.setTimeout(() => {
          setUserMapBounds(mapRef.current!.getBounds() || null);
          updateMapCenter();
          boundsChangedTimeoutId = null;
        }, 300); // Debounce for 300ms
      }
    });
    
    // Override the fitBounds method to set our flag
    const originalFitBounds = mapRef.current.fitBounds;
    mapRef.current.fitBounds = function(...args) {
      isInternalBoundsChange = true;
      const result = originalFitBounds.apply(this, args);
      
      window.setTimeout(() => {
        isInternalBoundsChange = false;
        updateMapCenter();
      }, 500);
      
      return result;
    };
    
    // Clean up the listener
    return () => {
      if (boundsChangedListener) {
        google.maps.event.removeListener(boundsChangedListener);
      }
      if (boundsChangedTimeoutId) {
        window.clearTimeout(boundsChangedTimeoutId);
      }
      if (mapRef.current) {
        mapRef.current.fitBounds = originalFitBounds;
      }
    };
  }, [updateMapCenter]);

  return {
    mapRef,
    userMapBounds,
    mapCenter,
    mapInitializedRef,
    updateMapCenter,
    onMapLoaded
  };
};
