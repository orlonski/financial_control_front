import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Plus, BarChart3, Wallet, FileText } from 'lucide-react'

interface NavItem {
  icon: React.ReactNode
  activeIcon: React.ReactNode
  label: string
  path: string
  isCenter?: boolean
}

const navItems: NavItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    activeIcon: <Home className="h-5 w-5 fill-current" />,
    label: 'Início',
    path: '/dashboard',
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    activeIcon: <Wallet className="h-5 w-5 fill-current" />,
    label: 'Contas',
    path: '/accounts',
  },
  {
    icon: <Plus className="h-6 w-6" />,
    activeIcon: <Plus className="h-6 w-6" />,
    label: 'Novo',
    path: '/transactions/new',
    isCenter: true,
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    activeIcon: <BarChart3 className="h-5 w-5 fill-current" />,
    label: 'Relatórios',
    path: '/reports',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    activeIcon: <FileText className="h-5 w-5 fill-current" />,
    label: 'Extrato',
    path: '/statement',
  },
]

export function BottomNavigationBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path

            if (item.isCenter) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="flex items-center justify-center -mt-5"
                  aria-label={item.label}
                >
                  <div className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-150">
                    {item.icon}
                  </div>
                </button>
              )
            }

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-2 px-1
                  transition-colors duration-150
                  ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="mb-1">
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="bg-white/95 h-safe-area-bottom" />
    </nav>
  )
}
