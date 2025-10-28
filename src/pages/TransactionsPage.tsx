import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { Plus, Edit, Trash2, Receipt, CreditCard, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transaction } from '@/types'

export default function TransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('')
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | ''>('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('')
  const [togglingTransactionId, setTogglingTransactionId] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  // Build filter params
  const filterParams: any = { limit: 100 }
  if (selectedMonth !== '') {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
    filterParams.startDate = startDate
    filterParams.endDate = endDate
  }
  if (selectedType) filterParams.type = selectedType
  if (selectedAccountId) filterParams.accountId = selectedAccountId
  if (selectedCategoryId) filterParams.categoryId = selectedCategoryId
  if (selectedCreditCardId) filterParams.creditCardId = selectedCreditCardId

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', filterParams],
    queryFn: () => transactionsApi.getAll(filterParams),
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
    queryKey: ['credit-cards'],
    queryFn: creditCardsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-initial-balances'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-final-balances'] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
      queryClient.invalidateQueries({ queryKey: ['category-report'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow-report'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    },
  })

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      transactionsApi.updatePaidStatus(id, paid),
    onSuccess: () => {
      setTogglingTransactionId(null)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    },
    onError: (error) => {
      setTogglingTransactionId(null)
      alert('Erro ao atualizar status da transação: ' + error)
    }
  })

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleTogglePaid = (transaction: Transaction) => {
    setTogglingTransactionId(transaction.id)
    togglePaidMutation.mutate({
      id: transaction.id,
      paid: !transaction.paid
    })
  }

  const handleCreate = () => {
    navigate('/transactions/new')
  }

  const handleCreateInstallment = () => {
    navigate('/transactions/installment')
  }

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

  const filteredCategories = selectedType
    ? categories.filter(cat => cat.type === selectedType)
    : categories

  const clearFilters = () => {
    setSelectedMonth('')
    setSelectedType('')
    setSelectedAccountId('')
    setSelectedCategoryId('')
    setSelectedCreditCardId('')
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
          <Button onClick={handleCreateInstallment} variant="outline" className="flex-1 sm:flex-none">
            <CreditCard className="h-4 w-4 mr-2" />
            Recorrente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              label="Mês"
              options={[
                { value: '', label: 'Todos os meses' },
                ...months.map(month => ({
                  value: month.value.toString(),
                  label: month.label
                }))
              ]}
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
            />
            <Select
              label="Ano"
              options={years.map(year => ({
                value: year.toString(),
                label: year.toString()
              }))}
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            />
            <Select
              label="Tipo"
              options={[
                { value: '', label: 'Todos' },
                { value: 'INCOME', label: 'Receita' },
                { value: 'EXPENSE', label: 'Despesa' }
              ]}
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as 'INCOME' | 'EXPENSE' | '')
                setSelectedCategoryId('') // Reset category when type changes
              }}
            />
            <Select
              label="Conta"
              options={[
                { value: '', label: 'Todas as contas' },
                ...accounts.map(account => ({
                  value: account.id,
                  label: account.name
                }))
              ]}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            />
            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Todas as categorias' },
                ...filteredCategories.map(category => ({
                  value: category.id,
                  label: category.name
                }))
              ]}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={!selectedType}
            />
            <Select
              label="Cartão de Crédito"
              options={[
                { value: '', label: 'Todos os cartões' },
                ...creditCards.map(card => ({
                  value: card.id,
                  label: card.name
                }))
              ]}
              value={selectedCreditCardId}
              onChange={(e) => setSelectedCreditCardId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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
            <Card key={transaction.id} className={`relative ${
              transaction.paid ? 'opacity-60' : ''
            }`}>
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
                        onClick={() => handleTogglePaid(transaction)}
                        disabled={togglingTransactionId === transaction.id}
                        title={transaction.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        {togglingTransactionId === transaction.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                        ) : transaction.paid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
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
    </div>
  )
}
