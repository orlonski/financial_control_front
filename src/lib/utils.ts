import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | undefined | null): string {
  // Handle null, undefined, or empty values
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00'
  }

  // Convert to number (handles both number and string inputs)
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  // Check if conversion was successful
  if (isNaN(numValue)) {
    return 'R$ 0,00'
  }

  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
