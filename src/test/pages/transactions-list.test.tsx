import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TransactionsPage from '@/pages/TransactionsPage'

const mockNavigate = vi.fn()
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

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/components/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    ConfirmDialog: () => null,
  }),
}))

vi.mock('@/components/PaymentModal', () => ({
  PaymentModal: () => null,
}))

vi.mock('@/components/TransactionCard', () => ({
  TransactionCard: ({ transaction, onTogglePaid, onEdit, onDelete, isToggling }: {
    transaction: { id: string }
    onTogglePaid: () => void
    onEdit: () => void
    onDelete: () => void
    isToggling?: boolean
  }) => (
    <div data-testid="transaction-card-mock" data-transaction-id={transaction.id}>
      <button data-testid="toggle-paid-button" onClick={onTogglePaid} disabled={isToggling}>
        Toggle Paid
      </button>
      <button data-testid="edit-button" onClick={onEdit}>
        Edit
      </button>
      <button data-testid="delete-button" onClick={() => onDelete(transaction.id)}>
        Delete
      </button>
    </div>
  ),
}))

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockUseQueryClient = vi.fn()

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
    useQueryClient: () => mockUseQueryClient(),
  }
})

vi.mock('@/services/api', () => ({
  transactionsApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    updatePaidStatus: vi.fn(),
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

const mockTransactions = [
  {
    id: '1',
    type: 'EXPENSE' as const,
    amount: 150.50,
    description: 'Supermercado Extra',
    date: '2024-01-15',
    purchaseDate: '2024-01-14',
    paid: false,
    account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    category: { id: '1', name: 'Alimentação', type: 'EXPENSE' },
    creditCard: { id: '1', name: 'Cartão Visa' },
    installmentNumber: 2,
    totalInstallments: 3,
  },
  {
    id: '2',
    type: 'INCOME' as const,
    amount: 5000,
    description: 'Salário Janeiro',
    date: '2024-01-05',
    paid: true,
    paidAt: '2024-01-05',
    account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    category: { id: '2', name: 'Salário', type: 'INCOME' },
  },
  {
    id: '3',
    type: 'EXPENSE' as const,
    amount: 89.90,
    description: 'Combustível',
    date: '2024-01-20',
    paid: true,
    account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    category: { id: '3', name: 'Transporte', type: 'EXPENSE' },
    notes: 'Tanque cheio',
  },
  {
    id: '4',
    type: 'EXPENSE' as const,
    amount: 299.99,
    description: 'Smartphone',
    date: '2024-01-25',
    paid: false,
    account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
    category: { id: '4', name: 'Eletrônicos', type: 'EXPENSE' },
    creditCard: { id: '2', name: 'Cartão Mastercard' },
  },
]

const mockAccounts = [
  { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
  { id: '2', name: 'Poupança', type: 'SAVINGS' },
]

const mockCategories = [
  { id: '1', name: 'Alimentação', type: 'EXPENSE' },
  { id: '2', name: 'Salário', type: 'INCOME' },
  { id: '3', name: 'Transporte', type: 'EXPENSE' },
]

const mockCreditCards = [
  { id: '1', name: 'Cartão Visa', closingDay: 5, dueDay: 10 },
]

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

describe('Transactions List - Visual and Functional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts') {
        return { data: mockAccounts, isLoading: false }
      }
      if (queryKey[0] === 'categories') {
        return { data: mockCategories, isLoading: false }
      }
      if (queryKey[0] === 'credit-cards') {
        return { data: mockCreditCards, isLoading: false }
      }
      if (queryKey[0] === 'transactions') {
        return { data: mockTransactions, isLoading: false }
      }
      return { data: [], isLoading: false }
    })

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    })

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    })
  })

  describe('Transaction Card Display', () => {
    it('should render all transaction cards via TransactionCard component', () => {
      renderWithProviders(<TransactionsPage />)

      const cards = screen.getAllByTestId('transaction-card-mock')
      expect(cards).toHaveLength(4)
    })

    it('should display transaction description in card data', () => {
      renderWithProviders(<TransactionsPage />)

      const cards = screen.getAllByTestId('transaction-card-mock')
      expect(cards[0]).toHaveAttribute('data-transaction-id', '1')
      expect(cards[1]).toHaveAttribute('data-transaction-id', '2')
    })

    it('should render edit button for each transaction', () => {
      renderWithProviders(<TransactionsPage />)

      const editButtons = screen.getAllByTestId('edit-button')
      expect(editButtons).toHaveLength(4)
    })

    it('should render delete button for each transaction', () => {
      renderWithProviders(<TransactionsPage />)

      const deleteButtons = screen.getAllByTestId('delete-button')
      expect(deleteButtons).toHaveLength(4)
    })

    it('should render toggle paid button for each transaction', () => {
      renderWithProviders(<TransactionsPage />)

      const toggleButtons = screen.getAllByTestId('toggle-paid-button')
      expect(toggleButtons).toHaveLength(4)
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TransactionsPage />)

      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0])

      expect(mockNavigate).toHaveBeenCalled()
      expect(mockNavigate.mock.calls[0][0]).toMatch(/\/transactions\/.*\/edit/)
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no transactions', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
        if (queryKey[0] === 'transactions') {
          return { data: [], isLoading: false }
        }
        if (queryKey[0] === 'accounts') {
          return { data: mockAccounts, isLoading: false }
        }
        if (queryKey[0] === 'categories') {
          return { data: mockCategories, isLoading: false }
        }
        if (queryKey[0] === 'credit-cards') {
          return { data: mockCreditCards, isLoading: false }
        }
        return { data: [], isLoading: false }
      })

      renderWithProviders(<TransactionsPage />)

      expect(screen.getByText('Nenhuma transação cadastrada')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should display loading skeleton when loading', () => {
      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
        if (queryKey[0] === 'transactions') {
          return { data: [], isLoading: true }
        }
        return { data: [], isLoading: false }
      })

      renderWithProviders(<TransactionsPage />)

      expect(screen.getByText('Transações')).toBeInTheDocument()
      const cards = document.querySelectorAll('.animate-pulse')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})
