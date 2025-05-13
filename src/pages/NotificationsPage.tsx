import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Image, Search, ExternalLink, ArrowLeft, Filter, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { customToast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      customToast.error('Failed to load notifications');
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
    
    // Navigate based on notification type
    switch (notification.notification_type) {
      // For appointment related notifications, navigate to profile page with appointments tab
      case 'appointment_status':
      case 'appointment_accepted':
      case 'appointment_rejected':
      case 'appointment_reminder':
        navigate(`/profile?tab=appointments`);
        break;
      // For X-ray notifications, navigate to scan page
      case 'xray':
        if (notification.related_id) {
          navigate(`/scan?related_id=${notification.related_id}`);
        } else {
          navigate('/scan');
        }
        break;
      default:
        // For any other notification types, navigate to profile page
        navigate('/profile');
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatTypeLabel = (type: string) => {
    // Convert snake_case to Title Case with spaces
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get notification types for filter
  const notificationTypes = [
    "all", 
    ...Array.from(new Set(notifications.map(n => n.notification_type)))
  ];

  // Filter notifications
  const filterNotifications = (notifications: Notification[]) => {
    let filtered = [...notifications];
    
    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(n => n.notification_type === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.message.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredNotifications = filterNotifications(notifications);

  // Calculate pagination
  const pageCount = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Count by type
  const countByType = notifications.reduce((acc, n) => {
    acc[n.notification_type] = (acc[n.notification_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Stats
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalCount = notifications.length;

  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex-grow py-6 sm:py-10">
        <div className="flex items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <Button 
            variant="ghost"
            className="p-1.5 sm:p-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notification Center</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium text-xs sm:text-sm">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalCount}</p>
              </div>
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-primary font-medium text-xs sm:text-sm">Unread</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{unreadCount}</p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-indigo-600 font-medium text-xs sm:text-sm">Types</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{Object.keys(countByType).length}</p>
              </div>
              <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 opacity-50" />
            </CardContent>
          </Card>
        </div>

        <Card className="w-full shadow-md">
          <CardHeader className="pb-2 sm:pb-4 flex flex-col space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Activity Feed
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 sm:ml-2 bg-primary text-[10px] sm:text-xs py-0">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-1.5 sm:gap-2">
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                    Mark all as read
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 sm:h-8 w-7 sm:w-8 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSearchQuery("")}>
                      Clear filters
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("all")}>
                      Show all types
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 sm:left-2.5 top-2 sm:top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-7 sm:pl-9 text-xs sm:text-sm h-8 sm:h-9 bg-gray-50 border-gray-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs 
                value={activeFilter} 
                onValueChange={setActiveFilter}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full h-auto p-0.5 sm:p-1 bg-gray-100">
                  <TabsTrigger value="all" className="text-[9px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3">
                    All
                    <span className="ml-1 sm:ml-1.5 text-gray-500">({totalCount})</span>
                  </TabsTrigger>
                  {notificationTypes.filter(t => t !== "all").map(type => (
                    <TabsTrigger key={type} value={type} className="text-[9px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3">
                      {formatTypeLabel(type)}
                      <span className="ml-1 sm:ml-1.5 text-gray-500">({countByType[type]})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <>
                <div className="space-y-5">
                  {paginatedNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex p-3 sm:p-5 rounded-lg ${!notification.is_read 
                        ? 'bg-primary/5 border-l-4 border-l-primary shadow-sm' 
                        : 'bg-gray-50 hover:bg-gray-100/50'} 
                        relative cursor-pointer hover:shadow-md transition-all duration-200 group border border-gray-100`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mr-3 sm:mr-5 mt-0.5">
                        <div className={`${!notification.is_read ? 'bg-white' : 'bg-gray-100'} p-2 sm:p-2.5 rounded-full shadow-sm
                          group-hover:scale-110 transition-transform duration-200`}>
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                          <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                            <h4 className="font-medium text-sm sm:text-base">{notification.title}</h4>
                            {!notification.is_read && (
                              <Badge variant="default" className="bg-primary text-[9px] sm:text-[10px] py-0">New</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                                notification.notification_type === 'appointment_status' ? 'bg-blue-50 text-blue-500 border-blue-200' : 
                                notification.notification_type === 'appointment_accepted' ? 'bg-green-50 text-green-500 border-green-200' :
                                notification.notification_type === 'appointment_rejected' ? 'bg-red-50 text-red-500 border-red-200' :
                                notification.notification_type === 'appointment_reminder' ? 'bg-amber-50 text-amber-500 border-amber-200' :
                                notification.notification_type === 'xray' ? 'bg-indigo-50 text-indigo-500 border-indigo-200' :
                                'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {formatTypeLabel(notification.notification_type)}
                            </Badge>
                            <span className="text-gray-400 text-[9px] sm:text-xs whitespace-nowrap">{formatDate(notification.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4">{notification.message}</p>
                        
                        {/* X-ray/Scan specific info card */}
                        {(notification.notification_type === 'xray' || 
                          notification.notification_type === 'scan' || 
                          notification.title.toLowerCase().includes('x-ray') || 
                          notification.message.toLowerCase().includes('x-ray')) && (
                          <div className="mb-2 sm:mb-4 bg-indigo-50/50 rounded-md p-2 sm:p-3 border border-indigo-100">
                            <h5 className="text-[10px] sm:text-xs font-medium text-indigo-700 mb-1 sm:mb-2 flex items-center gap-1">
                              <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Scan Information
                            </h5>
                            <ul className="text-[9px] sm:text-xs text-indigo-600/80 space-y-1 sm:space-y-1.5">
                              <li className="flex items-center gap-1 sm:gap-1.5">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-300"></span>
                                <span>Scan ID: {notification.related_id || 'Not available'}</span>
                              </li>
                              <li className="flex items-center gap-1 sm:gap-1.5">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-300"></span>
                                <span>Status: Ready for review</span>
                              </li>
                              <li className="flex items-center gap-1 sm:gap-1.5">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-300"></span>
                                <span>Type: {notification.message.toLowerCase().includes('ct') ? 'CT Scan' : 
                                  notification.message.toLowerCase().includes('mri') ? 'MRI Scan' : 'X-Ray'}</span>
                              </li>
                            </ul>
                          </div>
                        )}
                        
                        {/* Appointment specific info card */}
                        {(notification.notification_type === 'appointment_status' || 
                          notification.notification_type === 'appointment_accepted' || 
                          notification.notification_type === 'appointment_rejected' || 
                          notification.notification_type === 'appointment_reminder') && (
                          <div className="mb-2 sm:mb-4 bg-blue-50/50 rounded-md p-2 sm:p-3 border border-blue-100">
                            <h5 className="text-[10px] sm:text-xs font-medium text-blue-700 mb-1 sm:mb-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Appointment Details
                            </h5>
                            <ul className="text-[9px] sm:text-xs text-blue-600/80 space-y-1 sm:space-y-1.5">
                              <li className="flex items-center gap-1 sm:gap-1.5">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-300"></span>
                                <span>Status: {
                                  notification.notification_type === 'appointment_accepted' ? 'Confirmed' :
                                  notification.notification_type === 'appointment_rejected' ? 'Declined' :
                                  notification.notification_type === 'appointment_reminder' ? 'Upcoming' :
                                  'Pending'
                                }</span>
                              </li>
                              {notification.message.match(/\d{1,2}:\d{2}/) && (
                                <li className="flex items-center gap-1 sm:gap-1.5">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-300"></span>
                                  <span>Time: {notification.message.match(/\d{1,2}:\d{2}/)[0]}</span>
                                </li>
                              )}
                              {notification.message.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?\b/) && (
                                <li className="flex items-center gap-1 sm:gap-1.5">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-300"></span>
                                  <span>Date: {notification.message.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?\b/)[0]}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          {/* Context-specific additional information */}
                          {notification.notification_type === 'appointment_status' && (
                            <div className="text-[9px] sm:text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Check your appointment details</span>
                            </div>
                          )}
                          {notification.notification_type === 'appointment_accepted' && (
                            <div className="text-[9px] sm:text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Your appointment has been confirmed</span>
                            </div>
                          )}
                          {notification.notification_type === 'appointment_rejected' && (
                            <div className="text-[9px] sm:text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Your appointment was declined</span>
                            </div>
                          )}
                          {notification.notification_type === 'appointment_reminder' && (
                            <div className="text-[9px] sm:text-xs text-amber-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Don't forget your upcoming appointment</span>
                            </div>
                          )}
                          {notification.notification_type === 'xray' && (
                            <div className="text-[9px] sm:text-xs text-indigo-500 flex items-center gap-1">
                              <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Your scan results are ready to view</span>
                            </div>
                          )}
                          
                          {/* Action Button */}
                          {(notification.notification_type === 'xray' || notification.notification_type === 'scan' || notification.title.toLowerCase().includes('x-ray') || notification.message.toLowerCase().includes('x-ray')) && notification.related_id && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-[9px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3 py-0 sm:py-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm group-hover:scale-105 transition-transform"
                              onClick={(e) => handleCheckResult(e, notification.related_id)}
                            >
                              <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              View Scan Results
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Mark as read"
                        >
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50/70 rounded-lg border border-dashed border-gray-200">
                <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-medium text-gray-700 mb-2">No notifications found</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  {searchQuery 
                    ? "No notifications match your search criteria. Try a different search term." 
                    : activeFilter !== "all" 
                      ? `No ${formatTypeLabel(activeFilter)} notifications found.`
                      : "You don't have any notifications yet. We'll notify you about appointments, scan results, and other important updates."}
                </p>
                <div className="flex justify-center gap-3">
                  {(searchQuery || activeFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={() => navigate('/')}>Return to Home</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pagination controls - Moved outside the card */}
        {filteredNotifications.length > 0 && pageCount > 1 && (
          <div className="mt-6 sm:mt-8 mb-8 sm:mb-10 flex justify-center">
            <div className="relative" 
              style={{ 
                width: (() => {
                  // Determine width based on number of pages
                  if (pageCount <= 1) return '220px';
                  if (pageCount === 2) return '260px';  
                  if (pageCount === 3) return '300px';
                  if (pageCount === 4) return '340px';
                  return pageCount <= 5 ? '380px' : '420px'; // 5+ pages
                })(),
                maxWidth: '90vw'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-[22px] blur-xl -z-10 transform scale-105 opacity-60"></div>
              <Pagination className="pagination-Glass p-2 sm:p-3 px-3 sm:px-4 rounded-2xl w-full">
                <PaginationContent className="pagination-content flex justify-center">
                  <PaginationItem className="pagination-item">
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={`pagination-prev text-[10px] sm:text-xs h-7 sm:h-8 min-w-7 sm:min-w-8 px-2 sm:px-3 ${page === 1 ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                    // Determine which page numbers to show
                    let pageNum;
                    if (pageCount <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pageCount - 2) {
                      pageNum = pageCount - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={i} className="pagination-item">
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                          className={`pagination-link text-[10px] sm:text-xs h-7 sm:h-8 min-w-7 sm:min-w-8 ${page === pageNum 
                            ? "active bg-cyan-500/80 backdrop-blur-md text-white dark:bg-cyan-600/80 hover:bg-cyan-600/90 dark:hover:bg-cyan-500/90 shadow-lg" 
                            : "hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                          }`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {pageCount > 5 && page < pageCount - 2 && (
                    <PaginationItem className="pagination-item">
                      <PaginationEllipsis className="pagination-link backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300 text-[10px] sm:text-xs h-7 sm:h-8" />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem className="pagination-item">
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < pageCount) setPage(page + 1);
                      }}
                      className={`pagination-next text-[10px] sm:text-xs h-7 sm:h-8 min-w-7 sm:min-w-8 px-2 sm:px-3 ${page === pageCount ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
          </div>
  );
};

export default NotificationsPage; 