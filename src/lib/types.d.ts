declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: {
          center: { lat: number; lng: number };
          zoom: number;
        }) => any;
        Marker: new (options: {
          position: { lat: number; lng: number };
          map: any;
          title?: string;
        }) => any;
      };
    };
    T: {
      Map: new (container: string, options: {
        center: T.LngLat;
        zoom: number;
      }) => any & {
        panTo: (lnglat: T.LngLat) => void;
        setZoom: (zoom: number) => void;
        addOverLay: (overlay: any) => void;
        removeOverLay: (overlay: any) => void;
        destroy: () => void;
      };
      Marker: new (position: T.LngLat) => any;
      Label: new (options: {
        text: string;
        position: T.LngLat;
      }) => any;
      LngLat: new (lng: number, lat: number) => any;
    };
  }
}

export {}