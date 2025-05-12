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
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, AlertCircle, RefreshCw, Search, X, CheckCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

// Import the resource manager components
import ResourceManager from './ResourceManagers';
import { 
  getResourceDisplayName, 
  resourceToEndpoint, 
  ApiResource,
  User, 
  Doctor, 
  Profile,
  Payment,
  Consultation,
  Appointment,
  Scan
} from './ResourceManagers/types';

/**
 * Example of how ManagementPage would look after refactoring
 * This is much cleaner and focused on the main table and data management
 */
const ManagementPage: React.FC = (): ReactElement => {
  const { resource } = useParams<{ resource: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Basic state
  const [data, setData] = useState<ApiResource[]>([]);
  const [filteredData, setFilteredData] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Dialog state
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
  
  // Authorization check
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
    }
  }, [isAuthenticated, user, navigate, resource]);

  // Resource display name
  const getResourceDisplayName = (resourceType?: string) => {
    if (!resourceType) return 'Resources';
    if (resourceType === 'profiles') return 'User Profiles';
    return resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  // Debug information
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

  // Fetch data from API
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
        let url = `${endpoint}?page=${page}`;
        
        try {
          response = await api.get(url);
        } catch (err) {
          // If paginated endpoint fails, try the base endpoint
          response = await api.get(endpoint);
        }
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data)) {
          // Handle array response
          const itemsPerPage = 10;
          setData(response.data);
          setFilteredData(response.data);
          setTotalItems(response.data.length);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Handle paginated response
          setData(response.data.results);
          setFilteredData(response.data.results);
          setTotalItems(response.data.count || response.data.results.length);
          setTotalPages(Math.ceil((response.data.count || response.data.results.length) / 10));
        } else {
          // Handle other formats
          setData([]);
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (err: any) {
        console.error(`Error fetching ${resource} data:`, err);
        
        let errorMessage = 'Failed to fetch data';
        
        if (err.response) {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`;
          
          if (err.response.status === 401) {
            errorMessage = 'Authentication error: You need to log in again.';
          } else if (err.response.status === 403) {
            errorMessage = 'Authorization error: You do not have permission to view this data.';
          }
        } else if (err.request) {
          errorMessage = 'No response received from server. Please check your network connection.';
        } else {
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
      // For each resource, define the most important columns to display
      switch (resource) {
        case 'users':
          return ['id', 'username', 'email', 'first_name', 'last_name', 'role'];
        case 'doctors':
          return ['id', 'user', 'specialty', 'years_of_experience', 'license_number'];
        case 'profiles':
          return ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number'];
        case 'payments':
          return ['id', 'user', 'amount', 'status', 'payment_method', 'transaction_id'];
        case 'scans':
          return ['id', 'user', 'image', 'upload_date', 'status', 'result_status'];
        case 'appointments':
          return ['id', 'user', 'date_time', 'status', 'notes'];
        case 'consultations':
          return ['id', 'patient', 'doctor', 'consultation_type', 'status'];
        default:
          return Object.keys(data[0]).slice(0, 5);
      }
    } catch (e) {
      console.error("Error determining columns:", e);
      return ['id']; // Fallback to just showing ID
    }
  };

  // Format cell value for display
  const formatCellValue = (value: any, column: string) => {
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
        return value;
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
      return '-';
    }
    
    // Handle objects
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `[${value.length} items]` : '[]';
      }
      
      if (value && typeof value === 'object' && 'id' in value) {
        const displayName = value.name || value.username || value.first_name || 
          (value.first_name && value.last_name ? `${value.first_name} ${value.last_name}` : `ID: ${value.id}`);
        return displayName;
      }
      
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

  // Handle item edit
  const handleEdit = (item: ApiResource) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
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
      
      const deleteUrl = `${endpoint}${selectedItem.id}/`;
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
        if (err.response.status === 404) {
          errorMessage = 'Item not found. It may have been deleted already.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to delete this item.';
        } else {
          errorMessage = err.response.data?.detail || 'Server returned an error';
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

  // Handle add new item
  const handleAdd = () => {
    setSelectedItem(null);
    setIsAddDialogOpen(true);
  };

  // Handle save edited item
  const handleSaveEdit = async (formData: FormData) => {
    if (!selectedItem || !resource) return;
    
    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
    if (!endpoint) return;
    
    try {
      setLoading(true);
      
      // Special case processing based on resource
      let response;
      
      // Convert form data to object
      const formValues: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        // Skip empty password fields
        if ((key === 'password' || key.includes('password')) && value === '') {
          continue;
        }
        
        formValues[key] = value;
      }
      
      // Special handling for files
      const hasFiles = Array.from(formData.entries()).some(([_, value]) => value instanceof File && (value as File).size > 0);
      
      // Make API call
      response = hasFiles
        ? await api.put(`${endpoint}${selectedItem.id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await api.put(`${endpoint}${selectedItem.id}/`, formValues, {
            headers: { 'Content-Type': 'application/json' }
          });
      
      // Update local data
      setData(data.map(item => item.id === selectedItem.id ? response.data : item));
      setFilteredData(filteredData.map(item => item.id === selectedItem.id ? response.data : item));
      
      // Show success toast
      toast({
        title: "Updated successfully",
        description: (
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{`${getResourceDisplayName(resource)} has been updated.`}</span>
          </div>
        ),
        variant: "default",
        duration: 3000,
        className: "bg-green-50 border-green-200",
      });
      
      // Close dialog
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating item:', err);
      
      let errorMessage = 'Failed to update item';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      }
      
      toast({
        title: "Error updating item",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle save new item
  const handleSaveNew = async (formData: FormData) => {
    if (!resource) return;
    
    const endpoint = resourceToEndpoint[resource as keyof typeof resourceToEndpoint];
    if (!endpoint) return;
    
    try {
      setLoading(true);
      
      // Special case processing based on resource
      let response;
      
      // Convert form data to object
      const formValues: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        formValues[key] = value;
      }
      
      // Special handling for files
      const hasFiles = Array.from(formData.entries()).some(([_, value]) => value instanceof File && (value as File).size > 0);
      
      // Make API call
      response = hasFiles
        ? await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        : await api.post(endpoint, formValues, {
            headers: { 'Content-Type': 'application/json' }
          });
      
      // Update local data
      setData([...data, response.data]);
      setFilteredData([...filteredData, response.data]);
      
      // Show success toast
      toast({
        title: "Created successfully",
        description: (
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{`New ${getResourceDisplayName(resource)} has been created.`}</span>
          </div>
        ),
        variant: "default",
        duration: 3000,
        className: "bg-green-50 border-green-200",
      });
      
      // Close dialog
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating item:', err);
      
      let errorMessage = 'Failed to create item';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  
  // Get the current page of data to display
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    return filteredData.slice(startIndex, endIndex);
  };

  // If not authenticated or not admin, don't render anything
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
                onClick={handleRefresh} 
                disabled={loading}
                title="Refresh data"
                className="transition-all duration-200 hover:text-cyan-600 hover:border-cyan-500"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleDebugMode} 
                title={isDebugMode ? "Hide debug info" : "Show debug info"}
                className={`transition-all duration-200 ${isDebugMode ? "bg-amber-100" : ""} hover:text-cyan-600 hover:border-cyan-500`}
              >
                <AlertCircle className="h-4 w-4" />
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
          
          {/* Search Section */}
          <div className="mb-6">
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
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
            
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
              <p>No {resource} data found in the system.</p>
              <Button 
                variant="link" 
                className="mt-2 text-cyan-600 hover:text-cyan-800 transition-colors duration-200" 
                onClick={handleRefresh}
              >
                Refresh
              </Button>
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
                      <TableHead key={column}>
                        <div className="flex items-center">
                          {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageData().map(item => (
                    <TableRow key={item.id}>
                      {getColumns().map(column => (
                        <TableCell key={`${item.id}-${column}`}>
                          {formatCellValue(item[column], column)}
                        </TableCell>
                      ))}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

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

      {/* Use the Resource Managers for edit and add */}
      {resource && (
        <>
          <ResourceManager 
            resource={resource}
            isOpen={isEditDialogOpen} 
            onClose={() => setIsEditDialogOpen(false)} 
            selectedItem={selectedItem}
            onSave={handleSaveEdit}
            isAddMode={false}
          />
          
          <ResourceManager 
            resource={resource}
            isOpen={isAddDialogOpen} 
            onClose={() => setIsAddDialogOpen(false)} 
            selectedItem={null}
            onSave={handleSaveNew}
            isAddMode={true}
          />
        </>
      )}
    </div>
  );
};

export default ManagementPage; 