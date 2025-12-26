import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { budgetsApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PiggyBank, ChevronRight, AlertTriangle } from 'lucide-react'
import type { BudgetWithUsage } from '@/types'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

interface DashboardBudgetsProps {
  month: number
  year: number
}

export function DashboardBudgets({ month, year }: DashboardBudgetsProps) {
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', year, month],
    queryFn: () => budgetsApi.getAll(year, month),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <PiggyBank className="h-4 w-4 mr-2" />
            Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter budgets that are warning or exceeded
  const alertBudgets = budgets.filter((b: BudgetWithUsage) => b.status === 'warning' || b.status === 'exceeded')

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <PiggyBank className="h-4 w-4 mr-2" />
            Orçamentos
            {alertBudgets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {alertBudgets.length} alerta(s)
              </span>
            )}
          </CardTitle>
          <Link to="/budgets" className="text-sm text-blue-600 hover:underline flex items-center">
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">Nenhum orçamento definido</p>
            <Link to="/budgets" className="text-sm text-blue-600 hover:underline">
              Criar orçamento
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.slice(0, 4).map((budget: BudgetWithUsage) => (
              <div key={budget.id}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <div className="flex items-center gap-1">
                    <span>{budget.category.icon}</span>
                    <span className="font-medium">{budget.category.name}</span>
                    {budget.status !== 'ok' && (
                      <AlertTriangle className={`h-3 w-3 ${
                        budget.status === 'exceeded' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                    )}
                  </div>
                  <span className="text-gray-600">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(budget.status)} transition-all`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
