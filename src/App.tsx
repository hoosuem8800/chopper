import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AppRoutes from '@/routes';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { appointmentService, notificationService, emailNotificationService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Bell, RefreshCw, Lock } from 'lucide-react';
import { customToast } from '@/lib/toast';
import Background, { PatternType, DensityOption, SizeOption, SpeedOption, TrajectoryType, DistributionType } from '@/components/Background';
import { BackgroundProvider, useBackgroundSettings } from '@/contexts/BackgroundContext';

// Full app reset button - disabled
const ResetButton = () => {
  return null;
};

// Define the Background Settings interface
interface BackgroundSettings {
  // Background settings
  showFloatingIcons: boolean;
  showPattern: boolean;
  patternOpacity: number;
  patternType: PatternType;
  backgroundColor: string;
  
  // Icon settings
  iconDensity: DensityOption;
  iconSpeed: SpeedOption;
  iconSize: SizeOption;
  iconGlow: boolean;
  iconColorTheme: string;
  customIconColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  // Advanced icon settings
  iconOpacity: number;
  iconTrajectory: TrajectoryType;
  iconRotation: boolean;
  iconDistribution: DistributionType;
  iconPulse: boolean;
  
  // Pattern settings
  patternSize: SizeOption;
  patternAnimation: boolean;
  patternSpeed: SpeedOption;
}

// Default background settings
const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  showFloatingIcons: true,
  showPattern: true,
  patternOpacity: 0.15,
  patternType: 'grid',
  backgroundColor: 'gradient-bg',
  iconDensity: 'dense',
  iconSpeed: 'slow',
  iconSize: 'small',
  iconGlow: false,
  iconColorTheme: 'default',
  customIconColors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B'
  },
  iconOpacity: 0.8,
  iconTrajectory: 'upward',
  iconRotation: true,
  iconDistribution: 'even',
  iconPulse: false,
  patternSize: 'medium',
  patternAnimation: true,
  patternSpeed: 'medium'
};

// Button to manually test notifications - can be removed in production
const TestNotificationButton = () => {
  // Disabled in production
  return null;
  
  /*
  const { isAuthenticated, user } = useAuth();
  const [showButton, setShowButton] = useState(false);

  // Only show the button when pressing Ctrl+Shift+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        setShowButton(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const createTestNotification = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      await notificationService.createNotification({
        user_id: user.id,
        title: 'Test Notification',
        message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
        notification_type: 'system',
        related_id: null
      });
      
      // Force refresh notifications in navbar
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };
  
  const sendTestEmail = async () => {
    if (!isAuthenticated || !user || !user.email) return;
    
    try {
      const result = await emailNotificationService.sendEmailNotification(
        user.email,
        'Test Email Notification',
        `This is a test email notification sent at ${new Date().toLocaleTimeString()}`
      );
      
      if (result.mock) {
        customToast.success('Test email sent (mock mode)');
        console.log('Mock email was sent. Check browser console for details.');
      } else {
        customToast.success('Test email sent successfully');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      customToast.error('Failed to send test email');
    }
  };
  
  const resetMockNotifications = () => {
    // Remove mock initialization flag to allow reinitializing
    localStorage.removeItem('mockNotificationsInitialized');
    
    // Create fresh mock notifications
    const mockNotifications = [
      {
        id: Date.now() - 1000000,
        title: 'Welcome to Chopper Health',
        message: 'Thank you for joining Chopper Health. We are excited to help you manage your healthcare journey!',
        notification_type: 'system',
        is_read: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        related_id: null
      },
      {
        id: Date.now() - 2000000,
        title: 'Appointment Reminder',
        message: 'You have an upcoming appointment with Dr. Smith tomorrow at 2:00 PM.',
        notification_type: 'appointment_reminder',
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        related_id: 1
      }
    ];
    
    localStorage.setItem('mockNotifications', JSON.stringify(mockNotifications));
    customToast.success('Mock notifications reset');
    
    // Force refresh
    window.dispatchEvent(new CustomEvent('refresh-notifications'));
  };

  if (!showButton || !isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button 
        onClick={createTestNotification}
        className="bg-primary text-white flex items-center gap-2"
        size="sm"
      >
        <Bell className="h-4 w-4" />
        Create Test Notification
      </Button>
      
      <Button 
        onClick={sendTestEmail}
        className="bg-blue-600 text-white flex items-center gap-2"
        size="sm"
      >
        <Bell className="h-4 w-4" />
        Send Test Email
      </Button>
      
      <Button 
        onClick={resetMockNotifications}
        className="bg-secondary text-white flex items-center gap-2"
        size="sm"
      >
        <Bell className="h-4 w-4" />
        Reset Mock Notifications
      </Button>
    </div>
  );
  */
};

// Component to handle appointment checks and reminders
const AppointmentReminders = () => {
  const { isAuthenticated, user } = useAuth();
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  // Initialize mock notifications for testing - Disabled in production
  /*
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we need to initialize mock notifications
      const hasInitializedMock = localStorage.getItem('mockNotificationsInitialized');
      if (!hasInitializedMock) {
        console.log('Initializing mock notifications');
        
        // Create some sample notifications
        const mockNotifications = [
          {
            id: Date.now() - 1000000,
            title: 'Welcome to Chopper Health',
            message: 'Thank you for joining Chopper Health. We are excited to help you manage your healthcare journey!',
            notification_type: 'system',
            is_read: false,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            related_id: null
          },
          {
            id: Date.now() - 2000000,
            title: 'Appointment Reminder',
            message: 'You have an upcoming appointment with Dr. Smith tomorrow at 2:00 PM.',
            notification_type: 'appointment_reminder',
            is_read: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            related_id: 1
          }
        ];
        
        localStorage.setItem('mockNotifications', JSON.stringify(mockNotifications));
        localStorage.setItem('mockNotificationsInitialized', 'true');
      }
    }
  }, [isAuthenticated, user]);
  */

  // Check for upcoming appointments
  useEffect(() => {
    // Only check appointments if user is authenticated and backend is available
    if (!isAuthenticated || !isBackendAvailable) return;

    // Initial check for upcoming appointments
    const checkAppointments = async () => {
      try {
        await appointmentService.checkUpcomingAppointments();
      } catch (error) {
        console.error('Error checking appointments:', error);
        
        // If we get a 404, it means the endpoint doesn't exist
        if (error.response && error.response.status === 404) {
          console.log('Notification endpoints not available. Disabling reminder checks.');
          setIsBackendAvailable(false);
        }
      }
    };

    // Check for appointments initially and then every hour
    checkAppointments();
    const intervalId = setInterval(checkAppointments, 60 * 60 * 1000); // Every hour

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isBackendAvailable]);

  return null;
};

// Layout component to handle the consistent structure
// while allowing individual pages to control their own content
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { bgSettings } = useBackgroundSettings();
  
  // Get icon colors from theme or custom colors
  const getIconColors = () => {
    if (bgSettings.iconColorTheme === 'custom') {
      return bgSettings.customIconColors;
    }
    
    // Default theme colors
    const themes = {
      default: {
        primary: 'var(--primary-color)',
        secondary: 'var(--highlight-blue)',
        accent: 'var(--success-color)'
      },
      medical: {
        primary: '#00A3E0',
        secondary: '#EF426F',
        accent: '#8CC63F'
      },
      calm: {
        primary: '#7B68EE',
        secondary: '#9370DB',
        accent: '#BA55D3'
      },
      ocean: {
        primary: '#0088CC',
        secondary: '#00AEC4',
        accent: '#20C4D8'
      },
      vibrant: {
        primary: '#FF5722',
        secondary: '#03A9F4',
        accent: '#FFEB3B'
      }
    };
    
    return themes[bgSettings.iconColorTheme as keyof typeof themes] || themes.default;
  };
  
  return (
    <>
      <Background 
        showFloatingIcons={bgSettings.showFloatingIcons}
        showPattern={bgSettings.showPattern}
        patternOpacity={bgSettings.patternOpacity}
        patternType={bgSettings.patternType}
        backgroundColor={bgSettings.backgroundColor}
        iconDensity={bgSettings.iconDensity}
        iconSpeed={bgSettings.iconSpeed}
        iconSize={bgSettings.iconSize}
        iconGlow={bgSettings.iconGlow}
        iconColors={getIconColors()}
        iconOpacity={bgSettings.iconOpacity}
        iconTrajectory={bgSettings.iconTrajectory}
        iconRotation={bgSettings.iconRotation}
        iconDistribution={bgSettings.iconDistribution}
        iconPulse={bgSettings.iconPulse}
        patternSize={bgSettings.patternSize}
        patternAnimation={bgSettings.patternAnimation}
        patternSpeed={bgSettings.patternSpeed}
        className="flex flex-col"
      >
        <Navbar />
        <AppointmentReminders />
        <TestNotificationButton />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </Background>
    </>
  );
};

function App() {
  // Clear all mock data from localStorage on startup, not real user data
  useEffect(() => {
    console.log('Cleaning up mock data from local storage on app startup');
    
    // Clear mock data
    const mockKeysToRemove = [
      'mockNotifications',
      'mockNotificationsInitialized',
      'mockSentEmails',
      'backendApiUrl'
    ];
    
    mockKeysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Check for any keys with "mock" in the name and remove them
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('mock')) {
        console.log(`Removing mock data: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Check if we have a demo user in localStorage (always clear demo/mock user)
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && (user.first_name === 'Demo' || user.email.includes('demo'))) {
          console.log('Removed demo user data');
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    console.log('Cleared mock data from localStorage');
    
    // Check if we have valid user data
    const userToken = localStorage.getItem('token');
    const userData2 = localStorage.getItem('user');
    
    if (userToken && !userData2) {
      console.log('Found token but no user data, triggering re-fetch');
      // Only trigger a refresh if we have a token but no user data
      window.dispatchEvent(new CustomEvent('refresh-user'));
    }

    /* REMOVED: Repair login button functionality
    // Add a "repair login" button to the UI
    const addRepairButton = () => {
      const existingButton = document.getElementById('repair-login-button');
      if (existingButton) return; // Don't add twice
      
      const button = document.createElement('button');
      button.id = 'repair-login-button';
      button.innerText = 'Repair Login';
      button.style.position = 'fixed';
      button.style.bottom = '10px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.padding = '5px 10px';
      button.style.backgroundColor = '#00C1D4';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.style.cursor = 'pointer';
      button.style.fontSize = '12px';
      button.onclick = () => {
        // Clear user data but keep token
        localStorage.removeItem('user');
        
        // Trigger refresh of user profile
        window.dispatchEvent(new CustomEvent('refresh-user'));
        
        // Notify the user
        alert('Login data has been repaired. Your profile should be fixed now.');
      };
      
      document.body.appendChild(button);
    };
    
    // Delayed to ensure DOM is fully loaded
    setTimeout(addRepairButton, 1000);
    */
  }, []);

  return (
    <BackgroundProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Toaster richColors position="top-center" closeButton />
            <AppointmentReminders />
            <Layout>
              <AppRoutes />
            </Layout>
            <TestNotificationButton />
          </div>
        </AuthProvider>
      </Router>
    </BackgroundProvider>
  );
}

export default App;
