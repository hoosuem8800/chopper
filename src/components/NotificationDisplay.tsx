import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Image, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { customToast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

const NotificationDisplay: React.FC = () => {
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
    
    // Only navigate for X-ray notifications
    // For all other notification types, just mark as read without navigation
    if (notification.notification_type === 'xray' && notification.related_id) {
      navigate(`/scan?related_id=${notification.related_id}`);
    } else if (notification.notification_type === 'xray') {
      navigate('/scan');
    }
    // Don't navigate anywhere for other notification types
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
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
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }

  // Limit to only showing 3 notifications
  const limitedNotifications = notifications.slice(0, 3);
  const hasMoreNotifications = notifications.length > 3;
  
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <div className="bg-primary/10 p-1.5 rounded-full">
              <Bell className="h-4 w-4 text-primary animate-pulse" />
            </div>
            Recent Activity
          </CardTitle>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:shadow-sm"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="py-4 px-4">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {limitedNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex py-4 px-5 rounded-lg ${!notification.is_read ? 'bg-primary/5 border-l-2 border-l-primary' : 'bg-gray-50/80'} 
                  relative cursor-pointer hover:shadow-md transition-all duration-300 hover:translate-x-1 group border border-transparent hover:border-gray-200`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mr-4 mt-0.5">
                  <div className={`${!notification.is_read 
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-primary/20' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100'} 
                    p-2.5 rounded-full shadow-sm group-hover:shadow-md
                    group-hover:scale-110 transition-all duration-300`}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                      {!notification.is_read && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] py-0.5 px-2 h-5 font-medium transition-all duration-200 hover:scale-105 ${
                          notification.notification_type === 'appointment_status' ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                          notification.notification_type === 'appointment_accepted' ? 'bg-green-50 text-green-500 border-green-200' :
                          notification.notification_type === 'appointment_rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                          notification.notification_type === 'appointment_reminder' ? 'bg-amber-50 text-amber-500 border-amber-200' :
                          notification.notification_type === 'xray' ? 'bg-indigo-50 text-indigo-500 border-indigo-200' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {notification.notification_type.replace('_', ' ')}
                      </Badge>
                      <p className="text-gray-400 text-xs">{formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mt-2 line-clamp-2 leading-relaxed">{notification.message}</p>
                  
                  {/* Add View button for X-ray notifications */}
                  {(notification.notification_type === 'xray' || notification.notification_type === 'scan' || notification.title.toLowerCase().includes('x-ray') || notification.message.toLowerCase().includes('x-ray')) && notification.related_id && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-2.5 text-xs gap-1 py-0.5 h-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm"
                      onClick={(e) => handleCheckResult(e, notification.related_id)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  )}
                </div>
                {!notification.is_read && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Mark as read"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-center mt-5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewAllNotifications}
                className="w-full text-sm text-primary hover:bg-primary/10 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 py-2.5"
              >
                <Bell className="h-3.5 w-3.5 mr-2" />
                View All Notifications
                {hasMoreNotifications && <span className="ml-2 bg-primary/15 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{notifications.length}</span>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50/70 rounded-lg border border-dashed border-gray-200 my-2">
            <div className="bg-gray-100 h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-3">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 text-sm font-medium">No notifications yet</p>
            <p className="text-gray-400 text-xs mt-2">We'll notify you about important updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationDisplay; 