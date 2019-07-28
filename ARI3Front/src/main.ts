import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './registerServiceWorker'


// Element-UI
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"
Vue.use(ElementUI)

// ARI
import AriPlugin from "./VuePlugins/AriPlugin"
Vue.use(AriPlugin, { reconnectInterval: 1000 })

// Prevent message
Vue.config.productionTip = false

// Create Vue app!
new Vue({
  router,
  data: {
  },
  render: h => h(App)
}).$mount('#app')
