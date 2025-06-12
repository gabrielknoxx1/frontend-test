import { useQuery } from "@tanstack/react-query"
import type { Symbol as TradingSymbol } from "@/contexts/symbol-context"

interface BinanceSymbol {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbol[]
}

const fetchSymbols = async (searchTerm?: string): Promise<TradingSymbol[]> => {
  if (!searchTerm || searchTerm.length < 2) {
    return []
  }

  const response = await fetch("https://api.binance.com/api/v3/exchangeInfo")

  if (!response.ok) {
    throw new Error("Failed to fetch symbols")
  }

  const data: BinanceExchangeInfo = await response.json()

  // Filter symbols by search term and only active ones
  const filteredSymbols = data.symbols
    .filter(
      (symbol) =>
        symbol.status === "TRADING" &&
        symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 50) // Limit to 50 results
    .map((symbol) => ({
      symbol: symbol.symbol,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    }))

  return filteredSymbols
}

export function useSymbolsSearch(searchTerm?: string) {
  return useQuery({
    queryKey: ["symbols-search", searchTerm],
    queryFn: () => fetchSymbols(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
