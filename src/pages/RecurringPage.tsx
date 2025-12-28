import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { recurringApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Repeat, Pause, Play, RefreshCw, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const intervalLabels: Record<string, string> = {
  DAY: 'Diário',
  WEEK: 'Semanal',
  MONTH: 'Mensal',
  YEAR: 'Anual',
}

export default function RecurringPage() {
  const [showInactive, setShowInactive] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: recurrings = [], isLoading } = useQuery({
    queryKey: ['recurring', showInactive],
    queryFn: () => recurringApi.getAll(showInactive),
  })

  const handleRefresh = async () => {
    invalidateAll(queryClient)
  }

  const deleteMutation = useMutation({
    mutationFn: recurringApi.delete,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Transação recorrente excluída!')
    },
    onError: () => {
      showError('Erro ao excluir')
    },
  })

  const pauseMutation = useMutation({
    mutationFn: recurringApi.pause,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Recorrência pausada!')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: recurringApi.resume,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Recorrência retomada!')
    },
  })

  const generateMutation = useMutation({
    mutationFn: recurringApi.generate,
    onSuccess: (data) => {
      invalidateAll(queryClient)
      success(`${data.generated} transação(ões) gerada(s)!`)
    },
    onError: () => {
      showError('Erro ao gerar transações')
    },
  })

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Recorrência',
      description: 'Tem certeza que deseja excluir esta transação recorrente?',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const activeRecurrings = recurrings.filter(r => r.isActive)
  const inactiveRecurrings = recurrings.filter(r => !r.isActive)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações Recorrentes</h1>
          <p className="text-gray-600">Gerencie suas despesas e receitas fixas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {ConfirmDialog}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transações Recorrentes</h1>
            <p className="text-gray-600">Gerencie suas despesas e receitas fixas</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Gerar Pendentes</span>
            </Button>
            <Button onClick={() => navigate('/recurring/new')}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Recorrência</span>
            </Button>
          </div>
        </div>

        {recurrings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Repeat className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma transação recorrente
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Cadastre despesas fixas como aluguel, assinaturas e salários
              </p>
              <Button onClick={() => navigate('/recurring/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Recorrência
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Recurrings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ativas ({activeRecurrings.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRecurrings.map((recurring) => (
                  <Card key={recurring.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{recurring.description}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            A cada {recurring.intervalCount} {intervalLabels[recurring.interval].toLowerCase()}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => pauseMutation.mutate(recurring.id)}
                            title="Pausar"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/recurring/${recurring.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(recurring.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {formatCurrency(recurring.amount || 0)}
                        </span>
                        {recurring.nextDueDate && (
                          <span className="text-sm text-gray-500">
                            Próximo: {format(parseISO(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inactive Recurrings */}
            {inactiveRecurrings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-500">
                    Pausadas ({inactiveRecurrings.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInactive(!showInactive)}
                  >
                    {showInactive ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                {showInactive && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inactiveRecurrings.map((recurring) => (
                      <Card key={recurring.id} className="opacity-60">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{recurring.description}</CardTitle>
                              <CardDescription>
                                A cada {recurring.intervalCount} {intervalLabels[recurring.interval].toLowerCase()}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resumeMutation.mutate(recurring.id)}
                                title="Retomar"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(recurring.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <span className="text-2xl font-bold text-gray-400">
                            {formatCurrency(recurring.amount || 0)}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
