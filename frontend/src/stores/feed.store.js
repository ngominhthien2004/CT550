import { defineStore } from 'pinia'
import { getFeed, getRankings } from '../services/api'

export const useFeedStore = defineStore('feed', {
  state: () => ({
    feedItems: [],
    rankings: [],
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
    async fetchRankings(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await getRankings(params)
        this.rankings = data.artworks || []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to fetch rankings'
      } finally {
        this.loading = false
      }
    },
  },
})
