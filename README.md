# U-Map

统一地图接口库，支持谷歌地图和天地图。

## 安装

```bash
npm install u-map
# 或
yarn add u-map
```

## 使用方法

### 基本用法

首先，在HTML中引入地图SDK：

```html
<!-- 谷歌地图 SDK -->
<script src="https://maps.googleapis.com/maps/api/js?key=your-google-maps-key"></script>
<!-- 天地图 SDK -->
<script type="text/javascript" src="https://api.tianditu.gov.cn/api?v=4.0&tk=your-tianditu-key"></script>
```

然后在Vue组件中使用：

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { MapFactory, IMap, MapOptions } from 'u-map';

// 在setup中
const mapType = ref<'google' | 'amap'>('google');
const map = ref<IMap | null>(null);

const mapOptions: MapOptions = {
  container: 'map', // HTML元素的ID
  center: {
    lat: 39.9042,
    lng: 116.4074
  },
  zoom: 12
};

async function initMap() {
  if (map.value) {
    map.value.destroy();
  }
  map.value = MapFactory.createMap(mapType.value);
  await map.value.init(mapOptions);
}

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.destroy();
  }
});
```

HTML模板：

```html
<div id="map" style="width: 100%; height: 500px;"></div>
```

### API参考

#### MapFactory

```typescript
MapFactory.createMap(type: 'google' | 'amap'): IMap
```

创建指定类型的地图实例。

- `type`: 地图类型，支持 'google'（谷歌地图）和 'amap'（天地图）

#### IMap接口

所有地图实现都遵循此接口：

```typescript
interface IMap {
  init(options: MapOptions): Promise<void>;
  setCenter(lat: number, lng: number): void;
  setZoom(zoom: number): void;
  addMarker(lat: number, lng: number, title?: string): void;
  removeMarker(markerId: string): void;
  destroy(): void;
}
```

#### MapOptions

```typescript
interface MapOptions {
  container: string;  // HTML元素ID
  center: {
    lat: number;      // 纬度
    lng: number;      // 经度
  };
  zoom: number;       // 缩放级别
}
```

## 示例

### 添加标记

```typescript
map.value?.addMarker(39.9042, 116.4074, '北京市中心');
```

### 切换地图类型

```typescript
mapType.value = 'amap'; // 切换到天地图
initMap(); // 重新初始化地图
```

## 许可证

MIT