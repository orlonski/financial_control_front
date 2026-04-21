import { useState } from 'react'
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

// Explicit Tab order for the form fields
// This maps to: 1=Receita, 2=Despesa, 3=Conta, 4=Categoria, 5=Descricao,
// 6=Cartao, 7=DataCompra, 8=Valor, 9=Data, 10=Observacoes, 11=Cancelar, 12=Criar
const TAB_ORDER = {
  RECEITA: 1,
  DESPESA: 2,
  CONTA: 3,
  CATEGORIA: 4,
  DESCRICAO: 5,
  CARTAO: 6,
  DATA_COMPRA: 7,
  VALOR: 8,
  DATA: 9,
  OBSERVACOES: 10,
  CANCELAR: 11,
  CRIAR: 12,
}

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

  const [submitError, setSubmitError] = useState<string | null>(null)

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
    onError: (error: Error) => {
      setSubmitError(error.message || 'Erro ao criar transação')
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
      purchaseDate: new Date().toISOString().split('T')[0],
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
          {/* The form uses explicit tabIndex to guarantee Tab order, independent of visual layout */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            aria-label="Formulário de nova transação"
          >
            {/* 1. Tipo: Receita / Despesa */}
            <div className="grid grid-cols-2 gap-4" role="group" aria-label="Tipo de transação">
              <button
                type="button"
                tabIndex={TAB_ORDER.RECEITA}
                onClick={() => setValue('type', 'INCOME')}
                className={`
                  h-10 rounded-md border text-sm font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${selectedType === 'INCOME'
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
                `}
              >
                Receita
              </button>
              <button
                type="button"
                tabIndex={TAB_ORDER.DESPESA}
                onClick={() => setValue('type', 'EXPENSE')}
                className={`
                  h-10 rounded-md border text-sm font-medium transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${selectedType === 'EXPENSE'
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
                `}
              >
                Despesa
              </button>
            </div>

            {/* 2. Conta */}
            <SearchableSelect
              label="Conta"
              tabIndex={TAB_ORDER.CONTA}
              options={accounts.map(account => ({
                value: account.id,
                label: account.name,
              }))}
              value={watch('accountId')}
              onChange={(value) => setValue('accountId', value)}
              placeholder="Selecione uma conta"
              error={errors.accountId?.message}
            />

            {/* 3. Categoria */}
            <SearchableSelect
              label="Categoria"
              tabIndex={TAB_ORDER.CATEGORIA}
              options={filteredCategories.map(category => ({
                value: category.id,
                label: category.name,
              }))}
              value={watch('categoryId')}
              onChange={(value) => setValue('categoryId', value)}
              placeholder="Selecione uma categoria"
              error={errors.categoryId?.message}
            />

            {/* 4. Descrição */}
            <Input
              label="Descrição"
              placeholder="Ex: Almoço no restaurante"
              tabIndex={TAB_ORDER.DESCRICAO}
              {...register('description')}
              error={errors.description?.message}
            />

            {/* 5. Cartão de Crédito */}
            <SearchableSelect
              label="Cartão de Crédito (opcional)"
              tabIndex={TAB_ORDER.CARTAO}
              options={[
                { value: '', label: 'Não usar cartão' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name,
                })),
              ]}
              value={watch('creditCardId') || ''}
              onChange={(value) => setValue('creditCardId', value)}
              placeholder="Selecione um cartão"
              error={errors.creditCardId?.message}
            />

            {/* 6. Data da compra (only when card is selected) */}
            {selectedCreditCardId && (
              <Input
                label="Data da compra (opcional)"
                type="date"
                tabIndex={TAB_ORDER.DATA_COMPRA}
                {...register('purchaseDate')}
                error={errors.purchaseDate?.message}
              />
            )}

            {/* 7. Valor */}
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              tabIndex={TAB_ORDER.VALOR}
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            {/* 8. Data */}
            <Input
              label="Data"
              type="date"
              tabIndex={TAB_ORDER.DATA}
              {...register('date')}
              error={errors.date?.message}
            />

            {/* 9. Observações (always last before buttons) */}
            <Textarea
              label="Observações (opcional)"
              placeholder="Observações adicionais..."
              tabIndex={TAB_ORDER.OBSERVACOES}
              {...register('notes')}
              error={errors.notes?.message}
            />

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              </div>
            )}

            {/* 10-11. Botões: Cancelar / Criar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                tabIndex={TAB_ORDER.CANCELAR}
                onClick={() => navigate('/transactions')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                tabIndex={TAB_ORDER.CRIAR}
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
