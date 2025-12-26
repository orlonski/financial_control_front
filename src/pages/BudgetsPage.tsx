import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { budgetsApi, categoriesApi } from '@/services/api'
import { invalidateAll } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, PiggyBank, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import type { BudgetWithUsage, Category } from '@/types'

const budgetSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
})

type BudgetForm = z.infer<typeof budgetSchema>

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function BudgetsPage() {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithUsage | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', selectedYear, selectedMonth],
    queryFn: () => budgetsApi.getAll(selectedYear, selectedMonth),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const expenseCategories = categories.filter((c: Category) => c.type === 'EXPENSE')
  const usedCategoryIds = budgets.map(b => b.categoryId)
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.includes(c.id))

  const handleRefresh = async () => {
    invalidateAll(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsCreateOpen(false)
      reset()
      success('Orçamento criado com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar orçamento')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number } }) =>
      budgetsApi.update(id, data),
    onSuccess: () => {
      invalidateAll(queryClient)
      setIsEditOpen(false)
      setEditingBudget(null)
      reset()
      success('Orçamento atualizado com sucesso!')
    },
    onError: () => {
      showError('Erro ao atualizar orçamento')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => {
      invalidateAll(queryClient)
      success('Orçamento excluído com sucesso!')
    },
    onError: () => {
      showError('Erro ao excluir orçamento')
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => budgetsApi.copyFromPrevious(selectedYear, selectedMonth),
    onSuccess: (data) => {
      invalidateAll(queryClient)
      success(`${data.length} orçamento(s) copiado(s) do mês anterior!`)
    },
    onError: () => {
      showError('Erro ao copiar orçamentos. Verifique se há orçamentos no mês anterior.')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
  })

  const onSubmit = (data: BudgetForm) => {
    const amount = parseFloat(data.amount.replace(',', '.'))

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: { amount } })
    } else {
      createMutation.mutate({
        amount,
        categoryId: data.categoryId,
        month: selectedMonth,
        year: selectedYear,
      })
    }
  }

  const handleEdit = (budget: BudgetWithUsage) => {
    setEditingBudget(budget)
    setValue('amount', budget.amount.toString())
    setValue('categoryId', budget.categoryId)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Orçamento',
      description: 'Tem certeza que deseja excluir este orçamento?',
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

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getProgressBgColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-100'
      case 'warning': return 'bg-yellow-100'
      default: return 'bg-green-100'
    }
  }

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600">Defina limites de gastos por categoria</p>
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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {ConfirmDialog}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-gray-600">Defina limites de gastos por categoria</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending}>
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copiar do Mês Anterior</span>
            </Button>
            <Button onClick={handleCreate} disabled={availableCategories.length === 0}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Orçamento</span>
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatCurrency(totalSpent)} de {formatCurrency(totalBudgeted)} orçado
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {budgets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PiggyBank className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum orçamento definido
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Defina limites de gastos para suas categorias de despesa
              </p>
              <Button onClick={handleCreate} disabled={availableCategories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{budget.category.icon}</span>
                      <CardTitle className="text-base">{budget.category.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gasto</span>
                      <span className={budget.status === 'exceeded' ? 'text-red-600 font-medium' : ''}>
                        {formatCurrency(budget.spent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Limite</span>
                      <span>{formatCurrency(budget.amount)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`h-3 rounded-full ${getProgressBgColor(budget.status)}`}>
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressColor(budget.status)}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${
                        budget.status === 'exceeded' ? 'text-red-600' :
                        budget.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {budget.percentage.toFixed(0)}% usado
                      </span>
                      <span className="text-gray-500">
                        {budget.remaining >= 0
                          ? `Restam ${formatCurrency(budget.remaining)}`
                          : `Excedido ${formatCurrency(Math.abs(budget.remaining))}`
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
              <DialogClose onClose={() => setIsCreateOpen(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="Categoria"
                options={availableCategories.map(c => ({
                  value: c.id,
                  label: `${c.icon || ''} ${c.name}`,
                }))}
                {...register('categoryId')}
                error={errors.categoryId?.message}
              />

              <Input
                label="Limite mensal (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('amount')}
                error={errors.amount?.message}
              />

              <p className="text-sm text-gray-500">
                Orçamento para {MONTHS[selectedMonth - 1]} de {selectedYear}
              </p>

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
                  {createMutation.isPending ? 'Criando...' : 'Criar Orçamento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Orçamento</DialogTitle>
              <DialogClose onClose={() => setIsEditOpen(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{editingBudget?.category.icon}</span>
                <span className="font-medium">{editingBudget?.category.name}</span>
              </div>

              <Input
                label="Limite mensal (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('amount')}
                error={errors.amount?.message}
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
    </PullToRefresh>
  )
}
