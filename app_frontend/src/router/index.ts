import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') },
      { path: '/register', component: () => import('pages/RegisterPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue'), meta: { requiresAuth: false } },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/login' },
  { path: '/landing', component: () => import('pages/LandingPage.vue') }, // pública
]

export default route(() => {
  const Router = createRouter({ history: createWebHashHistory(), routes });

  Router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      void Router.push('/login');

      return false;
    }
  });

  return Router;
})
