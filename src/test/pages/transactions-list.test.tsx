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
    type: 'EXPENSE',
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
    type: 'INCOME',
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
    type: 'EXPENSE',
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
    type: 'EXPENSE',
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
    it('should render all transaction cards', () => {
      renderWithProviders(<TransactionsPage />)

      const cards = screen.getAllByTestId('transaction-card')
      expect(cards).toHaveLength(4)
    })

    it('should display transaction description', () => {
      renderWithProviders(<TransactionsPage />)

      expect(screen.getByText('Supermercado Extra')).toBeInTheDocument()
      expect(screen.getByText('Salário Janeiro')).toBeInTheDocument()
      expect(screen.getByText('Combustível')).toBeInTheDocument()
    })

    it('should display formatted amounts with correct signs', () => {
      renderWithProviders(<TransactionsPage />)

      expect(screen.getByText('-R$ 150,50')).toBeInTheDocument()
      expect(screen.getByText('+R$ 5.000,00')).toBeInTheDocument()
      expect(screen.getByText('-R$ 89,90')).toBeInTheDocument()
    })

    it('should display category name', () => {
      renderWithProviders(<TransactionsPage />)

      const categoryElements = screen.getAllByText('Alimentação')
      expect(categoryElements.length).toBeGreaterThan(0)
      expect(screen.getAllByText('Salário').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Transporte').length).toBeGreaterThan(0)
    })

    it('should display account name', () => {
      renderWithProviders(<TransactionsPage />)

      const accountElements = screen.getAllByText('Conta Corrente')
      expect(accountElements.length).toBeGreaterThanOrEqual(3)
    })

    it('should display credit card name when present', () => {
      renderWithProviders(<TransactionsPage />)

      const cardElements = screen.getAllByText('Cartão Visa')
      expect(cardElements.length).toBeGreaterThan(0)
    })

    it('should display purchase date when available', () => {
      renderWithProviders(<TransactionsPage />)

      const purchaseDateElements = screen.getAllByTestId('purchase-date')
      expect(purchaseDateElements.length).toBeGreaterThanOrEqual(1)
      expect(purchaseDateElements[0]).toHaveTextContent('14/01/2024')
    })

    it('should display purchase date badge for credit card transactions without explicit purchaseDate', () => {
      renderWithProviders(<TransactionsPage />)

      const purchaseDateElements = screen.getAllByTestId('purchase-date')
      expect(purchaseDateElements.length).toBe(2)
      const purchaseDateTexts = purchaseDateElements.map(el => el.textContent)
      expect(purchaseDateTexts.some(text => text?.includes('25/01/2024'))).toBe(true)
    })

    it('should show purchase date when creditCard exists even without purchaseDate field', () => {
      const transactionWithCreditCardOnly = [
        {
          id: '5',
          type: 'EXPENSE' as const,
          amount: 50.00,
          description: 'Restaurante',
          date: '2024-01-28',
          paid: false,
          account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' as const },
          category: { id: '5', name: 'Alimentação', type: 'EXPENSE' as const },
          creditCard: { id: '1', name: 'Cartão Visa' },
        },
      ]

      mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
        if (queryKey[0] === 'transactions') {
          return { data: transactionWithCreditCardOnly, isLoading: false }
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

      const purchaseDateElements = screen.getAllByTestId('purchase-date')
      expect(purchaseDateElements.length).toBe(1)
      const purchaseDateTexts = purchaseDateElements.map(el => el.textContent)
      expect(purchaseDateTexts.some(text => text?.includes('28/01/2024'))).toBe(true)
    })

    it('should display transaction dates correctly formatted', () => {
      renderWithProviders(<TransactionsPage />)

      const dates = screen.getAllByTestId('transaction-date')
      expect(dates).toHaveLength(4)
      expect(dates[0]).toHaveTextContent('15/01/2024')
      expect(dates[1]).toHaveTextContent('05/01/2024')
      expect(dates[2]).toHaveTextContent('20/01/2024')
      expect(dates[3]).toHaveTextContent('25/01/2024')
    })

    it('should display installment information when present', () => {
      renderWithProviders(<TransactionsPage />)

      const installmentInfo = screen.getByTestId('installment-info')
      expect(installmentInfo).toHaveTextContent('2/3')
    })

    it('should display notes when present', () => {
      renderWithProviders(<TransactionsPage />)

      const notesElement = screen.getByTestId('transaction-notes')
      expect(notesElement).toHaveTextContent('Tanque cheio')
    })
  })

  describe('Transaction Actions', () => {
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

      expect(mockNavigate).toHaveBeenCalledWith('/transactions/1/edit')
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

  describe('Visual Indicators', () => {
    it('should show paid transactions with reduced opacity', () => {
      renderWithProviders(<TransactionsPage />)

      const paidCard = screen.getAllByTestId('transaction-card')[1]
      expect(paidCard).toHaveClass('opacity-70')
    })

    it('should show unpaid transactions without reduced opacity', () => {
      renderWithProviders(<TransactionsPage />)

      const unpaidCard = screen.getAllByTestId('transaction-card')[0]
      expect(unpaidCard).not.toHaveClass('opacity-70')
    })

    it('should show green indicator for income transactions', () => {
      renderWithProviders(<TransactionsPage />)

      const greenDots = document.querySelectorAll('.bg-green-500')
      expect(greenDots.length).toBe(1)
    })

    it('should show red indicator for expense transactions', () => {
      renderWithProviders(<TransactionsPage />)

      const redDots = document.querySelectorAll('.bg-red-500')
      expect(redDots.length).toBe(3)
    })
  })
})
