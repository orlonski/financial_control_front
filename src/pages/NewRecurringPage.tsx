import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { recurringApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { ArrowLeft, Infinity } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { format, addMonths, addYears, addWeeks, addDays } from 'date-fns'
import type { Account, Category, CreditCard } from '@/types'

const recurringSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  intervalCount: z.number().min(1, 'Mínimo 1').max(30, 'Máximo 30'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  durationType: z.enum(['infinite', 'months', 'date']),
  durationMonths: z.number().min(1).max(120).optional(),
  endDate: z.string().optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  creditCardId: z.string().optional(),
})

type RecurringForm = z.infer<typeof recurringSchema>

const intervalOptions = [
  { value: 'DAY', label: 'Dia(s)' },
  { value: 'WEEK', label: 'Semana(s)' },
  { value: 'MONTH', label: 'Mês(es)' },
  { value: 'YEAR', label: 'Ano(s)' },
]

const durationOptions = [
  { value: 'infinite', label: 'Sem fim (infinito)' },
  { value: 'months', label: 'Por quantidade de meses' },
  { value: 'date', label: 'Até uma data específica' },
]

export default function NewRecurringPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

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

  const createMutation = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Transação recorrente criada com sucesso!')
      navigate('/recurring')
    },
    onError: () => {
      showError('Erro ao criar transação recorrente')
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: 'EXPENSE',
      interval: 'MONTH',
      intervalCount: 1,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      durationType: 'infinite',
      durationMonths: 12,
    },
  })

  const selectedType = watch('type')
  const durationType = watch('durationType')

  const filteredCategories = categories.filter((c: Category) => c.type === selectedType)

  // Calcula a data final baseada na duração escolhida
  const calculateEndDate = (data: RecurringForm): string | undefined => {
    if (data.durationType === 'infinite') {
      return undefined // Sem data final
    }
    if (data.durationType === 'date') {
      return data.endDate || undefined
    }
    if (data.durationType === 'months' && data.durationMonths) {
      const startDate = new Date(data.startDate)
      const endDate = addMonths(startDate, data.durationMonths)
      return format(endDate, 'yyyy-MM-dd')
    }
    return undefined
  }

  const onSubmit = (data: RecurringForm) => {
    const endDate = calculateEndDate(data)

    createMutation.mutate({
      type: data.type,
      amount: data.amount,
      description: data.description,
      interval: data.interval,
      intervalCount: data.intervalCount,
      startDate: data.startDate,
      endDate,
      accountId: data.accountId,
      categoryId: data.categoryId,
      creditCardId: data.creditCardId || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/recurring')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Recorrência</h1>
          <p className="text-gray-600">Cadastre uma despesa ou receita fixa</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Recorrência</CardTitle>
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
              label="Descrição"
              placeholder="Ex: Aluguel, Netflix, Salário"
              {...register('description')}
              error={errors.description?.message}
            />

            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="A cada"
                type="number"
                min="1"
                max="30"
                {...register('intervalCount', { valueAsNumber: true })}
                error={errors.intervalCount?.message}
              />
              <Select
                label="Período"
                options={intervalOptions}
                {...register('interval')}
                error={errors.interval?.message}
              />
            </div>

            <Input
              label="Data de início"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />

            <Select
              label="Duração"
              options={durationOptions}
              {...register('durationType')}
            />

            {durationType === 'months' && (
              <Input
                label="Quantidade de meses"
                type="number"
                min="1"
                max="120"
                placeholder="Ex: 12"
                {...register('durationMonths', { valueAsNumber: true })}
                error={errors.durationMonths?.message}
              />
            )}

            {durationType === 'date' && (
              <Input
                label="Data final"
                type="date"
                {...register('endDate')}
                error={errors.endDate?.message}
              />
            )}

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

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/recurring')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Recorrência'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
