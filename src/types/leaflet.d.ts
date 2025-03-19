
// Type definitions for Leaflet
declare module 'leaflet' {
  export function map(id: string, options?: MapOptions): Map;
  
  export class Map {
    setView(center: LatLngExpression, zoom: number): this;
    setZoom(zoom: number): this;
    on(type: string, fn: (e: any) => void): this;
    off(type: string, fn?: (e: any) => void): this;
    invalidateSize(options?: boolean | { animate?: boolean; pan?: boolean }): this;
    getContainer(): HTMLElement;
    remove(): this;
    getSize(): Point;
    getCenter(): LatLng;
    getZoom(): number;
    dragging: Handler;
    doubleClickZoom: Handler;
    scrollWheelZoom: Handler;
    eachLayer(fn: (layer: Layer) => void): this;
    removeLayer(layer: Layer): this;
    getPane(name: string): HTMLElement | undefined;
  }
  
  export class Handler {
    enabled(): boolean;
    enable(): this;
    disable(): this;
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
    equals(otherLatLng: LatLng, maxMargin?: number): boolean;
    toString(): string;
    distanceTo(otherLatLng: LatLng): number;
  }
  
  export class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
    add(point: Point): Point;
    subtract(point: Point): Point;
    divideBy(num: number): Point;
    multiplyBy(num: number): Point;
  }
  
  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
  
  export interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
    [key: string]: any;
  }
  
  export class TileLayer extends Layer {
    constructor(urlTemplate: string, options?: TileLayerOptions);
    addTo(map: Map): this;
  }
  
  export function marker(latlng: LatLngExpression, options?: MarkerOptions): Marker;
  
  export interface MarkerOptions {
    icon?: Icon;
    draggable?: boolean;
    keyboard?: boolean;
    title?: string;
    alt?: string;
    opacity?: number;
    [key: string]: any;
  }
  
  export class Marker extends Layer {
    constructor(latlng: LatLngExpression, options?: MarkerOptions);
    addTo(map: Map): this;
    bindPopup(content: string | HTMLElement | Function | Popup): this;
    openPopup(): this;
    getLatLng(): LatLng;
    setLatLng(latlng: LatLngExpression): this;
  }
  
  export function icon(options: IconOptions): Icon;
  
  export interface IconOptions {
    iconUrl: string;
    iconSize?: Point | [number, number];
    iconAnchor?: Point | [number, number];
    popupAnchor?: Point | [number, number];
    shadowUrl?: string;
    shadowSize?: Point | [number, number];
    shadowAnchor?: Point | [number, number];
    className?: string;
    [key: string]: any;
  }
  
  export class Icon {
    constructor(options: IconOptions);
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    createShadow(oldIcon?: HTMLElement): HTMLElement;
  }
  
  export class Layer {
    addTo(map: Map): this;
    remove(): this;
    removeFrom(map: Map): this;
    bindPopup(content: string | HTMLElement | Function | Popup, options?: PopupOptions): this;
    openPopup(latlng?: LatLngExpression): this;
    closePopup(): this;
    on(type: string, fn: (e: any) => void, context?: any): this;
    off(type: string, fn?: (e: any) => void, context?: any): this;
  }
  
  export interface PopupOptions {
    maxWidth?: number;
    minWidth?: number;
    maxHeight?: number;
    keepInView?: boolean;
    closeButton?: boolean;
    className?: string;
    [key: string]: any;
  }
  
  export class Popup extends Layer {
    constructor(options?: PopupOptions, source?: Layer);
    setLatLng(latlng: LatLngExpression): this;
    setContent(content: string | HTMLElement): this;
    openOn(map: Map): this;
  }
  
  export namespace control {
    export function layers(baseLayers?: Record<string, Layer>, overlays?: Record<string, Layer>, options?: ControlOptions): Control.Layers;
    export function zoom(options?: ControlOptions): Control.Zoom;
    export function scale(options?: ControlOptions): Control.Scale;
    export function attribution(options?: ControlOptions): Control.Attribution;
  }
  
  export namespace Control {
    export class Layers extends Control {
      constructor(baseLayers?: Record<string, Layer>, overlays?: Record<string, Layer>, options?: ControlOptions);
      addBaseLayer(layer: Layer, name: string): this;
      addOverlay(layer: Layer, name: string): this;
      removeLayer(layer: Layer): this;
    }
    
    export class Zoom extends Control {
      constructor(options?: ControlOptions);
    }
    
    export class Scale extends Control {
      constructor(options?: ControlOptions);
    }
    
    export class Attribution extends Control {
      constructor(options?: ControlOptions);
      setPrefix(prefix: string): this;
      addAttribution(text: string): this;
      removeAttribution(text: string): this;
    }
  }
  
  export class Control {
    constructor(options?: ControlOptions);
    static extend(props: any): typeof Control;
    addTo(map: Map): this;
    remove(): this;
    getPosition(): string;
    setPosition(position: string): this;
  }
  
  export interface ControlOptions {
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    [key: string]: any;
  }
}
