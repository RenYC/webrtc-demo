import { createRouter, createWebHistory } from 'vue-router'
import LayoutContainer from '@/components/layoutContainer/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'layout',
      redirect: '/home',
      component: LayoutContainer,
      children: [
        {
          path: '/home',
          name: 'home',
          component: () => import('@/views/home/index.vue')
        },
        {
          path: '/webrtc',
          name: 'webrtc',
          component: () => import('@/views/webrtc/index.vue')
        }
      ]
    }
  ]
})

export default router
