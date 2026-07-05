import { createI18n } from 'vue-i18n'

import enNav from './locales/en/nav.json'
import enTopbar from './locales/en/topbar.json'
import enAuth from './locales/en/auth.json'
import enProfile from './locales/en/profile.json'
import enHome from './locales/en/home.json'
import enArtwork from './locales/en/artwork.json'
import enUpload from './locales/en/upload.json'
import enDrawing from './locales/en/drawing.json'
import enAdmin from './locales/en/admin.json'
import enRequest from './locales/en/request.json'
import enSeries from './locales/en/series.json'
import enSearch from './locales/en/search.json'
import enChat from './locales/en/chat.json'
import enNotification from './locales/en/notification.json'
import enCommon from './locales/en/common.json'
import enModal from './locales/en/modal.json'
import enRanking from './locales/en/ranking.json'
import enNovel from './locales/en/novel.json'
import enDashboard from './locales/en/dashboard.json'
import enReport from './locales/en/report.json'
import enFavorites from './locales/en/favorites.json'
import enBookmarks from './locales/en/bookmarks.json'
import enBrowseHistory from './locales/en/browseHistory.json'
import enFollow from './locales/en/follow.json'
import enPage from './locales/en/page.json'
import enPlan from './locales/en/plan.json'
import enError from './locales/en/error.json'
import enFooter from './locales/en/footer.json'
import enLocale from './locales/en/locale.json'
import enAi from './locales/en/ai.json'

import viNav from './locales/vi/nav.json'
import viTopbar from './locales/vi/topbar.json'
import viAuth from './locales/vi/auth.json'
import viProfile from './locales/vi/profile.json'
import viHome from './locales/vi/home.json'
import viArtwork from './locales/vi/artwork.json'
import viUpload from './locales/vi/upload.json'
import viDrawing from './locales/vi/drawing.json'
import viAdmin from './locales/vi/admin.json'
import viRequest from './locales/vi/request.json'
import viSeries from './locales/vi/series.json'
import viSearch from './locales/vi/search.json'
import viChat from './locales/vi/chat.json'
import viNotification from './locales/vi/notification.json'
import viCommon from './locales/vi/common.json'
import viModal from './locales/vi/modal.json'
import viRanking from './locales/vi/ranking.json'
import viNovel from './locales/vi/novel.json'
import viDashboard from './locales/vi/dashboard.json'
import viReport from './locales/vi/report.json'
import viFavorites from './locales/vi/favorites.json'
import viBookmarks from './locales/vi/bookmarks.json'
import viBrowseHistory from './locales/vi/browseHistory.json'
import viFollow from './locales/vi/follow.json'
import viPage from './locales/vi/page.json'
import viPlan from './locales/vi/plan.json'
import viError from './locales/vi/error.json'
import viFooter from './locales/vi/footer.json'
import viLocale from './locales/vi/locale.json'
import viAi from './locales/vi/ai.json'

import jaNav from './locales/ja/nav.json'
import jaTopbar from './locales/ja/topbar.json'
import jaAuth from './locales/ja/auth.json'
import jaProfile from './locales/ja/profile.json'
import jaHome from './locales/ja/home.json'
import jaArtwork from './locales/ja/artwork.json'
import jaUpload from './locales/ja/upload.json'
import jaDrawing from './locales/ja/drawing.json'
import jaAdmin from './locales/ja/admin.json'
import jaRequest from './locales/ja/request.json'
import jaSeries from './locales/ja/series.json'
import jaSearch from './locales/ja/search.json'
import jaChat from './locales/ja/chat.json'
import jaNotification from './locales/ja/notification.json'
import jaCommon from './locales/ja/common.json'
import jaModal from './locales/ja/modal.json'
import jaRanking from './locales/ja/ranking.json'
import jaNovel from './locales/ja/novel.json'
import jaDashboard from './locales/ja/dashboard.json'
import jaReport from './locales/ja/report.json'
import jaFavorites from './locales/ja/favorites.json'
import jaBookmarks from './locales/ja/bookmarks.json'
import jaBrowseHistory from './locales/ja/browseHistory.json'
import jaFollow from './locales/ja/follow.json'
import jaPage from './locales/ja/page.json'
import jaPlan from './locales/ja/plan.json'
import jaError from './locales/ja/error.json'
import jaFooter from './locales/ja/footer.json'
import jaLocale from './locales/ja/locale.json'
import jaAi from './locales/ja/ai.json'

const en = {
  nav: enNav, topbar: enTopbar, auth: enAuth, profile: enProfile, home: enHome,
  artwork: enArtwork, upload: enUpload, drawing: enDrawing, admin: enAdmin,
  request: enRequest, series: enSeries, search: enSearch, chat: enChat,
  notification: enNotification, common: enCommon, modal: enModal, ranking: enRanking,
  novel: enNovel, dashboard: enDashboard, report: enReport, favorites: enFavorites,
  bookmarks: enBookmarks, browseHistory: enBrowseHistory, follow: enFollow,
  page: enPage, plan: enPlan, error: enError, footer: enFooter, locale: enLocale,
  ai: enAi,
}

const vi = {
  nav: viNav, topbar: viTopbar, auth: viAuth, profile: viProfile, home: viHome,
  artwork: viArtwork, upload: viUpload, drawing: viDrawing, admin: viAdmin,
  request: viRequest, series: viSeries, search: viSearch, chat: viChat,
  notification: viNotification, common: viCommon, modal: viModal, ranking: viRanking,
  novel: viNovel, dashboard: viDashboard, report: viReport, favorites: viFavorites,
  bookmarks: viBookmarks, browseHistory: viBrowseHistory, follow: viFollow,
  page: viPage, plan: viPlan, error: viError, footer: viFooter, locale: viLocale,
  ai: viAi,
}

const ja = {
  nav: jaNav, topbar: jaTopbar, auth: jaAuth, profile: jaProfile, home: jaHome,
  artwork: jaArtwork, upload: jaUpload, drawing: jaDrawing, admin: jaAdmin,
  request: jaRequest, series: jaSeries, search: jaSearch, chat: jaChat,
  notification: jaNotification, common: jaCommon, modal: jaModal, ranking: jaRanking,
  novel: jaNovel, dashboard: jaDashboard, report: jaReport, favorites: jaFavorites,
  bookmarks: jaBookmarks, browseHistory: jaBrowseHistory, follow: jaFollow,
  page: jaPage, plan: jaPlan, error: jaError, footer: jaFooter, locale: jaLocale,
  ai: jaAi,
}

/**
 * Load saved locale from localStorage, fall back to browser language, then 'en'
 */
function getInitialLocale() {
  try {
    const saved = localStorage.getItem('locale')
    if (saved && ['en', 'vi', 'ja'].includes(saved)) return saved
  } catch { /* ignore */ }

  const browserLang = navigator.language?.split('-')[0]
  if (browserLang && ['en', 'vi', 'ja'].includes(browserLang)) return browserLang

  return 'en'
}

const i18n = createI18n({
  legacy: false,          // use Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, vi, ja },
})

export default i18n
