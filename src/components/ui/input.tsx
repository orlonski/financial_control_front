import React, { useId, useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface SearchableSelectProps {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  ({ label, error, options, value, onChange, placeholder = 'Selecione...', disabled, className }, _ref) => {
    const generatedId = useId()
    const errorId = `${generatedId}-error`
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    const filteredOptions = React.useMemo(() => {
      if (!search) return options
      return options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    }, [options, search])

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearch('')
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      setIsOpen(false)
      setSearch('')
      // Return focus to trigger after selection
      triggerRef.current?.focus()
    }

    const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        if (!isOpen) {
          setSearch('')
        }
      } else if (e.key === 'ArrowDown' && !isOpen) {
        e.preventDefault()
        setIsOpen(true)
        setSearch('')
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearch('')
        triggerRef.current?.focus()
      }
    }, [isOpen])

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        // Focus first option
        const firstOption = containerRef.current?.querySelector('[role="option"]') as HTMLElement | null
        firstOption?.focus()
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
        triggerRef.current?.focus()
      }
    }, [])

    return (
      <div className="space-y-2" ref={containerRef}>
        {label && (
          <label id={`${generatedId}-label`} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {/* The trigger — a real <button> so it gets focus and Tab works */}
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${generatedId}-label` : undefined}
            aria-controls={`${generatedId}-listbox`}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen)
                if (!isOpen) setSearch('')
              }
            }}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              error && 'border-red-500',
              disabled && 'cursor-not-allowed opacity-50',
              className
            )}
          >
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption?.label || placeholder}
            </span>
            <svg
              className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {isOpen && (
            <div
              className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
              role="listbox"
              id={`${generatedId}-listbox`}
              aria-labelledby={label ? `${generatedId}-label` : undefined}
            >
              {/* Search input inside the listbox */}
              <div className="border-b border-gray-100 p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  role="searchbox"
                  aria-label="Buscar"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="max-h-60 overflow-y-auto p-1">
                {filteredOptions.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">Nenhuma opção encontrada</p>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={option.value === value}
                      tabIndex={0}
                      onClick={() => handleSelect(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelect(option.value)
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          const options = containerRef.current?.querySelectorAll('[role="option"]')
                          const currentIndex = Array.from(options ?? []).indexOf(e.currentTarget as HTMLElement)
                          const next = options?.[currentIndex + 1] as HTMLElement | undefined
                          next?.focus()
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          const options = containerRef.current?.querySelectorAll('[role="option"]')
                          const currentIndex = Array.from(options ?? []).indexOf(e.currentTarget as HTMLElement)
                          const prev = options?.[currentIndex - 1] as HTMLElement | undefined
                          if (currentIndex === 0) {
                            searchInputRef.current?.focus()
                          } else {
                            prev?.focus()
                          }
                        } else if (e.key === 'Escape') {
                          setIsOpen(false)
                          setSearch('')
                          triggerRef.current?.focus()
                        }
                      }}
                      className={cn(
                        'flex cursor-pointer items-center rounded px-3 py-2 text-sm',
                        option.value === value
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      {option.label}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

SearchableSelect.displayName = 'SearchableSelect'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
