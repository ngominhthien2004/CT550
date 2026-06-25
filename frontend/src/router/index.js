import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import TypedHomeFeedView from '../views/TypedHomeFeedView.vue'
import NovelTopPageView from '../views/NovelTopPageView.vue'
import PlansTopPageView from '../views/PlansTopPageView.vue'
import FeedView from '../views/FeedView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'
import BookmarksView from '../views/BookmarksView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import RankingsView from '../views/RankingsView.vue'
import ArtworkCommentsView from '../views/ArtworkCommentsView.vue'
import ArtworkDetailView from '../views/ArtworkDetailView.vue'
import TagDetailView from '../views/TagDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import MessagesView from '../views/MessagesView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import AccountView from '../views/AccountView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminManagementView from '../views/AdminManagementView.vue'
import SignUpView from '../views/SignUpView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'
import UploadArtworkView from '../views/UploadArtworkView.vue'
import FollowingNewestView from '../views/FollowingNewestView.vue'
import DiscoveryView from '../views/DiscoveryView.vue'
import NewestByAllView from '../views/NewestByAllView.vue'
import FollowUsersView from '../views/FollowUsersView.vue'
import AIView from '../views/AIView.vue'
import DrawingView from '../views/DrawingView.vue'
import RequestManagementView from '../views/RequestManagementView.vue'
import SeriesDetailView from '../views/SeriesDetailView.vue'
import ChatView from '../views/ChatView.vue'
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
  { path: '/feed', name: 'feed', component: FeedView },
  { path: '/search', name: 'search-results', component: SearchResultsView },
  { path: '/search/users', name: 'user-search-results', component: SearchResultsView },
  { path: '/discovery', name: 'discovery', component: DiscoveryView },
  { path: '/newest_by_all', name: 'newest-all', component: NewestByAllView },
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
  { path: '/chat', name: 'chat', component: ChatView, meta: { requiresAuth: true } },
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
  { path: '/users/:id/following', name: 'users-following', component: FollowUsersView },
  { path: '/users/:id/followers', name: 'followers', component: FollowUsersView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/my-reports', name: 'my-reports', component: () => import('@/views/MyReportsView.vue'), meta: { requiresAuth: true } },
  { path: '/admin/reports/:type(artwork|comment|user)/:id', name: 'moderation-case-detail', component: () => import('@/views/ModerationCaseDetailView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin', name: 'admin-management', component: AdminManagementView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/novels/:id', name: 'novel-detail', component: ArtworkDetailView },
  { path: '/artworks/:id', name: 'artwork-detail', component: ArtworkDetailView },
  { path: '/artworks/:id/comments', name: 'artwork-comments', component: ArtworkCommentsView },
  { path: '/series/:id', name: 'series-detail', component: SeriesDetailView },
  { path: '/tags/:tagName', name: 'tag-detail', component: TagDetailView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const requiresAuth = Boolean(to.meta.requiresAuth)
  const requiresAdmin = Boolean(to.meta.requiresAdmin)

  if (!requiresAuth && !requiresAdmin) {
    return true
  }

  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
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

export default router
