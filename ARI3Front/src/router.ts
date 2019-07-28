import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Develop from './views/Develop.vue'
import DebugView from './views/Debug.vue'
import Flow from './views/Flow.vue'

Vue.use(Router)

export default new Router({
  mode: "history",
  routes: [
    {
      path: '/',
      name: 'default',
      component: DebugView
    },
    {
      path: '/develop',
      name: 'develop',
      component: Develop
    },
    {
      path: '/home',
      name: 'home',
      component: Home
    },
    {
      path: '/flow',
      name: 'flow',
      component: Flow
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    }
  ]
})
