import axios from 'axios';

// Set to true to use mock data when backend is not available
export const USE_MOCK_DATA = false;

// Define API base URL dynamically based on environment
const getApiBaseUrl = () => {
  // For production environment
  if (import.meta.env.PROD) {
    return 'https://backends-production-d57e.up.railway.app/api';
  }
  
  // For local development
  const BACKEND_PORT = '8000'; // Django backend port
  return `http://localhost:${BACKEND_PORT}/api`;
};

// Define API base URL
const API_BASE_URL = getApiBaseUrl();

// Export API base URL
export { API_BASE_URL };

// Interfaces for API services
interface UserData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  subscription_type?: string;
  profile?: {
    phone_number?: string;
    address?: string;
  };
}

export interface AppointmentData {
  id?: number;
  date_time?: string;
  date?: string;
  time?: string;
  assistant_id?: number;
  assistant_name?: string;
  status?: string;
  notes?: string;
  patient_id?: number;
  appointment_type?: string;  // Made optional
  user?: UserData;
}

// Add ConsultationData interface after AppointmentData
export interface ConsultationData {
  id: number;
  date_time: string;
  status: string;
  notes?: string;
  consultation_type: 'scan' | 'follow_up' | 'general';  // Add specific types
  doctor?: {
    first_name: string;
    last_name: string;
  };
}

interface ProfileData {
  phone_number?: string;
  address?: string;
  bio?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface PaymentData {
  amount: number;
  payment_method: string;
  appointment_id?: number;
  subscription_id?: number;
  payment_details: {
    card_number?: string;
    expiry_date?: string;
    cvv?: string;
    billing_address?: string;
  };
}

interface NotificationData {
  user_id: number;
  title: string;
  message: string;
  // Valid notification types are: 'appointment', 'scan', 'payment', 'system'
  notification_type: string;
  related_id?: number;
}

// Helper function to validate notification types
const validateNotificationType = (type: string): string => {
  // Valid notification types
  const validTypes = [
    'appointment',      // Appointment-related notifications
    'appointment_status', // Appointment status changes
    'appointment_accepted', // Appointment acceptance
    'appointment_rejected', // Appointment rejection
    'appointment_reminder', // Appointment reminders
    'scan',             // Scan results
    'xray',             // X-ray results (explicitly supported)
    'payment',          // Payment-related notifications
    'system'            // System notifications
  ];
  
  return validTypes.includes(type) ? type : 'system';
};

// Helper function to get user initials
export const getUserInitials = (user: any): string => {
  if (!user) return 'U';
  
  return [user.first_name, user.last_name]
    .filter(Boolean)
    .map(name => name?.charAt(0))
    .join('')
    .toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
};

// Format profile picture URL to make sure we have a complete URL
export const formatProfilePictureUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) {
    return '';
  }
  
  // Check if it's already a complete URL (starts with http)
  if (profilePicture.startsWith('http')) {
    return profilePicture;
  }
  
  // Get the backend URL - use the same logic as our API_BASE_URL
  const backendUrl = import.meta.env.PROD
    ? 'https://backends-production-d57e.up.railway.app'
    : `http://${window.location.hostname}:8000`;
  
  // Remove any duplicate paths to prevent errors
  let cleanPath = profilePicture;
  
  // Remove any leading slashes
  while (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // Check if the path already contains media/profile_pictures
  if (cleanPath.includes('media/profile_pictures/')) {
    // Extract just the filename from the path
    const pathParts = cleanPath.split('media/profile_pictures/');
    const filename = pathParts[pathParts.length - 1];
    
    // Ensure the filename doesn't start with a slash
    const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    return `${backendUrl}/media/profile_pictures/${cleanFilename}`;
  }
  
  // Check if the path starts with media/
  if (cleanPath.startsWith('media/')) {
    return `${backendUrl}/${cleanPath}`;
  }
  
  // Handle profile_pictures/ prefix
  if (cleanPath.startsWith('profile_pictures/')) {
    return `${backendUrl}/media/${cleanPath}`;
  }
  
  // If no prefix, assume it's a relative path
  return `${backendUrl}/media/profile_pictures/${cleanPath}`;
};

// Add an alias to maintain backward compatibility with existing code
export const getProfilePictureUrl = formatProfilePictureUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to headers
api.interceptors.request.use((config) => {
  // Try different token storage locations
  const token = localStorage.getItem('token') || 
                localStorage.getItem('accessToken') || 
                sessionStorage.getItem('token') ||
                sessionStorage.getItem('accessToken');
  
  if (token) {
    // Detect token type: JWT tokens start with 'ey'
    const prefix = token.startsWith('ey') ? 'Bearer' : 'Token';
    config.headers.Authorization = `${prefix} ${token}`;
    console.log(`Found authentication token, adding to request with ${prefix} prefix`);
  } else {
    console.warn('No authentication token found');
  }
  
  // Add standard CORS headers to all requests
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/token/refresh/', {
            refresh: refreshToken
          });

          const { access } = response.data;
          localStorage.setItem('token', access);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

          // Retry the original request with the new token
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    // Use mock implementation if in mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Logging in with mock credentials');
      console.log(`Mock login attempt with email: ${email}`);
      
      // Create mock response
      const mockToken = 'mock_token_' + Date.now();
      const mockUserData = {
        id: 1,
        username: email.split('@')[0],
        email: email,
        first_name: 'Demo',
        last_name: 'User',
        role: 'user'
      };
      
      // Store token in localStorage
      localStorage.setItem('token', mockToken);
      
      // Force localStorage save and wait a moment before returning
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Mock login complete, token stored:', mockToken);
      
      return {
        token: mockToken,
        user: mockUserData,
        success: true
      };
    }
    
    const response = await api.post('/auth/token/', { username: email, password });
    const { access, refresh } = response.data;
    
    // Store both tokens
    localStorage.setItem('token', access);
    localStorage.setItem('refreshToken', refresh);
    
    // Set the Authorization header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    
    return {
      token: access,
      refreshToken: refresh,
      success: true
    };
  },

  register: async (userData: UserData) => {
    try {
      console.log('Attempting registration with backend at:', API_BASE_URL);
      // Use the correct registration endpoint
      const response = await api.post('/users/register/', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.message || 
                           'Registration failed. Please try again.';
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error setting up the request. Please try again.');
      }
    }
  },
  
  registerWithProfilePicture: async (formData: FormData) => {
    try {
      console.log('Attempting registration with profile picture at:', API_BASE_URL);
      
      // Use the correct registration endpoint with FormData
      const response = await api.post('/users/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Registration with profile picture error:', error);
      
      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'Registration failed. Please try again.';
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error setting up the request. Please try again.');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/profile/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Try profiles endpoint as fallback
      try {
        const profileResponse = await api.get('/profiles/');
        if (profileResponse.data && profileResponse.data.length > 0) {
          return profileResponse.data[0];
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      return null;
    }
  },

  validateToken: async () => {
    try {
      const response = await api.post('/auth/token/verify/');
      return !!response.data;
    } catch (error) {
      return false;
    }
  },
};

export const scanService = {
  uploadScan: async (file: File) => {
    // Handle mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Uploading scan file', file.name);
      
      // Create a mock response
      return {
        id: Date.now(),
        file_name: file.name,
        uploaded_at: new Date().toISOString(),
        status: 'pending',
        results: null,
        success: true
      };
    }
    
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/scans/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getScans: async () => {
    // Handle mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Returning mock scans');
      
      // Create mock scans
      return [
        {
          id: 1,
          file_name: 'mock_scan_1.jpg',
          uploaded_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'completed',
          results: 'Normal scan results'
        },
        {
          id: 2,
          file_name: 'mock_scan_2.jpg',
          uploaded_at: new Date().toISOString(),
          status: 'pending',
          results: null
        }
      ];
    }
    
    const response = await api.get('/scans/');
    return response.data;
  },

  getScan: async (scanId: number) => {
    // Handle mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Returning mock scan details', scanId);
      
      // Create a mock scan detail
      return {
        id: scanId,
        file_name: `mock_scan_${scanId}.jpg`,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        results: 'Normal scan results for mock scan ' + scanId
      };
    }
    
    const response = await api.get(`/scans/${scanId}/`);
    return response.data;
  },

  processScan: async (scanId: number) => {
    // Handle mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Processing mock scan', scanId);
      
      // Create a mock processing result
      return {
        id: scanId,
        file_name: `mock_scan_${scanId}.jpg`,
        status: 'completed',
        processed_at: new Date().toISOString(),
        results: 'Processed mock scan results: No abnormalities detected',
        success: true
      };
    }
    
    const response = await api.post(`/scans/${scanId}/process_scan/`);
    return response.data;
  },
};

export const appointmentService = {
  getAppointments: async () => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Returning mock appointments');
      
      // Create mock appointments - these should be only for the current user
      // Note: In real mode, the API backend already filters appointments by the current user
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 2);
      
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 7);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      
      return [
        {
          id: 1,
          date: futureDate1.toISOString(),
          time: '10:00',
          assistant_id: 101,
          assistant_name: 'Assistant Smith',
          status: 'scheduled',
          notes: 'Regular checkup',
          patient_id: 1
        },
        {
          id: 2,
          date: futureDate2.toISOString(),
          time: '14:30',
          assistant_id: 102,
          assistant_name: 'Assistant Johnson',
          status: 'scheduled',
          notes: 'Follow-up appointment',
          patient_id: 1
        },
        {
          id: 3,
          date: pastDate.toISOString(),
          time: '09:15',
          assistant_id: 101,
          assistant_name: 'Assistant Smith',
          status: 'completed',
          notes: 'Initial consultation',
          patient_id: 1
        }
      ];
    }
    // The backend API endpoint already filters appointments by the current authenticated user
    const response = await api.get('/appointments/');
    return response.data;
  },

  getAssistantAppointments: async () => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Returning mock assistant appointments');
      
      // Create mock appointments for assistants with date_time format
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 2);
      
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 7);
      
      const todayDate = new Date();
      todayDate.setHours(todayDate.getHours() + 3); // 3 hours from now
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      
      return [
        {
          id: 1,
          date_time: futureDate1.toISOString(),
          status: 'scheduled',
          notes: 'Regular checkup',
          user: {
            id: 5,
            username: 'patient1',
            email: 'patient1@example.com',
            first_name: 'John',
            last_name: 'Doe',
            profile_picture: ''
          }
        },
        {
          id: 2,
          date_time: futureDate2.toISOString(),
          status: 'pending',
          notes: 'Follow-up appointment',
          user: {
            id: 6,
            username: 'patient2',
            email: 'patient2@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            profile_picture: ''
          }
        },
        {
          id: 3,
          date_time: todayDate.toISOString(),
          status: 'scheduled',
          notes: 'Emergency consultation',
          user: {
            id: 7,
            username: 'patient3',
            email: 'patient3@example.com',
            first_name: 'Robert',
            last_name: 'Johnson',
            profile_picture: ''
          }
        },
        {
          id: 4,
          date_time: pastDate.toISOString(),
          status: 'completed',
          notes: 'Initial consultation - completed',
          user: {
            id: 5,
            username: 'patient1',
            email: 'patient1@example.com',
            first_name: 'John',
            last_name: 'Doe',
            profile_picture: ''
          }
        }
      ];
    }
    
    // Use the correct assistant appointments endpoint
    const response = await api.get('/appointments/assistant_appointments/');
    return response.data;
  },
  
  checkUpcomingAppointments: async () => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Mock mode: Checking upcoming appointments');
        
        // Get appointments from mock data
        const appointments = await appointmentService.getAppointments();
        
        // Filter for scheduled appointments in the next 24 hours
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcomingAppointments = appointments.filter(app => {
          // Convert date string and time string to Date object
          const appDate = app.date ? new Date(app.date) : null;
          if (!appDate) return false;
          
          // Add time to the date
          if (app.time) {
            const [hours, minutes] = app.time.split(':');
            appDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          }
          
          // Check if appointment is within the next 24 hours and is scheduled
          return appDate > now && appDate <= in24Hours && app.status === 'scheduled';
        });
        
        console.log(`Found ${upcomingAppointments.length} upcoming appointments in the next 24 hours`);
        
        // Send reminders for each upcoming appointment
        for (const appointment of upcomingAppointments) {
          // Convert to expected format for reminder
          const appointmentData = {
            date_time: new Date(appointment.date).toISOString(),
            assistant: {
              user: {
                first_name: appointment.assistant_name?.split(' ')[0] || '',
                last_name: appointment.assistant_name?.split(' ')[1] || ''
              }
            },
            user: {
              email: 'user@example.com' // Mock email
            }
          };
          
          // Send reminder notification
          await notificationService.sendAppointmentReminder(
            appointment.patient_id || 1,
            appointment.id,
            appointmentData
          );
          
          console.log(`Sent reminder for appointment ${appointment.id}`);
        }
        
        return { success: true, sent: upcomingAppointments.length };
      }
      
      // Call the real API endpoint
      const response = await api.get('/appointments/check-upcoming/');
      return response.data;
    } catch (error) {
      console.error('Error checking upcoming appointments:', error);
      return { success: false, error: error.message };
    }
  },
  
  createAppointment: async (appointmentData: AppointmentData) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Creating mock appointment', appointmentData);
      
      // Create a mock appointment response
      return {
        id: Date.now(),
        date: appointmentData.date,
        time: appointmentData.time,
        assistant_id: appointmentData.assistant_id,
        assistant_name: 'Assistant Mock Doctor',
        status: 'scheduled',
        notes: appointmentData.notes || '',
        patient_id: 1,
        success: true
      };
    }
    const response = await api.post('/appointments/', appointmentData);
    return response.data;
  },
  
  getAppointment: async (appointmentId: number) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Returning mock appointment details', appointmentId);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      // Create a mock appointment detail with X-ray result
      return {
        id: appointmentId,
        date: futureDate.toISOString(),
        time: '10:00',
        assistant_id: 101,
        assistant_name: 'Assistant Smith',
        status: 'completed',
        notes: 'Mock appointment details',
        patient_id: 1,
        xray_result: {
          image: `/example_xrays/example${appointmentId % 3 + 1}.jpg`,
          notes: 'X-ray from mock appointment',
          result: appointmentId % 2 === 0 ? 'Pneumonia' : 'Normal',
          confidence_score: 0.95,
          status: 'completed'
        }
      };
    }
    
    try {
      console.log(`Fetching details for appointment #${appointmentId}`);
    const response = await api.get(`/appointments/${appointmentId}/`);
      const appointment = response.data;
      
      // Check if this appointment has X-ray results
      if (appointment.status === 'completed') {
        try {
          // Try to fetch X-ray result if it's not included
          if (!appointment.xray_result) {
            const xrayResponse = await api.get(`/appointments/${appointmentId}/result/`);
            if (xrayResponse.data) {
              appointment.xray_result = xrayResponse.data;
            }
          }
        } catch (xrayError) {
          // Continue without X-ray result
        }
      }
      
      return appointment;
    } catch (error) {
      console.error(`Error fetching appointment #${appointmentId}:`, error);
      throw error;
    }
  },
  
  updateAppointment: async (appointmentId: number, appointmentData: AppointmentData) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Updating mock appointment', appointmentId, appointmentData);
      
      // Create a mock updated appointment
      return {
        id: appointmentId,
        ...appointmentData,
        assistant_name: 'Assistant Mock Doctor',
        status: appointmentData.status || 'scheduled',
        patient_id: 1,
        success: true
      };
    }
    const response = await api.put(`/appointments/${appointmentId}/`, appointmentData);
    return response.data;
  },

  cancelAppointment: async (appointmentId: number) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Canceling mock appointment', appointmentId);
      
      // Create a mock cancellation response
      return {
        id: appointmentId,
        status: 'cancelled',
        success: true
      };
    }
    const response = await api.post(`/appointments/${appointmentId}/cancel/`);
    return response.data;
  },
  
  rescheduleAppointment: async (appointmentId: number, newDate: string, newTime: string) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Rescheduling mock appointment', appointmentId, newDate, newTime);
      
      // Create a mock rescheduling response
      return {
        id: appointmentId,
        date: newDate,
        time: newTime,
        status: 'rescheduled',
        success: true
      };
    }
    // Combine date and time into the format expected by the backend (YYYY-MM-DDTHH:MM:SS)
    const date_time = `${newDate}T${newTime}:00`;
    const response = await api.post(`/appointments/${appointmentId}/reschedule/`, { date_time });
    return response.data;
  },

  getTakenSlots: async (date: string) => {
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Getting taken slots for date', date);
      
      // Create mock taken slots with different formats to test the handling
      const mockTimes = ['09:00', '11:00 AM', '2:00 PM', `${date}T14:00:00`];
      
      return {
        data: mockTimes
      };
    }
    
    try {
      const response = await api.get(`/appointments/taken-slots/?date=${date}`);
      console.log('Taken slots response:', response.data);
      
      // Make sure we always return an object with a data property that's an array
      if (Array.isArray(response.data)) {
        return { data: response.data };
      } else if (response.data && Array.isArray(response.data.taken_slots)) {
        return { data: response.data.taken_slots };
      } else if (response.data && typeof response.data === 'object') {
        // Try to find any array property that might contain the slots
        const possibleArrays = Object.values(response.data).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          // Use the first array found
          return { data: possibleArrays[0] };
        }
      }
      
      console.warn('Unexpected response format from taken-slots endpoint:', response.data);
      return { data: [] }; // Return empty array as fallback
    } catch (error) {
      console.error('Error fetching taken time slots:', error);
      return { data: [] }; // Return empty array on error
    }
  },

  updateAppointmentStatus: async (appointmentId: number, newStatus: string) => {
    if (USE_MOCK_DATA) {
      console.log(`Mock mode: Updating appointment ${appointmentId} status to ${newStatus}`);
      return {
        id: appointmentId,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
    }

    // Map status to the correct endpoint action
    const endpointMap = {
      'confirmed': 'confirmed',
      'completed': 'completed',
      'cancelled': 'cancel'  // The backend uses 'cancel' (verb) not 'cancelled' (adjective)
    };

    const endpoint = endpointMap[newStatus] || newStatus;
    console.log(`Using endpoint: /appointments/${appointmentId}/${endpoint}/`);

    try {
      const response = await api.post(`/appointments/${appointmentId}/${endpoint}/`);
        return response.data;
    } catch (error) {
      console.error(`Error updating appointment status to ${newStatus}:`, error);
      throw error; // Re-throw to let the caller handle it
    }
  },

  sendResult: async (appointmentId: number, imageFile: File, notes?: string) => {
    if (USE_MOCK_DATA) {
      // Create a notification for the X-ray result
      try {
        const mockAppointment = {
          id: appointmentId,
          user: { id: 1 } // Mock user ID
        };
        
        // Create an X-ray notification
        await notificationService.createNotification({
          user_id: mockAppointment.user.id,
          title: 'X-ray Result Available',
          message: `Your X-ray result has been uploaded. ${notes ? 'Notes: ' + notes : ''}`,
          notification_type: 'xray',
          related_id: appointmentId
        });
      } catch (error) {
        console.error('Error creating X-ray notification:', error);
        // Continue even if notification creation fails
      }
      
      return {
        success: true,
        message: 'Result sent successfully',
        appointment_id: appointmentId,
        created_at: new Date().toISOString()
      };
    }

    try {
      // First, get the appointment details to get the patient information
      const appointmentResponse = await api.get(`/appointments/${appointmentId}/`);
      const appointment = appointmentResponse.data;
      
      if (!appointment || !appointment.user || !appointment.user.id) {
        throw new Error('Could not retrieve patient information from appointment');
      }
      
      // Get current user's ID (the assistant)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser.id) {
        throw new Error('Could not retrieve assistant ID from local storage');
      }
      
      // Create the form data with all required fields
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('appointment', appointmentId.toString());
      formData.append('patient', appointment.user.id.toString());
      formData.append('assistant', currentUser.id.toString());
      if (notes) {
        formData.append('notes', notes);
      }
      
      console.log('Sending X-ray data:', {
        appointment: appointmentId,
        patient: appointment.user.id,
        assistant: currentUser.id,
        hasImage: !!imageFile,
        hasNotes: !!notes
      });

      // Use the xrayimage endpoint to create a new XRayImage
      try {
        const response = await api.post('/xrayimage/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('X-ray upload API response:', response.data);
        
        // Create a notification for the patient
        try {
          // Create direct notification through API instead of using the notification service
          await api.post('/notifications/', {
            user: appointment.user.id,  // Use user field directly, not user_id
            title: 'X-ray Result Available',
            message: `Your X-ray result has been uploaded. ${notes ? 'Notes: ' + notes : ''}`,
            notification_type: 'xray',
            related_id: appointmentId
          });
          console.log('Successfully created X-ray notification');
        } catch (notificationError) {
          console.error('Error creating X-ray notification:', notificationError);
          // Continue even if notification creation fails
        }
        
        return response.data;
      } catch (apiError) {
        console.error('API error during X-ray upload:', apiError);
        // Add more detailed error information for debugging
        if (apiError.response) {
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', apiError.response.data);
          console.error('Error response headers:', apiError.response.headers);
        } else if (apiError.request) {
          console.error('Error request:', apiError.request);
        }
        throw apiError; // Re-throw to be handled by the caller
      }
    } catch (error) {
      console.error('Error sending result:', error);
      throw error;
    }
  },
};

export const assistantService = {
  getAssistants: async () => {
    const response = await api.get('/assistants/');
    return response.data;
  },

  getAssistant: async (assistantId: number) => {
    const response = await api.get(`/assistants/${assistantId}/`);
    return response.data;
  },
};

export const profileService = {
  getProfile: async () => {
    try {
      let profileData = null;
      
      // Try multiple endpoints to get user profile data - updated with correct endpoints
      const endpointsToTry = [
        { path: '/profiles/', isArray: true, label: 'profiles' },
        { path: '/users/', isArray: true, label: 'users list' } // Changed from /users/profile/
      ];
      
      // Try each endpoint in sequence until we get data
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`Trying to fetch profile from ${endpoint.label} endpoint...`);
          const response = await api.get(endpoint.path);
          
          if (endpoint.isArray) {
            // Handle array response
            if (Array.isArray(response.data) && response.data.length > 0) {
              console.log(`Successfully fetched profile data from ${endpoint.label}`);
              profileData = response.data;
              break;
            } else if (response.data && !Array.isArray(response.data)) {
              // Handle case where a single object is returned instead of an array
              console.log(`Received single profile object from ${endpoint.label}, wrapping in array`);
              profileData = [response.data];
              break;
            }
          }
          // Handle single object response
          if (response.data) {
            console.log(`Successfully fetched profile data from ${endpoint.label}`);
            
            // Format into expected structure
            if (response.data.user) {
              // Response from /users/profile/ with user and profile
              const formattedProfile = {
                ...response.data.profile,
                user: response.data.user
              };
              profileData = [formattedProfile];
            } else {
              // Direct user data
              profileData = [{
                id: response.data.id || 0,
                user: response.data,
                profile_picture: response.data.profile_picture || '',
                phone_number: response.data.phone_number || '',
                address: response.data.address || ''
              }];
            }
            break;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${endpoint.label} endpoint:`, error);
          // Continue to next endpoint
        }
      }
      
      // If we found profile data, return it
      if (profileData) {
        return profileData;
      }
      
      // If we still have no data, try to construct minimal profile from local storage
      console.log('All profile endpoints failed, trying to construct profile from localStorage');
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('Found user data in localStorage:', userData);
          
          // Create a minimal profile from the user data
          return [{
            id: 0,
            user: userData,
            profile_picture: userData.profile_picture || '',
            phone_number: '',
            address: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        } catch (error) {
          console.error('Error parsing saved user data:', error);
        }
      }
      
      // If all else fails, return empty array to avoid breaking the app
      console.warn('Could not retrieve profile data from any source');
      return [];
    } catch (error) {
      console.error('Unexpected error in getProfile:', error);
      return [];
    }
  },

  updateProfile: async (userId: number, profileData: ProfileData) => {
    // Mock implementation for development
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Updating profile data', profileData);
      
      // Get current user from localStorage
      const savedUser = localStorage.getItem('user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      
      if (userData) {
        // Update user with new profile data
        const updatedUser = {
          ...userData,
          // Add profile data to user object
          phone_number: profileData.phone_number,
          address: profileData.address
        };
        
        // Save updated user back to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return {
        success: true,
        message: 'Profile updated successfully (mock)',
        profile: profileData
      };
    }
    
    try {
      // First we need to get the profile ID from the profiles endpoint
      const profilesResponse = await api.get('/profiles/');
      
      if (!Array.isArray(profilesResponse.data) || profilesResponse.data.length === 0) {
        throw new Error('No profile found to update');
      }
      
      // Find the current user's profile
      const userProfile = profilesResponse.data.find(
        profile => profile.user === userId || 
                  (profile.user && profile.user.id === userId)
      );
      
      if (!userProfile) {
        throw new Error(`Profile not found for user ID ${userId}`);
      }
      
      const profileId = userProfile.id;
      console.log(`Found profile ID ${profileId} for user ID ${userId}`);
      
      // Now update the profile directly
    const formData = new FormData();
      
      // Add profile data to formData - directly in the root, not inside profile[]
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });
      
      console.log(`Updating profile at /profiles/${profileId}/`);
      const response = await api.patch(`/profiles/${profileId}/`, formData);
      
      return {
        ...response.data,
        // Ensure consistent response format
        profile: response.data
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateProfileWithPicture: async (userId: number, profileData: ProfileData, pictureFile: File | null) => {
    // Mock implementation for development
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Updating profile with picture', { profileData, hasPicture: !!pictureFile });
      
      // Get current user from localStorage
      const savedUser = localStorage.getItem('user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      
      if (userData) {
        // Create mock picture URL if we have a file
        let profilePicture = '';
        if (pictureFile) {
          // Create a fake URL for the profile picture
          profilePicture = URL.createObjectURL(pictureFile);
          console.log('Created mock profile picture URL:', profilePicture);
        }
        
        // Update user with new profile data and picture
        const updatedUser = {
          ...userData,
          profile_picture: profilePicture || userData.profile_picture,
          phone_number: profileData.phone_number,
          address: profileData.address
        };
        
        // Save updated user back to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return {
        success: true,
        message: 'Profile updated successfully with picture (mock)',
        profile: {
          ...profileData,
          profile_picture: pictureFile ? 'mock-profile-picture.jpg' : ''
        }
      };
    }
    
    try {
      // First we need to get the profile ID from the profiles endpoint
      const profilesResponse = await api.get('/profiles/');
      
      if (!Array.isArray(profilesResponse.data) || profilesResponse.data.length === 0) {
        throw new Error('No profile found to update');
      }
      
      // Find the current user's profile
      const userProfile = profilesResponse.data.find(
        profile => profile.user === userId || 
                  (profile.user && profile.user.id === userId)
      );
      
      if (!userProfile) {
        throw new Error(`Profile not found for user ID ${userId}`);
      }
      
      const profileId = userProfile.id;
      console.log(`Found profile ID ${profileId} for user ID ${userId}`);
      
      const formData = new FormData();
      
      // Add profile data to formData - directly in the root, not inside profile[]
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });
      
      // Add profile picture if provided
      if (pictureFile) {
        formData.append('profile_picture', pictureFile);
      }
      
      console.log(`Updating profile with picture at /profiles/${profileId}/`);
      const response = await api.patch(`/profiles/${profileId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        ...response.data,
        // Ensure consistent response format
        profile: response.data
      };
    } catch (error: any) {
      console.error('Error updating profile with picture:', error);
      throw error;
    }
  },
};

export const paymentService = {
  processPayment: async (paymentData: PaymentData) => {
    const response = await api.post('/payments/process/', paymentData);
    return response.data;
  },
  
  getPaymentHistory: async () => {
    const response = await api.get('/payments/');
    return response.data;
  },
  
  upgradeSubscription: async () => {
    const response = await api.post('/users/upgrade_subscription/');
    return response.data;
  }
};

// Initialize mock notifications if needed (first time only)
const initializeMockNotifications = () => {
  // Disabled - mock data initialization is not needed in production
  return;
  
  /*
  const hasInitialized = localStorage.getItem('mockNotificationsInitialized');
  if (!hasInitialized) {
    console.log('Initializing mock notifications for first time use');
    
    const initialNotifications = [
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
        notification_type: 'appointment',
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        related_id: 1
      }
    ];
    
    localStorage.setItem('mockNotifications', JSON.stringify(initialNotifications));
    localStorage.setItem('mockNotificationsInitialized', 'true');
    console.log('Mock notifications initialized with default values');
  }
  */
};

// Try to initialize mock notifications immediately
// initializeMockNotifications();

export const notificationService = {
  // Get all notifications for the current user
  getNotifications: async () => {
    try {
      // First try the real API
      try {
        console.log('Attempting to fetch notifications from API...');
        const response = await api.get('/notifications/');
        console.log('Successfully fetched notifications from API');
        // Ensure we return an array
        return Array.isArray(response.data) ? response.data : [];
      } catch (apiError) {
        // If the API returns 404, use the mock implementation
        console.log('API error:', apiError);
        
        if (apiError.response && apiError.response.status === 404) {
          console.log('API returned 404, using mock notifications implementation');
          // Get notifications from localStorage
          const storedNotifications = localStorage.getItem('mockNotifications');
          console.log('Mock notifications from localStorage:', storedNotifications ? 'Found' : 'Not found');
          
          if (!storedNotifications) {
            console.log('Creating initial mock notifications...');
            // Create initial mock notifications if none exist
            const initialNotifications = [
              {
                id: Date.now() - 1000000,
                title: 'Welcome to Chopper Health',
                message: 'Thank you for joining Chopper Health. We are excited to help you manage your healthcare journey!',
                notification_type: 'system',
                is_read: false,
                created_at: new Date(Date.now() - 86400000).toISOString(),
                related_id: null
              }
            ];
            localStorage.setItem('mockNotifications', JSON.stringify(initialNotifications));
            return initialNotifications;
          }
          
          try {
            const parsedNotifications = JSON.parse(storedNotifications);
            return Array.isArray(parsedNotifications) ? parsedNotifications : [];
          } catch (parseError) {
            console.error('Error parsing stored notifications:', parseError);
            return [];
          }
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },
  
  // Fetch user profile data to get profile picture
  getProfilePicture: async () => {
    try {
      const response = await api.get('/profiles/');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: number) => {
    console.log(`Attempting to mark notification ${notificationId} as read via API`);
    try {
      // Check if in mock mode
      if (USE_MOCK_DATA) {
        console.log('Mock mode: Marking notification as read');
        const mockNotifications = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
        const updatedNotifications = mockNotifications.map(notification => {
          if (notification.id === notificationId) {
            return { ...notification, is_read: true };
          }
          return notification;
        });
        
        localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
        console.log(`Mock: Marked notification ${notificationId} as read`);
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        
        return { success: true };
      }
      
      // Use the correct endpoint for marking notifications as read
      const response = await api.post(`/notifications/${notificationId}/read/`);
      console.log('API call to mark notification as read successful:', response);
      
      // Dispatch event to refresh notifications in UI
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Mock implementation for 404 errors (API endpoint not available)
      if (error.response && error.response.status === 404) {
        console.log('API endpoint not found, using mock implementation');
        const mockNotifications = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
        const updatedNotifications = mockNotifications.map(notification => {
          if (notification.id === notificationId) {
            return { ...notification, is_read: true };
          }
          return notification;
        });
        
        localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
        console.log(`Mock: Marked notification ${notificationId} as read`);
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        
        return { success: true };
      }
      
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    console.log('Attempting to mark all notifications as read via API');
    try {
      // Check if in mock mode
      if (USE_MOCK_DATA) {
        console.log('Mock mode: Marking all notifications as read');
        const mockNotifications = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
        const updatedNotifications = mockNotifications.map(notification => {
          return { ...notification, is_read: true };
        });
        
        localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
        console.log('Mock: Marked all notifications as read');
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        
        return { success: true };
      }
      
      const response = await api.post('/notifications/mark_all_read/');
      console.log('API call to mark all notifications as read successful:', response);
      
      // Dispatch event to refresh notifications in UI
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Mock implementation for 404 errors (API endpoint not available)
      if (error.response && error.response.status === 404) {
        console.log('API endpoint not found, using mock implementation');
        const mockNotifications = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
        const updatedNotifications = mockNotifications.map(notification => {
          return { ...notification, is_read: true };
        });
        
        localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
        console.log('Mock: Marked all notifications as read');
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        
        return { success: true };
      }
      
      throw error;
    }
  },
  
  // Create a new notification (admin/system use)
  createNotification: async (data: NotificationData) => {
    // Validate required fields
    if (!data.user_id || !data.title || !data.message || !data.notification_type) {
      console.error('Missing required notification fields:', data);
      return null;
    }
    
    try {
        // Ensure we're using a valid notification type
        const validatedType = validateNotificationType(data.notification_type);
      if (validatedType !== data.notification_type) {
        console.warn(`Notification type '${data.notification_type}' is not valid, using '${validatedType}' instead`);
      }
      
        const validatedData = { 
          ...data, 
          notification_type: validatedType 
        };
        
      console.log('Creating notification with data:', validatedData);
      
      // Check if in mock mode first
      if (USE_MOCK_DATA) {
        console.log('Mock mode: Creating mock notification');
          // Create a new notification and store it in localStorage
          const storedNotifications = localStorage.getItem('mockNotifications');
          const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
          
          const newNotification = {
            id: Date.now(), // Use timestamp as ID
            title: data.title,
            message: data.message,
          notification_type: validatedType,
            is_read: false,
            created_at: new Date().toISOString(),
            related_id: data.related_id
          };
          
          console.log('Created new mock notification:', newNotification);
          
          const updatedNotifications = [newNotification, ...notifications];
          localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
          console.log('Saved updated notifications to localStorage');
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
          
          return newNotification;
        }
      
      // If not in mock mode, try the real API
      try {
        // First try with user_id field
        console.log('Attempting to create notification via API with user_id...');
        const response = await api.post('/notifications/', validatedData);
        console.log('Successfully created notification via API:', response.data);
        
        // Dispatch event to refresh notifications in UI
        window.dispatchEvent(new CustomEvent('refresh-notifications'));
        
        return response.data;
      } catch (apiError) {
        console.error('API error during create notification:', apiError);
        
        // Check response details for better debugging
        if (apiError.response) {
          console.error('API error response:', {
            status: apiError.response.status,
            data: apiError.response.data
          });
          
          // If the error is related to user field, try with direct user field instead of user_id
          if (apiError.response.status === 400 && apiError.response.data && apiError.response.data.user) {
            console.log('Trying again with user field instead of user_id');
            try {
              const directUserData = {
                ...validatedData,
                user: validatedData.user_id  // Use the same ID but with the field name 'user'
              };
              delete directUserData.user_id; // Remove user_id field
              
              const secondResponse = await api.post('/notifications/', directUserData);
              console.log('Successfully created notification with user field:', secondResponse.data);
              
              // Dispatch event to refresh notifications in UI
              window.dispatchEvent(new CustomEvent('refresh-notifications'));
              
              return secondResponse.data;
            } catch (secondError) {
              console.error('Second attempt with user field also failed:', secondError);
              throw secondError; // Re-throw for the outer catch
            }
          }
          
          // If the API returns 404, use the mock implementation
          if (apiError.response.status === 404) {
            return notificationService.createMockNotification(validatedData);
          }
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      // Return null instead of throwing, to prevent breaking appointment actions
      return null;
    }
  },
  
  // Helper method for mock implementation
  createMockNotification: (data: NotificationData) => {
    console.log('Using mock implementation for creating notification:', data);
    // Create a new notification and store it in localStorage
    const storedNotifications = localStorage.getItem('mockNotifications');
    const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    
    const newNotification = {
      id: Date.now(), // Use timestamp as ID
      title: data.title,
      message: data.message,
      notification_type: data.notification_type,
      is_read: false,
      created_at: new Date().toISOString(),
      related_id: data.related_id
    };
    
    console.log('Created new mock notification:', newNotification);
    
    const updatedNotifications = [newNotification, ...notifications];
    localStorage.setItem('mockNotifications', JSON.stringify(updatedNotifications));
    console.log('Saved updated notifications to localStorage');
    
    // Dispatch event to refresh notifications in UI
    window.dispatchEvent(new CustomEvent('refresh-notifications'));
    
    return newNotification;
  },
  
  // Send appointment status notification
  sendAppointmentNotification: async (userId: number, appointmentId: number, status: string, message: string, userEmail?: string) => {
    try {
      // First, create the in-app notification
      const data = {
        user_id: userId,
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        notification_type: 'appointment',
        related_id: appointmentId
      };
      
      // Send in-app notification
      await notificationService.createNotification(data);
      
      // If email is provided, also send email notification
      if (userEmail) {
        // Check if email notifications are enabled for this user
        const emailSettings = localStorage.getItem(`user_${userId}_emailNotifications`);
        const emailEnabled = emailSettings !== null ? JSON.parse(emailSettings) : true; // Default to true
        
        if (emailEnabled) {
          const subject = `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`;
          await emailNotificationService.sendEmailNotification(userEmail, subject, message);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending appointment notification:', error);
      // Don't throw the error, to avoid breaking appointment functionality
      return null;
    }
  },
  
  // Send appointment reminder notification
  sendAppointmentReminder: async (userId: number, appointmentId: number, appointmentData: {
    date_time: string;
    assistant?: {
      user?: {
        first_name?: string;
        last_name?: string;
      }
    };
    user?: {
      email?: string;
    }
  }) => {
    try {
      const date = new Date(appointmentData.date_time);
      // Format the date nicely
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const assistantName = appointmentData.assistant?.user?.first_name && appointmentData.assistant?.user?.last_name ? 
        `Assistant ${appointmentData.assistant.user.first_name} ${appointmentData.assistant.user.last_name}` : 
        'your assistant';
      
      const message = `Reminder: You have an appointment with ${assistantName} scheduled for ${formattedDate} at ${formattedTime}.`;
      
      // Create in-app notification
      const data = {
        user_id: userId,
        title: 'Appointment Reminder',
        message,
        notification_type: 'appointment',
        related_id: appointmentId
      };
      
      // Send in-app notification
      await notificationService.createNotification(data);
      
      // Also send email if user has email and has email notifications enabled
      if (appointmentData.user && appointmentData.user.email) {
        // Check if email notifications are enabled for this user
        const emailSettings = localStorage.getItem(`user_${userId}_emailNotifications`);
        const emailEnabled = emailSettings !== null ? JSON.parse(emailSettings) : true; // Default to true
        
        if (emailEnabled) {
          const subject = 'Upcoming Appointment Reminder';
          await emailNotificationService.sendEmailNotification(
            appointmentData.user.email,
            subject,
            message
          );
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      // Don't throw the error, to avoid breaking reminder functionality
      return null;
    }
  },
};

// Create an email notification service
export const emailNotificationService = {
  // Send email notification
  sendEmailNotification: async (email: string, subject: string, message: string) => {
    // Skip API call if in mock mode
    if (USE_MOCK_DATA) {
      console.log('Mock mode: Sending mock email notification');
      console.log(`Mock Email would be sent to: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      
      // Store email in localStorage for testing purposes
      const sentEmails = JSON.parse(localStorage.getItem('mockSentEmails') || '[]');
      sentEmails.push({
        id: Date.now(),
        email,
        subject,
        message,
        sent_at: new Date().toISOString()
      });
      localStorage.setItem('mockSentEmails', JSON.stringify(sentEmails));
      
      return { success: true, mock: true };
    }
    
    try {
      console.log('Attempting to send email notification via API...');
      const response = await api.post('/notifications/email/', {
        email,
        subject,
        message
      });
      console.log('Successfully sent email notification via API');
      return response.data;
    } catch (error) {
      console.error('Error sending email notification:', error);
      
      if (error.response && error.response.status === 404) {
        // Mock the email sending in development
        console.log('API endpoint not found, using mock email implementation');
        console.log(`Mock Email would be sent to: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        
        // Store email in localStorage for testing purposes
        const sentEmails = JSON.parse(localStorage.getItem('mockSentEmails') || '[]');
        sentEmails.push({
          id: Date.now(),
          email,
          subject,
          message,
          sent_at: new Date().toISOString()
        });
        localStorage.setItem('mockSentEmails', JSON.stringify(sentEmails));
        
        return { success: true, mock: true };
      }
      
      // For other errors, just return failure
      return { success: false, error: error.message };
    }
  },
  
  // Get sent emails (for development testing)
  getSentEmails: () => {
    const sentEmails = localStorage.getItem('mockSentEmails');
    return sentEmails ? JSON.parse(sentEmails) : [];
  },
  
  // Clear sent emails (for development testing)
  clearSentEmails: () => {
    localStorage.removeItem('mockSentEmails');
    return { success: true };
  }
};

// Add consultationService before the last export
export const consultationService = {
  getConsultations: async () => {
    if (USE_MOCK_DATA) {
      // Return mock consultation data for current user only
      // Note: In real mode, the backend already filters consultations by the current user and role
      return [
        {
          id: 1,
          date_time: new Date().toISOString(),
          status: 'pending',
          notes: 'Initial scan consultation',
          consultation_type: 'scan',
          doctor_name: 'Dr. John Doe',
          doctor_phone: '+1 (555) 123-4567',
          patient: {
            id: 101,
            first_name: 'Sarah',
            last_name: 'Johnson',
            username: 'sarahj',
            email: 'sarah.johnson@example.com'
          },
          patient_name: 'Sarah Johnson',
          doctor: {
            first_name: 'John',
            last_name: 'Doe'
          },
          scan_details: {
            id: 1001,
            scan_type: 'X-Ray'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          date_time: new Date(Date.now() + 86400000).toISOString(),
          status: 'accepted',
          notes: 'Follow-up scan consultation',
          consultation_type: 'follow_up',
          doctor_name: 'Dr. Jane Smith',
          doctor_phone: '+1 (555) 987-6543',
          patient: {
            id: 102,
            first_name: 'Michael',
            last_name: 'Brown',
            username: 'mikeb',
            email: 'michael.brown@example.com'
          },
          patient_name: 'Michael Brown',
          doctor: {
            first_name: 'Jane',
            last_name: 'Smith'
          },
          scan_details: {
            id: 1002,
            scan_type: 'MRI'
          },
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          date_time: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          notes: 'Completed scan consultation',
          consultation_type: 'initial',
          doctor_name: 'Dr. Sarah Johnson',
          doctor_phone: '+1 (555) 456-7890',
          patient: {
            id: 103,
            first_name: 'David',
            last_name: 'Wilson',
            username: 'davidw',
            email: 'david.wilson@example.com'
          },
          patient_name: 'David Wilson',
          doctor: {
            first_name: 'Sarah',
            last_name: 'Johnson'
          },
          scan_details: {
            id: 1003,
            scan_type: 'CT Scan'
          },
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];
    }

    try {
      // The backend API endpoint already filters consultations based on the user's role:
      // - For doctors: only shows consultations where they are the doctor
      // - For patients/users: only shows consultations where they are the patient
      // - For admins: shows all consultations
      const response = await api.get('/consultations/');
      return response.data;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  },
  
  getConsultationById: async (consultationId: number): Promise<any> => {
    console.log(`Fetching consultation with ID ${consultationId}`);
    
    try {
      const response = await api.get(`/consultations/${consultationId}/`);
      const consultation = response.data;
      
      // Enhance the consultation data with additional information
      const enhancedConsultation = { ...consultation };
      
      // Handle scan data if it's just an ID
      if (enhancedConsultation.scan && typeof enhancedConsultation.scan === 'number') {
        console.log(`Scan is just an ID (${enhancedConsultation.scan}), creating basic scan object`);
        const scanId = enhancedConsultation.scan;
        
        try {
          const scanResponse = await api.get(`/scans/${scanId}/`);
          console.log('Successfully fetched scan by ID:', scanResponse.data);
          enhancedConsultation.scan = scanResponse.data;
        } catch (error) {
          console.error('Error fetching scan:', error);
          // Create a placeholder scan object
          enhancedConsultation.scan = {
            id: scanId,
            image: '',
            result: '',
            confidence_score: 0,
          };
        }
      }
      
      // Handle patient data if it's just an ID
      if (enhancedConsultation.patient && typeof enhancedConsultation.patient === 'number') {
        const patientId = enhancedConsultation.patient;
        console.log(`Attempting to fetch user profile for patient ID: ${patientId}`);
        
        try {
          // Fetch user data
          const userResponse = await api.get(`/users/${patientId}/`);
          console.log('Successfully fetched detailed user data:', userResponse.data);
          
          // Create a patient object with the user data
          enhancedConsultation.patient = {
            ...userResponse.data
          };
          
          // Try to fetch the profile data to get the profile picture - try correct endpoint first
          try {
            // Try the correct profiles endpoint first
            const profileResponse = await api.get(`/profiles/${patientId}/`);
            if (profileResponse.status === 200) {
              console.log('Successfully fetched user profile data from /profiles/ endpoint:', profileResponse.data);
              
              // Enhance the patient object with profile data
              enhancedConsultation.patient = {
                ...enhancedConsultation.patient,
                profile_picture: profileResponse.data.profile_picture || null,
                profile_picture_url: profileResponse.data.profile_picture_url || 
                  (profileResponse.data.profile_picture ? formatProfilePictureUrl(profileResponse.data.profile_picture) : null),
                bio: profileResponse.data.bio || '',
                // Keep existing data if profile data doesn't have it
                address: profileResponse.data.address || enhancedConsultation.patient.address,
                phone_number: profileResponse.data.phone_number || enhancedConsultation.patient.phone_number,
                gender: profileResponse.data.gender || ''
              };
            }
          } catch (profileError) {
            console.error('Error fetching from /profiles/ endpoint:', profileError);
            
            // Try the legacy userprofile endpoint
            try {
              const legacyProfileResponse = await api.get(`/userprofile/${patientId}/`);
              if (legacyProfileResponse.status === 200) {
                console.log('Successfully fetched user profile data from /userprofile/ endpoint:', legacyProfileResponse.data);
                
                // Enhance the patient object with profile data
                enhancedConsultation.patient = {
                  ...enhancedConsultation.patient,
                  profile_picture: legacyProfileResponse.data.profile_picture || null,
                  profile_picture_url: legacyProfileResponse.data.profile_picture_url || 
                    (legacyProfileResponse.data.profile_picture ? formatProfilePictureUrl(legacyProfileResponse.data.profile_picture) : null),
                  bio: legacyProfileResponse.data.bio || '',
                  // Keep existing data if profile data doesn't have it
                  address: legacyProfileResponse.data.address || enhancedConsultation.patient.address,
                  phone_number: legacyProfileResponse.data.phone_number || enhancedConsultation.patient.phone_number,
                  gender: legacyProfileResponse.data.gender || ''
                };
              }
            } catch (legacyProfileError) {
              console.error('Error fetching from /userprofile/ endpoint:', legacyProfileError);
              
              // Try the alternative plural endpoint as a last resort
              try {
                const altProfileResponse = await api.get(`/userprofiles/${patientId}/`);
                if (altProfileResponse.status === 200) {
                  console.log('Successfully fetched user profile from /userprofiles/ endpoint:', altProfileResponse.data);
                  
                  // Enhance the patient object with profile data
                  enhancedConsultation.patient = {
                    ...enhancedConsultation.patient,
                    profile_picture: altProfileResponse.data.profile_picture || null,
                    profile_picture_url: altProfileResponse.data.profile_picture_url || 
                      (altProfileResponse.data.profile_picture ? formatProfilePictureUrl(altProfileResponse.data.profile_picture) : null),
                    bio: altProfileResponse.data.bio || '',
                    // Keep existing data if profile data doesn't have it
                    address: altProfileResponse.data.address || enhancedConsultation.patient.address,
                    phone_number: altProfileResponse.data.phone_number || enhancedConsultation.patient.phone_number,
                    gender: altProfileResponse.data.gender || ''
                  };
                }
              } catch (altProfileError) {
                console.error('Error fetching from all profile endpoints:', altProfileError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching patient data:', error);
          // Create a minimal patient object from what we know
          enhancedConsultation.patient = {
            id: patientId,
            // Try to extract a name from patient_name if available
            first_name: enhancedConsultation.patient_name ? 
              enhancedConsultation.patient_name.split(' ')[0] : '',
            last_name: enhancedConsultation.patient_name ? 
              enhancedConsultation.patient_name.split(' ').slice(1).join(' ') : ''
          };
        }
      }
      
      console.log('Final enhanced consultation data to be returned:', enhancedConsultation);
      return enhancedConsultation;
    } catch (error) {
      console.error(`Error fetching consultation with ID ${consultationId}:`, error);
      throw error;
    }
  },
  
  updateConsultationStatus: async (consultationId: number, newStatus?: string, notes?: string, additionalData?: any) => {
    if (USE_MOCK_DATA) {
      console.log(`Mock mode: Updating consultation ${consultationId} status to ${newStatus}`);
      return {
        id: consultationId,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
    }

    const response = await api.post(`/consultations/${consultationId}/update_status/`, {
      status: newStatus,
      notes: notes,
      additional_data: additionalData
    });
      return response.data;
  },
};

// Define the interface for X-ray image data
interface XRayImageData {
  id: number;
  image: string;
  appointment: number;
  patient: number | {
    id: number;
    [key: string]: any;
  };
  assistant?: {
    id: number;
    first_name: string;
    last_name: string;
    [key: string]: any;
  };
  upload_date: string;
  notes?: string;
  [key: string]: any; // Allow for additional properties
}

export const xrayService = {
  getUserXRays: async (): Promise<XRayImageData[]> => {
    try {
      const response = await api.get('/xrayimage/');
      console.log("Raw X-ray data from API:", response.data);
      
      // Get current user from localStorage
      const userString = localStorage.getItem('user');
      let user = null;
      if (userString) {
        try {
          user = JSON.parse(userString);
          console.log("Current user for X-ray filtering:", user);
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      
      // Process and filter X-rays
      const xrays = response.data
        .filter(xray => xray && xray.image)
        .map(xray => {
          // Format the image URL if needed
          if (xray.image) {
            xray.image = formatImageUrl(xray.image);
          }
          return xray;
        });
      
      // Filter X-rays based on the current user ID matching patient ID
      // No role check - any user should only see their own X-rays as a patient
      if (user && user.id) {
        console.log(`Filtering X-rays for user ${user.id}`);
        return xrays.filter(xray => {
          const patientId = typeof xray.patient === 'object' ? xray.patient?.id : xray.patient;
          // Convert both to numbers to ensure consistent comparison
          return Number(patientId) === Number(user.id);
        });
      }
      
      // If no user info available, return empty array for safety
      return [];
    } catch (error) {
      console.error('Error fetching user X-rays:', error);
      return [];
    }
  },
  
  getXRayById: async (xrayId: number): Promise<XRayImageData> => {
    // Get specific X-ray by ID
    try {
      console.log(`Fetching real X-ray image with ID ${xrayId} from API`);
      // Get X-ray directly from the /xrayimage/{id}/ endpoint - without extra headers
      const response = await api.get(`/xrayimage/${xrayId}/`);
      
      if (!response.data || !response.data.id) {
        console.error('Invalid X-ray data returned from API:', response.data);
        throw new Error('Invalid X-ray data returned from API');
      }
      
      console.log('X-ray API response:', response.data);
      
      // Format image URL correctly
      const xrayData = {
        ...response.data,
        image: formatImageUrl(response.data.image),
        uniqueKey: `${response.data.id}-${Date.now()}-${Math.random().toString(36).substring(7)}` // Add unique key to force re-render
      };
      
      return xrayData;
    } catch (error) {
      console.error(`Error in getXRayById(${xrayId}):`, error);
      throw error;
    }
  },
  
  analyzeXRay: async (imageFile: File): Promise<any> => {
    try {
      console.log('Analyzing X-ray image with real API endpoint');
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post('/predict-scan/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in analyzeXRay:', error);
      throw error;
    }
  }
};

// Helper function to format image URLs
function formatImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  console.log('Formatting image URL:', imageUrl);
  
  // If it's already a full URL, return it as is
  if (imageUrl.startsWith('http')) {
    console.log('URL is already absolute:', imageUrl);
    return imageUrl;
  }
  
  // Handle relative paths
  let formattedUrl;
  if (imageUrl.startsWith('/')) {
    // If it starts with /, join it with base URL
    formattedUrl = `${API_BASE_URL}${imageUrl}`;
  } else if (imageUrl.startsWith('media/')) {
    // If it already includes media/ prefix
    formattedUrl = `${API_BASE_URL}/${imageUrl}`;
  } else {
    // Otherwise, add media/ prefix
    formattedUrl = `${API_BASE_URL}/media/${imageUrl}`;
  }
  
  console.log('Formatted image URL:', formattedUrl);
  return formattedUrl;
} 