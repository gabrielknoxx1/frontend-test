import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SymbolProvider } from '@/contexts/symbol-context'
import { Dashboard } from './dashboard'

const mockBinanceSymbols = {
  symbols: [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING' }
  ]
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SymbolProvider>
        {children}
      </SymbolProvider>
    </QueryClientProvider>
  )
}

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock fetch para busca de símbolos
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBinanceSymbols,
    })
  })

  it('deve permitir criar uma nova lista e adicionar símbolos', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Verificar se a lista padrão existe
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument()

    // Clicar no botão para adicionar nova lista
    const addListButton = screen.getByRole('button', { name: /plus/i })
    await user.click(addListButton)

    // Verificar se o modal abriu
    expect(screen.getByText('Add new list')).toBeInTheDocument()

    // Preencher o nome da lista
    const nameInput = screen.getByPlaceholderText('Digite o nome da lista')
    await user.type(nameInput, 'Minha Lista de Cripto')

    // Submeter o formulário
    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    // Verificar se a nova lista foi criada e selecionada
    await waitFor(() => {
      expect(screen.getByDisplayValue('Minha Lista de Cripto')).toBeInTheDocument()
    })

    // Verificar se o modal fechou
    expect(screen.queryByText('Add new list')).not.toBeInTheDocument()
  })

  it('deve permitir buscar e adicionar símbolos à lista ativa', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Buscar por símbolos
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'BTC')

    // Aguardar os resultados da busca
    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument()
    })

    // Selecionar símbolos
    const btcCheckbox = screen.getByRole('checkbox', { name: /BTCUSDT/i })
    await user.click(btcCheckbox)

    expect(btcCheckbox).toBeChecked()

    // Adicionar símbolos selecionados à lista
    const addSymbolsButton = screen.getByRole('button', { name: /add selected/i })
    await user.click(addSymbolsButton)

    // Verificar se o símbolo foi adicionado à tabela
    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument()
    })

    // Verificar se o checkbox foi desmarcado após adicionar
    expect(btcCheckbox).not.toBeChecked()
  })

  it('deve permitir remover símbolos da lista ativa', async () => {
    const user = userEvent.setup()
    
    // Preparar localStorage com uma lista que já tem símbolos
    const mockLists = [
      { id: 'test', name: 'Test List', symbols: ['BTCUSDT', 'ETHUSDT'] }
    ]
    localStorage.setItem('symbol-lists', JSON.stringify(mockLists))
    localStorage.setItem('active-list-id', 'test')
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Verificar se os símbolos estão na tabela
    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument()
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument()
    })

    // Encontrar e clicar no botão de remover do BTCUSDT
    const removeButtons = screen.getAllByRole('button', { name: /trash/i })
    await user.click(removeButtons[0])

    // Verificar se apenas um símbolo foi removido
    await waitFor(() => {
      expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument()
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument()
    })
  })

  it('deve alternar entre diferentes listas', async () => {
    const user = userEvent.setup()
    
    // Preparar localStorage com múltiplas listas
    const mockLists = [
      { id: 'list1', name: 'Lista 1', symbols: ['BTCUSDT'] },
      { id: 'list2', name: 'Lista 2', symbols: ['ETHUSDT', 'ADAUSDT'] }
    ]
    localStorage.setItem('symbol-lists', JSON.stringify(mockLists))
    localStorage.setItem('active-list-id', 'list1')
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Verificar se Lista 1 está ativa e mostra BTCUSDT
    expect(screen.getByDisplayValue('Lista 1')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument()
    })

    // Alterar para Lista 2
    const select = screen.getByRole('combobox')
    await user.click(select)
    
    const lista2Option = screen.getByText('Lista 2')
    await user.click(lista2Option)

    // Verificar se mudou para Lista 2 e mostra os símbolos corretos
    await waitFor(() => {
      expect(screen.getByDisplayValue('Lista 2')).toBeInTheDocument()
      expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument()
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument()
      expect(screen.getByText('ADAUSDT')).toBeInTheDocument()
    })
  })

  it('deve validar o formulário de nova lista', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Abrir modal
    const addListButton = screen.getByRole('button', { name: /plus/i })
    await user.click(addListButton)

    // Tentar submeter sem nome
    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    // Verificar se a mensagem de erro aparece
    await waitFor(() => {
      expect(screen.getByText('Nome da lista é obrigatório')).toBeInTheDocument()
    })

    // Verificar se o modal ainda está aberto
    expect(screen.getByText('Add new list')).toBeInTheDocument()
  })

  it('deve persistir dados no localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Criar nova lista
    const addListButton = screen.getByRole('button', { name: /plus/i })
    await user.click(addListButton)

    const nameInput = screen.getByPlaceholderText('Digite o nome da lista')
    await user.type(nameInput, 'Lista Persistente')

    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    // Verificar se foi salvo no localStorage
    await waitFor(() => {
      const savedLists = JSON.parse(localStorage.getItem('symbol-lists') || '[]')
      expect(savedLists).toHaveLength(2)
      expect(savedLists[1].name).toBe('Lista Persistente')
      
      const activeListId = localStorage.getItem('active-list-id')
      expect(activeListId).toBe(savedLists[1].id)
    })
  })
}) 