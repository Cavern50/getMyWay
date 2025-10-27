import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/index.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/register/index.vue'),
  },
  {
    path: '/',
    name: 'main',
    component: () => import('@/pages/main/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login', // fallback
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})