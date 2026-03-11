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
import { useState, useEffect } from 'react'

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

function AppLoader() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit for initial render to complete
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <OfflineSyncManager />
        <AppProvider>
          <TaskProvider>
            <TodoProvider>
              <App />
            </TodoProvider>
          </TaskProvider>
        </AppProvider>
        {isReady && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary message="The application encountered an error. Please try refreshing the page.">
      <BrowserRouter>
        <AppLoader />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
