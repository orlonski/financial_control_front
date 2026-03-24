import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Circle, Edit, Trash2, CreditCard, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import styles from './TransactionCard.module.scss'

const ArrowUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
)

export function TransactionCard({
  transaction,
  onTogglePaid,
  onEdit,
  onDelete,
  isToggling = false,
}) {
  const isIncome = transaction.type === 'INCOME'
  const isPaid = transaction.paid

  const displayDate = transaction.purchaseDate || transaction.date
  const dateLabel = transaction.purchaseDate ? 'Compra:' : 'Venc:'

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

  return (
    <div
      className={`${styles.transactionCard} ${isPaid ? styles.paid : ''}`}
      data-testid="transaction-card"
    >
      <div className={styles.typeIcon}>
        {isIncome ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title} title={transaction.description}>
              {transaction.description}
            </h3>

            <div className={styles.meta}>
              <span className={styles.metaItem}>{transaction.category.name}</span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.metaItem}>{transaction.account.name}</span>
              {transaction.creditCard && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaItem}>
                    <CreditCard size={12} />
                    {transaction.creditCard.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={styles.valueContainer}>
            <div
              className={`${styles.value} ${isIncome ? styles.income : styles.expense}`}
              data-testid="transaction-amount"
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>

        <div className={styles.badges}>
          <div className={styles.dateBadge} data-testid="date-badge">
            <Calendar className={styles.dateBadgeIcon} size={14} />
            <span>
              <span className={styles.dateBadgeLabel}>{dateLabel}</span>{' '}
              {format(new Date(displayDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          {transaction.installmentNumber && transaction.totalInstallments && (
            <span className={styles.installmentBadge} data-testid="installment-info">
              {transaction.installmentNumber}/{transaction.totalInstallments}
            </span>
          )}
        </div>

        {transaction.notes && (
          <div className={styles.notes} data-testid="transaction-notes">
            {transaction.notes}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.togglePaid}`}
          onClick={handleTogglePaid}
          disabled={isToggling}
          aria-label={isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
          data-testid="toggle-paid-button"
          type="button"
        >
          {isToggling ? (
            <div className={styles.loadingSpinner} />
          ) : isPaid ? (
            <CheckCircle2 size={16} color="#16a34a" />
          ) : (
            <Circle size={16} color="#9ca3af" />
          )}
        </button>

        <button
          className={`${styles.actionButton} ${styles.edit}`}
          onClick={handleEdit}
          aria-label="Editar transação"
          data-testid="edit-button"
          type="button"
        >
          <Edit size={14} />
        </button>

        <button
          className={`${styles.actionButton} ${styles.delete}`}
          onClick={handleDelete}
          aria-label="Excluir transação"
          data-testid="delete-button"
          type="button"
        >
          <Trash2 size={14} />
        </button>
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
