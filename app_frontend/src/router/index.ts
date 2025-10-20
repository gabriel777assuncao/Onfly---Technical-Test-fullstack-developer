import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

export default route(function ({ store }) {
  const router = createRouter({
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
          {
            path: '',
            name: 'login',
            component: () => import('pages/LoginPage.vue'),
          },
        ],
      },
      {
        path: '/register',
        component: () => import('layouts/AuthLayout.vue'),
        meta: { public: true },
        children: [
          {
            path: '',
            name: 'register',
            component: () => import('pages/RegisterPage.vue'),
          },
        ],
      },
      {
        path: '/app',
        component: () => import('layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'dashboard',
            component: () => import('pages/DashboardPage.vue'),
          },
        ],
      },
      { path: '/:catchAll(.*)*', redirect: { name: 'home' } },
    ],
  });

  router.beforeEach(async (toRoute: RouteLocationNormalized) => {
    const authenticationStore = useAuthStore(store);

    const requiresAuthentication = Boolean(toRoute.meta.requiresAuth);
    const isGuestOnlyRoute = toRoute.name === 'login' || toRoute.name === 'register';
    const hasAccessToken = Boolean(authenticationStore.token);

    if (requiresAuthentication && !hasAccessToken) {
      return { name: 'login', query: { redirect: toRoute.fullPath } };
    }

    if (hasAccessToken && isGuestOnlyRoute) {
      const redirectTarget = (toRoute.query.redirect as string) || '/app';

      if (redirectTarget === toRoute.fullPath) {
        return true;
      }

      return { path: redirectTarget };
    }

    if (hasAccessToken && !authenticationStore.user) {
      try {
        await authenticationStore.fetchUser?.();
      } catch {
        await authenticationStore.logoutUser?.();

        return { name: 'login', query: { redirect: toRoute.fullPath } };
      }
    }

    return true;
  });

  return router;
});
