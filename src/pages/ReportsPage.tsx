import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { CategoryReport, CashFlowData } from '@/types'

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [reportType, setReportType] = useState<'category' | 'cashflow'>('category')

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

  const { data: categoryReport = [], isLoading: categoryLoading } = useQuery({
    queryKey: ['category-report', startDate, endDate],
    queryFn: () => reportsApi.getByCategory(startDate, endDate),
    enabled: reportType === 'category',
  })

  const { data: cashFlowData = [], isLoading: cashFlowLoading } = useQuery({
    queryKey: ['cashflow-report', startDate, endDate],
    queryFn: () => reportsApi.getCashFlow(startDate, endDate, 'day'),
    enabled: reportType === 'cashflow',
  })

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

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  const isLoading = categoryLoading || cashFlowLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Analise seus gastos e receitas</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Analise seus gastos e receitas</p>
        </div>
        <Button onClick={() => window.location.href = '/statement'} variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Ver Extrato
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={reportType === 'category' ? 'default' : 'outline'}
                onClick={() => setReportType('category')}
                className="w-full"
              >
                <PieChart className="h-4 w-4 mr-2" />
                Por Categoria
              </Button>
              <Button
                variant={reportType === 'cashflow' ? 'default' : 'outline'}
                onClick={() => setReportType('cashflow')}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Fluxo de Caixa
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Report */}
      {reportType === 'category' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Despesas por Categoria
              </CardTitle>
              <CardDescription>
                {months[selectedMonth - 1].label} de {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryReport.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPieChart
                      data={categoryReport.map((item, index) => ({
                        name: item.category.name,
                        value: item.total,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryReport.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Comparativo por Categoria
              </CardTitle>
              <CardDescription>
                Valores em reais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryReport.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryReport.map((item, index) => ({
                    name: item.category.name,
                    value: item.total,
                    color: COLORS[index % COLORS.length]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Detalhamento por Categoria</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Lista completa de gastos por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryReport.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {categoryReport.map((item, index) => (
                    <div key={item.category.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-sm sm:text-base truncate">{item.category.name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {item.count} transa{item.count !== 1 ? 'ções' : 'ção'}
                        </span>
                      </div>
                      <div className="text-left sm:text-right pl-5 sm:pl-0">
                        <div className="font-bold text-base sm:text-lg">
                          R$ {item.total.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {((item.total / categoryReport.reduce((sum, cat) => sum + cat.total, 0)) * 100).toFixed(1)}% do total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                  Nenhuma categoria com gastos no período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cash Flow Report */}
      {reportType === 'cashflow' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Fluxo de Caixa Diário
              </CardTitle>
              <CardDescription>
                Evolução do saldo ao longo do mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cashFlowData.map(item => ({
                    ...item,
                    period: new Date(item.period).getDate()
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `R$ ${Number(value).toLocaleString('pt-BR')}`,
                        name === 'cumulativeBalance' ? 'Saldo Acumulado' : 
                        name === 'income' ? 'Receitas' : 
                        name === 'expense' ? 'Despesas' : name
                      ]}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Receitas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeBalance" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Saldo Acumulado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {cashFlowData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Receitas</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-2xl font-bold text-green-600">
                    R$ {cashFlowData.reduce((sum, item) => sum + item.income, 0).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Despesas</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-2xl font-bold text-red-600">
                    R$ {cashFlowData.reduce((sum, item) => sum + item.expense, 0).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Saldo Final</CardTitle>
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-base sm:text-2xl font-bold ${
                    cashFlowData[cashFlowData.length - 1]?.cumulativeBalance >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    R$ {(cashFlowData[cashFlowData.length - 1]?.cumulativeBalance || 0).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Resultado</CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-base sm:text-2xl font-bold ${
                    (cashFlowData.reduce((sum, item) => sum + item.income, 0) -
                     cashFlowData.reduce((sum, item) => sum + item.expense, 0)) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    R$ {(cashFlowData.reduce((sum, item) => sum + item.income, 0) -
                         cashFlowData.reduce((sum, item) => sum + item.expense, 0)).toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
