import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { accountsApi, transactionsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, ArrowLeftRight, FileText } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

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

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  // Calculate balances
  const initialBalance = selectedAccountId
    ? (initialAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : initialAccounts.reduce((sum, account) => sum + account.balance, 0)

  const finalBalance = selectedAccountId
    ? (finalAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : finalAccounts.reduce((sum, account) => sum + account.balance, 0)

  const totalIncome = summary?.totalIncome || 0
  const totalExpense = summary?.totalExpense || 0
  const monthlyResult = totalIncome - totalExpense

  const isLoading = !summary || initialAccounts.length === 0 || finalAccounts.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Mês"
              options={months.map(month => ({
                value: month.value.toString(),
                label: month.label
              }))}
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            />
            <Select
              label="Ano"
              options={years.map(year => ({
                value: year.toString(),
                label: year.toString()
              }))}
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            />
            <Select
              label="Conta"
              options={[
                { value: '', label: 'Todas as contas' },
                ...finalAccounts.map(account => ({
                  value: account.id,
                  label: account.name
                }))
              ]}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Saldo Inicial</CardTitle>
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-2xl font-bold">
                {initialBalance.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Fim do mês anterior
              </p>
            </CardContent>
          </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-green-600">
              {totalIncome.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {months[selectedMonth - 1].label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-2xl font-bold text-red-600">
              {totalExpense.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {months[selectedMonth - 1].label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Resultado</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-base sm:text-2xl font-bold ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyResult.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo Final</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-base sm:text-2xl font-bold ${finalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {finalBalance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Fim do mês
            </p>
          </CardContent>
        </Card>
        </div>
      )}

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
                  <div className="text-xl sm:text-2xl font-bold">
                    {account.balance.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
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
  )
}
