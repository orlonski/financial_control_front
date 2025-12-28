import { describe, it, expect } from 'vitest'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Testes para validar a correção do bug de timezone na formatação de datas.
 *
 * Issue #6: Datas como "2026-01-01" estavam sendo exibidas como "31 de dez"
 * porque new Date("2026-01-01") interpreta como UTC meia-noite, que no
 * fuso horário do Brasil (UTC-3) corresponde a 21:00 do dia anterior.
 *
 * A correção usa parseISO() do date-fns que trata a string como data local.
 */
describe('Date parsing timezone fix', () => {
  describe('parseISO vs new Date', () => {
    it('should parse "2026-01-01" as January 1st using parseISO', () => {
      const dateString = '2026-01-01'
      const parsed = parseISO(dateString)

      const formatted = format(parsed, "d 'de' MMM", { locale: ptBR })

      expect(formatted).toBe('1 de jan')
    })

    it('should parse "2026-01-01T00:00:00.000" as January 1st using parseISO', () => {
      const dateString = '2026-01-01T00:00:00.000'
      const parsed = parseISO(dateString)

      const formatted = format(parsed, "d 'de' MMM", { locale: ptBR })

      expect(formatted).toBe('1 de jan')
    })

    it('should parse dates at month boundaries correctly', () => {
      const testCases = [
        { input: '2026-01-01', expected: '1 de jan' },
        { input: '2026-02-01', expected: '1 de fev' },
        { input: '2026-03-01', expected: '1 de mar' },
        { input: '2026-12-31', expected: '31 de dez' },
      ]

      testCases.forEach(({ input, expected }) => {
        const parsed = parseISO(input)
        const formatted = format(parsed, "d 'de' MMM", { locale: ptBR })
        expect(formatted).toBe(expected)
      })
    })

    it('should handle ISO date strings with timezone info', () => {
      // parseISO correctly handles ISO strings
      const dateString = '2026-01-01T00:00:00.000Z'
      const parsed = parseISO(dateString)

      // The date should be parsed correctly regardless of timezone
      expect(parsed.getFullYear()).toBe(2026)
      expect(parsed.getMonth()).toBe(0) // January is 0
      expect(parsed.getDate()).toBe(1)
    })
  })

  describe('nextDueDate formatting simulation', () => {
    // Simula o formato de dados que vem da API
    const mockRecurrings = [
      { id: '1', description: 'Aluguel', nextDueDate: '2026-01-01' },
      { id: '2', description: 'Internet', nextDueDate: '2026-01-15' },
      { id: '3', description: 'Academia', nextDueDate: '2026-02-01' },
    ]

    it('should format nextDueDate correctly for recurring transactions', () => {
      mockRecurrings.forEach((recurring) => {
        const formatted = format(
          parseISO(recurring.nextDueDate),
          "d 'de' MMM",
          { locale: ptBR }
        )

        // Verifica que a data formatada corresponde ao dia correto
        const expectedDay = recurring.nextDueDate.split('-')[2]
        expect(formatted).toContain(expectedDay.replace(/^0/, ''))
      })
    })

    it('should correctly show January 1st as "1 de jan." not "31 de dez"', () => {
      const recurring = { nextDueDate: '2026-01-01' }

      const formatted = format(
        parseISO(recurring.nextDueDate),
        "d 'de' MMM",
        { locale: ptBR }
      )

      // Este é o bug que foi corrigido
      expect(formatted).not.toBe('31 de dez')
      expect(formatted).toBe('1 de jan')
    })
  })

  describe('edge cases', () => {
    it('should handle year boundary dates', () => {
      const testCases = [
        { input: '2025-12-31', day: 31 },
        { input: '2026-01-01', day: 1 },
      ]

      testCases.forEach(({ input, day }) => {
        const parsed = parseISO(input)
        expect(parsed.getDate()).toBe(day)
      })
    })

    it('should handle leap year dates', () => {
      // 2024 is a leap year
      const leapYearDate = '2024-02-29'
      const parsed = parseISO(leapYearDate)

      expect(parsed.getDate()).toBe(29)
      expect(parsed.getMonth()).toBe(1) // February
    })

    it('should handle end of month dates', () => {
      const testCases = [
        { input: '2026-01-31', expectedDay: 31 },
        { input: '2026-02-28', expectedDay: 28 },
        { input: '2026-04-30', expectedDay: 30 },
      ]

      testCases.forEach(({ input, expectedDay }) => {
        const parsed = parseISO(input)
        expect(parsed.getDate()).toBe(expectedDay)
      })
    })
  })
})
