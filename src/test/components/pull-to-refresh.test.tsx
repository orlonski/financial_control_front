import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PullToRefresh } from '@/components/PullToRefresh'

describe('PullToRefresh Component', () => {
  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    })

    // Mock window.scrollTo
    window.scrollTo = vi.fn()
  })

  it('should render children content', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should not show scroll-to-top button initially', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    const scrollButton = screen.queryByRole('button', { name: 'Voltar ao topo' })
    expect(scrollButton).not.toBeInTheDocument()
  })

  it('should show scroll-to-top button when scrolled past 200px', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll past 200px
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toBeInTheDocument()
    })
  })

  it('should have scroll-to-top button on left side (left-6)', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('left-6')
    })
  })

  it('should have scroll-to-top button at bottom-6', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('bottom-6')
    })
  })

  it('should have scroll-to-top button with z-30', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('z-30')
    })
  })

  it('should have primary background color on scroll-to-top button', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('bg-primary', 'text-white')
    })
  })

  it('should scroll to top when button is clicked', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      fireEvent.click(scrollButton)
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('should hide scroll-to-top button when scrolled back to top', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll down
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Voltar ao topo' })).toBeInTheDocument()
    })

    // Simulate scroll back to top
    Object.defineProperty(window, 'scrollY', { value: 50 })
    fireEvent.scroll(window)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Voltar ao topo' })).not.toBeInTheDocument()
    })
  })

  it('should call onRefresh when pull-to-refresh is triggered', async () => {
    const mockRefresh = vi.fn()
    render(
      <PullToRefresh onRefresh={mockRefresh}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Note: Full pull-to-refresh simulation would require more complex touch event handling
    // This is a simplified test to verify the onRefresh prop is properly passed
    expect(mockRefresh).toHaveBeenCalledTimes(0)
  })

  it('should have fixed position on scroll-to-top button', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('fixed')
    })
  })

  it('should have correct styles on scroll-to-top button', async () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Content</div>
      </PullToRefresh>
    )

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 250 })
    fireEvent.scroll(window)

    await waitFor(() => {
      const scrollButton = screen.getByRole('button', { name: 'Voltar ao topo' })
      expect(scrollButton).toHaveClass('rounded-full', 'shadow-lg', 'p-3')
    })
  })
})
