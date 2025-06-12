import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSymbolsSearch } from './use-symbols-search'

const mockBinanceResponse = {
  symbols: [
    {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      status: 'TRADING'
    },
    {
      symbol: 'ETHUSDT',
      baseAsset: 'ETH',
      quoteAsset: 'USDT',
      status: 'TRADING'
    },
    {
      symbol: 'BTCEUR',
      baseAsset: 'BTC',
      quoteAsset: 'EUR',
      status: 'TRADING'
    },
    {
      symbol: 'ADAUSDT',
      baseAsset: 'ADA',
      quoteAsset: 'USDT',
      status: 'BREAK' // Status não é TRADING
    }
  ]
}

describe('useSymbolsSearch', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  it('deve retornar array vazio quando searchTerm está vazio', () => {
    const { result } = renderHook(() => useSymbolsSearch(''), { wrapper })
    
    expect(result.current.data).toBeUndefined()
    expect(result.current.isFetching).toBe(false)
  })

  it('deve retornar array vazio quando searchTerm tem menos de 2 caracteres', () => {
    const { result } = renderHook(() => useSymbolsSearch('B'), { wrapper })
    
    expect(result.current.data).toBeUndefined()
    expect(result.current.isFetching).toBe(false)
  })

  it('deve buscar símbolos quando searchTerm é válido', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockBinanceResponse,
    })

    const { result } = renderHook(() => useSymbolsSearch('BTC'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'BTCEUR', baseAsset: 'BTC', quoteAsset: 'EUR' }
    ])
  })

  it('deve filtrar apenas símbolos com status TRADING', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockBinanceResponse,
    })

    const { result } = renderHook(() => useSymbolsSearch('USDT'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // ADAUSDT não deve aparecer pois status é BREAK
    expect(result.current.data).toEqual([
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' }
    ])
  })

  it('deve lidar com erro de rede', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSymbolsSearch('BTC'), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('deve fazer busca case-insensitive', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockBinanceResponse,
    })

    const { result } = renderHook(() => useSymbolsSearch('btc'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
      { symbol: 'BTCEUR', baseAsset: 'BTC', quoteAsset: 'EUR' }
    ])
  })

  it('deve limitar resultados a 50 itens', async () => {
    const manySymbols = Array.from({ length: 100 }, (_, i) => ({
      symbol: `BTC${i}USDT`,
      baseAsset: `BTC${i}`,
      quoteAsset: 'USDT',
      status: 'TRADING'
    }))

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ symbols: manySymbols }),
    })

    const { result } = renderHook(() => useSymbolsSearch('BTC'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(50)
  })

  it('deve usar cache para requisições repetidas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBinanceResponse,
    })

    // Primeira requisição
    const { result: result1 } = renderHook(() => useSymbolsSearch('BTC'), { wrapper })
    
    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true)
    })

    // Segunda requisição com o mesmo termo
    const { result: result2 } = renderHook(() => useSymbolsSearch('BTC'), { wrapper })
    
    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true)
    })

    // Fetch deve ter sido chamado apenas uma vez devido ao cache
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('deve chamar API com URL correta', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockBinanceResponse,
    })

    renderHook(() => useSymbolsSearch('BTC'), { wrapper })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://api.binance.com/api/v3/exchangeInfo')
    })
  })
}) 