import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { creditCardsApi, accountsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, CreditCard, Calendar, TrendingUp, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import type { CreditCard as CreditCardType } from '@/types'

/**
 * Calculate how many days until the payment date for a purchase made today
 * @param closingDay - Day of month when the invoice closes
 * @param dueDay - Day of month when the invoice is due
 * @returns Number of days until payment
 *
 * Logic:
 * 1. If dueDay > closingDay: due date is in the SAME month as closing
 *    Example: Closes 7th, Due 20th → Invoice closes 07/11, due 20/11
 * 2. If dueDay <= closingDay: due date is in the NEXT month after closing
 *    Example: Closes 26th, Due 3rd → Invoice closes 26/11, due 03/12
 */
function calculateDaysUntilPayment(closingDay: number, dueDay: number): number {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Determine which invoice this purchase belongs to
  let invoiceClosingMonth = currentMonth
  let invoiceClosingYear = currentYear

  // If purchase is after closing day, it goes to next month's invoice
  if (currentDay > closingDay) {
    invoiceClosingMonth += 1
    if (invoiceClosingMonth > 11) {
      invoiceClosingMonth = 0
      invoiceClosingYear += 1
    }
  }

  // Determine due month based on closing/due day relationship
  let dueMonth = invoiceClosingMonth
  let dueYear = invoiceClosingYear

  // If due day is BEFORE or EQUAL to closing day, due date is NEXT month
  if (dueDay <= closingDay) {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
  }
  // Otherwise, due date is in SAME month as closing

  // Create the due date
  const dueDate = new Date(dueYear, dueMonth, dueDay)

  // Calculate difference in days
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  closingDay: z.number().min(1).max(31, 'Dia de fechamento deve ser entre 1 e 31'),
  dueDay: z.number().min(1).max(31, 'Dia de vencimento deve ser entre 1 e 31'),
  limit: z.number().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
})

type CreditCardForm = z.infer<typeof creditCardSchema>

export default function CreditCardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: creditCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: creditCardsApi.getAll,
  })

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: creditCardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      setIsCreateOpen(false)
      reset()
      success('Cartão criado com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar cartão')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreditCardType> }) =>
      creditCardsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      setIsEditOpen(false)
      setEditingCard(null)
      reset()
      success('Cartão atualizado com sucesso!')
    },
    onError: () => {
      showError('Erro ao atualizar cartão')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: creditCardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      success('Cartão excluído com sucesso!')
    },
    onError: () => {
      showError('Erro ao excluir cartão. Verifique se não há transações vinculadas.')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreditCardForm>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      closingDay: 5,
      dueDay: 10,
    },
  })

  const onSubmit = (data: CreditCardForm) => {
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (card: CreditCardType) => {
    setEditingCard(card)
    setValue('name', card.name)
    setValue('closingDay', card.closingDay)
    setValue('dueDay', card.dueDay)
    setValue('limit', card.limit || 0)
    setValue('accountId', card.accountId)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Cartão',
      description: 'Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setIsCreateOpen(true)
  }

  const isLoading = cardsLoading || accountsLoading

  // Calculate days until payment for each card and find the best one
  const cardsWithDays = creditCards.map(card => ({
    ...card,
    daysUntilPayment: calculateDaysUntilPayment(card.closingDay, card.dueDay)
  }))

  const bestCard = cardsWithDays.length > 0
    ? cardsWithDays.reduce((best, current) =>
        current.daysUntilPayment > best.daysUntilPayment ? current : best
      )
    : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-gray-600">Gerencie seus cartões e faturas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      {ConfirmDialog}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-gray-600">Gerencie seus cartões e faturas</p>
        </div>
        <Button onClick={handleCreate} disabled={accounts.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartão
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Você precisa ter pelo menos uma conta para cadastrar cartões de crédito
            </p>
            <Button onClick={() => window.location.href = '/accounts'}>
              Criar Conta
            </Button>
          </CardContent>
        </Card>
      ) : creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Cadastre seus cartões para controlar faturas e parcelamentos
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Best Card Recommendation */}
          {bestCard && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Award className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-900">Melhor Cartão para Usar Hoje</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Maximize seu prazo de pagamento usando este cartão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-lg text-green-900">{bestCard.name}</span>
                    </div>
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {bestCard.daysUntilPayment} dias
                    </div>
                  </div>
                  <div className="text-sm text-green-800">
                    <p>
                      <strong>Se você usar este cartão hoje:</strong> A fatura vencerá em {bestCard.daysUntilPayment} dias,
                      dando a você o maior prazo possível para pagar!
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-green-700">
                    <Calendar className="h-3 w-3" />
                    <span>Fecha dia {bestCard.closingDay} • Vence dia {bestCard.dueDay}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsWithDays.map((card) => (
            <Card key={card.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(card)}
                      aria-label="Editar cartão"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(card.id)}
                      aria-label="Excluir cartão"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Vinculado à conta: {card.account.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Days Until Payment Indicator */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  card.id === bestCard?.id
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`h-4 w-4 ${
                      card.id === bestCard?.id ? 'text-green-600' : 'text-blue-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      card.id === bestCard?.id ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      Compra hoje vence em:
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    card.id === bestCard?.id
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {card.daysUntilPayment} dias
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                  </span>
                </div>

                {card.limit && card.limit > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilizado:</span>
                      <span className={`font-medium ${
                        ((card.usedAmount || 0) / card.limit) > 0.8 ? 'text-red-600' :
                        ((card.usedAmount || 0) / card.limit) > 0.5 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {formatCurrency(card.usedAmount || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          ((card.usedAmount || 0) / card.limit) > 0.8 ? 'bg-red-500' :
                          ((card.usedAmount || 0) / card.limit) > 0.5 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(((card.usedAmount || 0) / card.limit) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        Disponível: {formatCurrency(card.limit - (card.usedAmount || 0))}
                      </span>
                      <span>
                        Limite: {formatCurrency(card.limit)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Compras feitas até dia {card.closingDay} aparecem na fatura que vence dia {card.dueDay} do mesmo mês.
                    Compras após dia {card.closingDay} aparecem na fatura do mês seguinte.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cartão de Crédito</DialogTitle>
            <DialogClose onClose={() => setIsCreateOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome do cartão"
              placeholder="Ex: Cartão Visa Banco X"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Conta vinculada"
              options={accounts.map(account => ({
                value: account.id,
                label: `${account.name} (${account.type})`
              }))}
              {...register('accountId')}
              error={errors.accountId?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dia de fechamento"
                type="number"
                min="1"
                max="31"
                placeholder="5"
                {...register('closingDay', { valueAsNumber: true })}
                error={errors.closingDay?.message}
              />

              <Input
                label="Dia de vencimento"
                type="number"
                min="1"
                max="31"
                placeholder="10"
                {...register('dueDay', { valueAsNumber: true })}
                error={errors.dueDay?.message}
              />
            </div>

            <Input
              label="Limite do cartão (opcional)"
              type="number"
              step="0.01"
              placeholder="5000,00"
              {...register('limit', { valueAsNumber: true })}
              error={errors.limit?.message}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Como funciona:</strong> Compras feitas até o dia de fechamento aparecem na fatura que vence no dia de vencimento do mesmo mês.
                Compras após o fechamento aparecem na fatura do mês seguinte.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Cartão'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cartão de Crédito</DialogTitle>
            <DialogClose onClose={() => setIsEditOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome do cartão"
              placeholder="Ex: Cartão Visa Banco X"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Conta vinculada"
              options={accounts.map(account => ({
                value: account.id,
                label: `${account.name} (${account.type})`
              }))}
              {...register('accountId')}
              error={errors.accountId?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dia de fechamento"
                type="number"
                min="1"
                max="31"
                placeholder="5"
                {...register('closingDay', { valueAsNumber: true })}
                error={errors.closingDay?.message}
              />

              <Input
                label="Dia de vencimento"
                type="number"
                min="1"
                max="31"
                placeholder="10"
                {...register('dueDay', { valueAsNumber: true })}
                error={errors.dueDay?.message}
              />
            </div>

            <Input
              label="Limite do cartão (opcional)"
              type="number"
              step="0.01"
              placeholder="5000,00"
              {...register('limit', { valueAsNumber: true })}
              error={errors.limit?.message}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Como funciona:</strong> Compras feitas até o dia de fechamento aparecem na fatura que vence no dia de vencimento do mesmo mês.
                Compras após o fechamento aparecem na fatura do mês seguinte.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
