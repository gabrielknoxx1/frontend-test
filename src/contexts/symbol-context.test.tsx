import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ReactNode } from 'react'
import { SymbolProvider, useSymbolContext, type SymbolList } from './symbol-context'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SymbolProvider>{children}</SymbolProvider>
)

describe('SymbolContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('deve inicializar com lista padrão quando localStorage está vazio', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    expect(result.current.symbolLists).toHaveLength(1)
    expect(result.current.symbolLists[0]).toEqual({
      id: 'default',
      name: 'Default',
      symbols: []
    })
    expect(result.current.activeListId).toBe('default')
  })

  it('deve carregar listas do localStorage quando disponível', () => {
    const savedLists: SymbolList[] = [
      { id: '1', name: 'My List', symbols: ['BTCUSDT', 'ETHUSDT'] },
      { id: '2', name: 'Another List', symbols: ['ADAUSDT'] }
    ]
    
    localStorage.setItem('symbol-lists', JSON.stringify(savedLists))
    localStorage.setItem('active-list-id', '1')
    
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    expect(result.current.symbolLists).toEqual(savedLists)
    expect(result.current.activeListId).toBe('1')
  })

  it('deve gerenciar símbolos disponíveis corretamente', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    const newSymbols = [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' }
    ]
    
    act(() => {
      result.current.setAvailableSymbols(newSymbols)
    })
    
    expect(result.current.availableSymbols).toEqual(newSymbols)
  })

  it('deve gerenciar símbolos selecionados corretamente', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.setSelectedSymbols(['BTCUSDT', 'ETHUSDT'])
    })
    
    expect(result.current.selectedSymbols).toEqual(['BTCUSDT', 'ETHUSDT'])
  })

  it('deve gerenciar preços de símbolos corretamente', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    const newPrices = {
      BTCUSDT: {
        symbol: 'BTCUSDT',
        lastPrice: '50000.00',
        bidPrice: '49999.00',
        askPrice: '50001.00',
        priceChange: '1000.00',
        priceChangePercent: '2.04'
      }
    }
    
    act(() => {
      result.current.setSymbolPrices(newPrices)
    })
    
    expect(result.current.symbolPrices).toEqual(newPrices)
  })

  it('deve adicionar nova lista corretamente', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addNewList('Minha Nova Lista')
    })
    
    expect(result.current.symbolLists).toHaveLength(2)
    const newList = result.current.symbolLists[1]
    expect(newList.name).toBe('Minha Nova Lista')
    expect(newList.symbols).toEqual([])
    expect(result.current.activeListId).toBe(newList.id)
  })

  it('deve adicionar símbolos à lista ativa', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addSymbolsToActiveList(['BTCUSDT', 'ETHUSDT'])
    })
    
    const activeList = result.current.symbolLists.find(
      list => list.id === result.current.activeListId
    )
    expect(activeList?.symbols).toEqual(['BTCUSDT', 'ETHUSDT'])
  })

  it('deve remover símbolos duplicados ao adicionar', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addSymbolsToActiveList(['BTCUSDT', 'ETHUSDT'])
    })
    
    act(() => {
      result.current.addSymbolsToActiveList(['BTCUSDT', 'ADAUSDT'])
    })
    
    const activeList = result.current.symbolLists.find(
      list => list.id === result.current.activeListId
    )
    expect(activeList?.symbols).toEqual(['BTCUSDT', 'ETHUSDT', 'ADAUSDT'])
  })

  it('deve remover símbolo da lista ativa', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addSymbolsToActiveList(['BTCUSDT', 'ETHUSDT', 'ADAUSDT'])
    })
    
    act(() => {
      result.current.removeSymbolFromActiveList('ETHUSDT')
    })
    
    const activeList = result.current.symbolLists.find(
      list => list.id === result.current.activeListId
    )
    expect(activeList?.symbols).toEqual(['BTCUSDT', 'ADAUSDT'])
  })

  it('deve alterar lista ativa corretamente', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addNewList('Segunda Lista')
    })
    
    const secondListId = result.current.symbolLists[1].id
    
    act(() => {
      result.current.setActiveListId('default')
    })
    
    expect(result.current.activeListId).toBe('default')
  })

  it('deve salvar no localStorage ao modificar listas', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addNewList('Test List')
    })
    
    const savedLists = JSON.parse(localStorage.getItem('symbol-lists') || '[]')
    expect(savedLists).toHaveLength(2)
    expect(savedLists[1].name).toBe('Test List')
  })

  it('deve salvar activeListId no localStorage', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.addNewList('New List')
    })
    
    const newListId = result.current.symbolLists[1].id
    expect(localStorage.getItem('active-list-id')).toBe(newListId)
  })

  it('deve limpar símbolos selecionados após adicionar à lista', () => {
    const { result } = renderHook(() => useSymbolContext(), { wrapper })
    
    act(() => {
      result.current.setSelectedSymbols(['BTCUSDT', 'ETHUSDT'])
    })
    
    expect(result.current.selectedSymbols).toEqual(['BTCUSDT', 'ETHUSDT'])
    
    act(() => {
      result.current.addSymbolsToActiveList(['BTCUSDT', 'ETHUSDT'])
    })
    
    expect(result.current.selectedSymbols).toEqual([])
  })

  it('deve lançar erro quando usado fora do Provider', () => {
    expect(() => {
      renderHook(() => useSymbolContext())
    }).toThrow('useSymbolContext must be used within a SymbolProvider')
  })
}) 