import { createApp } from 'vue'
import MapComponent from './components/MapComponent.vue'
import './style.css'
import { setMapApiKeys } from './lib/map-config'

// 设置地图API密钥
setMapApiKeys({
  // 设置谷歌地图密钥
  google: '',
  // 设置天地图密钥
  tianditu: '5d5cdfc7acf2606419ae93341c6aedee'
})

const app = createApp(MapComponent)
app.mount('#app')