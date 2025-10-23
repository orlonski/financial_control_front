import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, accountsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function StatementPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const { data: statement, isLoading } = useQuery({
    queryKey: ['monthly-statement', selectedYear, selectedMonth, selectedAccountId],
    queryFn: () => reportsApi.getMonthlyStatement(selectedYear, selectedMonth, selectedAccountId || undefined),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  const goToCurrentMonth = () => {
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extrato Mensal</h1>
          <p className="text-gray-600">Visualize suas movimentações dia a dia</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extrato Mensal</h1>
          <p className="text-gray-600">Visualize suas movimentações dia a dia</p>
        </div>
        <Button onClick={goToCurrentMonth} variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Mês Atual
        </Button>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <div className="text-sm sm:text-base font-medium text-gray-900">
                  {months[selectedMonth - 1].label} de {selectedYear}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                  ...accounts.map(account => ({
                    value: account.id,
                    label: account.name
                  }))
                ]}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {statement && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statement.dailyBalances[0]?.totalBalance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }) || 'R$ 0,00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statement.dailyBalances[statement.dailyBalances.length - 1]?.totalBalance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }) || 'R$ 0,00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Variação</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (statement.dailyBalances[statement.dailyBalances.length - 1]?.totalBalance || 0) >= 
                  (statement.dailyBalances[0]?.totalBalance || 0) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {((statement.dailyBalances[statement.dailyBalances.length - 1]?.totalBalance || 0) - 
                    (statement.dailyBalances[0]?.totalBalance || 0)).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Balances */}
          <div className="space-y-4">
            {statement.dailyBalances.map((dayBalance) => (
              <Card key={dayBalance.date}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg">
                        Dia {dayBalance.day}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {format(new Date(dayBalance.date + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`text-base sm:text-lg font-bold ${
                        dayBalance.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dayBalance.totalBalance.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Transactions */}
                  {dayBalance.transactions.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Transações</h4>
                      <div className="space-y-2">
                        {dayBalance.transactions.map((transaction) => (
                          <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded">
                            <div className="flex items-start space-x-2 min-w-0 flex-1">
                              <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium break-words">{transaction.description}</div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">{transaction.category.name}</span>
                                  {transaction.creditCard && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-blue-600 flex items-center">
                                        💳 {transaction.creditCard.name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm sm:text-base font-medium flex-shrink-0 ${
                              transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'INCOME' ? '+' : '-'}
                              {transaction.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfers */}
                  {dayBalance.transfers.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Transferências</h4>
                      <div className="space-y-2">
                        {dayBalance.transfers.map((transfer) => (
                          <div key={transfer.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-blue-50 rounded">
                            <div className="flex items-start space-x-2 min-w-0 flex-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm break-words">
                                  {transfer.fromAccount.name} → {transfer.toAccount.name}
                                </div>
                                {transfer.description && (
                                  <div className="text-xs text-gray-500 mt-1 break-words">
                                    {transfer.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm sm:text-base font-medium text-gray-900 flex-shrink-0">
                              {transfer.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Balances */}
                  <div className="pt-4 border-t">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3">Saldos por Conta</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {statement.accounts.map((account) => (
                        <div key={account.id} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600 truncate mb-1">{account.name}</div>
                          <div className={`text-xs sm:text-sm font-medium ${
                            (dayBalance.balances[account.id] || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(dayBalance.balances[account.id] || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
