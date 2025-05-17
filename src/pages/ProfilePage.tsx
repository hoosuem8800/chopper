import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Bell, Clock, MapPin, Phone, Calendar, X, AlertCircle, Edit, Mail, CheckCircle, Award, Settings2, Plus, Stethoscope, Eye, FileText, Pencil, ArrowLeft, ArrowRight, Lock, BellRing, Save, Loader2, Check } from 'lucide-react';
import FloatingIcons from '@/components/FloatingIcons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { profileService, appointmentService, consultationService } from '@/services/api';
import ProfilePictureEditor from '@/components/ProfilePictureEditor';
import { customToast } from '@/lib/toast';
import { API_BASE_URL } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import NotificationDisplay from '@/components/NotificationDisplay';
import LimitedNotificationDisplay from '@/components/LimitedNotificationDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { TimePickerInput } from "@/components/ui/time-picker"
import { toast } from "@/components/ui/use-toast"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { Calendar as DatePicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getProfilePictureUrl } from '@/services/api';
import { LoaderCircle } from 'lucide-react';
import { timeUtils } from '@/services/api';

// Declare the global window property for TypeScript
declare global {
  interface Window {
    userRefreshTimeout: ReturnType<typeof setTimeout> | null;
  }
}

// Initialize the global timeout variable
if (typeof window !== 'undefined') {
  window.userRefreshTimeout = null;
}

const ProfileHeader = ({ user }) => {
  return null; // Remove the entire profile container
};

// Global animation styles
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutLeft {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(-30px); }
    }
    
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(30px); }
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 180, 216, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 180, 216, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 180, 216, 0); }
    }
    
    @keyframes subtleFloat {
      0%, 100% { transform: translateY(0) translateX(0); }
      25% { transform: translateY(-2px) translateX(1px); }
      50% { transform: translateY(0) translateX(2px); }
      75% { transform: translateY(1px) translateX(0); }
    }
    
    .animate-subtle-float {
      animation: subtleFloat 8s ease-in-out infinite;
    }
    
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    
    .animate-slide-right {
      animation: slideInRight 0.6s ease-out;
    }
    
    .animate-slide-left {
      animation: slideInLeft 0.6s ease-out;
    }
    
    .animate-slide-out-left {
      animation: slideOutLeft 0.3s ease-in-out forwards;
    }
    
    .animate-slide-out-right {
      animation: slideOutRight 0.3s ease-in-out forwards;
    }
    
    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out forwards;
    }
    
    .animate-slide-in-left {
      animation: slideInLeft 0.3s ease-out forwards;
    }
    
    .animate-pulse-soft {
      animation: pulse 2s infinite;
    }
    
    .animate-delay-100 {
      animation-delay: 100ms;
    }
    
    .animate-delay-200 {
      animation-delay: 200ms;
    }
    
    .animate-delay-300 {
      animation-delay: 300ms;
    }
    
    .card-transition-enter {
      opacity: 0;
      transform: translateX(30px) scale(0.95);
    }
    
    .card-transition-enter-active {
      opacity: 1;
      transform: translateX(0) scale(1);
      transition: opacity 500ms, transform 500ms;
    }
    
    .card-transition-exit {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    
    .card-transition-exit-active {
      opacity: 0;
      transform: translateX(-30px) scale(0.95);
      transition: opacity 500ms, transform 500ms;
    }
  `}} />
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [appointmentCancelling, setAppointmentCancelling] = useState(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    profileImage: '/placeholder.svg',
  });
  
  const [editing, setEditing] = useState(false);
  const [tempUserData, setTempUserData] = useState({ ...userData });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [fileUpload, setFileUpload] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showProfilePictureEditor, setShowProfilePictureEditor] = useState(false);

  // Initialize active tab from URL query parameter
  const defaultTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentConsultationPage, setCurrentConsultationPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(1); // Show only 1 appointment per page
  const [appointmentAnimating, setAppointmentAnimating] = useState<boolean>(false);
  const [consultationAnimating, setConsultationAnimating] = useState<boolean>(false);
  const [appointmentAnimationDirection, setAppointmentAnimationDirection] = useState<'next' | 'prev'>('next');
  const [consultationAnimationDirection, setConsultationAnimationDirection] = useState<'next' | 'prev'>('next');

  // Add state for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Add new state for tracking status updates
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add new state for date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Add a refresh counter state
  const [refreshCount, setRefreshCount] = useState(0);

  // Use a ref to track if we've already done a user data update
  const userDataUpdated = useRef(false);

  // Force background refresh when profile page mounts
  useEffect(() => {
    // Dispatch custom event to ensure background settings are applied
    window.dispatchEvent(new CustomEvent('background-settings-refresh'));
    
    // Additionally, trigger the routechange event to ensure BackgroundContext updates
    window.dispatchEvent(new CustomEvent('routechange'));

    // This also helps when directly navigating to the profile page
    const path = location.pathname;
    if (path.includes('profile')) {
      console.log('ProfilePage: Refreshing background for profile page');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('background-settings-refresh'));
      }, 100);
    }
  }, [location]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    if (value === 'appointments') {
      setCurrentPage(1); // Reset to first page when switching to appointments tab
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && !appointmentAnimating) {
      setAppointmentAnimationDirection(newPage > currentPage ? 'next' : 'prev');
      setAppointmentAnimating(true);
      setTimeout(() => {
        setCurrentPage(newPage);
        setTimeout(() => setAppointmentAnimating(false), 300);
      }, 300);
    }
  };

  const handleConsultationPageChange = (newPage: number) => {
    if (newPage !== currentConsultationPage && !consultationAnimating) {
      setConsultationAnimationDirection(newPage > currentConsultationPage ? 'next' : 'prev');
      setConsultationAnimating(true);
      setTimeout(() => {
        setCurrentConsultationPage(newPage);
        setTimeout(() => setConsultationAnimating(false), 300);
      }, 300);
    }
  };

  // Helper function to get the full profile image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.svg';
    
    // Handle case where path might already be a full URL
    if (imagePath.includes('://')) return imagePath;
    
    // Check for doubled paths (a common issue)
    if (imagePath.includes('/media/profile_pictures//media/profile_pictures/')) {
      // Extract just the filename
      const parts = imagePath.split('/media/profile_pictures/');
      const filename = parts[parts.length - 1];
      return getProfilePictureUrl(filename);
    }
    
    return getProfilePictureUrl(imagePath);
  };

  // Load saved notification preferences
  useEffect(() => {
    if (user && user.id) {
      // Load email notification preferences
      const savedEmailPref = localStorage.getItem(`user_${user.id}_emailNotifications`);
      if (savedEmailPref !== null) {
        setEmailNotifications(JSON.parse(savedEmailPref));
      }
      
      // Load app notification preferences
      const savedAppPref = localStorage.getItem(`user_${user.id}_appNotifications`);
      if (savedAppPref !== null) {
        setAppNotifications(JSON.parse(savedAppPref));
      }
    }
  }, [user]);

  // Fetch user profile data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Early exit if we've fetched more than twice to prevent infinite loops
    if (refreshCount > 2) {
      console.log('Skipping additional profile fetch to prevent loop, refreshCount:', refreshCount);
      return;
    }
    
    const fetchProfile = async () => {
      if (!token) {
        console.log('No token available, profile fetch aborted');
          return;
        }
        
      setLoading(true);
      try {
        console.log('Fetching profile from API');
        const profileResponse = await profileService.getProfile();
        console.log('Profile API response:', profileResponse);
        
        // The response should now always be an array of profiles
        if (Array.isArray(profileResponse) && profileResponse.length > 0) {
          // Get the first profile from the array
          const profileData = profileResponse[0];
          
          if (profileData) {
            console.log('Processing profile data:', profileData);
            setProfileData(profileData);
            
            // Extract user data from profile - this can be an object or just an ID
            let foundUser = null;
            let userId = null;
            
            // Try to extract user info from token
            try {
              const token = localStorage.getItem('token');
              if (token && token.split('.').length === 3) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.user_id) {
                  userId = payload.user_id;
                  console.log('Token contains user_id:', userId);
                }
              }
            } catch (error) {
              console.error('Error parsing token:', error);
            }
            
            // Check if we have a real user object in the profile data
            if (typeof profileData.user === 'object' && profileData.user !== null) {
              console.log('Found user object in profile data:', profileData.user);
              foundUser = profileData.user;
              userId = foundUser.id;
            } else if (typeof profileData.user === 'number') {
              console.log('Found user ID in profile data:', profileData.user);
              userId = profileData.user;
              
              // Try to fetch real user data using the ID
              try {
                console.log(`Attempting to fetch user data for ID ${userId} from API...`);
                const userResponse = await api.get(`/users/${userId}/`);
                if (userResponse.data) {
                  console.log('Successfully fetched user data:', userResponse.data);
                  foundUser = userResponse.data;
                }
              } catch (error) {
                console.error('Failed to fetch user data from API:', error);
              }
            }
            
            // Get profile data fields
            const phoneNumber = profileData.phone_number || profileData.phoneNumber || '';
            const address = profileData.address || '';
            const imageUrl = getFullImageUrl(profileData.profile_picture || profileData.profilePicture);
            
            // If we have user data, use it; otherwise use minimal blank values
            let firstName = '';
            let lastName = '';
            let email = '';
            
            if (foundUser) {
              firstName = foundUser.first_name || foundUser.firstName || '';
              lastName = foundUser.last_name || foundUser.lastName || '';
              email = foundUser.email || '';
            }
            
            // Create user data for display - no fallbacks to localStorage
            const userDataForDisplay = {
              firstName,
              lastName,
              email,
              phoneNumber,
              address,
              profileImage: imageUrl || '/placeholder.svg',
            };
            
            console.log('Final user data for display:', userDataForDisplay);
            setUserData(userDataForDisplay);
            setTempUserData({...userDataForDisplay});
            
            // Only update auth context once to avoid loops
            if (foundUser && userId && (firstName || lastName || email) && !userDataUpdated.current) {
              // Dispatch an event to update auth context
              console.log('Updating auth context with real user data');
              const realUserData = {
                id: userId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                profile_picture: imageUrl || 'placeholder',
                // Only include essential fields, don't mix with existing data
                username: foundUser.username || `user_${userId}`,
                role: foundUser.role || 'user'
              };
              
              // Check if we need to refresh the user context by comparing profiles
              // Only refresh if there are actual differences to prevent infinite loops
              const significantChanges = compareUserData(realUserData, user);
              if (significantChanges) {
                console.log('User data changed - refreshing auth context');
              
              // Save to localStorage for persistence (completely replacing any mock data)
              localStorage.setItem('user', JSON.stringify(realUserData));
              
                // Mark that we've updated the user data to prevent future refreshes
                userDataUpdated.current = true;
                
                // Use a debounced refresh to prevent multiple rapid refresh events
                if (!window.userRefreshTimeout) {
                  window.userRefreshTimeout = setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refresh-user'));
                    window.userRefreshTimeout = null;
                    // Increment our refresh counter
                    setRefreshCount(prev => prev + 1);
                  }, 2000); // Only refresh at most once every 2 seconds
                }
              } else {
                console.log('No changes in user data - skipping auth context refresh');
              }
            }
          } else {
            console.log('Profile data is empty in the response array');
            customToast.error('Failed to load profile data');
          }
        } else {
          console.log('No profile data found in the response array');
          customToast.error('Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        customToast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [isAuthenticated, navigate, token, user, refreshCount]);

  // Fetch appointments whenever the appointments tab is active
  useEffect(() => {
    if (activeTab === 'appointments' && isAuthenticated) {
      fetchAppointments();
      fetchConsultations();
    }
  }, [activeTab, isAuthenticated]);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentService.getAppointments();
      
      // Filter to ensure only current user's appointments are shown
      const filteredData = user?.id ? data.filter(appointment => 
        appointment.user?.id === user.id || appointment.patient_id === user.id
      ) : data;
      
      // Sort appointments by date (newest first)
      const sortedAppointments = [...filteredData].sort((a, b) => 
        new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      );
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      customToast.error('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchConsultations = async () => {
    setLoadingConsultations(true);
    try {
      const data = await consultationService.getConsultations();
      
      // Filter to ensure only current user's consultations are shown
      let filteredData = data;
      if (user?.id) {
        if (user.role === 'doctor') {
          filteredData = data.filter(consultation => 
            consultation.doctor?.id === user.id
          );
        } else if (user.role !== 'admin') {
          // For regular users/patients
          filteredData = data.filter(consultation => 
            consultation.patient?.id === user.id || 
            consultation.patient === user.id
          );
        }
      }
      
      // Sort consultations by date (newest first)
      const sortedConsultations = [...filteredData].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Make sure each consultation has doctor_phone field
      const enhancedConsultations = sortedConsultations.map(consultation => {
        if (!consultation.doctor_phone && consultation.doctor) {
          // Generate a unique phone number for each doctor based on their name
          const firstName = consultation.doctor.first_name || '';
          const lastName = consultation.doctor.last_name || '';
          const doctorId = consultation.id || 1000;
          
          // Hash the doctor name to create a unique but consistent phone number
          const hash = (firstName.length * 100) + lastName.length + (doctorId % 10);
          const areaCode = 300 + (hash % 700); // Random area code between 300-999
          const prefix = 100 + (hash % 900); // First 3 digits of local number (100-999)
          const lineNumber = 1000 + (hash % 9000); // Last 4 digits (1000-9999)
          
          const uniquePhone = `+1 (${areaCode}) ${prefix}-${lineNumber}`;
          
          return {
            ...consultation,
            doctor_name: consultation.doctor_name || `Dr. ${firstName} ${lastName}`,
            doctor_phone: uniquePhone
          };
        }
        return consultation;
      });
      
      setConsultations(enhancedConsultations);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      customToast.error('Failed to load consultations');
    } finally {
      setLoadingConsultations(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setAppointmentCancelling(appointmentId);
    try {
      await appointmentService.cancelAppointment(appointmentId);
      customToast.success('Appointment cancelled successfully');
      fetchAppointments(); // Refresh the appointments list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      customToast.error('Failed to cancel appointment');
    } finally {
      setAppointmentCancelling(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date format';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // Format time for display with consistent timezone handling
  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'No time available';
      
      // Parse the date string into a Date object
      const date = new Date(dateString);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid time format';
      }
      
      // Extract time components without timezone conversion
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Convert to 12-hour format using timeUtils for consistency
      const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return timeUtils.to12Hour(time24);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time unavailable';
    }
  };

  const handleEdit = (appointment) => {
    // Parse the appointment date_time field
    const appointmentDate = new Date(appointment.date_time);
    
    // Log appointment details for debugging
    console.log('Editing appointment:', {
      id: appointment.id,
      originalDateTime: appointment.date_time,
      parsedDate: appointmentDate
    });
    
    // Set state for the dialog
    setSelectedAppointmentId(appointment.id.toString());
    setSelectedDate(appointmentDate);
    
    // Extract time components without timezone conversion
    const hours = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();
    
    // Create a standardized time string in 24-hour format (HH:MM)
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setSelectedTime(timeString);
    
    // Log the extracted time for debugging
    console.log('Extracted time:', timeString);
    
    // Reset to first page when editing
    setCurrentPage(1);
    
    // Open the dialog
    setIsEditDialogOpen(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setTempUserData({ ...userData });
    // Ensure profile picture editor is closed if it was open
    if (showProfilePictureEditor) {
      setShowProfilePictureEditor(false);
    }
  };

  const handleSave = async () => {
    // Stop if a save is already in progress
    if (loading || buttonDisabled) {
      console.log("Save prevented - loading or button disabled");
      return;
    }

    // Disable the button immediately to prevent multiple clicks
    setButtonDisabled(true);
    
    // Close profile picture editor if it's open
    if (showProfilePictureEditor) {
      setShowProfilePictureEditor(false);
    }
    
    if (!user?.id) {
      customToast.error('User ID not found');
      setButtonDisabled(false);
      return;
    }
    
    setLoading(true);
    try {
      // Create a copy of the data for updates
      const updatedUserData = { ...userData };
      let updatesMade = false;
      
      // Prepare user data update if needed
        if (tempUserData.firstName !== userData.firstName || 
            tempUserData.lastName !== userData.lastName || 
            tempUserData.email !== userData.email) {
          
          const userUpdateData = {
            first_name: tempUserData.firstName,
            last_name: tempUserData.lastName,
            email: tempUserData.email
          };
        
        console.log('Updating user data:', userUpdateData);
          
          try {
          await api.patch(`/users/${user.id}/`, userUpdateData);
          
          updatedUserData.firstName = tempUserData.firstName;
          updatedUserData.lastName = tempUserData.lastName;
          updatedUserData.email = tempUserData.email;
          
          updatesMade = true;
          console.log('User data updated successfully');
        } catch (error) {
          console.error('Error updating user data:', error);
          customToast.error('Failed to update user data');
        }
      }
      
      // Prepare profile data update if needed
      if (tempUserData.phoneNumber !== userData.phoneNumber || 
          tempUserData.address !== userData.address ||
          fileUpload !== null) {
        
        const profileUpdateData = {
          phone_number: tempUserData.phoneNumber,
          address: tempUserData.address
        };
        
        console.log('Updating profile data:', profileUpdateData);
        
        try {
          let profileResponse;
          
          // Use the appropriate method based on whether we have a file upload
          if (fileUpload) {
            console.log('Updating profile with new profile picture');
            profileResponse = await profileService.updateProfileWithPicture(
              user.id,
              profileUpdateData,
              fileUpload
            );
          } else {
            // Use the regular update method for profile data
            profileResponse = await profileService.updateProfile(
              user.id,
              profileUpdateData
            );
          }
          
          console.log('Profile update response:', profileResponse);
          
          // Update local data if we got a successful response
          if (profileResponse && profileResponse.profile) {
            updatedUserData.phoneNumber = tempUserData.phoneNumber;
            updatedUserData.address = tempUserData.address;
            
            // If we have a new profile picture URL in the response, update it
            if (fileUpload && profileResponse.profile.profile_picture) {
              const fullImageUrl = getFullImageUrl(profileResponse.profile.profile_picture);
              updatedUserData.profileImage = fullImageUrl;
              console.log('Updated profile picture URL:', fullImageUrl);
            }
            
            updatesMade = true;
            console.log('Profile data updated successfully');
          }
        } catch (error) {
          console.error('Error updating profile data:', error);
          customToast.error('Failed to update profile data');
        }
      }
      
      if (updatesMade) {
        // Update the user data state with all changes
        setUserData(updatedUserData);
          customToast.success('Profile updated successfully');
        // Reset file upload state
        setFileUpload(null);
        // Exit editing mode
    setEditing(false);
          } else {
        console.log('No changes made to profile');
        }
    } catch (error) {
      console.error('Error in handleSave:', error);
      customToast.error('Failed to update profile');
    } finally {
      setLoading(false);
      setFileUpload(null);
      
      // Re-enable the button after 1.5 seconds to prevent rapid clicks
      setTimeout(() => {
        setButtonDisabled(false);
      }, 1500);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempUserData({ ...tempUserData, [name]: value });
  };

  // Handle file selection from profile picture editor
  const handleFileSelect = (file: File | null) => {
    console.log('File selected from profile picture editor:', file);
    if (file) {
      // Validate file size before upload (5MB)
      if (file.size > 5 * 1024 * 1024) {
        customToast.error('File size too large. Maximum size is 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        customToast.error('Invalid file type. Allowed types: JPEG, PNG, GIF');
        return;
      }
      
      setImageLoading(true);
      setFileUpload(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempUserData({
          ...tempUserData,
          profileImage: event.target?.result as string
        });
        setUserData({
          ...userData,
          profileImage: event.target?.result as string
        });
        setImageLoading(false);
      };
      reader.onerror = () => {
        customToast.error('Failed to load image');
        setImageLoading(false);
        setFileUpload(null);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle removing the image
      setFileUpload(null);
      setTempUserData({
        ...tempUserData,
        profileImage: '/placeholder.svg'
      });
      setUserData({
        ...userData,
        profileImage: '/placeholder.svg'
      });
    }
    // Always close the editor when a file is selected or cancelled
    setShowProfilePictureEditor(false);
  };

  const handlePasswordChange = () => {
    // In a real app, this would trigger a password reset flow
    customToast.success('Password reset email sent');
  };

  const handleNotificationToggle = (type) => {
    if (type === 'email') {
      setEmailNotifications(!emailNotifications);
      
      // Save email notification preference
      if (user && user.id) {
        localStorage.setItem(`user_${user.id}_emailNotifications`, JSON.stringify(!emailNotifications));
      }
      
      customToast.success(!emailNotifications ? 'Email notifications enabled' : 'Email notifications disabled');
    } else {
      setAppNotifications(!appNotifications);
      
      // Save app notification preference 
      if (user && user.id) {
        localStorage.setItem(`user_${user.id}_appNotifications`, JSON.stringify(!appNotifications));
      }
      
      customToast.success(!appNotifications ? 'App notifications enabled' : 'App notifications disabled');
    }
  };

  // Create a timezone-aware date to ensure consistent timezone handling
  const createTimezoneAwareDate = (dateObj: Date, timeString: string): Date => {
    console.log('Creating timezone-aware date with:', { dateObj, timeString });
    
    // Format the date portion to ISO format YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    
    // Create date string in YYYY-MM-DD format
    const dateString = `${year}-${month}-${day}`;
    
    // Use the timeUtils function for consistent date creation
    return timeUtils.createTimezoneAwareDate(dateString, timeString);
  };

  const handleTimeUpdate = async () => {
    if (!selectedAppointmentId || !selectedTime || !selectedDate) return;
    
    try {
      setUpdatingStatus(true);
      
      console.log('Starting appointment update with:', {
        appointmentId: selectedAppointmentId,
        selectedDate: format(selectedDate, "yyyy-MM-dd"),
        selectedTime
      });
      
      // Create a date object from the selected date and time
      const newDateTime = createTimezoneAwareDate(selectedDate, selectedTime);
      const isoString = newDateTime.toISOString();
      
      console.log('Updating appointment with ISO string:', isoString);
      
      // Update the appointment using the appointmentService but keep status as 'confirmed'
      await appointmentService.updateAppointment(parseInt(selectedAppointmentId), {
        date_time: isoString,
        status: 'confirmed'
      });
      
      // Update local state after successful API call
      const updatedAppointments = appointments.map(apt => 
        apt.id === selectedAppointmentId 
          ? { ...apt, status: 'confirmed', date_time: isoString }
          : apt
      ).sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
      
      // Update appointments state with the new array
      setAppointments(updatedAppointments);
      
      // Reset to page 1 after modification
      setCurrentPage(1);
      
      setIsEditDialogOpen(false);
      toast({
        title: "Appointment Updated",
        description: "Your appointment has been rescheduled successfully.",
      });
      
      customToast.success("Appointment rescheduled successfully");
    } catch (error) {
      console.error('Failed to update appointment time:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [allTimeSlots] = useState<string[]>([
        "09:00",
        "10:00",
        "11:00",
        "14:00",
        "15:00",
        "16:00"
  ]);
  
  const [takenTimeSlots, setTakenTimeSlots] = useState<string[]>([]);

  // Check if a slot is available - improved to handle different time formats
  const isSlotAvailable = (time: string): boolean => {
    if (!takenTimeSlots || takenTimeSlots.length === 0) {
      return true;
    }
    
    // Normalize the input time for comparison
    // Convert to both 12h and 24h formats for more reliable comparison
    let time24h = time;
    let time12h = time;
    
    if (time.includes('AM') || time.includes('PM')) {
      // If input is in 12-hour format, convert to 24-hour
      time24h = timeUtils.to24Hour(time);
    } else {
      // If input is in 24-hour format, convert to 12-hour
      time12h = timeUtils.to12Hour(time);
    }
    
    // Check both formats against taken slots
    const isTaken = takenTimeSlots.some(takenTime => {
      // Normalize the taken time for comparison
      let takenTime24h = takenTime;
      let takenTime12h = takenTime;
      
      if (takenTime.includes('AM') || takenTime.includes('PM')) {
        takenTime24h = timeUtils.to24Hour(takenTime);
      } else {
        takenTime12h = timeUtils.to12Hour(takenTime);
      }
      
      // Compare in both formats to ensure we catch all matches
      return (
        time24h === takenTime24h || 
        time12h === takenTime12h || 
        time24h === takenTime || 
        time === takenTime24h
      );
    });
    
    return !isTaken;
  };

  const fetchAvailableTimeSlots = async (date: Date) => {
    try {
      // Format date for API call
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log(`Fetching taken slots for date: ${formattedDate}`);
      
      const takenSlotsResponse = await appointmentService.getTakenSlots(formattedDate);
      let newTakenSlots: string[] = [];
      
      // Extract taken slots from the response - normalize formats
      if (takenSlotsResponse && takenSlotsResponse.data) {
        // Process each slot to normalize the formats for better comparison
        newTakenSlots = takenSlotsResponse.data.map(slot => {
          // If it's an ISO string containing T, extract just the time part
          if (slot && typeof slot === 'string' && slot.includes('T')) {
            const dateObj = new Date(slot);
            return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
          }
          return slot;
        });
        
        console.log('Processed taken slots:', newTakenSlots);
      }
      
      setTakenTimeSlots(newTakenSlots);
      
      // Filter available slots (all slots that aren't taken)
      const availableSlots = allTimeSlots.filter(slot => isSlotAvailable(slot));
      console.log('Available slots after filtering:', availableSlots);
      
      setAvailableTimeSlots(availableSlots.length > 0 ? availableSlots : []);
      
      // If currently selected time is now taken, deselect it
      if (selectedTime && !isSlotAvailable(selectedTime)) {
        setSelectedTime("");
        toast({
          title: "Time Unavailable",
          description: "The previously selected time slot is no longer available.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTakenTimeSlots([]);
      setAvailableTimeSlots(allTimeSlots);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const handleCancelConsultation = async (consultationId) => {
    try {
      // Use updateConsultationStatus instead of the non-existent cancelConsultation method
      await consultationService.updateConsultationStatus(consultationId, 'cancelled');
      customToast.success('Consultation cancelled successfully');
      fetchConsultations(); // Refresh the consultations list
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      customToast.error('Failed to cancel consultation');
    }
  };

  // Handle showing profile picture editor
  const handleShowProfileEditor = () => {
    console.log('Opening profile picture editor');
    setShowProfilePictureEditor(true);
  };
  
  // Handle closing profile picture editor
  const handleCloseProfileEditor = () => {
    console.log('Closing profile picture editor');
    setShowProfilePictureEditor(false);
  };

  // Helper function to compare user data objects to prevent unnecessary refreshes
  const compareUserData = (newData, oldData) => {
    if (!oldData) return true; // Always refresh if there's no current user data
    
    // Only consider a few essential fields that would require a refresh
    // If the IDs are the same, it's likely the same user regardless of other fields
    if (newData.id !== oldData.id) return true;
    
    // Compare name fields only if they actually change from empty to non-empty
    // Otherwise, small differences aren't worth a refresh
    if (!oldData.first_name && newData.first_name) return true;
    if (!oldData.last_name && newData.last_name) return true;
    
    // Only refresh for email change if the previous one was empty
    if (!oldData.email && newData.email) return true;
    
    // Only refresh for profile picture if it's a significant change 
    // (from placeholder to a real picture or vice versa)
    const oldPicIsPlaceholder = !oldData.profile_picture || oldData.profile_picture === 'placeholder';
    const newPicIsPlaceholder = !newData.profile_picture || newData.profile_picture === 'placeholder';
    if (oldPicIsPlaceholder !== newPicIsPlaceholder) return true;
    
    // Check if the role has changed - this is important
    if (newData.role !== oldData.role) return true;
    
    // No significant changes that would require a refresh
    return false;
  };

  // Format the time slot for display (convert 24h to 12h format with AM/PM)
  const formatTimeSlotForDisplay = (timeSlot: string): string => {
    // If already in 12-hour format, return as is
    if (timeSlot.includes('AM') || timeSlot.includes('PM')) {
      return timeSlot;
    }
    return timeUtils.to12Hour(timeSlot);
  };

  if (loading && !profileData) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
              </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full py-4 sm:py-6 md:py-10">
      <GlobalStyles />
      <div className="w-full max-w-6xl px-3 sm:px-6 lg:px-8 mt-2 sm:mt-4 mb-16 sm:mb-20">
        {/* Modern Profile Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100/50">
          {/* Tab navigation */}
          <Tabs defaultValue={activeTab} className="w-full" onValueChange={handleTabChange}>
            <div className="border-t border-b border-gray-100 bg-gray-50/80">
              <div className="max-w-4xl mx-auto">
                <TabsList className="w-full flex justify-center gap-2 sm:gap-4 p-0 bg-transparent border-0 shadow-none">
                <TabsTrigger 
                  value="profile" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-2 sm:px-4 py-2 sm:py-3
                      group transition-all duration-300 hover:text-cyan-500 border-0 rounded-none flex-1 max-w-xs"
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <User size={16} className="transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:text-cyan-500" />
                    <span className="font-medium text-xs sm:text-sm md:text-base hidden data-[state=active]:inline sm:inline">Profile</span>
                  </div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  id="notifications-tab"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-2 sm:px-4 py-2 sm:py-3
                      group transition-all duration-300 hover:text-cyan-500 border-0 rounded-none flex-1 max-w-xs"
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Bell size={16} className="transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:text-cyan-500" />
                    <span className="font-medium text-xs sm:text-sm md:text-base hidden data-[state=active]:inline sm:inline">Notifications</span>
                  </div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                </TabsTrigger>
                <TabsTrigger 
                  value="appointments" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-2 sm:px-4 py-2 sm:py-3
                      group transition-all duration-300 hover:text-cyan-500 border-0 rounded-none flex-1 max-w-xs"
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Clock size={16} className="transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:text-cyan-500" />
                    <span className="font-medium text-xs sm:text-sm md:text-base hidden data-[state=active]:inline sm:inline">Appointments</span>
                  </div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                </TabsTrigger>
              </TabsList>
              </div>
            </div>
            
            <TabsContent value="profile" className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                    {editing ? (
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    {/* Form header with gradient background */}
                    <div className="bg-gradient-to-r from-cyan-500/90 to-primary/90 p-6 text-white">
                      <div className="flex items-center">
                        <Pencil className="h-5 w-5 mr-2 opacity-80" />
                        <h3 className="text-xl font-semibold">Edit Your Profile</h3>
                      </div>
                      <p className="text-white/80 mt-1 text-sm">Update your personal information and preferences</p>
                    </div>
                    
                    {/* Form content */}
                    <form className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* User Identity Section */}
                      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                        <div className="relative mx-auto sm:mx-0" onClick={handleShowProfileEditor}>
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 cursor-pointer hover:border-primary/70 transition-all duration-300">
                            <AvatarImage src={tempUserData.profileImage} alt={`${tempUserData.firstName} ${tempUserData.lastName}`} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {tempUserData.firstName?.[0]}{tempUserData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-md">
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                    </div>
                        <div className="text-center sm:text-left">
                          <h4 className="text-gray-800 font-medium mb-1">Profile Picture</h4>
                          <p className="text-gray-500 text-xs sm:text-sm">Click on the image to change your profile picture</p>
                      </div>
                  </div>
                      
                      {/* Personal Details Section */}
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-5 border border-gray-200">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mr-2 sm:mr-3">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <h4 className="text-sm sm:text-base font-medium">Personal Details</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1 sm:space-y-2">
                            <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-gray-700">First Name</Label>
                          <Input 
                            id="firstName" 
                            name="firstName" 
                            value={tempUserData.firstName} 
                            onChange={handleInputChange} 
                              placeholder="Enter your first name"
                              className="h-9 sm:h-11 text-sm border-gray-200 focus:border-primary focus:ring-primary/30 transition-colors duration-200"
                          />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                            <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-gray-700">Last Name</Label>
                          <Input 
                            id="lastName" 
                            name="lastName" 
                            value={tempUserData.lastName} 
                            onChange={handleInputChange} 
                              placeholder="Enter your last name"
                              className="h-9 sm:h-11 text-sm border-gray-200 focus:border-primary focus:ring-primary/30 transition-colors duration-200"
                          />
                        </div>
                          <div className="space-y-1 sm:space-y-2 sm:col-span-2">
                            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={tempUserData.email} 
                          onChange={handleInputChange} 
                            placeholder="Enter your email"
                              className="h-9 sm:h-11 text-sm border-gray-200 focus:border-primary focus:ring-primary/30 transition-colors duration-200"
                        />
                      </div>
                        </div>
                      </div>
                      
                      {/* Contact Information Section */}
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-5 border border-gray-200">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mr-2 sm:mr-3">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <h4 className="text-sm sm:text-base font-medium">Contact Information</h4>
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="phoneNumber" className="text-xs sm:text-sm font-medium text-gray-700">Phone Number</Label>
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber" 
                          type="tel" 
                          value={tempUserData.phoneNumber} 
                          onChange={handleInputChange} 
                            placeholder="Enter your phone number"
                              className="h-9 sm:h-11 text-sm border-gray-200 focus:border-primary focus:ring-primary/30 transition-colors duration-200"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="address" className="text-xs sm:text-sm font-medium text-gray-700">Address</Label>
                        <Input 
                          id="address" 
                          name="address" 
                          value={tempUserData.address} 
                          onChange={handleInputChange} 
                            placeholder="Enter your address"
                              className="h-9 sm:h-11 text-sm border-gray-200 focus:border-primary focus:ring-primary/30 transition-colors duration-200"
                        />
                      </div>
                                    </div>
                              </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleCancel} 
                          className="w-full sm:w-auto h-11 border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                          disabled={loading || buttonDisabled}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          className="w-full sm:w-auto h-11 bg-primary hover:bg-white hover:text-cyan-500 hover:border hover:border-cyan-300 hover:shadow-md transition-all duration-200"
                          disabled={loading || buttonDisabled}
                        >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                            Saving...
                          </span>
                        ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Update Profile
                            </>
                        )}
                      </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {/* Profile Info Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 md:col-span-3 overflow-hidden">
                    <div className="p-6">
                      {/* Updated card-based personal information section */}
                      <div className="max-w-4xl mx-auto space-y-6">
                        {/* Basic Information Card */}
                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                            <div className="bg-white p-1.5 rounded-full border-4 border-white shadow-md">
                              <Avatar className="h-16 w-16 sm:h-18 sm:w-18">
                                <AvatarImage src={userData.profileImage} alt={`${userData.firstName} ${userData.lastName}`} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {userData.firstName?.[0]}{userData.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="text-center sm:text-left">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{userData.firstName} {userData.lastName}</h3>
                              <div className="flex items-center justify-center sm:justify-start text-gray-500 mb-2">
                                <Mail className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                                <span className="text-sm">{userData.email}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:scale-105 transition-transform duration-200 text-[10px] px-2 py-0.5">
                                  <User className="h-2.5 w-2.5 mr-0.5" />
                                  {user?.role || 'User'}
                                </Badge>
                                
                                {user?.subscription_type === 'premium' && (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:scale-105 transition-transform duration-200 text-[10px] px-2 py-0.5">
                                    <Award className="h-2.5 w-2.5 mr-0.5" />
                                    Premium
                                  </Badge>
                                )}
                                
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:scale-105 transition-transform duration-200 text-[10px] px-2 py-0.5">
                                  <div className="flex items-center gap-0.5">
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>Joined {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                  </div>
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mt-4 sm:mt-0 sm:ml-auto">
                        <Button 
                                onClick={() => setEditing(true)} 
                                className="h-7 bg-primary hover:bg-white hover:text-cyan-500 hover:border hover:border-cyan-300 hover:shadow-md transition-all duration-200 text-xs px-3"
                        >
                                <Pencil className="h-3 w-3 mr-1" />
                                <span className="text-xs">Edit</span>
                      </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Information Cards - Improved */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-3">
                            <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-full bg-cyan-50 mr-3">
                              <Phone className="h-4 w-4 text-primary" />
                              </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-700 mb-0.5">Phone Number</h4>
                              <p className="text-gray-700 font-medium text-sm truncate">
                              {userData.phoneNumber || 
                                  <span className="text-gray-400 italic text-xs">Not provided</span>
                              }
                            </p>
                          </div>
                            </div>
                            
                          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-3">
                            <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-full bg-cyan-50 mr-3">
                              <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-700 mb-0.5">Address</h4>
                              <p className="text-gray-700 font-medium text-sm truncate">
                              {userData.address || 
                                  <span className="text-gray-400 italic text-xs">Not provided</span>
                              }
                            </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Notification Preferences Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-center justify-between mb-2 sm:mb-4">
                            <div className="flex items-center">
                              <div className="p-1.5 sm:p-2.5 rounded-lg bg-cyan-50 mr-2 sm:mr-3">
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              </div>
                              <h4 className="text-sm sm:text-base font-medium text-gray-800">Notification Preferences</h4>
                            </div>
                            
                        <Button 
                              className="gap-1 h-7 sm:h-8 bg-primary text-white hover:bg-white hover:text-cyan-500 hover:border hover:border-cyan-300 hover:shadow-md transition-all duration-200 text-xs px-2 sm:px-3"
                              onClick={() => setShowProfileSettings(true)}
                        >
                              <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline text-xs">Settings</span>
                        </Button>
              </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-4">
                            <div className="flex items-center justify-between bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm text-gray-700">Email Notifications</span>
                              </div>
                              <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                                emailNotifications 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {emailNotifications ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <BellRing className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="text-xs sm:text-sm text-gray-700">Push Notifications</span>
                              </div>
                              <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                                appNotifications 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {appNotifications ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notifications" className="p-4 sm:p-6 md:p-8">
              <div className="space-y-4 sm:space-y-6">
                  {/* Header with settings button */}
                  <div className="flex justify-between items-center mb-2 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-800">Notifications</h3>
                    <Button
                      onClick={() => setShowSettings(true)}
                      className="gap-1 h-7 sm:h-8 bg-primary text-white hover:bg-white hover:text-cyan-500 hover:border hover:border-cyan-300 hover:shadow-md transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1"
                      size="sm"
                    >
                      <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                </div>
                
                  {/* Simple Notification Cards */}
                  <div className="space-y-3 sm:space-y-4">
                    <NotificationDisplay />
                  </div>

                {/* Settings Dialog */}
                  {showSettings && (
                    <>
                      {/* Overlay */}
                      <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setShowSettings(false)}
                      />
                      
                      {/* Dialog */}
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 transform transition-all duration-300">
                        <div className="p-3 sm:p-4 border-b flex justify-between items-center">
                          <h3 className="text-base sm:text-lg font-medium">Settings</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowSettings(false)}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>

                        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                          {/* Email Toggle */}
                          <div className="flex items-center justify-between py-1 sm:py-1.5 border-b border-gray-100">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                              <span className="text-sm sm:text-base font-medium text-gray-900">Email</span>
                            </div>
                            <Button 
                              variant={emailNotifications ? "default" : "outline"}
                              onClick={() => handleNotificationToggle('email')}
                              size="sm"
                              className={cn(
                                "min-w-[50px] sm:min-w-[60px] h-7 sm:h-8 text-xs transition-colors duration-200", 
                                emailNotifications 
                                  ? "bg-primary hover:bg-cyan-600" 
                                  : "hover:text-cyan-500 hover:border-cyan-500"
                              )}
                            >
                              {emailNotifications ? 'On' : 'Off'}
                            </Button>
                          </div>
                  
                          {/* In-App Toggle */}
                          <div className="flex items-center justify-between py-1 sm:py-1.5">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                              <span className="text-sm sm:text-base font-medium text-gray-900">App</span>
                            </div>
                            <Button 
                              variant={appNotifications ? "default" : "outline"}
                              onClick={() => handleNotificationToggle('app')}
                              size="sm"
                              className={cn(
                                "min-w-[50px] sm:min-w-[60px] h-7 sm:h-8 text-xs transition-colors duration-200", 
                                appNotifications 
                                  ? "bg-primary hover:bg-cyan-600" 
                                  : "hover:text-cyan-500 hover:border-cyan-500"
                              )}
                            >
                              {appNotifications ? 'On' : 'Off'}
                            </Button>
                          </div>
                        </div>
                    
                        <div className="p-2 sm:p-3 bg-gray-50 rounded-b-xl flex justify-end">
                          <Button 
                            onClick={() => setShowSettings(false)}
                            className="bg-primary hover:bg-cyan-600 transition-colors duration-200 h-7 sm:h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                            size="sm"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </>
                    )}
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Appointments Section */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                  <div className="p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-white to-primary/5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Your Appointments
                    </h3>
                  </div>
                  
                  <div className="p-3 sm:p-5">
                    {loadingAppointments ? (
                      <div className="flex justify-center items-center py-8 sm:py-12">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4 sm:mb-5">
                          <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60" />
                        </div>
                        <h4 className="text-gray-900 text-sm sm:text-base font-medium mb-2 sm:mb-3">No Appointments Found</h4>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-5 sm:mb-7">
                          You don't have any appointments scheduled yet.
                        </p>
                        <Button
                          onClick={() => navigate('/appointments/new')}
                          className="gap-1 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Book Appointment</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Current appointment with animation */}
                      <div className={cn(
                          "transition-all duration-300 ease-in-out min-h-[460px]",
                          appointmentAnimating && appointmentAnimationDirection === 'next' 
                            ? 'animate-slide-out-left' 
                            : appointmentAnimating && appointmentAnimationDirection === 'prev'
                            ? 'animate-slide-out-right'
                            : !appointmentAnimating && appointmentAnimationDirection === 'next'
                            ? 'animate-slide-in-right'
                            : !appointmentAnimating && appointmentAnimationDirection === 'prev'
                            ? 'animate-slide-in-left'
                            : ''
                        )}>
                          {appointments[currentPage - 1] && (
                            <div className="bg-white rounded-lg shadow-sm border relative overflow-hidden min-h-[460px]">
                              {/* Status Strip */}
                              <div 
                                className={cn(
                                  "h-2 w-full",
                                  appointments[currentPage - 1].status === "confirmed" && "bg-cyan-500",
                                  appointments[currentPage - 1].status === "scheduled" && "bg-primary",
                                  appointments[currentPage - 1].status === "pending" && "bg-yellow-400",
                                  appointments[currentPage - 1].status === "completed" && "bg-green-500",
                                  appointments[currentPage - 1].status === "cancelled" && "bg-red-500",
                                  !appointmentAnimating && "animate-pulse-soft"
                                )}
                              />
                              
                              <div className="p-5">
                                {/* Status Badge and Scan Analysis */}
                                <div className={`flex justify-between items-start mb-5 ${!appointmentAnimating ? 'animate-fade-in animate-delay-100' : ''}`}>
                                  <Badge 
                                    variant={
                                      appointments[currentPage - 1].status === "scheduled" ? "default" :
                                      appointments[currentPage - 1].status === "pending" ? "outline" :
                                      appointments[currentPage - 1].status === "completed" ? "success" :
                                      appointments[currentPage - 1].status === "cancelled" ? "destructive" :
                                      "secondary"
                                    }
                                    className={cn(
                                      "capitalize px-3 py-1",
                                      appointments[currentPage - 1].status === "cancelled" && "bg-red-500 hover:bg-red-500"
                                    )}
                                  >
                                    {appointments[currentPage - 1].status}
                                  </Badge>
                                  <span className="text-sm font-medium text-cyan-500">
                                    Scan Consultation
                                    </span>
                                </div>

                                {/* User Information */}
                                <div className={`mb-6 ${!appointmentAnimating ? 'animate-fade-in animate-delay-100' : ''}`}>
                                  <div className="flex items-center gap-2 mb-3 text-cyan-500">
                                    <User className="h-4 w-4" />
                                    <div className="text-xs font-medium uppercase">Patient Information</div>
                                        </div>
                                  <div className="space-y-3 p-4 bg-gray-50/80 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700">{userData.firstName} {userData.lastName}</span>
                                      </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700">{userData.email}</span>
                                          </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        {userData.phoneNumber || 'No phone number'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                {/* Time Details */}
                                <div className={`mb-6 ${!appointmentAnimating ? 'animate-fade-in animate-delay-200' : ''}`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <div className="text-xs font-medium text-gray-500 uppercase">Time Details</div>
                                            </div>
                                  <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700 font-medium">
                                        {formatDate(appointments[currentPage - 1].date_time)}
                                              </span>
                                            </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700 font-medium">
                                        {formatTime(appointments[currentPage - 1].date_time)}
                                      </span>
                                          </div>
                                            </div>
                                            </div>

                                {/* Actions */}
                                {appointments[currentPage - 1].status !== "cancelled" && appointments[currentPage - 1].status !== "completed" && (
                                  <div className={`flex justify-end gap-3 mt-6 ${!appointmentAnimating ? 'animate-fade-in animate-delay-300' : ''}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-10 px-5 transition-all duration-200 hover:scale-105 hover:bg-primary/5 hover:border-primary hover:text-primary"
                                      onClick={() => handleEdit(appointments[currentPage - 1])}
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-2" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-10 px-5 transition-all duration-200 hover:scale-105 hover:bg-red-600 hover:shadow-md"
                                      onClick={() => handleCancelAppointment(appointments[currentPage - 1].id)}
                                    >
                                      <X className="h-3.5 w-3.5 mr-2" />
                                      Cancel
                                    </Button>
                                          </div>
                                )}

                              {/* Cancelled Overlay */}
                              {appointments[currentPage - 1].status === "cancelled" && (
                                <>
                                  {/* Diagonal stripes background */}
                                  <div 
                                    className="absolute inset-0 bg-[length:10px_10px]"
                                    style={{
                                      backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        rgb(239 68 68 / 0.05),
                                        rgb(239 68 68 / 0.05) 10px,
                                        transparent 10px,
                                        transparent 20px
                                      )`
                                    }}
                                  />
                                  
                                  {/* Blur overlay */}
                                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
                                  
                                  {/* Red borders */}
                                  <div className="absolute inset-0 border-2 border-red-200 rounded-lg" />
                                  <div className="absolute inset-[6px] border border-red-300/50 rounded-lg" />
                                  
                                  {/* Cancelled badge with animation */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative transform -rotate-6">
                                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-red-600/30 to-red-500/30 rounded-lg blur-lg animate-pulse" />
                                      <div className="relative flex items-center bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg">
                                        <X className="h-5 w-5 mr-2 animate-bounce" />
                                          <span className="font-bold text-lg">CANCELLED</span>
                                              </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              </div>
                            </div>
                              )}
                              </div>
                                            </div>
                                          )}
                                        </div>

                  {/* Add pagination component inside the card */}
                        {appointments.length > 0 && (
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/80">
                      <div className="flex justify-between items-center">
                          <Button
                          variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || appointmentAnimating}
                          className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                          <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Previous</span>
                          </Button>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {currentPage} of {appointments.length}
                                  </span>
                                <Button
                          variant="outline"
                            size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === appointments.length || appointmentAnimating}
                          className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                          <span>Next</span>
                          <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                      </div>
                      </div>
                    )}
                                  </div>
                
                {/* Consultations Section */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                  <div className="p-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-white to-primary/5">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Your Consultations
                    </h3>
                                </div>

                  <div className="p-3 sm:p-5">
                    {loadingConsultations ? (
                      <div className="flex justify-center items-center py-8 sm:py-12">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                    ) : consultations.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4 sm:mb-5">
                          <Stethoscope className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60" />
                                      </div>
                        <h4 className="text-gray-900 text-sm sm:text-base font-medium mb-2 sm:mb-3">No Consultations Found</h4>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-5 sm:mb-7">
                          You haven't scheduled any consultations yet.
                        </p>
                        <Button
                          onClick={() => navigate('/consultation')}
                          className="gap-1 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Book Consultation</span>
                        </Button>
                                    </div>
                    ) : (
                      <div className="relative">
                        {/* Current consultation with animation */}
                        <div className={cn(
                          "transition-all duration-300 ease-in-out min-h-[360px] sm:min-h-[460px]",
                          consultationAnimating && consultationAnimationDirection === 'next' 
                            ? 'animate-slide-out-left' 
                            : consultationAnimating && consultationAnimationDirection === 'prev'
                            ? 'animate-slide-out-right'
                            : !consultationAnimating && consultationAnimationDirection === 'next'
                            ? 'animate-slide-in-right'
                            : !consultationAnimating && consultationAnimationDirection === 'prev'
                            ? 'animate-slide-in-left'
                            : ''
                        )}>
                          {consultations[currentConsultationPage - 1] && (
                            <div className="bg-white rounded-lg shadow-sm border relative overflow-hidden min-h-[360px] sm:min-h-[460px]">
                              {/* Status Strip */}
                              <div 
                                className={cn(
                                  "h-2 w-full",
                                  consultations[currentConsultationPage - 1].status === "confirmed" && "bg-cyan-500",
                                  consultations[currentConsultationPage - 1].status === "scheduled" && "bg-primary",
                                  consultations[currentConsultationPage - 1].status === "pending" && "bg-yellow-400",
                                  consultations[currentConsultationPage - 1].status === "completed" && "bg-green-500",
                                  consultations[currentConsultationPage - 1].status === "cancelled" && "bg-red-500",
                                  !consultationAnimating && "animate-pulse-soft"
                                )}
                              />
                              
                              <div className="p-5">
                                {/* Status Badge and Type */}
                                <div className="flex justify-between items-start mb-5">
                                  <Badge 
                                    variant={
                                      consultations[currentConsultationPage - 1].status === "scheduled" ? "default" :
                                      consultations[currentConsultationPage - 1].status === "pending" ? "outline" :
                                      consultations[currentConsultationPage - 1].status === "completed" ? "success" :
                                      consultations[currentConsultationPage - 1].status === "cancelled" ? "destructive" :
                                      "secondary"
                                    }
                                    className={cn(
                                      "capitalize px-3 py-1",
                                      consultations[currentConsultationPage - 1].status === "cancelled" && "bg-red-500 hover:bg-red-500"
                                    )}
                                  >
                                    {consultations[currentConsultationPage - 1].status}
                                  </Badge>
                                  <span className="text-sm font-medium text-cyan-500">
                                    {consultations[currentConsultationPage - 1].consultation_type === 'follow_up' ? 'Follow-up Consultation' : 
                                     consultations[currentConsultationPage - 1].consultation_type === 'scan' ? 'Scan Consultation' : 
                                     'General Consultation'}
                                  </span>
                                </div>

                                {/* Doctor Information */}
                                <div className="mb-6">
                                  <div className="flex items-center gap-2 mb-3 text-cyan-500">
                                    <Stethoscope className="h-4 w-4" />
                                    <div className="text-xs font-medium uppercase">Doctor Information</div>
                                  </div>
                                  <div className="space-y-3 p-4 bg-gray-50/80 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        {consultations[currentConsultationPage - 1].doctor_name || 
                                          (consultations[currentConsultationPage - 1].doctor ? 
                                            `Dr. ${consultations[currentConsultationPage - 1].doctor.first_name || ''} ${consultations[currentConsultationPage - 1].doctor.last_name || ''}` : 
                                            'Doctor')}
                                      </span>
                                    </div>
                                    {consultations[currentConsultationPage - 1].doctor_phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-gray-500" />
                                        <span className="text-sm text-gray-700">
                                          {consultations[currentConsultationPage - 1].doctor_phone}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Time Details */}
                                <div className="mb-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <div className="text-xs font-medium text-gray-500 uppercase">Time Details</div>
                                  </div>
                                  <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700 font-medium">
                                        {formatDate(consultations[currentConsultationPage - 1].date_time || consultations[currentConsultationPage - 1].created_at)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-sm text-gray-700 font-medium">
                                        {formatTime(consultations[currentConsultationPage - 1].date_time || consultations[currentConsultationPage - 1].created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Notes */}
                                {consultations[currentConsultationPage - 1].notes && (
                                  <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <div className="text-xs font-medium text-gray-500 uppercase">Notes</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                      <p className="text-sm text-gray-700">
                                        {consultations[currentConsultationPage - 1].notes}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Cancelled Overlay */}
                                {consultations[currentConsultationPage - 1].status === "cancelled" && (
                                  <>
                                    <div 
                                      className="absolute inset-0 bg-[length:10px_10px]"
                                      style={{
                                        backgroundImage: `repeating-linear-gradient(
                                          45deg,
                                          rgb(239 68 68 / 0.05),
                                          rgb(239 68 68 / 0.05) 10px,
                                          transparent 10px,
                                          transparent 20px
                                        )`
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
                                    <div className="absolute inset-0 border-2 border-red-200 rounded-lg" />
                                    <div className="absolute inset-[6px] border border-red-300/50 rounded-lg" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="relative transform -rotate-6">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-red-600/30 to-red-500/30 rounded-lg blur-lg animate-pulse" />
                                        <div className="relative flex items-center bg-red-500 text-white px-6 py-2 rounded-lg shadow-lg">
                                          <X className="h-5 w-5 mr-2 animate-bounce" />
                                          <span className="font-bold text-lg">CANCELLED</span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                                {/* Actions */}
                                {consultations[currentConsultationPage - 1].status !== "cancelled" && 
                                 consultations[currentConsultationPage - 1].status !== "completed" && (
                              <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                    className="h-8 sm:h-10 px-3 sm:px-5 transition-all duration-200 text-xs sm:text-sm"
                                      onClick={() => handleCancelConsultation(consultations[currentConsultationPage - 1].id)}
                                    >
                                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                  )}
                            </div>
                          )}
                        </div>

                        {/* Consultation pagination controls */}
                        <div className="flex justify-between items-center mt-4 sm:mt-6">
                          <Button
                            variant="outline"
                              size="sm"
                              onClick={() => handleConsultationPageChange(currentConsultationPage - 1)}
                            disabled={currentConsultationPage === 1}
                            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Previous</span>
                          </Button>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {currentConsultationPage} of {consultations.length}
                                  </span>
                                <Button
                            variant="outline"
                            size="sm"
                              onClick={() => handleConsultationPageChange(currentConsultationPage + 1)}
                            disabled={currentConsultationPage === consultations.length}
                            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <span>Next</span>
                            <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                      </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md min-w-[280px] p-4" style={{ borderRadius: "0.5rem", border: "1px solid rgba(226, 232, 240, 1)" }}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg font-semibold text-primary">Edit Appointment</DialogTitle>
              <DialogDescription>
                Update your appointment date and time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ''}
                  onChange={(e) => {
                    setSelectedDate(new Date(e.target.value));
                  }}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time Slot</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto bg-blue-50/30 p-3 rounded-xl">
                  {/* Display all time slots (both available and taken) */}
                  {allTimeSlots.map((time, index) => {
                    const isAvailable = isSlotAvailable(time);
                    return (
                      <div
                        key={index}
                        onClick={() => isAvailable && setSelectedTime(time)}
                        className={cn(
                          "relative p-3 border-2 rounded-xl transition-all",
                          selectedTime === time 
                            ? 'border-transparent bg-gradient-to-br from-primary to-blue-500 text-white transform scale-105 shadow-md'
                            : isAvailable
                              ? 'border-primary bg-white hover:bg-blue-50 hover:-translate-y-1 cursor-pointer'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-70'
                        )}
                      >
                        <div className="text-center font-medium">
                          {formatTimeSlotForDisplay(time)}
                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 rounded-xl">
                              <div className="flex items-center gap-1 text-cyan-500">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm">Taken</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedTime === time && (
                          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedTime === "" && (
                  <p className="text-amber-600 text-xs mt-1">
                    Please select an available time slot
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTimeUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Appointment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Profile Picture Editor - Modal dialog only */}
        {showProfilePictureEditor && (
          <ProfilePictureEditor
            currentImage={userData.profileImage}
            firstName={userData.firstName}
            lastName={userData.lastName}
            onImageChange={handleFileSelect}
            onClose={handleCloseProfileEditor}
          />
        )}

        {/* Profile Settings Dialog */}
        {showProfileSettings && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowProfileSettings(false)}
            />
            
            {/* Dialog */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 transform transition-all duration-300">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">Profile Settings</h3>
                                                    <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProfileSettings(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                          </Button>
              </div>

              <div className="p-4 space-y-3">
                {/* Email Toggle */}
                <div className="flex items-center justify-between py-1 sm:py-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                    <span className="text-sm sm:text-base font-medium text-gray-900">Email</span>
                  </div>
                          <Button
                    variant={emailNotifications ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('email')}
                    size="sm"
                                                      className={cn(
                      "min-w-[50px] sm:min-w-[60px] h-7 sm:h-8 text-xs transition-colors duration-200", 
                      emailNotifications 
                        ? "bg-primary hover:bg-cyan-600" 
                        : "hover:text-cyan-500 hover:border-cyan-500"
                    )}
                  >
                    {emailNotifications ? 'On' : 'Off'}
                                                    </Button>
                                              </div>
                  
                          {/* In-App Toggle */}
                          <div className="flex items-center justify-between py-1 sm:py-1.5">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                              <span className="text-sm sm:text-base font-medium text-gray-900">App</span>
                            </div>
                                                    <Button
                              variant={appNotifications ? "default" : "outline"}
                              onClick={() => handleNotificationToggle('app')}
                                      size="sm"
                                                      className={cn(
                      "min-w-[50px] sm:min-w-[60px] h-7 sm:h-8 text-xs transition-colors duration-200", 
                      appNotifications 
                        ? "bg-primary hover:bg-cyan-600" 
                        : "hover:text-cyan-500 hover:border-cyan-500"
                    )}
                  >
                    {appNotifications ? 'On' : 'Off'}
                                                    </Button>
                                                </div>
                                              </div>

              <div className="p-2 sm:p-3 bg-gray-50 rounded-b-xl flex justify-end">
                          <Button
                  onClick={() => setShowProfileSettings(false)}
                  className="bg-primary hover:bg-cyan-600 transition-colors duration-200 h-7 sm:h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                            size="sm"
                >
                  Done
                                              </Button>
                        </div>
                      </div>
          </>
                    )}
                    </div>
    </div>
  );
};

export default ProfilePage;

// Add a helper function to compare user data objects
const compareUserData = (newData, oldData) => {
  if (!oldData) return true; // Always refresh if there's no current user data
  
  // Only consider a few essential fields that would require a refresh
  // If the IDs are the same, it's likely the same user regardless of other fields
  if (newData.id !== oldData.id) return true;
  
  // Compare name fields only if they actually change from empty to non-empty
  // Otherwise, small differences aren't worth a refresh
  if (!oldData.first_name && newData.first_name) return true;
  if (!oldData.last_name && newData.last_name) return true;
  
  // Only refresh for email change if the previous one was empty
  if (!oldData.email && newData.email) return true;
  
  // Only refresh for profile picture if it's a significant change 
  // (from placeholder to a real picture or vice versa)
  const oldPicIsPlaceholder = !oldData.profile_picture || oldData.profile_picture === 'placeholder';
  const newPicIsPlaceholder = !newData.profile_picture || newData.profile_picture === 'placeholder';
  if (oldPicIsPlaceholder !== newPicIsPlaceholder) return true;
  
  // Check if the role has changed - this is important
  if (newData.role !== oldData.role) return true;
  
  // No significant changes that would require a refresh
  return false;
};

