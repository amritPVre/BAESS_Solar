
// Type definitions for Google Maps JavaScript API 3.54
// This is a simplified version focusing on what we need

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    getCenter(): LatLng;
    setZoom(zoom: number): void;
    getZoom(): number;
    setMapTypeId(mapTypeId: string): void;
    getMapTypeId(): string;
    getBounds(): LatLngBounds | undefined;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    rotateControl?: boolean;
    fullscreenControl?: boolean;
  }

  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  interface Padding {
    bottom: number;
    left: number;
    right: number;
    top: number;
  }

  interface MapsEventListener {
    remove(): void;
  }

  namespace places {
    class SearchBox {
      constructor(inputField: HTMLInputElement, opts?: SearchBoxOptions);
      getPlaces(): Place[];
      setBounds(bounds: LatLngBounds): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
    }

    interface SearchBoxOptions {
      bounds?: LatLngBounds | LatLngBoundsLiteral;
    }

    interface Place {
      geometry?: {
        location?: LatLng;
        viewport?: LatLngBounds;
      };
      formatted_address?: string;
      name?: string;
    }
  }

  class Geocoder {
    geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: string) => void): void;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
    bounds?: LatLngBounds | LatLngBoundsLiteral;
    componentRestrictions?: GeocoderComponentRestrictions;
    region?: string;
  }

  interface GeocoderComponentRestrictions {
    country: string | string[];
  }

  interface GeocoderResult {
    types: string[];
    formatted_address: string;
    address_components: GeocoderAddressComponent[];
    geometry: GeocoderGeometry;
    partial_match: boolean;
    place_id: string;
  }

  interface GeocoderAddressComponent {
    short_name: string;
    long_name: string;
    types: string[];
  }

  interface GeocoderGeometry {
    location: LatLng;
    location_type: string;
    viewport: LatLngBounds;
    bounds?: LatLngBounds;
  }
}
