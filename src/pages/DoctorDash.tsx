import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { consultationService, getUserInitials, notificationService, formatProfilePictureUrl } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Stethoscope, 
  User as UserIcon, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Bell,
  Mail,
  Phone,
  Eye,
  MapPin,
  Menu,
  AlertTriangle,
  Trash2,
  Video,
  Camera as CameraIcon,
  X,
  Bug as BugIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { customToast } from '@/lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import FloatingIcons from '@/components/FloatingIcons';
import { Toaster, toast } from 'sonner';

interface Consultation {
  id: number;
  patient: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    profile_picture?: string;
    profile_picture_url?: string;
    address?: string;
    gender?: string;
    bio?: string;
  };
  doctor_name?: string;
  patient_name?: string;
  consultation_type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  scan?: {
    id: number;
    image: string;
    result: string;
    confidence_score: number;
    status?: string;
  };
  scan_details?: any;
}

// Improved getUserInitials function with better safety
const safeGetUserInitials = (patient: any) => {
  // Handle null or undefined patient
  if (!patient) return "US";
  
  // Handle object type patients
  if (typeof patient === 'object') {
    // Extract first and last name with fallbacks
    const firstName = patient.first_name || '';
    const lastName = patient.last_name || '';
    
    // If no names are available, try username, email, or patient_name
    if (!firstName && !lastName) {
      if (patient.username) {
        return patient.username.substring(0, 2).toUpperCase();
      }
      
      if (patient.email) {
        return patient.email.substring(0, 2).toUpperCase();
      }
      
      if (patient.patient_name) {
        const parts = patient.patient_name.split(' ');
        if (parts.length > 1) {
          return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
        } else if (parts.length === 1) {
          return parts[0].substring(0, 2).toUpperCase();
        }
      }
      
      return "US";
    }
    
    // Extract initials from first and last name
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  // Handle string patient data (possibly a name or ID)
  if (typeof patient === 'string') {
    const parts = patient.split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return patient.substring(0, 2).toUpperCase();
  }
  
  // Fallback
  return "US";
};

// PatientDataService: Centralized patient data fetching and caching
const PatientDataService = {
  // Cache storage for patient data
  _cache: new Map<number, any>(),
  
  // Check if patient data is cached
  isCached: (patientId: number): boolean => {
    return PatientDataService._cache.has(patientId);
  },
  
  // Get patient from cache
  getFromCache: (patientId: number): any => {
    return PatientDataService._cache.get(patientId);
  },
  
  // Store patient in cache
  storeInCache: (patientId: number, patientData: any): void => {
    PatientDataService._cache.set(patientId, patientData);
    console.log(`Cached patient ${patientId} data for future use`);
    
    // Also persist in localStorage for longer-term caching
    try {
      const cachedPatients = JSON.parse(localStorage.getItem('cachedPatientData') || '{}');
      cachedPatients[patientId] = patientData;
      localStorage.setItem('cachedPatientData', JSON.stringify(cachedPatients));
    } catch (e) {
      console.error('Error storing patient data in localStorage:', e);
    }
  },
  
  // Initialize cache from localStorage
  initializeCache: (): void => {
    try {
      const cachedPatients = JSON.parse(localStorage.getItem('cachedPatientData') || '{}');
      Object.entries(cachedPatients).forEach(([id, data]) => {
        PatientDataService._cache.set(Number(id), data);
      });
      console.log(`Initialized patient cache with ${PatientDataService._cache.size} patients`);
    } catch (e) {
      console.error('Error initializing patient cache from localStorage:', e);
    }
  },
  
  // Get full patient data (fetch from API or cache)
  getPatientData: async (patientId: number, baseData: any = null): Promise<any> => {
    // Check cache first
    if (PatientDataService.isCached(patientId)) {
      console.log(`Using cached data for patient ${patientId}`);
      return PatientDataService.getFromCache(patientId);
    }
    
    console.log(`Fetching comprehensive data for patient ${patientId}`);
    
    // Create base patient object
    let patient = {
      id: patientId,
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      ...baseData
    };
    
    // Extract data from patient_name if available
    if (patient.patient_name) {
      const nameParts = patient.patient_name.split(' ');
      patient.first_name = patient.first_name || nameParts[0] || '';
      patient.last_name = patient.last_name || nameParts.slice(1).join(' ') || '';
    }
    
    try {
      // Get backend URL
      const backendUrl = (() => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return `http://${window.location.hostname}:8000`;
        } else {
          return `${window.location.protocol}//${window.location.host}`;
        }
      })();
      
      // Fetch user data from API
      const userResponse = await fetch(`${backendUrl}/api/users/${patientId}/`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('Successfully fetched user data:', userData);
        
        // Merge data
        patient = {
          ...patient,
          ...userData,
          // Keep existing fields if any
          phone_number: userData.phone_number || patient.phone_number,
          address: userData.address || patient.address
        };
        
        // Log the user data
        console.log('User data:', patient);
      }
      
      // Try to fetch the user profile data - try the correct endpoint first
      try {
        // Try the correct /profiles/ endpoint first
        const profileResponse = await fetch(`${backendUrl}/api/profiles/${patientId}/`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Successfully fetched user profile data from /profiles/ endpoint:', profileData);
          
          // Merge profile data
          patient = {
            ...patient,
            profile_picture: profileData.profile_picture || null,
            profile_picture_url: profileData.profile_picture_url || 
              (profileData.profile_picture ? formatProfilePictureUrl(profileData.profile_picture) : null),
            bio: profileData.bio || '',
            address: profileData.address || patient.address,
            phone_number: profileData.phone_number || patient.phone_number,
            gender: profileData.gender || ''
          };
        } else {
          // If profiles endpoint failed, try the legacy endpoints
          console.log('Profiles endpoint failed, trying alternative endpoints');
          throw new Error('Profiles endpoint failed');
        }
      } catch (profileError) {
        console.error('Error fetching from /profiles/ endpoint:', profileError);
        
        // Try alternative endpoint userprofile
        try {
          const altProfileResponse = await fetch(`${backendUrl}/api/userprofile/${patientId}/`);
          if (altProfileResponse.ok) {
            const profileData = await altProfileResponse.json();
            console.log('Successfully fetched user profile data from userprofile endpoint:', profileData);
            
            patient = {
              ...patient,
              profile_picture: profileData.profile_picture || null,
              profile_picture_url: profileData.profile_picture_url || 
                (profileData.profile_picture ? formatProfilePictureUrl(profileData.profile_picture) : null),
              bio: profileData.bio || '',
              address: profileData.address || patient.address,
              phone_number: profileData.phone_number || patient.phone_number,
              gender: profileData.gender || ''
            };
          } else {
            // Try one more endpoint (userprofiles)
            throw new Error('userprofile endpoint failed');
          }
        } catch (altProfileError) {
          console.error('Error fetching from /userprofile/ endpoint:', altProfileError);
          
          // Try the final alternative endpoint
          try {
            const finalProfileResponse = await fetch(`${backendUrl}/api/userprofiles/${patientId}/`);
            if (finalProfileResponse.ok) {
              const profileData = await finalProfileResponse.json();
              console.log('Successfully fetched user profile data from userprofiles endpoint:', profileData);
              
              patient = {
                ...patient,
                profile_picture: profileData.profile_picture || null,
                profile_picture_url: profileData.profile_picture_url || 
                  (profileData.profile_picture ? formatProfilePictureUrl(profileData.profile_picture) : null),
                bio: profileData.bio || '',
                address: profileData.address || patient.address,
                phone_number: profileData.phone_number || patient.phone_number,
                gender: profileData.gender || ''
              };
            } else {
              console.error('All profile endpoints failed');
            }
          } catch (finalProfileError) {
            console.error('Error fetching from all profile endpoints:', finalProfileError);
          }
        }
      }
      
      // Store in cache
      PatientDataService.storeInCache(patientId, patient);
      return patient;
    } catch (error) {
      console.error(`Error fetching data for patient ${patientId}:`, error);
      
      // Store basic data in cache to avoid repeated failed requests
      PatientDataService.storeInCache(patientId, patient);
      return patient;
    }
  }
};

const DoctorDash = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  
  // Consultation details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fix 2: Add loading state for specific operations
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Fix 3: Add state to track which consultations have been viewed
  const [viewedConsultations, setViewedConsultations] = useState<Set<number>>(new Set());
  
  // New state for dashboard view
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for consultation grouping
  const [groupedConsultations, setGroupedConsultations] = useState<{ [key: string]: Consultation[] }>({});

  // Initialize the patient cache when the component loads
  useEffect(() => {
    PatientDataService.initializeCache();
  }, []);

  // Refresh background when component mounts
  useEffect(() => {
    // Dispatch an event to refresh background settings
    window.dispatchEvent(new CustomEvent('background-settings-refresh'));
    
    // Additional logging for debugging
    console.log('DoctorDash: Triggered background refresh');
  }, []);

  // Check if user is authorized (doctor)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'doctor') {
      navigate('/');
      customToast.error('Unauthorized access. Only doctors can access this dashboard.');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fix 7: Update the useEffect to use our refactored fetchConsultations
  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchConsultations();
    }
  }, [user, isAuthenticated]); // Fix: Added isAuthenticated as a dependency

  // Add a new effect to group consultations by status
  useEffect(() => {
    const groupByStatus = (consultations: Consultation[]) => {
      const groups: { [key: string]: Consultation[] } = {
        pending: [],
        accepted: [],
        completed: [],
        cancelled: []
      };
      
      consultations.forEach(consultation => {
        const status = consultation.status;
        if (groups[status]) {
          groups[status].push(consultation);
        } else {
          // Handle any other status not explicitly defined
          groups[status] = [consultation];
        }
      });
      
      return groups;
    };
    
    setGroupedConsultations(groupByStatus(filteredConsultations));
  }, [filteredConsultations]);

  // Add filtering effect with proper dependencies
  useEffect(() => {
    // Only apply filters if consultations are loaded
    if (consultations.length > 0) {
      const filtered = applyFilters(consultations);
      setFilteredConsultations(filtered);
    }
  }, [searchTerm, selectedType, selectedStatus, sortOrder, consultations]);

  // Apply all filtering, sorting, and search in one place
  const applyFilters = (consultations: Consultation[]): Consultation[] => {
    let filtered = [...consultations];
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(c => c.consultation_type === selectedType);
    }
    
    // Apply search filter
    if (searchTerm && searchTerm.length > 0) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        // Search in patient name
        const patientName = c.patient_name || 
          `${c.patient?.first_name || ''} ${c.patient?.last_name || ''}`;
        
        // Search in notes
        const notes = c.notes || '';
        
        return patientName.toLowerCase().includes(lowercaseSearch) || 
               notes.toLowerCase().includes(lowercaseSearch);
      });
    }
    
    // Apply sorting
    filtered = sortConsultations(filtered, sortOrder);
    
    return filtered;
  };

  // Helper function to sort consultations
  const sortConsultations = (consultations: Consultation[], sortMethod: string): Consultation[] => {
    const sorted = [...consultations];
    
    switch (sortMethod) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      case 'patientAZ':
        return sorted.sort((a, b) => {
          const nameA = a.patient_name || getPatientFullName(a.patient);
          const nameB = b.patient_name || getPatientFullName(b.patient);
          return nameA.localeCompare(nameB);
        });
      
      case 'patientZA':
        return sorted.sort((a, b) => {
          const nameA = a.patient_name || getPatientFullName(a.patient);
          const nameB = b.patient_name || getPatientFullName(b.patient);
          return nameB.localeCompare(nameA);
        });
      
      default:
        return sorted;
    }
  };

  // Fix 4: Improved status change handler with proper data sync
  const handleStatusChange = async (consultationId: number, newStatus: string) => {
    try {
      setIsSubmitting(true);
      // Mark this consultation as specifically loading
      setLoadingStates(prev => ({ ...prev, [consultationId]: true }));
      
      const notesContent = notes || undefined;
      
      // Find the consultation we're updating
      const consultation = consultations.find(c => c.id === consultationId);
      
      // Set additional data based on status change
      let additionalData: Record<string, any> = {};
      let updatedNotes = notesContent;
      let successMessage = `Consultation ${newStatus} successfully`;
      
      if (newStatus === 'accepted') {
        const isInitialConsultation = consultation?.consultation_type === 'initial';
        additionalData = { 
          consultation_type: 'follow_up',
          update_type: true  // Flag to ensure backend updates the type
        };
        
        // Just keep the original notes without the system message
        updatedNotes = notesContent;
        
        if (isInitialConsultation) {
          successMessage = 'Initial consultation accepted and converted to follow-up';
        } else {
          successMessage = 'Follow-up consultation scheduled successfully';
        }
      } else if (newStatus === 'completed') {
        // Keep the existing consultation_type instead of setting to null
        additionalData = {
          // Let the backend handle this - don't try to modify consultation_type
          // The API service will handle this appropriately
          update_type: false
        };
        successMessage = 'Consultation marked as completed';
      }
      
      // Call the service to update status and create notifications 
      const result = await consultationService.updateConsultationStatus(
        consultationId, 
        newStatus, 
        updatedNotes,
        additionalData
      );
      
      console.log('Consultation status updated result:', result);
      
      // Fix: Instead of updating state directly, re-fetch consultations to ensure data consistency
      await fetchConsultations();
      
      setDetailsDialogOpen(false);
      customToast.success(successMessage);
    } catch (error: any) {
      console.error(`Error changing consultation status to ${newStatus}:`, error);
      // Fix: Improved error message based on response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update consultation status';
      customToast.error(errorMessage);
      
      // If status update fails, we should refresh consultations to get the correct state
      await fetchConsultations();
    } finally {
      setIsSubmitting(false);
      // Clear loading state for this specific consultation
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[consultationId];
        return newState;
      });
    }
  };

  // Fetch consultations and apply all filters
  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const fetchedConsultations = await consultationService.getConsultations();
      
      // Initialize PatientDataService's cache
      PatientDataService.initializeCache();
      
      // Enhance patient data for each consultation
      const enhancedConsultations = await Promise.all(
        fetchedConsultations.map(async (consultation) => {
          // If consultation has a patient ID, try to fetch detailed patient data
          if (consultation.patient && typeof consultation.patient === 'number') {
            try {
              // Use the PatientDataService to fetch (or use cached) detailed patient data
              const patientData = await PatientDataService.getPatientData(
                consultation.patient,
                { patient_name: consultation.patient_name }
              );
              
              // Replace the patient ID with the complete patient object
              consultation.patient = patientData;
            } catch (error) {
              console.error(`Error fetching patient data for consultation ${consultation.id}:`, error);
            }
          }
          return consultation;
        })
      );
      
      console.log('Enhanced consultations:', enhancedConsultations);
      setConsultations(enhancedConsultations);
      
      // Apply all filters to the fetched data
      const filtered = applyFilters(enhancedConsultations);
      setFilteredConsultations(filtered);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      customToast.error('Error loading consultations');
      setConsultations([]);
      setFilteredConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fix 8: Helper function to get patient name consistently
  const getPatientFullName = (patient: any): string => {
    if (!patient) return 'Unknown Patient';
    
    if (typeof patient === 'object') {
      const firstName = patient.first_name || '';
      const lastName = patient.last_name || '';
      
      if (!firstName && !lastName) return 'Unknown Patient';
      
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'Unknown Patient';
  };

  // Function to validate consultation data
  const validateConsultation = (consultation: Consultation | null): boolean => {
    if (!consultation) return false;
    
    // Check if consultation has an ID
    if (!consultation.id) {
      console.error('Invalid consultation: Missing ID');
      return false;
    }
    
    // Check if consultation has patient information
    if (!consultation.patient && !consultation.patient_name) {
      console.error('Invalid consultation: Missing patient information');
      return false;
    }
    
    return true;
  };

  // Replace the handleViewDetails function with an updated version that uses the PatientDataService
  const handleViewDetails = async (consultation: Consultation) => {
    // Validate the consultation data before proceeding
    if (!validateConsultation(consultation)) {
      customToast.error('Invalid consultation data. Unable to view details.');
      return;
    }
    
    try {
      // Set loading state for this consultation
      setLoadingStates(prev => ({ ...prev, [`details-${consultation.id}`]: true }));
      
      // Set initial states
      setSelectedConsultation(consultation);
      setNotes(consultation.notes || '');
      
      // Mark this consultation as viewed
      setViewedConsultations(prev => {
        const newSet = new Set(prev);
        newSet.add(consultation.id);
        return newSet;
      });
      
      // Update filtered consultations if we're searching
      if (searchTerm && searchTerm.length > 0) {
        setFilteredConsultations(current => 
          current.map(c => c.id === consultation.id ? {...c, viewed: true} : c)
        );
      }
      
      // Fetch enhanced consultation data
      try {
        if (consultation.id) {
          console.log('Fetching enhanced consultation details:', consultation.id);
          
          // Get detailed consultation data
          const detailedConsultation = await consultationService.getConsultationById(consultation.id);
          
          // If we have patient ID as a number, get comprehensive patient data
          if (detailedConsultation.patient && typeof detailedConsultation.patient === 'number') {
            const patientId = detailedConsultation.patient;
            const patientData = await PatientDataService.getPatientData(
              patientId, 
              { patient_name: detailedConsultation.patient_name }
            );
            
            // Replace the patient ID with complete patient object
            detailedConsultation.patient = patientData;
          }
          
          // Update state with the enhanced data
          setSelectedConsultation(detailedConsultation);
          setNotes(detailedConsultation.notes || '');
        }
      } catch (fetchError) {
        console.error('Error enhancing consultation data:', fetchError);
        customToast.error('Could not load detailed consultation information.');
        // Continue with basic consultation data
      }
      
      // Open dialog to display details
      setDetailsDialogOpen(true);
    } catch (error: any) {
      console.error('Error in handleViewDetails:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'An unexpected error occurred';
      customToast.error(errorMessage);
      
      // If we have basic consultation data, still show the dialog
      if (consultation) {
        setSelectedConsultation(consultation);
        setDetailsDialogOpen(true);
      }
    } finally {
      // Clear loading state for this consultation
      setLoadingStates(prev => {
        const newSet = { ...prev };
        delete newSet[`details-${consultation.id}`];
        return newSet;
      });
    }
  };

  // Helper function to get backend URL
  const getBackendUrl = () => {
    // Determine base URL based on environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:8000`;
    } else {
      // For production, use the same host/port as the frontend
      return `${window.location.protocol}//${window.location.host}`;
    }
  };

  // Fix 11: Enhanced getScanImageUrl to handle backend URL configuration
  const getScanImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) {
      return 'https://via.placeholder.com/400x300?text=No+Scan+Image';
    }
    
    // If it's already a full URL, return it as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Handle URLs that might already include the media path
    const mediaPattern = /^media\//i;
    if (mediaPattern.test(imageUrl)) {
      const baseUrl = getBackendUrl();
      return `${baseUrl}/${imageUrl}`;
    }
    
    // For scans/ prefixed URLs
    if (imageUrl.startsWith('scans/')) {
      const baseUrl = `${getBackendUrl()}/media`;
      return `${baseUrl}/${imageUrl}`;
    }
    
    // Remove any leading slashes
    const cleanPath = imageUrl.replace(/^\/+/, '');
    
    // Construct the final URL with media path if needed
    return `${getBackendUrl()}/media/${cleanPath}`;
  };

  // Fix 12: Enhanced formatDate with better error handling
  const formatDate = (dateString: string) => {
    try {
      const parsedDate = parseISO(dateString);
      // Check if date is valid before formatting
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid date';
      }
      return format(parsedDate, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Format time from a date string
  const formatTime = (dateString: string) => {
    try {
      const parsedDate = parseISO(dateString);
      // Check if date is valid before formatting
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid time';
      }
      return format(parsedDate, 'hh:mm a');
    } catch (error) {
      console.error('Error formatting time:', dateString, error);
      return 'Invalid time';
    }
  };

  // Handle starting a consultation video call
  const handleStartConsultation = (consultation: Consultation) => {
    if (!consultation || !consultation.id) {
      customToast.error('Invalid consultation data');
      return;
    }
    
    try {
      // Navigate to the video call page with consultation ID
      navigate(`/consultations/video/${consultation.id}`);
      
      // Log the action
      console.log(`Starting video consultation for ID: ${consultation.id}`);
      
      // Show notification
      customToast.success('Starting video consultation...');
    } catch (error) {
      console.error('Error starting consultation:', error);
      customToast.error('Failed to start video consultation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'confirmed':
      case 'accepted':
        return <ChevronRight className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStats = () => {
    return {
      total: consultations.length,
      pending: consultations.filter(c => c.status === 'pending').length,
      accepted: consultations.filter(c => c.status === 'accepted' || c.status === 'confirmed').length,
      completed: consultations.filter(c => c.status === 'completed').length,
      cancelled: consultations.filter(c => c.status === 'cancelled').length
    };
  };

  // New function to refresh data
  const refreshData = async () => {
    setIsLoading(true);
    await fetchConsultations();
    setIsLoading(false);
    toast.success('Dashboard data refreshed');
  };

  const stats = getStats();

  // Custom styles for the close button
  useEffect(() => {
    // Add a custom style for the dialog close button
    const style = document.createElement('style');
    style.textContent = `
      .dialog-close-button:hover {
        color: #06b6d4 !important; /* Cyan-500 color */
      }
      .dialog-close-button svg {
        height: 1.25rem !important;
        width: 1.25rem !important;
      }
    `;
    document.head.appendChild(style);
    
    // Apply the class to all dialog close buttons
    const applyClasses = () => {
      const closeButtons = document.querySelectorAll('[data-radix-collection-item]');
      closeButtons.forEach(button => {
        if (button.querySelector('svg') && button.classList.contains('absolute')) {
          button.classList.add('dialog-close-button');
        }
      });
    };
    
    // Apply initially and whenever the dialog opens
    applyClasses();
    const observer = new MutationObserver(applyClasses);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Cleanup on component unmount
    return () => {
      document.head.removeChild(style);
      observer.disconnect();
    };
  }, []);

  // Function to update consultation type
  const handleConsultationTypeChange = async (consultationId: number, newType: string) => {
    try {
      setIsSubmitting(true);
      setLoadingStates(prev => ({ ...prev, [`type-${consultationId}`]: true }));
      
      // Find the consultation
      const consultation = consultations.find(c => c.id === consultationId);
      if (!consultation) {
        customToast.error('Consultation not found');
        return;
      }
      
      // Prepare data for update
      const additionalData = {
        consultation_type: newType,
        update_type: true
      };
      
      console.log(`Changing consultation type to ${newType}`);
      
      // For already accepted consultations, use PATCH directly without status
      if (consultation.status === 'accepted') {
        // Use the existing service but don't pass a status parameter (as undefined)
        const result = await consultationService.updateConsultationStatus(
          consultationId,
          undefined, // No status change, keep current status
          consultation.notes, // Keep current notes
          additionalData
        );
        console.log('Consultation type updated result:', result);
    } else {
        // Use the existing service to update - keep status the same for other states
        const result = await consultationService.updateConsultationStatus(
          consultationId,
          consultation.status, // Keep current status
          consultation.notes, // Keep current notes
          additionalData
        );
        console.log('Consultation type updated result:', result);
      }
      
      // Re-fetch consultations to ensure data consistency
      await fetchConsultations();
      
      customToast.success(`Consultation marked as ${newType.replace('_', ' ')}`);
    } catch (error: any) {
      console.error(`Error changing consultation type to ${newType}:`, error);
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Failed to update consultation type';
      customToast.error(errorMessage);
      
      await fetchConsultations();
    } finally {
      setIsSubmitting(false);
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[`type-${consultationId}`];
        return newState;
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      
      {/* Modern Header with glassy effect */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Doctor Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200 flex items-center text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Online</span>
            </div>
              
            <Button 
              variant="outline" 
              size="sm"
                onClick={refreshData}
                disabled={isLoading}
                className="text-primary border-primary/30 hover:bg-primary/5"
              >
                {isLoading ? 
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div> : 
                  'Refresh'
                }
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="h-1 w-full bg-blue-500"></div>
            <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs uppercase text-blue-600 font-medium mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Total
            </p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="h-1 w-full bg-yellow-400"></div>
            <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs uppercase text-yellow-600 font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Pending
            </p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="h-1 w-full bg-green-500"></div>
            <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs uppercase text-green-600 font-medium mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Accepted
            </p>
              <p className="text-2xl font-bold text-green-800">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="h-1 w-full bg-red-500"></div>
            <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs uppercase text-red-600 font-medium mb-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Declined
            </p>
              <p className="text-2xl font-bold text-red-800">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

        {/* Search bar and filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name..."
                className="pl-9 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Consultation Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="patientAZ">Patient Name (A-Z)</SelectItem>
                  <SelectItem value="patientZA">Patient Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSortOrder('newest');
              }}
              className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
          {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mb-4"></div>
              <p className="text-gray-500 font-medium">Loading consultations...</p>
            </div>
            </div>
          ) : filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
            <div className="bg-gray-100 p-6 rounded-full mb-6">
              <Stethoscope className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No consultations found</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              No consultations match your current filters. Try adjusting your search criteria or check back later.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSortOrder('newest');
              }}
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              Clear Filters
            </Button>
            </div>
          ) : (
          <>
            {/* Consultation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConsultations.map((consultation) => (
                <Card key={consultation.id} className="overflow-hidden border border-gray-100 hover:border-cyan-500 hover:shadow-md hover:scale-[1.02] transform transition-all duration-200 h-full flex flex-col relative group">
                  <div className={cn("h-1.5 w-full", getStatusColor(consultation.status))}></div>
                  {(consultation.status === 'pending' || consultation.status === 'accepted') && (
                    <div className="absolute top-1 right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {consultation.status === 'pending' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(consultation.id, 'cancelled');
                          }}
                          className="rounded-full bg-red-50 p-1.5 hover:bg-red-100 transition-colors"
                          title="Cancel consultation"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                      
                      {consultation.consultation_type !== 'emergency' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConsultationTypeChange(consultation.id, 'emergency');
                          }}
                          className="rounded-full bg-red-50 p-1.5 hover:bg-red-100 transition-colors"
                          title="Mark as emergency"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {consultation.patient?.profile_picture_url ? (
                          <img 
                            src={consultation.patient.profile_picture_url} 
                            alt={`${consultation.patient_name || 'Patient'} profile`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-200"
                          />
                        ) : (
                          <div className={cn("rounded-full p-2 w-10 h-10 flex items-center justify-center", 
                            consultation.status === 'cancelled' ? "bg-red-50 text-red-600" :
                            consultation.status === 'pending' ? "bg-amber-50 text-amber-600" :
                            consultation.status === 'accepted' ? "bg-cyan-50 text-cyan-600" :
                            consultation.status === 'completed' ? "bg-green-50 text-green-600" :
                            "bg-gray-50 text-gray-600"
                          )}>
                            {consultation.status === 'pending' ? 
                              <AlertCircle className="h-5 w-5" /> :
                             consultation.status === 'accepted' ? 
                              <CheckCircle className="h-5 w-5" /> :
                             consultation.status === 'completed' ? 
                              <CheckCircle className="h-5 w-5" /> :
                             consultation.status === 'cancelled' ? 
                              <XCircle className="h-5 w-5" /> :
                              safeGetUserInitials(consultation.patient || consultation.patient_name)
                            }
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {consultation.patient_name || 
                              `${consultation.patient?.first_name || ''} ${consultation.patient?.last_name || ''}`}
                          </h3>
                          <div className="text-xs text-gray-500">
                            {formatDate(consultation.created_at)}
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="text-sm bg-gray-50 rounded-md p-3 mb-3 flex-grow">
                      {consultation.notes ? (
                        <p className="text-gray-600 line-clamp-4">{consultation.notes}</p>
                      ) : (
                        <p className="text-gray-400 italic">No notes available</p>
                        )}
                            </div>
                    
                    <div className="mt-auto pt-3 flex justify-between items-center gap-2">
                      <div className="flex flex-col gap-1">
                        {consultation.status !== 'completed' && (
                          <Badge variant="outline" className={cn(
                            "text-xs capitalize",
                            consultation.consultation_type === 'follow_up' ? 
                              "bg-green-50 text-green-700 border-green-200" : 
                            consultation.consultation_type === 'emergency' ? 
                              "bg-red-50 text-red-700 border-red-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {consultation.consultation_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {consultation.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(consultation.id, 'accepted');
                            }}
                            className="flex items-center gap-1 border-green-500/30 text-green-600 hover:bg-green-50"
                            title="Accept and convert to follow-up consultation"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {consultation.consultation_type === 'initial' ? 'Follow-up' : 'Accept'}
                        </Button>
                        )}
                        {consultation.status === 'accepted' && (
                            <Button 
                              size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(consultation.id, 'completed');
                            }}
                            className="bg-cyan-600 text-white hover:bg-white hover:text-cyan-600 border border-transparent hover:border-cyan-600 transition-colors"
                          >
                            Complete
                            </Button>
                        )}
                            <Button 
                          variant="outline" 
                              size="sm"
                          onClick={() => handleViewDetails(consultation)}
                          className="flex items-center gap-1 border-primary/30 hover:bg-primary/5"
                            >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          View Details
                            </Button>
                          </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Consultation Details Dialog with enhanced design */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-xl border-none shadow-lg">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-800">
              <FileText className="h-5 w-5 text-cyan-600" />
              Consultation Details
            </DialogTitle>
            <p className="text-gray-600 text-sm mt-1">
              Review patient information and consultation details
            </p>
          </DialogHeader>
          
          {selectedConsultation && (
            <div className="space-y-6 max-h-[75vh] overflow-y-auto p-2">
              {/* Add loading overlay when fetching details */}
              {loadingStates[`details-${selectedConsultation.id}`] && (
                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    <p className="text-cyan-600 font-medium">Loading consultation details...</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                {/* Patient Information Section - Improved design */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-cyan-500 hover:shadow-md hover:scale-[1.01] transform transition-all duration-200">
                  <h4 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-cyan-600" />
                    Patient Information
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedConsultation.patient?.profile_picture_url ? (
                        <img 
                          src={selectedConsultation.patient.profile_picture_url} 
                          alt={`${selectedConsultation.patient_name || 'Patient'} profile`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-200"
                        />
                      ) : (
                        <div className="bg-cyan-50 rounded-full p-3 w-12 h-12 flex items-center justify-center text-cyan-700 font-bold">
                          {safeGetUserInitials(selectedConsultation.patient)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {selectedConsultation.patient_name || 
                            `${selectedConsultation.patient?.first_name || ''} ${selectedConsultation.patient?.last_name || ''}`}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {formatDate(selectedConsultation.created_at)} • {formatTime(selectedConsultation.created_at)}
                        </div>
                      </div>
                    </div>
                      
                    {(selectedConsultation.status === 'pending' || selectedConsultation.status === 'accepted') && selectedConsultation.consultation_type !== 'emergency' && (
                      <div className="mt-4 flex justify-end gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Close the dialog first to prevent UI conflicts
                            setDetailsDialogOpen(false);
                            
                            // Use setTimeout to ensure dialog is closed before showing success notification
                            setTimeout(() => {
                              handleConsultationTypeChange(selectedConsultation.id, 'emergency');
                            }, 300);
                          }}
                          className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Mark as Emergency
                        </Button>
                        
                        {selectedConsultation.status === 'accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Close the dialog first to prevent UI conflicts
                              setDetailsDialogOpen(false);
                              
                              // Use setTimeout to ensure dialog is closed before showing success notification
                              setTimeout(() => {
                                handleStatusChange(selectedConsultation.id, 'completed');
                              }, 300);
                            }}
                            className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Complete Consultation
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 mt-4 bg-gray-50 p-5 rounded-lg">
                      {selectedConsultation.patient?.email && (
                        <div className="flex items-center gap-3">
                          <div className="bg-cyan-50 p-2 rounded-full">
                            <Mail className="h-4 w-4 text-cyan-600" />
                          </div>
                          <span className="text-sm text-gray-700">{selectedConsultation.patient.email}</span>
                        </div>
                      )}
                      
                      {selectedConsultation.patient?.phone_number && (
                        <div className="flex items-center gap-3">
                          <div className="bg-cyan-50 p-2 rounded-full">
                            <Phone className="h-4 w-4 text-cyan-600" />
                          </div>
                          <span className="text-sm text-gray-700">{selectedConsultation.patient.phone_number}</span>
                        </div>
                      )}
                      
                      {selectedConsultation.patient?.address && (
                        <div className="flex items-center gap-3">
                          <div className="bg-cyan-50 p-2 rounded-full">
                            <MapPin className="h-4 w-4 text-cyan-600" />
                          </div>
                          <span className="text-sm text-gray-700">{selectedConsultation.patient.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", getStatusColor(selectedConsultation.status))}>
                            {getStatusIcon(selectedConsultation.status)}
                            <span className="ml-1 capitalize">{selectedConsultation.status}</span>
                          </Badge>
                          
                          {selectedConsultation.status !== 'completed' && (
                            <Badge variant="outline" className={cn(
                              "text-xs capitalize",
                              selectedConsultation.consultation_type === 'follow_up' ? 
                                "bg-green-50 text-green-700 border-green-200" : 
                              selectedConsultation.consultation_type === 'emergency' ? 
                                "bg-red-50 text-red-700 border-red-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {selectedConsultation.consultation_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    
                {/* Additional Information Section - Enhanced design */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-cyan-500 hover:shadow-md hover:scale-[1.01] transform transition-all duration-200">
                  <h4 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-600" />
                    Additional Information
                  </h4>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 min-h-[200px] text-gray-700 whitespace-pre-wrap">
                      {notes ? notes : (
                        <p className="text-gray-400 italic">No additional information available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scan Information Section - Enhanced design */}
              {selectedConsultation.scan && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mx-2 hover:border-cyan-500 hover:shadow-md hover:scale-[1.01] transform transition-all duration-200">
                  <h4 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                    <CameraIcon className="h-5 w-5 text-cyan-600" />
                    Scan Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="relative group">
                        <img 
                          src={getScanImageUrl(selectedConsultation.scan.image)} 
                          alt="Scan Image"
                          className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <a 
                            href={getScanImageUrl(selectedConsultation.scan.image)}
                            download={`scan_${selectedConsultation.id}_${new Date().toISOString().split('T')[0]}.jpg`}
                            className="bg-white/90 hover:bg-white text-cyan-600 font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              customToast.success('Download started');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download X-ray
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 bg-gray-50 p-5 rounded-lg">
                      {selectedConsultation.scan.result ? (
                        <div>
                          <Label className="text-gray-500 text-sm mb-1">Result</Label>
                          <div className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200">
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                  "font-medium text-base",
                                  selectedConsultation.scan.result.toLowerCase().includes('normal') ? 
                                    "text-green-600" : 
                                    "text-red-600"
                                )}>
                                  {selectedConsultation.scan.result}
                                </span>
                                {selectedConsultation.scan.confidence_score && (
                                  <span className="text-sm text-gray-500">
                                    Confidence: {(selectedConsultation.scan.confidence_score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              
                              {selectedConsultation.scan.confidence_score && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                  <div 
                                    className={cn(
                                      "h-2.5 rounded-full", 
                                      selectedConsultation.scan.result.toLowerCase().includes('normal') ? 
                                        "bg-green-500" : 
                                        "bg-red-500"
                                    )}
                                    style={{ width: `${selectedConsultation.scan.confidence_score * 100}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-white p-3 rounded border border-gray-200">
                          <div className="text-center">
                            <p className="text-gray-500 mb-2">No result available</p>
                            <div className="text-xs text-gray-400">The scan has been uploaded but hasn't been analyzed yet</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDash; 