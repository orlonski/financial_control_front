import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, SearchableSelect, Textarea } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

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
})

type TransactionForm = z.infer<typeof transactionSchema>

export default function NewTransactionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: creditCards = [] } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: creditCardsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-initial-balances'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-final-balances'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
      queryClient.invalidateQueries({ queryKey: ['category-report'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow-report'] })
      navigate('/transactions')
    },
  })

  const {
    register,
    handleSubmit,
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

  const selectedType = watch('type')
  const selectedCreditCardId = watch('creditCardId')

  const filteredCategories = categories.filter(cat => cat.type === selectedType)

  const onSubmit = (data: TransactionForm) => {
    createMutation.mutate(data)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/transactions')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Transação</h1>
          <p className="text-gray-600">Registre uma receita ou despesa</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Transação</CardTitle>
        </CardHeader>
        <CardContent>
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

            <SearchableSelect
              label="Conta"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              value={watch('accountId')}
              onChange={(value) => setValue('accountId', value)}
              placeholder="Selecione uma conta"
              error={errors.accountId?.message}
            />

            <SearchableSelect
              label="Categoria"
              options={filteredCategories.map(category => ({
                value: category.id,
                label: category.name
              }))}
              value={watch('categoryId')}
              onChange={(value) => setValue('categoryId', value)}
              placeholder="Selecione uma categoria"
              error={errors.categoryId?.message}
            />

            <SearchableSelect
              label="Cartão de Crédito (opcional)"
              options={[
                { value: '', label: 'Não usar cartão' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name
                }))
              ]}
              value={watch('creditCardId') || ''}
              onChange={(value) => setValue('creditCardId', value)}
              placeholder="Selecione um cartão"
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

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/transactions')}
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
        </CardContent>
      </Card>
    </div>
  )
}
