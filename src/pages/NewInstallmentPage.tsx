import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { ArrowLeft, AlertCircle } from 'lucide-react'

const installmentSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  purchaseDate: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  notes: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  creditCardId: z.string().optional(),
  totalInstallments: z.number().min(2).max(60, 'Parcelas devem ser entre 2 e 60'),
})

type InstallmentForm = z.infer<typeof installmentSchema>

export default function NewInstallmentPage() {
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

  const createInstallmentMutation = useMutation({
    mutationFn: transactionsApi.createInstallments,
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
  } = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      totalInstallments: 2,
    },
  })

  const selectedType = watch('type')
  const totalInstallments = watch('totalInstallments')
  const amount = watch('amount')

  const filteredCategories = categories.filter(cat => cat.type === selectedType)

  const onSubmit = (data: InstallmentForm) => {
    // Remove creditCardId if empty string
    const payload = {
      ...data,
      creditCardId: data.creditCardId || undefined
    }
    createInstallmentMutation.mutate(payload)
  }

  // Calculate total (amount is per installment, so multiply)
  const totalAmount = amount && totalInstallments ? amount * totalInstallments : 0

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
          <h1 className="text-2xl font-bold text-gray-900">Nova Transação Recorrente</h1>
          <p className="text-gray-600">Registre uma transação recorrente ou compra parcelada</p>
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
              label="Valor de cada parcela/repetição"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <Input
              label="Número de parcelas/repetições"
              type="number"
              min="2"
              max="60"
              placeholder="12"
              {...register('totalInstallments', { valueAsNumber: true })}
              error={errors.totalInstallments?.message}
            />

            {totalAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Valor total:</strong> {totalAmount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })} ({totalInstallments}x {amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })})
                </p>
              </div>
            )}

            <Input
              label="Data inicial"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Notebook Dell"
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
                { value: '', label: 'Nenhum (transação recorrente)' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name
                }))
              ]}
              {...register('creditCardId')}
              error={errors.creditCardId?.message}
            />

            <Textarea
              label="Observações (opcional)"
              placeholder="Observações adicionais..."
              {...register('notes')}
              error={errors.notes?.message}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="mb-2">
                    <strong>Como funciona:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Com cartão:</strong> Cada parcela aparecerá na fatura correta baseada na data de vencimento</li>
                    <li><strong>Sem cartão:</strong> Cria transações recorrentes (ex: salário mensal, aluguel, etc)</li>
                  </ul>
                </div>
              </div>
            </div>

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
                disabled={createInstallmentMutation.isPending}
                className="flex-1"
              >
                {createInstallmentMutation.isPending ? 'Criando...' : 'Criar Transação Recorrente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
