import React, { useEffect, useRef, useId } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
  title?: string
  description?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
  id?: string
}

interface DialogDescriptionProps {
  children: React.ReactNode
  id?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Handle Escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Focus trap and restore focus
  useEffect(() => {
    if (!open) return

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus first focusable element in dialog
    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Restore focus on close
    return () => {
      previousActiveElement.current?.focus()
    }
  }, [open])

  // Focus trap - keep focus within dialog
  useEffect(() => {
    if (!open) return

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [open])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative z-50"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ className, children, title, description, ...props }: DialogContentProps & React.HTMLAttributes<HTMLDivElement>) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto',
        className
      )}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      {children}
    </div>
  )
}

export function DialogTitle({ children, id }: DialogTitleProps) {
  return (
    <h2 id={id} className="text-lg font-semibold text-gray-900">
      {children}
    </h2>
  )
}

export function DialogDescription({ children, id }: DialogDescriptionProps) {
  return (
    <p id={id} className="text-sm text-gray-600">
      {children}
    </p>
  )
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className="h-6 w-6"
      aria-label="Fechar"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
