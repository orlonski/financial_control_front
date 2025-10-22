import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { accountsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Wallet } from 'lucide-react'
import type { Account } from '@/types'

const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT']),
  initialBalance: z.number().default(0),
  color: z.string().optional(),
})

type AccountForm = z.infer<typeof accountSchema>

const accountTypes = [
  { value: 'CHECKING', label: 'Conta Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'INVESTMENT', label: 'Investimento' },
]

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
]

export default function AccountsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts-with-balances'],
    queryFn: accountsApi.getAllWithBalances,
  })

  const createMutation = useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      setIsCreateOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      accountsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
      setIsEditOpen(false)
      setEditingAccount(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-with-balances'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: 'CHECKING',
      initialBalance: 0,
    },
  })

  const selectedColor = watch('color')

  const onSubmit = (data: AccountForm) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setValue('name', account.name)
    setValue('type', account.type)
    setValue('initialBalance', Number(account.initialBalance))
    setValue('color', account.color || colors[0])
    setIsEditOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setIsCreateOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-600">Gerencie suas contas bancárias</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-600">Gerencie suas contas bancárias</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Comece criando sua primeira conta para organizar suas finanças
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: account.color || colors[0] }}
                    />
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="capitalize">
                  {accountTypes.find(t => t.value === account.type)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {account.balance.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <p className="text-sm text-gray-600">
                  Saldo atual
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
            <DialogClose onClose={() => setIsCreateOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome da conta"
              placeholder="Ex: Conta Corrente Banco X"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Tipo de conta"
              options={accountTypes}
              {...register('type')}
              error={errors.type?.message}
            />

            <Input
              label="Saldo inicial"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('initialBalance', { valueAsNumber: true })}
              error={errors.initialBalance?.message}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cor da conta
              </label>
              <div className="flex space-x-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogClose onClose={() => setIsEditOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome da conta"
              placeholder="Ex: Conta Corrente Banco X"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Tipo de conta"
              options={accountTypes}
              {...register('type')}
              error={errors.type?.message}
            />

            <Input
              label="Saldo inicial"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('initialBalance', { valueAsNumber: true })}
              error={errors.initialBalance?.message}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cor da conta
              </label>
              <div className="flex space-x-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
