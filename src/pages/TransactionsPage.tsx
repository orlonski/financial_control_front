import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transactionsApi, creditCardsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Receipt, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transaction } from '@/types'

export default function TransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll({ limit: 50 }),
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
    },
  })

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(id)
    }
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
    </div>
  )
}
