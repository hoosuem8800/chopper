import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Calendar, MessageCircle, UserPlus, User, Home, DollarSign, Users, CalendarClock, LogOut, Award, Image, Stethoscope, Shield, CheckCircle, XCircle, Clock, AlertCircle, Database, Settings, Search, Microscope, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE_URL, getProfilePictureUrl, notificationService, getUserInitials } from '@/services/api';
import { customToast } from '@/lib/toast';
import NotificationToast from '@/components/ui/toast';
import NotificationDisplay from '@/components/NotificationDisplay';

// Custom Lungs icon component
const LungsIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    fill="currentColor" 
    viewBox="0 0 16 16"
    className={className}
  >
    <path d="M8.5 1.5a.5.5 0 1 0-1 0v5.243L7 7.1V4.72C7 3.77 6.23 3 5.28 3c-.524 0-1.023.27-1.443.592-.431.332-.847.773-1.216 1.229-.736.908-1.347 1.946-1.58 2.48-.176.405-.393 1.16-.556 2.011-.165.857-.283 1.857-.241 2.759.04.867.233 1.79.838 2.33.67.6 1.622.556 2.741-.004l1.795-.897A2.5 2.5 0 0 0 7 11.264V10.5a.5.5 0 0 0-1 0v.764a1.5 1.5 0 0 1-.83 1.342l-1.794.897c-.978.489-1.415.343-1.628.152-.28-.25-.467-.801-.505-1.63-.037-.795.068-1.71.224-2.525.157-.82.357-1.491.491-1.8.19-.438.75-1.4 1.44-2.25.342-.422.703-.799 1.049-1.065.358-.276.639-.385.833-.385a.72.72 0 0 1 .72.72v3.094l-1.79 1.28a.5.5 0 0 0 .58.813L8 7.614l3.21 2.293a.5.5 0 1 0 .58-.814L10 7.814V4.72a.72.72 0 0 1 .72-.72c.194 0 .475.11.833.385.346.266.706.643 1.05 1.066.688.85 1.248 1.811 1.439 2.249.134.309.334.98.491 1.8.156.814.26 1.73.224 2.525-.038.829-.224 1.38-.505 1.63-.213.19-.65.337-1.628-.152l-1.795-.897A1.5 1.5 0 0 1 10 11.264V10.5a.5.5 0 0 0-1 0v.764a2.5 2.5 0 0 0 1.382 2.236l1.795.897c1.12.56 2.07.603 2.741.004.605-.54.798-1.463.838-2.33.042-.902-.076-1.902-.24-2.759-.164-.852-.38-1.606-.558-2.012-.232-.533-.843-1.571-1.579-2.479-.37-.456-.785-.897-1.216-1.229C11.743 3.27 11.244 3 10.72 3 9.77 3 9 3.77 9 4.72V7.1l-.5-.357z"/>
  </svg>
);

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

// Custom component to handle avatar image loading
interface UserAvatarProps {
  user: any; // Could be more specific if you have a User type
  size?: "small" | "medium" | "large";
  forceInitials?: boolean;
}

// Simplified UserAvatar component that directly uses img tags
const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = "small", forceInitials = false }) => {
  // Size classes for consistency
  const sizeClass = 
    size === "small" ? "h-8 w-8" : 
    size === "medium" ? "h-10 w-10" : 
    "h-12 w-12"; // large
  
  // State to store profile picture URL
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  
  // Generate initials for fallback
  const initials = React.useMemo(() => getUserInitials(user), [user]);
  
  // Fetch profile picture from the backend when component mounts
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user) return;
      
      try {
        // First check if the user already has a profile_picture property
        if (user.profile_picture && user.profile_picture !== 'placeholder') {
          handleProfilePicture(user.profile_picture);
          return;
        }
        
        // If not, try to fetch it from the user profile endpoint
        const response = await notificationService.getProfilePicture();
        console.log('Profile response:', response);
        
        if (response && response.length > 0) {
          const profileData = response[0];
          if (profileData.profile_picture) {
            // Update the picture URL
            handleProfilePicture(profileData.profile_picture);
            
            // Also update the user object if possible
            if (user) {
              user.profile_picture = profileData.profile_picture;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
    
    fetchProfilePicture();
  }, [user]);
  
  // Process the profile picture path into a full URL
  const handleProfilePicture = (picturePath: string) => {
    // If placeholder is specified, use ui-avatars
    if (picturePath === 'placeholder') {
      setProfilePicUrl(`https://ui-avatars.com/api/?name=${initials}&background=E0F2FE&color=0891B2&size=256`);
      return;
      }
      
      // If it's already a full URL, use it as is
    if (picturePath.startsWith('http') || picturePath.startsWith('data:')) {
      setProfilePicUrl(picturePath);
      return;
      }
      
      // For relative paths, combine with API base URL
      const apiBaseUrl = 'http://localhost:8000';
    const cleanPath = picturePath.startsWith('/') ? picturePath.substring(1) : picturePath;
      const fullUrl = `${apiBaseUrl}/${cleanPath}`;
    console.log('Converted profile picture to full URL:', fullUrl);
    setProfilePicUrl(fullUrl);
  };
  
  // Style for the avatar container
  const containerStyle = `${sizeClass} rounded-full overflow-hidden flex items-center justify-center border-2 border-primary/20`;
  
  // If we have a profile picture URL, render the image directly
  if (profilePicUrl && !forceInitials) {
    return (
      <div className={containerStyle}>
        <img 
          src={profilePicUrl}
          alt={user?.first_name || 'User'} 
          className="h-full w-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', profilePicUrl);
            // Replace with initials on error by setting a data URL
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${initials}&background=E0F2FE&color=0891B2&size=256`;
          }}
        />
      </div>
    );
  }
  
  // Fallback to initials
  return (
    <div className={`${containerStyle} bg-cyan-50 text-cyan-700 font-medium`}>
      <span>{initials}</span>
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [mobileNotificationDropdownOpen, setMobileNotificationDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for notification toast
  const [toastOpen, setToastOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  // Debug user info and profile picture
  useEffect(() => {
    if (user) {
      console.log('Navbar user:', user);
      console.log('User profile_picture:', user.profile_picture);
      const profilePicUrl = getProfilePictureUrl(user?.profile_picture);
      console.log('Profile picture URL generated:', profilePicUrl);
    }
  }, [user]);

  // Add custom styles for notification bell
  const bellStyles = `
    /* Override for notification bell when dropdown is open */
    [data-state="open"] .notification-bell-icon {
      color: #0891b2 !important;
    }
    [data-state="open"] .notification-bell-container {
      background-color: #ecfeff !important;
      box-shadow: 0 0 8px rgba(0,190,255,0.5) !important;
    }
    
    /* Bell ringing animation */
    @keyframes bellRing {
      0% { transform: rotate(0); }
      20% { transform: rotate(8deg); }
      40% { transform: rotate(-8deg); }
      60% { transform: rotate(4deg); }
      80% { transform: rotate(-4deg); }
      100% { transform: rotate(0); }
    }
    
    .notification-bell-ringing {
      animation: bellRing 1s ease infinite;
      transform-origin: top center;
    }
    
    /* Slow pulse animation for empty state */
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Detect scroll position to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Listen for manual notification refresh events
  useEffect(() => {
    const handleRefreshNotifications = () => {
      if (isAuthenticated) {
        fetchNotifications();
      }
    };

    window.addEventListener('refresh-notifications', handleRefreshNotifications);
    return () => {
      window.removeEventListener('refresh-notifications', handleRefreshNotifications);
    };
  }, [isAuthenticated]);

  // Update document title with notification count
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Chopper Health`;
    } else {
      document.title = 'Chopper Health';
    }
    
    return () => {
      document.title = 'Chopper Health';
    };
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    setLoadingNotifications(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't break the UI if notifications endpoint is unavailable
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
      customToast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_status':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'appointment_accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'appointment_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'appointment_reminder':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'xray':
        return <Image className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const formatNotificationTime = (dateString: string) => {
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

  // Helper function to check if link is active
  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  // Navigation links
  const navLinks = [
    { to: "/", label: "Home", icon: <Home className="h-4 w-4" />, roles: ['all'] },
    { to: "/pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" />, roles: ['all'] },
    { to: "/appointment", label: "Appointment", icon: <CalendarClock className="h-4 w-4" />, roles: ['all'] },
    { to: "/scan", label: "Scan", icon: <Image className="h-4 w-4" />, roles: ['all'] },
    { to: "/admin/manage", label: "Admin Panel", icon: <Shield className="h-4 w-4" />, roles: ['admin'] },
  ];

  // Filter links based on user role
  const getFilteredLinks = () => {
    if (!isAuthenticated) {
      return navLinks.filter(link => link.roles.includes('all'));
    }
    return navLinks.filter(link => 
      link.roles.includes('all') || 
      link.roles.includes(user?.role || '') ||
      (user?.role === 'admin') // Admin sees everything
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Function to handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setActiveNotification(notification);
    setToastOpen(true);
    
    // Optionally navigate based on notification type
    if (notification.related_id) {
      switch (notification.notification_type) {
        case 'appointment_status':
        case 'appointment_accepted':
        case 'appointment_rejected':
        case 'appointment_reminder':
          document.getElementById('notifications-tab')?.click();
          break;
        case 'xray':
          const relatedId = notification.related_id;
          
          if (relatedId) {
            handleMarkAsRead(notification.id);
            navigate(`/scan?related_id=${relatedId}`);
            return;
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <>
      <nav className={`${scrolled ? 'bg-white/95 py-2' : 'bg-white/90 py-3'} md:py-3 py-1.5 backdrop-blur-md shadow-sm z-50 sticky top-0 transition-all duration-300`}>
        <style dangerouslySetInnerHTML={{ __html: bellStyles }} />
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-1.5 md:gap-2 group transition-all duration-300">
              <span className="text-lg md:text-xl font-bold gradient-text group-hover:scale-105 transition-transform">Chopper</span>
              <LungsIcon className="h-6 w-6 md:h-8 md:w-8 text-primary group-hover:rotate-12 transition-transform" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {getFilteredLinks().map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`group flex items-center gap-1.5 font-medium transition-all duration-300 relative px-3 py-2 rounded-lg
                    ${isActive(link.to) 
                      ? 'text-primary bg-primary/5' 
                      : 'text-gray-700 hover:text-cyan-700 hover:bg-cyan-50'}`}
                >
                  <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive(link.to) ? 'text-primary' : ''}`}>
                    {link.icon}
                  </span>
                  <span className="relative">
                    {link.label}
                    <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300
                      ${isActive(link.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}>
                    </span>
                  </span>
                </Link>
              ))}

              {isAuthenticated && (
                <DropdownMenu
                  onOpenChange={(open) => {
                    setNotificationDropdownOpen(open);
                    if (open) {
                      fetchNotifications();
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <div 
                      className={`notification-bell-container relative rounded-full p-2 transition-all duration-300 hover:scale-110 hover:shadow-sm active:scale-95 ${
                        unreadCount > 0 || notificationDropdownOpen
                          ? 'bg-cyan-50 text-cyan-600 shadow-md ring-1 ring-cyan-200'
                          : 'hover:bg-cyan-50 hover:text-cyan-600 text-gray-600'
                      }`}
                    >
                      <Bell className={`notification-bell-icon h-5 w-5 ${
                        unreadCount > 0 
                          ? 'text-cyan-600 notification-bell-ringing' 
                          : notificationDropdownOpen
                            ? 'text-cyan-600'
                            : 'hover:text-gray-900 text-gray-600'
                      }`} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border border-gray-200 rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 py-3 px-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-white text-blue-600 px-2 py-0.5 rounded-full font-semibold shadow-sm">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-gradient-to-b from-blue-50/50 to-white py-0.5"></div>
                    {loadingNotifications ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
                      </div>
                    ) : notifications.filter(n => !n.is_read).length > 0 ? (
                      <div className="max-h-[350px] overflow-y-auto">
                        {(() => {
                          // Only show unread notifications
                          const unreadNotifications = notifications.filter(n => !n.is_read);
                          
                          return unreadNotifications.map(notification => (
                            (notification.notification_type === 'scan' || notification.notification_type === 'xray') && notification.related_id ? (
                              <DropdownMenuItem asChild key={notification.id} className="px-0 py-0">
                                <Link 
                                  to={notification.notification_type === 'xray' ? `/scan?related_id=${notification.related_id}` : `/scan/${notification.related_id}`} 
                                  className={`flex items-start p-4 gap-3 w-full border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                                  onClick={() => {
                                    if (!notification.is_read) {
                                      handleMarkAsRead(notification.id);
                                    }
                                  }}
                                >
                                  <div className={`shrink-0 rounded-full p-2.5 ${
                                    notification.notification_type === 'scan' ? 'bg-cyan-100 text-cyan-600' : 
                                    notification.notification_type === 'xray' ? 'bg-blue-100 text-blue-600' :
                                    notification.notification_type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {getNotificationIcon(notification.notification_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-semibold text-sm text-gray-900 truncate pr-2">{notification.title}</p>
                                      {!notification.is_read && (
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0"></span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                      <p className="text-gray-400 text-xs flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatNotificationTime(notification.created_at)}
                                      </p>
                                      <span className="text-xs text-blue-500 font-medium">View</span>
                                    </div>
                                  </div>
                                </Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem key={notification.id} className="px-0 py-0">
                                <div 
                                  className={`flex items-start p-4 gap-3 w-full border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className={`shrink-0 rounded-full p-2.5 ${
                                    notification.notification_type === 'scan' ? 'bg-cyan-100 text-cyan-600' : 
                                    notification.notification_type === 'xray' ? 'bg-blue-100 text-blue-600' :
                                    notification.notification_type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {getNotificationIcon(notification.notification_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-semibold text-sm text-gray-900 truncate pr-2">{notification.title}</p>
                                      {!notification.is_read && (
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0"></span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                      <p className="text-gray-400 text-xs flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatNotificationTime(notification.created_at)}
                                      </p>
                                      {!notification.is_read && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notification.id);
                                          }}
                                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-medium rounded-full py-0.5 px-2 hover:bg-blue-100/50 transition-colors duration-200"
                                        >
                                          <CheckCircle className="h-3 w-3" />
                                          Mark read
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            )
                          ));
                        })()}
                        <div className="bg-gray-50/50 p-3 text-center">
                          <Link 
                            to="/profile?tab=notifications" 
                            className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>See all notifications</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        {notifications.length > 0 ? (
                          <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                              <div className="h-20 w-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full flex items-center justify-center">
                                <Bell className="h-10 w-10 text-blue-300" />
                              </div>
                              <div className="absolute bottom-0 right-0 bg-green-100 rounded-full p-1.5 border-2 border-white">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            </div>
                            <h3 className="text-gray-800 font-semibold mb-2">All caught up!</h3>
                            <p className="text-gray-500 text-sm max-w-[220px] mx-auto">You've read all your notifications. Check back later for updates.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="h-20 w-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                              <div className="animate-pulse-slow">
                                <Bell className="h-10 w-10 text-blue-200" />
                              </div>
                            </div>
                            <h3 className="text-gray-800 font-semibold mb-2">No notifications yet</h3>
                            <p className="text-gray-500 text-sm max-w-[220px] mx-auto">We'll notify you when important updates or actions are available.</p>
                          </div>
                        )}
                        
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <Link 
                            to="/profile?tab=notifications"
                            className="inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            {notifications.length > 0 ? 'View all notifications' : 'Check notification settings'}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-full hover:bg-cyan-50 transition-colors">
                    <UserAvatar user={user} size="medium" />
                    <div className="flex flex-col items-start">
                      <span className="text-gray-800 font-medium text-sm leading-tight">{user?.first_name || user?.username || 'User'}</span>
                      {user?.role && (
                        <span className="text-xs text-gray-500 leading-tight capitalize">{user.role}</span>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="neuro-card min-w-[220px]">
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="medium" />
                        <div className="flex flex-col">
                          <span className="font-semibold">{user?.first_name} {user?.last_name}</span>
                          <span className="text-xs text-gray-500">@{user?.username}</span>
                        </div>
                      </div>
                      {user?.subscription_type === 'premium' && (
                        <div className="mt-2 bg-gradient-to-r from-amber-100 to-amber-200 p-1.5 rounded text-xs text-amber-800 flex items-center justify-center">
                          <Award className="h-3 w-3 mr-1" /> Premium Member
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem asChild className="flex items-center gap-2 py-2 hover:bg-cyan-50 hover:text-cyan-700">
                      <Link to="/profile" className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-cyan-600" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild className="flex items-center gap-2 py-2 hover:bg-cyan-50 hover:text-cyan-700">
                          <Link to="/admin/manage" className="flex items-center gap-2 w-full">
                            <Shield className="h-4 w-4 text-cyan-600" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user?.role === 'assistant' && (
                      <DropdownMenuItem asChild className="flex items-center gap-2 py-2 hover:bg-cyan-50 hover:text-cyan-700">
                        <Link to="/app-dash" className="flex items-center gap-2 w-full">
                          <Calendar className="h-4 w-4 text-cyan-600" /> Appointments Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.role === 'doctor' && (
                      <DropdownMenuItem asChild className="flex items-center gap-2 py-2 hover:bg-cyan-50 hover:text-cyan-700">
                        <Link to="/doctor-dash" className="flex items-center gap-2 w-full">
                          <Stethoscope className="h-4 w-4 text-cyan-600" /> Doctor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 p-3 text-red-500 hover:bg-red-50 hover:text-red-600 w-full text-left">
                      <LogOut className="h-4 w-4 text-red-500" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-gray-700 hover:text-cyan-700 transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn__SS px-4 py-2 rounded-md flex items-center gap-1 transition-transform hover:scale-105">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Elements (Only showing mobile menu toggle) */}
            <div className="flex items-center gap-2 lg:hidden">
              {isAuthenticated && (
                <button 
                  onClick={() => setMobileNotificationDropdownOpen(!mobileNotificationDropdownOpen)}
                  className={`relative rounded-full p-1.5 md:p-2 transition-all duration-300 ${
                    unreadCount > 0
                      ? 'bg-cyan-50 text-cyan-600 shadow-sm ring-1 ring-cyan-200'
                      : 'hover:bg-cyan-50 hover:text-cyan-600 text-gray-600'
                  }`}
                >
                  <Bell className={`h-4 w-4 md:h-5 md:w-5 ${
                    unreadCount > 0 
                      ? 'text-cyan-600 notification-bell-ringing' 
                      : ''
                  }`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 flex h-1.5 w-1.5 md:h-2 md:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-red-500"></span>
                    </span>
                  )}
                </button>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="ml-2 p-1.5 md:p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors duration-300"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <Menu className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Notifications Dropdown */}
          {isAuthenticated && mobileNotificationDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              {/* Notification Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 py-2 md:py-3 px-3 md:px-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-white font-medium text-sm md:text-base flex items-center gap-1.5 md:gap-2">
                    <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Notifications
                  </h4>
                    {unreadCount > 0 && (
                    <span className="text-xs bg-white text-blue-600 px-1.5 md:px-2 py-0.5 rounded-full font-semibold shadow-sm">
                      {unreadCount} new
                      </span>
                    )}
                </div>
                </div>
                
              <div className="bg-gradient-to-b from-blue-50 to-white py-0.5"></div>
              
              {/* Loading State */}
                  {loadingNotifications ? (
                <div className="flex justify-center items-center py-6 md:py-8">
                  <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
                    </div>
              ) : (
                <>
                  {/* Empty State */}
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100">
                        <Bell className="h-8 w-8 text-gray-400 animate-pulse-slow" />
                      </div>
                      <h3 className="text-gray-600 font-medium mb-1">No notifications yet</h3>
                      <p className="text-gray-500 text-sm">We'll notify you when something important happens</p>
                    </div>
                  ) : (
                    /* Notification List */
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                      {notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`flex items-start p-3 md:p-4 gap-2 md:gap-3 w-full hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setMobileNotificationDropdownOpen(false);
                          }}
                        >
                          <div className={`shrink-0 rounded-full p-2.5 ${
                            notification.notification_type === 'scan' ? 'bg-cyan-100 text-cyan-600' : 
                            notification.notification_type === 'xray' ? 'bg-blue-100 text-blue-600' :
                            notification.notification_type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">{notification.title}</p>
                              {!notification.is_read && (
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-gray-400 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatNotificationTime(notification.created_at)}
                              </p>
                              {!notification.is_read && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-medium rounded-full py-0.5 px-2 hover:bg-blue-100/50 transition-colors duration-200"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Mark read
                  </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="p-4 text-center">
                        <Link 
                          to="/profile?tab=notifications" 
                          className="text-blue-600 text-sm font-medium hover:text-blue-700 inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          onClick={() => setMobileNotificationDropdownOpen(false)}
                        >
                          View all notifications
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
              
          {/* Mobile Menu */}
          <div 
            className={`lg:hidden mt-2 md:mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="py-2 space-y-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-100">
              {/* User Profile Section - Show at the top for logged in users */}
              {isAuthenticated && (
                <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-100 mb-1 md:mb-2">
                  <div className="flex items-center gap-2 md:gap-3">
                      <UserAvatar user={user} size="small" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm md:text-base">{user?.first_name || user?.username || 'User'} {user?.last_name || ''}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</span>
                      </div>
                    </div>
                  {user?.subscription_type === 'premium' && (
                    <div className="mt-1.5 md:mt-2 bg-gradient-to-r from-amber-100 to-amber-200 p-1 md:p-1.5 rounded text-xs text-amber-800 flex items-center justify-center">
                      <Award className="h-3 w-3 mr-1" /> Premium Member
                  </div>
                  )}
                </div>
              )}
            
              {/* Navigation Links */}
              <div className="px-1">
                {getFilteredLinks().map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 mb-1 transition-colors ${
                      isActive(link.to) 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className={`${isActive(link.to) ? 'text-primary' : 'text-gray-500'}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                ))}
              </div>
              
              {/* User Account Links or Auth Links */}
              {isAuthenticated ? (
                <div className="mt-1 md:mt-2 pt-1 border-t border-gray-100 px-1">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 mb-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    My Profile
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin/manage" 
                      className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 mb-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 text-gray-500" />
                      Admin Dashboard
                    </Link>
                  )}
                  
                  {user?.role === 'assistant' && (
                    <Link 
                      to="/app-dash" 
                      className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 mb-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Appointments Dashboard
                    </Link>
                  )}
                  
                  {user?.role === 'doctor' && (
                    <Link 
                      to="/doctor-dash" 
                      className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 mb-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      Doctor Dashboard
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-md mx-1 text-red-500 hover:bg-red-50 hover:text-red-600 w-full text-left mt-1"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                  <Link 
                    to="/login" 
                    className="w-full py-2 px-4 text-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="w-full py-2 px-4 text-center rounded-md bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Notification toast */}
      {activeNotification && (
        <NotificationToast
          open={toastOpen}
          setOpen={setToastOpen}
          title={activeNotification.title}
          description={activeNotification.message}
          type={activeNotification.notification_type as any}
          time={formatNotificationTime(activeNotification.created_at)}
        />
      )}
    </>
  );
};

export default Navbar;
