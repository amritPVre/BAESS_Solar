
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DesignCanvasProps {
  activeTool: "select" | "building" | "panel" | "delete";
  onStatsUpdate?: (stats: {
    totalPanelArea: number;
    estimatedCapacity: number;
    buildingCount: number;
    panelCount: number;
  }) => void;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ 
  activeTool,
  onStatsUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    // Try to get API key from sessionStorage
    return sessionStorage.getItem("gmapsApiKey") || "";
  });
  const [apiKeyEntered, setApiKeyEntered] = useState(() => {
    // Check if API key exists in sessionStorage
    return !!sessionStorage.getItem("gmapsApiKey");
  });
  
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<fabric.Rect | null>(null);
  
  // Initialize Google Maps
  useEffect(() => {
    if (!apiKeyEntered || !apiKey) return;
    
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        // If Google Maps is already loaded
        initializeMap();
        return;
      }
      
      // Remove any existing Google Maps scripts to avoid conflicts
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setMapError("Failed to load Google Maps API. Please check your API key.");
        toast.error("Failed to load Google Maps API. Please check your API key.");
      };
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    };

    // Initialize map
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      try {
        const defaultLocation = { lat: 37.773972, lng: -122.431297 }; // San Francisco
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 20,
          mapTypeId: 'satellite',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative', // This helps with preventing gesture conflicts
          draggable: true // We control this dynamically
        });
        
        // Store map in window for access
        window.solarDesignerMap = map;
        
        // Add search box for locations
        const searchBox = new window.google.maps.places.SearchBox(
          document.getElementById('map-search-input') as HTMLInputElement
        );
        
        // Bias search box to current map bounds
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });
        
        // Listen for search box events
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;
          
          const bounds = new window.google.maps.LatLngBounds();
          places.forEach(place => {
            if (!place.geometry || !place.geometry.location) return;
            
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          
          map.fitBounds(bounds);
          // Zoom in more for better satellite detail
          setTimeout(() => {
            map.setZoom(20);
          }, 500);
        });
        
        // Disable map controls when drawing
        map.addListener('dragstart', () => {
          if (isDrawingRef.current && canvas) {
            map.setOptions({ draggable: false });
          }
        });
        
        setMapLoaded(true);
        setMapError(null);
        toast.success("Map loaded successfully");
        
        // Log successful map creation
        console.log("Map created successfully");
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError("Failed to initialize Google Maps. Please check your API key.");
        toast.error("Failed to initialize Google Maps. Please check your API key.");
      }
    };
    
    loadGoogleMaps();
  }, [apiKey, apiKeyEntered]);
  
  // Initialize canvas after map is loaded
  useEffect(() => {
    if (!mapLoaded || !canvasRef.current) return;
    
    // Make sure the canvas is properly sized and positioned
    if (mapRef.current) {
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      console.log(`Setting canvas size to: ${width}x${height}`);
    }
    
    const canvasInstance = new fabric.Canvas(canvasRef.current, {
      width: mapRef.current?.clientWidth || 800,
      height: mapRef.current?.clientHeight || 600,
      backgroundColor: 'rgba(0,0,0,0)',
      selection: true,
      fireRightClick: true,
      renderOnAddRemove: true,
      stopContextMenu: true // Prevent context menu from opening
    });
    
    // Ensure canvas matches map dimensions
    const resizeCanvas = () => {
      if (!canvasInstance || !mapRef.current) return;
      
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
      
      canvasInstance.setWidth(width);
      canvasInstance.setHeight(height);
      canvasInstance.renderAll();
      
      console.log(`Canvas resized to: ${width}x${height}`);
    };
    
    // Set initial size and add resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setCanvas(canvasInstance);
    
    // Log canvas creation
    console.log("Canvas created successfully", canvasInstance);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvasInstance.dispose();
    };
  }, [mapLoaded]);
  
  // Handle tool changes and set up drawing events
  useEffect(() => {
    if (!canvas) return;
    
    console.log("Tool changed to:", activeTool);
    
    // Clear any ongoing operations
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    // Remove existing event listeners to avoid duplicates
    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    
    // Set selection mode based on active tool
    canvas.selection = activeTool === "select";
    
    // Set object selection mode
    canvas.getObjects().forEach(obj => {
      obj.selectable = activeTool === "select" || activeTool === "delete";
      obj.evented = activeTool === "select" || activeTool === "delete";
    });
    
    // Update cursor based on tool
    const cursorMap = {
      select: "default",
      building: "crosshair",
      panel: "cell",
      delete: "not-allowed"
    };
    canvas.defaultCursor = cursorMap[activeTool];
    canvas.hoverCursor = activeTool === "select" ? "move" : cursorMap[activeTool];
    
    // Set up delete tool
    if (activeTool === "delete") {
      canvas.on("mouse:down", deleteObject);
    }
    
    // Set up drawing tools
    if (activeTool === "building" || activeTool === "panel") {
      // Disable Google Maps dragging when in drawing mode
      if (window.solarDesignerMap) {
        window.solarDesignerMap.setOptions({ draggable: false });
        console.log("Map dragging disabled for drawing mode");
      }
      
      canvas.on("mouse:down", startDrawing);
      canvas.on("mouse:move", drawObject);
      canvas.on("mouse:up", finishDrawing);
      
      console.log("Drawing event listeners added for", activeTool);
    } else {
      // Re-enable Google Maps dragging when not in drawing mode
      if (window.solarDesignerMap) {
        window.solarDesignerMap.setOptions({ draggable: true });
        console.log("Map dragging re-enabled");
      }
    }
    
    canvas.renderAll();
    
    return () => {
      if (canvas) {
        canvas.off("mouse:down");
        canvas.off("mouse:move");
        canvas.off("mouse:up");
      }
    };
  }, [activeTool, canvas]);
  
  // Update stats when objects change
  useEffect(() => {
    if (!canvas || !onStatsUpdate) return;
    
    const updateStats = () => {
      const objects = canvas.getObjects();
      
      // Count buildings and panels
      let buildingCount = 0;
      let panelCount = 0;
      let totalPanelArea = 0;
      
      objects.forEach(obj => {
        // Skip text objects
        if (obj instanceof fabric.Text) return;
        
        const objectType = obj.get('objectType');
        if (objectType === 'building') {
          buildingCount++;
        } else if (objectType === 'panel') {
          panelCount++;
          
          // Calculate panel area if it has width and height
          if (obj.width && obj.height) {
            const area = calculatePanelArea(obj.width, obj.height);
            totalPanelArea += area;
          }
        }
      });
      
      // Calculate estimated capacity
      const estimatedCapacity = estimateKwCapacity(totalPanelArea);
      
      onStatsUpdate({
        totalPanelArea,
        estimatedCapacity,
        buildingCount,
        panelCount
      });
    };
    
    // Add event listeners for object modifications
    canvas.on('object:added', updateStats);
    canvas.on('object:removed', updateStats);
    canvas.on('object:modified', updateStats);
    
    // Initial update
    updateStats();
    
    return () => {
      canvas.off('object:added', updateStats);
      canvas.off('object:removed', updateStats);
      canvas.off('object:modified', updateStats);
    };
  }, [canvas, onStatsUpdate]);
  
  // Snap point to grid
  const snapToGrid = (point: { x: number; y: number }, gridSize = 20) => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  };
  
  // Start drawing
  const startDrawing = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !options.pointer) {
      console.error("Cannot start drawing: Canvas or pointer is null");
      return;
    }
    
    console.log("Starting to draw", activeTool, options.pointer);
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    const pointer = options.pointer;
    const snappedPoint = snapToGrid(pointer);
    
    isDrawingRef.current = true;
    startPointRef.current = snappedPoint;
    
    if (tempRectRef.current) {
      canvas.remove(tempRectRef.current);
    }
    
    // Use more visible colors for buildings and panels
    const fillColor = activeTool === "building" ? 'rgba(149, 165, 166, 0.7)' : 'rgba(52, 152, 219, 0.7)';
    const strokeColor = activeTool === "building" ? '#7f8c8d' : '#2980b9';
    
    const rectOptions = {
      left: snappedPoint.x,
      top: snappedPoint.y,
      width: 0,
      height: 0,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 2,
      selectable: false,
      evented: false,
    };
    
    tempRectRef.current = new fabric.Rect(rectOptions);
    canvas.add(tempRectRef.current);
    canvas.renderAll();
    
    // Show toast to provide feedback on what tool is being used
    toast.info(`Drawing ${activeTool === "building" ? "building" : "solar panel"}...`);
  };
  
  // Draw object while mouse moves
  const drawObject = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !isDrawingRef.current || !startPointRef.current || !tempRectRef.current || !options.pointer) {
      return;
    }
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    console.log("Drawing in progress", options.pointer);
    
    const pointer = options.pointer;
    const snappedPoint = snapToGrid(pointer);
    
    const width = Math.abs(snappedPoint.x - startPointRef.current.x);
    const height = Math.abs(snappedPoint.y - startPointRef.current.y);
    
    // Update rectangle size, keeping the starting corner fixed
    tempRectRef.current.set({
      width: width,
      height: height,
      left: Math.min(startPointRef.current.x, snappedPoint.x),
      top: Math.min(startPointRef.current.y, snappedPoint.y),
    });
    
    canvas.renderAll();
  };
  
  // Finish drawing
  const finishDrawing = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !isDrawingRef.current || !tempRectRef.current) {
      console.error("Cannot finish drawing: Missing canvas, drawing state, or temp rectangle");
      return;
    }
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    console.log("Finishing drawing", tempRectRef.current);
    
    if (tempRectRef.current.width && tempRectRef.current.height && 
        tempRectRef.current.width > 0 && tempRectRef.current.height > 0) {
      // Use more visible colors for buildings and panels
      const fillColor = activeTool === "building" ? 'rgba(149, 165, 166, 0.7)' : 'rgba(52, 152, 219, 0.7)';
      const strokeColor = activeTool === "building" ? '#7f8c8d' : '#2980b9';
      
      // Create the actual object
      const objectOptions = {
        left: tempRectRef.current.left,
        top: tempRectRef.current.top,
        width: tempRectRef.current.width,
        height: tempRectRef.current.height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        selectable: activeTool === "select",
      };
      
      const finalRect = new fabric.Rect(objectOptions);
      finalRect.set('objectType', activeTool === "building" ? "building" : "panel");
      canvas.add(finalRect);
      
      // Add a label to identify the object type
      const label = new fabric.Text(activeTool === "building" ? "Building" : "Solar Panel", {
        left: tempRectRef.current.left + 5,
        top: tempRectRef.current.top + 5,
        fontSize: 12,
        fill: activeTool === "building" ? '#333333' : '#ffffff',
        selectable: false,
        evented: false,
      });
      canvas.add(label);
      
      // Calculate area if it's a solar panel
      if (activeTool === "panel") {
        const areaInSquareMeters = calculatePanelArea(finalRect.width || 0, finalRect.height || 0);
        toast.success(`Solar panel placed: ${areaInSquareMeters.toFixed(1)} m² (${estimateKwCapacity(areaInSquareMeters).toFixed(2)} kW)`);
      } else {
        toast.success("Building created");
      }
    }
    
    // Clean up temporary rectangle
    if (tempRectRef.current) {
      canvas.remove(tempRectRef.current);
      tempRectRef.current = null;
    }
    
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    canvas.renderAll();
  };
  
  // Delete object
  const deleteObject = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || activeTool !== "delete") return;
    
    const target = options.target;
    if (target) {
      const objectType = target.get('objectType') || "Object";
      canvas.remove(target);
      toast.success(`${objectType} deleted`);
      canvas.renderAll();
    }
  };
  
  // Helper function to calculate solar panel area (approximate)
  const calculatePanelArea = (widthPixels: number, heightPixels: number): number => {
    // Assuming 1 pixel = 0.05 meters at zoom level 20 (approximate)
    const scaleFactor = 0.05;
    return widthPixels * heightPixels * scaleFactor * scaleFactor;
  };
  
  // Estimate kW capacity based on area
  const estimateKwCapacity = (areaInSquareMeters: number): number => {
    // Rough estimate: 1 kW requires about 7 m² of space
    return areaInSquareMeters / 7;
  };
  
  // Handle address search
  const handleSearchAddress = () => {
    if (!address.trim() || !window.solarDesignerMap) return;
    
    setSearchingAddress(true);
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      setSearchingAddress(false);
      
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        window.solarDesignerMap.setCenter(location);
        window.solarDesignerMap.setZoom(20); // Zoom in for better detail
        toast.success(`Location found: ${results[0].formatted_address}`);
      } else {
        toast.error(`Could not find location: ${status}`);
      }
    });
  };
  
  // Handle API key submission
  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid Google Maps API key");
      return;
    }
    
    // Save API key to sessionStorage
    sessionStorage.setItem("gmapsApiKey", apiKey);
    setApiKeyEntered(true);
    toast.success("API key saved");
  };
  
  return (
    <div className="design-canvas-container relative w-full h-[600px] overflow-hidden rounded-md border-2 border-gray-200 shadow-sm">
      {!apiKeyEntered ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white z-20">
          <div className="max-w-md w-full space-y-4 text-center">
            <h3 className="text-lg font-medium">Google Maps API Key Required</h3>
            <p className="text-sm text-muted-foreground">
              To use the Solar Designer tool, you need a Google Maps API key with Maps JavaScript API and Places API enabled.
            </p>
            <div className="flex flex-col space-y-3">
              <Input
                type="text"
                placeholder="Enter your Google Maps API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleApiKeySubmit}>
                Apply API Key
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              <p>To get an API key:</p>
              <ol className="text-left list-decimal pl-5 mt-2 space-y-1">
                <li>Go to the <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
                <li>Create a project or select an existing one</li>
                <li>Enable the Maps JavaScript API and Places API</li>
                <li>Create an API key and copy it here</li>
              </ol>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Map search controls */}
      {apiKeyEntered && (
        <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded-md shadow-sm flex gap-2 items-center">
          <input
            id="map-search-input"
            type="text"
            placeholder="Enter location or address"
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-60"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
          />
          <Button 
            size="sm" 
            onClick={handleSearchAddress}
            disabled={searchingAddress}
          >
            {searchingAddress ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Search
          </Button>
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
      
      {/* Canvas overlay */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-auto z-10"
      />
      
      {/* Drawing mode indicator */}
      {apiKeyEntered && mapLoaded && activeTool !== 'select' && (
        <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-md shadow-sm text-sm z-20 animate-pulse">
          Drawing Mode: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md shadow-sm text-sm text-gray-600 z-10">
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#7f8c8d] mr-2 rounded-sm"></span>
          Building
        </p>
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#2980b9] mr-2 rounded-sm"></span>
          Solar Panel
        </p>
      </div>
      
      {/* Error display */}
      {mapError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-800 p-2 text-sm z-10">
          {mapError}
        </div>
      )}
      
      {/* Loading indicator */}
      {apiKeyEntered && !mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-solar" />
            <p className="mt-2 text-solar-dark">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Active tool indicator */}
      {apiKeyEntered && mapLoaded && (
        <div className="absolute top-2 right-2 bg-white p-2 rounded-md shadow-sm text-sm z-10">
          <p className="font-medium">
            Active Tool: <span className="text-solar">{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</span>
          </p>
        </div>
      )}
      
      {/* Instructions overlay when drawing mode is active */}
      {apiKeyEntered && mapLoaded && (activeTool === 'building' || activeTool === 'panel') && (
        <div className="absolute top-14 right-2 bg-yellow-50 p-2 rounded-md shadow-sm text-sm z-10 border border-yellow-200 max-w-xs">
          <p className="font-medium text-yellow-800">Drawing Instructions:</p>
          <ol className="text-xs text-yellow-700 list-decimal pl-4 mt-1 space-y-1">
            <li>Click and drag to draw a {activeTool === 'building' ? 'building' : 'solar panel'}</li>
            <li>Release mouse button to finish</li>
            <li>Use the Select tool to move or resize later</li>
          </ol>
        </div>
      )}
    </div>
  );
};

// Add Window interface extension for Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
    solarDesignerMap: google.maps.Map;
  }
}
