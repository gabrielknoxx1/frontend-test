import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSymbolContext } from '@/contexts/symbol-context'
import { useWebSocketPrices } from '@/hooks/use-websocket-prices'

const newListSchema = z.object({
  name: z.string().min(1, 'Nome da lista é obrigatório')
})

type NewListForm = z.infer<typeof newListSchema>

function DashboardHeader() {
  const { symbolLists, activeListId, setActiveListId, addNewList } = useSymbolContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewListForm>({
    resolver: zodResolver(newListSchema),
    defaultValues: { name: '' }
  })

  const onSubmit = (data: NewListForm) => {
    addNewList(data.name)
    setIsModalOpen(false)
    reset()
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    reset()
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 lg:p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 lg:gap-4 w-full">
          <Select
            value={activeListId || ''}
            onValueChange={setActiveListId}
            defaultValue={activeListId || ''}
          >
            <SelectTrigger className="w-full lg:w-48 text-black">
              <SelectValue placeholder="Selecione uma lista" />
            </SelectTrigger>
            <SelectContent className="bg-gray-50">
              {symbolLists.map(list => (
                <SelectItem 
                  key={list.id} 
                  value={list.id} 
                  className="text-black cursor-pointer hover:border-b-2	 hover:border-white"
                >
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new list</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  List name
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  className="w-full"
                  placeholder="Digite o nome da lista"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SymbolsTable() {
  const { symbolLists, activeListId, symbolPrices } = useSymbolContext()
  
  // Connect to WebSocket for price updates
  useWebSocketPrices()

  // Função de teste para WebSocket
  const testWebSocket = () => {
    const testUrl = "wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker"
    const testWs = new WebSocket(testUrl)
    
    testWs.onopen = () => {
      // Test WebSocket connected
    }
    
    testWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        // Test message parsed successfully
      } catch (error) {
        console.error("❌ Test parse error:", error)
      }
    }
    
    testWs.onerror = (error) => {
      console.error("❌ Test WebSocket error:", error)
    }
    
    testWs.onclose = (event) => {
      // Test WebSocket closed
    }
    
    // Close after 10 seconds
    setTimeout(() => {
      testWs.close()
    }, 10000)
  }
  
  const activeList = symbolLists.find(list => list.id === activeListId)
  
  if (!activeList || activeList.symbols.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">Nenhum símbolo na lista</p>
          <p className="text-gray-400 text-sm mb-4">
            Adicione símbolos usando a barra lateral
          </p>
          <button
            type="button"
            onClick={testWebSocket}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🧪 Testar WebSocket
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="hidden md:block flex-1 overflow-auto p-4 lg:p-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ask Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price Change (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeList.symbols.map(symbol => {
              const priceData = symbolPrices[symbol]
              
              return (
                <tr key={symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priceData?.lastPrice || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priceData?.bidPrice || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priceData?.askPrice || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {priceData?.priceChangePercent ? (
                      <Badge 
                        variant="success"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {priceData.priceChangePercent}%
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards View */}
      <div className="block md:hidden flex-1 overflow-auto p-4 space-y-4">
        {activeList.symbols.map(symbol => {
          const priceData = symbolPrices[symbol]
          
          return (
            <div key={symbol} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{symbol}</h3>
                {priceData?.priceChangePercent && (
                  <Badge 
                    variant="success"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    {priceData.priceChangePercent}%
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Last Price:</span>
                  <p className="font-medium">{priceData?.lastPrice || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bid Price:</span>
                  <p className="font-medium">{priceData?.bidPrice || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ask Price:</span>
                  <p className="font-medium">{priceData?.askPrice || '-'}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-400 overflow-hidden">
      <DashboardHeader />
      <SymbolsTable />
    </div>
  )
} 