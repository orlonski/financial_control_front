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
  CreateTransferForm,
  RecurringTransaction,
  CreateRecurringForm,
  BudgetWithUsage,
  Budget,
  CreateBudgetForm,
  BudgetHistory,
  Goal,
  GoalContribution,
  CreateGoalForm,
  CreateContributionForm,
  Reminder,
  ReminderNotification,
  CreateReminderForm,
  CreditCardInvoice
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

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password })
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

  updatePaidStatus: async (id: string, data: { paid: boolean; paidAt?: string; accountId?: string }): Promise<Transaction> => {
    const response = await api.patch(`/transactions/${id}/paid`, data)
    return response.data
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

// ==========================================
// RECURRING TRANSACTIONS API
// ==========================================

export const recurringApi = {
  getAll: async (includeInactive?: boolean): Promise<RecurringTransaction[]> => {
    const response = await api.get('/recurring', { params: { includeInactive } })
    return response.data
  },

  getById: async (id: string): Promise<RecurringTransaction> => {
    const response = await api.get(`/recurring/${id}`)
    return response.data
  },

  create: async (data: CreateRecurringForm): Promise<RecurringTransaction> => {
    const response = await api.post('/recurring', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateRecurringForm>): Promise<RecurringTransaction> => {
    const response = await api.put(`/recurring/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recurring/${id}`)
  },

  pause: async (id: string): Promise<RecurringTransaction> => {
    const response = await api.patch(`/recurring/${id}/pause`)
    return response.data
  },

  resume: async (id: string): Promise<RecurringTransaction> => {
    const response = await api.patch(`/recurring/${id}/resume`)
    return response.data
  },

  generate: async (): Promise<{ generated: number; transactions: Transaction[] }> => {
    const response = await api.post('/recurring/generate')
    return response.data
  },

  getTransactions: async (id: string): Promise<Transaction[]> => {
    const response = await api.get(`/recurring/${id}/transactions`)
    return response.data
  },
}

// ==========================================
// BUDGETS API
// ==========================================

export const budgetsApi = {
  getAll: async (year: number, month: number): Promise<BudgetWithUsage[]> => {
    const response = await api.get('/budgets', { params: { year, month } })
    return response.data
  },

  getById: async (id: string): Promise<Budget> => {
    const response = await api.get(`/budgets/${id}`)
    return response.data
  },

  create: async (data: CreateBudgetForm): Promise<Budget> => {
    const response = await api.post('/budgets', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateBudgetForm>): Promise<Budget> => {
    const response = await api.put(`/budgets/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`)
  },

  getHistory: async (categoryId: string, months?: number): Promise<BudgetHistory[]> => {
    const response = await api.get(`/budgets/history/${categoryId}`, { params: { months } })
    return response.data
  },

  copyFromPrevious: async (year: number, month: number): Promise<Budget[]> => {
    const response = await api.post('/budgets/copy-previous', { year, month })
    return response.data
  },
}

// ==========================================
// GOALS API
// ==========================================

export const goalsApi = {
  getAll: async (status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): Promise<Goal[]> => {
    const response = await api.get('/goals', { params: { status } })
    return response.data
  },

  getById: async (id: string): Promise<Goal> => {
    const response = await api.get(`/goals/${id}`)
    return response.data
  },

  create: async (data: CreateGoalForm): Promise<Goal> => {
    const response = await api.post('/goals', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateGoalForm>): Promise<Goal> => {
    const response = await api.put(`/goals/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`)
  },

  addContribution: async (id: string, data: CreateContributionForm): Promise<GoalContribution> => {
    const response = await api.post(`/goals/${id}/contributions`, data)
    return response.data
  },

  getContributions: async (id: string): Promise<GoalContribution[]> => {
    const response = await api.get(`/goals/${id}/contributions`)
    return response.data
  },

  complete: async (id: string): Promise<Goal> => {
    const response = await api.patch(`/goals/${id}/complete`)
    return response.data
  },

  cancel: async (id: string): Promise<Goal> => {
    const response = await api.patch(`/goals/${id}/cancel`)
    return response.data
  },
}

// ==========================================
// REMINDERS API
// ==========================================

export const remindersApi = {
  getAll: async (status?: string): Promise<Reminder[]> => {
    const response = await api.get('/reminders', { params: { status } })
    return response.data
  },

  getPending: async (daysAhead?: number): Promise<ReminderNotification[]> => {
    const response = await api.get('/reminders/pending', { params: { daysAhead } })
    return response.data
  },

  getById: async (id: string): Promise<Reminder> => {
    const response = await api.get(`/reminders/${id}`)
    return response.data
  },

  create: async (data: CreateReminderForm): Promise<Reminder> => {
    const response = await api.post('/reminders', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateReminderForm>): Promise<Reminder> => {
    const response = await api.put(`/reminders/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/reminders/${id}`)
  },

  markPaid: async (id: string, transactionId?: string): Promise<Reminder> => {
    const response = await api.patch(`/reminders/${id}/paid`, { transactionId })
    return response.data
  },

  dismiss: async (id: string): Promise<Reminder> => {
    const response = await api.patch(`/reminders/${id}/dismiss`)
    return response.data
  },

  getCreditCardInvoices: async (): Promise<CreditCardInvoice[]> => {
    const response = await api.get('/reminders/credit-cards/upcoming')
    return response.data
  },
}

export default api
