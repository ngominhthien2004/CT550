import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import FeedView from '../views/FeedView.vue'
import BookmarksView from '../views/BookmarksView.vue'
import RankingsView from '../views/RankingsView.vue'
import ArtworkCommentsView from '../views/ArtworkCommentsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/feed', name: 'feed', component: FeedView },
  { path: '/bookmarks', name: 'bookmarks', component: BookmarksView },
  { path: '/rankings', name: 'rankings', component: RankingsView },
  { path: '/artworks/:id/comments', name: 'artwork-comments', component: ArtworkCommentsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
