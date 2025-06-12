import { useState, useEffect, useRef } from 'react'
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
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-between p-3 rounded-md transition-colors w-full text-left",
        "hover:bg-blue-50 hover:border-blue-200 border border-transparent",
        isSelected && "bg-blue-50 border-blue-200"
      )}
      onClick={() => onToggle(symbol)}
      aria-label={`Toggle symbol ${symbol}`}
    >
      <span className="text-sm font-medium text-gray-700">{symbol}</span>
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(symbol)}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
      />
    </button>
  )
}

interface SelectAllItemProps {
  isAllSelected: boolean
  onToggleAll: () => void
}

function SelectAllItem({ isAllSelected, onToggleAll }: SelectAllItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-between p-3 rounded-md transition-colors w-full text-left mb-2",
        "hover:bg-green-50 hover:border-green-200 border border-transparent",
        "bg-green-50 border-green-200 font-medium"
      )}
      onClick={onToggleAll}
      aria-label="Selecionar todos os símbolos"
    >
      <span className="text-sm font-medium text-green-700">Selecionar Todos</span>
      <Checkbox
        checked={isAllSelected}
        onCheckedChange={onToggleAll}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
      />
    </button>
  )
}

interface SearchBarProps {
  onClearSearch: React.MutableRefObject<(() => void) | null>
  onSearchValueChange: (value: string) => void
}

function SearchBar({ onClearSearch, onSearchValueChange }: SearchBarProps) {
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { setAvailableSymbols } = useSymbolContext()
  
  const { register, watch, reset } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: '' }
  })
  
  const searchValue = watch('search')
  
  // Notify parent of search value changes
  useEffect(() => {
    onSearchValueChange(searchValue)
  }, [searchValue, onSearchValueChange])
  
  // Expose clear function to parent
  useEffect(() => {
    onClearSearch.current = () => {
      reset({ search: '' })
      setDebouncedSearch('')
      setAvailableSymbols([])
    }
  }, [reset, setAvailableSymbols, onClearSearch])
  
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

interface SymbolsListProps {
  searchValue: string
}

function SymbolsList({ searchValue }: SymbolsListProps) {
  const { availableSymbols, selectedSymbols, setSelectedSymbols } = useSymbolContext()
  
  const handleToggleSymbol = (symbol: string) => {
    const newSymbols = selectedSymbols.includes(symbol) 
      ? selectedSymbols.filter((ticker: string) => ticker !== symbol)
      : [...selectedSymbols, symbol]
    setSelectedSymbols(newSymbols)
  }
  
  const handleToggleAll = () => {
    const availableSymbolNames = availableSymbols.map(symbol => symbol.symbol)
    const isAllSelected = availableSymbolNames.every(symbol => selectedSymbols.includes(symbol))
    
    if (isAllSelected) {
      // Deselect all available symbols
      const newSymbols = selectedSymbols.filter(symbol => 
        !availableSymbolNames.includes(symbol)
      )
      setSelectedSymbols(newSymbols)
    } else {
      // Select all available symbols
      const newSymbols = [...new Set([...selectedSymbols, ...availableSymbolNames])]
      setSelectedSymbols(newSymbols)
    }
  }
  
  // Não mostrar lista se não há texto no input
  if (searchValue.trim() === '') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Digite para pesquisar símbolos
      </div>
    )
  }
  
  if (availableSymbols.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Nenhum símbolo encontrado
      </div>
    )
  }
  
  const availableSymbolNames = availableSymbols.map(symbol => symbol.symbol)
  const isAllSelected = availableSymbolNames.length > 0 && 
    availableSymbolNames.every(symbol => selectedSymbols.includes(symbol))
  
  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      <SelectAllItem
        isAllSelected={isAllSelected}
        onToggleAll={handleToggleAll}
      />
      
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
  const clearSearchRef = useRef<(() => void) | null>(null)
  const [searchValue, setSearchValue] = useState('')
  
  const handleAddToList = () => {
    if (selectedSymbols.length > 0) {
      addSymbolsToActiveList(selectedSymbols)
      
      // Limpar o input de busca e a lista de símbolos disponíveis
      if (clearSearchRef.current) {
        clearSearchRef.current()
      }
      setSearchValue('')
    }
  }
  
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }
  
  return (
    <div className="w-full lg:w-80 bg-white lg:border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 shrink-0">
        <SearchBar onClearSearch={clearSearchRef} onSearchValueChange={handleSearchValueChange} />
      </div>
      
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <SymbolsList searchValue={searchValue} />
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