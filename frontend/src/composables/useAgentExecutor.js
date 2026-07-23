import { useRouter } from 'vue-router'

/**
 * Agent Executor — receives action frames from the AI backend
 * and executes them in the frontend (navigate, search, etc.)
 */

// Allowlist of internal path prefixes that the AI agent is permitted
// to navigate the user to. Anything outside this list is rejected so a
// jailbroken / prompt-injected model cannot push users to arbitrary
// client routes (admin pages, phishing-feel URLs, external schemes, …).
const ALLOWED_PATH_PREFIXES = [
  '/',
  '/illustrations',
  '/manga',
  '/gifs',
  '/novels',
  '/plans',
  '/search',
  '/discovery',
  '/newest_by_followed',
  '/bookmarks',
  '/bookmark',
  '/favorites',
  '/rankings',
  '/messages',
  '/notifications',
  '/requests',
  '/draw',
  '/ai',
  '/history',
  '/upload',
  '/artworks',
  '/users',
  '/dashboard',
  '/my-reports',
  '/series',
  '/settings',
  '/setting',
  '/account',
  '/tags',
]

function isValidInternalPath(path) {
  if (typeof path !== 'string' || path.length === 0) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false // protocol-relative URL
  if (path.includes(':')) return false // protocol scheme (e.g. /a/b:foo)
  if (path.includes('\\')) return false // backslash tricks
  // Only allow characters that are safe in client-side route paths,
  // including a query string and fragment.
  return /^\/[a-zA-Z0-9\-_\./?&=#%]+$/.test(path)
}

function isAllowedPath(path) {
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?') || path.startsWith(prefix + '#')
  )
}

function sanitizeQuery(query) {
  if (!query || typeof query !== 'object') return undefined
  // Strip non-primitive values and anything that smells like a URL field
  const clean = {}
  for (const [key, value] of Object.entries(query)) {
    if (typeof key !== 'string' || key.length === 0) continue
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue
    if (typeof value === 'string' && (value.includes('://') || value.startsWith('//'))) continue
    clean[key] = value
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

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
        const targetPath = action.params?.path
        if (!isValidInternalPath(targetPath) || !isAllowedPath(targetPath)) {
          console.warn('[AgentExecutor] Blocked disallowed AI navigation:', targetPath)
          break
        }
        const safeQuery = sanitizeQuery(action.params.query)
        router.push(safeQuery ? { path: targetPath, query: safeQuery } : targetPath)
        break
      }

      case 'view-artwork': {
        const id = action.params?.id
        if (typeof id !== 'string' || !/^[a-fA-F0-9]{1,32}$/.test(id)) {
          console.warn('[AgentExecutor] Blocked view-artwork with invalid id:', id)
          break
        }
        router.push(`/artworks/${id}`)
        break
      }

      default:
        console.warn('[AgentExecutor] Unknown action type:', action.type, action)
    }
  }

  return { execute }
}
