import { useEffect, useRef, useCallback } from 'react';
import { PolygonInfo, EdgeDimensionLabel } from '../types';

interface UsePolygonEdgeDimensionsProps {
  polygons: PolygonInfo[];
  map: google.maps.Map | null;
  enabled?: boolean;
}

export const usePolygonEdgeDimensions = ({ 
  polygons, 
  map, 
  enabled = true 
}: UsePolygonEdgeDimensionsProps) => {
  const edgeLabelsRef = useRef<EdgeDimensionLabel[]>([]);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: google.maps.LatLng, point2: google.maps.LatLng): number => {
    if (!window.google?.maps?.geometry?.spherical) {
      console.warn("Google Maps geometry library not available");
      return 0;
    }
    return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
  }, []);

  // Format distance for display
  const formatDistance = useCallback((meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)}km`;
    }
    return `${meters.toFixed(1)}m`;
  }, []);

  // Create edge dimension labels for a single polygon
  const createEdgeLabelsForPolygon = useCallback((polygon: google.maps.Polygon, polygonIndex: number) => {
    if (!map || !polygon) {
      return [];
    }

    const path = polygon.getPath();
    const labels: EdgeDimensionLabel[] = [];

    // Iterate through each edge of the polygon
    for (let i = 0; i < path.getLength(); i++) {
      const currentPoint = path.getAt(i);
      const nextPoint = path.getAt((i + 1) % path.getLength()); // Wrap around to first point for last edge

      // Calculate distance and midpoint
      const distance = calculateDistance(currentPoint, nextPoint);

      if (!window.google?.maps?.geometry?.spherical) {
        continue;
      }

      const midPoint = window.google.maps.geometry.spherical.interpolate(currentPoint, nextPoint, 0.5);

      // Create InfoWindow for the edge dimension with hidden close button
      const label = new google.maps.InfoWindow({
        position: midPoint,
        content: `
          <style>
            .gm-ui-hover-effect { display: none !important; }
            .gm-style-iw-c { padding: 0 !important; }
            .gm-style-iw-d { overflow: hidden !important; }
            .gm-style-iw button { display: none !important; }
          </style>
          <div style="
            padding: 1px 3px; 
            font-size: 11px; 
            font-weight: 800; 
            color: #374151; 
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #cbd5e1;
            border-radius: 2px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            white-space: nowrap;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1;
            min-width: auto;
            margin: 0;
            display: inline-block;
          ">
            ${formatDistance(distance)}
          </div>
        `,
        disableAutoPan: true,
        pixelOffset: new google.maps.Size(0, -1),
        zIndex: 1000
      });

      // Open the label on the map
      label.open(map);

      const edgeLabel: EdgeDimensionLabel = {
        id: `polygon-${polygonIndex}-edge-${i}`,
        polygonIndex,
        edgeIndex: i,
        label,
        distance
      };

      labels.push(edgeLabel);
    }

    return labels;
  }, [map, calculateDistance, formatDistance]);

  // Clear all existing edge labels
  const clearAllEdgeLabels = useCallback(() => {
    edgeLabelsRef.current.forEach(edgeLabel => {
      edgeLabel.label.close();
    });
    edgeLabelsRef.current = [];
  }, []);

  // Create edge labels for all polygons
  const createAllEdgeLabels = useCallback(() => {
    if (!map || !enabled) {
      return;
    }

    clearAllEdgeLabels();

    const newLabels: EdgeDimensionLabel[] = [];

    polygons.forEach((polygonInfo, polygonIndex) => {
      const polygonLabels = createEdgeLabelsForPolygon(polygonInfo.polygon, polygonIndex);
      newLabels.push(...polygonLabels);
    });

    edgeLabelsRef.current = newLabels;
  }, [map, enabled, polygons, createEdgeLabelsForPolygon, clearAllEdgeLabels]);

  // Effect to create/update edge labels when polygons change
  useEffect(() => {
    if (!map || !enabled) {
      clearAllEdgeLabels();
      return;
    }

    if (polygons.length === 0) {
      clearAllEdgeLabels();
      return;
    }

    // Small delay to allow polygon rendering to complete
    const timer = setTimeout(() => {
      createAllEdgeLabels();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [map, enabled, polygons, createAllEdgeLabels, clearAllEdgeLabels]);

  // Effect to handle polygon path changes
  useEffect(() => {
    if (!map || !enabled || polygons.length === 0) return;

    const pathListeners: google.maps.MapsEventListener[] = [];

    polygons.forEach((polygonInfo) => {
      const path = polygonInfo.polygon.getPath();
      
      // Listen for path changes to update labels
      const updateLabels = () => {
        // Debounce updates to avoid excessive re-rendering
        setTimeout(() => {
          createAllEdgeLabels();
        }, 300);
      };

      const listeners = [
        google.maps.event.addListener(path, 'set_at', updateLabels),
        google.maps.event.addListener(path, 'insert_at', updateLabels),
        google.maps.event.addListener(path, 'remove_at', updateLabels),
        google.maps.event.addListener(polygonInfo.polygon, 'dragend', updateLabels),
        google.maps.event.addListener(polygonInfo.polygon, 'mouseup', updateLabels)
      ];

      pathListeners.push(...listeners);
    });

    return () => {
      pathListeners.forEach(listener => {
        google.maps.event.removeListener(listener);
      });
    };
  }, [map, enabled, polygons, createAllEdgeLabels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllEdgeLabels();
    };
  }, [clearAllEdgeLabels]);

  return {
    edgeLabels: edgeLabelsRef.current,
    clearAllEdgeLabels,
    createAllEdgeLabels
  };
};
