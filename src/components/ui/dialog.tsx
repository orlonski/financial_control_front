import React from 'react'
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
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
}

interface DialogDescriptionProps {
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ className, children, ...props }: DialogContentProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto',
        className
      )}
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

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-lg font-semibold text-gray-900">
      {children}
    </h2>
  )
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-gray-600">
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
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
