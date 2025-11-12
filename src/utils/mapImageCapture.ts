/**
 * Utility functions for capturing Google Maps as images
 */

export interface MapImageCaptureOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Captures a Google Map as a base64 image
 */
export const captureMapAsImage = async (
  map: google.maps.Map,
  options: MapImageCaptureOptions = {}
): Promise<string | null> => {
  try {
    const {
      width = 800,
      height = 600,
      format = 'png',
      quality = 0.9
    } = options;

    // Wait for map to be idle (all tiles loaded)
    await new Promise<void>((resolve) => {
      const listener = google.maps.event.addListener(map, 'idle', () => {
        google.maps.event.removeListener(listener);
        resolve();
      });
      
      // Trigger idle event if map is already idle
      setTimeout(() => {
        google.maps.event.removeListener(listener);
        resolve();
      }, 1000);
    });

    // Get the map div element
    const mapDiv = map.getDiv();
    if (!mapDiv) {
      console.error('Map div not found');
      return null;
    }

    // Use html2canvas to capture the map
    const html2canvas = await import('html2canvas');
    
    const canvas = await html2canvas.default(mapDiv, {
      width,
      height,
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Convert to base64
    const imageData = canvas.toDataURL(`image/${format}`, quality);
    
    console.log('Map image captured successfully');
    return imageData;
    
  } catch (error) {
    console.error('Error capturing map image:', error);
    return null;
  }
};

/**
 * Captures map with a specific bounds to ensure all PV areas are visible
 */
export const captureMapWithBounds = async (
  map: google.maps.Map,
  bounds: google.maps.LatLngBounds,
  options: MapImageCaptureOptions = {}
): Promise<string | null> => {
  try {
    // Store current map state
    const originalCenter = map.getCenter();
    const originalZoom = map.getZoom();

    // Fit map to bounds
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Wait for map to settle
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Capture the image
    const imageData = await captureMapAsImage(map, options);

    // Restore original map state
    if (originalCenter && originalZoom) {
      map.setCenter(originalCenter);
      map.setZoom(originalZoom);
    }

    return imageData;
    
  } catch (error) {
    console.error('Error capturing map with bounds:', error);
    return null;
  }
};

/**
 * Creates bounds that encompass all polygons
 */
export const createBoundsFromPolygons = (polygons: google.maps.Polygon[]): google.maps.LatLngBounds | null => {
  if (!polygons || polygons.length === 0) {
    return null;
  }

  const bounds = new google.maps.LatLngBounds();
  
  polygons.forEach(polygon => {
    const path = polygon.getPath();
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }
  });

  return bounds;
}; 