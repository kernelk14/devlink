import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App'
import './styles/globals.css'
import 'highlight.js/styles/github-dark.css'
import { useKeyboardShortcuts } from './lib/hooks'
import { queryClient } from './lib/queryClient'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <KeyboardShortcutsProvider>
          <App />
        </KeyboardShortcutsProvider>
      </QueryClientProvider>
    </ConvexProvider>
  </StrictMode>,
)