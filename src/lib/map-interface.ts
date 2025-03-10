export interface MapOptions {
  container: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

export interface MarkerOptions {
  position: {
    lat: number;
    lng: number;
  };
  title?: string;
  icon?: string; // 自定义图标URL
  content?: string; // 信息窗口内容
  onClick?: (marker: any) => void;
  // 可以根据需要添加更多配置项
}

export interface IMap {
  init(options: MapOptions): Promise<void>;
  setCenter(lat: number, lng: number): void;
  setZoom(zoom: number): void;
  // 保留原有方法以保持兼容性
  addMarker(lat: number, lng: number, title?: string, onClick?: (marker: any) => void): string;
  // 新增支持更多选项的方法
  addCustomMarker(options: MarkerOptions): string;
  removeMarker(markerId: string): void;
  searchAddress(keyword: string): Promise<Array<{address: string, location: {lat: number, lng: number}}>>;
  lockMap(): void;
  unlockMap(): void;
  isLocked(): boolean;
  destroy(): void;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title?: string;
  icon?: string;
  content?: string;
}

// 导入地图服务实现类
import { GoogleMapService } from './GoogleMapService';
import { TMapService } from './TMapService';


export class MapFactory {
  static createMap(type: 'google' | 'tmap' = 'tmap'): IMap {
    switch (type) {
      case 'google':
        return new GoogleMapService();
      case 'tmap':
        return new TMapService();
      default:
        throw new Error('Unsupported map type');
    }
  }
}