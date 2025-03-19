
// Type definitions for Leaflet
declare module 'leaflet' {
  export function map(id: string, options?: MapOptions): Map;
  
  export class Map {
    setView(center: LatLngExpression, zoom: number): this;
    setZoom(zoom: number): this;
    on(type: string, fn: (e: any) => void): this;
    off(type: string, fn?: (e: any) => void): this;
    invalidateSize(options?: { animate?: boolean }): this;
    getContainer(): HTMLElement;
    remove(): this;
    getSize(): Point;
    getCenter(): LatLng;
    getZoom(): number;
    dragging: any;
    doubleClickZoom: any;
    scrollWheelZoom: any;
  }
  
  export interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomControl?: boolean;
    attributionControl?: boolean;
    [key: string]: any;
  }
  
  export interface LatLngExpression {
    lat: number;
    lng: number;
  }
  
  export class LatLng {
    constructor(lat: number, lng: number);
    lat: number;
    lng: number;
  }
  
  export class Point {
    x: number;
    y: number;
  }
  
  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
  
  export interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
    [key: string]: any;
  }
  
  export class TileLayer {
    addTo(map: Map): this;
  }
  
  export function marker(latlng: LatLngExpression, options?: MarkerOptions): Marker;
  
  export interface MarkerOptions {
    icon?: Icon;
    [key: string]: any;
  }
  
  export class Marker {
    addTo(map: Map): this;
    bindPopup(content: string): this;
  }
  
  export function icon(options: IconOptions): Icon;
  
  export interface IconOptions {
    iconUrl: string;
    iconSize?: number[];
    iconAnchor?: number[];
    popupAnchor?: number[];
    [key: string]: any;
  }
  
  export class Icon {
    [key: string]: any;
  }
  
  export class Control {
    static Search: any;
  }
}
