/**
 * Utility functions for capturing Google Maps as images
 */

export interface MapCaptureOptions {
  format?: 'png' | 'jpeg';
  quality?: number; // For JPEG format (0-1)
  maxWidth?: number;
  maxHeight?: number;
}

export interface CaptureMetadata {
  totalCapacity?: number;
  moduleCount?: number;
  totalArea?: number;
  structureType?: string;
  timestamp?: Date;
}

/**
 * Get the Google Maps API key from the script tag
 */
const getGoogleMapsApiKey = (): string => {
  const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
  for (const script of scripts) {
    const src = (script as HTMLScriptElement).src;
    const match = src.match(/key=([^&]+)/);
    if (match) {
      return match[1];
    }
  }
  return '';
};

/**
 * Capture satellite background using Google Static Maps API
 */
const captureStaticMapBackground = async (
  map: google.maps.Map,
  width: number,
  height: number
): Promise<HTMLImageElement> => {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const apiKey = getGoogleMapsApiKey();
  
  if (!center || !zoom || !apiKey) {
    throw new Error('Missing map center, zoom, or API key');
  }
  
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${center.lat()},${center.lng()}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&maptype=satellite` +
    `&key=${apiKey}`;
  
  console.log("🛰️ Fetching satellite image from Static Maps API...");
  console.log("📍 URL:", staticMapUrl);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log("✅ Static map image loaded successfully");
      resolve(img);
    };
    img.onerror = (error) => {
      console.error("❌ Failed to load static map image:", error);
      reject(new Error('Failed to load static map image'));
    };
    img.src = staticMapUrl;
  });
};

/**
 * Capture module overlay with transparent background
 */
const captureModuleOverlay = async (
  mapContainer: HTMLElement,
  width: number,
  height: number
): Promise<HTMLCanvasElement> => {
  const html2canvas = await import('html2canvas');
  
  console.log("🧩 Capturing module overlay with enhanced settings...");
  return html2canvas.default(mapContainer, {
    backgroundColor: null, // Force transparent background
    removeContainer: false,
    width: width,
    height: height,
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: false,
    ignoreElements: (element) => {
      const classList = element.classList;
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute('role');
      const style = (element as HTMLElement).style?.cssText || '';
      
      // More aggressive filtering - only keep module elements
      
      // Remove all Google Maps UI elements
      if (classList.contains('gm-control-active') || 
          classList.contains('gmnoprint') ||
          classList.contains('gm-style-cc') ||
          classList.contains('gmnoscreen') ||
          classList.contains('gm-bundled-control') ||
          classList.contains('gm-fullscreen-control') ||
          tagName === 'iframe') {
        console.log("🚫 Filtering out UI element:", tagName, classList.toString());
        return true;
      }
      
      // Remove map tiles and imagery layers
      if (tagName === 'img') {
        const imgElement = element as HTMLImageElement;
        if (imgElement.src?.includes('maps.googleapis.com') ||
            imgElement.src?.includes('maps.google.com') ||
            style.includes('position: absolute')) {
          console.log("🚫 Filtering out map tile:", imgElement.src);
          return true;
        }
      }
      
      // Remove canvas elements that are not module-related
      if (tagName === 'canvas' && !classList.contains('module-canvas')) {
        console.log("🚫 Filtering out non-module canvas");
        return true;
      }
      
      // Keep SVG elements (modules are usually SVG)
      if (tagName === 'svg' || element.closest('svg')) {
        console.log("✅ Keeping SVG element (likely module)");
        return false;
      }
      
      // Keep elements that look like modules (polygons, rectangles)
      if (tagName === 'div' && (
          style.includes('polygon') ||
          style.includes('rectangle') ||
          classList.contains('module') ||
          classList.contains('solar')
        )) {
        console.log("✅ Keeping module element");
        return false;
      }
      
      return false; // Keep by default unless explicitly filtered
    },
    onclone: (clonedDoc) => {
      console.log("🔄 Processing cloned document for transparency...");
      
      // Set body background to transparent
      const body = clonedDoc.body;
      if (body) {
        body.style.backgroundColor = 'transparent';
        body.style.background = 'transparent';
      }
      
      // Make map container transparent
      const mapDiv = clonedDoc.querySelector('[data-map="true"], .leaflet-container, [class*="map"]');
      if (mapDiv instanceof HTMLElement) {
        mapDiv.style.backgroundColor = 'transparent';
        mapDiv.style.background = 'transparent';
      }
    }
  });
};

/**
 * Create a fallback satellite-like background if Static Maps API fails
 */
const createFallbackBackground = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Create a realistic-looking satellite view background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#2a5b38');  // Dark forest green
  gradient.addColorStop(0.3, '#3e6b46'); // Medium green
  gradient.addColorStop(0.7, '#567d46'); // Olive green
  gradient.addColorStop(1, '#4a6b3d');  // Dark olive
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add texture for natural terrain appearance
  ctx.globalAlpha = 0.3;
  
  // Draw random "fields" with different shades
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const w = Math.random() * 120 + 30;
    const h = Math.random() * 120 + 30;
    
    ctx.fillStyle = i % 2 === 0 ? '#5c7548' : '#3a5c2c';
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
  }
  
  ctx.globalAlpha = 1.0;
};

/**
 * Capture the map with modules overlaid on satellite background
 */
export const captureMapAsImage = async (
  map: google.maps.Map,
  options: MapCaptureOptions = {}
): Promise<string | null> => {
  try {
    console.log("📸 Starting map capture with satellite background...");
    
    const {
      format = 'png',
      quality = 1.0,
      maxWidth = 800,
      maxHeight = 600
    } = options;

    // Get the map container
    const mapContainer = map.getDiv();
    if (!mapContainer) {
      throw new Error('Map container not found');
    }

    const width = Math.min(mapContainer.offsetWidth, maxWidth);
    const height = Math.min(mapContainer.offsetHeight, maxHeight);
    
    console.log("📏 Map container dimensions:", { width, height });
    
    // Create the final canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    try {
      // Step 1: Get satellite background from Static Maps API
      const satelliteImage = await captureStaticMapBackground(map, width, height);
      console.log("🛰️ Drawing satellite background...");
      ctx.drawImage(satelliteImage, 0, 0, width, height);
      console.log("✅ Satellite background drawn successfully");
    } catch (error) {
      console.warn("⚠️ Static Maps API failed, using fallback background:", error);
      createFallbackBackground(finalCanvas);
    }
    
    // Step 2: Capture and overlay modules with improved settings
    console.log("🧩 Capturing module overlay with enhanced transparency...");
    const moduleOverlay = await captureModuleOverlay(mapContainer, width, height);
    
    // Step 3: Combine layers with proper blending
    console.log("🔄 Overlaying modules on satellite background...");
    
    // Set blending mode to ensure modules show on top but preserve transparency
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(moduleOverlay, 0, 0);
    
    console.log("✅ Module overlay applied successfully");
    
    // Step 4: Add a subtle border for a polished look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // Convert to data URL
    const dataUrl = finalCanvas.toDataURL(
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    );
    
    console.log("🎉 Capture completed successfully!");
    return dataUrl;
    
  } catch (error) {
    console.error("❌ Map capture failed:", error);
    return null;
  }
};

/**
 * Main capture function with metadata
 */
export const captureMapWithMetadata = async (
  map: google.maps.Map,
  metadata: CaptureMetadata = {},
  options: MapCaptureOptions = {}
): Promise<string> => {
  try {
    console.log("🚀 Starting map capture with metadata");
    console.log("📊 Metadata:", metadata);
    
    const dataUrl = await captureMapAsImage(map, options);
    
    if (!dataUrl) {
      throw new Error('Failed to capture map image');
    }

    // Add metadata text to the image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load captured image'));
      img.src = dataUrl;
    });
    
    // Create a canvas to add metadata
    const metadataCanvas = document.createElement('canvas');
    metadataCanvas.width = img.width;
    metadataCanvas.height = img.height + 40; // Extra space for metadata text
    
    const ctx = metadataCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for metadata');
    }
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Add metadata text at the bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, img.height, img.width, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    const capacityText = metadata.totalCapacity ? 
      `${metadata.totalCapacity.toFixed(2)} kW` : 'N/A';
    const moduleText = metadata.moduleCount ? 
      `${metadata.moduleCount} modules` : 'N/A';
      
    ctx.fillText(`Capacity: ${capacityText} | Modules: ${moduleText}`, 10, img.height + 25);
    
    // Convert to data URL with metadata
    const finalDataUrl = metadataCanvas.toDataURL(
      'image/png',
      0.9
    );

    // Download the image
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `solar-installation-${timestamp}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = finalDataUrl;
    link.click();
    
    console.log("📥 Map image download initiated:", filename);
    
    // Return the actual image data URL for display purposes
    return finalDataUrl;
    
  } catch (error) {
    console.error("❌ Map capture with metadata failed:", error);
    throw error;
  }
}; 

/**
 * Hybrid approach: Static Maps for background + Canvas overlay for all modules
 */
export const captureMapWithHybridApproach = async (
  map: google.maps.Map,
  polygons: google.maps.Polygon[],
  moduleShapes: (google.maps.Rectangle | google.maps.Polygon)[],
  metadata: CaptureMetadata = {},
  options: MapCaptureOptions = {}
): Promise<string> => {
  try {
    console.log("🎨 Starting Hybrid Approach: Static Maps + Canvas overlay...");
    
    // IMPROVED: Calculate optimal bounds based on PV installation area + padding
    // Instead of using current map bounds, frame the image around the actual PV installation
    
    const rawZoom = map.getZoom();
    // CRITICAL: Round zoom level because Google Static Maps API doesn't support fractional zooms
    // This prevents coordinate mismatch when map has fractional zoom (e.g., 19.26 -> 19)
    const zoom = Math.round(rawZoom || 18);
    const apiKey = getGoogleMapsApiKey();

    if (!zoom || !apiKey) {
      throw new Error('Missing zoom or API key');
    }

    console.log(`🎯 Zoom handling: Raw zoom ${rawZoom} → Rounded zoom ${zoom} for Static Maps API`);
    if (Math.abs(rawZoom - zoom) > 0.01) {
      console.warn(`⚠️ Significant zoom rounding: ${rawZoom} → ${zoom}`);
    }

    // Step 1: Calculate the bounding box of all PV modules for optimal framing
    let installationBounds: google.maps.LatLngBounds | null = null;
    
    if (moduleShapes.length > 0) {
      console.log("📏 Calculating optimal bounds from PV modules...");
      
      for (const shape of moduleShapes) {
        let shapeBounds: google.maps.LatLngBounds | null = null;
        
        // Handle both Rectangle and Polygon types
        if (shape instanceof google.maps.Rectangle) {
          shapeBounds = shape.getBounds();
        } else if (shape instanceof google.maps.Polygon) {
          const path = shape.getPath();
          if (path && path.getLength() > 0) {
            shapeBounds = new google.maps.LatLngBounds();
            for (let i = 0; i < path.getLength(); i++) {
              shapeBounds.extend(path.getAt(i));
            }
          }
        }
        
        if (shapeBounds) {
          if (!installationBounds) {
            installationBounds = shapeBounds;
          } else {
            installationBounds = installationBounds.union(shapeBounds);
          }
        }
      }
    }
    
    // Fall back to polygon bounds if no modules
    if (!installationBounds && polygons.length > 0) {
      console.log("📏 Falling back to polygon bounds...");
      for (const polygon of polygons) {
        const path = polygon.getPath();
        if (path) {
          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            if (!installationBounds) {
              installationBounds = new google.maps.LatLngBounds(point, point);
            } else {
              installationBounds.extend(point);
            }
          }
        }
      }
    }
    
    // Use current map bounds as final fallback
    if (!installationBounds) {
      console.log("📏 Using current map bounds as fallback...");
      installationBounds = map.getBounds();
      if (!installationBounds) {
        throw new Error('Could not determine any bounds for capture');
      }
    }
    
    // Step 2: Add FIXED 100-meter padding around the installation (zoom-independent)
    const paddingMeters = 100; // Fixed 100 meters of padding on each side
    
    // Convert fixed padding to degrees
    const centerLat = installationBounds.getCenter().lat();
    const paddingLatDegreesPerMeter = 1 / 111319.9; // Standard conversion
    const paddingLngDegreesPerMeter = paddingLatDegreesPerMeter / Math.cos(centerLat * Math.PI / 180);
    const latPadding = paddingMeters * paddingLatDegreesPerMeter;
    const lngPadding = paddingMeters * paddingLngDegreesPerMeter;
    
    // Create padded bounds with fixed geographic padding
    const installationNE = installationBounds.getNorthEast();
    const installationSW = installationBounds.getSouthWest();
    
    const paddedSW = new google.maps.LatLng(
      installationSW.lat() - latPadding,
      installationSW.lng() - lngPadding
    );
    const paddedNE = new google.maps.LatLng(
      installationNE.lat() + latPadding,
      installationNE.lng() + lngPadding
    );
    
    const paddedBounds = new google.maps.LatLngBounds(paddedSW, paddedNE);
    
    // Step 3: USE STATIC MAPS IMAGE DIMENSIONS DIRECTLY
    // The key insight: Use whatever Google Static Maps returns and preserve its aspect ratio
    // This eliminates scaling distortion completely
    
    // We'll determine canvas size after we get the static maps image
    // For now, just calculate the geographic ranges
    const canvasLatRange = paddedNE.lat() - paddedSW.lat();
    const canvasLngRange = paddedNE.lng() - paddedSW.lng();
    const canvasGeographicAspectRatio = canvasLngRange / canvasLatRange;
    
    // Use the center of the padded installation area for consistent framing
    const center = paddedBounds.getCenter();
    
    // Use a reasonable zoom level that provides good detail without being too close
    // We'll let Google Static Maps determine the optimal scale based on our requested area
    const finalZoom = Math.max(10, Math.min(20, Math.round(zoom)));
    
    console.log("📐 Optimal framing calculation:", {
      installationBounds: {
        sw: `${installationSW.lat().toFixed(8)},${installationSW.lng().toFixed(8)}`,
        ne: `${installationNE.lat().toFixed(8)},${installationNE.lng().toFixed(8)}`
      },
             paddingInfo: {
         paddingMeters: paddingMeters.toFixed(2),
         paddingDegrees: {
           lat: latPadding.toFixed(8),
           lng: lngPadding.toFixed(8)
         }
       },
      paddedBounds: {
        sw: `${paddedSW.lat().toFixed(8)},${paddedSW.lng().toFixed(8)}`,
        ne: `${paddedNE.lat().toFixed(8)},${paddedNE.lng().toFixed(8)}`
      },
      optimalCenter: `${center.lat().toFixed(8)},${center.lng().toFixed(8)}`
    });

    console.log("📊 Direct Image Dimensions Approach:", { 
      polygons: polygons.length,
      modules: moduleShapes.length,
      center: `${center.lat().toFixed(6)},${center.lng().toFixed(6)}`,
      originalZoom: zoom,
      optimalZoom: finalZoom,
      paddingMeters: paddingMeters,
      bounds: {
        latRange: canvasLatRange.toFixed(8),
        lngRange: canvasLngRange.toFixed(8),
        geographicAspectRatio: canvasGeographicAspectRatio.toFixed(3)
      },
      approach: "Will use exact Static Maps image dimensions to eliminate scaling distortion"
    });

    // Step 1: Get satellite background with installation areas (no modules)
    // CRITICAL: Use exact same center/zoom as current map view
    console.log("🛰️ Step 1: Fetching satellite background with exact map parameters...");
    
    // Get the current map bounds to ensure exact alignment
    const currentBounds = map.getBounds();
    if (!currentBounds) {
      throw new Error('Could not get current map bounds');
    }
    
    const boundsNE = currentBounds.getNorthEast();
    const boundsSW = currentBounds.getSouthWest();
    
    // Use exact same center/zoom as the current map view for perfect alignment
    // Use geographic aspect ratio to determine static map dimensions
    const staticMapSize = 640; // Max reliable size for Google Static Maps
    const staticMapHeight = Math.round(staticMapSize / canvasGeographicAspectRatio);
    
    let backgroundUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.lat()},${center.lng()}` +
      `&zoom=${finalZoom}` +
      `&size=${staticMapSize}x${staticMapHeight}` +
      `&maptype=satellite` +
      `&scale=2` + // High resolution
      `&key=${apiKey}`;

    console.log("🎯 Exact map replication approach:", {
      currentMapView: {
        center: `${center.lat().toFixed(6)},${center.lng().toFixed(6)}`,
        zoom: zoom,
        bounds: {
          sw: `${boundsSW.lat().toFixed(6)},${boundsSW.lng().toFixed(6)}`,
          ne: `${boundsNE.lat().toFixed(6)},${boundsNE.lng().toFixed(6)}`
        }
      },
      staticMapRequest: {
        size: `${staticMapSize}x${staticMapHeight}`,
        scale: 2
      },
      targetCanvas: "Will use actual Static Maps image dimensions",
      approach: "Exact map view replication with guaranteed size"
    });

    // Add only installation area polygons to background (orange outlines)
    polygons.forEach((polygon, index) => {
      try {
        const path = polygon.getPath();
        if (path && path.getLength() > 0) {
          const points = path.getArray().map(point => 
            `${point.lat().toFixed(6)},${point.lng().toFixed(6)}`
          ).join('|');
          
          // Orange outline for installation areas, with a transparent fill
          backgroundUrl += `&path=color:0xff6600|fillcolor:0x00000000|weight:2|${points}`;
          console.log(`✅ Added installation area ${index + 1} to background`);
        }
      } catch (error) {
        console.error(`❌ Failed to add polygon ${index + 1} to background:`, error);
      }
    });

    console.log("📥 Loading satellite background image...");

    // Load the satellite background
    const backgroundImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log(`✅ Background loaded: ${img.width}x${img.height}`);
        resolve(img);
      };
      
      img.onerror = (error) => {
        console.error("❌ Failed to load background:", error);
        reject(new Error('Failed to load satellite background'));
      };
      
      img.src = backgroundUrl;
    });

    // Step 2: Create canvas using the EXACT Static Maps image dimensions
    console.log("🎨 Step 2: Creating canvas using exact image dimensions...");
    
    // CRITICAL FIX: Use the actual Static Maps image dimensions to preserve scale accuracy
    const canvasWidth = backgroundImage.width;
    const canvasHeight = backgroundImage.height;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the satellite background WITHOUT scaling (1:1 ratio)
    ctx.drawImage(backgroundImage, 0, 0);
    console.log(`✅ Satellite background drawn at original size: ${backgroundImage.width}x${backgroundImage.height} (no scaling distortion)`);

    // Step 3: Calculate EXACT bounds of the captured satellite image using Mercator projection
    console.log("🟣 Step 3: Calculating exact image bounds using Mercator projection...");
    
    const projection = map.getProjection();
    if (!projection) {
      throw new Error("Could not get map projection. Map might not be fully initialized.");
    }
    
    // Use the same center and zoom that we passed to the Static Maps API
    const staticCenter = center; // This is paddedBounds.getCenter()
    const staticZoom = finalZoom;
    const actualImageWidth = backgroundImage.width;
    const actualImageHeight = backgroundImage.height;
    const targetCanvasWidth = canvas.width;
    const targetCanvasHeight = canvas.height;

    const scale = Math.pow(2, staticZoom);
    const centerPoint = projection.fromLatLngToPoint(staticCenter);

    if (!centerPoint) {
      throw new Error("Could not convert center LatLng to world coordinates.");
    }

    // CRITICAL FIX: The projection must be based on the *requested* dimensions (e.g., 640x482),
    // not the final scaled image dimensions (e.g., 1280x964). The `scale=2` parameter gives more pixels
    // for the *same geographic area*.
    const baseWidthForProjection = staticMapSize; // This was 640 in the request
    const baseHeightForProjection = staticMapHeight; // This was calculated for the request

    console.log(`🧠 Using base dimensions for projection: ${baseWidthForProjection}x${baseHeightForProjection}`);


    // Calculate the top-left and bottom-right points in world coordinates using BASE dimensions
    const topLeftPoint = new google.maps.Point(
      centerPoint.x - (baseWidthForProjection / 2) / scale,
      centerPoint.y - (baseHeightForProjection / 2) / scale
    );

    const bottomRightPoint = new google.maps.Point(
      centerPoint.x + (baseWidthForProjection / 2) / scale,
      centerPoint.y + (baseHeightForProjection / 2) / scale
    );

    // Convert these points back to LatLng coordinates
    // topLeftPoint corresponds to North-West
    // bottomRightPoint corresponds to South-East
    const imageBoundsNW = projection.fromPointToLatLng(topLeftPoint);
    const imageBoundsSE = projection.fromPointToLatLng(bottomRightPoint);

    if (!imageBoundsNW || !imageBoundsSE) {
      throw new Error("Could not convert world coordinates back to LatLng.");
    }

    // Correctly construct the South-West and North-East corners from the projected corners
    // SW corner has the latitude of the SE corner and longitude of the NW corner
    const imageBoundsSW = new google.maps.LatLng(imageBoundsSE.lat(), imageBoundsNW.lng());
    // NE corner has the latitude of the NW corner and longitude of the SE corner
    const imageBoundsNE = new google.maps.LatLng(imageBoundsNW.lat(), imageBoundsSE.lng());


    console.log("🗺️ Calculated Image Bounds (from projection):", {
      sw: `${imageBoundsSW.lat().toFixed(8)},${imageBoundsSW.lng().toFixed(8)}`,
      ne: `${imageBoundsNE.lat().toFixed(8)},${imageBoundsNE.lng().toFixed(8)}`
    });

    // Use these new, accurate bounds for drawing the modules
    const ne = imageBoundsNE;
    const sw = imageBoundsSW;
    const latRange = ne.lat() - sw.lat();
    const lngRange = ne.lng() - sw.lng();

    // With this method, aspect ratio compensation is no longer needed.
    // The pixel ratios should now be perfectly aligned with the image.
    const pixelPerLat = targetCanvasHeight / latRange;
    const pixelPerLng = targetCanvasWidth / lngRange;

    const geographicAspect = lngRange / latRange;
    const imageAspect = targetCanvasWidth / targetCanvasHeight;

    console.log("📐 Coordinate conversion setup (Projection-based):", {
      canvasSize: `${targetCanvasWidth}x${targetCanvasHeight}`,
      imageBounds: {
        sw: `${sw.lat().toFixed(8)},${sw.lng().toFixed(8)}`,
        ne: `${ne.lat().toFixed(8)},${ne.lng().toFixed(8)}`
      },
      ranges: {
        latRange: latRange.toFixed(8),
        lngRange: lngRange.toFixed(8)
      },
      pixelRatios: {
        pixelPerLat: pixelPerLat.toFixed(2),
        pixelPerLng: pixelPerLng.toFixed(2)
      },
      aspectRatios: {
        geographic: geographicAspect.toFixed(4),
        image: imageAspect.toFixed(4),
        delta: (Math.abs(geographicAspect - imageAspect) / geographicAspect * 100).toFixed(2) + '%'
      },
      note: "Using projection-derived bounds should eliminate distortion."
    });
    
    // Set module drawing style for vibrant appearance
    ctx.fillStyle = 'rgba(59, 130, 246, 0.20)';   // Vibrant blue with low (20%) opacity to see roof details
    ctx.strokeStyle = 'rgba(29, 78, 216, 1)';     // A slightly darker solid blue for the border (Tailwind blue-700)
    ctx.lineWidth = 1.2;

    let modulesDrawn = 0;
    let modulesSkipped = 0;

    moduleShapes.forEach((shape, index) => {
      try {
        let shapeBounds: google.maps.LatLngBounds | null = null;
        
        // Handle both Rectangle and Polygon types
        if (shape instanceof google.maps.Rectangle) {
          shapeBounds = shape.getBounds();
        } else if (shape instanceof google.maps.Polygon) {
          const path = shape.getPath();
          if (path && path.getLength() > 0) {
            shapeBounds = new google.maps.LatLngBounds();
            for (let i = 0; i < path.getLength(); i++) {
              shapeBounds.extend(path.getAt(i));
            }
          }
        }
        
        if (!shapeBounds) {
          modulesSkipped++;
          return;
        }

        // Handle drawing differently for Rectangle vs Polygon
        if (shape instanceof google.maps.Rectangle) {
          // For rectangles, use the existing bounding box approach
          const rectNE = shapeBounds.getNorthEast();
          const rectSW = shapeBounds.getSouthWest();

          const x1 = (rectSW.lng() - sw.lng()) * pixelPerLng;
          const y1 = (ne.lat() - rectNE.lat()) * pixelPerLat; // Flip Y axis
          const x2 = (rectNE.lng() - sw.lng()) * pixelPerLng;
          const y2 = (ne.lat() - rectSW.lat()) * pixelPerLat; // Flip Y axis

          const width = x2 - x1;
          const height = y2 - y1;

          // Only draw if the module is visible on canvas
          if (x1 >= -width && x1 <= canvas.width + width && 
              y1 >= -height && y1 <= canvas.height + height) {
            
            // Draw filled rectangle
            ctx.fillRect(x1, y1, width, height);
            // Draw border
            ctx.strokeRect(x1, y1, width, height);
            
            modulesDrawn++;
          } else {
            modulesSkipped++;
          }

          // Log progress for first few modules
          if (index < 5) {
            console.log(`📍 Rectangle Module ${index + 1}: (${x1.toFixed(1)},${y1.toFixed(1)}) ${width.toFixed(1)}x${height.toFixed(1)}`);
          }
        } else if (shape instanceof google.maps.Polygon) {
          // For polygons, draw the actual polygon path to preserve rotation
          const path = shape.getPath();
          if (path && path.getLength() > 0) {
            const points: {x: number, y: number}[] = [];
            let allPointsVisible = false;
            
            // Convert all polygon vertices to pixel coordinates
            for (let i = 0; i < path.getLength(); i++) {
              const point = path.getAt(i);
              const x = (point.lng() - sw.lng()) * pixelPerLng;
              const y = (ne.lat() - point.lat()) * pixelPerLat; // Flip Y axis
              points.push({ x, y });
            }
            
            // Check if any part of the polygon is visible
            const minX = Math.min(...points.map(p => p.x));
            const maxX = Math.max(...points.map(p => p.x));
            const minY = Math.min(...points.map(p => p.y));
            const maxY = Math.max(...points.map(p => p.y));
            
            if (maxX >= 0 && minX <= canvas.width && maxY >= 0 && minY <= canvas.height) {
              // Draw the polygon
              ctx.beginPath();
              ctx.moveTo(points[0].x, points[0].y);
              for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
              }
              ctx.closePath();
              
              // Fill and stroke the polygon
              ctx.fill();
              ctx.stroke();
              
              modulesDrawn++;
              allPointsVisible = true;
            } else {
              modulesSkipped++;
            }

            // Log progress for first few modules
            if (index < 5) {
              console.log(`📍 Polygon Module ${index + 1}: ${points.length} vertices, visible: ${allPointsVisible}`);
              if (points.length > 0) {
                console.log(`    First vertex: (${points[0].x.toFixed(1)},${points[0].y.toFixed(1)})`);
              }
            }
          } else {
            modulesSkipped++;
          }
        }
  } catch (error) {
        console.error(`❌ Failed to draw module ${index + 1}:`, error);
        modulesSkipped++;
      }
    });

    console.log(`🎯 Module drawing complete: ${modulesDrawn} drawn, ${modulesSkipped} skipped`);
    console.log(`🔧 Module rendering breakdown: Rectangles vs Polygons handled properly`);

    // Step 4: Add metadata bar
    console.log("📊 Step 4: Adding metadata bar...");
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height + 50; // Extra space for metadata
    const finalCtx = finalCanvas.getContext('2d');
    
    if (!finalCtx) {
      throw new Error('Failed to get final canvas context');
    }

    // Draw the hybrid result
    finalCtx.drawImage(canvas, 0, 0);

    // Add metadata bar
    finalCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    finalCtx.fillRect(0, canvas.height, canvas.width, 50);
    
    finalCtx.fillStyle = 'white';
    finalCtx.font = '14px Arial';
    finalCtx.textAlign = 'left';
    
    const capacityText = metadata.totalCapacity ? 
      `${metadata.totalCapacity.toFixed(2)} kW` : 'N/A';
    const moduleText = metadata.moduleCount ? 
      `${metadata.moduleCount} modules` : 'N/A';
    const drawnText = `${modulesDrawn} modules rendered`;
      
    finalCtx.fillText(`Capacity: ${capacityText} | Modules: ${moduleText} | ${drawnText}`, 15, canvas.height + 30);

    // Step 5: Download the final image
    console.log("📥 Step 5: Downloading hybrid result...");
    
    const dataUrl = finalCanvas.toDataURL('image/png', 0.9);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `solar-installation-hybrid-${timestamp}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    
    console.log("🎉 Hybrid approach completed successfully!");
    console.log("📥 Downloaded:", filename);
    console.log("📊 Final stats:", {
      backgroundSize: `${backgroundImage.width}x${backgroundImage.height}`,
      modulesTotal: moduleShapes.length,
      modulesDrawn: modulesDrawn,
      modulesSkipped: modulesSkipped
    });
    
    // Return the actual image data URL for display purposes
    return dataUrl;
    
  } catch (error) {
    console.error("❌ Hybrid approach failed:", error);
    throw error;
  }
};

/**
 * Test and validate a Static Maps API URL
 */
export const validateStaticMapsUrl = async (map: google.maps.Map): Promise<boolean> => {
  try {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const apiKey = getGoogleMapsApiKey();

    if (!center || !zoom || !apiKey) {
      console.error("❌ Missing basic map data for validation");
      return false;
    }

    // Test simple satellite URL first
    const testUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.lat()},${center.lng()}` +
      `&zoom=${zoom}` +
      `&size=400x400` +
      `&maptype=satellite` +
      `&key=${apiKey}`;

    console.log("🧪 Testing basic Static Maps API URL...");
    
    const response = await fetch(testUrl, { method: 'HEAD' });
    console.log("📊 Response status:", response.status);
    console.log("📋 Response headers:", [...response.headers.entries()]);
    
    if (response.ok) {
      console.log("✅ Static Maps API is working correctly");
      return true;
    } else {
      console.error(`❌ Static Maps API validation failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Static Maps API validation error:", error);
    return false;
  }
};

/**
 * Test function to download only satellite background (for debugging)
 */
export const testDownloadSatelliteOnly = async (
  map: google.maps.Map,
  options: MapCaptureOptions = {}
): Promise<void> => {
  try {
    console.log("🧪 Testing satellite background download...");
    
    const {
      maxWidth = 800,
      maxHeight = 600
    } = options;

    // Get the map container
    const mapContainer = map.getDiv();
    if (!mapContainer) {
      throw new Error('Map container not found');
    }

    const width = Math.min(mapContainer.offsetWidth, maxWidth);
    const height = Math.min(mapContainer.offsetHeight, maxHeight);
    
    console.log("📏 Dimensions for satellite test:", { width, height });
    
    // Get satellite background only
    const satelliteImage = await captureStaticMapBackground(map, width, height);
    console.log("🛰️ Satellite image captured for test");
    
    // Create a canvas just for the satellite image
    const testCanvas = document.createElement('canvas');
    testCanvas.width = width;
    testCanvas.height = height;
    const ctx = testCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Draw only the satellite image
    ctx.drawImage(satelliteImage, 0, 0, width, height);
    
    // Add a test label
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('SATELLITE TEST ONLY', 15, 30);
    
    // Convert to data URL and download
    const dataUrl = testCanvas.toDataURL('image/png', 0.9);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `satellite-test-${timestamp}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    
    console.log("🎉 Satellite test image downloaded:", filename);
    
  } catch (error) {
    console.error("❌ Satellite test failed:", error);
    throw error;
  }
};

/**
 * Debug function to test complete capture workflow step by step
 */
export const debugCaptureWorkflow = async (
  map: google.maps.Map,
  options: MapCaptureOptions = {}
): Promise<void> => {
  try {
    console.log("🐛 DEBUG: Starting complete capture workflow...");
    
    const {
      maxWidth = 800,
      maxHeight = 600
    } = options;

    const mapContainer = map.getDiv();
    if (!mapContainer) {
      throw new Error('Map container not found');
    }

    const width = Math.min(mapContainer.offsetWidth, maxWidth);
    const height = Math.min(mapContainer.offsetHeight, maxHeight);
    
    console.log("🐛 DEBUG: Dimensions:", { width, height });
    
    // Step 1: Test satellite background
    console.log("🐛 DEBUG: Step 1 - Testing satellite background...");
    const satelliteImage = await captureStaticMapBackground(map, width, height);
    
    // Download satellite only
    const satCanvas = document.createElement('canvas');
    satCanvas.width = width;
    satCanvas.height = height;
    const satCtx = satCanvas.getContext('2d');
    if (satCtx) {
      satCtx.drawImage(satelliteImage, 0, 0, width, height);
      const satDataUrl = satCanvas.toDataURL('image/png');
      
      const link1 = document.createElement('a');
      link1.download = 'debug-step1-satellite.png';
      link1.href = satDataUrl;
      link1.click();
      console.log("🐛 DEBUG: Step 1 complete - satellite downloaded");
    }
    
    // Step 2: Test module overlay
    console.log("🐛 DEBUG: Step 2 - Testing module overlay...");
    const moduleOverlay = await captureModuleOverlay(mapContainer, width, height);
    
    // Download module overlay only
    const modDataUrl = moduleOverlay.toDataURL('image/png');
    const link2 = document.createElement('a');
    link2.download = 'debug-step2-modules.png';
    link2.href = modDataUrl;
    link2.click();
    console.log("🐛 DEBUG: Step 2 complete - module overlay downloaded");
    
    // Step 3: Test combination
    console.log("🐛 DEBUG: Step 3 - Testing combination...");
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (finalCtx) {
      // Draw satellite background
      finalCtx.drawImage(satelliteImage, 0, 0, width, height);
      console.log("🐛 DEBUG: Satellite background drawn");
      
      // Draw module overlay
      finalCtx.globalCompositeOperation = 'source-over';
      finalCtx.drawImage(moduleOverlay, 0, 0);
      console.log("🐛 DEBUG: Module overlay applied");
      
      // Download final combination
      const finalDataUrl = finalCanvas.toDataURL('image/png');
      const link3 = document.createElement('a');
      link3.download = 'debug-step3-combined.png';
      link3.href = finalDataUrl;
      link3.click();
      console.log("🐛 DEBUG: Step 3 complete - combined image downloaded");
    }
    
    console.log("🐛 DEBUG: Complete workflow test finished - check downloads!");
    
  } catch (error) {
    console.error("🐛 DEBUG: Workflow test failed:", error);
    throw error;
  }
};

/**
 * Capture map using Google Static Maps API with encoded paths (like working reference)
 */
export const captureMapWithStaticAPI = async (
  map: google.maps.Map,
  polygons: google.maps.Polygon[],
  moduleRectangles: google.maps.Rectangle[],
  metadata: CaptureMetadata = {},
  options: MapCaptureOptions = {}
): Promise<string> => {
  try {
    console.log("🗺️ Starting Static Maps API capture with enhanced debugging...");
    
    const {
      maxWidth = 640,
      maxHeight = 640
    } = options;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const apiKey = getGoogleMapsApiKey();

    console.log("🔧 DEBUG: Basic validation checks...");
    console.log("📍 Center:", center ? `${center.lat()},${center.lng()}` : "MISSING");
    console.log("🔍 Zoom:", zoom || "MISSING");
    console.log("🗝️ API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");

    if (!center) {
      throw new Error('Map center is null - map may not be initialized');
    }
    if (!zoom) {
      throw new Error('Map zoom is null - map may not be initialized');
    }
    if (!apiKey) {
      throw new Error('Google Maps API key not found in script tags');
    }

    console.log("📊 Data available:", { 
      polygons: polygons.length,
      modules: moduleRectangles.length,
      center: `${center.lat().toFixed(6)},${center.lng().toFixed(6)}`,
      zoom: zoom
    });

    // Build base URL
    let mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.lat()},${center.lng()}` +
      `&zoom=${zoom}` +
      `&size=${maxWidth}x${maxHeight}` +
      `&maptype=satellite` +
      `&key=${apiKey}`;

    console.log("🏗️ Base URL constructed:", mapUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    let pathsAdded = 0;

    // Add installation area polygons (orange outlines)
    console.log("🟠 Processing installation polygons...");
    polygons.forEach((polygon, index) => {
      try {
        const path = polygon.getPath();
        if (path && path.getLength() > 0) {
          const points = path.getArray().map(point => 
            `${point.lat().toFixed(6)},${point.lng().toFixed(6)}`
          ).join('|');
          
          // Orange outline for installation areas with transparent fill
          const pathParam = `&path=color:0xff6600|fillcolor:0x00000000|weight:2|${points}`;
          mapUrl += pathParam;
          pathsAdded++;
          
          console.log(`✅ Polygon ${index + 1}: ${path.getLength()} points added`);
          if (index === 0) {
            console.log(`📍 First polygon sample points: ${points.split('|').slice(0, 3).join(' | ')}...`);
          }
        } else {
          console.warn(`⚠️ Polygon ${index + 1}: Invalid or empty path`);
        }
      } catch (error) {
        console.error(`❌ Failed to process polygon ${index + 1}:`, error);
      }
    });

    // Smart module processing: cluster nearby modules to reduce URL length
    console.log("🟣 Processing module rectangles with smart clustering...");
    const maxUrlLength = 7500; // Conservative limit to avoid 413 errors
    
    // Try different approaches based on module count
    if (moduleRectangles.length <= 50) {
      console.log("📦 Using individual modules (small count)");
      await addIndividualModules();
    } else if (moduleRectangles.length <= 200) {
      console.log("🧩 Using module clustering (medium count)");
      await addClusteredModules();
    } else {
      console.log("🎯 Using adaptive grid representation (large count)");
      await addGridRepresentation();
    }
    
    async function addIndividualModules() {
      let moduleCount = 0;
      let skippedModules = 0;
      
      for (let index = 0; index < moduleRectangles.length; index++) {
        const rectangle = moduleRectangles[index];
        
        try {
          const bounds = rectangle.getBounds();
          if (bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const nw = new google.maps.LatLng(ne.lat(), sw.lng());
            const se = new google.maps.LatLng(sw.lat(), ne.lng());
            
            const points = [
              `${sw.lat().toFixed(6)},${sw.lng().toFixed(6)}`,
              `${se.lat().toFixed(6)},${se.lng().toFixed(6)}`,
              `${ne.lat().toFixed(6)},${ne.lng().toFixed(6)}`,
              `${nw.lat().toFixed(6)},${nw.lng().toFixed(6)}`,
              `${sw.lat().toFixed(6)},${sw.lng().toFixed(6)}`
            ].join('|');
            
            const pathParam = `&path=color:0x6366f1|fillcolor:0x6366f199|weight:1|${points}`;
            
            if (mapUrl.length + pathParam.length > maxUrlLength) {
              console.warn(`⚠️ Stopping at module ${index + 1} - URL length limit reached`);
              skippedModules = moduleRectangles.length - index;
              break;
            }
            
            mapUrl += pathParam;
            pathsAdded++;
            moduleCount++;
            
            if (index < 5) {
              console.log(`✅ Module ${index + 1}: Rectangle bounds added`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to process module rectangle ${index + 1}:`, error);
        }
      }
      
      if (skippedModules > 0) {
        console.warn(`⚠️ Skipped ${skippedModules} modules due to URL length limits`);
      }
    }
    
    async function addClusteredModules() {
      // Group modules into clusters based on proximity
      const clusters = clusterModules(moduleRectangles, 0.0001); // ~11 meter tolerance
      console.log(`🧩 Created ${clusters.length} clusters from ${moduleRectangles.length} modules`);
      
      let clustersAdded = 0;
      let clustersSkipped = 0;
      
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        try {
          // Create bounding polygon for the cluster
          const clusterBounds = getClusterBounds(cluster);
          const points = clusterBounds.map(point => 
            `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
          ).join('|');
          
          // Use cluster-specific styling
          const pathParam = `&path=color:0x6366f1|fillcolor:0x6366f199|weight:1|${points}`;
          
          if (mapUrl.length + pathParam.length > maxUrlLength) {
            console.warn(`⚠️ Stopping at cluster ${i + 1} - URL length limit reached`);
            clustersSkipped = clusters.length - i;
            break;
          }
          
          mapUrl += pathParam;
          pathsAdded++;
          clustersAdded++;
          
          if (i < 3) {
            console.log(`✅ Cluster ${i + 1}: ${cluster.length} modules grouped`);
          }
        } catch (error) {
          console.error(`❌ Failed to process cluster ${i + 1}:`, error);
        }
      }
      
      console.log(`🎯 Clustering result: ${clustersAdded}/${clusters.length} clusters added`);
      if (clustersSkipped > 0) {
        console.warn(`⚠️ Skipped ${clustersSkipped} clusters due to URL length limits`);
      }
    }
    
    // Helper function to cluster nearby modules
    function clusterModules(rectangles: google.maps.Rectangle[], tolerance: number) {
      const clusters: google.maps.Rectangle[][] = [];
      const processed = new Set<number>();
      
      for (let i = 0; i < rectangles.length; i++) {
        if (processed.has(i)) continue;
        
        const cluster = [rectangles[i]];
        processed.add(i);
        const baseBounds = rectangles[i].getBounds();
        if (!baseBounds) continue;
        
        const baseCenter = baseBounds.getCenter();
        
        // Find nearby modules to group
        for (let j = i + 1; j < rectangles.length; j++) {
          if (processed.has(j)) continue;
          
          const otherBounds = rectangles[j].getBounds();
          if (!otherBounds) continue;
          
          const otherCenter = otherBounds.getCenter();
          const distance = Math.sqrt(
            Math.pow(baseCenter.lat() - otherCenter.lat(), 2) +
            Math.pow(baseCenter.lng() - otherCenter.lng(), 2)
          );
          
          if (distance <= tolerance) {
            cluster.push(rectangles[j]);
            processed.add(j);
          }
        }
        
        clusters.push(cluster);
      }
      
      return clusters;
    }
    
    // Helper function to get cluster boundary points
    function getClusterBounds(cluster: google.maps.Rectangle[]) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      cluster.forEach(rectangle => {
        const bounds = rectangle.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          minLat = Math.min(minLat, sw.lat());
          maxLat = Math.max(maxLat, ne.lat());
          minLng = Math.min(minLng, sw.lng());
          maxLng = Math.max(maxLng, ne.lng());
        }
      });
      
             // Return rectangle corners: SW -> SE -> NE -> NW -> SW (closed)
       return [
         { lat: minLat, lng: minLng }, // SW
         { lat: minLat, lng: maxLng }, // SE  
         { lat: maxLat, lng: maxLng }, // NE
         { lat: maxLat, lng: minLng }, // NW
         { lat: minLat, lng: minLng }  // SW (close)
       ];
     }
     
     async function addGridRepresentation() {
       console.log("🎯 Creating adaptive grid representation...");
       
       // Find the overall bounding box of all modules
       let minLat = Infinity, maxLat = -Infinity;
       let minLng = Infinity, maxLng = -Infinity;
       
       moduleRectangles.forEach(rectangle => {
         const bounds = rectangle.getBounds();
         if (bounds) {
           const ne = bounds.getNorthEast();
           const sw = bounds.getSouthWest();
           
           minLat = Math.min(minLat, sw.lat());
           maxLat = Math.max(maxLat, ne.lat());
           minLng = Math.min(minLng, sw.lng());
           maxLng = Math.max(maxLng, ne.lng());
         }
       });
       
       // Create a grid pattern to represent the module layout
       const gridRows = Math.min(8, Math.ceil(Math.sqrt(moduleRectangles.length / 20))); // Adaptive grid size
       const gridCols = Math.min(10, Math.ceil(moduleRectangles.length / (gridRows * 20)));
       
       const latStep = (maxLat - minLat) / gridRows;
       const lngStep = (maxLng - minLng) / gridCols;
       
       console.log(`📐 Creating ${gridRows}x${gridCols} grid to represent ${moduleRectangles.length} modules`);
       
       let gridPaths = 0;
       
       for (let row = 0; row < gridRows; row++) {
         for (let col = 0; col < gridCols; col++) {
           const cellMinLat = minLat + (row * latStep);
           const cellMaxLat = minLat + ((row + 1) * latStep);
           const cellMinLng = minLng + (col * lngStep);
           const cellMaxLng = minLng + ((col + 1) * lngStep);
           
           // Add some spacing between grid cells for visual separation
           const margin = 0.00002; // Small margin between cells
           const points = [
             `${(cellMinLat + margin).toFixed(6)},${(cellMinLng + margin).toFixed(6)}`, // SW
             `${(cellMinLat + margin).toFixed(6)},${(cellMaxLng - margin).toFixed(6)}`, // SE
             `${(cellMaxLat - margin).toFixed(6)},${(cellMaxLng - margin).toFixed(6)}`, // NE
             `${(cellMaxLat - margin).toFixed(6)},${(cellMinLng + margin).toFixed(6)}`, // NW
             `${(cellMinLat + margin).toFixed(6)},${(cellMinLng + margin).toFixed(6)}`  // SW (close)
           ].join('|');
           
           const pathParam = `&path=color:0x6366f1|fillcolor:0x6366f1aa|weight:1|${points}`;
           
           if (mapUrl.length + pathParam.length > maxUrlLength) {
             console.warn(`⚠️ Grid representation stopped at cell [${row},${col}] - URL limit reached`);
             gridPaths = row * gridCols + col;
             break;
           }
           
           mapUrl += pathParam;
           pathsAdded++;
           gridPaths++;
         }
         
         if (mapUrl.length > maxUrlLength - 200) break; // Stop if getting close to limit
       }
       
       console.log(`🎯 Grid result: Added ${gridPaths} grid cells representing ${moduleRectangles.length} modules`);
     }

    console.log(`🎨 Final URL: ${pathsAdded} paths added (${polygons.length} polygons + modules/clusters)`);
    console.log(`📏 URL length: ${mapUrl.length} characters`);
    
    if (moduleRectangles.length > 50) {
      console.log(`🎯 Used smart clustering for ${moduleRectangles.length} modules`);
    }
    
    // Check URL length (Google has a limit around 8192 characters)
    if (mapUrl.length > 8000) {
      console.warn(`⚠️ URL is still long (${mapUrl.length} chars) - may approach Google limits`);
    } else {
      console.log(`✅ URL length is within safe limits (${mapUrl.length} chars)`);
    }

    // Log the full URL for debugging (with hidden API key)
    console.log("🔗 Full URL (API key hidden):", mapUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    console.log("📥 Attempting to load image from Static Maps API...");

    // Create a temporary image to test the URL
    const testImage = new Image();
    testImage.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("⏰ Timeout: Static Maps API request took too long");
        reject(new Error('Timeout: Static Maps API request took too long (>30s)'));
      }, 30000); // 30 second timeout

      testImage.onload = () => {
        clearTimeout(timeout);
        console.log("✅ Static Maps API image loaded successfully!");
        console.log(`📏 Image dimensions: ${testImage.width}x${testImage.height}`);
        
        try {
          // Create canvas to add metadata
          const canvas = document.createElement('canvas');
          canvas.width = testImage.width;
          canvas.height = testImage.height + 40; // Extra space for metadata
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw the map image
          ctx.drawImage(testImage, 0, 0);
          
          // Add metadata bar
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, testImage.height, testImage.width, 40);
          
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          
          const capacityText = metadata.totalCapacity ? 
            `${metadata.totalCapacity.toFixed(2)} kW` : 'N/A';
          const moduleText = metadata.moduleCount ? 
            `${metadata.moduleCount} modules` : 'N/A';
            
          ctx.fillText(`Capacity: ${capacityText} | Modules: ${moduleText}`, 10, testImage.height + 25);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          
          // Download the image
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `solar-installation-static-${timestamp}.png`;
          
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          link.click();
          
          console.log("🎉 Static Maps API capture completed successfully!");
          console.log("📥 Downloaded:", filename);
          
          // Return the actual image data URL for display purposes
          resolve(dataUrl);
        } catch (canvasError) {
          console.error("❌ Canvas processing failed:", canvasError);
          reject(new Error(`Canvas processing failed: ${canvasError.message}`));
        }
      };
      
      testImage.onerror = (error) => {
        clearTimeout(timeout);
        console.error("❌ Failed to load Static Maps API image");
        console.error("🔗 Failed URL (API key hidden):", mapUrl.replace(apiKey, 'API_KEY_HIDDEN'));
        console.error("📋 Error details:", error);
        
        // Try to provide more specific error information
        fetch(mapUrl, { method: 'HEAD' })
          .then(response => {
            console.error("🌐 HTTP Response Status:", response.status);
            console.error("📊 Response Headers:", [...response.headers.entries()]);
            if (response.status === 403) {
              reject(new Error('403 Forbidden - Check API key permissions and billing'));
            } else if (response.status === 400) {
              reject(new Error('400 Bad Request - Invalid parameters in URL'));
            } else if (response.status === 429) {
              reject(new Error('429 Rate Limited - Too many requests'));
            } else {
              reject(new Error(`HTTP ${response.status} - ${response.statusText}`));
            }
          })
          .catch(fetchError => {
            console.error("🌐 Network error during HEAD request:", fetchError);
            reject(new Error('Failed to load Static Maps API image - Network error'));
          });
      };
      
      console.log("🚀 Setting image source...");
      testImage.src = mapUrl;
    });
    
  } catch (error) {
    console.error("❌ Static Maps API capture failed:", error);
    throw error;
  }
}; 