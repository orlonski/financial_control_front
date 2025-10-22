import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TransactionsPage from '@/pages/TransactionsPage'

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

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: mockUseQueryClient,
}))

// Mock do API
vi.mock('@/services/api', () => ({
  transactionsApi: {
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    createInstallments: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
  accountsApi: {
    getAccounts: vi.fn(),
  },
  categoriesApi: {
    getCategories: vi.fn(),
  },
  creditCardsApi: {
    getCreditCards: vi.fn(),
  },
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
      account: { name: 'Checking Account' },
      category: { name: 'Food' },
    },
  ],
}

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
    
    // Mock successful queries
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
      if (queryKey[0] === 'transactions') {
        return { data: mockData.transactions, isLoading: false }
      }
      return { data: [], isLoading: false }
    })
    
    // Mock successful mutations
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
    expect(screen.getByText('Nova Compra Parcelada')).toBeInTheDocument()
  })

  it('should render transactions list', () => {
    renderWithProviders(<TransactionsPage />)
    
    expect(screen.getByText('Test Expense')).toBeInTheDocument()
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument()
    expect(screen.getByText('Checking Account')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('should open create transaction dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Nova Transação')).toBeInTheDocument()
      expect(screen.getByLabelText('Valor')).toBeInTheDocument()
      expect(screen.getByLabelText('Data')).toBeInTheDocument()
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    })
  })

  it('should open create installment dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Compra Parcelada')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Nova Compra Parcelada')).toBeInTheDocument()
      expect(screen.getByLabelText('Valor total')).toBeInTheDocument()
      expect(screen.getByLabelText('Número de parcelas')).toBeInTheDocument()
    })
  })

  it('should filter categories by transaction type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    // Select expense type
    const expenseButton = screen.getByText('Despesa')
    await user.click(expenseButton)
    
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('Categoria')
      expect(categorySelect).toBeInTheDocument()
    })
  })

  it('should show credit card fields when credit card is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    // Select expense type
    const expenseButton = screen.getByText('Despesa')
    await user.click(expenseButton)
    
    await waitFor(() => {
      const creditCardSelect = screen.getByLabelText('Cartão de crédito (opcional)')
      expect(creditCardSelect).toBeInTheDocument()
    })
  })

  it('should validate required fields in transaction form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    const submitButton = screen.getByText('Criar Transação')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Valor deve ser positivo')).toBeInTheDocument()
      expect(screen.getByText('Data é obrigatória')).toBeInTheDocument()
      expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument()
    })
  })

  it('should validate installment form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Compra Parcelada')
    await user.click(createButton)
    
    const submitButton = screen.getByText('Criar Parcelamento')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Cartão é obrigatório para parcelamento')).toBeInTheDocument()
      expect(screen.getByText('Parcelas devem ser entre 2 e 60')).toBeInTheDocument()
    })
  })

  it('should create transaction successfully', async () => {
    const user = userEvent.setup()
    const mockMutate = vi.fn()
    
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    })
    
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    // Fill form
    await user.type(screen.getByLabelText('Valor'), '100')
    await user.type(screen.getByLabelText('Data'), '2024-01-15')
    await user.type(screen.getByLabelText('Descrição'), 'Test Transaction')
    
    // Select account
    const accountSelect = screen.getByLabelText('Conta')
    await user.selectOptions(accountSelect, '1')
    
    // Select category
    const categorySelect = screen.getByLabelText('Categoria')
    await user.selectOptions(categorySelect, '1')
    
    const submitButton = screen.getByText('Criar Transação')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        type: 'EXPENSE',
        amount: 100,
        date: '2024-01-15',
        description: 'Test Transaction',
        accountId: '1',
        categoryId: '1',
      })
    })
  })

  it('should create installment transactions successfully', async () => {
    const user = userEvent.setup()
    const mockMutate = vi.fn()
    
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    })
    
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Compra Parcelada')
    await user.click(createButton)
    
    // Fill form
    await user.type(screen.getByLabelText('Valor total'), '1200')
    await user.type(screen.getByLabelText('Data da compra'), '2024-01-15')
    await user.type(screen.getByLabelText('Descrição'), 'Installment Purchase')
    await user.type(screen.getByLabelText('Número de parcelas'), '3')
    
    // Select account
    const accountSelect = screen.getByLabelText('Conta')
    await user.selectOptions(accountSelect, '1')
    
    // Select category
    const categorySelect = screen.getByLabelText('Categoria')
    await user.selectOptions(categorySelect, '1')
    
    // Select credit card
    const creditCardSelect = screen.getByLabelText('Cartão de crédito')
    await user.selectOptions(creditCardSelect, '1')
    
    const submitButton = screen.getByText('Criar Parcelamento')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        type: 'EXPENSE',
        amount: 1200,
        date: '2024-01-15',
        description: 'Installment Purchase',
        accountId: '1',
        categoryId: '1',
        creditCardId: '1',
        totalInstallments: 3,
      })
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      error: null,
    })
    
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    const submitButton = screen.getByText('Criando...')
    expect(submitButton).toBeDisabled()
  })

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup()
    
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error('Failed to create transaction'),
    })
    
    renderWithProviders(<TransactionsPage />)
    
    const createButton = screen.getByText('Nova Transação')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao criar transação')).toBeInTheDocument()
    })
  })
})
