// Constantes de data reutilizáveis em todo o projeto

export const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const

export const MONTH_NAMES = MONTHS.map(m => m.label)

export function getYearsRange(range: number = 5): number[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: range }, (_, i) => currentYear - Math.floor(range / 2) + i)
}

export function getMonthName(month: number): string {
  return MONTHS[month - 1]?.label || ''
}
