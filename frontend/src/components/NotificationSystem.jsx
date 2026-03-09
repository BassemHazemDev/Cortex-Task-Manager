import { formatDateTimeContext } from '@/lib/utils.js'
import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

const NotificationSystem = ({ notifications, onDismiss }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--accent-2)' }} />
      case 'error':
        return <AlertCircle className="h-5 w-5" style={{ color: 'var(--destructive, #ef4444)' }} />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" style={{ color: 'var(--accent, #fbbf24)' }} />
      case 'info':
      default:
        return <Info className="h-5 w-5" style={{ color: 'var(--accent, #3b82f6)' }} />
    }
  }

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      case 'info':
      default:
        return 'notification-info';
    }
  }

  const handleDismiss = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id))
    onDismiss(id)
  }


  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map(notification => (
        <Card
          key={notification.id}
          className={`${getBackgroundColor(notification.type)} shadow-lg animate-in slide-in-from-right duration-300`}
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {notification.message}
                </p>
                {notification.details && (
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {/* If details contains a date and time, format contextually */}
                    {typeof notification.details === 'string' && notification.details.match(/(\d{4}-\d{2}-\d{2}).*?(\d{1,2}:\d{2})/) ?
                      (() => {
                        const match = notification.details.match(/(\d{4}-\d{2}-\d{2}).*?(\d{1,2}:\d{2})/);
                        if (match) {
                          return formatDateTimeContext(match[1], match[2]);
                        }
                        return notification.details;
                      })()
                      : notification.details}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(notification.id)}
                style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default NotificationSystem

