import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  CreditCard,
  ShoppingBag,
  Calendar,
  MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/types'

interface TransactionCardProps {
  transaction: Transaction
  onTogglePaid: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  isToggling?: boolean
}

export function TransactionCard({
  transaction,
  onTogglePaid,
  onEdit,
  onDelete,
  isToggling = false,
}: TransactionCardProps) {
  const isIncome = transaction.type === 'INCOME'
  const isPaid = transaction.paid

  const displayDate = transaction.purchaseDate || transaction.date
  const dateLabel = transaction.purchaseDate ? 'Compra:' : 'Venc:'

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200',
        'hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5',
        isPaid && 'opacity-75'
      )}
      data-testid="transaction-card"
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            )}
          >
            {isIncome ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className="truncate text-base font-semibold text-gray-900"
                title={transaction.description}
              >
                {transaction.description}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <span className="font-medium">{transaction.category.name}</span>
                <span className="text-gray-300">•</span>
                <span>{transaction.account.name}</span>
                {transaction.creditCard && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center">
                      <CreditCard className="mr-1 h-3 w-3" />
                      {transaction.creditCard.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                className={cn(
                  'text-xl font-bold',
                  isIncome ? 'text-green-600' : 'text-red-600'
                )}
                data-testid="transaction-amount"
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700"
              data-testid="date-badge"
            >
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>
                <span className="text-gray-500">{dateLabel}</span>{' '}
                {format(new Date(displayDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>

            {transaction.installmentNumber && transaction.totalInstallments && (
              <span
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                data-testid="installment-info"
              >
                {transaction.installmentNumber}/{transaction.totalInstallments}
              </span>
            )}

            {transaction.notes && (
              <div
                className="mt-2 w-full text-sm text-gray-500"
                data-testid="transaction-notes"
              >
                {transaction.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onTogglePaid(transaction)}
          disabled={isToggling}
          aria-label={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
          data-testid="toggle-paid-button"
        >
          {isToggling ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
          ) : isPaid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onEdit(transaction)}
          aria-label="Editar transação"
          data-testid="edit-button"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 transition-opacity hover:opacity-100 hover:text-red-600"
          onClick={() => onDelete(transaction.id)}
          aria-label="Excluir transação"
          data-testid="delete-button"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
