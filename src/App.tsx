import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import AccountsPage from '@/pages/AccountsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import CreditCardsPage from '@/pages/CreditCardsPage'
import TransactionsPage from '@/pages/TransactionsPage'
import NewTransactionPage from '@/pages/NewTransactionPage'
import NewInstallmentPage from '@/pages/NewInstallmentPage'
import EditTransactionPage from '@/pages/EditTransactionPage'
import TransfersPage from '@/pages/TransfersPage'
import StatementPage from '@/pages/StatementPage'
import ReportsPage from '@/pages/ReportsPage'
import Layout from '@/components/Layout'

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
