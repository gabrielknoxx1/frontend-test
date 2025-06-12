import { useEffect, useRef } from "react"
import { useSymbolContext, type SymbolPrice } from "@/contexts/symbol-context"

interface BinanceWebSocketMessage {
  stream: string
  data: {
    e: string // Event type
    E: number // Event time
    s: string // Symbol
    p: string // Price change
    P: string // Price change percent
    w: string // Weighted average price
    x: string // First trade(F)-1 price (first trade before the 24hr rolling window)
    c: string // Last price
    Q: string // Last quantity
    b: string // Best bid price
    B: string // Best bid quantity
    a: string // Best ask price
    A: string // Best ask quantity
    o: string // Open price
    h: string // High price
    l: string // Low price
    v: string // Total traded base asset volume
    q: string // Total traded quote asset volume
    O: number // Statistics open time
    C: number // Statistics close time
    F: number // First trade ID
    L: number // Last trade Id
    n: number // Total number of trades
  }
}

export function useWebSocketPrices() {
  const { symbolLists, activeListId, setSymbolPrices } = useSymbolContext()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connectWebSocket = (symbols: string[]) => {
    if (symbols.length === 0) return

    // Verificar limite de streams (máximo 1024 conforme documentação)
    if (symbols.length > 1024) {
      console.error("Too many symbols. Maximum 1024 streams allowed per connection.")
      return
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Build stream parameters for combined streams
    // Format: symbol1@ticker/symbol2@ticker/symbol3@ticker
    const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@ticker`).join("/")
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`

    console.log("Connecting to WebSocket:", wsUrl)
    console.log("Symbols to monitor:", symbols)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("✅ WebSocket connected successfully")
        console.log("Connection state:", ws.readyState)
      }

      ws.onmessage = (event) => {
        try {
          console.log("📨 Raw message received:", event.data)
          const message: BinanceWebSocketMessage = JSON.parse(event.data)

          console.log("🔍 Parsed message:", {
            stream: message.stream,
            eventType: message.data?.e,
            symbol: message.data?.s,
          })

          // Verificar se é uma mensagem de ticker válida
          if (message.data && message.data.e === "24hrTicker") {
            console.log("📈 Processing ticker data for:", message.data.s, {
              lastPrice: message.data.c,
              priceChange: message.data.p,
              priceChangePercent: message.data.P,
            })

            setSymbolPrices((prev: Record<string, SymbolPrice>) => {
              const newPrices = {
                ...prev,
                [message.data.s]: {
                  symbol: message.data.s,
                  lastPrice: Number.parseFloat(message.data.c).toFixed(4),
                  bidPrice: Number.parseFloat(message.data.b).toFixed(4),
                  askPrice: Number.parseFloat(message.data.a).toFixed(4),
                  priceChange: message.data.p,
                  priceChangePercent: Number.parseFloat(message.data.P).toFixed(2),
                },
              }
              console.log("💾 Updated prices state:", newPrices)
              return newPrices
            })
          } else {
            console.log("⚠️ Received non-ticker message:", message)
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error)
          console.error("Raw data:", event.data)
        }
      }

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
      }

      ws.onclose = (event) => {
        console.log("🔌 WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })

        // Attempt to reconnect after 3 seconds if not a clean close
        if (!event.wasClean && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (symbols.length > 0) {
              console.log("🔄 Attempting to reconnect...")
              connectWebSocket(symbols)
            }
          }, 3000)
        }
      }

      // Ping/pong frames are handled automatically by the browser
    } catch (error) {
      console.error("❌ Error creating WebSocket:", error)
    }
  }

  useEffect(() => {
    if (!activeListId) return

    const activeList = symbolLists.find((list) => list.id === activeListId)
    if (!activeList || activeList.symbols.length === 0) {
      // Close connection if no symbols
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    connectWebSocket(activeList.symbols)

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [activeListId, symbolLists, setSymbolPrices])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])
}
