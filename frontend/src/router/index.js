import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import FeedView from '../views/FeedView.vue'
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
import SignUpView from '../views/SignUpView.vue'
import LoginView from '../views/LoginView.vue'
import UploadArtworkView from '../views/UploadArtworkView.vue'
import { useAuthStore } from '../stores/auth.store'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/feed', name: 'feed', component: FeedView },
  { path: '/bookmarks', name: 'bookmarks', component: BookmarksView, meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: FavoritesView, meta: { requiresAuth: true } },
  { path: '/rankings', name: 'rankings', component: RankingsView },
  { path: '/messages', name: 'messages', component: MessagesView },
  { path: '/notifications', name: 'notifications', component: NotificationsView },
  { path: '/signup', name: 'signup', component: SignUpView },
  { path: '/login', name: 'login', component: LoginView },
  {
    path: '/upload',
    name: 'upload',
    redirect: { name: 'upload-kind', params: { kind: 'illust' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/upload/:kind(illust|manga|ugoira|novel)',
    name: 'upload-kind',
    component: UploadArtworkView,
    meta: { requiresAuth: true },
  },
  { path: '/account', name: 'account', component: AccountView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/artworks/:id', name: 'artwork-detail', component: ArtworkDetailView },
  { path: '/artworks/:id/comments', name: 'artwork-comments', component: ArtworkCommentsView },
  { path: '/tags/:tagName', name: 'tag-detail', component: TagDetailView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    return true
  }

  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

export default router
