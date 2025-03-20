
declare module 'leaflet-draw' {
  import * as L from 'leaflet';

  namespace L {
    namespace Draw {
      class Event {
        static CREATED: string;
        static EDITED: string;
        static DELETED: string;
        static DRAWSTART: string;
        static DRAWSTOP: string;
        static DRAWVERTEX: string;
        static EDITSTART: string;
        static EDITMOVE: string;
        static EDITRESIZE: string;
        static EDITVERTEX: string;
        static EDITSTOP: string;
        static DELETESTART: string;
        static DELETESTOP: string;
      }
      
      interface DrawOptions {
        polyline?: boolean | L.PolylineOptions;
        polygon?: boolean | L.PolygonOptions & {
          allowIntersection?: boolean;
          drawError?: {
            color?: string;
            timeout?: number;
            message?: string;
          };
          showArea?: boolean;
        };
        rectangle?: boolean | L.PolylineOptions;
        circle?: boolean | L.CircleOptions;
        marker?: boolean | L.MarkerOptions;
        circlemarker?: boolean | L.CircleMarkerOptions;
      }
      
      interface EditOptions {
        featureGroup: L.FeatureGroup;
        edit?: boolean | {
          selectedPathOptions?: L.PathOptions;
        };
        remove?: boolean;
      }
    }

    namespace control {
      interface DrawConstructorOptions {
        draw?: Draw.DrawOptions;
        edit?: Draw.EditOptions;
      }

      class Draw extends L.Control {
        constructor(options?: DrawConstructorOptions);
      }
    }
  }
}
