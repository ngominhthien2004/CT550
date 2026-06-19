import { defineStore } from 'pinia'
import { requestApi } from '../services/api.js'

export const useRequestStore = defineStore('requests', {
  state: () => ({
    terms: [],
    requests: [],
    publicRequests: [],
    loading: false,
    error: '',
  }),
  getters: {
    openTerms: (state) => state.terms.filter((term) => term.isOpen),
    isAccepting: (state) => state.terms.some((term) => term.isOpen),
  },
  actions: {
    async fetchTerms(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await requestApi.getTerms(params)
        this.terms = Array.isArray(data) ? data : []
        return this.terms
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load request terms'
        throw error
      } finally {
        this.loading = false
      }
    },
    async createTerm(payload) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await requestApi.createTerm(payload)
        this.terms = [data, ...this.terms]
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to save request term'
        throw error
      } finally {
        this.loading = false
      }
    },
    async submitRequest(formData) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await requestApi.create(formData)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to submit request'
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchMine(params = {}) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await requestApi.getMine(params)
        this.requests = Array.isArray(data) ? data : []
        return this.requests
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load requests'
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchById(requestId) {
      this.loading = true
      this.error = ''
      try {
        const { data } = await requestApi.getById(requestId)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load request'
        throw error
      } finally {
        this.loading = false
      }
    },
    async getChat(requestId) {
      try {
        const { data } = await requestApi.getChat(requestId)
        return Array.isArray(data) ? data : []
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to load chat'
        throw error
      }
    },
    async sendChat(requestId, formData) {
      try {
        const { data } = await requestApi.sendChat(requestId, formData)
        return data
      } catch (error) {
        this.error = error?.response?.data?.message || 'Failed to send message'
        throw error
      }
    },
    async transition(requestId, action, payload = {}) {
      const actionMap = {
        accept: () => requestApi.accept(requestId),
        reject: () => requestApi.reject(requestId, payload),
        start: () => requestApi.start(requestId),
        cancel: () => requestApi.cancel(requestId, payload),
      }
      const run = actionMap[action]
      if (!run) {
        throw new Error('Unsupported request action')
      }

      const { data } = await run()
      this.requests = this.requests.map((item) => (item._id === data._id ? data : item))
      return data
    },
  },
})
