import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Image, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { customToast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

interface LimitedNotificationDisplayProps {
  limit: number;
}

const LimitedNotificationDisplay: React.FC<LimitedNotificationDisplayProps> = ({ limit }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't break the UI if the endpoint doesn't exist
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!Array.isArray(notifications) || notifications.filter(n => !n.is_read).length === 0) return;
    
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        is_read: true
      })));
      customToast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      customToast.error('Failed to mark notifications as read');
    }
  };
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    // ONLY navigate for xray notifications with related_id
    // For ALL other notification types (appointments, consultations, etc.), just mark as read without navigation
    // This prevents navigation to non-existent pages like /dashboard
    if (notification.notification_type === 'xray' && notification.related_id) {
      navigate(`/scan`);
    }
  };

  const handleCheckResult = (e: React.MouseEvent, relatedId?: number) => {
    e.stopPropagation(); // Prevent the parent click handler from firing
    if (relatedId) {
      navigate(`/scan`);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_status':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'appointment_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'appointment_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'appointment_reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'xray':
        return <Image className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  // Get limited notifications
  const limitedNotifications = Array.isArray(notifications) ? notifications.slice(0, limit) : [];
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Your latest updates and reminders</CardDescription>
          </div>
          {limitedNotifications.filter(n => !n.is_read).length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs hover:text-cyan-500 hover:border-cyan-500 transition-colors duration-200"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : limitedNotifications.length > 0 ? (
          <div className="space-y-4">
            {limitedNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex p-3 rounded-lg ${!notification.is_read ? 'bg-primary/5' : 'bg-gray-50'} relative group hover:shadow-md hover:border-cyan-300 transition-all duration-200 cursor-pointer border border-transparent`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mr-3 mt-0.5">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium group-hover:text-cyan-700 transition-colors duration-200">{notification.title}</h4>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1 group-hover:text-cyan-600/80 transition-colors duration-200">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-2">{formatDate(notification.created_at)}</p>
                  
                  {/* Add Check Result button for X-ray notifications */}
                  {(notification.notification_type === 'xray' || notification.notification_type === 'scan' || notification.title.toLowerCase().includes('x-ray') || notification.message.toLowerCase().includes('x-ray')) && notification.related_id && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-2 text-xs gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm"
                      onClick={(e) => handleCheckResult(e, notification.related_id)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Check Result
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        )}
      </CardContent>
      
      {notifications.length > limit && (
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            className="text-primary hover:text-cyan-500 hover:border-cyan-500 hover:bg-cyan-50/30 transition-colors duration-200"
            onClick={() => {
              window.location.href = '/profile';
              // Use setTimeout to ensure the page has loaded before clicking the tab
              setTimeout(() => {
                document.getElementById('notifications-tab')?.click();
              }, 100);
            }}
          >
            Show All Notifications
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default LimitedNotificationDisplay; 