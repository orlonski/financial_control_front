import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '@/pages/DashboardPage'

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
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  }
})

// Mock do API
vi.mock('@/services/api', () => ({
  accountsApi: {
    getAllWithBalances: vi.fn(),
  },
  transactionsApi: {
    getSummary: vi.fn(),
  },
}))

// Mock dos componentes de dashboard
vi.mock('@/components/dashboard/DashboardReminders', () => ({
  DashboardReminders: () => <div data-testid="dashboard-reminders">Reminders</div>,
}))

vi.mock('@/components/dashboard/DashboardBudgets', () => ({
  DashboardBudgets: () => <div data-testid="dashboard-budgets">Budgets</div>,
}))

vi.mock('@/components/dashboard/DashboardGoals', () => ({
  DashboardGoals: () => <div data-testid="dashboard-goals">Goals</div>,
}))

vi.mock('@/components/FinancialSummaryCards', () => ({
  FinancialSummaryCards: () => <div data-testid="financial-summary">Summary</div>,
}))

vi.mock('@/components/PullToRefresh', () => ({
  PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/MonthFilter', () => ({
  MonthFilter: () => <div data-testid="month-filter">Month Filter</div>,
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

describe('DashboardPage - Balance Color', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display positive balance in green', () => {
    const accountsWithPositiveBalance = [
      { id: '1', name: 'Conta Positiva', type: 'CHECKING', balance: 1500.00 },
    ]

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts-initial-balances') {
        return { data: accountsWithPositiveBalance, isLoading: false }
      }
      if (queryKey[0] === 'accounts-final-balances') {
        return { data: accountsWithPositiveBalance, isLoading: false }
      }
      if (queryKey[0] === 'transaction-summary') {
        return { data: { totalIncome: 1000, totalExpense: 500 }, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    renderWithProviders(<DashboardPage />)

    const balanceElement = screen.getByText('R$ 1.500,00')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-green-600')
  })

  it('should display negative balance in red', () => {
    const accountsWithNegativeBalance = [
      { id: '1', name: 'Conta Negativa', type: 'CHECKING', balance: -500.00 },
    ]

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts-initial-balances') {
        return { data: accountsWithNegativeBalance, isLoading: false }
      }
      if (queryKey[0] === 'accounts-final-balances') {
        return { data: accountsWithNegativeBalance, isLoading: false }
      }
      if (queryKey[0] === 'transaction-summary') {
        return { data: { totalIncome: 1000, totalExpense: 500 }, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    renderWithProviders(<DashboardPage />)

    const balanceElement = screen.getByText('-R$ 500,00')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-red-600')
  })

  it('should display zero balance in gray', () => {
    const accountsWithZeroBalance = [
      { id: '1', name: 'Conta Zero', type: 'CHECKING', balance: 0 },
    ]

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts-initial-balances') {
        return { data: accountsWithZeroBalance, isLoading: false }
      }
      if (queryKey[0] === 'accounts-final-balances') {
        return { data: accountsWithZeroBalance, isLoading: false }
      }
      if (queryKey[0] === 'transaction-summary') {
        return { data: { totalIncome: 1000, totalExpense: 500 }, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    renderWithProviders(<DashboardPage />)

    const balanceElement = screen.getByText('R$ 0,00')
    expect(balanceElement).toBeInTheDocument()
    expect(balanceElement).toHaveClass('text-gray-500')
  })

  it('should display multiple accounts with correct colors', () => {
    const multipleAccounts = [
      { id: '1', name: 'Conta Positiva', type: 'CHECKING', balance: 1000.00 },
      { id: '2', name: 'Conta Negativa', type: 'SAVINGS', balance: -200.00 },
      { id: '3', name: 'Conta Zero', type: 'CASH', balance: 0 },
    ]

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts-initial-balances') {
        return { data: multipleAccounts, isLoading: false }
      }
      if (queryKey[0] === 'accounts-final-balances') {
        return { data: multipleAccounts, isLoading: false }
      }
      if (queryKey[0] === 'transaction-summary') {
        return { data: { totalIncome: 1000, totalExpense: 500 }, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    renderWithProviders(<DashboardPage />)

    const positiveBalance = screen.getByText('R$ 1.000,00')
    const negativeBalance = screen.getByText('-R$ 200,00')
    const zeroBalance = screen.getByText('R$ 0,00')

    expect(positiveBalance).toHaveClass('text-green-600')
    expect(negativeBalance).toHaveClass('text-red-600')
    expect(zeroBalance).toHaveClass('text-gray-500')
  })
})
