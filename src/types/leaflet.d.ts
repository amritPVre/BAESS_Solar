
import * as L from 'leaflet';

// Extend the HTMLElement interface to include _leaflet_id
declare global {
  interface HTMLElement {
    _leaflet_id?: number;
  }
}

// Extend the Leaflet Map type
declare module 'leaflet' {
  interface Map {
    _leaflet_id?: number;
    _container?: HTMLElement;
    _mapPane?: HTMLElement;
    _panes?: {
      [key: string]: HTMLElement;
    };
  }
  
  interface Layer {
    _leaflet_id?: number;
  }
  
  interface Marker {
    _leaflet_id?: number;
  }
  
  interface TileLayer {
    _leaflet_id?: number;
  }
}
