import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, User, Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, CalendarCheck, ChevronDown, ChevronUp, Upload, Lock, MoreHorizontal } from 'lucide-react';
import { format, parse, parseISO } from 'date-fns';
import { customToast } from '@/lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import FloatingIcons from '@/components/FloatingIcons';
import { XRayUploadModal } from '@/components/XRayUploadModal';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to safely format dates from strings
const formatAppointmentDate = (dateTimeStr: string, formatPattern: string): string => {
  try {
    // First try to parse as ISO string
    const date = new Date(dateTimeStr);
    // Check if the date is valid
    if (!isNaN(date.getTime())) {
      return format(date, formatPattern);
    }
    // If the parsing failed, return a placeholder
    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Helper function to get time in 24-hour format from a date string
const getTimeFrom24Hour = (dateTimeStr: string): string => {
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      return format(date, 'HH:mm');
    }
    return '';
  } catch (error) {
    console.error('Error getting time from date:', error);
    return '';
  }
};

// Helper function to display time in 12-hour format
const formatTime12Hour = (dateTimeStr: string): string => {
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      return format(date, 'h:mm a');
    }
    return 'Invalid time';
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

// Helper function to format 24-hour time string to 12-hour display
const formatTimeSlot = (timeSlot: string): string => {
  try {
    const [hours, minutes] = timeSlot.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time slot:', error);
    return timeSlot; // Return original if there's an error
  }
};

interface Appointment {
  id: number;
  date_time: string;
  status: string;
  appointment_type?: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

const AppDash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(true);
  
  // Reschedule dialog state
  const [isRescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  // Define time slots
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  const [selectedAppointmentForUpload, setSelectedAppointmentForUpload] = useState<Appointment | null>(null);
  const [isXRayUploadModalOpen, setIsXRayUploadModalOpen] = useState(false);

  // Add new state for tracking taken time slots
  const [takenTimeSlots, setTakenTimeSlots] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5; // Show 5 appointments per page
  
  // Calculate total pages based on filtered appointments
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  
  // Get current appointments for the current page
  const getCurrentAppointments = () => {
    const indexOfLastAppointment = currentPage * appointmentsPerPage;
    const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
    return filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus]);

  // Check if user is authorized (admin or assistant)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'assistant') {
      navigate('/');
      customToast.error('Unauthorized access');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Handle appointment status change
  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      customToast.success(`Appointment ${newStatus} successfully`);
      fetchAppointments(); // Refresh the appointments list
    } catch (error) {
      customToast.error('Failed to update appointment status');
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      console.log('[AppDash] fetchAppointments called');
      setLoading(true);
      // Use getAssistantAppointments for both assistants and admins to see all appointments
      const data = await appointmentService.getAssistantAppointments();
      console.log('[AppDash] Data returned from getAssistantAppointments:', data);
      // Filter out any appointments that might be deleted
      const activeAppointments = data && Array.isArray(data)
        ? data.filter(appointment => appointment.status !== 'deleted').map(appointment => {
            // Log each appointment's date_time for debugging
            console.log(`Appointment ${appointment.id} date_time:`, appointment.date_time);
            console.log(`Parsed as 24h time:`, getTimeFrom24Hour(appointment.date_time));
            console.log(`Parsed as 12h time:`, formatTime12Hour(appointment.date_time));
            return {
              ...appointment,
              // Ensure date_time is properly parsed with the correct timezone
              date_time: appointment.date_time
            };
          })
        : [];
      setAppointments(activeAppointments);
      setFilteredAppointments(activeAppointments);
      console.log('[AppDash] Appointments set:', activeAppointments);
    } catch (error) {
      console.error('[AppDash] Error fetching appointments:', error);
      customToast.error('Failed to load appointments');
    } finally {
      setLoading(false);
      console.log('[AppDash] Loading set to false');
    }
  };

  // useEffect to fetch appointments on mount
  useEffect(() => {
    console.log('[AppDash] useEffect for fetchAppointments running');
    fetchAppointments();
  }, [isAuthenticated, user]);

  // Filter appointments based on search term, type, and status
  useEffect(() => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(appointment => {
        const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`.toLowerCase();
        const patientEmail = appointment.user.email.toLowerCase();
        return patientName.includes(searchTerm.toLowerCase()) || 
               patientEmail.includes(searchTerm.toLowerCase());
      });
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(appointment => 
        appointment.appointment_type === selectedType
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(appointment => 
        appointment.status === selectedStatus
      );
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, selectedType, selectedStatus, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
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
        return <CalendarCheck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStats = () => {
    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  };

  // Handle reschedule appointment
  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    // Set the current date and time as default values
    setSelectedDate(new Date(appointment.date_time));
    // Extract time from date_time in 24-hour format using our helper function
    const appointmentTime = getTimeFrom24Hour(appointment.date_time);
    console.log('Extracted appointment time:', appointmentTime);
    setSelectedTime(appointmentTime);
    setRescheduleDialogOpen(true);
    
    // Fetch taken time slots for the selected date
    fetchTakenTimeSlots(new Date(appointment.date_time));
  };

  // Add function to fetch taken time slots
  const fetchTakenTimeSlots = async (date: Date) => {
    try {
      // Format the date for the API
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Fetching taken slots for date:', formattedDate);
      
      // Use the API's taken-slots endpoint via the appointmentService
      const response = await appointmentService.getTakenSlots(formattedDate);
      console.log('Taken slots response:', response);
      
      // Safely handle response.data
      if (response && response.data && Array.isArray(response.data)) {
        // Extract the times from the response and normalize to 24-hour format
        const takenSlots = response.data.map((slot: string) => {
          try {
            // Handle various time formats that might be returned by the API
            if (slot.includes('T')) {
              // If slot is in ISO format like "2023-05-15T09:00:00"
              return format(new Date(slot), 'HH:mm');
            } else if (slot.includes('AM') || slot.includes('PM')) {
              // If slot is in 12-hour format like "11:00 AM"
              return format(parse(slot, 'h:mm a', new Date()), 'HH:mm');
            } else {
              // If already in 24-hour format like "14:00"
              return slot;
            }
          } catch (formatError) {
            console.error('Error formatting time slot:', slot, formatError);
            return ''; // Return empty string for invalid dates
          }
        }).filter(Boolean); // Remove any empty strings
        
        // Update state with taken slots
        setTakenTimeSlots(takenSlots);
        console.log('Normalized taken time slots (24h format):', takenSlots);
      } else {
        console.warn('Unexpected response format from taken-slots endpoint:', response);
        setTakenTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching taken time slots:', error);
      setTakenTimeSlots([]);
    }
  };

  // Add handler for date change to fetch new taken slots
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Fetch taken slots for the new date
      fetchTakenTimeSlots(date);
    }
  };

  // Submit reschedule
  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment || !selectedDate || !selectedTime) return;

    try {
      setIsRescheduling(true);
      await appointmentService.rescheduleAppointment(
        selectedAppointment.id, 
        format(selectedDate, 'yyyy-MM-dd'),
        selectedTime
      );
      
      customToast.success('Appointment rescheduled successfully');
      setRescheduleDialogOpen(false);
      fetchAppointments(); // Refresh the appointments list
      setIsRescheduling(false);
    } catch (error) {
      customToast.error('Failed to reschedule appointment');
      setIsRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-10 flex flex-col flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Appointment Dashboard</h1>
          <p className="text-gray-600">Manage and track all your appointments in one place</p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="neuro-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Appointments</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="neuro-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <h3 className="text-2xl font-bold">{stats.pending}</h3>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="neuro-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <h3 className="text-2xl font-bold">{stats.completed}</h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="neuro-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {getCurrentAppointments().map((appointment) => (
                  <Card key={appointment.id} className="neuro-card hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {appointment.user.first_name} {appointment.user.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{appointment.user.email}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formatAppointmentDate(appointment.date_time, 'PPP')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{formatTime12Hour(appointment.date_time)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-600">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{appointment.user.phone_number || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                              onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <>
                            <Button
                              variant="outline"
                              className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200"
                              onClick={() => handleReschedule(appointment)}
                            >
                              Reschedule
                            </Button>
                          </>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            variant="outline"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                            onClick={() => {
                              setSelectedAppointmentForUpload(appointment);
                              setIsXRayUploadModalOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Send Result
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination UI */}
              {filteredAppointments.length > appointmentsPerPage && (
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
                      <PaginationContent className="pagination-content flex justify-center">
                        <PaginationItem className="pagination-item">
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={`pagination-prev ${currentPage === 1 ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Logic to display the correct page numbers
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum} className="pagination-item">
                              <PaginationLink 
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className={`pagination-link ${currentPage === pageNum 
                                  ? "active bg-cyan-500/80 backdrop-blur-md text-white dark:bg-cyan-600/80 hover:bg-cyan-600/90 dark:hover:bg-cyan-500/90 shadow-lg" 
                                  : "hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                                }`}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <PaginationItem className="pagination-item">
                            <PaginationEllipsis className="pagination-link backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300" />
                          </PaginationItem>
                        )}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <PaginationItem className="pagination-item">
                            <PaginationLink 
                              onClick={() => setCurrentPage(totalPages)}
                              className="pagination-link hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        
                        <PaginationItem className="pagination-item">
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={`pagination-next ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedAppointment && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Patient: {selectedAppointment.user.first_name} {selectedAppointment.user.last_name}</p>
                <p className="text-sm text-gray-500">Current date: {formatAppointmentDate(selectedAppointment.date_time, 'PPP')}</p>
                <p className="text-sm text-gray-500">Current time: {formatTime12Hour(selectedAppointment.date_time)}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="date">Select new date</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Select new time</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto bg-blue-50/30 p-3 rounded-xl">
                {timeSlots.map((time, index) => {
                  // Check if this time slot is taken
                  const isSlotTaken = takenTimeSlots.includes(time) && 
                    // Don't consider the current appointment's time as taken
                    !(selectedAppointment && 
                      format(selectedDate || new Date(), 'yyyy-MM-dd') === formatAppointmentDate(selectedAppointment.date_time, 'yyyy-MM-dd') && 
                      getTimeFrom24Hour(selectedAppointment.date_time) === time);
                  
                  return (
                  <div
                    key={index}
                      onClick={() => !isSlotTaken && setSelectedTime(time)}
                      className={`relative p-3 border-2 rounded-xl transition-all ${
                        isSlotTaken 
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                          : selectedTime === time 
                        ? 'border-transparent bg-gradient-to-br from-primary to-blue-500 text-white transform scale-105 shadow-md' 
                            : 'border-primary bg-white hover:bg-blue-50 hover:-translate-y-1 cursor-pointer'
                      }`}
                  >
                    <div className="text-center font-medium">{formatTimeSlot(time)}</div>
                      {selectedTime === time && !isSlotTaken && (
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                    )}
                      {isSlotTaken && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleRescheduleSubmit} 
              disabled={!selectedDate || !selectedTime || isRescheduling}
            >
              {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAppointmentForUpload && (
        <XRayUploadModal
          open={isXRayUploadModalOpen}
          onClose={() => {
            setIsXRayUploadModalOpen(false);
            setSelectedAppointmentForUpload(null);
          }}
          appointmentId={selectedAppointmentForUpload.id}
          patientData={{
            id: selectedAppointmentForUpload.user.id,
            first_name: selectedAppointmentForUpload.user.first_name,
            last_name: selectedAppointmentForUpload.user.last_name,
            email: selectedAppointmentForUpload.user.email,
          }}
          assistantData={{
            id: user?.id || 0,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            profile_picture: user?.profile_picture,
          }}
        />
      )}
    </div>
  );
};

export default AppDash; 