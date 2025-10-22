// User types
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Account types
export interface Account {
  id: string
  name: string
  type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT'
  initialBalance: number
  color?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface AccountWithBalance extends Account {
  balance: number
}

// Category types
export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  color?: string
  icon?: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Credit Card types
export interface CreditCard {
  id: string
  name: string
  closingDay: number
  dueDay: number
  limit?: number
  accountId: string
  userId: string
  createdAt: string
  updatedAt: string
  account: {
    id: string
    name: string
    type: string
  }
}

// Transaction types
export interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  date: string
  purchaseDate?: string
  description: string
  notes?: string
  accountId: string
  categoryId: string
  creditCardId?: string
  recurrenceId?: string
  installmentNumber?: number
  totalInstallments?: number
  userId: string
  createdAt: string
  updatedAt: string
  account: {
    id: string
    name: string
    type: string
  }
  category: {
    id: string
    name: string
    type: string
    color?: string
    icon?: string
  }
  creditCard?: {
    id: string
    name: string
  }
}

// Transfer types
export interface Transfer {
  id: string
  amount: number
  date: string
  description?: string
  fromAccountId: string
  toAccountId: string
  userId: string
  createdAt: string
  updatedAt: string
  fromAccount: {
    id: string
    name: string
    type: string
  }
  toAccount: {
    id: string
    name: string
    type: string
  }
}

// Report types
export interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

export interface DailyBalance {
  date: string
  day: number
  transactions: Transaction[]
  transfers: Transfer[]
  balances: { [accountId: string]: number }
  totalBalance: number
}

export interface MonthlyStatement {
  month: number
  year: number
  dailyBalances: DailyBalance[]
  accounts: Array<{
    id: string
    name: string
    type: string
    color?: string
  }>
}

export interface CategoryReport {
  category: Category
  total: number
  count: number
  transactions: Transaction[]
}

export interface CashFlowData {
  period: string
  income: number
  expense: number
  balance: number
  cumulativeBalance: number
}

// Form types
export interface CreateTransactionForm {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  date: string
  purchaseDate?: string
  description: string
  notes?: string
  accountId: string
  categoryId: string
  creditCardId?: string
  installmentNumber?: number
  totalInstallments?: number
}

export interface CreateInstallmentForm {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  date: string
  purchaseDate?: string
  description: string
  notes?: string
  accountId: string
  categoryId: string
  creditCardId: string
  totalInstallments: number
}

export interface CreateTransferForm {
  amount: number
  date: string
  description?: string
  fromAccountId: string
  toAccountId: string
}
