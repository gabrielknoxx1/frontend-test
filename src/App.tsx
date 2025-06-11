import { useState } from "react"
import viteLogo from "/vite.svg"
import reactLogo from "./assets/react.svg"
import { cn } from "./lib/utils"

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="flex gap-8 mb-8">
        <a
          href="https://vitejs.dev"
          target="_blank"
          className="block hover:drop-shadow-lg transition-all duration-300"
          rel="noreferrer"
        >
          <img
            src={viteLogo}
            className="h-24 w-24 hover:drop-shadow-[0_0_2em_#646cffaa]"
            alt="Vite logo"
          />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          className="block hover:drop-shadow-lg transition-all duration-300"
          rel="noreferrer"
        >
          <img
            src={reactLogo}
            className={cn("h-24 w-24 animate-spin", "hover:drop-shadow-[0_0_2em_#61dafbaa]")}
            style={{ animationDuration: "20s" }}
            alt="React logo"
          />
        </a>
      </div>

      <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">Vite + React</h1>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
        <button
          type="button"
          onClick={() => setCount((count) => count + 1)}
          className={cn(
            "px-6 py-3 bg-blue-600 hover:bg-blue-700",
            "text-white font-medium rounded-lg",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Edit <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">src/App.tsx</code>{" "}
          and save to test HMR
        </p>
      </div>

      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
