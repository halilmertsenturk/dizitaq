import { test, expect, Page } from '@playwright/test'

const MOCK_USER = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
}

const MOCK_SESSION = {
  user: MOCK_USER,
  expires: new Date(Date.now() + 86400 * 1000).toISOString(),
}

const MOCK_WATCHLIST = [
  {
    id: '1',
    titleId: '3179773',
    userId: '1',
    addedAt: new Date().toISOString(),
    title: {
      watchmodeId: 3179773,
      title: 'Breaking Bad',
      type: 'series' as const,
      year: 2008,
      poster: 'https://img.example.com/breaking-bad.jpg',
      rating: 9.5,
      plot: 'A high school chemistry teacher turned meth producer.',
      genres: ['Drama', 'Crime'],
    },
  },
]

async function mockAuthenticated(page: Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) })
  })
}

async function mockUnauthenticated(page: Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) })
  })
}

async function mockCsrfToken(page: Page) {
  await page.route('**/api/auth/csrf', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'test-csrf' }) })
  })
}

test.describe('Authentication flows', () => {

  test.describe('Login page', () => {
    test.beforeEach(async ({ page }) => {
      await mockUnauthenticated(page)
      await mockCsrfToken(page)
      await page.goto('/auth/login')
    })

    test('renders the login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in$/i })).toBeVisible()
    })

    test('shows error toast on invalid credentials', async ({ page }) => {
      await page.route('**/api/auth/callback/credentials**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid credentials' }) })
      })

      await page.getByLabel('Email').fill('wrong@example.com')
      await page.getByLabel('Password').fill('wrongpass')
      await page.getByRole('button', { name: /sign in$/i }).click()

      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 })
    })

    test('redirects to home on successful login', async ({ page }) => {
      await page.route('**/api/auth/callback/credentials**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'http://localhost:3000/' }) })
      })
      await mockAuthenticated(page)

      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /sign in$/i }).click()

      await page.waitForURL('/')
      await expect(page.getByText('Discover What to Watch')).toBeVisible()
    })

    test('has OAuth buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible()
    })

    test('has link to register page', async ({ page }) => {
      await page.getByText(/sign up/i).click()
      await expect(page).toHaveURL('/auth/register')
    })
  })

  test.describe('Register page', () => {
    test.beforeEach(async ({ page }) => {
      await mockUnauthenticated(page)
      await mockCsrfToken(page)
      await page.goto('/auth/register')
    })

    test('renders the registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
      await expect(page.getByLabel('Name')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: /create account$/i })).toBeVisible()
    })

    test('registers and auto-signs in on success', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        const body = JSON.parse(route.request().postData() || '{}')
        expect(body).toMatchObject({ name: 'New User', email: 'new@example.com', password: 'password123' })
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: '2', ...body }) })
      })
      await page.route('**/api/auth/callback/credentials**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'http://localhost:3000/' }) })
      })
      await mockAuthenticated(page)

      await page.getByLabel('Name').fill('New User')
      await page.getByLabel('Email').fill('new@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /create account$/i }).click()

      await page.waitForURL('/')
    })

    test('shows error on duplicate email', async ({ page }) => {
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Email already in use' }) })
      })

      await page.getByLabel('Name').fill('Existing User')
      await page.getByLabel('Email').fill('existing@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /create account$/i }).click()

      await expect(page.getByText('Email already in use')).toBeVisible({ timeout: 5000 })
    })

    test('has link to login page', async ({ page }) => {
      await page.getByText(/sign in$/i).click()
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('Navigation (navbar auth state)', () => {
    test('shows sign-in button when logged out', async ({ page }) => {
      await mockUnauthenticated(page)
      await page.goto('/')
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
      await expect(page.getByText('Watchlist')).not.toBeVisible()
    })

    test('shows user name and watchlist link when logged in', async ({ page }) => {
      await mockAuthenticated(page)
      await page.goto('/')
      await expect(page.getByText(MOCK_USER.name)).toBeVisible()
      await expect(page.getByRole('link', { name: /watchlist/i })).toBeVisible()
    })

    test('signs out on logout click', async ({ page }) => {
      await mockAuthenticated(page)
      await page.route('**/api/auth/signout', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      })
      await page.goto('/')

      await page.getByRole('button', { name: /log out/i }).click()
    })
  })
})

test.describe('Watchlist flows', () => {
  test('shows sign-in prompt when unauthenticated', async ({ page }) => {
    await mockUnauthenticated(page)
    await page.goto('/watchlist')

    await expect(page.getByRole('heading', { name: /your watchlist/i })).toBeVisible()
    await expect(page.getByText(/sign in to save/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('redirects to login on sign-in button click', async ({ page }) => {
    await mockUnauthenticated(page)
    await page.goto('/watchlist')

    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/auth/login')
  })

  test('shows watchlist items when authenticated', async ({ page }) => {
    await mockAuthenticated(page)
    await page.route('**/api/watchlist', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WATCHLIST) })
    })
    await page.goto('/watchlist')

    await expect(page.getByText('Breaking Bad')).toBeVisible()
    await expect(page.getByText('(1)')).toBeVisible()
  })

  test('shows empty watchlist when no items', async ({ page }) => {
    await mockAuthenticated(page)
    await page.route('**/api/watchlist', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })
    await page.goto('/watchlist')

    await expect(page.getByText('(0)')).toBeVisible()
    await expect(page.getByText('Nothing here yet')).toBeVisible()
  })
})
