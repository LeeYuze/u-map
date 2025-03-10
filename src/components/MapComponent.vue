<template>
  <div class="map-container">
    <div class="map-controls">
      <select v-model="currentMapType" @change="switchMap">
        <option value="google">谷歌地图</option>
        <option value="tmap">天地图</option>
      </select>
      <button @click="addRandomMarker">添加标记</button>
      <button @click="addCustomMarker">添加自定义标记</button>
      <select v-model="selectedIcon" class="icon-select">
        <option value="https://picsum.photos/200">📍 默认标记</option>
      </select>
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="toggleMapLock">{{ isMapLocked ? '解锁地图' : '锁定地图' }}</button>
      <div class="search-container">
        <div class="search-input-wrapper">
          <input 
            v-model="searchKeyword" 
            placeholder="搜索地址" 
            @keyup.enter="searchAddress" 
            @focus="showDropdown = true"
          />
          <button @click="searchAddress">搜索</button>
          <div v-if="showDropdown && (isSearching || searchResults.length > 0)" class="search-dropdown">
            <div v-if="isSearching" class="search-loading">正在搜索...</div>
            <div v-else-if="searchResults.length === 0" class="search-no-results">未找到结果</div>
            <div v-else class="search-results-list">
              <div 
                v-for="(result, index) in searchResults" 
                :key="index" 
                class="search-result-item" 
                @click="goToLocation(result.location)"
              >
                {{ result.address }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="map" class="map"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { MapFactory, IMap, MapOptions, MarkerOptions } from '../lib/map-interface';

const currentMapType = ref<'google' | 'tmap'>('tmap');
const map = ref<IMap | null>(null);
const searchKeyword = ref('');
const searchResults = ref<Array<{address: string, location: {lat: number, lng: number}}>>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const isMapLocked = ref(false);
const selectedIcon = ref('https://picsum.photos/200');
const markers = ref<string[]>([]);

const mapOptions: MapOptions = {
  container: 'map',
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
  map.value = MapFactory.createMap(currentMapType.value);
  await map.value.init(mapOptions);
}

function switchMap() {
  initMap();
}

function addRandomMarker() {
  if (!map.value) return;
  const lat = mapOptions.center.lat + (Math.random() - 0.5) * 0.1;
  const lng = mapOptions.center.lng + (Math.random() - 0.5) * 0.1;
  
  const options: MarkerOptions = {
    position: { lat, lng },
    title: `标记 ${Date.now()}`,
    content: `<div class="info-window">
      <h3>默认标记</h3>
      <p>位置: [${lat.toFixed(4)}, ${lng.toFixed(4)}]</p>
      <p>创建时间: ${new Date().toLocaleString()}</p>
    </div>`,
    onClick: handleMarkerClick
  };
  
  const markerId = map.value.addCustomMarker(options);
  markers.value.push(markerId);
  console.log(`添加了标记: ${markerId}`);
}

function addCustomMarker() {
  if (!map.value) return;
  
  const lat = mapOptions.center.lat + (Math.random() - 0.5) * 0.1;
  const lng = mapOptions.center.lng + (Math.random() - 0.5) * 0.1;
  
  const markerTitle = {
    'https://cdn1.iconfinder.com/data/icons/map-markers-2/512/marker_pin_place_maps-512.png': '默认标记',
    'https://cdn1.iconfinder.com/data/icons/map-markers-2/512/landmark_monument_place_maps-512.png': '景点',
    'https://cdn1.iconfinder.com/data/icons/map-markers-2/512/restaurant_food_fork_knife_map_place-512.png': '美食',
    'https://cdn1.iconfinder.com/data/icons/map-markers-2/512/hotel_place_sleep_maps-512.png': '酒店',
    'https://cdn1.iconfinder.com/data/icons/map-markers-2/512/bus_public_transport_transportation-512.png': '交通'
  }[selectedIcon.value] || '自定义标记';
  
  const markerId = `marker-${Date.now()}`;
  const options: MarkerOptions = {
    position: { lat, lng },
    icon: selectedIcon.value,
    title: markerTitle,
    content: `<div class="info-window">
      <h3>${markerTitle}</h3>
      <p>位置: [${lat.toFixed(4)}, ${lng.toFixed(4)}]</p>
      <p>创建时间: ${new Date().toLocaleString()}</p>
      <div class="info-window-actions">
        <button onclick="window.dispatchEvent(new CustomEvent('marker-action', { detail: { action: 'edit', id: '${markerId}' } }))">编辑</button>
        <button onclick="window.dispatchEvent(new CustomEvent('marker-action', { detail: { action: 'delete', id: '${markerId}' } }))">删除</button>
      </div>
    </div>`,
    onClick: handleMarkerClick
  };

  const addedMarkerId = map.value.addCustomMarker(options);
  markers.value.push(addedMarkerId);
  console.log(`添加了自定义标记: ${addedMarkerId}`);
}

function handleMarkerClick(marker: any) {
  console.log(`点击了标记:`, marker);
}

function zoomIn() {
  if (!map.value) return;
  const currentZoom = mapOptions.zoom + 1;
  map.value.setZoom(currentZoom);
  mapOptions.zoom = currentZoom;
}

function zoomOut() {
  if (!map.value) return;
  const currentZoom = mapOptions.zoom - 1;
  map.value.setZoom(currentZoom);
  mapOptions.zoom = currentZoom;
}

function toggleMapLock() {
  if (!map.value) return;
  
  if (isMapLocked.value) {
    map.value.unlockMap();
    isMapLocked.value = false;
  } else {
    map.value.lockMap();
    isMapLocked.value = true;
  }
}

async function searchAddress() {
  if (!map.value || !searchKeyword.value.trim()) return;
  
  try {
    isSearching.value = true;
    showDropdown.value = true;
    searchResults.value = await map.value.searchAddress(searchKeyword.value);
    console.log(`找到 ${searchResults.value.length} 个结果`);
  } catch (error) {
    console.error('搜索地址失败:', error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function goToLocation(location: {lat: number, lng: number}) {
  if (!map.value) return;
  map.value.setCenter(location.lat, location.lng);
  
  // 使用自定义标记替代原来的简单标记
  map.value.addCustomMarker({
    position: location,
    title: searchKeyword.value,
    content: `<div class="info-window">
      <h3>${searchKeyword.value}</h3>
      <p>位置: [${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}]</p>
    </div>`,
    onClick: handleMarkerClick
  });
  
  searchResults.value = []; // 清空搜索结果
  showDropdown.value = false; // 关闭下拉框
}

function removeMarker(markerId: string) {
  if (!map.value) return;
  
  try {
    map.value.removeMarker(markerId);
    markers.value = markers.value.filter(id => id !== markerId);
    console.log(`成功删除标记: ${markerId}`);
  } catch (error) {
    console.error(`删除标记失败: ${markerId}`, error);
  }
}

onMounted(() => {
  initMap();
  
  // 监听标记操作事件
  window.addEventListener('marker-action', ((event: CustomEvent) => {
    const { action, id } = event.detail;
    if (action === 'delete') {
      removeMarker(id);
    } else if (action === 'edit') {
      console.log('编辑标记:', id);
      // 这里可以实现编辑标记的逻辑
    }
  }) as EventListener);
});

onUnmounted(() => {
  if (map.value) {
    markers.value.forEach(markerId => {
      map.value?.removeMarker(markerId);
    });
    map.value.destroy();
  }
});

</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-controls {
  padding: 10px;
  background-color: #f5f5f5;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  display: flex;
  gap: 5px;
  position: relative;
}

.search-input-wrapper {
  position: relative;
}

/* 信息窗口样式 */
:deep(.info-window) {
  padding: 10px;
  max-width: 250px;
  font-family: Arial, sans-serif;
}

:deep(.info-window h3) {
  margin-top: 0;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

:deep(.info-window p) {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.search-container input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 200px;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 5px;
}

.search-loading {
  padding: 10px;
  text-align: center;
  color: #666;
}

.search-no-results {
  padding: 10px;
  text-align: center;
  color: #666;
}

.search-results-list {
  max-height: 300px;
  overflow-y: auto;
}

.map {
  flex: 1;
  width: 100%;
}

.search-results {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.search-results-header {
  padding: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
}

.search-result-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.search-result-item:hover {
  background-color: #f9f9f9;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

/* 添加信息窗口中的操作按钮样式 */
:deep(.info-window-actions) {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

:deep(.info-window-actions button) {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

:deep(.info-window-actions button:hover) {
  background-color: #e0e0e0;
}

/* 修改图标选择器样式 */
.icon-select {
  padding: 8px 8px 8px 35px !important;
  background-position: 8px center;
  background-repeat: no-repeat;
  background-size: 20px;
  background-image: v-bind('`url(${selectedIcon})`');
}

.icon-select option {
  padding-left: 25px;
  height: 25px;
  line-height: 25px;
  background-position: 4px center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.icon-select option:nth-child(1) {
  background-image: url('https://cdn1.iconfinder.com/data/icons/map-markers-2/512/marker_pin_place_maps-512.png');
}

.icon-select option:nth-child(2) {
  background-image: url('https://cdn1.iconfinder.com/data/icons/map-markers-2/512/landmark_monument_place_maps-512.png');
}

.icon-select option:nth-child(3) {
  background-image: url('https://cdn1.iconfinder.com/data/icons/map-markers-2/512/restaurant_food_fork_knife_map_place-512.png');
}

.icon-select option:nth-child(4) {
  background-image: url('https://cdn1.iconfinder.com/data/icons/map-markers-2/512/hotel_place_sleep_maps-512.png');
}

.icon-select option:nth-child(5) {
  background-image: url('https://cdn1.iconfinder.com/data/icons/map-markers-2/512/bus_public_transport_transportation-512.png');
}
</style>