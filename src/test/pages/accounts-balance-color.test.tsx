import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AccountsPage from '@/pages/AccountsPage'

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
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test User' },
    isLoading: false,
  }),
}))

// Mock do React Query
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockUseQueryClient = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
    useQueryClient: () => mockUseQueryClient(),
  }
})

// Mock do API
vi.mock('@/services/api', () => ({
  accountsApi: {
    getAllWithBalances: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock do Toast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock do ConfirmDialog
vi.mock('@/components/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    ConfirmDialog: null,
  }),
}))

// Mock do PullToRefresh
vi.mock('@/components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

describe('AccountsPage - Balance Color', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    })

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    })
  })

  it('should display positive balance in green', () => {
    const accountsWithPositiveBalance = [
      {
        id: '1',
        name: 'Conta Positiva',
        type: 'CHECKING',
        balance: 2500.00,
        initialBalance: 1000,
        color: '#4CAF50',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    mockUseQuery.mockImplementation(() => {
      return { data: accountsWithPositiveBalance, isLoading: false }
    })

    renderWithProviders(<AccountsPage />)

    const balanceElement = screen.getByText('R$ 2.500,00')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-green-600')
  })

  it('should display negative balance in red', () => {
    const accountsWithNegativeBalance = [
      {
        id: '1',
        name: 'Conta Negativa',
        type: 'CHECKING',
        balance: -750.50,
        initialBalance: 0,
        color: '#F44336',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    mockUseQuery.mockImplementation(() => {
      return { data: accountsWithNegativeBalance, isLoading: false }
    })

    renderWithProviders(<AccountsPage />)

    const balanceElement = screen.getByText('-R$ 750,50')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-red-600')
  })

  it('should display zero balance in gray', () => {
    const accountsWithZeroBalance = [
      {
        id: '1',
        name: 'Conta Zero',
        type: 'SAVINGS',
        balance: 0,
        initialBalance: 0,
        color: '#9E9E9E',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    mockUseQuery.mockImplementation(() => {
      return { data: accountsWithZeroBalance, isLoading: false }
    })

    renderWithProviders(<AccountsPage />)

    const balanceElement = screen.getByText('R$ 0,00')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-gray-500')
  })

  it('should display multiple accounts with correct colors', () => {
    const multipleAccounts = [
      {
        id: '1',
        name: 'Conta Corrente',
        type: 'CHECKING',
        balance: 3000.00,
        initialBalance: 1000,
        color: '#4CAF50',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Carteira',
        type: 'CASH',
        balance: -100.00,
        initialBalance: 200,
        color: '#F44336',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '3',
        name: 'Investimentos',
        type: 'INVESTMENT',
        balance: 0,
        initialBalance: 0,
        color: '#9E9E9E',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    mockUseQuery.mockImplementation(() => {
      return { data: multipleAccounts, isLoading: false }
    })

    renderWithProviders(<AccountsPage />)

    const positiveBalance = screen.getByText('R$ 3.000,00')
    const negativeBalance = screen.getByText('-R$ 100,00')
    const zeroBalance = screen.getByText('R$ 0,00')

    expect(positiveBalance).toHaveClass('text-green-600')
    expect(negativeBalance).toHaveClass('text-red-600')
    expect(zeroBalance).toHaveClass('text-gray-500')
  })

  it('should render account names correctly', () => {
    const accounts = [
      {
        id: '1',
        name: 'Nubank',
        type: 'CHECKING',
        balance: 1500.00,
        initialBalance: 0,
        color: '#8A2BE2',
        userId: '1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]

    mockUseQuery.mockImplementation(() => {
      return { data: accounts, isLoading: false }
    })

    renderWithProviders(<AccountsPage />)

    expect(screen.getByText('Nubank')).toBeInTheDocument()
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument()
  })
})
