// 地图配置管理模块

export interface MapApiKeys {
  google: string;
  tianditu: string;
}

// 默认API密钥配置
const defaultApiKeys: MapApiKeys = {
  google: 'your-google-maps-key',
  tianditu: 'your-tianditu-key'
};

// 当前使用的API密钥
let currentApiKeys: MapApiKeys = { ...defaultApiKeys };

/**
 * 设置地图API密钥
 * @param keys 要设置的API密钥对象
 */
export function setMapApiKeys(keys: Partial<MapApiKeys>): void {
  currentApiKeys = { ...currentApiKeys, ...keys };
}

/**
 * 获取指定地图服务的API密钥
 * @param mapType 地图类型
 * @returns API密钥
 */
export function getMapApiKey(mapType: 'google' | 'tianditu'): string {
  return currentApiKeys[mapType];
}

/**
 * 动态加载地图SDK脚本
 * @param mapType 地图类型
 * @returns Promise，加载完成后解析
 */
export function loadMapScript(mapType: 'google' | 'tianditu'): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (mapType === 'google' && (window as any).google?.maps) {
      resolve();
      return;
    }
    
    if (mapType === 'tianditu' && (window as any).T) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    
    // 根据地图类型设置不同的URL和参数
    if (mapType === 'google') {
      script.src = `https://maps.googleapis.com/maps/api/js?key=${getMapApiKey('google')}`;
    } else if (mapType === 'tianditu') {
      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${getMapApiKey('tianditu')}`;
    }
    
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load ${mapType} map script: ${error}`));
    
    document.head.appendChild(script);
  });
}