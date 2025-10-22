import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

describe('Card Components', () => {
  it('should render Card with content', () => {
    render(
      <Card>
        <CardContent>
          <p>Card content</p>
        </CardContent>
      </Card>
    )
    
    const card = screen.getByText('Card content').closest('div')
    expect(card).toHaveClass('rounded-lg', 'border', 'border-gray-200')
  })

  it('should render CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    )
    
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    
    const header = screen.getByText('Card Title').closest('div')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('should render CardTitle with correct styling', () => {
    render(<CardTitle>Test Title</CardTitle>)
    
    const title = screen.getByText('Test Title')
    expect(title).toHaveClass('text-2xl', 'font-semibold')
  })

  it('should render CardDescription with correct styling', () => {
    render(<CardDescription>Test Description</CardDescription>)
    
    const description = screen.getByText('Test Description')
    expect(description).toHaveClass('text-sm', 'text-gray-600')
  })

  it('should render CardContent with correct styling', () => {
    render(
      <CardContent>
        <p>Content here</p>
      </CardContent>
    )
    
    const content = screen.getByText('Content here').closest('div')
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('should render CardFooter with correct styling', () => {
    render(
      <CardFooter>
        <button>Action</button>
      </CardFooter>
    )
    
    const footer = screen.getByRole('button').closest('div')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('should accept custom className', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    )
    
    const card = screen.getByText('Content').closest('div')
    expect(card).toHaveClass('custom-card')
  })

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a complete card example</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the card content with some information.</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Complete Card')).toBeInTheDocument()
    expect(screen.getByText('This is a complete card example')).toBeInTheDocument()
    expect(screen.getByText('This is the card content with some information.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
  })
})
