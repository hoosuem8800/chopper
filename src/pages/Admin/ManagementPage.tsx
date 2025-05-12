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
import { Loader2, Plus, Pencil, Trash2, AlertCircle, RefreshCw, Filter, Search, X, CheckCircle, Lock, User, Calendar, ArrowRight, ArrowLeft, Clock, Mail } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";

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
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          // Handle array response (all data at once, we'll paginate on client side)
          console.log(`Received array data with ${response.data.length} items`);
          
          // Client-side pagination
          const itemsPerPage = 10;
          const start = (page - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          const paginatedData = response.data.slice(start, end);
          
          setData(response.data);
          setFilteredData(response.data);
          setTotalItems(response.data.length);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Handle paginated response from server
          console.log(`Received paginated data with ${response.data.results.length} items, total: ${response.data.count}`);
          setData(response.data.results);
          setFilteredData(response.data.results);
          setTotalItems(response.data.count || response.data.results.length);
          setTotalPages(Math.ceil((response.data.count || response.data.results.length) / 10));
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Handle object response (convert to array of single item)
          console.log('Received object data, converting to array');
          // Check if the object is a collection of items
          if (Object.values(response.data).some(v => Array.isArray(v))) {
            // Find the first array property and use it
            for (const [key, value] of Object.entries(response.data)) {
              if (Array.isArray(value)) {
                console.log(`Using array data from '${key}' property`);
                
                // Client-side pagination
                const itemsPerPage = 10;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedData = (value as any[]).slice(start, end);
                
                setData(value as any[]);
                setFilteredData(value as any[]);
                setTotalItems(value.length);
                setTotalPages(Math.ceil(value.length / itemsPerPage));
                break;
              }
            }
          } else {
            // It's a single object, wrap in array
            setData([response.data]);
            setFilteredData([response.data]);
            setTotalItems(1);
            setTotalPages(1);
          }
        } else {
          // Handle empty or unexpected response
          console.warn('Received empty or unexpected data format', response.data);
          setData([]);
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(1);
        }
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
      
          // Use register endpoint for new users
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setLoading(true);
                  // Force refetch by resetting data and page
                  setData([]);
                  setFilteredData([]);
                  
                  // Reset page to 1 if not already there
                  if (page !== 1) {
                    setPage(1);
                  } else {
                    // If already on page 1, manually trigger data fetch
                    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
                    if (endpoint) {
                      api.get(endpoint)
                        .then(response => {
                          console.log('Refresh successful:', response);
                          
                          // Process the response based on its format
                          if (response.data && Array.isArray(response.data)) {
                            setData(response.data);
                            setFilteredData(response.data);
                            setTotalItems(response.data.length);
                          } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
                            setData(response.data.results);
                            setFilteredData(response.data.results);
                            setTotalItems(response.data.count || response.data.results.length);
                          }
                          
                          toast({
                            title: "Refreshed",
                            description: "Data has been refreshed successfully",
                            variant: "default",
                            className: "bg-green-50 border-green-200",
                          });
                        })
                        .catch(error => {
                          console.error('Error refreshing data:', error);
                          toast({
                            title: "Refresh failed",
                            description: "Could not refresh data. Please try again.",
                            variant: "destructive",
                          });
                        })
                        .finally(() => {
                          setLoading(false);
                        });
                    }
                  }
                }}
                disabled={loading}
                title="Refresh data"
                className="transition-all duration-200 hover:text-cyan-600 hover:border-cyan-500"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={handleAdd} 
                className="flex items-center gap-2 transition-all duration-200 hover:bg-white hover:text-cyan-600 hover:scale-105 hover:border-cyan-500 hover:border-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
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
                    className="pl-10 focus:border-cyan-500 focus:ring focus:ring-cyan-200 transition-all duration-200"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`transition-all duration-200 ${showFilters ? "bg-blue-50" : ""} hover:text-cyan-600 hover:border-cyan-500 hover:border-2`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
                </Button>
                
                {(searchTerm || Object.keys(filters).length > 0 || sortField) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="hover:text-cyan-600 transition-all duration-200"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="text-sm font-medium mb-3">Filter by:</h3>
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
                        className="h-8 text-sm focus:border-cyan-500 focus:ring focus:ring-cyan-200 transition-all duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Results summary */}
            <div className="text-sm text-gray-500 mt-2">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <p>
                  Showing {getCurrentPageData().length} of {filteredData.length} 
                  {filteredData.length !== totalItems ? 
                   ` filtered results (${totalItems} total)` : 
                   ` ${getResourceDisplayName(resource).toLowerCase()}`}
                </p>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !error && filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || Object.keys(filters).length > 0 ? (
                <>
                  <p>No matching {resource} found with current filters</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-cyan-600 hover:text-cyan-800 transition-colors duration-200" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <p>No {resource} data found in the system.</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-cyan-600 hover:text-cyan-800 transition-colors duration-200" 
                    onClick={handleRefresh}
                  >
                    Refresh
                  </Button>
                </>
              )}
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  {totalItems > 0 ? (
                    <>Showing {getCurrentPageData().length} of {filteredData.length} {getResourceDisplayName(resource)}</>
                  ) : (
                    <>List of {getResourceDisplayName(resource)}</>
                  )}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    {getColumns().map(column => (
                      <TableHead 
                        key={column}
                        className={`cursor-pointer hover:bg-cyan-50 transition-colors duration-200 ${sortField === column ? 'bg-cyan-50 text-cyan-700' : ''}`}
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center">
                          {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')}
                          {sortField === column && (
                            <span className="ml-1 text-cyan-700">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageData().map(item => {
                    // Debug info for profiles
                    if (resource === 'profiles') {
                      console.log(`Rendering profile item:`, item);
                    }
                    
                    return (
                    <TableRow 
                      key={item.id}
                      className="transition-all duration-200 hover:bg-cyan-50 hover:shadow cursor-pointer"
                    >
                        {getColumns().map(column => {
                          if (resource === 'profiles' && column.includes('user_data')) {
                            console.log(`Rendering column ${column} for profile ${item.id}`, 
                              item.user_data ? `user_data exists` : 'no user_data',
                              item.user_data ? item.user_data[column.split('.')[1]] : 'N/A'
                            );
                          }
                          
                          return (
                        <TableCell key={`${item.id}-${column}`}>
                              {formatCellValue(item, column)}
                        </TableCell>
                          );
                        })}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEdit(item)}
                            className="transition-all duration-200 hover:text-cyan-600 hover:border-cyan-500 hover:bg-cyan-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDelete(item)}
                            className="transition-all duration-200 hover:text-red-600 hover:border-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-[22px] blur-xl -z-10 transform scale-105 opacity-60"></div>
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
                          ? "active bg-cyan-500/80 backdrop-blur-md text-white dark:bg-cyan-600/80 hover:bg-cyan-600/90 dark:hover:bg-cyan-500/90 shadow-lg" 
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
    </div>
  );
};

export default ManagementPage; 