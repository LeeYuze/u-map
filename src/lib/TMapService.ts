import { IMap, MapOptions, MarkerOptions } from './map-interface';
import { loadMapScript } from './map-config';

export class TMapService implements IMap {
  private map: any = null;
  private markers: Map<string, any> = new Map();
  private labels: Map<string, any> = new Map();
  private infoWindows: Map<string, any> = new Map();
  private locked: boolean = false;

  async init(options: MapOptions): Promise<void> {
    // 动态加载天地图SDK
    await loadMapScript('tianditu');
    const T = (window as any).T;
    this.map = new T.Map(options.container, {
      center: new T.LngLat(options.center.lng, options.center.lat),
      zoom: options.zoom
    });
  }

  setCenter(lat: number, lng: number): void {
    if (this.map) {
      const T = (window as any).T;
      this.map.panTo(new T.LngLat(lng, lat));
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  addMarker(lat: number, lng: number, title?: string, onClick?: (marker: any) => void): string {
    if (this.map) {
      const T = (window as any).T;
      const marker = new T.Marker(new T.LngLat(lng, lat));
      const id = `marker-${Date.now()}`;
      
      if (title) {
        const label = new T.Label({
          text: title,
          position: new T.LngLat(lng, lat)
        });
        this.map.addOverLay(label);
        this.labels.set(id, label);
      }
      
      this.map.addOverLay(marker);
      this.markers.set(id, marker);
      
      if (onClick) {
        marker.addEventListener('click', () => {
          onClick(marker);
        });
      }
      
      return id;
    }
    return '';
  }
  
  addCustomMarker(options: MarkerOptions): string {
    if (this.map) {
      const T = (window as any).T;
      const position = new T.LngLat(options.position.lng, options.position.lat);
      
      // 创建标记
      let marker;
      
      // 如果有自定义图标
      if (options.icon) {
        const icon = new T.Icon({
          iconUrl: options.icon,
          iconSize: new T.Point(32, 32),  // 默认图标大小
          iconAnchor: new T.Point(16, 32) // 默认锚点位置
        });
        marker = new T.Marker(position, {icon: icon});
      } else {
        marker = new T.Marker(position);
      }
      
      const id = `marker-${Date.now()}`;
      this.map.addOverLay(marker);
      this.markers.set(id, marker);
      
      // 添加标题标签
      if (options.title) {
        const label = new T.Label({
          text: options.title,
          position: position
        });
        this.map.addOverLay(label);
        this.labels.set(id, label);
      }
      
      // 添加信息窗口
      if (options.content) {
        const infoWindow = new T.InfoWindow(options.content, {
          offset: new T.Point(0, -30)
        });
        this.infoWindows.set(id, infoWindow);
        
        marker.addEventListener('click', () => {
          this.map.openInfoWindow(infoWindow, position);
          if (options.onClick) {
            options.onClick(marker);
          }
        });
      } else if (options.onClick) {
        marker.addEventListener('click', () => {
          options.onClick!(marker);
        });
      }
      
      return id;
    }
    return '';
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    const label = this.labels.get(markerId);
    const infoWindow = this.infoWindows.get(markerId);
    
    if (marker) {
      this.map.removeOverLay(marker);
      this.markers.delete(markerId);
    }
    
    if (label) {
      this.map.removeOverLay(label);
      this.labels.delete(markerId);
    }
    
    if (infoWindow) {
      this.map.closeInfoWindow(infoWindow);
      this.infoWindows.delete(markerId);
    }
  }
  
  async searchAddress(keyword: string): Promise<Array<{address: string, location: {lat: number, lng: number}}>> {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('Map not initialized'));
        return;
      }
      
      const T = (window as any).T;
      const searchService = new T.LocalSearch(this.map, {
        pageCapacity: 10,
        onSearchComplete: (results: any) => {
          console.log('天地图搜索结果:', results);
          if (results && results.getPois) {
            try {
              const pois = results.getPois();
              if (pois && pois.length > 0) {
                console.log(pois)
                const locations = pois
                  .filter((poi: any) => poi && poi.lonlat) // 使用lonlat而不是latLng
                  .map((poi: any) => {
                    // 确保经纬度正确获取，天地图API返回的经纬度可能在不同格式中
                    let lat = null;
                    let lng = null;
                    
                    if (poi.lonlat) {
                      // 处理字符串格式的经纬度 "116.395032,39.906343"
                      if (typeof poi.lonlat === 'string') {
                        const coords = poi.lonlat.split(',');
                        if (coords.length === 2) {
                          // 注意：天地图返回的格式是"经度,纬度"
                          lng = coords[0];
                          lat = coords[1];
                        }
                      } 
                      // 兼容处理对象格式的情况
                      else if (typeof poi.lonlat === 'object') {
                        if (typeof poi.lonlat.lat !== 'undefined' && typeof poi.lonlat.lon !== 'undefined') {
                          lat = poi.lonlat.lat;
                          lng = poi.lonlat.lon;
                        } else if (typeof poi.lonlat.lat !== 'undefined' && typeof poi.lonlat.lng !== 'undefined') {
                          lat = poi.lonlat.lat;
                          lng = poi.lonlat.lng;
                        } else if (typeof poi.lonlat.latitude !== 'undefined' && typeof poi.lonlat.longitude !== 'undefined') {
                          lat = poi.lonlat.latitude;
                          lng = poi.lonlat.longitude;
                        }
                      }
                    }
                    
                    // 如果还是没有找到经纬度，尝试其他可能的属性
                    if (lat === null || lng === null) {
                      if (poi.latLng) {
                        lat = poi.latLng.lat || poi.latLng.latitude;
                        lng = poi.latLng.lng || poi.latLng.lon || poi.latLng.longitude;
                      } else if (poi.location) {
                        lat = poi.location.lat || poi.location.latitude;
                        lng = poi.location.lng || poi.location.lon || poi.location.longitude;
                      }
                    }
                    
                    // 确保经纬度是数字类型
                    lat = typeof lat === 'number' ? lat : parseFloat(lat);
                    lng = typeof lng === 'number' ? lng : parseFloat(lng);
                    
                    return {
                      address: poi.addressDetail || poi.name || '未知地址',
                      location: {
                        lat: isNaN(lat) ? 0 : lat,
                        lng: isNaN(lng) ? 0 : lng
                      }
                    };
                  });
                console.log('处理后的位置数据:', locations);
                resolve(locations);
                return;
              }
            } catch (error) {
              console.error('处理天地图搜索结果时出错:', error);
            }
          }
          resolve([]);
        }
      });
      
      searchService.search(keyword);
    });
  }

  lockMap(): void {
    if (this.map && !this.locked) {
      this.locked = true;
      // 禁用拖动和缩放功能
      this.map.disableDrag();
      this.map.disableScrollWheelZoom();
      this.map.disableDoubleClickZoom();
      this.map.disableKeyboard();
    }
  }

  unlockMap(): void {
    if (this.map && this.locked) {
      this.locked = false;
      // 启用拖动和缩放功能
      this.map.enableDrag();
      this.map.enableScrollWheelZoom();
      this.map.enableDoubleClickZoom();
      this.map.enableKeyboard();
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  destroy(): void {
    if (!this.map) return;
    
    // 清理所有标记和信息窗口
    this.markers.forEach(marker => {
      // 移除标记的事件监听器
      marker.removeEventListener('click');
      this.map.removeOverLay(marker);
    });
    
    this.labels.forEach(label => {
      this.map.removeOverLay(label);
    });
    
    this.infoWindows.forEach(infoWindow => {
      this.map.closeInfoWindow(infoWindow);
    });
    
    // 清空集合
    this.markers.clear();
    this.labels.clear();
    this.infoWindows.clear();
    
    // 移除地图事件监听器
    this.map.removeEventListener('click');
    this.map.removeEventListener('zoom');
    this.map.removeEventListener('drag');
    
    // 移除地图容器的内容
    const container = document.getElementById(this.map.getContainer());
    if (container) {
      container.innerHTML = '';
    }
    
    this.map = null;
  }
}