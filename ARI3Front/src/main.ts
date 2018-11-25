import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'

import VueRx from "vue-rx"
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"

// Prepare appState - global application state ojbect!
var appState: any = {}

// Load WebSocket "service"
import { WebSocketService } from "./services/WebSocketService"
var websocket = new WebSocketService()
Vue.set(appState, "WebSocket", websocket.ariNode)

Vue.use(VueRx)
Vue.use(ElementUI)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  data: {
    appState
  },
  render: h => h(App)
}).$mount('#app')
