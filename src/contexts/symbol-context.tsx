import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Symbol {
  symbol: string
  baseAsset: string
  quoteAsset: string
}

export interface SymbolPrice {
  symbol: string
  lastPrice: string
  bidPrice: string
  askPrice: string
  priceChange: string
  priceChangePercent: string
}

export interface SymbolList {
  id: string
  name: string
  symbols: string[]
}

interface SymbolContextValue {
  // Available symbols from search
  availableSymbols: Symbol[]
  setAvailableSymbols: (symbols: Symbol[]) => void
  
  // Selected symbols in sidebar
  selectedSymbols: string[]
  setSelectedSymbols: (symbols: string[]) => void
  
  // Symbol prices from websocket
  symbolPrices: Record<string, SymbolPrice>
  setSymbolPrices: (prices: Record<string, SymbolPrice> | ((prev: Record<string, SymbolPrice>) => Record<string, SymbolPrice>)) => void
  
  // Symbol lists
  symbolLists: SymbolList[]
  setSymbolLists: (lists: SymbolList[]) => void
  
  // Current active list
  activeListId: string | null
  setActiveListId: (listId: string | null) => void
  
  // Add symbols to active list
  addSymbolsToActiveList: (symbols: string[]) => void
  
  // Add new list
  addNewList: (name: string) => void
}

const SymbolContext = createContext<SymbolContextValue | undefined>(undefined)

interface SymbolProviderProps {
  children: ReactNode
}

export function SymbolProvider({ children }: SymbolProviderProps) {
  const [availableSymbols, setAvailableSymbols] = useState<Symbol[]>([])
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [symbolPrices, setSymbolPrices] = useState<Record<string, SymbolPrice>>({})
  const [symbolLists, setSymbolLists] = useState<SymbolList[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('symbol-lists')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure we have at least one list and it's an array
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (error) {
        console.error('Error parsing saved symbol lists:', error)
      }
    }
    // Default list - empty but ensures select is not empty
    return [{ id: 'default', name: 'Default', symbols: [] }]
  })
  const [activeListId, setActiveListId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active-list-id')
    return saved || 'default'
  })

  // Ensure we always have at least the Default list
  useEffect(() => {
    if (symbolLists.length === 0) {
      const defaultList = [{ id: 'default', name: 'Default', symbols: [] }]
      setSymbolLists(defaultList)
      localStorage.setItem('symbol-lists', JSON.stringify(defaultList))
      setActiveListId('default')
      localStorage.setItem('active-list-id', 'default')
    }
  }, [symbolLists.length])

  const addSymbolsToActiveList = (symbols: string[]) => {
    if (!activeListId) return
    
    setSymbolLists(prev => {
      const newLists = prev.map(list => {
        if (list.id === activeListId) {
          const uniqueSymbols = [...new Set([...list.symbols, ...symbols])]
          return { ...list, symbols: uniqueSymbols }
        }
        return list
      })
      
      // Save to localStorage
      localStorage.setItem('symbol-lists', JSON.stringify(newLists))
      return newLists
    })
    
    // Clear selected symbols after adding
    setSelectedSymbols([])
  }

  const addNewList = (name: string) => {
    const newList: SymbolList = {
      id: Date.now().toString(),
      name,
      symbols: []
    }
    
    setSymbolLists(prev => {
      const newLists = [...prev, newList]
      localStorage.setItem('symbol-lists', JSON.stringify(newLists))
      return newLists
    })
    
    setActiveListId(newList.id)
    localStorage.setItem('active-list-id', newList.id)
  }

  const contextValue: SymbolContextValue = {
    availableSymbols,
    setAvailableSymbols,
    selectedSymbols,
    setSelectedSymbols,
    symbolPrices,
    setSymbolPrices,
    symbolLists,
    setSymbolLists,
    activeListId,
    setActiveListId: (listId) => {
      setActiveListId(listId)
      if (listId) {
        localStorage.setItem('active-list-id', listId)
      }
    },
    addSymbolsToActiveList,
    addNewList
  }

  return (
    <SymbolContext.Provider value={contextValue}>
      {children}
    </SymbolContext.Provider>
  )
}

export function useSymbolContext() {
  const context = useContext(SymbolContext)
  if (context === undefined) {
    throw new Error('useSymbolContext must be used within a SymbolProvider')
  }
  return context
} 