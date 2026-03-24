import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionCard } from '../TransactionCard'

const mockTransaction = {
  id: '1',
  type: 'EXPENSE',
  amount: 150.5,
  description: 'Supermercado Extra',
  date: '2024-01-15',
  purchaseDate: '2024-01-14',
  paid: false,
  account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
  category: { id: '1', name: 'Alimentação', type: 'EXPENSE' },
  creditCard: { id: '1', name: 'Cartão Visa' },
  installmentNumber: 2,
  totalInstallments: 3,
  userId: 'user1',
  createdAt: '2024-01-14',
  updatedAt: '2024-01-14',
}

const mockIncomeTransaction = {
  id: '2',
  type: 'INCOME',
  amount: 5000,
  description: 'Salário Janeiro',
  date: '2024-01-05',
  paid: true,
  paidAt: '2024-01-05',
  account: { id: '1', name: 'Conta Corrente', type: 'CHECKING' },
  category: { id: '2', name: 'Salário', type: 'INCOME' },
  userId: 'user1',
  createdAt: '2024-01-05',
  updatedAt: '2024-01-05',
}

describe('TransactionCard', () => {
  const mockOnTogglePaid = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render transaction card with description', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Supermercado Extra')).toBeInTheDocument()
    })

    it('should render transaction amount with correct format for expense', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('transaction-amount')).toHaveTextContent('-R$ 150,50')
    })

    it('should render transaction amount with correct format for income', () => {
      render(
        <TransactionCard
          transaction={mockIncomeTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('transaction-amount')).toHaveTextContent('-R$ 5.000,00')
    })

    it('should display COMPRA label when purchaseDate is present', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('COMPRA')).toBeInTheDocument()
    })

    it('should display VENCIMENTO label when purchaseDate is not present', () => {
      render(
        <TransactionCard
          transaction={mockIncomeTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('VENCIMENTO')).toBeInTheDocument()
    })

    it('should display installment information when present', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('installment-info')).toHaveTextContent('2/3')
    })

    it('should display notes when present', () => {
      const transactionWithNotes = {
        ...mockTransaction,
        notes: 'Tanque cheio',
      }

      render(
        <TransactionCard
          transaction={transactionWithNotes}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('transaction-notes')).toHaveTextContent('Tanque cheio')
    })

    it('should display category and account names', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Alimentação')).toBeInTheDocument()
      expect(screen.getByText('Conta Corrente')).toBeInTheDocument()
    })

    it('should display credit card name when present', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Cartão Visa')).toBeInTheDocument()
    })

    it('should display status pill with Pendente for unpaid transaction', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Status: Pendente')).toBeInTheDocument()
    })

    it('should display status pill with Pago for paid transaction', () => {
      render(
        <TransactionCard
          transaction={mockIncomeTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Status: Pago')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onTogglePaid when toggle button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const toggleButton = screen.getByTestId('toggle-paid-button')
      await user.click(toggleButton)

      expect(mockOnTogglePaid).toHaveBeenCalledWith(mockTransaction)
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByTestId('edit-button')
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockTransaction)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-button')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('1')
    })

    it('should show loading state when isToggling is true', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isToggling={true}
        />
      )

      const toggleButton = screen.getByTestId('toggle-paid-button')
      expect(toggleButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct aria-label on toggle paid button for unpaid transaction', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const toggleButton = screen.getByTestId('toggle-paid-button')
      expect(toggleButton).toHaveAttribute('aria-label', 'Marcar como pago')
    })

    it('should have correct aria-label on toggle paid button for paid transaction', () => {
      render(
        <TransactionCard
          transaction={mockIncomeTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const toggleButton = screen.getByTestId('toggle-paid-button')
      expect(toggleButton).toHaveAttribute('aria-label', 'Marcar como não pago')
    })

    it('should have aria-label on edit button', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByTestId('edit-button')
      expect(editButton).toHaveAttribute('aria-label', 'Editar transação')
    })

    it('should have aria-label on delete button', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByTestId('delete-button')
      expect(deleteButton).toHaveAttribute('aria-label', 'Excluir transação')
    })
  })

  describe('Visual Indicators', () => {
    it('should show paid state styling for paid transactions', () => {
      render(
        <TransactionCard
          transaction={mockIncomeTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const card = screen.getByTestId('transaction-card')
      expect(card.className).toContain('opacity-75')
    })

    it('should not show paid state styling for unpaid transactions', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          onTogglePaid={mockOnTogglePaid}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const card = screen.getByTestId('transaction-card')
      expect(card.className).not.toContain('opacity-75')
    })
  })
})
