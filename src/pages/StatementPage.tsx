import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MonthlyStatement } from '@/types'

export default function StatementPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const { data: statement, isLoading } = useQuery({
    queryKey: ['monthly-statement', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyStatement(selectedYear, selectedMonth),
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Select
                  options={months.map(month => ({
                    value: month.value.toString(),
                    label: month.label
                  }))}
                  value={selectedMonth.toString()}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                />
                <Select
                  options={years.map(year => ({
                    value: year.toString(),
                    label: year.toString()
                  }))}
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">
                {months[selectedMonth - 1].label} de {selectedYear}
              </div>
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
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Dia {dayBalance.day}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(dayBalance.date + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
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
                <CardContent>
                  {/* Transactions */}
                  {dayBalance.transactions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Transações</h4>
                      <div className="space-y-2">
                        {dayBalance.transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className="text-sm">{transaction.description}</span>
                              <span className="text-xs text-gray-500">
                                {transaction.category.name}
                              </span>
                              {transaction.creditCard && (
                                <span className="text-xs text-blue-600">
                                  💳 {transaction.creditCard.name}
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-medium ${
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
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Transferências</h4>
                      <div className="space-y-2">
                        {dayBalance.transfers.map((transfer) => (
                          <div key={transfer.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-sm">
                                {transfer.fromAccount.name} → {transfer.toAccount.name}
                              </span>
                              {transfer.description && (
                                <span className="text-xs text-gray-500">
                                  {transfer.description}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
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
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Saldos por Conta</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {statement.accounts.map((account) => (
                        <div key={account.id} className="text-center">
                          <div className="text-xs text-gray-600">{account.name}</div>
                          <div className={`text-sm font-medium ${
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
