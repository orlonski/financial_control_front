// Paleta de cores para seleção em contas, categorias, etc.

export const SELECTABLE_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
  '#14B8A6', // teal
  '#A855F7', // purple
  '#F43F5E', // rose
  '#22C55E', // emerald
  '#0EA5E9', // sky
  '#EAB308', // yellow
] as const

export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const

export type SelectableColor = typeof SELECTABLE_COLORS[number]

// Ícones para categorias
export const CATEGORY_ICONS = [
  '🍔', '🚗', '🏠', '⚡', '📱', '👕', '💊', '🎬',
  '✈️', '🎓', '💼', '💰', '🎁', '🏥', '🛒', '🍕'
] as const

export type CategoryIcon = typeof CATEGORY_ICONS[number]
