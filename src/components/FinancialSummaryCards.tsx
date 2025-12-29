import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialSummaryCardsProps {
  initialBalance: number
  finalBalance: number
  totalIncome: number
  totalExpense: number
  monthLabel: string
  isLoading?: boolean
}

export function FinancialSummaryCards({
  initialBalance,
  finalBalance,
  totalIncome,
  totalExpense,
  monthLabel,
  isLoading = false,
}: FinancialSummaryCardsProps) {
  const monthlyResult = totalIncome - totalExpense

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Saldo Inicial</CardTitle>
          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-base sm:text-2xl font-bold ${initialBalance > 0 ? 'text-green-600' : initialBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {formatCurrency(initialBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Fim do mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Receitas</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-base sm:text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthLabel}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Despesas</CardTitle>
          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-base sm:text-2xl font-bold text-red-600">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthLabel}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Resultado</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-base sm:text-2xl font-bold ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyResult)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receitas - Despesas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Saldo Final</CardTitle>
          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-base sm:text-2xl font-bold ${finalBalance > 0 ? 'text-green-600' : finalBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {formatCurrency(finalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Fim do mês
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
