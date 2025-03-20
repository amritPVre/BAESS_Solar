
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
  }
}
