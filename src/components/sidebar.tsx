import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useSymbolsSearch } from '@/hooks/use-symbols-search'
import { useSymbolContext } from '@/contexts/symbol-context'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  search: z.string().min(0)
})

type SearchForm = z.infer<typeof searchSchema>

interface SymbolItemProps {
  symbol: string
  isSelected: boolean
  onToggle: (symbol: string) => void
}

function SymbolItem({ symbol, isSelected, onToggle }: SymbolItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(symbol)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
        "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
        isSelected && "bg-blue-50 border-blue-200"
      )}
      onClick={() => onToggle(symbol)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Toggle symbol ${symbol}`}
    >
      <span className="text-sm font-medium text-gray-700">{symbol}</span>
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(symbol)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function SearchBar() {
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { setAvailableSymbols } = useSymbolContext()
  
  const { register, watch } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: '' }
  })
  
  const searchValue = watch('search')
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchValue])
  
  const { data: symbols, isLoading } = useSymbolsSearch(debouncedSearch)
  
  useEffect(() => {
    if (symbols) {
      setAvailableSymbols(symbols)
    }
  }, [symbols, setAvailableSymbols])
  
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          {...register('search')}
          placeholder="search"
          className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

function SymbolsList() {
  const { availableSymbols, selectedSymbols, setSelectedSymbols } = useSymbolContext()
  
  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }
  
  if (availableSymbols.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Digite para pesquisar símbolos
      </div>
    )
  }
  
  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {availableSymbols.map((symbol) => (
        <SymbolItem
          key={symbol.symbol}
          symbol={symbol.symbol}
          isSelected={selectedSymbols.includes(symbol.symbol)}
          onToggle={handleToggleSymbol}
        />
      ))}
    </div>
  )
}

export function Sidebar() {
  const { selectedSymbols, addSymbolsToActiveList } = useSymbolContext()
  
  const handleAddToList = () => {
    if (selectedSymbols.length > 0) {
      addSymbolsToActiveList(selectedSymbols)
    }
  }
  
  return (
    <div className="w-full lg:w-80 bg-white lg:border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <SearchBar />
      </div>
      
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <SymbolsList />
      </div>
      
      <div className="p-4 border-t border-gray-200 shrink-0">
        <Button
          onClick={handleAddToList}
          disabled={selectedSymbols.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add to list
        </Button>
      </div>
    </div>
  )
} 