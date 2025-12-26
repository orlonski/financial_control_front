import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import type { Transaction, Account } from '@/types'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  accounts: Account[]
  onConfirm: (data: { paidAt: string; accountId: string }) => void
  isLoading?: boolean
}

export function PaymentModal({
  open,
  onOpenChange,
  transaction,
  accounts,
  onConfirm,
  isLoading = false
}: PaymentModalProps) {
  const [paidAt, setPaidAt] = useState('')
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    if (open && transaction) {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0]
      setPaidAt(today)
      // Default to transaction's current account
      setAccountId(transaction.accountId)
    }
  }, [open, transaction])

  const handleConfirm = () => {
    onConfirm({ paidAt, accountId })
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            Marcar <strong>{transaction.description}</strong> como pago
          </p>

          <div>
            <label htmlFor="paidAt" className="block text-sm font-medium text-gray-700 mb-1">
              Data do pagamento
            </label>
            <Input
              id="paidAt"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          <Select
            label="Conta"
            id="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name
            }))}
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading || !paidAt || !accountId}
            >
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
