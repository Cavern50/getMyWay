import { useAuthStore } from '@/features/auth/model/useAuthStore'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/index.vue'),
    meta: {
      guestOnly: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/register/index.vue'),
    meta: {
      guestOnly: true,
    },
  },
  {
    path: '/',
    name: 'main',
    component: () => import('@/pages/main/index.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/pages/map/index.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login', // fallback
    meta: {
      guestOnly: true,
    },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthenticated = Boolean(authStore.token || localStorage.getItem('token'));

  if (to.meta?.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta?.guestOnly && isAuthenticated) {
    return { name: 'main' };
  }
  return true;
});