import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with default variant', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600')
  })

  it('should render button with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Outline Button' })
    expect(button).toHaveClass('border', 'border-gray-300')
  })

  it('should render button with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-red-600')
  })

  it('should render button with ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Ghost Button' })
    expect(button).toHaveClass('hover:bg-gray-100')
  })

  it('should render button with different sizes', () => {
    render(<Button size="sm">Small</Button>)
    
    const button = screen.getByRole('button', { name: 'Small' })
    expect(button).toHaveClass('h-9')
  })

  it('should render button with icon size', () => {
    render(<Button size="icon">+</Button>)
    
    const button = screen.getByRole('button', { name: '+' })
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button).toHaveClass('custom-class')
  })

  it('should render as different element when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })
})
