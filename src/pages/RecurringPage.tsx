import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { recurringApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Repeat, Pause, Play, RefreshCw, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { RecurringTransaction, Account, Category, CreditCard } from '@/types'

const recurringSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  intervalCount: z.string().min(1),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  creditCardId: z.string().optional(),
})

type RecurringForm = z.infer<typeof recurringSchema>

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

const intervalOptions = [
  { value: 'DAY', label: 'Dia(s)' },
  { value: 'WEEK', label: 'Semana(s)' },
  { value: 'MONTH', label: 'Mês(es)' },
  { value: 'YEAR', label: 'Ano(s)' },
]

const typeOptions = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
]

export default function RecurringPage() {
  const [showInactive, setShowInactive] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: recurrings = [], isLoading } = useQuery({
    queryKey: ['recurring', showInactive],
    queryFn: () => recurringApi.getAll(showInactive),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: creditCards = [] } = useQuery({
    queryKey: ['creditCards'],
    queryFn: creditCardsApi.getAll,
  })

  const handleRefresh = async () => {
    invalidateAll(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsCreateOpen(false)
      reset()
      success('Transação recorrente criada com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar transação recorrente')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringForm> }) =>
      recurringApi.update(id, {
        type: data.type,
        amount: data.amount ? parseFloat(data.amount.replace(',', '.')) : undefined,
        description: data.description,
        interval: data.interval,
        intervalCount: data.intervalCount ? parseInt(data.intervalCount) : undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        accountId: data.accountId,
        categoryId: data.categoryId,
        creditCardId: data.creditCardId || undefined,
      }),
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsEditOpen(false)
      setSelectedRecurring(null)
      reset()
      success('Transação recorrente atualizada!')
    },
    onError: () => {
      showError('Erro ao atualizar')
    },
  })

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: 'EXPENSE',
      interval: 'MONTH',
      intervalCount: '1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const selectedType = watch('type')

  const filteredCategories = categories.filter((c: Category) => c.type === selectedType)

  const onSubmit = (data: RecurringForm) => {
    const formData = {
      type: data.type as 'INCOME' | 'EXPENSE',
      amount: parseFloat(data.amount.replace(',', '.')),
      description: data.description,
      interval: data.interval as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
      intervalCount: parseInt(data.intervalCount),
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      accountId: data.accountId,
      categoryId: data.categoryId,
      creditCardId: data.creditCardId || undefined,
    }

    if (selectedRecurring) {
      updateMutation.mutate({ id: selectedRecurring.id, data })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (recurring: RecurringTransaction) => {
    setSelectedRecurring(recurring)
    setValue('amount', recurring.amount?.toString() || '')
    setValue('description', recurring.description || '')
    setValue('interval', recurring.interval)
    setValue('intervalCount', recurring.intervalCount.toString())
    setValue('startDate', format(new Date(recurring.startDate), 'yyyy-MM-dd'))
    setValue('endDate', recurring.endDate ? format(new Date(recurring.endDate), 'yyyy-MM-dd') : '')
    setValue('accountId', recurring.accountId || '')
    setValue('categoryId', recurring.categoryId || '')
    setValue('creditCardId', recurring.creditCardId || '')
    setIsEditOpen(true)
  }

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

  const handleCreate = () => {
    reset()
    setSelectedRecurring(null)
    setIsCreateOpen(true)
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
            <Button onClick={handleCreate}>
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
              <Button onClick={handleCreate}>
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
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(recurring)}>
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
                            Próximo: {format(new Date(recurring.nextDueDate), "d 'de' MMM", { locale: ptBR })}
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

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setIsEditOpen(false)
            setSelectedRecurring(null)
          }
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRecurring ? 'Editar Recorrência' : 'Nova Recorrência'}
              </DialogTitle>
              <DialogClose onClose={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
              }} />
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="Tipo"
                options={typeOptions}
                {...register('type')}
                error={errors.type?.message}
              />

              <Input
                label="Descrição"
                placeholder="Ex: Aluguel, Netflix, Salário"
                {...register('description')}
                error={errors.description?.message}
              />

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('amount')}
                error={errors.amount?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="A cada"
                  type="number"
                  min="1"
                  max="30"
                  {...register('intervalCount')}
                  error={errors.intervalCount?.message}
                />
                <Select
                  label="Período"
                  options={intervalOptions}
                  {...register('interval')}
                  error={errors.interval?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data de início"
                  type="date"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                />
                <Input
                  label="Data final (opcional)"
                  type="date"
                  {...register('endDate')}
                />
              </div>

              <Select
                label="Conta"
                options={accounts.map((a: Account) => ({ value: a.id, label: a.name }))}
                {...register('accountId')}
                error={errors.accountId?.message}
              />

              <Select
                label="Categoria"
                options={filteredCategories.map((c: Category) => ({
                  value: c.id,
                  label: `${c.icon || ''} ${c.name}`,
                }))}
                {...register('categoryId')}
                error={errors.categoryId?.message}
              />

              {selectedType === 'EXPENSE' && creditCards.length > 0 && (
                <Select
                  label="Cartão de Crédito (opcional)"
                  options={[
                    { value: '', label: 'Nenhum' },
                    ...creditCards.map((c: CreditCard) => ({ value: c.id, label: c.name })),
                  ]}
                  {...register('creditCardId')}
                />
              )}

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
                    : selectedRecurring ? 'Salvar Alterações' : 'Criar Recorrência'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  )
}
