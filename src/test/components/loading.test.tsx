import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Loading } from '@/components/ui/loading'

describe('Loading Component', () => {
  it('should render loading spinner with default props', () => {
    render(<Loading size="md" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Carregando...')
  })

  it('should render loading text by default', () => {
    render(<Loading size="md" />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('should render custom loading text', () => {
    render(<Loading size="md" text="Aguarde..." />)

    expect(screen.getByText('Aguarde...')).toBeInTheDocument()
  })

  it('should render small size spinner', () => {
    render(<Loading size="sm" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toHaveClass('h-4', 'w-4')
  })

  it('should render medium size spinner', () => {
    render(<Loading size="md" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toHaveClass('h-6', 'w-6')
  })

  it('should render large size spinner', () => {
    render(<Loading size="lg" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toHaveClass('h-10', 'w-10')
  })

  it('should have animate-spin class for animation', () => {
    render(<Loading size="md" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toHaveClass('animate-spin')
  })

  it('should apply custom className', () => {
    render(<Loading size="md" className="custom-class" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-class')
  })

  it('should render fullscreen variant', () => {
    render(<Loading size="lg" fullscreen />)

    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('fixed', 'inset-0', 'z-50')
  })

  it('should have proper accessibility attributes', () => {
    render(<Loading size="md" text="Loading data..." />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading data...')
  })

  it('should render text with correct size class for sm', () => {
    render(<Loading size="sm" />)

    const text = screen.getByText('Carregando...')
    expect(text).toHaveClass('text-xs')
  })

  it('should render text with correct size class for md', () => {
    render(<Loading size="md" />)

    const text = screen.getByText('Carregando...')
    expect(text).toHaveClass('text-sm')
  })

  it('should render text with correct size class for lg', () => {
    render(<Loading size="lg" />)

    const text = screen.getByText('Carregando...')
    expect(text).toHaveClass('text-base')
  })

  it('should apply default color class', () => {
    render(<Loading size="md" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    expect(spinnerElement).toHaveClass('border-blue-600')
  })

  it('should have transparent border-top for spinner effect', () => {
    render(<Loading size="md" />)

    const spinner = screen.getByRole('status')
    const spinnerElement = spinner.querySelector('div')
    // The style attribute sets borderTopColor to transparent for the spinner effect
    expect(spinnerElement).toHaveAttribute('style', 'border-top-color: transparent;')
  })
})
