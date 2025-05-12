import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, FileText, PenLine, Stethoscope, AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Mail, Phone, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { customToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import PaginationGlass from '@/components/PaginationGlass';

const scanAnimation = keyframes`
  0% { top: 0; }
  50% { top: 100%; }
  50.001% { top: -2px; }
  100% { top: 0; }
`;

const ScanLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(6, 182, 212, 0.5);
  animation: ${scanAnimation} 3s linear infinite;
`;

const ConsultationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');
  const [scanId, setScanId] = useState(null);
  const [scanDetails, setScanDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // User information state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [userScans, setUserScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(3);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [currentDoctorPage, setCurrentDoctorPage] = useState<number>(1);
  const [doctorsPerPage] = useState<number>(3);
  const [totalDoctorPages, setTotalDoctorPages] = useState<number>(1);

  // Add this sorting logic before the pagination calculation
  const sortedScans = [...userScans].sort((a, b) => 
    new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );

  // Update the pagination calculation to use sortedScans
  const indexOfLastScan = currentPage * itemsPerPage;
  const indexOfFirstScan = indexOfLastScan - itemsPerPage;
  const currentScans = sortedScans.slice(indexOfFirstScan, indexOfLastScan);

  // Calculate current doctors for pagination
  const indexOfLastDoctor = currentDoctorPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstDoctor, indexOfLastDoctor);

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Get scan ID from URL params if available
    const params = new URLSearchParams(location.search);
    const scanIdParam = params.get('scanId');
    if (scanIdParam) {
      setScanId(scanIdParam);
      fetchScanDetails(scanIdParam);
    }

    fetchDoctors();
    
    // Fetch user profile to get phone number
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

    // Fetch user's scans
    const fetchUserScans = async () => {
      try {
        const response = await api.get('/scans/');
        setUserScans(response.data);
        
        // If we have a scanId from URL params, find that scan in the user's scans and set it as selected
        if (scanIdParam) {
          const selectedScan = response.data.find(scan => scan.id.toString() === scanIdParam);
          if (selectedScan) {
            setSelectedScan(selectedScan);
          }
        }
      } catch (error) {
        console.error('Error fetching scans:', error);
        customToast.error('Failed to load scan history');
      }
    };

    fetchUserScans();
  }, [isAuthenticated, navigate, location, user]);

  useEffect(() => {
    setTotalPages(Math.ceil(userScans.length / itemsPerPage));
  }, [userScans, itemsPerPage]);

  useEffect(() => {
    setTotalDoctorPages(Math.ceil(doctors.length / doctorsPerPage));
  }, [doctors, doctorsPerPage]);

  const fetchDoctors = async () => {
    try {
      // Fetch doctors from doctor endpoint instead of users endpoint
      const response = await api.get('/doctors/');
      
      if (response.data && response.data.length > 0) {
        // Format the doctors data to include profile picture, name, specialty and years of experience
        const formattedDoctors = response.data.map(doctor => ({
          id: doctor.id,
          user_id: doctor.user.id,
          first_name: doctor.user.first_name,
          last_name: doctor.user.last_name,
          full_name: `${doctor.user.first_name} ${doctor.user.last_name}`,
          specialty: doctor.specialty || 'General Medicine',
          profile_picture: doctor.profile_picture,
          years_of_experience: doctor.years_of_experience || 0
        }));
        setDoctors(formattedDoctors);
        
        // If there's only one doctor, select it automatically
        if (formattedDoctors.length === 1) {
          setSelectedDoctor(formattedDoctors[0].user_id);
        }
      } else {
        // No doctors found
        setDoctors([]);
        customToast.warning('No doctors are currently available');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      customToast.error('Failed to load doctors');
      setDoctors([]);
    }
  };

  const fetchScanDetails = async (id) => {
    try {
      const response = await api.get(`/scans/${id}/`);
      setScanDetails(response.data);
    } catch (error) {
      console.error('Error fetching scan details:', error);
      customToast.error('Failed to load scan details');
    }
  };

  const validateUserInfo = () => {
    let isValid = true;
    const newErrors = {...errors};

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

    if (!phone || phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    } else {
      newErrors.phone = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!validateUserInfo()) {
        return;
      }
    } else if (currentStep === 1) {
      if (!selectedScan) {
        customToast.error('Please select a scan');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedDoctor) {
        customToast.error('Please select a doctor');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Format the date and time for the consultation
      const consultationDateTime = new Date(selectedDate);
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        consultationDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      // Create the consultation directly
      const consultationData = {
        patient: user?.id,
        doctor: selectedDoctor,
        consultation_type: 'initial',
        status: 'pending',
        notes: description,
        scan: selectedScan ? selectedScan.id : scanId, // Use the selected scan ID from step 2 or the scanId from URL
        date_time: consultationDateTime.toISOString()
      };

      // Create consultation using the consultations endpoint
      await api.post('/consultations/', consultationData);

      // Show success message and reset form
      customToast.success('Consultation scheduled successfully!');
      navigate('/profile');
    } catch (err) {
      console.error('Error creating consultation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create consultation');
      customToast.error('Failed to schedule consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDoctorPageChange = (pageNumber: number) => {
    setCurrentDoctorPage(pageNumber);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="background-pattern"></div>
      
      <main className="flex-grow pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="neuro-card p-5 md:p-8">
            {/* Progress Bar */}
            <div className="flex justify-between mb-10 relative">
              {[1, 2, 3, 4].map((step, index) => (
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
                    {index === 0 ? 'Info' : index === 1 ? 'Scan' : index === 2 ? 'Doctor' : 'Confirm'}
                  </div>
                </div>
              ))}
              
              {/* Progress line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>

            {/* Step 1: User Information */}
            {currentStep === 0 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <User className="mr-2 h-6 w-6" />Your Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={cn(errors.firstName ? "border-red-500" : "")}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={cn(errors.lastName ? "border-red-500" : "")}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(errors.email ? "border-red-500" : "")}
                      placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(errors.phone ? "border-red-500" : "")}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button className="disappear-button" onClick={handleNextStep}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Scan Selection */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <FileText className="mr-2 h-6 w-6" />Select Scan
                </h3>
                
                {userScans.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
                      {currentScans.map((scan) => {
                        const isAbnormal = 
                          scan.requires_consultation || 
                          scan.result?.toLowerCase().includes('pneumonia') || 
                          scan.result?.toLowerCase().includes('abnormal') ||
                          scan.result?.toLowerCase().includes('lung opacity');

                        return (
                          <div 
                            key={scan.id} 
                            onClick={() => setSelectedScan(scan)}
                            className={`relative cursor-pointer rounded-lg border transition-all duration-300 overflow-hidden w-full
                              hover:shadow-lg hover:-translate-y-1 group
                              ${selectedScan?.id === scan.id 
                                ? 'border-primary ring-2 ring-primary shadow-lg' 
                                : isAbnormal
                                  ? 'border-red-400 hover:border-red-500'
                                  : 'border-gray-200 hover:border-primary/50'
                              }`}
                          >
                            {/* Scan Visualization */}
                            <div className="relative flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                              {/* Scan ID Badge */}
                              <div className="absolute top-2 z-10">
                                <span className="px-2 py-0.5 bg-white/90 rounded-full text-xs font-mono text-gray-600 shadow-sm border border-gray-100">
                                  {String(scan.id).padStart(3, '0')}
                                </span>
                              </div>
                              
                              {/* Status Indicator */}
                              <div className="relative">
                                {/* Outer Circle */}
                                <div className={`w-24 h-24 rounded-full ${
                                  isAbnormal ? 'bg-red-100' : 'bg-green-100'
                                } flex items-center justify-center`}>
                                  {/* Middle Circle */}
                                  <div className={`w-20 h-20 rounded-full ${
                                    isAbnormal ? 'bg-red-200' : 'bg-green-200'
                                  } flex items-center justify-center`}>
                                    {/* Inner Circle */}
                                    <div className={`w-16 h-16 rounded-full ${
                                      isAbnormal ? 'bg-red-300' : 'bg-green-300'
                                    } flex items-center justify-center`}>
                                      {/* Icon */}
                                      <div className={`text-2xl ${
                                        isAbnormal ? 'text-red-500' : 'text-green-500'
                                      }`}>
                                        {isAbnormal ? '×' : '✓'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Confidence Score */}
                              <div className="absolute bottom-2">
                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                  {Math.round(scan.confidence_score * 100)}% confidence
                                </span>
                              </div>

                              {/* Corner Accents */}
                              <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-gray-200 rounded-tl-lg"></div>
                              <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-gray-200 rounded-tr-lg"></div>
                              <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-gray-200 rounded-bl-lg"></div>
                              <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-gray-200 rounded-br-lg"></div>
                            </div>

                            <div className="p-3 space-y-2 relative z-10 transition-colors duration-300 group-hover:bg-gray-50">
                              <p className="text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">Date:</span>{' '}
                                {new Date(scan.upload_date).toLocaleDateString()}
                              </p>
                              
                              {scan.result && (
                                <div className="text-sm flex items-start gap-2">
                                  <svg 
                                    className={`w-4 h-4 mt-0.5 ${isAbnormal ? 'text-red-500' : 'text-gray-400'}`} 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <span>
                                    <span className="font-medium">Result:</span>{' '}
                                    <span className={isAbnormal ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                      {scan.result}
                                    </span>
                                  </span>
                                </div>
                              )}

                              <div className={`text-sm font-medium flex items-center gap-2 ${
                                isAbnormal ? 'text-red-600' : 'text-green-600'
                              }`}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {isAbnormal ? (
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  ) : (
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  )}
                                </svg>
                                {isAbnormal ? 'Consultation Required' : 'No Consultation Needed'}
                              </div>
                            </div>

                            {selectedScan?.id === scan.id && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm z-20">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Replace the existing pagination with PaginationGlass */}
                    <PaginationGlass 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No scans found. Please upload a scan first.</p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate('/scan')}
                    >
                      Upload New Scan
                    </Button>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    className="disappear-button" 
                    onClick={handleNextStep}
                    disabled={!selectedScan}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Doctor Selection */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <Stethoscope className="mr-2 h-6 w-6" />Select Doctor
                </h3>
                
                {doctors.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                      {currentDoctors.map((doctor) => (
                        <div 
                          key={doctor.id} 
                          onClick={() => setSelectedDoctor(doctor.user_id)}
                          className={`relative cursor-pointer rounded-lg border transition-all duration-300 overflow-hidden w-full
                            hover:shadow-lg hover:-translate-y-1 group
                            ${selectedDoctor === doctor.user_id 
                              ? 'border-primary ring-2 ring-primary shadow-lg' 
                              : 'border-gray-200 hover:border-primary/50'
                            }`}
                        >
                          {/* Doctor Card */}
                          <div className="relative flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                            {/* Doctor Profile Picture */}
                            <div className="relative mt-6">
                              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                                {doctor.profile_picture ? (
                                  <img 
                                    src={doctor.profile_picture} 
                                    alt={doctor.full_name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.full_name) + '&background=0D8ABC&color=fff';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-medium text-primary">
                                      {doctor.first_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Doctor Info */}
                            <div className="mt-3 text-center">
                              <h4 className="font-medium text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</h4>
                              <p className="text-xs text-primary font-medium">{doctor.specialty}</p>
                              
                              {/* Experience Badge */}
                              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {doctor.years_of_experience || '0'} years
                              </div>
                            </div>

                            {/* Corner Accents */}
                            <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-gray-200 rounded-tl-lg"></div>
                            <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-gray-200 rounded-tr-lg"></div>
                            <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-gray-200 rounded-bl-lg"></div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-gray-200 rounded-br-lg"></div>
                          </div>

                          {selectedDoctor === doctor.user_id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm z-20">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Replace doctor pagination with PaginationGlass */}
                    {doctors.length > doctorsPerPage && (
                      <PaginationGlass 
                        currentPage={currentDoctorPage}
                        totalPages={totalDoctorPages}
                        onPageChange={handleDoctorPageChange}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No doctors are currently available. Please try again later or contact our support.</p>
                  </div>
                )}

                <div className="space-y-2 mt-6">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-primary" />
                  Additional Information
                </label>
                <Textarea
                  placeholder="Please provide any additional information about your condition..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={handlePrevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    className="disappear-button" 
                    onClick={handleNextStep}
                    disabled={!selectedDoctor}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold gradient-text mb-6 flex items-center">
                  <CheckCircle className="mr-2 h-6 w-6" />Confirmation
                </h3>
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">First Name</p>
                      <p className="font-medium">{firstName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Last Name</p>
                      <p className="font-medium">{lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Email</p>
                      <p className="font-medium">{email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Phone</p>
                      <p className="font-medium">{phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Doctor</p>
                      <p className="font-medium">
                        {doctors.find(d => d.user_id === selectedDoctor)?.full_name || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Consultation Date & Time</p>
                      <p className="font-medium">
                        {selectedDate && selectedTime ? 
                          `${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}` : 
                          'Not selected'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-sm">Additional Information</p>
                      <p className="font-medium">{description || 'None provided'}</p>
                    </div>
              {scanDetails && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-sm">Scan Details</p>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">
                      <span className="font-medium">Result:</span> {scanDetails.result}
                    </p>
                          <p className="text-sm">
                      <span className="font-medium">Confidence:</span> {scanDetails.confidence_score}%
                    </p>
                        </div>
                      </div>
                    )}
                    {selectedScan && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-sm">Selected Scan</p>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Scan ID:</span> #{selectedScan.id}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Upload Date:</span> {new Date(selectedScan.upload_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Status:</span> {
                              (() => {
                                const needsConsultation = selectedScan.requires_consultation || 
                                  selectedScan.result?.toLowerCase().includes('pneumonia') || 
                                  selectedScan.result?.toLowerCase().includes('abnormal') ||
                                  selectedScan.result?.toLowerCase().includes('lung opacity');
                                
                                return (
                                  <span className={needsConsultation ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                    {needsConsultation ? 'Consultation Required' : 'No Consultation Needed'}
                                  </span>
                                );
                              })()
                            }
                          </p>
                          {selectedScan.confidence_score !== null && (
                            <p className="text-sm">
                              <span className="font-medium">Confidence Score:</span> {(selectedScan.confidence_score * 100).toFixed(1)}%
                            </p>
                          )}
                          {selectedScan.result && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Analysis Result:</span><br />
                              <span className={selectedScan.result.toLowerCase().includes('pneumonia') ? "text-red-600" : ""}>
                                {selectedScan.result}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Consultation'
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

export default ConsultationPage; 