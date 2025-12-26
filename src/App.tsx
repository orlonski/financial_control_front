import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'

// Lazy loading das páginas para melhor performance mobile
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AccountsPage = lazy(() => import('@/pages/AccountsPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const CreditCardsPage = lazy(() => import('@/pages/CreditCardsPage'))
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'))
const NewTransactionPage = lazy(() => import('@/pages/NewTransactionPage'))
const NewInstallmentPage = lazy(() => import('@/pages/NewInstallmentPage'))
const EditTransactionPage = lazy(() => import('@/pages/EditTransactionPage'))
const TransfersPage = lazy(() => import('@/pages/TransfersPage'))
const StatementPage = lazy(() => import('@/pages/StatementPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const BudgetsPage = lazy(() => import('@/pages/BudgetsPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const RecurringPage = lazy(() => import('@/pages/RecurringPage'))
const NewRecurringPage = lazy(() => import('@/pages/NewRecurringPage'))
const EditRecurringPage = lazy(() => import('@/pages/EditRecurringPage'))
const RemindersPage = lazy(() => import('@/pages/RemindersPage'))

// Loading spinner para Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/credit-cards" element={<CreditCardsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/new" element={<NewTransactionPage />} />
          <Route path="/transactions/installment" element={<NewInstallmentPage />} />
          <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/statement" element={<StatementPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/recurring/new" element={<NewRecurringPage />} />
          <Route path="/recurring/:id/edit" element={<EditRecurringPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
