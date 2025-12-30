import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { BottomNavigationBar } from '@/components/BottomNavigationBar'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (initialPath = '/dashboard') => {
  window.history.pushState({}, '', initialPath)
  return render(
    <BrowserRouter>
      <BottomNavigationBar />
    </BrowserRouter>
  )
}

describe('BottomNavigationBar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render all navigation items', () => {
    renderWithRouter()

    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Contas')).toBeInTheDocument()
    expect(screen.getByLabelText('Novo')).toBeInTheDocument()
    expect(screen.getByLabelText('Relatórios')).toBeInTheDocument()
    expect(screen.getByLabelText('Extrato')).toBeInTheDocument()
  })

  it('should render 5 navigation buttons', () => {
    renderWithRouter()

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })

  it('should have fixed position at bottom', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
  })

  it('should be hidden on large screens (lg:hidden)', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('lg:hidden')
  })

  it('should have z-index for proper layering', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('z-40')
  })

  it('should navigate to dashboard when Home is clicked', () => {
    renderWithRouter('/accounts')

    const homeButton = screen.getByLabelText('Home')
    fireEvent.click(homeButton)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should navigate to accounts when Contas is clicked', () => {
    renderWithRouter()

    const accountsButton = screen.getByLabelText('Contas')
    fireEvent.click(accountsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/accounts')
  })

  it('should navigate to new transaction when Novo is clicked', () => {
    renderWithRouter()

    const newButton = screen.getByLabelText('Novo')
    fireEvent.click(newButton)

    expect(mockNavigate).toHaveBeenCalledWith('/transactions/new')
  })

  it('should navigate to reports when Relatórios is clicked', () => {
    renderWithRouter()

    const reportsButton = screen.getByLabelText('Relatórios')
    fireEvent.click(reportsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/reports')
  })

  it('should navigate to statement when Extrato is clicked', () => {
    renderWithRouter()

    const statementButton = screen.getByLabelText('Extrato')
    fireEvent.click(statementButton)

    expect(mockNavigate).toHaveBeenCalledWith('/statement')
  })

  it('should have center button with special styling', () => {
    renderWithRouter()

    const centerButton = screen.getByLabelText('Novo')
    expect(centerButton).toHaveClass('-mt-5')
  })

  it('should have center button with primary background', () => {
    renderWithRouter()

    const centerButton = screen.getByLabelText('Novo')
    const innerDiv = centerButton.querySelector('div')
    expect(innerDiv).toHaveClass('bg-primary', 'text-white', 'rounded-full')
  })

  it('should have center button with shadow', () => {
    renderWithRouter()

    const centerButton = screen.getByLabelText('Novo')
    const innerDiv = centerButton.querySelector('div')
    expect(innerDiv).toHaveClass('shadow-lg')
  })

  it('should display labels for navigation items', () => {
    renderWithRouter()

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Contas')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByText('Extrato')).toBeInTheDocument()
  })

  it('should have blur effect on background', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    const bgDiv = nav.querySelector('.backdrop-blur-sm')
    expect(bgDiv).toBeInTheDocument()
  })

  it('should have white/translucent background', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    const bgDiv = nav.querySelector('.bg-white\\/95')
    expect(bgDiv).toBeInTheDocument()
  })

  it('should have border at top', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    const bgDiv = nav.querySelector('.border-t')
    expect(bgDiv).toBeInTheDocument()
  })

  it('should highlight active item with primary color', () => {
    renderWithRouter('/dashboard')

    const homeButton = screen.getByLabelText('Home')
    expect(homeButton).toHaveClass('text-primary')
  })

  it('should show inactive items in gray', () => {
    renderWithRouter('/dashboard')

    const accountsButton = screen.getByLabelText('Contas')
    expect(accountsButton).toHaveClass('text-gray-500')
  })

  it('should have aria-current on active page', () => {
    renderWithRouter('/accounts')

    const accountsButton = screen.getByLabelText('Contas')
    expect(accountsButton).toHaveAttribute('aria-current', 'page')
  })

  it('should not have aria-current on inactive pages', () => {
    renderWithRouter('/accounts')

    const homeButton = screen.getByLabelText('Home')
    expect(homeButton).not.toHaveAttribute('aria-current')
  })

  it('should have transition effects on buttons', () => {
    renderWithRouter()

    const homeButton = screen.getByLabelText('Home')
    expect(homeButton).toHaveClass('transition-colors')
  })

  it('should have hover effect on center button', () => {
    renderWithRouter()

    const centerButton = screen.getByLabelText('Novo')
    const innerDiv = centerButton.querySelector('div')
    expect(innerDiv).toHaveClass('hover:bg-primary/90')
  })

  it('should have active scale effect on center button', () => {
    renderWithRouter()

    const centerButton = screen.getByLabelText('Novo')
    const innerDiv = centerButton.querySelector('div')
    expect(innerDiv).toHaveClass('active:scale-95')
  })

  it('should render safe area for devices with home indicator', () => {
    renderWithRouter()

    const nav = screen.getByRole('navigation')
    const safeArea = nav.querySelector('.h-safe-area-bottom')
    expect(safeArea).toBeInTheDocument()
  })
})
