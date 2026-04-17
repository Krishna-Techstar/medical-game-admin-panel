import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Bell, Sparkles, X, CheckCircle2 } from 'lucide-react';

export function NotificationsDropdown({ 
  notifications, 
  isOpen, 
  onClose,
  onNotificationClick,
  onMarkAsRead 
}) {
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Notifications
            {unreadNotifications.length > 0 && (
              <Badge className="bg-red-500 text-white border-0 ml-auto">
                {unreadNotifications.length} new
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadNotifications.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-muted-foreground">Unread</p>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNotificationClick={onNotificationClick}
                      onMarkAsRead={onMarkAsRead}
                      isUnread={true}
                    />
                  ))}
                </>
              )}

              {readNotifications.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-muted-foreground mt-6">
                    Earlier
                  </p>
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNotificationClick={onNotificationClick}
                      onMarkAsRead={onMarkAsRead}
                      isUnread={false}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function NotificationItem({ notification, onNotificationClick, onMarkAsRead, isUnread }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'quest':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        isUnread
          ? 'bg-indigo-50 border-indigo-200'
          : 'bg-white border-gray-200'
      }`}
      onClick={() => {
        onNotificationClick(notification);
        onMarkAsRead(notification.id);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            {isUnread && (
              <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {notification.points && (
              <Badge className="bg-amber-500 text-white border-0 text-xs">
                +{notification.points} pts
              </Badge>
            )}
            {notification.teacherName && (
              <span className="text-xs text-muted-foreground">
                by {notification.teacherName}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(notification.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
