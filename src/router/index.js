import { createRouter, createWebHistory } from 'vue-router'
import VidFrameCapToolView from '../views/VidFrameCapToolView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/video-frame-capture-tool',
      name: 'VidFrameCapTool',
      component: VidFrameCapToolView,
    },
  ],
})

export default router
