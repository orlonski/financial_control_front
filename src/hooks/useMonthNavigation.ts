import { useState, useCallback } from 'react'

interface UseMonthNavigationOptions {
  initialYear?: number
  initialMonth?: number
}

interface UseMonthNavigationReturn {
  selectedYear: number
  selectedMonth: number
  setSelectedYear: (year: number) => void
  setSelectedMonth: (month: number) => void
  navigateMonth: (direction: 'prev' | 'next') => void
  goToCurrentMonth: () => void
  isCurrentMonth: boolean
}

export function useMonthNavigation(options?: UseMonthNavigationOptions): UseMonthNavigationReturn {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [selectedYear, setSelectedYear] = useState(options?.initialYear ?? currentYear)
  const [selectedMonth, setSelectedMonth] = useState(options?.initialMonth ?? currentMonth)

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(prev => prev - 1)
      } else {
        setSelectedMonth(prev => prev - 1)
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(prev => prev + 1)
      } else {
        setSelectedMonth(prev => prev + 1)
      }
    }
  }, [selectedMonth])

  const goToCurrentMonth = useCallback(() => {
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)
  }, [currentYear, currentMonth])

  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth

  return {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    navigateMonth,
    goToCurrentMonth,
    isCurrentMonth,
  }
}
