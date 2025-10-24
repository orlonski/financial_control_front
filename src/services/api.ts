import axios from 'axios'
import type {
  User,
  AuthResponse,
  Account,
  AccountWithBalance,
  Category,
  CreditCard,
  Transaction,
  Transfer,
  TransactionSummary,
  MonthlyStatement,
  CategoryReport,
  CashFlowData,
  CreateTransactionForm,
  CreateInstallmentForm,
  CreateTransferForm
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Accounts API
export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get('/accounts')
    return response.data
  },

  getById: async (id: string): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`)
    return response.data
  },

  create: async (data: Partial<Account>): Promise<Account> => {
    const response = await api.post('/accounts', data)
    return response.data
  },

  update: async (id: string, data: Partial<Account>): Promise<Account> => {
    const response = await api.put(`/accounts/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`)
  },

  getBalance: async (id: string): Promise<{ balance: number }> => {
    const response = await api.get(`/accounts/${id}/balance`)
    return response.data
  },

  getAllWithBalances: async (endDate?: string, accountId?: string): Promise<AccountWithBalance[]> => {
    const response = await api.get('/accounts/balances/all', {
      params: { endDate, accountId }
    })
    return response.data
  },
}

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories')
    return response.data
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  create: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post('/categories', data)
    return response.data
  },

  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}

// Credit Cards API
export const creditCardsApi = {
  getAll: async (): Promise<CreditCard[]> => {
    const response = await api.get('/credit-cards')
    return response.data
  },

  getById: async (id: string): Promise<CreditCard> => {
    const response = await api.get(`/credit-cards/${id}`)
    return response.data
  },

  create: async (data: Partial<CreditCard>): Promise<CreditCard> => {
    const response = await api.post('/credit-cards', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreditCard>): Promise<CreditCard> => {
    const response = await api.put(`/credit-cards/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/credit-cards/${id}`)
  },
}

// Transactions API
export const transactionsApi = {
  getAll: async (filters?: {
    accountId?: string
    categoryId?: string
    creditCardId?: string
    type?: 'INCOME' | 'EXPENSE'
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<Transaction[]> => {
    const response = await api.get('/transactions', { params: filters })
    return response.data
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },

  create: async (data: CreateTransactionForm): Promise<Transaction> => {
    const response = await api.post('/transactions', data)
    return response.data
  },

  createInstallments: async (data: CreateInstallmentForm): Promise<Transaction[]> => {
    const response = await api.post('/transactions/installments', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateTransactionForm>): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },

  getSummary: async (startDate: string, endDate: string, accountId?: string): Promise<TransactionSummary> => {
    const response = await api.get('/transactions/summary/period', {
      params: { startDate, endDate, accountId }
    })
    return response.data
  },
}

// Transfers API
export const transfersApi = {
  getAll: async (): Promise<Transfer[]> => {
    const response = await api.get('/transfers')
    return response.data
  },

  getById: async (id: string): Promise<Transfer> => {
    const response = await api.get(`/transfers/${id}`)
    return response.data
  },

  create: async (data: CreateTransferForm): Promise<Transfer> => {
    const response = await api.post('/transfers', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateTransferForm>): Promise<Transfer> => {
    const response = await api.put(`/transfers/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transfers/${id}`)
  },
}

// Reports API
export const reportsApi = {
  getMonthlyStatement: async (year: number, month: number, accountId?: string): Promise<MonthlyStatement> => {
    const response = await api.get('/reports/monthly-statement', {
      params: { year, month, accountId }
    })
    return response.data
  },

  getByCategory: async (startDate: string, endDate: string): Promise<CategoryReport[]> => {
    const response = await api.get('/reports/by-category', {
      params: { startDate, endDate }
    })
    return response.data
  },

  getCashFlow: async (startDate: string, endDate: string, groupBy?: 'day' | 'week' | 'month' | 'year'): Promise<CashFlowData[]> => {
    const response = await api.get('/reports/cashflow', {
      params: { startDate, endDate, groupBy }
    })
    return response.data
  },
}

export default api
