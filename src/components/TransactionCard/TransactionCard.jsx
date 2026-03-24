import PropTypes from 'prop-types'
import { format, parseISO } from 'date-fns'
import { Check, Pencil, Trash2, CreditCard, Landmark, ShoppingCart, Calendar, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const monthShortFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
})

function formatDateShort(dateStr) {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  const month = monthShortFormatter.format(date)
  return format(date, `dd '${month}' yyyy`).replace(month.charAt(0), month.charAt(0).toUpperCase())
}

export function TransactionCard({
  transaction,
  onTogglePaid,
  onEdit,
  onDelete,
  isToggling = false,
}) {
  const isPaid = transaction.paid

  const handleTogglePaid = () => {
    if (onTogglePaid) {
      onTogglePaid(transaction)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction.id)
    }
  }

  const displayDate = transaction.purchaseDate || transaction.date
  const dateLabel = transaction.purchaseDate ? 'COMPRA' : 'VENCIMENTO'

  const infoBlocks = [
    {
      label: 'CATEGORIA',
      value: transaction.category?.name,
      icon: <Tag className="w-3 h-3" />,
      show: true,
    },
    {
      label: 'BANCO',
      value: transaction.account?.name,
      icon: <Landmark className="w-3 h-3" />,
      show: true,
    },
    {
      label: 'CARTÃO',
      value: transaction.creditCard?.name,
      icon: <CreditCard className="w-3 h-3" />,
      show: !!transaction.creditCard,
    },
    {
      label: dateLabel,
      value: formatDateShort(displayDate),
      icon: <Calendar className="w-3 h-3" />,
      show: true,
    },
  ].filter(block => block.show)

  return (
    <div
      className={`py-2 ${isPaid ? 'opacity-75' : ''}`}
      data-testid="transaction-card"
    >
      <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-green-500' : 'bg-red-500'}`} />
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {transaction.description}
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                Status: {isPaid ? 'Pago' : 'Pendente'}
              </span>
            </div>

            <div className="flex flex-wrap items-center mt-3 gap-x-4 gap-y-2">
              {infoBlocks.map((block, index) => (
                <div key={block.label} className="flex items-center">
                  {index > 0 && (
                    <div className="w-px h-6 bg-gray-200 mr-4" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-gray-400">
                      {block.icon}
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {block.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {block.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {transaction.installmentNumber && transaction.totalInstallments && (
              <div
                className="inline-flex items-center gap-1 mt-3 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium"
                data-testid="installment-info"
              >
                <ShoppingCart className="w-3 h-3" />
                <span>{transaction.installmentNumber}/{transaction.totalInstallments}x</span>
              </div>
            )}

            {transaction.notes && (
              <div
                className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 break-words"
                data-testid="transaction-notes"
              >
                {transaction.notes}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-1.5 flex-shrink-0 sm:ml-4">
            <div className="flex items-center gap-1.5">
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  isPaid
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-100 text-green-600 border-2 border-green-500 hover:bg-green-50'
                }`}
                onClick={handleTogglePaid}
                disabled={isToggling}
                aria-label={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                data-testid="toggle-paid-button"
                title={isPaid ? 'Marcar como não pago' : 'Marcar como Pago'}
                type="button"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={handleEdit}
                aria-label="Editar transação"
                data-testid="edit-button"
                title="Editar transação"
                type="button"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={handleDelete}
                aria-label="Excluir transação"
                data-testid="delete-button"
                title="Excluir transação"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div
              className="text-xl md:text-2xl font-bold text-red-700 whitespace-nowrap"
              data-testid="transaction-amount"
            >
              -{formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

TransactionCard.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['INCOME', 'EXPENSE']).isRequired,
    amount: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    purchaseDate: PropTypes.string,
    paid: PropTypes.bool,
    paidAt: PropTypes.string,
    notes: PropTypes.string,
    installmentNumber: PropTypes.number,
    totalInstallments: PropTypes.number,
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
    }).isRequired,
    category: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
    }).isRequired,
    creditCard: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  onTogglePaid: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isToggling: PropTypes.bool,
}

TransactionCard.defaultProps = {
  isToggling: false,
}

export default TransactionCard
