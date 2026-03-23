import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewTransactionPage from '@/pages/NewTransactionPage'

const mockNavigate = vi.fn()
const mockMutate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test User' },
    isLoading: false,
  }),
}))

vi.mock('@/services/api', () => ({
  transactionsApi: {
    create: vi.fn(),
  },
  accountsApi: {
    getAll: vi.fn(),
  },
  categoriesApi: {
    getAll: vi.fn(),
  },
  creditCardsApi: {
    getAll: vi.fn(),
  },
}))

const mockData = {
  accounts: [
    { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    { id: '2', name: 'Poupança', type: 'SAVINGS' },
  ],
  categories: [
    { id: '1', name: 'Alimentação', type: 'EXPENSE' },
    { id: '2', name: 'Salário', type: 'INCOME' },
  ],
  creditCards: [
    { id: 'cc1', name: 'Cartão Visa', closingDay: 5, dueDay: 10 },
  ],
}

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockUseQueryClient = vi.fn()

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
    useQueryClient: () => mockUseQueryClient(),
  }
})

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

describe('NewTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutate.mockClear()

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'accounts') {
        return { data: mockData.accounts, isLoading: false }
      }
      if (queryKey[0] === 'categories') {
        return { data: mockData.categories, isLoading: false }
      }
      if (queryKey[0] === 'credit-cards') {
        return { data: mockData.creditCards, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    })

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    })
  })

  it('should render new transaction page', () => {
    renderWithProviders(<NewTransactionPage />)
    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
    expect(screen.getByText('Criar Transação')).toBeInTheDocument()
  })

  it('should pre-fill date field with current date', () => {
    renderWithProviders(<NewTransactionPage />)
    const dateInput = screen.getByLabelText('Data') as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('should have purchaseDate in default form values', () => {
    renderWithProviders(<NewTransactionPage />)
    const dateInput = screen.getByLabelText('Data') as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })
})
