import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

export default route(function ({ store }) {
  const Router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: () => import('pages/LandingPage.vue'),
        meta: { public: true },
      },
      {
        path: '/login',
        component: () => import('layouts/AuthLayout.vue'),
        meta: { public: true },
        children: [
          { path: '', name: 'login', component: () => import('pages/LoginPage.vue') },
        ],
      },
      {
        path: '/register',
        component: () => import('layouts/AuthLayout.vue'),
        meta: { public: true },
        children: [
          { path: '', name: 'register', component: () => import('pages/RegisterPage.vue') },
        ],
      },
      {
        path: '/app',
        component: () => import('layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
          { path: '', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
        ],
      },
      { path: '/:catchAll(.*)*', redirect: { name: 'home' } },
    ],
  });

  Router.beforeEach(async (to: RouteLocationNormalized) => {
    const auth = useAuthStore(store);

    const isPublic  = Boolean(to.meta.public);
    const needsAuth = Boolean(to.meta.requiresAuth);
    const hasToken  = Boolean(auth.token);

    if (isPublic && hasToken) {
      const redirect = (to.query.redirect as string) || '/';
      return { path: redirect };
    }

    if (needsAuth && !hasToken) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    if (hasToken && !auth.user) {
      try {
        await auth.fetchUser?.();
      } catch {
        await auth.logoutUser?.();
        return { name: 'login', query: { redirect: to.fullPath } };
      }
    }

    return true;
  });

  return Router;
});
