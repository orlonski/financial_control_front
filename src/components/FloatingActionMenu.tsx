import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeftRight, FileText, X } from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  path: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Plus className="h-5 w-5" />,
    label: 'Nova Transação',
    path: '/transactions/new',
  },
  {
    icon: <ArrowLeftRight className="h-5 w-5" />,
    label: 'Transferência',
    path: '/transfers',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: 'Ver Extrato',
    path: '/statement',
  },
]

export function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleItemClick = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-fab-menu]')) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  return (
    <div className="fixed bottom-20 right-6 z-40" data-fab-menu>
      {/* Menu Items */}
      <div
        className={`
          absolute bottom-16 right-0 flex flex-col-reverse gap-3
          transition-all duration-200 ease-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.path}
            onClick={() => handleItemClick(item.path)}
            className={`
              flex items-center gap-3 bg-white text-gray-700 pl-4 pr-3 py-3 rounded-full shadow-lg
              hover:bg-gray-50 transition-all duration-200 whitespace-nowrap
              min-h-[48px]
              ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
            `}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
            aria-label={item.label}
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="bg-primary text-white p-2 rounded-full">
              {item.icon}
            </span>
          </button>
        ))}
      </div>

      {/* FAB Button */}
      <button
        onClick={handleToggle}
        className={`
          bg-primary text-white p-4 rounded-full shadow-lg
          hover:bg-primary/90 transition-all duration-200
          min-w-[56px] min-h-[56px] flex items-center justify-center
        `}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu de ações rápidas'}
        aria-expanded={isOpen}
      >
        <span
          className={`
            transition-transform duration-200
            ${isOpen ? 'rotate-45' : 'rotate-0'}
          `}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </span>
      </button>
    </div>
  )
}
