import PropTypes from 'prop-types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Pencil, Trash2, CreditCard, Building2, ShoppingCart, Calendar, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import styles from './TransactionCard.module.scss'

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
      icon: <Tag size={12} />,
      show: true,
    },
    {
      label: 'BANCO',
      value: transaction.account?.name,
      icon: <Building2 size={12} />,
      show: true,
    },
    {
      label: 'CARTÃO',
      value: transaction.creditCard?.name,
      icon: <CreditCard size={12} />,
      show: !!transaction.creditCard,
    },
    {
      label: dateLabel,
      value: formatDateShort(displayDate),
      icon: <Calendar size={12} />,
      show: true,
    },
  ].filter(block => block.show)

  return (
    <div
      className={`${styles.cardWrapper} ${isPaid ? styles.paid : ''}`}
      data-testid="transaction-card"
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={`${styles.statusDot} ${isPaid ? styles.paidDot : styles.pendingDot}`} />
            <h3 className={styles.title}>{transaction.description}</h3>
            <span className={styles.statusPill}>
              Status: {isPaid ? 'Pago' : 'Pendente'}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${styles.checkButton} ${isPaid ? styles.paidButton : ''}`}
              onClick={handleTogglePaid}
              disabled={isToggling}
              aria-label={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
              data-testid="toggle-paid-button"
              title={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
              type="button"
            >
              <Check size={14} strokeWidth={2.5} />
            </button>

            <button
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEdit}
              aria-label="Editar transação"
              data-testid="edit-button"
              title="Editar transação"
              type="button"
            >
              <Pencil size={14} />
            </button>

            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              aria-label="Excluir transação"
              data-testid="delete-button"
              title="Excluir transação"
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className={styles.infoRow}>
          {infoBlocks.map((block, index) => (
            <div key={block.label} className={styles.infoBlock}>
              {index > 0 && <div className={styles.separator} />}
              <div className={styles.infoContent}>
                <div className={styles.infoHeader}>
                  {block.icon}
                  <span className={styles.infoLabel}>{block.label}</span>
                </div>
                <div className={styles.infoValue}>{block.value}</div>
              </div>
            </div>
          ))}

          <div className={styles.spacer} />

          <div
            className={styles.amount}
            data-testid="transaction-amount"
          >
            -{formatCurrency(transaction.amount)}
          </div>
        </div>

        {transaction.installmentNumber && transaction.totalInstallments && (
          <div className={styles.installmentRow} data-testid="installment-info">
            <ShoppingCart size={12} />
            <span>{transaction.installmentNumber}/{transaction.totalInstallments}x</span>
          </div>
        )}

        {transaction.notes && (
          <div className={styles.notes} data-testid="transaction-notes">
            {transaction.notes}
          </div>
        )}
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
