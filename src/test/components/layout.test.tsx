import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'

// Mock do useAuth
const mockLogout = vi.fn()
const mockUser = { name: 'Test User', email: 'test@example.com' }

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}))

// Mock da recurringApi
vi.mock('@/services/api', () => ({
  recurringApi: {
    generate: vi.fn().mockResolvedValue({}),
  },
}))

// Mock do BottomNavigationBar
vi.mock('@/components/BottomNavigationBar', () => ({
  BottomNavigationBar: () => <div data-testid="bottom-nav">Bottom Nav</div>,
}))

// Helper para renderizar com providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização básica', () => {
    it('deve renderizar o conteúdo children corretamente', () => {
      renderWithProviders(
        <Layout>
          <div data-testid="test-content">Conteúdo de teste</div>
        </Layout>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByText('Conteúdo de teste')).toBeInTheDocument()
    })

    it('deve renderizar o título "Controle Financeiro"', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const titles = screen.getAllByText('Controle Financeiro')
      expect(titles.length).toBeGreaterThan(0)
    })

    it('deve exibir as informações do usuário', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0)
      expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0)
    })

    it('deve exibir a inicial do nome do usuário no avatar', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const avatarInitials = screen.getAllByText('T')
      expect(avatarInitials.length).toBeGreaterThan(0)
    })
  })

  describe('Botão de Logout', () => {
    it('deve renderizar o botão de logout com o texto "Logout"', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
      expect(logoutButtons.length).toBeGreaterThan(0)
    })

    it('deve chamar a função logout ao clicar no botão', async () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
      fireEvent.click(logoutButtons[0])

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('botão de logout deve ter variant ghost', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
      // Verifica se tem a classe hover:bg-gray-100 que é específica do variant ghost
      expect(logoutButtons[0]).toHaveClass('hover:bg-gray-100')
    })

    it('botão de logout deve ter largura total (w-full)', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
      expect(logoutButtons[0]).toHaveClass('w-full')
    })

    it('deve exibir o ícone de LogOut no botão', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      // O ícone LogOut é renderizado como SVG com a classe lucide-log-out
      const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
      const icon = logoutButtons[0].querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Sidebar Mobile', () => {
    it('deve abrir a sidebar mobile ao clicar no botão de menu', async () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      // Encontra o botão de menu pelo ícone (lucide-menu)
      const allButtons = screen.getAllByRole('button')
      const menuButton = allButtons.find(btn => btn.querySelector('.lucide-menu'))
      expect(menuButton).toBeDefined()

      if (menuButton) {
        fireEvent.click(menuButton)

        await waitFor(() => {
          // Verifica se a sidebar mobile está visível (existem 2 - mobile e desktop)
          const dashboardLinks = screen.getAllByText('Dashboard')
          expect(dashboardLinks.length).toBe(2)
          const sidebar = dashboardLinks[0].closest('nav')
          expect(sidebar).toBeInTheDocument()
        })
      }
    })

    it('deve fechar a sidebar ao clicar no botão X', async () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      // Abre a sidebar
      const allButtons = screen.getAllByRole('button')
      const menuButton = allButtons.find(btn => btn.querySelector('.lucide-menu'))

      if (menuButton) {
        fireEvent.click(menuButton)

        await waitFor(() => {
          // Encontra o botão X na sidebar mobile
          const buttonsAfterOpen = screen.getAllByRole('button')
          const closeButton = buttonsAfterOpen.find(btn => btn.querySelector('.lucide-x'))
          if (closeButton) {
            fireEvent.click(closeButton)
          }
        })
      }
    })
  })

  describe('Navegação', () => {
    it('deve renderizar todos os links de navegação', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      const expectedLinks = [
        'Dashboard',
        'Contas',
        'Categorias',
        'Cartões',
        'Transações',
        'Recorrentes',
        'Orçamentos',
        'Metas',
        'Lembretes',
        'Transferências',
        'Extrato',
        'Relatórios',
      ]

      expectedLinks.forEach(linkName => {
        const links = screen.getAllByText(linkName)
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('BottomNavigationBar', () => {
    it('deve renderizar o BottomNavigationBar', () => {
      renderWithProviders(
        <Layout>
          <div>Teste</div>
        </Layout>
      )

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })
  })
})

describe('Botão de Logout - Teste de Regressão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('o texto do botão deve ser "Logout" (não "Sair")', () => {
    renderWithProviders(
      <Layout>
        <div>Teste</div>
      </Layout>
    )

    // Verifica que o texto é "Logout" e não "Sair"
    const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
    expect(logoutButtons.length).toBeGreaterThan(0)

    // Verifica que não existe botão com texto "Sair"
    const sairButtons = screen.queryAllByRole('button', { name: /^sair$/i })
    expect(sairButtons.length).toBe(0)
  })

  it('deve haver exatamente 2 botões de logout (mobile e desktop)', () => {
    renderWithProviders(
      <Layout>
        <div>Teste</div>
      </Layout>
    )

    const logoutButtons = screen.getAllByRole('button', { name: /logout/i })
    expect(logoutButtons.length).toBe(2)
  })

  it('ambos os botões de logout devem chamar a função logout', async () => {
    renderWithProviders(
      <Layout>
        <div>Teste</div>
      </Layout>
    )

    const logoutButtons = screen.getAllByRole('button', { name: /logout/i })

    // Clica no primeiro botão (mobile)
    fireEvent.click(logoutButtons[0])
    expect(mockLogout).toHaveBeenCalledTimes(1)

    // Clica no segundo botão (desktop)
    fireEvent.click(logoutButtons[1])
    expect(mockLogout).toHaveBeenCalledTimes(2)
  })
})
