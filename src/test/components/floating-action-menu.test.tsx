import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FloatingActionMenu } from '@/components/FloatingActionMenu'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('FloatingActionMenu Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render FAB button with correct aria-label when closed', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    expect(fabButton).toBeInTheDocument()
    expect(fabButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('should have correct positioning classes', () => {
    render(<FloatingActionMenu />)

    const container = document.querySelector('[data-fab-menu]')
    expect(container).toHaveClass('fixed', 'bottom-20', 'right-6', 'z-40')
  })

  it('should have minimum touch area of 56px for accessibility', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    expect(fabButton).toHaveClass('min-w-[56px]', 'min-h-[56px]')
  })

  it('should open menu when FAB is clicked', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    const closeButton = screen.getByRole('button', { name: 'Fechar menu' })
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('should display all menu items when opened', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    expect(screen.getByLabelText('Nova Transação')).toBeInTheDocument()
    expect(screen.getByLabelText('Transferência')).toBeInTheDocument()
    expect(screen.getByLabelText('Ver Extrato')).toBeInTheDocument()
  })

  it('should display menu item labels', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
    expect(screen.getByText('Transferência')).toBeInTheDocument()
    expect(screen.getByText('Ver Extrato')).toBeInTheDocument()
  })

  it('should navigate to /transactions/new when Nova Transação is clicked', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    const novaTransacaoButton = screen.getByLabelText('Nova Transação')
    fireEvent.click(novaTransacaoButton)

    expect(mockNavigate).toHaveBeenCalledWith('/transactions/new')
  })

  it('should navigate to /transfers when Transferência is clicked', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    const transferenciaButton = screen.getByLabelText('Transferência')
    fireEvent.click(transferenciaButton)

    expect(mockNavigate).toHaveBeenCalledWith('/transfers')
  })

  it('should navigate to /statement when Ver Extrato is clicked', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    const verExtratoButton = screen.getByLabelText('Ver Extrato')
    fireEvent.click(verExtratoButton)

    expect(mockNavigate).toHaveBeenCalledWith('/statement')
  })

  it('should close menu when clicking on a menu item', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    const novaTransacaoButton = screen.getByLabelText('Nova Transação')
    fireEvent.click(novaTransacaoButton)

    // After clicking, the menu should close
    expect(screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })).toBeInTheDocument()
  })

  it('should close menu when FAB is clicked again (toggle)', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })

    // Open menu
    fireEvent.click(fabButton)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument()

    // Close menu
    const closeButton = screen.getByRole('button', { name: 'Fechar menu' })
    fireEvent.click(closeButton)
    expect(screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })).toBeInTheDocument()
  })

  it('should close menu when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <FloatingActionMenu />
      </div>
    )

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    // Menu should be open
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument()

    // Click outside
    const outsideArea = screen.getByTestId('outside-area')
    fireEvent.click(outsideArea)

    // Menu should close
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })).toBeInTheDocument()
    })
  })

  it('should not close menu when clicking inside FAB area', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    // Click on the container itself
    const container = document.querySelector('[data-fab-menu]')
    fireEvent.click(container!)

    // Menu should remain open
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument()
  })

  it('should have primary background color on FAB button', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    expect(fabButton).toHaveClass('bg-primary', 'text-white')
  })

  it('should have menu items hidden when menu is closed', () => {
    render(<FloatingActionMenu />)

    // Menu items container should have pointer-events-none when closed
    const menuContainer = document.querySelector('[data-fab-menu] > div:first-child')
    expect(menuContainer).toHaveClass('pointer-events-none')
  })

  it('should have menu items visible when menu is open', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    fireEvent.click(fabButton)

    // Menu items container should not have pointer-events-none when open
    const menuContainer = document.querySelector('[data-fab-menu] > div:first-child')
    expect(menuContainer).not.toHaveClass('pointer-events-none')
  })

  it('should have transition classes for smooth animations', () => {
    render(<FloatingActionMenu />)

    const fabButton = screen.getByRole('button', { name: 'Abrir menu de ações rápidas' })
    expect(fabButton).toHaveClass('transition-all', 'duration-200')
  })
})
