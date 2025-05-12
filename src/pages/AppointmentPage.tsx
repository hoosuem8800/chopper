import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Clock, Calendar, ArrowLeft, ArrowRight, CheckCircle, User, Mail, Phone, AlertCircle, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, API_BASE_URL } from '@/services/api';
import { customToast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const AppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [takenSlots, setTakenSlots] = useState([]);

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
  
  // Check authentication and redirect to login if needed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    // Fetch user profile to pre-fill form fields
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/profiles/');
        const profile = response.data[0];
        setProfileData(profile);
        
        // Pre-fill form fields from user data
        if (user) {
          setFirstName(user.first_name || '');
          setLastName(user.last_name || '');
          setEmail(user.email || '');
        }
        
        if (profile) {
          setPhone(profile.phone_number || '');
        }
        
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [isAuthenticated, user, navigate, location]);

  // Add function to fetch taken slots
  const fetchTakenSlots = async (date) => {
    try {
      console.log(`Fetching taken slots for date: ${date}`);
      const response = await api.get(`/appointments/taken-slots/?date=${date}`);
      const newTakenSlots = response.data.taken_slots || [];
      console.log('Received taken slots:', newTakenSlots);
      
      // Ensure each time slot is in 12-hour format (AM/PM)
      const formattedSlots = newTakenSlots.map(slot => {
        // If the slot is already in 12-hour format, return it as is
        if (slot.includes('AM') || slot.includes('PM')) {
          return slot;
        }
        
        // Otherwise, convert from 24-hour to 12-hour format if needed
        try {
          const [hours, minutes] = slot.split(':');
          const hour = parseInt(hours);
          const period = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
        } catch (e) {
          console.error('Error formatting time slot:', e);
          return slot;
        }
      });
      
      setTakenSlots(formattedSlots);
      return formattedSlots;
    } catch (error) {
      console.error('Error fetching taken slots:', error);
      return [];
    }
  };

  // Update when date changes
  useEffect(() => {
    if (appointmentDate) {
      fetchTakenSlots(appointmentDate);
    }
  }, [appointmentDate]);

  // Check if a slot is available
  const isSlotAvailable = (time) => {
    return !takenSlots.includes(time);
  };

  // Handle date selection
  const handleDateSelection = async (e) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    setErrors({...errors, date: ''});
    
    // Immediately fetch taken slots and check availability
    if (newDate) {
      const newTakenSlots = await fetchTakenSlots(newDate);
      if (selectedTimeSlot && newTakenSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot('');
        customToast.warning('This time slot is not available on the selected date');
      }
    }
  };

  // Update time slot selection to prevent selecting unavailable slots
  const handleTimeSlotSelection = (time) => {
    if (!isSlotAvailable(time)) return;
    setSelectedTimeSlot(time);
    setErrors({...errors, time: ''});
  };

  const validateStep = (step) => {
    let isValid = true;
    const newErrors = {...errors};

    if (step === 0) {
      if (!firstName.trim()) {
        newErrors.firstName = 'Please enter your first name';
        isValid = false;
      } else {
        newErrors.firstName = '';
      }

      if (!lastName.trim()) {
        newErrors.lastName = 'Please enter your last name';
        isValid = false;
      } else {
        newErrors.lastName = '';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      } else {
        newErrors.email = '';
      }

      // Allow phone format to be more flexible
      if (!phone || phone.trim().length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
        isValid = false;
      } else {
        newErrors.phone = '';
      }
    }

    if (step === 1) {
      if (!appointmentDate) {
        newErrors.date = 'Please select a date';
        isValid = false;
      } else {
        newErrors.date = '';
      }

      if (!selectedTimeSlot) {
        newErrors.time = 'Please select a time slot';
        isValid = false;
      } else {
        newErrors.time = '';
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Check authentication
      if (!isAuthenticated || !user) {
        customToast.error('Please log in to book an appointment');
        navigate('/login', { state: { returnPath: location.pathname } });
        setLoading(false);
        return;
      }
      
      // Validate date and time are selected
      if (!appointmentDate || !selectedTimeSlot) {
        customToast.error('Please select a date and time');
        setLoading(false);
        return;
      }
      
      // Format date and time to ISO format for backend
      try {
        // Use createTimezoneAwareDate function to ensure consistent timezone handling
        const dateTime = createTimezoneAwareDate(appointmentDate, selectedTimeSlot);
        
        // Check if valid date
        if (isNaN(dateTime.getTime())) {
          customToast.error('Invalid date or time');
          setLoading(false);
          return;
        }
        
        // Ensure we're sending the time in ISO format with 'Z' indicating UTC timezone
        const isoDateTime = dateTime.toISOString();
        
        // Log the conversion for debugging
        console.log('Original time slot:', selectedTimeSlot);
        console.log('ISO date time:', isoDateTime);
        
        // Prepare appointment data - simplified without doctor
        const appointmentData = {
          date_time: isoDateTime,
          status: 'confirmed',
          notes: `Appointment booked by ${firstName} ${lastName} (${email}, ${phone})`
        };
        
        console.log('Submitting appointment data:', appointmentData);
        console.log('Current auth token:', localStorage.getItem('token'));
        
        // Submit to API with complete error handling
        try {
          // Ensure headers are properly set before the request
          const token = localStorage.getItem('token');
          if (token) {
            api.defaults.headers.common['Authorization'] = `Token ${token}`;
          }
          
          const response = await api.post('/appointments/', appointmentData);
          console.log('Appointment created successfully:', response.data);
          
          // Redirect to success page with appointment details
          navigate('/appointment/success', { 
            state: { 
              appointment: response.data,
              firstName,
              lastName,
              email,
              phone,
              appointmentDate,
              selectedTimeSlot
            }
          });
        } catch (apiError) {
          console.error('API Error Details:', apiError.response?.data || apiError.message);
          if (apiError.response?.status === 400) {
            customToast.error(apiError.response.data?.detail || 'Invalid appointment data');
          } else if (apiError.response?.status === 401) {
            customToast.error('Please log in again to continue');
            navigate('/login', { state: { returnPath: location.pathname } });
          } else if (apiError.response?.status === 500) {
            customToast.error('Server error. Please try again later.');
          } else {
            customToast.error('Failed to book appointment. Please try again.');
          }
        }
      } catch (dateError) {
        console.error('Date formatting error:', dateError);
        customToast.error('Invalid date format');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      customToast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };
  
  // New function to create a timezone-aware date object
  const createTimezoneAwareDate = (dateString: string, timeString: string): Date => {
    // Parse timeString to get hours and minutes
    const [timePart, period] = timeString.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Create a new date object in UTC
    const date = new Date(`${dateString}T00:00:00Z`);
    
    // Set hours and minutes
    date.setUTCHours(hours, minutes, 0, 0);
    
    return date;
  };
  
  // Convert 12-hour time format to 24-hour format (keep for backwards compatibility)
  const convertTo24Hour = (timeString) => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    hours = parseInt(hours);
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Return in HH:MM:00 format (suitable for ISO date construction)
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="background-pattern"></div>
      
      <main className="flex-grow pt-20 pb-20 px-6">
        <div className="max-w-4xl mx-auto my-12">
          <div className="neuro-card p-8 md:p-12 shadow-xl rounded-2xl">
            {/* Progress Bar */}
            <div className="flex justify-between mb-10 relative">
              {[1, 2, 3].map((step, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col items-center z-10 relative ${index <= currentStep ? 'text-primary' : 'text-gray-400'}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                    ${index <= currentStep ? 'bg-primary text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                  >
                    {step}
                  </div>
                  <div className="text-xs">
                    {index === 0 ? 'Details' : index === 1 ? 'Timing' : 'Confirm'}
                  </div>
                </div>
              ))}
              
              {/* Progress line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-300"
                style={{ width: `${currentStep === 0 ? '0%' : currentStep === 1 ? '50%' : '100%'}` }}
              ></div>
            </div>

            {/* User Information Card - Removed */}

            {/* Step 1: Personal Details */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setErrors({...errors, firstName: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setErrors({...errors, lastName: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({...errors, email: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors({...errors, phone: ''});
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button onClick={handleNextStep} className="px-6">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Select Time */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <Clock className="mr-2 h-6 w-6" />Select Appointment Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      id="appointmentDate"
                      min={getTodayDate()}
                      className={`w-full p-3 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      value={appointmentDate}
                      onChange={handleDateSelection}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => setShowInfoDialog(true)}
                      >
                        <AlertCircle className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto bg-blue-50/30 p-3 rounded-xl">
                      {timeSlots.map((time, index) => {
                        const isAvailable = isSlotAvailable(time);
                        return (
                          <div
                            key={index}
                            onClick={() => isAvailable && handleTimeSlotSelection(time)}
                            className={cn(
                              "relative p-3 border-2 rounded-xl transition-all",
                              selectedTimeSlot === time 
                                ? 'border-transparent bg-gradient-to-br from-primary to-blue-500 text-white transform scale-105 shadow-md'
                                : isAvailable
                                  ? 'border-primary bg-white hover:bg-blue-50 hover:-translate-y-1 cursor-pointer'
                                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-70'
                            )}
                          >
                            <div className="text-center font-medium">
                              {time}
                              {!isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 rounded-xl">
                                  <div className="flex items-center gap-1 text-cyan-500">
                                    <Lock className="h-4 w-4" />
                                    <span className="text-sm">Taken</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {selectedTimeSlot === time && (
                              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                  </div>
                </div>

                {/* Appointment Information Dialog */}
                <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Appointment Information
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-700 text-sm">
                        Please arrive at least 15 minutes before your scheduled appointment time.
                        Bring any relevant documents or information that may be helpful.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary">•</span>
                          <span>The appointment takes approximately 30-45 minutes</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary">•</span>
                          <span>You'll receive a confirmation email with details</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary">•</span>
                          <span>You can manage your appointments from your profile page</span>
                        </li>
                      </ul>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button className="disappear-button" onClick={handleNextStep}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <CheckCircle className="mr-2 h-6 w-6" />Confirmation
                </h3>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6">
                  <h4 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Appointment Details</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:gap-8">
                      <div className="w-full sm:w-1/2 flex items-start gap-2 mb-3 sm:mb-0">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium text-sm">{firstName} {lastName}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-1/2 flex items-start gap-2">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                          <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-sm truncate max-w-[220px]">{email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:gap-8">
                      <div className="w-full sm:w-1/2 flex items-start gap-2 mb-3 sm:mb-0">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                          <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium text-sm">{phone}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-1/2 flex items-start gap-2">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="font-medium text-sm">{appointmentDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:gap-8">
                      <div className="w-full sm:w-1/2 flex items-start gap-2 mb-3 sm:mb-0">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium text-sm">{selectedTimeSlot}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-1/2 flex items-start gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Appointment Type</p>
                          <p className="font-medium text-sm">Scan Appointment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    className="disappear-button" 
                    onClick={handleConfirmBooking}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Appointment'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
          </div>
  );
};

export default AppointmentPage;
