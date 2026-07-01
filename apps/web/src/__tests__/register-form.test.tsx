import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignIn = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toasts: [], toast: vi.fn(), dismiss: vi.fn() }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RegisterForm', () => {
  it('renders the registration form', async () => {
    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)

    expect(screen.getByRole('heading', { name: /create account/i })).toBeTruthy()
    expect(screen.getByLabelText('Name')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByText('Google')).toBeTruthy()
    expect(screen.getByText('GitHub')).toBeTruthy()
  })

  it('calls API on submit and auto-signs in on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'user-1', name: 'Test', email: 'test@example.com' }),
    })
    mockSignIn.mockResolvedValue({ error: null })

    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    })
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    })
  })

  it('shows error toast on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    })

    const { toast } = await import('@/components/ui/use-toast')

    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'existing@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', description: 'Email already in use' })
    )
  })
})
