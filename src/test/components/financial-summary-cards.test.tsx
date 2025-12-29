import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FinancialSummaryCards } from '@/components/FinancialSummaryCards'

describe('FinancialSummaryCards', () => {
  const defaultProps = {
    initialBalance: 0,
    finalBalance: 0,
    totalIncome: 1000,
    totalExpense: 500,
    monthLabel: 'Janeiro 2025',
  }

  describe('Initial Balance Color', () => {
    it('should display positive initial balance in green', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          initialBalance={1500}
        />
      )

      const saldoInicialCard = screen.getByText('Saldo Inicial').closest('div')?.parentElement
      const balanceValue = saldoInicialCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-green-600')
      expect(balanceValue).not.toHaveClass('text-red-600')
      expect(balanceValue).not.toHaveClass('text-gray-500')
    })

    it('should display negative initial balance in red', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          initialBalance={-500}
        />
      )

      const saldoInicialCard = screen.getByText('Saldo Inicial').closest('div')?.parentElement
      const balanceValue = saldoInicialCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-red-600')
      expect(balanceValue).not.toHaveClass('text-green-600')
      expect(balanceValue).not.toHaveClass('text-gray-500')
    })

    it('should display zero initial balance in gray', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          initialBalance={0}
        />
      )

      const saldoInicialCard = screen.getByText('Saldo Inicial').closest('div')?.parentElement
      const balanceValue = saldoInicialCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-gray-500')
      expect(balanceValue).not.toHaveClass('text-green-600')
      expect(balanceValue).not.toHaveClass('text-red-600')
    })
  })

  describe('Card Rendering', () => {
    it('should render all five summary cards', () => {
      render(<FinancialSummaryCards {...defaultProps} />)

      expect(screen.getByText('Saldo Inicial')).toBeInTheDocument()
      expect(screen.getByText('Receitas')).toBeInTheDocument()
      expect(screen.getByText('Despesas')).toBeInTheDocument()
      expect(screen.getByText('Resultado')).toBeInTheDocument()
      expect(screen.getByText('Saldo Final')).toBeInTheDocument()
    })

    it('should display loading skeleton when isLoading is true', () => {
      render(<FinancialSummaryCards {...defaultProps} isLoading={true} />)

      expect(screen.queryByText('Saldo Inicial')).not.toBeInTheDocument()
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(5)
    })

    it('should display month label in income and expense cards', () => {
      render(<FinancialSummaryCards {...defaultProps} monthLabel="Fevereiro 2025" />)

      const monthLabels = screen.getAllByText('Fevereiro 2025')
      expect(monthLabels.length).toBe(2)
    })
  })

  describe('Result Color', () => {
    it('should display positive result in green', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          totalIncome={2000}
          totalExpense={500}
        />
      )

      const resultCard = screen.getByText('Resultado').closest('div')?.parentElement
      const resultValue = resultCard?.querySelector('.font-bold')

      expect(resultValue).toHaveClass('text-green-600')
    })

    it('should display negative result in red', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          totalIncome={500}
          totalExpense={2000}
        />
      )

      const resultCard = screen.getByText('Resultado').closest('div')?.parentElement
      const resultValue = resultCard?.querySelector('.font-bold')

      expect(resultValue).toHaveClass('text-red-600')
    })

    it('should display zero result in green', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          totalIncome={1000}
          totalExpense={1000}
        />
      )

      const resultCard = screen.getByText('Resultado').closest('div')?.parentElement
      const resultValue = resultCard?.querySelector('.font-bold')

      expect(resultValue).toHaveClass('text-green-600')
    })
  })

  describe('Final Balance Color', () => {
    it('should display positive final balance in blue', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          finalBalance={3000}
        />
      )

      const finalBalanceCard = screen.getByText('Saldo Final').closest('div')?.parentElement
      const balanceValue = finalBalanceCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-blue-600')
    })

    it('should display negative final balance in red', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          finalBalance={-1000}
        />
      )

      const finalBalanceCard = screen.getByText('Saldo Final').closest('div')?.parentElement
      const balanceValue = finalBalanceCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-red-600')
    })

    it('should display zero final balance in blue', () => {
      render(
        <FinancialSummaryCards
          {...defaultProps}
          finalBalance={0}
        />
      )

      const finalBalanceCard = screen.getByText('Saldo Final').closest('div')?.parentElement
      const balanceValue = finalBalanceCard?.querySelector('.font-bold')

      expect(balanceValue).toHaveClass('text-blue-600')
    })
  })
})
