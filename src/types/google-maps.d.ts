// Type definitions for Google Maps JavaScript API
declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    setOptions(options: MapOptions): void; // Added this method
    // Add other map methods as needed
  }
  
  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: string;
    tilt?: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    scaleControl?: boolean;
    rotateControl?: boolean;
    fullscreenControl?: boolean;
    streetViewControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string; // Added this property
    draggable?: boolean; // Added this property
    // Add other map options as needed
  }
  
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  
  class Geocoder {
    geocode(request: GeocodeRequest, callback: (results: GeocodeResult[], status: string) => void): void;
  }
  
  interface GeocodeRequest {
    address?: string;
    location?: LatLng;
    placeId?: string;
  }
  
  interface GeocodeResult {
    geometry: {
      location: LatLng;
    };
    formatted_address: string;
    // Add other properties as needed
  }
  
  namespace event {
    function addListenerOnce(instance: any, eventName: string, handler: Function): MapsEventListener;
  }
  
  class MapsEventListener {
    remove(): void;
  }
}
