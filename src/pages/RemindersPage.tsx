import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { remindersApi, creditCardsApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Bell, Check, X, AlertTriangle, Calendar, CreditCard } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Reminder, ReminderNotification, CreditCard as CreditCardType, CreditCardInvoice } from '@/types'

const reminderSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  reminderDays: z.string().default('3'),
  creditCardId: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

type ReminderForm = z.infer<typeof reminderSchema>

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  DISMISSED: 'Dispensado',
  OVERDUE: 'Atrasado',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: pendingReminders = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['reminders', 'pending'],
    queryFn: () => remindersApi.getPending(30),
  })

  const { data: allReminders = [], isLoading: allLoading } = useQuery({
    queryKey: ['reminders', 'all'],
    queryFn: () => remindersApi.getAll(),
    enabled: activeTab === 'all',
  })

  const { data: creditCards = [] } = useQuery({
    queryKey: ['creditCards'],
    queryFn: creditCardsApi.getAll,
  })

  const { data: creditCardInvoices = [] } = useQuery({
    queryKey: ['creditCardInvoices'],
    queryFn: remindersApi.getCreditCardInvoices,
  })

  const handleRefresh = async () => {
    invalidateAll(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: remindersApi.create,
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsCreateOpen(false)
      reset()
      success('Lembrete criado com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar lembrete')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReminderForm> }) =>
      remindersApi.update(id, {
        title: data.title,
        description: data.description,
        amount: data.amount ? parseFloat(data.amount.replace(',', '.')) : undefined,
        dueDate: data.dueDate,
        reminderDays: data.reminderDays ? parseInt(data.reminderDays) : undefined,
        creditCardId: data.creditCardId || undefined,
        isRecurring: data.isRecurring || false,
      }),
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsEditOpen(false)
      setSelectedReminder(null)
      reset()
      success('Lembrete atualizado!')
    },
    onError: () => {
      showError('Erro ao atualizar lembrete')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: remindersApi.delete,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Lembrete excluído!')
    },
    onError: () => {
      showError('Erro ao excluir lembrete')
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => remindersApi.markPaid(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Lembrete marcado como pago!')
    },
  })

  const dismissMutation = useMutation({
    mutationFn: remindersApi.dismiss,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Lembrete dispensado!')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminderDays: '3',
      isRecurring: false,
    },
  })

  const onSubmit = (data: ReminderForm) => {
    const formData = {
      title: data.title,
      description: data.description,
      amount: parseFloat(data.amount.replace(',', '.')),
      dueDate: data.dueDate,
      reminderDays: parseInt(data.reminderDays),
      creditCardId: data.creditCardId || undefined,
      isRecurring: data.isRecurring,
    }

    if (selectedReminder) {
      updateMutation.mutate({ id: selectedReminder.id, data })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder)
    setValue('title', reminder.title)
    setValue('description', reminder.description || '')
    setValue('amount', reminder.amount.toString())
    setValue('dueDate', format(new Date(reminder.dueDate), 'yyyy-MM-dd'))
    setValue('reminderDays', reminder.reminderDays.toString())
    setValue('creditCardId', reminder.creditCardId || '')
    setValue('isRecurring', reminder.isRecurring)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Lembrete',
      description: 'Tem certeza que deseja excluir este lembrete?',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setSelectedReminder(null)
    setIsCreateOpen(true)
  }

  const isLoading = activeTab === 'pending' ? pendingLoading : allLoading

  // Separate overdue and upcoming reminders
  const overdueReminders = pendingReminders.filter((n: ReminderNotification) => n.isOverdue)
  const upcomingReminders = pendingReminders.filter((n: ReminderNotification) => !n.isOverdue)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lembretes</h1>
          <p className="text-gray-600">Não esqueça suas contas</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Lembretes</h1>
            <p className="text-gray-600">Não esqueça suas contas</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Lembrete</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Próximos
            {overdueReminders.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {overdueReminders.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            Todos
          </button>
        </div>

        {activeTab === 'pending' ? (
          <div className="space-y-6">
            {/* Credit Card Invoices */}
            {creditCardInvoices.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Faturas de Cartão
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creditCardInvoices.map((invoice: CreditCardInvoice) => (
                    <Card key={invoice.creditCardId} className="border-l-4 border-l-blue-500">
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{invoice.creditCardName}</h3>
                            <p className="text-sm text-gray-500">
                              Vencimento: {format(new Date(invoice.dueDate), "d 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                            <p className={`text-sm ${invoice.daysUntilDue <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {invoice.daysUntilDue > 0
                                ? `${invoice.daysUntilDue} dias`
                                : invoice.daysUntilDue === 0 ? 'Hoje!' : 'Vencida!'
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Reminders */}
            {overdueReminders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Atrasados ({overdueReminders.length})
                </h2>
                <div className="space-y-3">
                  {overdueReminders.map((notification: ReminderNotification) => (
                    <Card key={notification.reminderId} className="border-l-4 border-l-red-500">
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{notification.reminder.title}</h3>
                            <p className="text-sm text-gray-500">
                              Venceu há {Math.abs(notification.daysUntilDue)} dias
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600">
                              {formatCurrency(notification.reminder.amount)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => markPaidMutation.mutate(notification.reminderId)}
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => dismissMutation.mutate(notification.reminderId)}
                              title="Dispensar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Próximos Vencimentos ({upcomingReminders.length})
                </h2>
                <div className="space-y-3">
                  {upcomingReminders.map((notification: ReminderNotification) => (
                    <Card key={notification.reminderId}>
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{notification.reminder.title}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(notification.reminder.dueDate), "d 'de' MMMM", { locale: ptBR })}
                              <span className={`ml-2 ${notification.daysUntilDue <= 3 ? 'text-orange-600 font-medium' : ''}`}>
                                ({notification.daysUntilDue === 0 ? 'Hoje!' : `${notification.daysUntilDue} dias`})
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {formatCurrency(notification.reminder.amount)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => markPaidMutation.mutate(notification.reminderId)}
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(notification.reminder)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pendingReminders.length === 0 && creditCardInvoices.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum lembrete pendente
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    Você está em dia com suas contas!
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Lembrete
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {allReminders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum lembrete cadastrado
                  </h3>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Lembrete
                  </Button>
                </CardContent>
              </Card>
            ) : (
              allReminders.map((reminder: Reminder) => (
                <Card key={reminder.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{reminder.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[reminder.status]}`}>
                            {statusLabels[reminder.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(reminder.dueDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {formatCurrency(reminder.amount)}
                        </span>
                        {reminder.status === 'PENDING' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => markPaidMutation.mutate(reminder.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(reminder)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setIsEditOpen(false)
            setSelectedReminder(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
              </DialogTitle>
              <DialogClose onClose={() => {
                setIsCreateOpen(false)
                setIsEditOpen(false)
              }} />
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Título"
                placeholder="Ex: Conta de luz, Aluguel"
                {...register('title')}
                error={errors.title?.message}
              />

              <Textarea
                label="Descrição (opcional)"
                placeholder="Detalhes adicionais"
                {...register('description')}
              />

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('amount')}
                error={errors.amount?.message}
              />

              <Input
                label="Data de vencimento"
                type="date"
                {...register('dueDate')}
                error={errors.dueDate?.message}
              />

              <Input
                label="Lembrar quantos dias antes"
                type="number"
                min="0"
                max="30"
                {...register('reminderDays')}
              />

              {creditCards.length > 0 && (
                <Select
                  label="Cartão de Crédito (opcional)"
                  options={[
                    { value: '', label: 'Nenhum' },
                    ...creditCards.map((c: CreditCardType) => ({ value: c.id, label: c.name })),
                  ]}
                  {...register('creditCardId')}
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  className="rounded border-gray-300"
                  {...register('isRecurring')}
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-700">
                  Lembrete recorrente (mensal)
                </label>
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
                    : selectedReminder ? 'Salvar Alterações' : 'Criar Lembrete'
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
