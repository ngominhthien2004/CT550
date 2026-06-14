import { defineStore } from 'pinia'
import { getFeed, getRankings } from '../services/api'

export const useFeedStore = defineStore('feed', {
  state: () => ({
    feedItems: [],
    rankings: [],
    rankingsPage: 1,
    rankingsTotal: 0,
    rankingsPages: 0,
    loading: false,
    error: '',
  }),
  actions: {
    async fetchFeed(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getFeed(params)
        this.feedItems = data.artworks || []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch feed'
      } finally {
        this.loading = false
      }
    },
    async fetchRankings({ append, ...params } = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getRankings({ page: params.page || 1, ...params })
        this.rankings = append ? [...this.rankings, ...(data.artworks || [])] : (data.artworks || [])
        this.rankingsPage = data.page || 1
        this.rankingsTotal = data.total || 0
        this.rankingsPages = data.pages || 0
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch rankings'
      } finally {
        this.loading = false
      }
    },
  },
})
