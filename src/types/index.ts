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
  usedAmount?: number
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
  paid?: boolean
  paidAt?: string
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

// ==========================================
// RECURRING TRANSACTIONS (Transações Recorrentes)
// ==========================================

export type RecurrenceInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

export interface RecurringTransaction {
  id: string
  type: 'INSTALLMENT' | 'RECURRING'
  interval: RecurrenceInterval
  intervalCount: number
  startDate: string
  endDate?: string
  nextDueDate?: string
  totalInstallments?: number
  description?: string
  amount?: number
  isActive: boolean
  accountId?: string
  categoryId?: string
  creditCardId?: string
  userId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRecurringForm {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  interval: RecurrenceInterval
  intervalCount: number
  startDate: string
  endDate?: string
  accountId: string
  categoryId: string
  creditCardId?: string
}

// ==========================================
// BUDGETS (Orçamentos)
// ==========================================

export interface Budget {
  id: string
  amount: number
  month: number
  year: number
  userId: string
  categoryId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    type: string
    color?: string
    icon?: string
  }
}

export interface BudgetWithUsage extends Budget {
  spent: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'exceeded'
}

export interface CreateBudgetForm {
  amount: number
  month: number
  year: number
  categoryId: string
}

export interface BudgetHistory {
  month: number
  year: number
  budgeted: number
  spent: number
  difference: number
}

// ==========================================
// GOALS (Metas Financeiras)
// ==========================================

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  color?: string
  icon?: string
  status: GoalStatus
  completedAt?: string
  userId: string
  accountId?: string
  createdAt: string
  updatedAt: string
  account?: {
    id: string
    name: string
    type: string
  }
  progress?: GoalProgress
}

export interface GoalProgress {
  percentage: number
  remaining: number
  daysLeft: number
  monthlyNeeded: number
  isOnTrack: boolean
}

export interface GoalContribution {
  id: string
  amount: number
  date: string
  notes?: string
  goalId: string
  createdAt: string
}

export interface CreateGoalForm {
  name: string
  targetAmount: number
  deadline: string
  accountId?: string
  color?: string
  icon?: string
}

export interface CreateContributionForm {
  amount: number
  date: string
  notes?: string
}

// ==========================================
// REMINDERS (Lembretes)
// ==========================================

export type ReminderStatus = 'PENDING' | 'PAID' | 'DISMISSED' | 'OVERDUE'

export interface Reminder {
  id: string
  title: string
  description?: string
  amount: number
  dueDate: string
  reminderDays: number
  status: ReminderStatus
  isRecurring: boolean
  userId: string
  transactionId?: string
  creditCardId?: string
  recurrenceId?: string
  createdAt: string
  updatedAt: string
  creditCard?: {
    id: string
    name: string
    dueDay: number
  }
}

export interface ReminderNotification {
  reminderId: string
  daysUntilDue: number
  isOverdue: boolean
  reminder: Reminder
}

export interface CreateReminderForm {
  title: string
  description?: string
  amount: number
  dueDate: string
  reminderDays: number
  creditCardId?: string
  isRecurring: boolean
}

export interface CreditCardInvoice {
  creditCardId: string
  creditCardName: string
  accountName: string
  dueDate: string
  daysUntilDue: number
  amount: number
  invoiceStartDate: string
  invoiceEndDate: string
}
