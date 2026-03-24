import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi, accountsApi, categoriesApi, creditCardsApi } from '@/services/api'
import { invalidateTransactionRelated } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { MonthFilter } from '@/components/MonthFilter'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionCard } from '@/components/TransactionCard/TransactionCard.jsx'
import { Plus, Receipt, CreditCard } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { PaymentModal } from '@/components/PaymentModal'
import type { Transaction } from '@/types'

interface TransactionFilterParams {
  limit?: number
  startDate?: string
  endDate?: string
  type?: 'INCOME' | 'EXPENSE'
  accountId?: string
  categoryId?: string
  creditCardId?: string
}

export default function TransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const handleRefresh = async () => {
    invalidateTransactionRelated(queryClient)
  }

  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | ''>(new Date().getMonth() + 1)
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | ''>('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('')
  const [togglingTransactionId, setTogglingTransactionId] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Build filter params
  const filterParams: TransactionFilterParams = { limit: 100 }
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
      invalidateTransactionRelated(queryClient)
      success('Transação excluída com sucesso!')
    },
    onError: () => {
      showError('Erro ao excluir transação')
    },
  })

  const togglePaidMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { paid: boolean; paidAt?: string; accountId?: string } }) =>
      transactionsApi.updatePaidStatus(id, data),
    onSuccess: (_, variables) => {
      setTogglingTransactionId(null)
      setPaymentModalOpen(false)
      setSelectedTransaction(null)
      invalidateTransactionRelated(queryClient)
      success(variables.data.paid ? 'Transação marcada como paga!' : 'Transação marcada como não paga!')
    },
    onError: () => {
      setTogglingTransactionId(null)
      showError('Erro ao atualizar status da transação')
    }
  })

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Transação',
      description: 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleTogglePaid = (transaction: Transaction) => {
    if (transaction.paid) {
      // If already paid, just unmark it
      setTogglingTransactionId(transaction.id)
      togglePaidMutation.mutate({
        id: transaction.id,
        data: { paid: false }
      })
    } else {
      // If not paid, open modal to get payment details
      setSelectedTransaction(transaction)
      setPaymentModalOpen(true)
    }
  }

  const handleConfirmPayment = (data: { paidAt: string; accountId: string }) => {
    if (!selectedTransaction) return
    setTogglingTransactionId(selectedTransaction.id)
    togglePaidMutation.mutate({
      id: selectedTransaction.id,
      data: {
        paid: true,
        paidAt: data.paidAt,
        accountId: data.accountId
      }
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
    setSelectedMonth(new Date().getMonth() + 1)
    setSelectedYear(new Date().getFullYear())
    setSelectedType('')
    setSelectedAccountId('')
    setSelectedCategoryId('')
    setSelectedCreditCardId('')
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {ConfirmDialog}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        transaction={selectedTransaction}
        accounts={accounts}
        onConfirm={handleConfirmPayment}
        isLoading={togglePaidMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Transação</span>
          </Button>
          <Button onClick={handleCreateInstallment} variant="outline" className="flex-1 sm:flex-none">
            <CreditCard className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Recorrente</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <MonthFilter
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        showAllMonthsOption={true}
        additionalFilters={[
          {
            key: 'type',
            label: 'Tipo',
            options: [
              { value: '', label: 'Todos' },
              { value: 'INCOME', label: 'Receita' },
              { value: 'EXPENSE', label: 'Despesa' }
            ],
            value: selectedType,
            onChange: (value) => {
              setSelectedType(value as 'INCOME' | 'EXPENSE' | '')
              setSelectedCategoryId('')
            },
          },
          {
            key: 'account',
            label: 'Conta',
            options: [
              { value: '', label: 'Todas as contas' },
              ...accounts.map(account => ({
                value: account.id,
                label: account.name
              }))
            ],
            value: selectedAccountId,
            onChange: setSelectedAccountId,
          },
          {
            key: 'category',
            label: 'Categoria',
            options: [
              { value: '', label: 'Todas as categorias' },
              ...filteredCategories.map(category => ({
                value: category.id,
                label: category.name
              }))
            ],
            value: selectedCategoryId,
            onChange: setSelectedCategoryId,
            disabled: !selectedType,
          },
          {
            key: 'creditCard',
            label: 'Cartão',
            options: [
              { value: '', label: 'Todos os cartões' },
              ...creditCards.map(card => ({
                value: card.id,
                label: card.name
              }))
            ],
            value: selectedCreditCardId,
            onChange: setSelectedCreditCardId,
          }
        ]}
        onClearFilters={clearFilters}
      />

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
        <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
          {transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onTogglePaid={handleTogglePaid}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isToggling={togglingTransactionId === transaction.id}
            />
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  )
}
