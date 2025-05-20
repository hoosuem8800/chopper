import React, { useState, useEffect, ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, api } from '@/services/api';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, AlertCircle, RefreshCw, Filter, Search, X, CheckCircle, Lock, User, Calendar, ArrowRight, ArrowLeft, Clock, Mail, ChevronUp, ChevronDown, Eye, MoreHorizontal, Download } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import ResourceManager components and utilities
import ResourceManager from './ResourceManagers';
import { resourceToEndpoint, getResourceDisplayName } from './ResourceManagers/types';

// Define local ApiResource interface (maintained for backward compatibility)
interface ApiResource {
  id: number;
  [key: string]: any;
}

const ManagementPage: React.FC = (): ReactElement => {
  const { resource } = useParams<{ resource: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ApiResource[]>([]);
  const [filteredData, setFilteredData] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ApiResource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State for user and doctor dropdowns
  const [users, setUsers] = useState<ApiResource[]>([]);
  const [doctors, setDoctors] = useState<ApiResource[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
  // State for time slots
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [appointmentStep, setAppointmentStep] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // State for payments form
  const [selectedPaymentUserId, setSelectedPaymentUserId] = useState<string>('');
  
  // State for consultations form
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  
  // Define available time slots
  const TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", 
    "02:00 PM", "03:00 PM", "04:00 PM"
  ];
  
  // Toggle debug mode function
  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  // Debug information function
  const getDebugInfo = () => {
    return {
      resource,
      endpoint: resource ? resourceToEndpoint[resource as keyof typeof resourceToEndpoint] : null,
      page,
      totalPages,
      totalItems,
      dataLength: data.length,
      data: data.slice(0, 1), // Just show the first item to avoid overwhelming the console
    };
  };
  
  // Function to fetch taken time slots for a specific date
  const fetchTakenSlots = async (date: string) => {
    if (!date) return;
    
    setLoadingDropdowns(true);
    try {
      const response = await api.get(`/appointments/taken-slots/?date=${date}`);
      const newTakenSlots = response.data?.taken_slots || [];
      setTakenSlots(newTakenSlots);
      console.log('Taken slots for date', date, ':', newTakenSlots);
    } catch (error) {
      console.error('Error fetching taken slots:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available time slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingDropdowns(false);
    }
  };
  
  // Check if a slot is available (not in takenSlots)
  const isSlotAvailable = (slot: string): boolean => {
    return !takenSlots.includes(slot);
  };
  
  // Handle date selection
  const handleDateSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchTakenSlots(newDate);
  };
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    // Add protection for resources that shouldn't be managed by admin
    if (resource === 'scans' || resource === 'notifications') {
      setError(`${resource} cannot be managed in the admin panel as they are system-controlled.`);
      // Keep them on the page but show error message instead of redirecting
    }
  }, [isAuthenticated, user, navigate, resource]);

  // Fetch data from API with special handling for payments
  useEffect(() => {
    if (!resource) return;
    
    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
    if (!endpoint) {
      setError(`Invalid resource: ${resource}`);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching ${resource} data from: ${endpoint}, page: ${page}`);
        
        let response;
        
        // Standard fetching logic for all resources including payments
        // First try the paginated endpoint
        let url = `${endpoint}?page=${page}`;
        
        try {
          response = await api.get(url);
          console.log('Paginated API Response:', response);
        } catch (err) {
          // If paginated endpoint fails, try the basic endpoint
          console.log('Paginated request failed, trying base endpoint');
          response = await api.get(endpoint);
          console.log('Base API Response:', response);
        }
        
        let responseData = [];
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          // Handle array response (all data at once, we'll paginate on client side)
          console.log(`Received array data with ${response.data.length} items`);
          responseData = response.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Handle paginated response from server
          console.log(`Received paginated data with ${response.data.results.length} items, total: ${response.data.count}`);
          responseData = response.data.results;
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Handle object response (convert to array of single item)
          console.log('Received object data, converting to array');
          // Check if the object is a collection of items
          if (Object.values(response.data).some(v => Array.isArray(v))) {
            // Find the first array property and use it
            for (const [key, value] of Object.entries(response.data)) {
              if (Array.isArray(value)) {
                console.log(`Using array data from '${key}' property`);
                responseData = value as any[];
                break;
              }
            }
          } else {
            // It's a single object, wrap in array
            responseData = [response.data];
          }
        }
        
        // Special handling for consultations to enhance patient and doctor data
        if (resource === 'consultations') {
          // Fetch users and doctors data for enhancing consultations
          let usersData: any[] = [];
          let doctorsData: any[] = [];
          
          try {
            const usersResponse = await api.get('/users/');
            usersData = Array.isArray(usersResponse.data) 
              ? usersResponse.data 
              : (usersResponse.data?.results || []);
              
            const doctorsResponse = await api.get('/doctors/');
            doctorsData = Array.isArray(doctorsResponse.data) 
              ? doctorsResponse.data 
              : (doctorsResponse.data?.results || []);
          } catch (err) {
            console.error('Error fetching users or doctors data:', err);
          }
          
          // Enhance consultations with user and doctor objects
          responseData = responseData.map(consultation => {
            const enhancedConsultation = { ...consultation };
            
            // Enhance patient data if it's just an ID
            if (typeof consultation.patient === 'number' || typeof consultation.patient === 'string') {
              const patientId = Number(consultation.patient);
              const patientData = usersData.find(user => user.id === patientId);
              if (patientData) {
                enhancedConsultation.patient = patientData;
              }
            }
            
            // Enhance doctor data if it's just an ID
            if (typeof consultation.doctor === 'number' || typeof consultation.doctor === 'string') {
              const doctorId = Number(consultation.doctor);
              const doctorData = doctorsData.find(doctor => doctor.id === doctorId);
              if (doctorData) {
                enhancedConsultation.doctor = doctorData;
              }
            }
            
            return enhancedConsultation;
          });
        }
        
        // Client-side pagination
        const itemsPerPage = 10;
        const totalItems = responseData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        setData(responseData);
        setFilteredData(responseData);
        setTotalItems(totalItems);
        setTotalPages(totalPages);
      } catch (err: any) {
        console.error(`Error fetching ${resource} data:`, err);
        
        let errorMessage = 'Failed to fetch data';
        
        if (err.response) {
          // The request was made and the server responded with a status code outside of 2xx range
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`;
          console.error('Error response:', err.response);
          
          // Special handling for 401/403 errors (authentication/authorization)
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: You need to log in again.';
          } else if (err.response.status === 403) {
            errorMessage = 'Authorization error: You do not have permission to view this data.';
          }
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from server. Please check your network connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = err.message || 'Unknown error occurred';
        }
        
        setError(errorMessage);
        setData([]);
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resource, page]);

  // Handle column display
  const getColumns = () => {
    if (!data.length) return [];
    
    try {
      // Get all possible fields from the first item
      const allFields = Object.keys(data[0]);
      
      // Filter out common fields to exclude
      const excludeFields = ['created_at', 'updated_at'];
      
      // For each resource, define the most important columns to display
      switch (resource) {
        case 'users':
          return ['id', 'username', 'email', 'first_name', 'last_name', 'role'];
        case 'doctors':
          return ['id', 'user', 'specialty', 'years_of_experience', 'rating'];
        case 'profiles':
          // For profiles, use nested user_data fields and phone_number
          return ['id', 'user_data.username', 'user_data.email', 'user_data.first_name', 'user_data.last_name', 'phone_number'];
        case 'payments':
          // For payments, customize the columns
          return ['id', 'user', 'amount', 'status', 'payment_method', 'transaction_id'];
        case 'scans':
          return ['id', 'user', 'image', 'upload_date', 'status', 'result_status'];
        case 'appointments':
          return ['id', 'user', 'date_time', 'status', 'notes'];
        case 'consultations':
          return ['id', 'patient', 'doctor', 'consultation_type', 'status'];
        default:
          // For other resources, take the first 5 fields excluding certain ones
          return allFields
            .filter(field => !excludeFields.includes(field))
            .slice(0, 5);
      }
    } catch (e) {
      console.error("Error determining columns:", e);
      return ['id']; // Fallback to just showing ID
    }
  };

  // Format cell value for display
  const formatCellValue = (item: any, column: string) => {
    // Handle null item
    if (!item) return '-';
    
    // For debugging
    if (resource === 'profiles' && column.includes('user_data')) {
      console.log(`formatCellValue for ${column} with item:`, item);
    }
    
    // Handle nested paths like user_data.username
    if (column.includes('.')) {
      const parts = column.split('.');
      const parentKey = parts[0];
      const childKey = parts[1];
      
      // Check if the item has the user_data property
      if (item && item[parentKey] && typeof item[parentKey] === 'object') {
        const nestedValue = item[parentKey][childKey];
        return nestedValue !== undefined && nestedValue !== null ? String(nestedValue) : '-';
      }
      
      return '-';
    }
    
    // For non-nested columns, get the value directly
    const value = item[column];
    
    // Handle null/undefined values
    if (value === null || value === undefined) return '-';
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Special handling for consultations
    if (resource === 'consultations') {
      // Format patient field
      if (column === 'patient') {
        if (typeof value === 'object' && value !== null) {
          return value.first_name && value.last_name 
            ? `${value.first_name} ${value.last_name}`
            : value.username || value.email || `ID: ${value.id}`;
        }
        return `Patient ID: ${value}`;
      }
      
      // Format doctor field
      if (column === 'doctor') {
        if (typeof value === 'object' && value !== null) {
          // If doctor has a user property that's an object
          if (value.user && typeof value.user === 'object') {
            const doctorUser = value.user;
            return doctorUser.first_name && doctorUser.last_name 
              ? `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`
              : doctorUser.username || doctorUser.email || `Doctor ID: ${value.id}`;
          }
          // If doctor object doesn't have a nested user object
          return value.specialty 
            ? `${value.specialty} Specialist (ID: ${value.id})`
            : `Doctor ID: ${value.id}`;
        }
        return `Doctor ID: ${value}`;
      }
      
      // Format consultation_type field
      if (column === 'consultation_type') {
        const typeMap: Record<string, string> = {
          'initial': 'Initial Consultation',
          'follow_up': 'Follow-up',
          'emergency': 'Emergency',
          'scan_review': 'Scan Review',
          'specialist': 'Specialist Consultation'
        };
        return typeMap[value] || value;
      }
    }
    
    // Special handling for date_time in appointments to avoid timezone issues
    if (column === 'date_time' && resource === 'appointments' && typeof value === 'string') {
      try {
        // Extract date and time parts directly from ISO string without timezone conversion
        const isoString = value;
        const datePart = isoString.split('T')[0];
        const timePart = isoString.split('T')[1].substring(0, 5); // Get HH:MM
        
        // Format date for display
        const [year, month, day] = datePart.split('-');
        const formattedDate = `${month}/${day}/${year}`;
        
        // Format time for display
        let hours = parseInt(timePart.split(':')[0]);
        const minutes = timePart.split(':')[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert to 12-hour format
        const formattedTime = `${hours}:${minutes} ${ampm}`;
        
        return `${formattedDate} ${formattedTime}`;
      } catch (e) {
        console.error('Error formatting date_time:', e);
        return value; // Fallback to original value
      }
    }
    
    // Handle date-like strings
    if (typeof value === 'string' && (value.includes('T') || value.includes('-')) && !isNaN(Date.parse(value))) {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return value; // Fallback to original value if date parsing fails
      }
    }
    
    // Format by column type
    if (column === 'status') {
      return (
        <Badge 
          className={
            value === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200 transition-colors' : 
            value === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors' :
            value === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200 transition-colors' :
            value === 'confirmed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors' :
            'transition-colors hover:bg-gray-100'
          }
        >
          {value}
        </Badge>
      );
    }
    
    // Handle image URLs
    if (column === 'image' || column === 'profile_picture') {
      if (typeof value === 'string') {
        if (value.startsWith('http')) {
          return (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-cyan-600 hover:text-cyan-800 hover:underline transition-colors duration-200"
            >
              View Image
            </a>
          );
        } else {
          // Don't include API_BASE_URL if path already starts with /
          const fullUrl = value.startsWith('/') 
            ? `${window.location.origin}${value}`
            : `${API_BASE_URL}/${value}`;
          return (
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-cyan-600 hover:text-cyan-800 hover:underline transition-colors duration-200"
            >
              View Image
            </a>
          );
        }
      }
      return '-';
    }
    
    // Handle objects (like nested resources)
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length} items]` : '[]';
      }
      
      // If object has an id and either name or username property, display a meaningful representation
      if (value && typeof value === 'object' && 'id' in value) {
        const displayName = value.name || value.username || value.first_name || 
          (value.first_name && value.last_name ? `${value.first_name} ${value.last_name}` : `ID: ${value.id}`);
        return displayName;
      }
      
      // Default object format
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Complex Object]';
      }
    }
    
    return String(value);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (!resource) return;
    setPage(1);
    // The useEffect will trigger data refetch
  };

  // Modify handleEdit
  const handleEdit = (item: ApiResource) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  // Modify handleAdd
  const handleAdd = () => {
    setSelectedItem(null);
    setIsAddDialogOpen(true);
  };

  // Handle item delete
  const handleDelete = (item: ApiResource) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Perform delete operation
  const confirmDelete = async () => {
    if (!selectedItem || !resource) return;
    
    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
    if (!endpoint) return;
    
    try {
      setLoading(true);
      
      // Construct the correct URL format for the delete operation
      const deleteUrl = `${endpoint}${selectedItem.id}/`;
      console.log(`Attempting to delete item with ID ${selectedItem.id} from ${deleteUrl}`);
      
      // Attempt the delete operation
      await api.delete(deleteUrl);
      
      // Update local state
      setData(data.filter(item => item.id !== selectedItem.id));
      setTotalItems(prev => Math.max(0, prev - 1));
      
      // Show success toast for delete
      toast({
        title: "Deleted successfully",
        description: (
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{`${getResourceDisplayName(resource)} item with ID ${selectedItem.id} has been deleted.`}</span>
          </div>
        ),
        variant: "default",
        duration: 3000,
        className: "bg-green-50 border-green-200",
      });
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      
      let errorMessage = 'Failed to delete item';
      
      if (err.response) {
        // Handle specific error status codes
        if (err.response.status === 404) {
          errorMessage = 'Item not found. It may have been deleted already.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to delete this item.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.detail || 'Invalid request data';
        } else if (err.response.status === 409) {
          errorMessage = 'Cannot delete this item because it is referenced by other items.';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.error || 'Server returned an error';
        }
      }
      
      toast({
        title: "Error deleting item",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle save edited item
  const handleSaveEdit = async (formData: FormData) => {
    if (!resource) return;
    
    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
    if (!endpoint) return;
    
    try {
      setLoading(true);
      
      // Debug logging to see what's happening
      console.log('handleSaveEdit called for resource:', resource);
      console.log('Form data entries:', Object.fromEntries(formData.entries()));
      console.log('selectedItem:', selectedItem);
      console.log('isEditDialogOpen:', isEditDialogOpen);
      console.log('isAddDialogOpen:', isAddDialogOpen);
      
      let response;
      
      // Special handling for users - use register endpoint for new users
      if (resource === 'users') {
        if (!selectedItem || !selectedItem.id) {
          // New user - check for required fields
          const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirm_password: formData.get('confirm_password'),
            first_name: formData.get('first_name') || '',
            last_name: formData.get('last_name') || '',
            role: formData.get('role') || 'patient',
            subscription_type: formData.get('subscription_type') || 'free'
          };
          
          if (!userData.username || !userData.email || !userData.password || !userData.confirm_password) {
            toast({
              title: "Error creating user",
              description: "Username, email, password and confirm password are required",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          response = await api.post('/users/register/', userData);
        } else {
          // Existing user - update (don't send password)
          const userId = selectedItem.id;
          const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            first_name: formData.get('first_name') || '',
            last_name: formData.get('last_name') || '',
            role: formData.get('role') || 'patient',
            subscription_type: formData.get('subscription_type') || 'free'
          };
          response = await api.patch(`${endpoint}${userId}/`, userData);
        }
      }
      // Special handling for profiles
      else if (resource === 'profiles') {
        if (!selectedItem || !selectedItem.id) {
          // Creating a new profile
          const profileData = new FormData();
          // Get the user ID from the form
          const userId = formData.get('user');
          if (!userId) {
            toast({
              title: "Error creating profile",
              description: "User ID is required",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          profileData.append('user', userId.toString());
          profileData.append('phone_number', formData.get('phone_number') || '');
          profileData.append('address', formData.get('address') || '');
          
          // Handle profile picture if provided
          const profilePicture = formData.get('profile_picture');
          if (profilePicture instanceof File && profilePicture.size > 0) {
            profileData.append('profile_picture', profilePicture);
          }
          
          response = await api.post(endpoint, profileData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // Updating an existing profile
          const profileId = selectedItem.id;
          const profileData = new FormData();
          
          // Add profile data
          profileData.append('phone_number', formData.get('phone_number') || '');
          profileData.append('address', formData.get('address') || '');
          
          // Handle profile picture if provided
          const profilePicture = formData.get('profile_picture');
          if (profilePicture instanceof File && profilePicture.size > 0) {
            profileData.append('profile_picture', profilePicture);
          }
          
          response = await api.patch(`${endpoint}${profileId}/`, profileData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }
      // Special handling for doctors
      else if (resource === 'doctors') {
        // Handle doctor creation/update similarly to profiles...
        if (!selectedItem || !selectedItem.id) {
          // Creating a new doctor
          const doctorData = new FormData();
          // Get the user ID from the form
          const userId = formData.get('user');
          if (!userId) {
            toast({
              title: "Error creating doctor",
              description: "User ID is required",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Add doctor data
          doctorData.append('user', userId.toString());
          doctorData.append('specialty', formData.get('specialty') || 'general');
          doctorData.append('license_number', formData.get('license_number') || '');
          doctorData.append('years_of_experience', formData.get('years_of_experience') || '0');
          doctorData.append('gender', formData.get('gender') || '');
          doctorData.append('consultation_fee', formData.get('consultation_fee') || '0');
          doctorData.append('bio', formData.get('bio') || '');
          
          response = await api.post(endpoint, doctorData);
        } else {
          // Updating an existing doctor
          const doctorId = selectedItem.id;
          const doctorData = {};
          
          // Add doctor data to update
          for (const [key, value] of formData.entries()) {
            if (key !== 'id' && key !== 'user') {
              doctorData[key] = value;
            }
          }
          
          response = await api.patch(`${endpoint}${doctorId}/`, doctorData);
        }
      } 
      // Special handling for appointments
      else if (resource === 'appointments') {
        if (!selectedItem || !selectedItem.id) {
          // Creating a new appointment
          const appointmentData = Object.fromEntries(formData.entries());
          
          // Use the date_time field directly without timezone conversion
          if (appointmentData.date_time) {
            console.log('Using direct date_time value:', appointmentData.date_time);
          } else if (appointmentData.date && appointmentData.time) {
            // If date_time isn't set but date and time are, create ISO string
            appointmentData.date_time = `${appointmentData.date}T${appointmentData.time}:00.000Z`;
            console.log('Created date_time from date and time:', appointmentData.date_time);
          }
          
          response = await api.post(endpoint, appointmentData);
        } else {
          // Updating an existing appointment
          const itemId = selectedItem.id;
          const appointmentData = Object.fromEntries(formData.entries());
          
          // Use the date_time field directly without timezone conversion
          if (appointmentData.date_time) {
            console.log('Using direct date_time value for update:', appointmentData.date_time);
          } else if (appointmentData.date && appointmentData.time) {
            // If date_time isn't set but date and time are, create ISO string
            appointmentData.date_time = `${appointmentData.date}T${appointmentData.time}:00.000Z`;
            console.log('Created date_time from date and time for update:', appointmentData.date_time);
          }
          
          response = await api.put(`${endpoint}${itemId}/`, appointmentData);
        }
      }
      // Special handling for consultations
      else if (resource === 'consultations') {
        if (!selectedItem || !selectedItem.id) {
          // Creating a new consultation
          const consultationData = Object.fromEntries(formData.entries());
          
          // Validate required fields
          if (!consultationData.patient || !consultationData.doctor || !consultationData.consultation_type || !consultationData.status) {
            toast({
              title: "Error creating consultation",
              description: "Patient, doctor, consultation type, and status are required",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          response = await api.post(endpoint, consultationData);
        } else {
          // Updating an existing consultation
          const itemId = selectedItem.id;
          const consultationData = Object.fromEntries(formData.entries());
          
          response = await api.put(`${endpoint}${itemId}/`, consultationData);
        }
      }
      // For all other resources
      else {
        if (!selectedItem || !selectedItem.id) {
          // Creating a new item
          // Convert formData to a regular object
          const data = Object.fromEntries(formData.entries());
          response = await api.post(endpoint, data);
        } else {
          // Updating an existing item
          const itemId = selectedItem.id;
          const data = Object.fromEntries(formData.entries());
          response = await api.put(`${endpoint}${itemId}/`, data);
        }
      }
      
      // Prepare the toast notification message and variant
      const operation = selectedItem ? 'updated' : 'created';
      
      // Show success toast
      toast({
        title: `${operation} successfully`,
        description: (
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{`${getResourceDisplayName(resource)} has been ${operation}.`}</span>
          </div>
        ),
        variant: "default",
        duration: 3000,
        className: "bg-green-50 border-green-200",
      });
      
      // Update local state by forcing a page reload
      window.location.reload();
    } catch (err: any) {
      console.error('Error creating/updating item:', err);
      
      // Get error message
      let errorMessage = selectedItem 
        ? 'Failed to update item' 
        : 'Failed to create item';
      
      if (err.response) {
        console.log('Error response data:', err.response.data);
        
        if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
          } else {
          // Check for field-specific errors
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(err.response.data || {})) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`);
            }
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
          }
        }
      }
      
      toast({
        title: "Error creating item",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update filtered data whenever data, search term, or filters change
  useEffect(() => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }
    
    let result = [...data];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        // Search through all string and number properties
        return Object.entries(item).some(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value).toLowerCase().includes(term);
          }
          // Also try to search in nested objects if they have name or title properties
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const objValue = value as Record<string, any>;
            if (objValue.name && typeof objValue.name === 'string') {
              return objValue.name.toLowerCase().includes(term);
            }
            if (objValue.title && typeof objValue.title === 'string') {
              return objValue.title.toLowerCase().includes(term);
            }
            if (objValue.username && typeof objValue.username === 'string') {
              return objValue.username.toLowerCase().includes(term);
            }
          }
          return false;
        });
      });
    }
    
    // Apply field filters
    if (Object.keys(filters).length) {
      Object.entries(filters).forEach(([field, value]) => {
        if (!value) return; // Skip empty filters
        
        result = result.filter(item => {
          const fieldValue = item[field];
          
          // Handle boolean values
          if (typeof fieldValue === 'boolean') {
            return String(fieldValue) === value;
          }
          
          // Handle string and number values
          if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
            return String(fieldValue).toLowerCase().includes(value.toLowerCase());
          }
          
          // Handle nested objects
          if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
            const objValue = fieldValue as Record<string, any>;
            // Check for common identifier fields
            for (const idField of ['id', 'name', 'title', 'username']) {
              if (objValue[idField]) {
                return String(objValue[idField]).toLowerCase().includes(value.toLowerCase());
              }
            }
          }
          
          return false;
        });
      });
    }
    
    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];
        
        // Handle nulls and undefined
        if (valueA === null || valueA === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (valueB === null || valueB === undefined) return sortDirection === 'asc' ? 1 : -1;
        
        // Handle different value types
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Try to convert to strings as fallback
        const strA = String(valueA);
        const strB = String(valueB);
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    
    setFilteredData(result);
    // Update total pages based on filtered data
    setTotalPages(Math.ceil(result.length / 10));
  }, [data, searchTerm, filters, sortField, sortDirection]);
  
  // Get filter fields based on the resource
  const getFilterFields = () => {
    // Get the columns for the current resource
    const columns = getColumns();
    
    // Define fields that are suitable for filtering
    const filterableFields = ['status', 'role', 'is_read', 'notification_type', 'payment_method', 'specialty'];
    
    // Return columns that are in the filterable fields list, or common identifier fields
    return columns.filter(column => 
      filterableFields.includes(column) || 
      ['name', 'title', 'type', 'category'].includes(column)
    );
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  
  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset to first page when filtering
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortField(null);
    setSortDirection('asc');
    setPage(1);
  };
  
  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Start with ascending sort for new field
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get the current page of data to display
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    return filteredData.slice(startIndex, endIndex);
  };

  // Fetch users, doctors, and scans for dropdowns
  const fetchDropdownData = async () => {
    // Modified to fetch user data for both consultations and payments
    if (resource !== 'consultations' && resource !== 'payments' && resource !== 'appointments') return;
    
    setLoadingDropdowns(true);
    
    try {
      // Fetch users
      const usersResponse = await api.get('/users/');
      if (usersResponse.data && Array.isArray(usersResponse.data)) {
        setUsers(usersResponse.data);
      } else if (usersResponse.data && usersResponse.data.results) {
        setUsers(usersResponse.data.results);
      }
      
      if (resource === 'consultations') {
        // Fetch doctors
        const doctorsResponse = await api.get('/doctors/');
        if (doctorsResponse.data && Array.isArray(doctorsResponse.data)) {
          setDoctors(doctorsResponse.data);
        } else if (doctorsResponse.data && doctorsResponse.data.results) {
          setDoctors(doctorsResponse.data.results);
        }
        
        // Fetch scans
        const scansResponse = await api.get('/scans/');
        if (scansResponse.data && Array.isArray(scansResponse.data)) {
          setScans(scansResponse.data);
        } else if (scansResponse.data && scansResponse.data.results) {
          setScans(scansResponse.data.results);
        }
      }
      
      // If it's an appointment resource, fetch taken slots for today
      if (resource === 'appointments' && !selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        fetchTakenSlots(today);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  };
  
  // Load dropdown data when needed
  useEffect(() => {
    if ((resource === 'consultations' || resource === 'payments' || resource === 'appointments') && (isAddDialogOpen || isEditDialogOpen)) {
      fetchDropdownData();
    }
  }, [resource, isAddDialogOpen, isEditDialogOpen]);

  // Add CSS for dialog close button hover effect
  useEffect(() => {
    // Add custom CSS style to head
    const style = document.createElement('style');
    style.innerHTML = `
      .dialog-close-button:hover svg {
        color: #0891b2 !important; /* Cyan-600 color */
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup on component unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewDetailsItem, setViewDetailsItem] = useState<ApiResource | null>(null);

  // Handle view details
  const handleViewDetails = (item: ApiResource) => {
    setViewDetailsItem(item);
    setIsViewDetailsDialogOpen(true);
  };

  // Handle export to CSV
  const handleExport = (item: ApiResource) => {
    // Convert item to CSV format
    const columns = getColumns();
    const headers = columns.map(col => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '));
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add the single item's data
    const rowData = columns.map(col => {
      const value = item[col];
      // Handle different value types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
      return String(value).replace(/,/g, ';'); // Replace commas to avoid CSV issues
    });
    csvContent += rowData.join(',');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${resource}_${item.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success toast
    toast({
      title: "Export Successful",
      description: `${getResourceDisplayName(resource)} data has been exported to CSV.`,
      duration: 3000,
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Show friendly message for restricted resources
  if (resource === 'scans' || resource === 'notifications') {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Access Restricted</CardTitle>
            <CardDescription>
              This resource cannot be managed in the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">Resource Unavailable</p>
                  <p className="text-amber-700 text-sm mt-1">
                    {resource === 'scans' ? 
                      'Scans are AI-controlled and cannot be directly managed by administrators.' : 
                      'Notifications are system-generated based on user actions and cannot be directly managed.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/admin">Return to Admin Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{getResourceDisplayName(resource)} Management</CardTitle>
              <CardDescription>
                Manage {resource} data in the system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {isDebugMode && (
          <div className="px-6 py-2 bg-amber-50 border-y border-amber-200">
            <details>
              <summary className="cursor-pointer text-amber-800 text-sm font-medium">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-amber-100/50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(getDebugInfo(), null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-6 border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2 text-cyan-600 hover:text-cyan-800 transition-colors duration-200" 
                  onClick={handleRefresh}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          
          {/* Search and Filter Section */}
          <div className="mb-6 mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`transition-all duration-200 ${showFilters ? "bg-primary/10 text-primary border-primary" : ""} hover:text-primary hover:border-primary`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="transition-all duration-200 hover:text-primary hover:border-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                
                {(searchTerm || Object.keys(filters).length > 0 || sortField) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="hover:text-primary transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-primary" />
                  Filter by:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilterFields().map(field => (
                    <div key={field} className="space-y-1">
                      <label htmlFor={`filter-${field}`} className="text-xs font-medium text-gray-700">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
                      </label>
                      <Input
                        id={`filter-${field}`}
                        type="text"
                        placeholder={`Filter by ${field}...`}
                        value={filters[field] || ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        className="h-8 text-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Results summary */}
            <div className="text-sm text-gray-500 mt-2 flex justify-between items-center">
              <p>
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  <span>
                    Showing {getCurrentPageData().length} of {filteredData.length} 
                    {filteredData.length !== totalItems ? 
                    ` filtered results (${totalItems} total)` : 
                    ` ${getResourceDisplayName(resource).toLowerCase()}`}
                  </span>
                )}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="transition-all duration-200 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 hover:border-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {getResourceDisplayName(resource)}
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-gray-500">Loading {getResourceDisplayName(resource)}...</p>
              </div>
            </div>
          ) : !error && filteredData.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="flex flex-col items-center">
                {searchTerm || Object.keys(filters).length > 0 ? (
                  <>
                    <Search className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No matching {resource} found</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
                    <Button 
                      variant="link" 
                      className="mt-3 text-primary hover:text-primary/80 transition-colors duration-200" 
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <AlertCircle className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No {resource} data found</p>
                    <p className="text-gray-500 text-sm mt-1">Add your first {getResourceDisplayName(resource).toLowerCase()} to get started</p>
                    <div className="flex gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        className="transition-colors duration-200" 
                        onClick={handleRefresh}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        onClick={handleAdd}
                        className="transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {getResourceDisplayName(resource)}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : !error ? (
            <div className="overflow-x-auto border border-gray-100 rounded-lg shadow-sm">
              <Table>
                <TableCaption>
                  {totalItems > 0 ? (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {getCurrentPageData().length}
                      </span> 
                      <span>of</span> 
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {filteredData.length}
                      </span> 
                      <span>{getResourceDisplayName(resource)}</span>
                      {filteredData.length !== totalItems && (
                        <span className="text-gray-500 ml-1">
                          (filtered from {totalItems} total)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <span>List of {getResourceDisplayName(resource)}</span>
                    </div>
                  )}
                </TableCaption>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    {getColumns().map(column => (
                      <TableHead 
                        key={column}
                        className={`cursor-pointer hover:bg-primary/5 transition-colors duration-200 ${sortField === column ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center">
                          {column.includes('.') 
                            ? column.split('.')[1].charAt(0).toUpperCase() + column.split('.')[1].slice(1).replace(/_/g, ' ')
                            : column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')
                          }
                          {sortField === column ? (
                            sortDirection === 'asc' ? 
                              <ChevronUp className="ml-1 h-4 w-4 text-primary" /> : 
                              <ChevronDown className="ml-1 h-4 w-4 text-primary" />
                          ) : (
                            <ChevronUp className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-20" />
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageData().map((item, index) => {
                    // Debug info for profiles
                    if (resource === 'profiles') {
                      console.log(`Rendering profile item:`, item);
                    }
                    
                    return (
                    <TableRow 
                      key={item.id}
                      className={`transition-all duration-200 group border-b border-gray-200 last:border-b-0 ${
                        index % 2 === 0 
                          ? "bg-white" 
                          : "bg-cyan-50/70"
                      } hover:bg-primary/5`}
                    >
                        {getColumns().map(column => {
                          if (resource === 'profiles' && column.includes('user_data')) {
                            console.log(`Rendering column ${column} for profile ${item.id}`, 
                              item.user_data ? `user_data exists` : 'no user_data',
                              item.user_data ? item.user_data[column.split('.')[1]] : 'N/A'
                            );
                          }
                          
                          return (
                        <TableCell 
                          key={`${item.id}-${column}`}
                          className="py-3"
                        >
                              {formatCellValue(item, column)}
                        </TableCell>
                          );
                        })}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-70 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(item)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Export</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item)}
                              className="text-red-600 focus:text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

        {filteredData.length > 10 && !error && (
        <div className="mt-8 mb-10 flex justify-center">
          <div className="relative" 
            style={{ 
              width: (() => {
                // Determine width based on number of pages
                if (totalPages <= 1) return '240px';
                if (totalPages === 2) return '300px';  
                if (totalPages === 3) return '360px';
                if (totalPages === 4) return '420px';
                return totalPages <= 5 ? '480px' : '520px'; // 5+ pages
              })(),
              maxWidth: '95vw'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-[22px] blur-xl -z-10 transform scale-105 opacity-60"></div>
            <Pagination className="pagination-Glass p-3 px-4 rounded-2xl w-full">
              <PaginationContent className={`pagination-content flex ${totalPages <= 3 ? 'justify-evenly' : 'justify-center'}`}>
                <PaginationItem className="pagination-item">
                  <PaginationPrevious 
                    onClick={() => !loading && page > 1 ? setPage(p => p - 1) : undefined}
                    aria-disabled={page === 1 || loading}
                    className={`pagination-prev ${page === 1 || loading ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum} className="pagination-item">
                      <PaginationLink 
                        isActive={pageNum === page}
                        onClick={() => setPage(pageNum)}
                        className={`pagination-link ${pageNum === page 
                          ? "active bg-primary text-white hover:bg-primary/90 shadow-lg" 
                          : "hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                        }`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <PaginationItem className="pagination-item">
                    <PaginationEllipsis className="pagination-link backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300" />
                  </PaginationItem>
                )}
                
                <PaginationItem className="pagination-item">
                  <PaginationNext 
                    onClick={() => !loading && page < totalPages ? setPage(p => p + 1) : undefined}
                    aria-disabled={page === totalPages || loading}
                    className={`pagination-next ${page === totalPages || loading ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
        )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-800">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {resource} item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="transition-all duration-200 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="transition-all duration-200 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace the Edit Dialog with our new ResourceManager component */}
      {resource && (
        <ResourceManager 
          resource={resource}
          isOpen={isEditDialogOpen} 
          onClose={() => setIsEditDialogOpen(false)} 
          selectedItem={selectedItem}
          onSave={handleSaveEdit}
          isAddMode={false}
        />
      )}

      {/* Replace the Add Dialog with our new ResourceManager component */}
      {resource && (
        <ResourceManager 
          resource={resource}
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          selectedItem={null}
          onSave={handleSaveEdit}
          isAddMode={true}
        />
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {viewDetailsItem ? `${getResourceDisplayName(resource)} Details` : 'Details'}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this {resource} item
            </DialogDescription>
          </DialogHeader>
          
          {viewDetailsItem && (
            <div className="mt-4 space-y-4">
              {/* Item ID and basic info */}
              <div className="bg-primary/5 p-3 rounded-md">
                <div className="font-medium text-sm text-primary">ID: {viewDetailsItem.id}</div>
              </div>
              
              {/* All properties */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(viewDetailsItem).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm font-medium text-gray-900">{key}</td>
                        <td className="py-2 px-3 text-sm text-gray-700">
                          {(() => {
                            // Format the value based on its type
                            if (value === null || value === undefined) return '-';
                            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                            if (typeof value === 'object') {
                              if (Array.isArray(value)) {
                                return value.length > 0 ? 
                                  <div className="max-h-32 overflow-y-auto">
                                    <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
                                  </div> : '[]';
                              }
                              return (
                                <div className="max-h-32 overflow-y-auto">
                                  <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
                                </div>
                              );
                            }
                            // Handle date-like strings
                            if (typeof value === 'string' && (value.includes('T') || value.includes('-')) && !isNaN(Date.parse(value))) {
                              try {
                                return new Date(value).toLocaleString();
                              } catch (e) {
                                return value;
                              }
                            }
                            return String(value);
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsViewDetailsDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => viewDetailsItem && handleExport(viewDetailsItem)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagementPage; 