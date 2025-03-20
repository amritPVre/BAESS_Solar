
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
    }

    namespace control {
      interface DrawConstructorOptions {
        draw?: any;
        edit?: any;
      }

      class Draw extends L.Control {
        constructor(options?: DrawConstructorOptions);
      }
    }
  }
}
