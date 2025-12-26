import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { goalsApi, accountsApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Target, TrendingUp, CheckCircle, XCircle, Calendar, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Goal, Account } from '@/types'

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  targetAmount: z.string().min(1, 'Valor alvo é obrigatório'),
  deadline: z.string().min(1, 'Prazo é obrigatório'),
  accountId: z.string().optional(),
  color: z.string().optional(),
})

const contributionSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})

type GoalForm = z.infer<typeof goalSchema>
type ContributionForm = z.infer<typeof contributionSchema>

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const GOAL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16'
]

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isContributeOpen, setIsContributeOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', activeTab],
    queryFn: () => goalsApi.getAll(activeTab),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const handleRefresh = async () => {
    invalidateAll(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsCreateOpen(false)
      resetGoalForm()
      success('Meta criada com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar meta')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalForm> }) =>
      goalsApi.update(id, {
        name: data.name,
        targetAmount: data.targetAmount ? parseFloat(data.targetAmount.replace(',', '.')) : undefined,
        deadline: data.deadline,
        accountId: data.accountId || undefined,
        color: data.color,
      }),
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsEditOpen(false)
      setSelectedGoal(null)
      resetGoalForm()
      success('Meta atualizada com sucesso!')
    },
    onError: () => {
      showError('Erro ao atualizar meta')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Meta excluída com sucesso!')
    },
    onError: () => {
      showError('Erro ao excluir meta')
    },
  })

  const contributeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; date: string; notes?: string } }) =>
      goalsApi.addContribution(id, data),
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsContributeOpen(false)
      setSelectedGoal(null)
      resetContributionForm()
      success('Contribuição adicionada com sucesso!')
    },
    onError: () => {
      showError('Erro ao adicionar contribuição')
    },
  })

  const completeMutation = useMutation({
    mutationFn: goalsApi.complete,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Meta concluída!')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: goalsApi.cancel,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Meta cancelada')
    },
  })

  const {
    register: registerGoal,
    handleSubmit: handleGoalSubmit,
    reset: resetGoalForm,
    setValue: setGoalValue,
    watch: watchGoal,
    formState: { errors: goalErrors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      color: GOAL_COLORS[0],
    },
  })

  const {
    register: registerContribution,
    handleSubmit: handleContributionSubmit,
    reset: resetContributionForm,
    formState: { errors: contributionErrors },
  } = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const selectedColor = watchGoal('color')

  const onGoalSubmit = (data: GoalForm) => {
    const targetAmount = parseFloat(data.targetAmount.replace(',', '.'))

    if (selectedGoal) {
      updateMutation.mutate({ id: selectedGoal.id, data })
    } else {
      createMutation.mutate({
        name: data.name,
        targetAmount,
        deadline: data.deadline,
        accountId: data.accountId || undefined,
        color: data.color,
      })
    }
  }

  const onContributionSubmit = (data: ContributionForm) => {
    if (!selectedGoal) return

    contributeMutation.mutate({
      id: selectedGoal.id,
      data: {
        amount: parseFloat(data.amount.replace(',', '.')),
        date: data.date,
        notes: data.notes,
      },
    })
  }

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal)
    setGoalValue('name', goal.name)
    setGoalValue('targetAmount', goal.targetAmount.toString())
    setGoalValue('deadline', format(new Date(goal.deadline), 'yyyy-MM-dd'))
    setGoalValue('accountId', goal.accountId || '')
    setGoalValue('color', goal.color || GOAL_COLORS[0])
    setIsEditOpen(true)
  }

  const handleContribute = (goal: Goal) => {
    setSelectedGoal(goal)
    resetContributionForm()
    setIsContributeOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Meta',
      description: 'Tem certeza que deseja excluir esta meta? Todas as contribuições serão perdidas.',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleComplete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Concluir Meta',
      description: 'Deseja marcar esta meta como concluída?',
      confirmText: 'Concluir',
    })

    if (confirmed) {
      completeMutation.mutate(id)
    }
  }

  const handleCancel = async (id: string) => {
    const confirmed = await confirm({
      title: 'Cancelar Meta',
      description: 'Deseja cancelar esta meta?',
      confirmText: 'Cancelar Meta',
      variant: 'danger',
    })

    if (confirmed) {
      cancelMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    resetGoalForm()
    setSelectedGoal(null)
    setIsCreateOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas Financeiras</h1>
          <p className="text-gray-600">Acompanhe seus objetivos de economia</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Metas Financeiras</h1>
            <p className="text-gray-600">Acompanhe seus objetivos de economia</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Meta</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'ACTIVE'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Ativas
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'COMPLETED'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Concluídas
          </button>
        </div>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'ACTIVE' ? 'Nenhuma meta ativa' : 'Nenhuma meta concluída'}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {activeTab === 'ACTIVE'
                  ? 'Crie metas para acompanhar seus objetivos de economia'
                  : 'Suas metas concluídas aparecerão aqui'
                }
              </p>
              {activeTab === 'ACTIVE' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = goal.progress
              const daysLeft = differenceInDays(new Date(goal.deadline), new Date())

              return (
                <Card key={goal.id} className="overflow-hidden">
                  <div
                    className="h-2"
                    style={{ backgroundColor: goal.color || GOAL_COLORS[0] }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.deadline), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {goal.status === 'ACTIVE' && (
                            <span className={`text-xs font-medium ${daysLeft < 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ({daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'})
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {goal.status === 'ACTIVE' && (
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleContribute(goal)}>
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Circular Progress */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              className="stroke-gray-200"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke={goal.color || GOAL_COLORS[0]}
                              strokeWidth="12"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${(progress?.percentage || 0) * 3.52} 352`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{(progress?.percentage || 0).toFixed(0)}%</span>
                            {goal.status === 'COMPLETED' && <Sparkles className="h-5 w-5 text-yellow-500 mt-1" />}
                          </div>
                        </div>
                      </div>

                      {/* Values */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500">Acumulado</p>
                          <p className="text-lg font-semibold" style={{ color: goal.color || GOAL_COLORS[0] }}>
                            {formatCurrency(goal.currentAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Meta</p>
                          <p className="text-lg font-semibold">{formatCurrency(goal.targetAmount)}</p>
                        </div>
                      </div>

                      {/* Monthly suggestion */}
                      {goal.status === 'ACTIVE' && progress && progress.monthlyNeeded > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-sm text-blue-600">
                            Economize <strong>{formatCurrency(progress.monthlyNeeded)}</strong>/mês para atingir a meta
                          </p>
                        </div>
                      )}

                      {/* Actions for active goals */}
                      {goal.status === 'ACTIVE' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleCancel(goal.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => handleComplete(goal.id)}
                            style={{ backgroundColor: goal.color || GOAL_COLORS[0] }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluir
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Goal Dialog */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setIsEditOpen(false)
            setSelectedGoal(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
              <DialogClose onClose={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
              }} />
            </DialogHeader>
            <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="space-y-4">
              <Input
                label="Nome da meta"
                placeholder="Ex: Viagem de férias"
                {...registerGoal('name')}
                error={goalErrors.name?.message}
              />

              <Input
                label="Valor alvo (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...registerGoal('targetAmount')}
                error={goalErrors.targetAmount?.message}
              />

              <Input
                label="Prazo"
                type="date"
                {...registerGoal('deadline')}
                error={goalErrors.deadline?.message}
              />

              <Select
                label="Conta vinculada (opcional)"
                options={[
                  { value: '', label: 'Nenhuma' },
                  ...accounts.map((a: Account) => ({ value: a.id, label: a.name })),
                ]}
                {...registerGoal('accountId')}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setGoalValue('color', color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    setIsEditOpen(false)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {(createMutation.isPending || updateMutation.isPending)
                    ? 'Salvando...'
                    : selectedGoal ? 'Salvar Alterações' : 'Criar Meta'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Contribution Dialog */}
        <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Contribuição</DialogTitle>
              <DialogClose onClose={() => setIsContributeOpen(false)} />
            </DialogHeader>
            {selectedGoal && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedGoal.name}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(selectedGoal.currentAmount)} de {formatCurrency(selectedGoal.targetAmount)}
                </p>
              </div>
            )}
            <form onSubmit={handleContributionSubmit(onContributionSubmit)} className="space-y-4">
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...registerContribution('amount')}
                error={contributionErrors.amount?.message}
              />

              <Input
                label="Data"
                type="date"
                {...registerContribution('date')}
                error={contributionErrors.date?.message}
              />

              <Textarea
                label="Observação (opcional)"
                placeholder="Ex: Bônus do trabalho"
                {...registerContribution('notes')}
              />

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsContributeOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={contributeMutation.isPending}
                  className="flex-1"
                >
                  {contributeMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  )
}
