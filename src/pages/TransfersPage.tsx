import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { transfersApi, accountsApi } from '@/services/api'
import { invalidateTransactionRelated } from '@/lib/queryInvalidation'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, ArrowLeftRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Transfer } from '@/types'

const transferSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
  fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
  toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: 'Conta de origem e destino devem ser diferentes',
  path: ['toAccountId'],
})

type TransferForm = z.infer<typeof transferSchema>

export default function TransfersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const { data: transfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: transfersApi.getAll,
  })

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  const handleRefresh = async () => {
    invalidateTransactionRelated(queryClient)
  }

  const createMutation = useMutation({
    mutationFn: transfersApi.create,
    onSuccess: () => {
      invalidateTransactionRelated(queryClient)
      setIsCreateOpen(false)
      reset()
      success('Transferência criada com sucesso!')
    },
    onError: () => {
      showError('Erro ao criar transferência')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransferForm> }) =>
      transfersApi.update(id, data),
    onSuccess: () => {
      invalidateTransactionRelated(queryClient)
      setIsEditOpen(false)
      setEditingTransfer(null)
      reset()
      success('Transferência atualizada com sucesso!')
    },
    onError: () => {
      showError('Erro ao atualizar transferência')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: transfersApi.delete,
    onSuccess: () => {
      invalidateTransactionRelated(queryClient)
      success('Transferência excluída com sucesso!')
    },
    onError: () => {
      showError('Erro ao excluir transferência')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedFromAccountId = watch('fromAccountId')

  const onSubmit = (data: TransferForm) => {
    if (editingTransfer) {
      updateMutation.mutate({ id: editingTransfer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer)
    setValue('amount', transfer.amount)
    setValue('date', transfer.date.split('T')[0])
    setValue('description', transfer.description || '')
    setValue('fromAccountId', transfer.fromAccountId)
    setValue('toAccountId', transfer.toAccountId)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Transferência',
      description: 'Tem certeza que deseja excluir esta transferência? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'danger',
    })

    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setIsCreateOpen(true)
  }

  const isLoading = transfersLoading || accountsLoading

  // Filter destination accounts (exclude selected from account)
  const destinationAccounts = accounts.filter(account => account.id !== selectedFromAccountId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transferências</h1>
          <p className="text-gray-600">Transfira dinheiro entre suas contas</p>
        </div>
        <div className="space-y-4">
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
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {ConfirmDialog}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transferências</h1>
          <p className="text-gray-600">Transfira dinheiro entre suas contas</p>
        </div>
        <Button onClick={handleCreate} disabled={accounts.length < 2}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nova Transferência</span>
        </Button>
      </div>

      {accounts.length < 2 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Contas insuficientes
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Você precisa ter pelo menos 2 contas para fazer transferências
            </p>
            <Button onClick={() => window.location.href = '/accounts'}>
              Criar Conta
            </Button>
          </CardContent>
        </Card>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma transferência cadastrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Comece transferindo dinheiro entre suas contas
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Primeira Transferência
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ArrowLeftRight className="h-5 w-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-lg">
                        {transfer.fromAccount.name} → {transfer.toAccount.name}
                      </CardTitle>
                      <CardDescription>
                        {transfer.description || 'Transferência entre contas'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(transfer.amount)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(transfer.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transfer)}
                        aria-label="Editar transferência"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transfer.id)}
                        aria-label="Excluir transferência"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transferência</DialogTitle>
            <DialogClose onClose={() => setIsCreateOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <Input
              label="Data"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Select
              label="Conta de origem"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('fromAccountId')}
              error={errors.fromAccountId?.message}
            />

            <Select
              label="Conta de destino"
              options={destinationAccounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('toAccountId')}
              error={errors.toAccountId?.message}
            />

            <Textarea
              label="Descrição (opcional)"
              placeholder="Ex: Transferência para poupança"
              {...register('description')}
              error={errors.description?.message}
            />

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
                {createMutation.isPending ? 'Criando...' : 'Criar Transferência'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transferência</DialogTitle>
            <DialogClose onClose={() => setIsEditOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />

            <Input
              label="Data"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Select
              label="Conta de origem"
              options={accounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('fromAccountId')}
              error={errors.fromAccountId?.message}
            />

            <Select
              label="Conta de destino"
              options={destinationAccounts.map(account => ({
                value: account.id,
                label: account.name
              }))}
              {...register('toAccountId')}
              error={errors.toAccountId?.message}
            />

            <Textarea
              label="Descrição (opcional)"
              placeholder="Ex: Transferência para poupança"
              {...register('description')}
              error={errors.description?.message}
            />

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
    </PullToRefresh>
  )
}
