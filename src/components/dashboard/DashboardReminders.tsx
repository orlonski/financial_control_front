import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { remindersApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ReminderNotification } from '@/types'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function DashboardReminders() {
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', 'pending', 7],
    queryFn: () => remindersApi.getPending(7),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Próximos Vencimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const overdueCount = reminders.filter((r: ReminderNotification) => r.isOverdue).length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Próximos Vencimentos
            {overdueCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {overdueCount} atrasado(s)
              </span>
            )}
          </CardTitle>
          <Link to="/reminders" className="text-sm text-blue-600 hover:underline flex items-center">
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum vencimento nos próximos 7 dias
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.slice(0, 5).map((notification: ReminderNotification) => (
              <div
                key={notification.reminderId}
                className={`flex justify-between items-center p-2 rounded ${
                  notification.isOverdue ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notification.isOverdue && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{notification.reminder.title}</p>
                    <p className="text-xs text-gray-500">
                      {notification.isOverdue
                        ? `Venceu há ${Math.abs(notification.daysUntilDue)} dias`
                        : notification.daysUntilDue === 0
                          ? 'Vence hoje!'
                          : `Vence em ${notification.daysUntilDue} dias`
                      }
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${notification.isOverdue ? 'text-red-600' : ''}`}>
                  {formatCurrency(notification.reminder.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
