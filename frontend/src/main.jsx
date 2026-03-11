import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './contexts/AppContext'
import { TaskProvider } from './contexts/TaskContext'
import { TodoProvider } from './contexts/TodoContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import useOfflineSync from './hooks/useOfflineSync'

function OfflineSyncManager() {
  useOfflineSync();
  return null;
}

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
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <OfflineSyncManager />
          <AppProvider>
            <TaskProvider>
              <TodoProvider>
                <App />
              </TodoProvider>
            </TaskProvider>
          </AppProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
