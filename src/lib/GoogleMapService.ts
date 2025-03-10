import { IMap, MapOptions, MarkerOptions } from './map-interface';
import { loadMapScript } from './map-config';

export class GoogleMapService implements IMap {
  private map: any = null;
  private markers: Map<string, any> = new Map();
  private infoWindows: Map<string, any> = new Map();
  private locked: boolean = false;
  private labels: Map<string, any> = new Map();

  async init(options: MapOptions): Promise<void> {
    // 动态加载谷歌地图SDK
    await loadMapScript('google');
    const google = (window as any).google;
    const mapOptions = {
      center: { lat: options.center.lat, lng: options.center.lng },
      zoom: options.zoom
    };
    this.map = new google.maps.Map(
      document.getElementById(options.container) as HTMLElement,
      mapOptions
    );
  }

  setCenter(lat: number, lng: number): void {
    if (this.map) {
      this.map.setCenter({ lat, lng });
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  addMarker(lat: number, lng: number, title?: string, onClick?: (marker: any) => void): string {
    if (this.map) {
      const google = (window as any).google;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title
      });
      const id = `marker-${Date.now()}`;
      this.markers.set(id, marker);
      
      if (onClick) {
        marker.addListener('click', () => {
          onClick(marker);
        });
      }
      
      return id;
    }
    return '';
  }
  
  addCustomMarker(options: MarkerOptions): string {
    if (this.map) {
      const google = (window as any).google;
      const markerOptions: any = {
        position: options.position,
        map: this.map,
        title: options.title
      };
      
      // 添加自定义图标
      if (options.icon) {
        markerOptions.icon = options.icon;
      }
      
      const marker = new google.maps.Marker(markerOptions);
      const id = `marker-${Date.now()}`;
      this.markers.set(id, marker);
      
      // 添加信息窗口
      if (options.content) {
        const infoWindow = new google.maps.InfoWindow({
          content: options.content
        });
        this.infoWindows.set(id, infoWindow);
        
        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
          if (options.onClick) {
            options.onClick(marker);
          }
        });
      } else if (options.onClick) {
        marker.addListener('click', () => {
          options.onClick!(marker);
        });
      }
      
      return id;
    }
    return '';
  }

  removeMarker(markerId: string): void {
    if (!this.map) return;
    
    // 获取标记
    const marker = this.markers.get(markerId);
    if (marker) {
      // 在 Google Maps 中，需要调用 setMap(null) 来移除标记
      marker.setMap(null);
      this.markers.delete(markerId);
    }
    
    // 移除标签（如果存在）
    const label = this.labels.get(markerId);
    if (label) {
      label.setMap(null);
      this.labels.delete(markerId);
    }
    
    // 移除信息窗口（如果存在）
    const infoWindow = this.infoWindows.get(markerId);
    if (infoWindow) {
      infoWindow.close();
      this.infoWindows.delete(markerId);
    }
  }
  
  async searchAddress(keyword: string): Promise<Array<{address: string, location: {lat: number, lng: number}}>> {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('Map not initialized'));
        return;
      }
      
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: keyword }, (results: any, status: any) => {
        if (status === 'OK') {
          const locations = results.map((result: any) => {
            return {
              address: result.formatted_address,
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
              }
            };
          });
          resolve(locations);
        } else {
          resolve([]);
        }
      });
    });
  }

  lockMap(): void {
    if (this.map && !this.locked) {
      this.locked = true;
      // 禁用拖动和缩放功能
      this.map.setOptions({
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true
      });
    }
  }

  unlockMap(): void {
    if (this.map && this.locked) {
      this.locked = false;
      // 启用拖动和缩放功能
      this.map.setOptions({
        draggable: true,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false
      });
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  destroy(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.infoWindows.forEach(infoWindow => infoWindow.close());
    this.markers.clear();
    this.infoWindows.clear();
    this.map = null;
  }
}