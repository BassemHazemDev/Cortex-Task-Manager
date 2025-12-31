import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './contexts/AppContext'
import { TaskProvider } from './contexts/TaskContext'
import { TodoProvider } from './contexts/TodoContext'
import ErrorBoundary from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary message="The application encountered an error. Please try refreshing the page.">
      <AppProvider>
        <TaskProvider>
          <TodoProvider>
            <App />
          </TodoProvider>
        </TaskProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
