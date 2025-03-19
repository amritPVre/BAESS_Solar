
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
    eachLayer(fn: (layer: Layer) => void): this;
    removeLayer(layer: Layer): this;
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
  
  export type LatLngExpression = LatLng | [number, number] | {lat: number, lng: number};
  
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
  
  export class TileLayer extends Layer {
    addTo(map: Map): this;
  }
  
  export function marker(latlng: LatLngExpression, options?: MarkerOptions): Marker;
  
  export interface MarkerOptions {
    icon?: Icon;
    [key: string]: any;
  }
  
  export class Marker extends Layer {
    addTo(map: Map): this;
    bindPopup(content: string): this;
    openPopup(): this;
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
  
  export class Layer {
    addTo(map: Map): this;
    remove(): this;
  }
  
  export namespace control {
    export function layers(baseLayers?: Record<string, Layer>, overlays?: Record<string, Layer>, options?: ControlOptions): Control.Layers;
  }
  
  export class Control {
    static Layers: any;
    static Search: any;
    
    static extend(options: any): typeof Control;
    addTo(map: Map): this;
  }
  
  export interface ControlOptions {
    position?: string;
    [key: string]: any;
  }
}
