import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reportsApi, accountsApi, transactionsApi } from '@/services/api'
import { PullToRefresh } from '@/components/PullToRefresh'
import { MonthFilter } from '@/components/MonthFilter'
import { invalidateTransactionRelated } from '@/lib/queryInvalidation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialSummaryCards } from '@/components/FinancialSummaryCards'
import { ChevronRight, CreditCard, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, toNumber } from '@/lib/utils'
import { MONTHS } from '@/constants/dateOptions'
import type { Transaction } from '@/types'

// Tipo para agrupamento de transações
interface GroupedTransactions {
  accountId: string
  accountName: string
  directTransactions: Transaction[]
  creditCards: {
    cardId: string
    cardName: string
    transactions: Transaction[]
    total: number
  }[]
  total: number
}

// Função para agrupar transações por conta e cartão
function groupTransactionsByAccount(transactions: Transaction[]): GroupedTransactions[] {
  const accountMap = new Map<string, GroupedTransactions>()

  for (const transaction of transactions) {
    const accountId = transaction.accountId
    const accountName = transaction.account.name

    if (!accountMap.has(accountId)) {
      accountMap.set(accountId, {
        accountId,
        accountName,
        directTransactions: [],
        creditCards: [],
        total: 0,
      })
    }

    const group = accountMap.get(accountId)!
    const numericAmount = toNumber(transaction.amount)
    const amount = transaction.type === 'INCOME' ? numericAmount : -numericAmount
    group.total += amount

    if (transaction.creditCardId && transaction.creditCard) {
      let cardGroup = group.creditCards.find(c => c.cardId === transaction.creditCardId)
      if (!cardGroup) {
        cardGroup = {
          cardId: transaction.creditCardId,
          cardName: transaction.creditCard.name,
          transactions: [],
          total: 0,
        }
        group.creditCards.push(cardGroup)
      }
      cardGroup.transactions.push(transaction)
      cardGroup.total += amount
    } else {
      group.directTransactions.push(transaction)
    }
  }

  return Array.from(accountMap.values())
}

export default function StatementPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    invalidateTransactionRelated(queryClient)
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate dates for historical balances
  const endOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
  const endOfPreviousMonth = new Date(selectedYear, selectedMonth - 1, 0).toISOString().split('T')[0]

  const { data: statement, isLoading: isLoadingStatement } = useQuery({
    queryKey: ['monthly-statement', selectedYear, selectedMonth, selectedAccountId],
    queryFn: () => reportsApi.getMonthlyStatement(selectedYear, selectedMonth, selectedAccountId || undefined),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  // Get initial balance (end of previous month)
  const { data: initialAccounts = [] } = useQuery({
    queryKey: ['accounts-initial-balances', endOfPreviousMonth, selectedAccountId],
    queryFn: () => accountsApi.getAllWithBalances(endOfPreviousMonth, selectedAccountId || undefined),
  })

  // Get final balance (end of selected month)
  const { data: finalAccounts = [] } = useQuery({
    queryKey: ['accounts-final-balances', endOfMonth, selectedAccountId],
    queryFn: () => accountsApi.getAllWithBalances(endOfMonth, selectedAccountId || undefined),
  })

  // Get transaction summary (income and expense)
  const { data: summary } = useQuery({
    queryKey: ['transaction-summary', selectedYear, selectedMonth, selectedAccountId],
    queryFn: () => {
      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 0)

      return transactionsApi.getSummary(
        startOfMonth.toISOString().split('T')[0],
        endOfMonthDate.toISOString().split('T')[0],
        selectedAccountId || undefined
      )
    },
  })

  // Calculate balances
  const initialBalance = selectedAccountId
    ? (initialAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : initialAccounts.reduce((sum, account) => sum + account.balance, 0)

  const finalBalance = selectedAccountId
    ? (finalAccounts.find(a => a.id === selectedAccountId)?.balance || 0)
    : finalAccounts.reduce((sum, account) => sum + account.balance, 0)

  const totalIncome = summary?.totalIncome || 0
  const totalExpense = summary?.totalExpense || 0

  const isLoading = isLoadingStatement || !summary || initialAccounts.length === 0 || finalAccounts.length === 0

  const goToCurrentMonth = () => {
    setSelectedYear(new Date().getFullYear())
    setSelectedMonth(new Date().getMonth() + 1)
    setSelectedAccountId('')
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Extrato Mensal</h1>
        <p className="text-gray-600">Visualize suas movimentações dia a dia</p>
      </div>

      {/* Filters */}
      <MonthFilter
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={(month) => setSelectedMonth(month as number)}
        additionalFilters={[
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
          }
        ]}
        onClearFilters={goToCurrentMonth}
      />

      {/* Summary Cards */}
      <FinancialSummaryCards
        initialBalance={initialBalance}
        finalBalance={finalBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        monthLabel={MONTHS[selectedMonth - 1].label}
        isLoading={isLoading}
      />

      {/* Daily Balances Loading State */}
      {isLoadingStatement && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {statement && (
        <>
          {/* Daily Balances */}
          <div className="space-y-4">
            {statement.dailyBalances.map((dayBalance) => {
              const groupedTransactions = groupTransactionsByAccount(dayBalance.transactions)

              return (
              <Card key={dayBalance.date}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg">
                        Dia {dayBalance.day}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {format(new Date(dayBalance.date + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`text-base sm:text-lg font-bold ${
                        dayBalance.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(dayBalance.totalBalance)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Transactions grouped by account */}
                  {groupedTransactions.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Transações</h4>
                      <div className="space-y-2">
                        {groupedTransactions.map((accountGroup) => {
                          const accountKey = `${dayBalance.date}-${accountGroup.accountId}`
                          const isAccountExpanded = expandedGroups[accountKey] || false

                          return (
                            <div key={accountGroup.accountId} className="border rounded-lg overflow-hidden">
                              {/* Account Header - Clickable */}
                              <button
                                onClick={() => toggleGroup(accountKey)}
                                className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronRight
                                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                                      isAccountExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                  <Wallet className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium text-sm">{accountGroup.accountName}</span>
                                </div>
                                <span className={`font-medium text-sm ${
                                  accountGroup.total >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(accountGroup.total)}
                                </span>
                              </button>

                              {/* Account Content - Expandable */}
                              <div className={`transition-all duration-200 overflow-hidden ${
                                isAccountExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                              }`}>
                                <div className="p-3 space-y-2">
                                  {/* Direct transactions (not from credit card) */}
                                  {accountGroup.directTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-gray-50 rounded">
                                      <div className="flex items-start space-x-2 min-w-0 flex-1">
                                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                          transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-sm font-medium break-words">{transaction.description}</div>
                                          <span className="text-xs text-gray-500">{transaction.category.name}</span>
                                        </div>
                                      </div>
                                      <div className={`text-sm font-medium flex-shrink-0 ${
                                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Credit card groups */}
                                  {accountGroup.creditCards.map((cardGroup) => {
                                    const cardKey = `${dayBalance.date}-${accountGroup.accountId}-${cardGroup.cardId}`
                                    const isCardExpanded = expandedGroups[cardKey] || false

                                    return (
                                      <div key={cardGroup.cardId} className="border rounded-lg overflow-hidden ml-4">
                                        {/* Card Header - Clickable */}
                                        <button
                                          onClick={() => toggleGroup(cardKey)}
                                          className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <ChevronRight
                                              className={`h-3 w-3 text-blue-500 transition-transform duration-200 ${
                                                isCardExpanded ? 'rotate-90' : ''
                                              }`}
                                            />
                                            <CreditCard className="h-3 w-3 text-blue-600" />
                                            <span className="font-medium text-xs text-blue-700">{cardGroup.cardName}</span>
                                          </div>
                                          <span className={`font-medium text-xs ${
                                            cardGroup.total >= 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {formatCurrency(cardGroup.total)}
                                          </span>
                                        </button>

                                        {/* Card Content - Expandable */}
                                        <div className={`transition-all duration-200 overflow-hidden ${
                                          isCardExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                          <div className="p-2 space-y-1">
                                            {cardGroup.transactions.map((transaction) => (
                                              <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2 bg-white rounded border">
                                                <div className="flex items-start space-x-2 min-w-0 flex-1">
                                                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                                    transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                                                  }`} />
                                                  <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-medium break-words">{transaction.description}</div>
                                                    <span className="text-xs text-gray-500">{transaction.category.name}</span>
                                                  </div>
                                                </div>
                                                <div className={`text-xs font-medium flex-shrink-0 ${
                                                  transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                  {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Transfers */}
                  {dayBalance.transfers.length > 0 && (
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Transferências</h4>
                      <div className="space-y-2">
                        {dayBalance.transfers.map((transfer) => (
                          <div key={transfer.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-blue-50 rounded">
                            <div className="flex items-start space-x-2 min-w-0 flex-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm break-words">
                                  {transfer.fromAccount.name} → {transfer.toAccount.name}
                                </div>
                                {transfer.description && (
                                  <div className="text-xs text-gray-500 mt-1 break-words">
                                    {transfer.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm sm:text-base font-medium text-gray-900 flex-shrink-0">
                              {formatCurrency(transfer.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Balances */}
                  <div className="pt-4 border-t">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3">Saldos por Conta</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {statement.accounts.map((account) => (
                        <div key={account.id} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600 truncate mb-1">{account.name}</div>
                          <div className={`text-xs sm:text-sm font-medium ${
                            (dayBalance.balances[account.id] || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(dayBalance.balances[account.id] || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
    </PullToRefresh>
  )
}
