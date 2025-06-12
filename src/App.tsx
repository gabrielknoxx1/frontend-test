import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Layout } from '@/components/layout'
import { SymbolProvider } from '@/contexts/symbol-context'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SymbolProvider>
        <Layout />
        <ReactQueryDevtools initialIsOpen={false} />
      </SymbolProvider>
    </QueryClientProvider>
  )
}

