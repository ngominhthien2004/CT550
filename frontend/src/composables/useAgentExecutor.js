import { useRouter } from 'vue-router'

/**
 * Agent Executor — receives action frames from the AI backend
 * and executes them in the frontend (navigate, search, etc.)
 */
export function useAgentExecutor() {
  const router = useRouter()

  /**
   * Execute an agent action.
   * @param {{ type: string, params: object }} action - The action to execute
   */
  function execute(action) {
    if (!action || !action.type) {
      console.warn('[AgentExecutor] Invalid action:', action)
      return
    }

    switch (action.type) {
      case 'search': {
        const query = { ...action.params }
        // Clean up undefined/null values
        Object.keys(query).forEach(k => {
          if (query[k] === undefined || query[k] === null || query[k] === '') {
            delete query[k]
          }
        })
        router.push({ path: '/search', query })
        break
      }

      case 'navigate': {
        router.push({ path: action.params.path, query: action.params.query })
        break
      }

      case 'view-artwork': {
        router.push(`/artworks/${action.params.id}`)
        break
      }

      default:
        console.warn('[AgentExecutor] Unknown action type:', action.type, action)
    }
  }

  return { execute }
}
