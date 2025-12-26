import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { MONTHS, getYearsRange } from '@/constants/dateOptions'

interface FilterField {
  key: string
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

interface MonthFilterProps {
  selectedYear: number
  selectedMonth: number | ''
  onYearChange: (year: number) => void
  onMonthChange: (month: number | '') => void
  onNavigateMonth?: (direction: 'prev' | 'next') => void
  showAllMonthsOption?: boolean
  additionalFilters?: FilterField[]
  onClearFilters?: () => void
}

export function MonthFilter({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onNavigateMonth,
  showAllMonthsOption = false,
  additionalFilters = [],
  onClearFilters,
}: MonthFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const years = getYearsRange(5)

  // Count active filters (excluding month/year which are always set)
  const activeFilterCount = additionalFilters.filter(f => f.value !== '').length

  // Auto-collapse when a filter is applied
  useEffect(() => {
    if (activeFilterCount > 0 && isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 300)
      return () => clearTimeout(timer)
    }
  }, [additionalFilters.map(f => f.value).join(',')])

  const handleNavigateMonth = (direction: 'prev' | 'next') => {
    if (onNavigateMonth) {
      onNavigateMonth(direction)
    } else {
      // Default navigation logic
      if (direction === 'prev') {
        if (selectedMonth === 1 || selectedMonth === '') {
          onMonthChange(12)
          onYearChange(selectedYear - 1)
        } else {
          onMonthChange((selectedMonth as number) - 1)
        }
      } else {
        if (selectedMonth === 12) {
          onMonthChange(1)
          onYearChange(selectedYear + 1)
        } else if (selectedMonth === '') {
          onMonthChange(1)
        } else {
          onMonthChange((selectedMonth as number) + 1)
        }
      }
    }
  }

  const displayMonth = selectedMonth === ''
    ? 'Todos os meses'
    : MONTHS[(selectedMonth as number) - 1]?.label

  return (
    <Card>
      <CardContent className="p-3">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => handleNavigateMonth('prev')}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 text-center min-w-0">
            <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
              {displayMonth} de {selectedYear}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => handleNavigateMonth('next')}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant={isExpanded ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0 ml-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>

        {/* Expandable filters */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Select
              label="Mês"
              options={[
                ...(showAllMonthsOption ? [{ value: '', label: 'Todos' }] : []),
                ...MONTHS.map(month => ({
                  value: month.value.toString(),
                  label: month.label
                }))
              ]}
              value={selectedMonth.toString()}
              onChange={(e) => onMonthChange(e.target.value === '' ? '' : parseInt(e.target.value))}
            />
            <Select
              label="Ano"
              options={years.map(year => ({
                value: year.toString(),
                label: year.toString()
              }))}
              value={selectedYear.toString()}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
            />
            {additionalFilters.map((filter) => (
              <Select
                key={filter.key}
                label={filter.label}
                options={filter.options}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                disabled={filter.disabled}
              />
            ))}
          </div>

          {onClearFilters && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearFilters()
                  setIsExpanded(false)
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
