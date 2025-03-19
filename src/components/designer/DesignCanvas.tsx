import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DesignCanvasProps {
  activeTool: "select" | "building" | "panel" | "delete";
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ activeTool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<fabric.Rect | null>(null);
  
  // Initialize Google Maps
  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        window.initMap = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    // Initialize map
    const initializeMap = () => {
      if (!mapRef.current) return;
      
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
      
      setMapLoaded(true);
      toast.success("Map loaded successfully");
    };
    
    loadGoogleMaps();
  }, []);
  
  // Initialize canvas after map is loaded
  useEffect(() => {
    if (!mapLoaded || !canvasRef.current) return;
    
    const canvasInstance = new fabric.Canvas(canvasRef.current, {
      width: mapRef.current?.clientWidth || 800,
      height: mapRef.current?.clientHeight || 600,
      backgroundColor: 'rgba(0,0,0,0)',
      selection: true,
      fireRightClick: true,
    });
    
    // Ensure canvas matches map dimensions
    const resizeCanvas = () => {
      if (!canvasInstance || !mapRef.current) return;
      
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
      
      canvasInstance.setWidth(width);
      canvasInstance.setHeight(height);
      canvasInstance.renderAll();
    };
    
    // Set initial size and add resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setCanvas(canvasInstance);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvasInstance.dispose();
    };
  }, [mapLoaded]);
  
  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    
    // Clear any ongoing operations
    isDrawingRef.current = false;
    startPointRef.current = null;
    
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
    } else {
      canvas.off("mouse:down", deleteObject);
    }
    
    // Set up drawing tools
    if (activeTool === "building" || activeTool === "panel") {
      canvas.on("mouse:down", startDrawing);
      canvas.on("mouse:move", drawObject);
      canvas.on("mouse:up", finishDrawing);
    } else {
      canvas.off("mouse:down", startDrawing);
      canvas.off("mouse:move", drawObject);
      canvas.off("mouse:up", finishDrawing);
    }
    
    return () => {
      if (canvas) {
        canvas.off("mouse:down", startDrawing);
        canvas.off("mouse:move", drawObject);
        canvas.off("mouse:up", finishDrawing);
        canvas.off("mouse:down", deleteObject);
      }
    };
  }, [activeTool, canvas]);
  
  // Snap point to grid
  const snapToGrid = (point: { x: number; y: number }, gridSize = 20) => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  };
  
  // Start drawing
  const startDrawing = (options: fabric.IEvent) => {
    if (!canvas || !options.pointer) return;
    
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
    
    // Show toast to provide feedback on what tool is being used
    toast.info(`Drawing ${activeTool === "building" ? "building" : "solar panel"}...`);
  };
  
  // Draw object while mouse moves
  const drawObject = (options: fabric.IEvent) => {
    if (!canvas || !isDrawingRef.current || !startPointRef.current || !tempRectRef.current || !options.pointer) {
      return;
    }
    
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
  const finishDrawing = () => {
    if (!canvas || !isDrawingRef.current || !tempRectRef.current) {
      return;
    }
    
    if (tempRectRef.current.width > 0 && tempRectRef.current.height > 0) {
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
        objectType: activeTool === "building" ? "building" : "panel",
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
        const areaInSquareMeters = calculatePanelArea(finalRect.width, finalRect.height);
        toast.success(`Solar panel placed: ${areaInSquareMeters.toFixed(1)} m² (${estimateKwCapacity(areaInSquareMeters).toFixed(2)} kW)`);
      } else {
        toast.success("Building created");
      }
    }
    
    // Clean up temporary rectangle
    canvas.remove(tempRectRef.current);
    tempRectRef.current = null;
    
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    canvas.renderAll();
  };
  
  // Delete object
  const deleteObject = (options: fabric.IEvent) => {
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
  
  return (
    <div className="design-canvas-container relative w-full h-[600px] overflow-hidden rounded-md border-2 border-gray-200 shadow-sm">
      {/* Map search controls */}
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
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
      
      {/* Canvas overlay */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
      />
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md shadow-sm text-sm text-gray-600">
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#7f8c8d] mr-2 rounded-sm"></span>
          Building
        </p>
        <p className="flex items-center">
          <span className="inline-block w-3 h-3 bg-[#2980b9] mr-2 rounded-sm"></span>
          Solar Panel
        </p>
      </div>
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-solar" />
            <p className="mt-2 text-solar-dark">Loading map...</p>
          </div>
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
