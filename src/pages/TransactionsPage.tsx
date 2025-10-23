import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { transactionsApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Receipt, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transaction, Account, Category, CreditCard as CreditCardType } from '@/types'

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  purchaseDate: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  notes: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  creditCardId: z.string().optional(),
  installmentNumber: z.number().optional(),
  totalInstallments: z.number().optional(),
})

const installmentSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  purchaseDate: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  notes: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  creditCardId: z.string().min(1, 'Cartão é obrigatório para parcelamento'),
  totalInstallments: z.number().min(2).max(60, 'Parcelas devem ser entre 2 e 60'),
})

type TransactionForm = z.infer<typeof transactionSchema>
type InstallmentForm = z.infer<typeof installmentSchema>

export default function TransactionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionType, setTransactionType] = useState<'single' | 'installment'>('single')
  const queryClient = useQueryClient()

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll({ limit: 50 }),
  })

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: creditCards = [], isLoading: creditCardsLoading } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: creditCardsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      setIsCreateOpen(false)
      reset()
    },
  })

  const createInstallmentMutation = useMutation({
    mutationFn: transactionsApi.createInstallments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      setIsInstallmentOpen(false)
      resetInstallment()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionForm> }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      setIsEditOpen(false)
      setEditingTransaction(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const {
    register: registerInstallment,
    handleSubmit: handleSubmitInstallment,
    reset: resetInstallment,
    setValue: setValueInstallment,
    watch: watchInstallment,
    formState: { errors: errorsInstallment },
  } = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      totalInstallments: 2,
    },
  })

  const selectedType = watch('type')
  const selectedAccountId = watch('accountId')
  const selectedCreditCardId = watch('creditCardId')

  const onSubmit = (data: TransactionForm) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const onSubmitInstallment = (data: InstallmentForm) => {
    createInstallmentMutation.mutate(data)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setValue('type', transaction.type)
    setValue('amount', transaction.amount)
    setValue('date', transaction.date.split('T')[0])
    setValue('purchaseDate', transaction.purchaseDate?.split('T')[0] || '')
    setValue('description', transaction.description)
    setValue('notes', transaction.notes || '')
    setValue('accountId', transaction.accountId)
    setValue('categoryId', transaction.categoryId)
    setValue('creditCardId', transaction.creditCardId || '')
    setIsEditOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setIsCreateOpen(true)
  }

  const handleCreateInstallment = () => {
    resetInstallment()
    setIsInstallmentOpen(true)
  }

  const isLoading = transactionsLoading || accountsLoading || categoriesLoading || creditCardsLoading

  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => cat.type === selectedType)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Gerencie suas receitas e despesas</p>
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleCreate} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
          <Button onClick={handleCreateInstallment} disabled={creditCards.length === 0} variant="outline" className="flex-1 sm:flex-none">
            <CreditCard className="h-4 w-4 mr-2" />
            Parcelamento
          </Button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma transação cadastrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Comece registrando suas receitas e despesas
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Primeira Transação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg break-words">{transaction.description}</CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm mt-1">
                          <span className="truncate">{transaction.category.name}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{transaction.account.name}</span>
                          {transaction.creditCard && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center truncate">
                                <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
                                {transaction.creditCard.name}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-start space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-lg sm:text-xl font-bold ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {transaction.amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </div>

                {transaction.installmentNumber && transaction.totalInstallments && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Parcela {transaction.installmentNumber}/{transaction.totalInstallments}
                    </span>
                  </div>
                )}
                {transaction.notes && (
                  <div className="mt-2 text-sm text-gray-600 break-words">
                    {transaction.notes}
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogClose onClose={() => setIsCreateOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedType === 'INCOME' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'INCOME')}
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'EXPENSE')}
              >
                Despesa
              </Button>
            </div>

            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <Input
              label="Data"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Almoço no restaurante"
              {...register('description')}
              error={errors.description?.message}
            />

            <Select
              label="Conta"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('accountId')}
              error={errors.accountId?.message}
            />

            <Select
              label="Categoria"
              options={filteredCategories.map(category => ({
                value: category.id,
                label: category.name
              }))}
              {...register('categoryId')}
              error={errors.categoryId?.message}
            />

            <Select
              label="Cartão de Crédito (opcional)"
              options={[
                { value: '', label: 'Não usar cartão' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name
                }))
              ]}
              {...register('creditCardId')}
              error={errors.creditCardId?.message}
            />

            {selectedCreditCardId && (
              <Input
                label="Data da compra (opcional)"
                type="date"
                {...register('purchaseDate')}
                error={errors.purchaseDate?.message}
              />
            )}

            <Textarea
              label="Observações (opcional)"
              placeholder="Observações adicionais..."
              {...register('notes')}
              error={errors.notes?.message}
            />

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
                {createMutation.isPending ? 'Criando...' : 'Criar Transação'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Installment Dialog */}
      <Dialog open={isInstallmentOpen} onOpenChange={setIsInstallmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Compra Parcelada</DialogTitle>
            <DialogClose onClose={() => setIsInstallmentOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmitInstallment(onSubmitInstallment)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={watchInstallment('type') === 'INCOME' ? 'default' : 'outline'}
                onClick={() => setValueInstallment('type', 'INCOME')}
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={watchInstallment('type') === 'EXPENSE' ? 'default' : 'outline'}
                onClick={() => setValueInstallment('type', 'EXPENSE')}
              >
                Despesa
              </Button>
            </div>

            <Input
              label="Valor total"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...registerInstallment('amount', { valueAsNumber: true })}
              error={errorsInstallment.amount?.message}
            />

            <Input
              label="Data da compra"
              type="date"
              {...registerInstallment('date')}
              error={errorsInstallment.date?.message}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Notebook Dell"
              {...registerInstallment('description')}
              error={errorsInstallment.description?.message}
            />

            <Select
              label="Conta"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...registerInstallment('accountId')}
              error={errorsInstallment.accountId?.message}
            />

            <Select
              label="Categoria"
              options={categories.filter(cat => cat.type === watchInstallment('type')).map(category => ({
                value: category.id,
                label: category.name
              }))}
              {...registerInstallment('categoryId')}
              error={errorsInstallment.categoryId?.message}
            />

            <Select
              label="Cartão de Crédito"
              options={creditCards.map(card => ({
                value: card.id,
                label: card.name
              }))}
              {...registerInstallment('creditCardId')}
              error={errorsInstallment.creditCardId?.message}
            />

            <Input
              label="Número de parcelas"
              type="number"
              min="2"
              max="60"
              placeholder="12"
              {...registerInstallment('totalInstallments', { valueAsNumber: true })}
              error={errorsInstallment.totalInstallments?.message}
            />

            <Textarea
              label="Observações (opcional)"
              placeholder="Observações adicionais..."
              {...registerInstallment('notes')}
              error={errorsInstallment.notes?.message}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Parcelamento:</strong> Cada parcela aparecerá na fatura correta do cartão baseada na data de vencimento.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInstallmentOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createInstallmentMutation.isPending}
                className="flex-1"
              >
                {createInstallmentMutation.isPending ? 'Criando...' : 'Criar Parcelamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogClose onClose={() => setIsEditOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedType === 'INCOME' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'INCOME')}
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'EXPENSE')}
              >
                Despesa
              </Button>
            </div>

            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <Input
              label="Data"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Almoço no restaurante"
              {...register('description')}
              error={errors.description?.message}
            />

            <Select
              label="Conta"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('accountId')}
              error={errors.accountId?.message}
            />

            <Select
              label="Categoria"
              options={filteredCategories.map(category => ({
                value: category.id,
                label: category.name
              }))}
              {...register('categoryId')}
              error={errors.categoryId?.message}
            />

            <Select
              label="Cartão de Crédito (opcional)"
              options={[
                { value: '', label: 'Não usar cartão' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name
                }))
              ]}
              {...register('creditCardId')}
              error={errors.creditCardId?.message}
            />

            {selectedCreditCardId && (
              <Input
                label="Data da compra (opcional)"
                type="date"
                {...register('purchaseDate')}
                error={errors.purchaseDate?.message}
              />
            )}

            <Textarea
              label="Observações (opcional)"
              placeholder="Observações adicionais..."
              {...register('notes')}
              error={errors.notes?.message}
            />

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
