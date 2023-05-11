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
          path: '/webrtc/one2one',
          name: 'one2one',
          component: () => import('@/views/webrtc/one2one/index.vue')
        }
      ]
    }
  ]
})

export default router
