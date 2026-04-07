import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const API_BASE = 'http://localhost:5000/api'
const APP_BASE = 'http://localhost:5173'

const credentials = {
  username: 'qa_auth_20260405_a',
  email: 'qa_auth_20260405_a@example.com',
  password: 'QaAuth!2026A',
}

const sampleImagePath = 'E:/HocTap/CT550/backend/public/uploads/user1/illust/111295072_p0_master1200.jpg'

async function loginOrRegister() {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  })

  if (loginRes.ok) {
    return loginRes.json()
  }

  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!registerRes.ok) {
    const text = await registerRes.text()
    throw new Error(`Register failed: ${registerRes.status} ${text}`)
  }

  const retryLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  })

  if (!retryLogin.ok) {
    const text = await retryLogin.text()
    throw new Error(`Login after register failed: ${retryLogin.status} ${text}`)
  }

  return retryLogin.json()
}

async function createArtworkByType(token, type, imageBuffer) {
  const now = Date.now()
  const form = new FormData()
  form.append('title', `E2E-${type}-${now}`)
  form.append('description', 'E2E generated artwork for account verification')
  form.append('type', type)
  form.append('ageRating', 'all')
  form.append('tags', 'e2e')
  form.append('images', new Blob([imageBuffer], { type: 'image/jpeg' }), `${type}-${now}.jpg`)

  const res = await fetch(`${API_BASE}/artworks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create artwork ${type} failed: ${res.status} ${text}`)
  }

  return res.json()
}

async function addBookmark(token, artworkId) {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artworkId, folder: 'account-test' }),
  })

  if (!res.ok && res.status !== 400) {
    const text = await res.text()
    throw new Error(`Bookmark failed: ${res.status} ${text}`)
  }
}

async function run() {
  const auth = await loginOrRegister()
  const token = auth.token

  if (!token) {
    throw new Error('No token received from auth endpoint')
  }

  const imageBuffer = await readFile(sampleImagePath)
  const types = ['illust', 'manga', 'novel', 'ugoira']
  const created = []

  for (const type of types) {
    const artwork = await createArtworkByType(token, type, imageBuffer)
    created.push(artwork)
    await addBookmark(token, artwork._id)
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } })

  await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' })

  await page.evaluate((payload) => {
    localStorage.setItem('token', payload.token)
    localStorage.setItem(
      'authUser',
      JSON.stringify({
        _id: payload._id,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      }),
    )
  }, auth)

  await page.goto(`${APP_BASE}/account`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: '../test-artifacts/screenshots/account-home-after-e2e.png', fullPage: true })

  await page.getByRole('button', { name: 'Illustrations' }).click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: '../test-artifacts/screenshots/account-illustrations-after-e2e.png', fullPage: true })

  const illustrationTypes = await page.locator('.type-tabs .type-tab').allTextContents()

  await page.getByRole('button', { name: 'Bookmarks' }).click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: '../test-artifacts/screenshots/account-bookmarks-after-e2e.png', fullPage: true })

  const bookmarkTypes = await page.locator('.bookmark-type-tabs .bookmark-type-tab').allTextContents()

  await browser.close()

  const result = {
    userId: auth._id,
    created: created.map((item) => ({ id: item._id, type: item.type, title: item.title })),
    illustrationTypes,
    bookmarkTypes,
    screenshots: [
      'test-artifacts/screenshots/account-home-after-e2e.png',
      'test-artifacts/screenshots/account-illustrations-after-e2e.png',
      'test-artifacts/screenshots/account-bookmarks-after-e2e.png',
    ],
  }

  console.log(JSON.stringify(result, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
