import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { accountsApi, transactionsApi } from '@/services/api'
import { PullToRefresh } from '@/components/PullToRefresh'
import { MonthFilter } from '@/components/MonthFilter'
import { invalidateTransactionRelated } from '@/lib/queryInvalidation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialSummaryCards } from '@/components/FinancialSummaryCards'
import { Wallet, Plus, ArrowLeftRight, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MONTHS } from '@/constants/dateOptions'
import { useMonthNavigation } from '@/hooks/useMonthNavigation'
import { DashboardReminders } from '@/components/dashboard/DashboardReminders'
import { DashboardBudgets } from '@/components/dashboard/DashboardBudgets'
import { DashboardGoals } from '@/components/dashboard/DashboardGoals'
import { FloatingActionMenu } from '@/components/FloatingActionMenu'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    navigateMonth,
    goToCurrentMonth,
  } = useMonthNavigation()
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const handleRefresh = async () => {
    invalidateTransactionRelated(queryClient)
  }

  // Calculate dates for historical balances
  const endOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
  const endOfPreviousMonth = new Date(selectedYear, selectedMonth - 1, 0).toISOString().split('T')[0]

  // Get initial balance (end of previous month)
  const { data: initialAccounts = [] } = useQuery({
    queryKey: ['accounts-initial-balances', endOfPreviousMonth, selectedAccountId],
    queryFn: () => accountsApi.getAllWithBalances(endOfPreviousMonth, selectedAccountId || undefined),
  })

  // Get final balance (end of selected month)
  const { data: finalAccounts = [] } = useQuery({
    queryKey: ['accounts-final-balances', endOfMonth, selectedAccountId],
    queryFn: () => accountsApi.getAllWithBalances(endOfMonth, selectedAccountId || undefined),
  })

  const { data: summary } = useQuery({
    queryKey: ['transaction-summary', selectedYear, selectedMonth, selectedAccountId],
    queryFn: () => {
      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
      const endOfMonth = new Date(selectedYear, selectedMonth, 0)

      return transactionsApi.getSummary(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0],
        selectedAccountId || undefined
      )
    },
  })

  // Calculate balances
  const initialBalance = selectedAccountId
    ? (initialAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : initialAccounts.reduce((sum, account) => sum + account.balance, 0)

  const finalBalance = selectedAccountId
    ? (finalAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : finalAccounts.reduce((sum, account) => sum + account.balance, 0)

  const totalIncome = summary?.totalIncome || 0
  const totalExpense = summary?.totalExpense || 0

  const isLoading = !summary || initialAccounts.length === 0 || finalAccounts.length === 0

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Filters */}
      <MonthFilter
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={(month) => setSelectedMonth(month as number)}
        onNavigateMonth={navigateMonth}
        additionalFilters={[
          {
            key: 'account',
            label: 'Conta',
            options: [
              { value: '', label: 'Todas as contas' },
              ...finalAccounts.map(account => ({
                value: account.id,
                label: account.name
              }))
            ],
            value: selectedAccountId,
            onChange: setSelectedAccountId,
          }
        ]}
        onClearFilters={() => {
          goToCurrentMonth()
          setSelectedAccountId('')
        }}
      />

      {/* Summary Cards */}
      <FinancialSummaryCards
        initialBalance={initialBalance}
        finalBalance={finalBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        monthLabel={MONTHS[selectedMonth - 1].label}
        isLoading={isLoading}
      />

      {/* Accounts */}
      {!isLoading && !selectedAccountId && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Suas Contas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-xl sm:text-2xl font-bold ${account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatCurrency(account.balance)}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {account.type.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardReminders />
        <DashboardBudgets month={selectedMonth} year={selectedYear} />
      </div>

      <DashboardGoals />

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/transactions/new')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base">Nova Transação</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Adicionar receita ou despesa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/transfers')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base">Transferência</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Transferir entre contas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/statement')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base">Ver Extrato</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Consultar movimentações
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
    <FloatingActionMenu />
    </PullToRefresh>
  )
}
