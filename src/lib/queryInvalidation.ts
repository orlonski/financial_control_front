import { QueryClient } from '@tanstack/react-query'

export function invalidateAllBalances(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['accounts'] })
  queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
  queryClient.invalidateQueries({ queryKey: ['accounts-initial-balances'] })
  queryClient.invalidateQueries({ queryKey: ['accounts-final-balances'] })
}

export function invalidateAllReports(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['transaction-summary'] })
  queryClient.invalidateQueries({ queryKey: ['category-report'] })
  queryClient.invalidateQueries({ queryKey: ['cashflow-report'] })
  queryClient.invalidateQueries({ queryKey: ['monthly-statement'] })
}

export function invalidateTransactionRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] })
  queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
  queryClient.invalidateQueries({ queryKey: ['transfers'] })
  invalidateAllBalances(queryClient)
  invalidateAllReports(queryClient)
}

export function invalidateAll(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['categories'] })
  invalidateTransactionRelated(queryClient)
}
