import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock data
const mockUser = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
}

const mockAccount = {
  id: '1',
  name: 'Test Account',
  type: 'CHECKING',
  initialBalance: 1000,
  color: '#FF0000',
  userId: '1',
}

const mockCategory = {
  id: '1',
  name: 'Test Category',
  type: 'EXPENSE',
  color: '#00FF00',
  icon: '💰',
  userId: '1',
}

const mockCreditCard = {
  id: '1',
  name: 'Test Card',
  closingDay: 5,
  dueDay: 10,
  limit: 5000,
  accountId: '1',
  userId: '1',
}

const mockTransaction = {
  id: '1',
  type: 'EXPENSE',
  amount: 100,
  date: '2024-01-15',
  description: 'Test Transaction',
  accountId: '1',
  categoryId: '1',
  userId: '1',
}

const mockTransfer = {
  id: '1',
  amount: 200,
  date: '2024-01-15',
  description: 'Test Transfer',
  fromAccountId: '1',
  toAccountId: '2',
  userId: '1',
}

// Mock handlers
export const handlers = [
  // Auth routes
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      token: 'mock-token',
      user: mockUser,
    })
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-token',
      user: mockUser,
    })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUser)
  }),

  // Accounts routes
  http.get('/api/accounts', () => {
    return HttpResponse.json([mockAccount])
  }),

  http.get('/api/accounts/with-balances', () => {
    return HttpResponse.json([
      { ...mockAccount, balance: 1000 }
    ])
  }),

  http.post('/api/accounts', () => {
    return HttpResponse.json(mockAccount, { status: 201 })
  }),

  http.put('/api/accounts/:id', () => {
    return HttpResponse.json(mockAccount)
  }),

  http.delete('/api/accounts/:id', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // Categories routes
  http.get('/api/categories', () => {
    return HttpResponse.json([mockCategory])
  }),

  http.post('/api/categories', () => {
    return HttpResponse.json(mockCategory, { status: 201 })
  }),

  http.put('/api/categories/:id', () => {
    return HttpResponse.json(mockCategory)
  }),

  http.delete('/api/categories/:id', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // Credit Cards routes
  http.get('/api/credit-cards', () => {
    return HttpResponse.json([mockCreditCard])
  }),

  http.post('/api/credit-cards', () => {
    return HttpResponse.json(mockCreditCard, { status: 201 })
  }),

  http.put('/api/credit-cards/:id', () => {
    return HttpResponse.json(mockCreditCard)
  }),

  http.delete('/api/credit-cards/:id', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // Transactions routes
  http.get('/api/transactions', () => {
    return HttpResponse.json([mockTransaction])
  }),

  http.get('/api/transactions/summary', () => {
    return HttpResponse.json({
      totalIncome: 1000,
      totalExpense: 500,
      balance: 500,
      transactionCount: 2,
    })
  }),

  http.post('/api/transactions', () => {
    return HttpResponse.json(mockTransaction, { status: 201 })
  }),

  http.post('/api/transactions/installments', () => {
    return HttpResponse.json([
      { ...mockTransaction, installmentNumber: 1, totalInstallments: 3 },
      { ...mockTransaction, installmentNumber: 2, totalInstallments: 3 },
      { ...mockTransaction, installmentNumber: 3, totalInstallments: 3 },
    ], { status: 201 })
  }),

  http.put('/api/transactions/:id', () => {
    return HttpResponse.json(mockTransaction)
  }),

  http.delete('/api/transactions/:id', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // Transfers routes
  http.get('/api/transfers', () => {
    return HttpResponse.json([mockTransfer])
  }),

  http.post('/api/transfers', () => {
    return HttpResponse.json(mockTransfer, { status: 201 })
  }),

  http.put('/api/transfers/:id', () => {
    return HttpResponse.json(mockTransfer)
  }),

  http.delete('/api/transfers/:id', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // Reports routes
  http.get('/api/reports/monthly-statement', () => {
    return HttpResponse.json({
      year: 2024,
      month: 1,
      dailyBalances: [
        {
          date: '2024-01-15',
          day: 15,
          totalBalance: 1000,
          transactions: [mockTransaction],
          transfers: [],
          balances: { '1': 1000 },
        },
      ],
      accounts: [mockAccount],
    })
  }),

  http.get('/api/reports/category-summary', () => {
    return HttpResponse.json([
      {
        category: mockCategory,
        totalAmount: 500,
        transactionCount: 5,
      },
    ])
  }),

  http.get('/api/reports/cash-flow', () => {
    return HttpResponse.json([
      {
        date: '2024-01-15',
        income: 1000,
        expense: 500,
        balance: 500,
      },
    ])
  }),
]

// Setup server
export const server = setupServer(...handlers)
