import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { goalsApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, ChevronRight } from 'lucide-react'
import type { Goal } from '@/types'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function DashboardGoals() {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', 'ACTIVE'],
    queryFn: () => goalsApi.getAll('ACTIVE'),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Metas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Metas Ativas ({goals.length})
          </CardTitle>
          <Link to="/goals" className="text-sm text-blue-600 hover:underline flex items-center">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">Nenhuma meta ativa</p>
            <Link to="/goals" className="text-sm text-blue-600 hover:underline">
              Criar meta
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal: Goal) => {
              const percentage = goal.progress?.percentage || 0

              return (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-xs text-gray-500">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: goal.color || '#3B82F6'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
