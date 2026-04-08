import { defineStore } from 'pinia'
import { followUser, getFollowers, getFollowing, getFollowStatus, unfollowUser } from '../services/api'

export const useFollowStore = defineStore('follows', {
  state: () => ({
    followers: [],
    following: [],
    followingByUser: {},
    loading: false,
    togglingByUser: {},
    error: '',
  }),
  getters: {
    isFollowingUser: (state) => (userId) => Boolean(state.followingByUser[userId]),
    isTogglingFollow: (state) => (userId) => Boolean(state.togglingByUser[userId]),
    followersCount: (state) => state.followers.length,
    followingCount: (state) => state.following.length,
  },
  actions: {
    async fetchFollowStatus(userId) {
      if (!userId) {
        return { isFollowing: false }
      }

      this.error = ''
      try {
        const { data } = await getFollowStatus(userId)
        this.followingByUser[userId] = Boolean(data?.isFollowing)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load follow status'
        throw error
      }
    },
    async fetchFollowers(userId) {
      if (!userId) {
        this.followers = []
        return
      }

      this.loading = true
      this.error = ''
      try {
        const { data } = await getFollowers(userId)
        this.followers = Array.isArray(data) ? data : []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load followers'
        this.followers = []
      } finally {
        this.loading = false
      }
    },
    async fetchFollowing(userId) {
      if (!userId) {
        this.following = []
        return
      }

      this.loading = true
      this.error = ''
      try {
        const { data } = await getFollowing(userId)
        this.following = Array.isArray(data) ? data : []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load following list'
        this.following = []
      } finally {
        this.loading = false
      }
    },
    async toggleFollowByUser(userId) {
      if (!userId) {
        throw new Error('userId is required')
      }

      const isFollowing = this.isFollowingUser(userId)
      this.error = ''
      this.togglingByUser[userId] = true

      try {
        if (isFollowing) {
          await unfollowUser(userId)
          this.followingByUser[userId] = false
          return { isFollowing: false }
        }

        await followUser(userId)
        this.followingByUser[userId] = true
        return { isFollowing: true }
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to update follow status'
        throw error
      } finally {
        this.togglingByUser[userId] = false
      }
    },
  },
})
