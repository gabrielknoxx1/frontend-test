import { useEffect, useRef } from "react"
import { useSymbolContext } from "@/contexts/symbol-context"

interface BinanceWebSocketMessage {
  stream: string
  data: {
    s: string // Symbol
    c: string // Close price (latest price)
    b: string // Best bid price
    a: string // Best ask price
    p: string // Price change
    P: string // Price change percent
  }
}

export function useWebSocketPrices() {
  const { symbolLists, activeListId, setSymbolPrices } = useSymbolContext()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connectWebSocket = (symbols: string[]) => {
    if (symbols.length === 0) return

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Build stream parameters for 24hr ticker
    const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@ticker`).join("/")
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
      }

      ws.onmessage = (event) => {
        try {
          const message: BinanceWebSocketMessage = JSON.parse(event.data)

          setSymbolPrices((prev) => ({
            ...prev,
            [message.data.s]: {
              symbol: message.data.s,
              lastPrice: Number.parseFloat(message.data.c).toFixed(4),
              bidPrice: Number.parseFloat(message.data.b).toFixed(4),
              askPrice: Number.parseFloat(message.data.a).toFixed(4),
              priceChange: message.data.p,
              priceChangePercent: Number.parseFloat(message.data.P).toFixed(2),
            },
          }))
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      ws.onclose = () => {
        console.log("WebSocket closed")
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (symbols.length > 0) {
            connectWebSocket(symbols)
          }
        }, 3000)
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
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
  }, [activeListId, symbolLists])

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
