import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './contexts/AppContext'
import { TaskProvider } from './contexts/TaskContext'
import { TodoProvider } from './contexts/TodoContext'
import ErrorBoundary from './components/common/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary message="The application encountered an error. Please try refreshing the page.">
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TaskProvider>
            <TodoProvider>
              <App />
            </TodoProvider>
          </TaskProvider>
        </AppProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
