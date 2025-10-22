import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { categoriesApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import type { Category } from '@/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional(),
  icon: z.string().optional(),
})

type CategoryForm = z.infer<typeof categorySchema>

const categoryTypes = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
]

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
]

const icons = [
  '🍔', '🚗', '🏠', '⚡', '📱', '👕', '💊', '🎬',
  '✈️', '🎓', '💼', '💰', '🎁', '🏥', '🛒', '🍕'
]

export default function CategoriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCreateOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsEditOpen(false)
      setEditingCategory(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'EXPENSE',
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setValue('name', category.name)
    setValue('type', category.type)
    setValue('color', category.color || colors[0])
    setValue('icon', category.icon || icons[0])
    setIsEditOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCreate = () => {
    reset()
    setIsCreateOpen(true)
  }

  const incomeCategories = categories.filter(c => c.type === 'INCOME')
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Organize suas receitas e despesas por categoria</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Organize suas receitas e despesas por categoria</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma categoria cadastrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Crie categorias para organizar melhor suas receitas e despesas
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Income Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Categorias de Receita ({incomeCategories.length})
            </h2>
            {incomeCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhuma categoria de receita cadastrada
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomeCategories.map((category) => (
                  <Card key={category.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || colors[0] }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Receita
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Categorias de Despesa ({expenseCategories.length})
            </h2>
            {expenseCategories.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhuma categoria de despesa cadastrada
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((category) => (
                  <Card key={category.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{category.icon}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || colors[0] }}
                          />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Despesa
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogClose onClose={() => setIsCreateOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome da categoria"
              placeholder="Ex: Alimentação"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Tipo"
              options={categoryTypes}
              {...register('type')}
              error={errors.type?.message}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ícone
              </label>
              <div className="grid grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 text-lg flex items-center justify-center ${
                      selectedIcon === icon ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    onClick={() => setValue('icon', icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cor
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
                {createMutation.isPending ? 'Criando...' : 'Criar Categoria'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogClose onClose={() => setIsEditOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome da categoria"
              placeholder="Ex: Alimentação"
              {...register('name')}
              error={errors.name?.message}
            />

            <Select
              label="Tipo"
              options={categoryTypes}
              {...register('type')}
              error={errors.type?.message}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ícone
              </label>
              <div className="grid grid-cols-8 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 text-lg flex items-center justify-center ${
                      selectedIcon === icon ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    onClick={() => setValue('icon', icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cor
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
