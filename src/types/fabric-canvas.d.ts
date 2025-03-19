
// Type definitions for Fabric.js
declare namespace fabric {
  interface IObjectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    selectable?: boolean;
    evented?: boolean;
    objectType?: string;
    [key: string]: any;
  }

  interface ICanvasOptions {
    width?: number;
    height?: number;
    backgroundColor?: string;
    selection?: boolean;
    fireRightClick?: boolean;
    renderOnAddRemove?: boolean;
    stopContextMenu?: boolean;
    [key: string]: any;
  }

  interface IEvent<T = Event> {
    e?: T;
    target?: any;
    pointer?: { x: number; y: number };
    [key: string]: any;
  }

  class Canvas {
    constructor(element: HTMLCanvasElement, options?: ICanvasOptions);
    add(...objects: Object[]): Canvas;
    remove(...objects: Object[]): Canvas;
    getObjects(): Object[];
    setWidth(value: number): Canvas;
    setHeight(value: number): Canvas;
    renderAll(): Canvas;
    dispose(): void;
    selection: boolean;
    defaultCursor: string;
    hoverCursor: string;
    freeDrawingBrush: {
      color: string;
      width: number;
    };
    isDrawingMode: boolean;
    on(event: string, handler: (e: IEvent) => void): Canvas;
    off(event: string, handler?: (e: IEvent) => void): Canvas;
    [key: string]: any;
  }

  class Object {
    set(key: string | object, value?: any): Object;
    get(key: string): any;
    selectable: boolean;
    evented: boolean;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    [key: string]: any;
  }

  class Rect extends Object {
    constructor(options?: IObjectOptions);
    width?: number;
    height?: number;
    [key: string]: any;
  }

  class Text extends Object {
    constructor(text: string, options?: IObjectOptions);
    text: string;
    [key: string]: any;
  }
}
