import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '@/pages/LoginPage'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock do AuthContext
const mockLogin = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoading: false,
  }),
}))

// Mock do API
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('should show link to register page', () => {
    renderWithProviders(<LoginPage />)
    
    const registerLink = screen.getByText('Não tem uma conta?')
    expect(registerLink).toBeInTheDocument()
    
    const link = screen.getByRole('link', { name: 'Criar conta' })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const { authApi } = await import('@/services/api')
    
    // Mock successful login
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'mock-token',
      user: { id: '1', email: 'test@test.com', name: 'Test User' }
    })
    
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123456')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: '123456'
      })
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const { authApi } = await import('@/services/api')
    
    // Mock delayed response
    vi.mocked(authApi.login).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123456')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    expect(screen.getByText('Entrando...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    const { authApi } = await import('@/services/api')
    
    // Mock failed login
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))
    
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123456')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    const user = userEvent.setup()
    const { authApi } = await import('@/services/api')
    
    // Mock successful login
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'mock-token',
      user: { id: '1', email: 'test@test.com', name: 'Test User' }
    })
    
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    
    await user.type(emailInput, 'test@test.com')
    await user.type(passwordInput, '123456')
    
    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('mock-token')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
