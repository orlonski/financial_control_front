import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CategoriesPage from '@/pages/CategoriesPage'

// Mock do useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test User' },
    isLoading: false,
  }),
}))

// Mock do useToast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock do useConfirmDialog
vi.mock('@/components/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    ConfirmDialog: null,
  }),
}))

// Mock do API
vi.mock('@/services/api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock do React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  }
})

const mockCategories = [
  { id: '1', name: 'Salário', type: 'INCOME', color: '#22c55e', icon: '💰' },
  { id: '2', name: 'Freelance', type: 'INCOME', color: '#10b981', icon: '💻' },
  { id: '3', name: 'Alimentação', type: 'EXPENSE', color: '#ef4444', icon: '🍔' },
  { id: '4', name: 'Transporte', type: 'EXPENSE', color: '#f97316', icon: '🚗' },
]

const setupMocks = (categories = mockCategories, isLoading = false) => {
  vi.mocked(useQuery).mockReturnValue({
    data: categories,
    isLoading,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as any)

  vi.mocked(useMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries: vi.fn(),
  } as any)
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

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('should render categories page with title', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Categorias')).toBeInTheDocument()
    expect(screen.getByText('Organize suas receitas e despesas por categoria')).toBeInTheDocument()
  })

  it('should render income categories section with green color', () => {
    renderWithProviders(<CategoriesPage />)

    const incomeTitle = screen.getByText(/Categorias de Receita/)
    expect(incomeTitle).toBeInTheDocument()
    expect(incomeTitle).toHaveClass('text-green-600')
  })

  it('should render expense categories section with red color', () => {
    renderWithProviders(<CategoriesPage />)

    const expenseTitle = screen.getByText(/Categorias de Despesa/)
    expect(expenseTitle).toBeInTheDocument()
    expect(expenseTitle).toHaveClass('text-red-600')
  })

  it('should display correct count for income categories', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Categorias de Receita (2)')).toBeInTheDocument()
  })

  it('should display correct count for expense categories', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Categorias de Despesa (2)')).toBeInTheDocument()
  })

  it('should render income category items', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Salário')).toBeInTheDocument()
    expect(screen.getByText('Freelance')).toBeInTheDocument()
  })

  it('should render expense category items', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('should show new category button', () => {
    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Nova Categoria')).toBeInTheDocument()
  })

  it('should open create dialog when clicking new category button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    const createButton = screen.getByText('Nova Categoria')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Nova Categoria')).toBeInTheDocument()
      expect(screen.getByLabelText('Nome da categoria')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    setupMocks([], true)

    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Categorias')).toBeInTheDocument()
    expect(screen.getByText('Organize suas receitas e despesas por categoria')).toBeInTheDocument()
  })

  it('should show empty state when no categories exist', () => {
    setupMocks([])

    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Nenhuma categoria cadastrada')).toBeInTheDocument()
    expect(screen.getByText('Criar Primeira Categoria')).toBeInTheDocument()
  })

  it('should show empty income message when no income categories', () => {
    setupMocks(mockCategories.filter(c => c.type === 'EXPENSE'))

    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Nenhuma categoria de receita cadastrada')).toBeInTheDocument()
  })

  it('should show empty expense message when no expense categories', () => {
    setupMocks(mockCategories.filter(c => c.type === 'INCOME'))

    renderWithProviders(<CategoriesPage />)

    expect(screen.getByText('Nenhuma categoria de despesa cadastrada')).toBeInTheDocument()
  })

  it('should have edit buttons for each category', () => {
    renderWithProviders(<CategoriesPage />)

    const editButtons = screen.getAllByRole('button', { name: 'Editar categoria' })
    expect(editButtons).toHaveLength(4)
  })

  it('should have delete buttons for each category', () => {
    renderWithProviders(<CategoriesPage />)

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir categoria' })
    expect(deleteButtons).toHaveLength(4)
  })
})
