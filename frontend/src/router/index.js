import { createRouter, createWebHistory } from 'vue-router'
import { watch as vueWatch } from 'vue'
import HomePage from '../views/HomePage.vue'
import TypedHomeFeedView from '../views/TypedHomeFeedView.vue'
import NovelTopPageView from '../views/NovelTopPageView.vue'
import PlansTopPageView from '../views/PlansTopPageView.vue'
import EditArtworkView from '../views/EditArtworkView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'
import BookmarksView from '../views/BookmarksView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import RankingsView from '../views/RankingsView.vue'
import ArtworkDetailView from '../views/ArtworkDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import MessagesView from '../views/MessagesView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import AccountView from '../views/AccountView.vue'
import DashboardView from '../views/DashboardView.vue'
import DashboardHomePanel from '../components/dashboard/DashboardHomePanel.vue'
import DashboardWorksPanel from '../components/dashboard/DashboardWorksPanel.vue'
import DashboardSeriesPanel from '../components/dashboard/DashboardSeriesPanel.vue'
import DashboardReactionsPanel from '../components/dashboard/DashboardReactionsPanel.vue'
import DashboardAnalyticsPanel from '../components/dashboard/DashboardAnalyticsPanel.vue'
import AdminManagementView from '../views/AdminManagementView.vue'
import SignUpView from '../views/SignUpView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import UploadArtworkView from '../views/UploadArtworkView.vue'
import FollowingNewestView from '../views/FollowingNewestView.vue'
import DiscoveryView from '../views/DiscoveryView.vue'
import FollowUsersView from '../views/FollowUsersView.vue'
import AIView from '../views/AIView.vue'
import DrawingView from '../views/DrawingView.vue'
import SettingsView from '../views/SettingsView.vue'
import RequestManagementView from '../views/RequestManagementView.vue'
import SeriesDetailView from '../views/SeriesDetailView.vue'

import { useAuthStore } from '../stores/auth.store'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  {
    path: '/illustrations',
    name: 'illustrations',
    component: TypedHomeFeedView,
    props: {
      workType: 'illust',
      pageTitle: 'Illustrations',
    },
  },
  {
    path: '/manga',
    name: 'manga',
    component: TypedHomeFeedView,
    props: {
      workType: 'manga',
      pageTitle: 'Manga',
    },
  },
  {
    path: '/gifs',
    name: 'gifs',
    component: TypedHomeFeedView,
    props: {
      workType: 'gif',
      pageTitle: 'GIF',
    },
  },
  {
    path: '/novels',
    name: 'novels',
    component: NovelTopPageView,
  },
  {
    path: '/plans',
    name: 'plans',
    component: PlansTopPageView,
  },
  { path: '/feed', redirect: '/' },
  { path: '/search', name: 'search-results', component: SearchResultsView },
  { path: '/search/users', name: 'user-search-results', component: SearchResultsView },
  { path: '/discovery', name: 'discovery', component: DiscoveryView },
  { path: '/newest_by_followed', name: 'following-newest', component: FollowingNewestView, meta: { requiresAuth: true } },
  { path: '/bookmarks', redirect: '/account?tab=bookmarks' },
  { path: '/bookmark', redirect: '/account?tab=bookmarks' },
  { path: '/favorites', redirect: '/account?tab=likes' },
  { path: '/rankings', name: 'rankings', component: RankingsView },
  { path: '/messages', name: 'messages', component: MessagesView, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: NotificationsView, meta: { requiresAuth: true } },
  { path: '/requests/manage', name: 'request-management', component: RequestManagementView, meta: { requiresAuth: true } },
  { path: '/draw', name: 'draw', component: DrawingView, meta: { requiresAuth: true } },
  { path: '/ai', name: 'ai', component: AIView },
  { path: '/history', name: 'browse-history', component: () => import('@/views/BrowseHistoryView.vue'), meta: { requiresAuth: true } },
  { path: '/chat', redirect: '/' },
  { path: '/signup', name: 'signup', component: SignUpView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/auth/callback', name: 'auth-callback', component: AuthCallbackView },
  {
    path: '/upload',
    name: 'upload',
    redirect: { name: 'upload-kind', params: { kind: 'illust' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/upload/:kind(illust|manga|gif|novel)',
    name: 'upload-kind',
    component: UploadArtworkView,
    meta: { requiresAuth: true },
  },
  { path: '/account', name: 'account', component: AccountView },
  { path: '/artworks/:id/edit', name: 'edit-artwork', component: EditArtworkView, meta: { requiresAuth: true } },
  { path: '/users/:id/following', name: 'users-following', component: FollowUsersView },
  { path: '/users/:id/followers', name: 'followers', component: FollowUsersView },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', redirect: { name: 'dashboard-home' } },
      { path: 'home', name: 'dashboard-home', component: DashboardHomePanel },
      { path: 'works', name: 'dashboard-works', component: DashboardWorksPanel },
      { path: 'series', name: 'dashboard-series', component: DashboardSeriesPanel },
      { path: 'reactions', name: 'dashboard-reactions', component: DashboardReactionsPanel },
      { path: 'analytics', name: 'dashboard-analytics', component: DashboardAnalyticsPanel },
    ],
  },
  { path: '/my-reports', name: 'my-reports', component: () => import('@/views/MyReportsView.vue'), meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin-management', component: AdminManagementView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/novels/:id', name: 'novel-detail', component: ArtworkDetailView },
  { path: '/artworks/:id', name: 'artwork-detail', component: ArtworkDetailView },
  { path: '/series/:id', name: 'series-detail', component: SeriesDetailView },
  { path: '/setting', redirect: '/settings' },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
  {
    path: '/bookstore',
    name: 'bookstore',
    component: () => import('../views/bookstore/BookstoreHomeView.vue'),
    meta: { title: 'Book Store' },
  },
  {
    path: '/bookstore/:id',
    name: 'book-detail',
    component: () => import('../views/bookstore/BookDetailView.vue'),
  },
  {
    path: '/bookstore/upload',
    name: 'book-upload',
    component: () => import('../views/bookstore/BookUploadView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookstore/manage',
    name: 'book-manage',
    component: () => import('../views/bookstore/BookManageView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookstore/cart',
    name: 'book-cart',
    component: () => import('../views/bookstore/CartView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookstore/orders',
    name: 'book-orders',
    component: () => import('../views/bookstore/OrderHistoryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookstore/seller',
    name: 'book-seller',
    component: () => import('../views/bookstore/SellerDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/bookstore/checkout/success',
    name: 'book-checkout-success',
    component: () => import('../views/bookstore/CheckoutSuccessView.vue'),
  },
  {
    path: '/bookstore/checkout/cancel',
    name: 'book-checkout-cancel',
    component: () => import('../views/bookstore/CheckoutCancelView.vue'),
  },
  { path: '/tags/:tagName', redirect: to => {
    const tagName = typeof to.params.tagName === 'string' ? to.params.tagName : ''
    return { path: '/search', query: { q: tagName, tag: '1' } }
  }},
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Redirect logged-in users away from login/signup pages
  if (isAuthenticated && (to.name === 'login' || to.name === 'signup')) {
    return { name: 'home' }
  }

  const requiresAuth = Boolean(to.meta.requiresAuth)
  const requiresAdmin = Boolean(to.meta.requiresAdmin)

  if (!requiresAuth && !requiresAdmin) {
    return true
  }

  if (isAuthenticated) {
    if (requiresAdmin && authStore.user?.role !== 'admin') {
      return { name: 'home' }
    }

    return true
  }

  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

/**
 * Install side-effects on the router that must run exactly once at app boot:
 *   - watch `authStore.isAuthenticated` so a mid-session logout (expired JWT,
 *     suspension, 401 from another tab) forces re-evaluation of the current
 *     route and redirects to /login with a `reason=session_expired` query.
 *
 * Call from main.js AFTER `app.use(router)`.
 */
export function setupRouterGuards() {
  const authStore = useAuthStore()
  vueWatch(
    () => authStore.isAuthenticated,
    (isAuth, wasAuth) => {
      if (wasAuth && !isAuth) {
        const currentRoute = router.currentRoute.value
        // Only force-redirect if the user is currently on a protected route.
        if (currentRoute.meta?.requiresAuth) {
          router
            .replace({
              path: '/login',
              query: {
                reason: 'session_expired',
                redirect: currentRoute.fullPath,
              },
            })
            .catch(() => {
              // NavigationDuplicated or in-flight navigation — safe to ignore.
            })
        }
      }
    },
  )
}

export default router
