import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TransactionsPage from '@/pages/TransactionsPage'

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

const mockData = {
  accounts: [
    { id: '1', name: 'Checking Account', type: 'CHECKING' },
    { id: '2', name: 'Savings Account', type: 'SAVINGS' },
  ],
  categories: [
    { id: '1', name: 'Food', type: 'EXPENSE' },
    { id: '2', name: 'Salary', type: 'INCOME' },
  ],
  creditCards: [
    { id: '1', name: 'Visa Card', closingDay: 5, dueDay: 10 },
  ],
  transactions: [
    {
      id: '1',
      type: 'EXPENSE',
      amount: 100,
      description: 'Test Expense',
      date: '2024-01-15',
      account: { id: '1', name: 'Checking Account', type: 'CHECKING' },
      category: { id: '1', name: 'Food', type: 'EXPENSE' },
    },
  ],
}

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockUseQueryClient = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
    useQueryClient: () => mockUseQueryClient(),
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'accounts') {
        return { data: mockData.accounts, isLoading: false }
      }
      if (queryKey[0] === 'categories') {
        return { data: mockData.categories, isLoading: false }
      }
      if (queryKey[0] === 'credit-cards') {
        return { data: mockData.creditCards, isLoading: false }
      }
      if (queryKey[0] === 'transactions') {
        return { data: mockData.transactions, isLoading: false }
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

  it('should render transactions page', () => {
    renderWithProviders(<TransactionsPage />)

    expect(screen.getByText('Transações')).toBeInTheDocument()
    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
  })

  it('should render transactions list via TransactionCard', () => {
    renderWithProviders(<TransactionsPage />)

    const cards = screen.getAllByTestId('transaction-card-mock')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveAttribute('data-transaction-id', '1')
  })

  it('should render action buttons for each transaction', () => {
    renderWithProviders(<TransactionsPage />)

    const toggleButtons = screen.getAllByTestId('toggle-paid-button')
    const editButtons = screen.getAllByTestId('edit-button')
    const deleteButtons = screen.getAllByTestId('delete-button')

    expect(toggleButtons).toHaveLength(1)
    expect(editButtons).toHaveLength(1)
    expect(deleteButtons).toHaveLength(1)
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
