
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  message: string;
  type: 'created' | 'moved' | 'updated' | 'deleted';
  ticketKey: string;
  timestamp: Date;
  read: boolean;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Handle the custom notification event
    const handleNotification = (event: CustomEvent<{ type: 'created' | 'moved' | 'updated' | 'deleted', ticketKey: string, message: string }>) => {
      const { type, ticketKey, message } = event.detail;
      
      // Create a new notification
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message,
        type,
        ticketKey,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
      setUnreadCount(prev => prev + 1);
    };
    
    // Add event listener
    document.addEventListener('ticket-notification', handleNotification as EventListener);
    
    return () => {
      document.removeEventListener('ticket-notification', handleNotification as EventListener);
    };
  }, []);
  
  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Mark all as read when opening the popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  
  // Get the appropriate icon color based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-green-500';
      case 'moved': return 'text-blue-500';
      case 'updated': return 'text-yellow-500';
      case 'deleted': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllNotifications}
            className="text-xs h-7"
          >
            Clear all
          </Button>
        </div>
        <Separator className="my-2" />
        <ScrollArea className="h-[300px] pr-3">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-md border ${notification.read ? 'bg-background' : 'bg-muted'}`}
                >
                  <div className="flex justify-between">
                    <span className={`text-xs font-semibold ${getTypeColor(notification.type)}`}>
                      {notification.ticketKey}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
