import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignIn = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

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

describe('LoginForm', () => {
  it('renders the sign-in form', async () => {
    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByText('Google')).toBeTruthy()
    expect(screen.getByText('GitHub')).toBeTruthy()
  })

  it('calls signIn with credentials on form submit', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    })
  })

  it('calls signIn with google provider on google button click', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)

    await userEvent.setup().click(screen.getByText('Google'))

    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' })
  })

  it('calls signIn with github provider on github button click', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)

    await userEvent.setup().click(screen.getByText('GitHub'))

    expect(mockSignIn).toHaveBeenCalledWith('github', { callbackUrl: '/' })
  })
})
