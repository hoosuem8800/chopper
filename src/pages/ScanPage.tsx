import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, History, AlertCircle, FileText, CheckCircle, Loader2, Cloud, ArrowLeft, PartyPopper, FilterX, SortDesc, SortAsc, Lock, Zap, FileX, CalendarPlus, Folder, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, appointmentService, scanService, xrayService } from '@/services/api';
import { format } from 'date-fns';
import { cn, chopperButton } from '@/lib/utils';
import { customToast } from '@/lib/toast';
import confetti from 'canvas-confetti';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Define the Scan interface
interface Scan {
  id: number;
  image?: string;
  upload_date: string;
  result?: string;
  confidence_score?: number;
  status?: string;
  notes?: string;
}

const ScanPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isPremium, user } = useAuth();
  const [activeTab, setActiveTab] = useState('quickscan');
  const [scans, setScans] = useState<Scan[]>([]);
  const [filteredScans, setFilteredScans] = useState<Scan[]>([]);
  const [sortOption, setSortOption] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedXRay, setSelectedXRay] = useState<{id: number | null}>({id: null});
  const [recentAppointmentResults, setRecentAppointmentResults] = useState<any[]>([]);
  const [loadingAppointmentResults, setLoadingAppointmentResults] = useState(false);
  const [analyzingXRay, setAnalyzingXRay] = useState(false);
  const [userXRays, setUserXRays] = useState<any[]>([]);
  const [loadingXRays, setLoadingXRays] = useState(false);
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
  const [selectedImageDialog, setSelectedImageDialog] = useState<{ id: number | null, url: string | null }>({ id: null, url: null });

  // Custom CSS for scan animation
  const scannerStyles = `
    @keyframes laserScan {
      0% { transform: translateY(0); opacity: 0.2; }
      10% { opacity: 0.9; }
      30% { transform: translateY(400px); opacity: 0.9; }
      40% { opacity: 0.2; }
      50% { transform: translateY(0); opacity: 0.1; }
      60% { opacity: 0.9; }
      80% { transform: translateY(400px); opacity: 0.9; }
      90% { opacity: 0.2; }
      100% { transform: translateY(0); opacity: 0; }
    }
    
    .laser-scan-animation {
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        rgba(6, 182, 212, 0.1) 0%,
        rgba(6, 182, 212, 0.9) 20%,
        rgba(16, 215, 245, 1) 50%,
        rgba(6, 182, 212, 0.9) 80%,
        rgba(6, 182, 212, 0.1) 100%
      );
      box-shadow: 
        0 0 10px 3px rgba(6, 182, 212, 0.8),
        0 0 20px 8px rgba(6, 182, 212, 0.4);
      animation: laserScan 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      filter: blur(0.5px);
    }
    
    /* Grid lines effect */
    .scan-grid {
      position: absolute;
      inset: 0;
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(6, 182, 212, 0.07) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(6, 182, 212, 0.07) 1px, transparent 1px);
      mask-image: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0) 100%);
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    
    .group:hover .scan-grid {
      opacity: 1;
    }
    
    /* Scan tracker dots */
    .scan-tracker {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(6, 182, 212, 0.9);
      box-shadow: 0 0 10px 3px rgba(6, 182, 212, 0.7);
      opacity: 0;
      transition: opacity 0.4s ease-in-out;
    }
    
    .scan-tracker-1 {
      top: 20%;
      left: 10%;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .scan-tracker-2 {
      top: 40%;
      left: 85%;
      animation: pulse 3s ease-in-out infinite 0.5s;
    }
    
    .scan-tracker-3 {
      top: 70%;
      left: 35%;
      animation: pulse 2.5s ease-in-out infinite 1s;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.8); opacity: 1; }
    }
    
    .group:hover .scan-tracker {
      opacity: 1;
    }
    
    @keyframes glowPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
    
    .glow-pulse-animation {
      animation: glowPulse 3s ease-in-out infinite;
    }
    
    /* Custom consultation button styling to fix hover issue */
    .consult-btn:hover .consult-icon {
      color: #ef4444 !important; /* Red-500 */
    }
    
    .group:hover .consult-btn:not(:hover) .consult-icon {
      color: white !important;
    }
  `;

  // Get related_id from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const relatedId = queryParams.get('related_id');

  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Function to handle scan page changes
  const handleScanPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(filteredScans.length / itemsPerPage)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Get current scans for pagination
  const getCurrentPageScans = () => {
    const indexOfLastScan = currentPage * itemsPerPage;
    const indexOfFirstScan = indexOfLastScan - itemsPerPage;
    return filteredScans.slice(indexOfFirstScan, indexOfLastScan);
  };

  // Within state definitions, add these for pagination
  const [currentXRayPage, setCurrentXRayPage] = useState(1);
  // Adjust the number of X-rays per page based on screen size
  const [xRayImagesPerPage, setXRayImagesPerPage] = useState(() => {
    if (window.innerWidth >= 1024) return 3; // lg screens
    if (window.innerWidth >= 768) return 2;  // md screens
    return 1; // mobile screens
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Add resize listener to update cards per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setXRayImagesPerPage(3); // lg screens
      } else if (window.innerWidth >= 768) {
        setXRayImagesPerPage(2); // md screens
      } else {
        setXRayImagesPerPage(1); // mobile screens
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to trigger confetti
  const triggerCelebration = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Clear any existing data first to prevent showing stale images
    setUserXRays([]);
    setRecentAppointmentResults([]);
    
    // Add a small delay before fetching to ensure any previous state is cleared
    const fetchDataTimer = setTimeout(() => {
    fetchScans();
      fetchRecentAppointmentResults();
      fetchUserXRays();
    }, 100);
    
    // Check if there's a related_id parameter in the URL
    if (relatedId) {
      // Set the active tab to 'quickscan' and show the specific X-ray result
      setActiveTab('quickscan');
      analyzeUserXRay(relatedId);
    }
    
    return () => {
      // Clean up timer on unmount
      clearTimeout(fetchDataTimer);
    };
  }, [isAuthenticated, navigate, location.pathname]);

  // Effect for celebration when prediction result changes
  useEffect(() => {
    if (predictionResult?.prediction === 'Normal') {
      triggerCelebration();
    }
  }, [predictionResult]);

  // Effect to apply sorting whenever scans or sort option changes
  useEffect(() => {
    applySorting();
  }, [scans, sortOption]);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/scans/');
      setScans(response.data);
    } catch (error) {
      console.error('Error fetching scans:', error);
      customToast.error('Failed to load scans');
    } finally {
      setLoading(false);
    }
  };

  const applySorting = () => {
    if (!scans.length) {
      setFilteredScans([]);
      return;
    }
    
    let sorted = [...scans];
    
    if (sortOption === 'newest') {
      sorted.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
    } else if (sortOption === 'oldest') {
      sorted.sort((a, b) => new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime());
    } else if (sortOption === 'highest-id') {
      sorted.sort((a, b) => b.id - a.id);
    } else if (sortOption === 'lowest-id') {
      sorted.sort((a, b) => a.id - b.id);
    } else {
      // Default to newest first
      sorted.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
    }
    
    setFilteredScans(sorted);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    // Sorting will be applied in useEffect
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsPredicting(true);
    setPredictionResult(null);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First, send to prediction endpoint
      const predictionResponse = await api.post('/predict-scan/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        },
      });

      // Process prediction result - handle different response formats
      let prediction, confidence, classProbs;
      
      // Handle API response based on available fields
      if (predictionResponse.data.diagnosis) {
        // Our new ML model response format
        prediction = predictionResponse.data.diagnosis;
        confidence = predictionResponse.data.confidence;
        classProbs = predictionResponse.data.class_probabilities;
      } else if (predictionResponse.data.prediction || predictionResponse.data.result) {
        // Legacy format
        prediction = predictionResponse.data.prediction || predictionResponse.data.result;
        confidence = predictionResponse.data.confidence || predictionResponse.data.probability;
      } else {
        throw new Error('Unexpected response format from ML service');
      }
      
      // Normalize prediction format (change Lung_Opacity to Lung Opacity)
      if (prediction === 'Lung_Opacity') {
        prediction = 'Lung Opacity';
      }
      
      // Ensure confidence is a number
      const numericConfidence = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
      
      setPredictionResult({
        prediction: prediction,
        confidence: numericConfidence,
        classProbs: classProbs
      });

      // Then save to scans
      const scanFormData = new FormData();
      scanFormData.append('image', file);
      scanFormData.append('result', prediction);
      
      // Ensure confidence is stored consistently in decimal format (0-1 range)
      const normalizedConfidence = numericConfidence > 1 ? (numericConfidence / 100) : numericConfidence;
      scanFormData.append('confidence_score', normalizedConfidence.toString());
      scanFormData.append('status', 'completed');
      
      const scanResponse = await api.post('/scans/', scanFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        },
      });

      customToast.success('Scan analyzed successfully');
      fetchScans();
      
      // If normal result, trigger celebration
      if (prediction === 'Normal') {
        triggerCelebration();
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      if (error.message === 'Authentication token not found') {
        customToast.error('Please log in to upload scans');
        navigate('/login');
      } else if (error.response?.status === 503) {
        customToast.error('ML service is not available. Please try again later.');
      } else if (error.response?.status === 504) {
        customToast.error('ML service request timed out. Please try again.');
      } else if (error.response?.data?.error) {
        customToast.error(`Error: ${error.response.data.error}`);
      } else {
        customToast.error('Failed to process scan. Please try again.');
      }
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-500';
      case 'Pneumonia':
      case 'Lung Opacity':
      case 'Lung_Opacity':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const navigateToTab = (tabValue: string) => {
    setActiveTab(tabValue);
    // Programmatically select the tab
    if (tabsRef.current) {
      const tabTrigger = tabsRef.current.querySelector(`[data-state][value="${tabValue}"]`) as HTMLButtonElement;
      if (tabTrigger) {
        tabTrigger.click();
      }
    }
  };

  const renderPredictionResult = () => {
    if (!predictionResult) return null;

    const prediction = predictionResult.prediction;
    const isNormal = prediction === 'Normal';
    const isPneumonia = prediction === 'Pneumonia';
    const isLungOpacity = prediction === 'Lung Opacity' || prediction === 'Lung_Opacity';
    
    // Format confidence as percentage
    const confidence = typeof predictionResult.confidence === 'number' 
      ? (predictionResult.confidence > 1 ? predictionResult.confidence.toFixed(1) : (predictionResult.confidence * 100).toFixed(1)) 
      : predictionResult.confidence;

    return (
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="prediction-result">
        <div className={cn(
          "rounded-xl p-6 border-2 transition-all duration-300",
          isNormal 
            ? "bg-green-50/80 border-green-200 shadow-lg shadow-green-100/50" 
            : "bg-red-50/80 border-red-200 shadow-lg shadow-red-100/50"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {isNormal ? (
                  <div className="relative">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <div className="absolute -inset-2 bg-green-400/20 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <div className="absolute -inset-2 bg-red-400/20 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {isNormal ? "Normal Scan Result" : 
                   isPneumonia ? "Pneumonia Detected" : 
                   "Lung Opacity Detected"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isNormal 
                    ? "No signs of abnormality were detected in this scan." 
                    : isPneumonia
                      ? "Signs of pneumonia were detected. Please consult with a healthcare professional."
                      : "Lung opacity was detected. Please consult with a healthcare professional."}
                </p>
              </div>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full text-sm font-medium",
              isNormal 
                ? "bg-green-100 text-green-800 ring-1 ring-green-600/20" 
                : "bg-red-100 text-red-800 ring-1 ring-red-600/20"
            )}>
              {confidence}% Confidence
            </div>
          </div>

          {/* Detailed Report Section - Updated to match design */}
          <div className="mt-6 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Scan Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Analysis Date</span>
                    <span className="font-medium">{format(new Date(), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Result Status</span>
                    <span className={cn(
                      "font-medium",
                      isNormal ? "text-green-600" : "text-red-600"
                    )}>
                      {prediction}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Confidence Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model Confidence</span>
                    <span className="font-medium">{confidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Analysis Type</span>
                    <span className="font-medium">AI-Powered Detection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Probabilities Section - New section to show all classes */}
            {predictionResult.classProbs && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Classification Probabilities</h4>
                <div className="space-y-3">
                  {Object.entries(predictionResult.classProbs as Record<string, number>).map(([className, prob]) => (
                    <div key={className} className="flex justify-between text-sm">
                      <span className="text-gray-500">{className}</span>
                      <span className={cn(
                        "font-medium",
                        className === prediction ? "text-blue-600 font-bold" : ""
                      )}>
                        {(() => {
                          if (typeof prob === 'number') {
                            return `${(prob > 1 ? prob.toFixed(1) : (prob * 100).toFixed(1))}%`;
                          }
                          return `${String(prob)}%`;
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recommendations</h4>
              {isNormal ? (
                <p className="text-sm text-gray-600">
                  Your scan appears normal. However, if you experience any symptoms or concerns, 
                  please consult with a healthcare professional for further evaluation.
                </p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Based on the analysis, {isPneumonia ? "signs of pneumonia" : "lung opacity"} were detected. We recommend:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 pl-1 mb-4">
                    <li>Schedule a consultation with a healthcare professional</li>
                    <li>Monitor your symptoms closely</li>
                    <li>Follow up with additional tests if recommended</li>
                  </ul>
                  <Button
                    onClick={() => navigate('/consultation')}
                    className="mt-2 relative group overflow-hidden bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all duration-300 text-sm px-6 py-2.5 rounded-lg"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Schedule Consultation
                      <svg 
                        className="h-4 w-4 transform transition-all duration-300 group-hover:translate-x-1" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch recent X-ray results from appointments
  const fetchRecentAppointmentResults = async () => {
    setLoadingAppointmentResults(true);
    try {
      const appointments = await appointmentService.getAppointments();
      
      // Filter for completed appointments with x-ray results
      const completedAppointments = appointments.filter(app => 
        app.status === 'completed' && app.xray_result
      );
      
      if (completedAppointments.length > 0) {
        // Sort by date, most recent first
        const sortedAppointments = completedAppointments.sort((a, b) => 
          new Date(b.date_time || b.date).getTime() - new Date(a.date_time || a.date).getTime()
        );
        
        // Extract x-ray results and limit to 3 recent ones
        const results = sortedAppointments.slice(0, 3).map(app => ({
          id: app.id,
          appointment_id: app.id,
          date: app.date_time || app.date,
          image: app.xray_result.image,
          notes: app.xray_result.notes,
          result: app.xray_result.result || null,
          confidence_score: app.xray_result.confidence_score || null,
          status: app.xray_result.status || 'completed',
          assistant_name: app.assistant_name
        }));
        
        setRecentAppointmentResults(results);
      }
    } catch (error) {
      console.error('Error fetching appointment results:', error);
    } finally {
      setLoadingAppointmentResults(false);
    }
  };

  // Fetch X-ray images for this user
  const fetchUserXRays = async () => {
    setLoadingXRays(true);
    try {
      console.log("Fetching user X-rays...");
      console.log("Current user:", user); // Log the current user
      
      // Clear previous data to prevent showing cached images
      setUserXRays([]);
      
      // Fetch X-rays from the API
      const xrays = await xrayService.getUserXRays();
      console.log("User X-rays fetched:", xrays);
      
      if (!xrays || xrays.length === 0) {
        console.log("No X-rays found for this user");
        setUserXRays([]);
        return;
      }
      
      // Log the first X-ray object structure to understand the data format
      if (xrays.length > 0) {
        console.log("Sample X-ray object structure:", JSON.stringify(xrays[0], null, 2));
      }

      // Filter X-rays based on user role
      const filteredXrays = xrays.filter(xray => {
        // If user is not available yet, don't filter
        if (!user) {
          console.log("No user data available for filtering");
          return true;
        }
        
        // Log each X-ray and the filter decision
        const patientId = typeof xray.patient === 'object' ? xray.patient?.id : xray.patient;
        const assistantId = xray.assistant?.id;
        
        console.log(`X-ray ${xray.id}:`, {
          patientId,
          assistantId,
          userRole: user.role,
          userId: user.id
        });
        
        // Only show X-rays where the current user is the patient - regardless of role
        const match = Number(patientId) === Number(user.id);
        console.log(`Patient filter (${patientId} === ${user.id}): ${match}`);
        return match;
      });
      
      console.log(`Filtered ${xrays.length} X-rays to ${filteredXrays.length} based on user ID ${user?.id}`);
      
      // Process the X-rays to ensure valid data and add timestamps to image URLs
      const processedXrays = filteredXrays
        .filter(xray => {
          const valid = xray && xray.id && xray.image;
          if (!valid) {
            console.log("Filtering out invalid X-ray:", xray);
          }
          return valid;
        })
        .map(xray => {
          const timestamp = Date.now();
          
          // Add timestamp to image URL to prevent caching
          let imageUrl = xray.image;
          if (imageUrl) {
            imageUrl = imageUrl.includes('?') 
              ? `${imageUrl}&t=${timestamp}` 
              : `${imageUrl}?t=${timestamp}`;
          }
          
          return {
            ...xray,
            image: imageUrl,
            uniqueKey: `xray-${xray.id}-${timestamp}`
          };
        });
      
      console.log("Processed X-rays for display:", processedXrays);
      setUserXRays(processedXrays);
    } catch (error) {
      console.error('Error fetching X-ray images:', error);
      customToast.error('Unable to load X-ray images. Please try again later.');
      setUserXRays([]);
    } finally {
      setLoadingXRays(false);
    }
  };

  // Function to analyze user X-rays
  const analyzeUserXRay = async (xrayId: number | string) => {
    const numericId = typeof xrayId === 'string' ? parseInt(xrayId, 10) : xrayId;
    try {
      setAnalyzingXRay(true);
      setSelectedXRay({ id: numericId });
      
      // Try to get the X-ray image directly from the API
      try {
        const xrayResult = await xrayService.getXRayById(numericId);
        if (!xrayResult) {
          throw new Error('No X-ray result found');
        }
        
        console.log("Found X-ray result:", xrayResult);
        
        // Check if user has permission to access this X-ray
        if (user) {
          const patientId = typeof xrayResult.patient === 'object' ? xrayResult.patient?.id : xrayResult.patient;
          const assistantId = xrayResult.assistant?.id;
          
          const hasPermission = 
            user.role === 'admin' || 
            user.role === 'doctor' || 
            (user.role === 'patient' && patientId === user.id) || 
            (user.role === 'assistant' && assistantId === user.id);
          
          console.log(`Permission check for X-ray ${numericId}:`, {
            userRole: user.role,
            userId: user.id,
            patientId,
            assistantId,
            hasPermission
          });
          
          if (!hasPermission) {
            throw new Error('You do not have permission to view this X-ray');
          }
        }
        
        // Set the current appointment ID if it exists
        if (xrayResult.appointment) {
          setCurrentAppointmentId(xrayResult.appointment.toString());
        }
        
        // Ensure we have a valid image URL
        if (!xrayResult.image) {
          throw new Error('X-ray result has no image');
        }
        
        // Try to load the image securely
        const imageUrl = xrayResult.image;
        console.log("Attempting to fetch image from:", imageUrl);
        
        // Ensure the URL uses HTTPS
        let secureImageUrl = imageUrl;
        if (imageUrl.startsWith('http://')) {
          secureImageUrl = imageUrl.replace('http://', 'https://');
          console.log("Converted to HTTPS URL:", secureImageUrl);
        }
        
        try {
          // First try direct fetch with secure URL
          const response = await fetch(secureImageUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image directly: ${response.status}`);
          }
          
          const blob = await response.blob();
          const file = new File([blob], `xray-${numericId}.jpg`, { type: blob.type || 'image/jpeg' });
          
          // Submit for analysis
          await handleAnalyzeScan(file, 'quickscan');
        } catch (fetchError) {
          console.error("Direct fetch failed, trying proxy:", fetchError);
          
          // If direct fetch fails, try using backend proxy
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error("Authentication required");
          }
          
          const encodedUrl = encodeURIComponent(imageUrl);
          const proxyUrl = `${import.meta.env.DEV ? 'http://localhost:8000' : 'https://backends-production-d57e.up.railway.app'}/api/proxy-image/?url=${encodedUrl}`;
          
          console.log("Attempting proxy fetch from:", proxyUrl);
          const proxyResponse = await fetch(proxyUrl, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          if (!proxyResponse.ok) {
            throw new Error(`Proxy fetch failed: ${proxyResponse.status}`);
          }
          
          const proxyBlob = await proxyResponse.blob();
          const proxyFile = new File([proxyBlob], `xray-${numericId}.jpg`, { type: proxyBlob.type || 'image/jpeg' });
          
          // Submit for analysis
          await handleAnalyzeScan(proxyFile, 'quickscan');
        }
          
          // Scroll to the results section
          setTimeout(() => {
            const resultElement = document.getElementById('prediction-result-quickscan');
            if (resultElement) {
              resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
          
          return;
      } catch (error) {
        console.error("Error fetching X-ray by ID, will try appointment results instead:", error);
        
        // If X-ray fetching failed, try to get from appointment if we have an ID
        if (typeof xrayId === 'string' && xrayId.startsWith('appointment-')) {
          const appointmentId = xrayId.replace('appointment-', '');
          if (!appointmentId) {
            throw new Error('Invalid appointment ID format');
          }
          
          console.log(`Fetching details for appointment #${appointmentId}`);
          
          try {
            const appointment = await appointmentService.getAppointment(Number(appointmentId));
        if (appointment && appointment.xray_result && appointment.xray_result.image) {
          console.log("Found appointment with X-ray:", appointment);
          
              // Try to load the image
              const imageUrl = appointment.xray_result.image;
              
              // Ensure the URL uses HTTPS
              let secureImageUrl = imageUrl;
              if (imageUrl.startsWith('http://')) {
                secureImageUrl = imageUrl.replace('http://', 'https://');
            }
              
              try {
                // First try direct fetch with secure URL
                const response = await fetch(secureImageUrl);
                
            if (!response.ok) {
                  throw new Error(`Failed to fetch image: ${response.status}`);
            }
            
            const blob = await response.blob();
                const file = new File([blob], `xray-appointment-${appointmentId}.jpg`, { type: blob.type || 'image/jpeg' });
            
            // Submit for analysis
            await handleAnalyzeScan(file);
              } catch (fetchError) {
                console.error("Direct fetch failed for appointment image, trying proxy:", fetchError);
                
                // If direct fetch fails, try using backend proxy
                const token = localStorage.getItem('token');
                if (!token) {
                  throw new Error("Authentication required");
                }
                
                const encodedUrl = encodeURIComponent(imageUrl);
                const proxyUrl = `${import.meta.env.DEV ? 'http://localhost:8000' : 'https://backends-production-d57e.up.railway.app'}/api/proxy-image/?url=${encodedUrl}`;
                
                const proxyResponse = await fetch(proxyUrl, {
                  headers: {
                    'Authorization': `Token ${token}`
                  }
                });
                
                if (!proxyResponse.ok) {
                  throw new Error(`Proxy fetch failed: ${proxyResponse.status}`);
                }
                
                const proxyBlob = await proxyResponse.blob();
                const proxyFile = new File([proxyBlob], `xray-appointment-${appointmentId}.jpg`, { type: proxyBlob.type || 'image/jpeg' });
                
                // Submit for analysis
                await handleAnalyzeScan(proxyFile);
          }
              
              return;
        } else {
          throw new Error('No X-ray found in appointment');
            }
          } catch (appointmentError) {
            console.error(`Error fetching appointment #${appointmentId}:`, appointmentError);
            throw new Error(`Could not retrieve appointment data: ${appointmentError.message}`);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing user X-ray:", error);
      customToast.error("Failed to analyze X-ray. " + (error.message || "Please try again."));
    } finally {
      setAnalyzingXRay(false);
    }
  };
  
  // Helper function to handle analysis of a scan from a file
  const handleAnalyzeScan = async (file: File, targetTab: string = 'upload') => {
    if (!file) return;
    
    setIsPredicting(true);
    setPredictionResult(null);
    setSelectedFile(file);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First, send to prediction endpoint
      const predictionResponse = await api.post('/predict-scan/', getFormDataForFile(file), {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        },
      });

      // Process prediction result - handle different response formats
      let prediction, confidence, classProbs;
      
      // Handle API response based on available fields
      if (predictionResponse.data.diagnosis) {
        // Our new ML model response format
        prediction = predictionResponse.data.diagnosis;
        confidence = predictionResponse.data.confidence;
        classProbs = predictionResponse.data.class_probabilities;
      } else if (predictionResponse.data.prediction || predictionResponse.data.result) {
        // Legacy format
        prediction = predictionResponse.data.prediction || predictionResponse.data.result;
        confidence = predictionResponse.data.confidence || predictionResponse.data.probability;
      } else {
        throw new Error('Unexpected response format from ML service');
      }
      
      // Normalize prediction format (change Lung_Opacity to Lung Opacity)
      if (prediction === 'Lung_Opacity') {
        prediction = 'Lung Opacity';
      }
      
      // Ensure confidence is a number
      const numericConfidence = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
      
      setPredictionResult({
        prediction: prediction,
        confidence: numericConfidence,
        classProbs: classProbs
      });

      // Then save to scans if needed
      const scanFormData = getFormDataForFile(file);
      scanFormData.append('result', prediction);
      
      // Ensure confidence is stored consistently in decimal format (0-1 range)
      const normalizedConfidence = numericConfidence > 1 ? (numericConfidence / 100) : numericConfidence;
      scanFormData.append('confidence_score', normalizedConfidence.toString());
      scanFormData.append('status', 'completed');
      
      await api.post('/scans/', scanFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        },
      });

      customToast.success('X-ray analyzed successfully');
      fetchScans();
      fetchUserXRays();
      
      // If normal result, trigger celebration
      if (prediction === 'Normal') {
        triggerCelebration();
      }
      
      // Only change tab if we're intentionally requesting a different tab
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      
      // Scroll to the appropriate results section after a short delay
      setTimeout(() => {
        const resultElementId = targetTab === 'quickscan' ? 'prediction-result-quickscan' : 'prediction-result';
        const resultElement = document.getElementById(resultElementId);
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
    } catch (error) {
      console.error('Error processing scan:', error);
      if (error.message === 'Authentication token not found') {
        customToast.error('Please log in to analyze X-rays');
        navigate('/login');
      } else if (error.response?.status === 503) {
        customToast.error('ML service is not available. Please try again later.');
      } else if (error.response?.status === 504) {
        customToast.error('ML service request timed out. Please try again.');
      } else if (error.response?.data?.error) {
        customToast.error(`Error: ${error.response.data.error}`);
      } else {
        customToast.error('Failed to process X-ray. Please try again.');
      }
    } finally {
      setIsPredicting(false);
    }
  };
  
  // Helper function to create a FormData for a file
  const getFormDataForFile = (file: File): FormData => {
    const formData = new FormData();
    formData.append('image', file);
    return formData;
  };
  
  // Helper function to set currentAppointmentId
  const setCurrentAppointmentId = (id: string) => {
    // This is used to track which appointment is currently being viewed
    console.log("Setting current appointment ID:", id);
    // You can add state for this if needed
  };

  // Add a refresh function that can be called manually
  const refreshData = () => {
    console.log("Manually refreshing X-ray data");
    setUserXRays([]);
    setLoadingXRays(true);
    setCurrentXRayPage(1); // Reset to first page when refreshing
    
    // Use a short timeout to prevent rapid re-requests
    setTimeout(() => {
      fetchUserXRays();
    }, 300);
  };

  // Function to toggle image expansion
  const toggleImageExpansion = (xrayId: number | string) => {
    setExpandedImages(prev => ({
      ...prev,
      [xrayId.toString()]: !prev[xrayId.toString()]
    }));
  };
  
  // Function to open image in a dialog
  const openImageDialog = (id: number, imageUrl: string) => {
    setSelectedImageDialog({ id, url: imageUrl });
  };
  
  // Function to close the image dialog
  const closeImageDialog = () => {
    setSelectedImageDialog({ id: null, url: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scannerStyles }} />
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow w-full max-w-screen-xl mx-auto pt-6 pb-12">
          <Tabs 
            ref={tabsRef}
            defaultValue="quickscan" 
            value={activeTab}
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <div className="flex justify-center">
              <div className="inline-block">
                <TabsList className="w-auto inline-flex justify-center gap-2 sm:gap-8 p-2 px-4 bg-white rounded-t-lg shadow-sm border border-b-0 border-gray-100">
                  <TabsTrigger 
                    value="upload" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-3 sm:px-6 py-4
                      group transition-all duration-300 hover:text-cyan-500"
                  >
                    <div className="flex items-center gap-2">
                      <Upload size={18} className="transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:text-cyan-500" />
                      <span className="font-medium hidden data-[state=active]:inline sm:inline">Upload Scan</span>
                    </div>
                    <div className="absolute bottom-[6px] left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="quickscan" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-3 sm:px-6 py-4
                      group transition-all duration-300 hover:text-cyan-500"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-300 group-hover:scale-110"
                      >
                        <path d="M6 18h8"></path>
                        <path d="M3 22h18"></path>
                        <path d="M14 22a7 7 0 1 0 0-14h-1"></path>
                        <path d="M9 14h2"></path>
                        <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path>
                        <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"></path>
                      </svg>
                      <span className="font-medium hidden data-[state=active]:inline sm:inline">Quick Scan</span>
                    </div>
                    <div className="absolute bottom-[6px] left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-cyan-500 relative px-3 sm:px-6 py-4
                      group transition-all duration-300 hover:text-cyan-500"
                  >
                    <div className="flex items-center gap-2">
                      <History size={18} className="transition-transform duration-300 group-hover:scale-110 group-data-[state=active]:text-cyan-500" />
                      <span className="font-medium hidden data-[state=active]:inline sm:inline">Scan History</span>
                    </div>
                    <div className="absolute bottom-[6px] left-0 w-full h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
                  </TabsTrigger>
                </TabsList>
                <div className="border-b border-gray-200/50 w-full"></div>
              </div>
            </div>

            <TabsContent value="upload" className="p-6 sm:p-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-6 pb-12">
                  {isPremium ? (
                    <div>
                      <div className="text-center space-y-2 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="corner-bracket-container">
                      <div className="corner-bracket"></div>
                    </div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Upload New Scan
                          </h2>
                    <div className="corner-bracket-container">
                      <div className="corner-bracket"></div>
                    </div>
                  </div>
                      </div>
                      <div className="w-full max-w-2xl mx-auto mb-6">
                      <label 
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-[400px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden group",
                            isDragging ? "border-cyan-500 bg-cyan-50/10" : "border-cyan-400 hover:border-cyan-500",
                            isPredicting && "pointer-events-none opacity-50"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                          {/* Scanner animation elements */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Laser scanner effect with single line */}
                            <div className="laser-scan-animation"></div>
                            
                            {/* Grid pattern overlay */}
                            <div className="scan-grid"></div>
                            
                            {/* Tracking dots */}
                            <div className="scan-tracker scan-tracker-1"></div>
                            <div className="scan-tracker scan-tracker-2"></div>
                            <div className="scan-tracker scan-tracker-3"></div>
                            
                            {/* Corner scanner brackets - now appear only on hover */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                            
                            {/* Radial glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent glow-pulse-animation group-hover:from-cyan-500/20 transition-colors duration-300"></div>
                          </div>
                          
                          {isPredicting ? (
                            <div className="flex flex-col items-center justify-center gap-4">
                              <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                              <h3 className="text-xl font-medium text-cyan-500">
                                Analyzing Scan...
                              </h3>
                              <p className="text-sm text-gray-500">
                                Please wait while we process your scan
                              </p>
                        </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-4 z-10">
                              <div className="text-cyan-500">
                                <svg 
                                  width="48" 
                                  height="48" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 13v8"></path>
                                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                                  <path d="m8 17 4-4 4 4"></path>
                                </svg>
                          </div>
                              <h3 className="text-xl font-medium text-cyan-500">
                                Drag Image Here to Scan
                              </h3>
                              <p className="text-sm text-gray-500">
                                Supports JPG, PNG, DICOM
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="h-[1px] w-12 bg-cyan-300"></div>
                                <span className="text-sm text-cyan-500">OR</span>
                                <div className="h-[1px] w-12 bg-cyan-300"></div>
                          </div>
                              <Button 
                                variant="outline"
                                className="mt-2 bg-white hover:bg-gray-50 text-cyan-500 border-cyan-500 rounded-md px-6 transition-all duration-300 transform hover:scale-105"
                                onClick={() => {
                                  const input = fileInputRef.current;
                                  if (input) {
                                    input.click();
                                  }
                                }}
                              >
                                Browse Files
                              </Button>
                          </div>
                          )}
                        <input 
                            ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          accept="image/*,.dcm"
                          onChange={handleFileUpload}
                            disabled={isPredicting}
                        />
                      </label>
                    </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="blur-sm">
                        <div>
                          <div className="text-center space-y-2 mb-6">
                            <div className="flex items-center justify-center gap-2">
                              <div className="corner-bracket-container">
                                <div className="corner-bracket"></div>
                              </div>
                              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                Upload New Scan
                              </h2>
                              <div className="corner-bracket-container">
                                <div className="corner-bracket"></div>
                              </div>
                            </div>
                          </div>
                          <div className="w-full max-w-2xl mx-auto mb-6">
                            <label 
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-[400px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden group",
                                isDragging ? "border-cyan-500 bg-cyan-50/10" : "border-cyan-400 hover:border-cyan-500",
                                isPredicting && "pointer-events-none opacity-50"
                              )}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              {/* Scanner animation elements */}
                              <div className="absolute inset-0 pointer-events-none">
                                {/* Laser scanner effect with single line */}
                                <div className="laser-scan-animation"></div>
                                
                                {/* Grid pattern overlay */}
                                <div className="scan-grid"></div>
                                
                                {/* Tracking dots */}
                                <div className="scan-tracker scan-tracker-1"></div>
                                <div className="scan-tracker scan-tracker-2"></div>
                                <div className="scan-tracker scan-tracker-3"></div>
                                
                                {/* Corner scanner brackets - now appear only on hover */}
                                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                                
                                {/* Radial glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent glow-pulse-animation group-hover:from-cyan-500/20 transition-colors duration-300"></div>
                              </div>
                              
                              {isPredicting ? (
                                <div className="flex flex-col items-center justify-center gap-4">
                                  <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                                  <h3 className="text-xl font-medium text-cyan-500">
                                    Analyzing Scan...
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Please wait while we process your scan
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-4 z-10">
                                  <div className="text-cyan-500">
                                    <svg 
                                      width="48" 
                                      height="48" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <path d="M12 13v8"></path>
                                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                                      <path d="m8 17 4-4 4 4"></path>
                                    </svg>
                                  </div>
                                  <h3 className="text-xl font-medium text-cyan-500">
                                    Drag Image Here to Scan
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Supports JPG, PNG, DICOM
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <div className="h-[1px] w-12 bg-cyan-300"></div>
                                    <span className="text-sm text-cyan-500">OR</span>
                                    <div className="h-[1px] w-12 bg-cyan-300"></div>
                                  </div>
                                  <Button 
                                    variant="outline"
                                    className="mt-2 bg-white hover:bg-gray-50 text-cyan-500 border-cyan-500 rounded-md px-6 transition-all duration-300 transform hover:scale-105"
                                    onClick={() => {
                                      const input = fileInputRef.current;
                                      if (input) {
                                        input.click();
                                      }
                                    }}
                                  >
                                    Browse Files
                                  </Button>
                                </div>
                              )}
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*,.dcm"
                                onChange={handleFileUpload}
                                disabled={isPredicting}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-lg font-semibold">This feature is for premium users only.</p>
                          <Button 
                            onClick={() => navigate('/pricing')} 
                            className={cn("mt-2", chopperButton)}
                          >
                            Upgrade to Premium
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {renderPredictionResult()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quickscan" className="p-6 sm:p-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-6 pb-12">
                  <div className="text-center space-y-2 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <div className="corner-bracket-container">
                        <div className="corner-bracket"></div>
                      </div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Quick Scan Access
                      </h2>
                      <div className="corner-bracket-container">
                        <div className="corner-bracket"></div>
                      </div>
                    </div>
                  </div>

                  {/* Show prediction result in quickscan tab too */}
                  {predictionResult && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="prediction-result-quickscan">
                      <div className={cn(
                        "rounded-xl p-4 sm:p-6 border-2 transition-all duration-300",
                        predictionResult.prediction === 'Normal' 
                          ? "bg-green-50/80 border-green-200 shadow-lg shadow-green-100/50" 
                          : "bg-red-50/80 border-red-200 shadow-lg shadow-red-100/50"
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative">
                              {predictionResult.prediction === 'Normal' ? (
                                <div className="relative">
                                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
                                  <div className="absolute -inset-2 bg-green-400/20 rounded-full animate-pulse"></div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                                  <div className="absolute -inset-2 bg-red-400/20 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {predictionResult.prediction === 'Normal' ? "Normal Scan Result" : 
                                 predictionResult.prediction === 'Pneumonia' ? "Pneumonia Detected" : 
                                 "Lung Opacity Detected"}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {predictionResult.prediction === 'Normal' 
                                  ? "No signs of abnormality were detected in this scan." 
                                  : predictionResult.prediction === 'Pneumonia'
                                    ? "Signs of pneumonia were detected. Please consult with a healthcare professional."
                                    : "Lung opacity was detected. Please consult with a healthcare professional."}
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mt-1 sm:mt-0 self-start sm:self-auto",
                            predictionResult.prediction === 'Normal' 
                              ? "bg-green-100 text-green-800 ring-1 ring-green-600/20" 
                              : "bg-red-100 text-red-800 ring-1 ring-red-600/20"
                          )}>
                            {(() => {
                              // Safe string conversion
                              const confidenceValue = predictionResult.confidence;
                              if (typeof confidenceValue === 'number') {
                                return `${confidenceValue > 1 ? confidenceValue.toFixed(1) : (confidenceValue * 100).toFixed(1)}% Confidence`;
                              }
                              return `${String(confidenceValue)}% Confidence`;
                            })()}
                          </div>
                        </div>

                        {/* Detailed Report Section - Updated for better responsive design */}
                        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Scan Details</h4>
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className="text-gray-500">Analysis Date</span>
                                  <span className="font-medium">{format(new Date(), "MMMM d, yyyy")}</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className="text-gray-500">Result Status</span>
                                  <span className={cn(
                                    "font-medium",
                                    predictionResult.prediction === 'Normal' ? "text-green-600" : "text-red-600"
                                  )}>
                                    {predictionResult.prediction}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Confidence Metrics</h4>
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className="text-gray-500">Model Confidence</span>
                                  <span className="font-medium">
                                    {(() => {
                                      // Safe string conversion
                                      const confidenceValue = predictionResult.confidence;
                                      if (typeof confidenceValue === 'number') {
                                        return `${confidenceValue > 1 ? confidenceValue.toFixed(1) : (confidenceValue * 100).toFixed(1)}%`;
                                      }
                                      return `${String(confidenceValue)}%`;
                                    })()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className="text-gray-500">Analysis Type</span>
                                  <span className="font-medium">AI-Powered Detection</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Class Probabilities Section - New section for quickscan */}
                          {predictionResult.classProbs && (
                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Classification Probabilities</h4>
                              <div className="space-y-2 sm:space-y-3">
                                {Object.entries(predictionResult.classProbs as Record<string, number>).map(([className, prob]) => (
                                  <div key={className} className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-500">{className}</span>
                                    <span className={cn(
                                      "font-medium",
                                      className === predictionResult.prediction ? "text-blue-600 font-bold" : ""
                                    )}>
                                      {(() => {
                                        if (typeof prob === 'number') {
                                          return `${(prob > 1 ? prob.toFixed(1) : (prob * 100).toFixed(1))}%`;
                                        }
                                        return `${String(prob)}%`;
                                      })()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations Section */}
                          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Recommendations</h4>
                            {predictionResult.prediction === 'Normal' ? (
                              <p className="text-xs sm:text-sm text-gray-600">
                                Your scan appears normal. However, if you experience any symptoms or concerns, 
                                please consult with a healthcare professional for further evaluation.
                              </p>
                            ) : (
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                  Based on the analysis, {predictionResult.prediction === 'Pneumonia' ? "signs of pneumonia" : "lung opacity"} were detected. We recommend:
                                </p>
                                <ul className="list-disc list-inside space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-600 pl-1 mb-3 sm:mb-4">
                                  <li>Schedule a consultation with a healthcare professional</li>
                                  <li>Monitor your symptoms closely</li>
                                  <li>Follow up with additional tests if recommended</li>
                                </ul>
                                <Button
                                  onClick={() => navigate('/consultation')}
                                  className="mt-1 sm:mt-2 relative group overflow-hidden bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all duration-300 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg"
                                >
                                  <span className="relative z-10 flex items-center gap-2">
                                    Schedule Consultation
                                    <svg 
                                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform transition-all duration-300 group-hover:translate-x-1" 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="24" 
                                      height="24" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor"
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                  </span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONDITIONAL RENDERING BASED ON SCAN AVAILABILITY */}
                  {loadingAppointmentResults || loadingXRays ? (
                    // Loading state
                    <div className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-8 text-center">
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Loading your X-ray results...</h3>
                        <p className="text-sm text-gray-600 mt-2">Please wait while we retrieve your X-ray images</p>
                      </div>
                    </div>
                  ) : userXRays.length > 0 ? (
                    // When user HAS scan results
                    <div className="w-full max-w-2xl mx-auto">
                      {/* X-ray API Images Section */}
                      <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <h4 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-1.5 sm:gap-2">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-cyan-100 rounded-md flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-cyan-600"
                              >
                                <path d="M6 18h8"></path>
                                <path d="M3 22h18"></path>
                                <path d="M14 22a7 7 0 1 0 0-14h-1"></path>
                                <path d="M9 14h2"></path>
                                <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path>
                                <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"></path>
                              </svg>
                            </div>
                            Your X-ray Results
                            <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-0.5 rounded-full">
                              {userXRays.length} images
                            </span>
                          </h4>
                          <div className="flex items-center gap-2">
                            {/* Refresh button removed */}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                          {userXRays
                            .slice(
                              (currentXRayPage - 1) * xRayImagesPerPage,
                              currentXRayPage * xRayImagesPerPage
                            )
                            .map((xray, index) => (
                              <div className="flex justify-center" key={`container-${xray.id}`}>
                                <div 
                                  key={xray.uniqueKey || `xray-${xray.id}-${Date.now()}`} 
                                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/70 flex flex-col h-[320px] w-full max-w-[360px] animate-in fade-in-50 slide-in-from-bottom-5 duration-500 transform hover:-translate-y-1 active:translate-y-0 relative group card-container"
                                  style={{ animationDelay: `${index * 150}ms` }}
                                >
                                  {/* X-ray Image Section */}
                                  <div className="relative w-full pt-[56.25%]">
                                    {xray.image ? (
                                      <>
                                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50/50 to-white">
                                            <div className="flex flex-col items-center gap-3">
                                              {/* Removing the X-ray ID section */}
                                              
                                              <Button
                                                onClick={() => openImageDialog(xray.id, xray.image)}
                                                className="group bg-white hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 border border-gray-100 hover:border-cyan-300 h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-md"
                                              >
                                                <div className="flex flex-col items-center">
                                                  <Folder size={24} className="mb-1 group-hover:text-cyan-700 transition-colors duration-300" />
                                                  <span className="text-xs group-hover:text-cyan-700 transition-colors duration-300">View</span>
                                                </div>
                                              </Button>

                                              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600/80 hover:to-cyan-600/80 text-white shadow-sm hover:shadow-md text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105">
                                                <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  width="12" 
                                                  height="12" 
                                                  viewBox="0 0 24 24" 
                                                  fill="none" 
                                                  stroke="currentColor" 
                                                  strokeWidth="2" 
                                                  strokeLinecap="round" 
                                                  strokeLinejoin="round" 
                                                  className="text-white/90"
                                                >
                                                  <rect width="18" height="18" x="3" y="3" rx="2" />
                                                  <path d="M8 7v10" />
                                                  <path d="M16 7v10" />
                                                  <path d="M12 7v10" />
                                                </svg>
                                                <span>ID: {xray.id}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                          <circle cx="12" cy="13" r="3"></circle>
                                        </svg>
                                      </div>
                                    )}
                                    
                                    {/* Removing the overlay effect */}
                                    
                                    {/* Remove the ID Badge from top-right since we moved it below the button */}
                                  </div>

                                  {/* Content Section */}
                                  <div className="flex-1 flex flex-col p-5 justify-between">
                                    {/* Top section with date and type */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                                            X-ray
                                          </span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                          {format(new Date(xray.upload_date), "MMM d, yyyy")}
                                        </span>
                                      </div>
                                      
                                      {/* Doctor/Assistant info */}
                                      {xray.assistant?.first_name && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                          </svg>
                                          {xray.assistant.first_name} {xray.assistant.last_name}
                                        </p>
                                      )}
                                      
                                      {/* New attention-grabbing Notes button */}
                                      {xray.notes && (
                                        <div className="flex justify-start">
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                className="relative flex items-center gap-2 h-8 bg-gray-50 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 px-3 py-1 rounded-lg transition-all duration-300"
                                              >
                                                <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  width="16" 
                                                  height="16" 
                                                  viewBox="0 0 24 24" 
                                                  fill="none" 
                                                  stroke="currentColor" 
                                                  strokeWidth="2" 
                                                  strokeLinecap="round" 
                                                  strokeLinejoin="round" 
                                                  className="text-cyan-500 transition-colors duration-300"
                                                >
                                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                </svg>
                                                <span className="text-xs font-medium text-gray-600 hover:text-cyan-600 transition-colors duration-300">
                                                  View Doctor's Notes
                                                </span>
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md">
                                              <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-cyan-600">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                  </svg>
                                                  Doctor's Notes
                                                </DialogTitle>
                                                <DialogDescription>
                                                  Medical notes for X-ray ID: {xray.id}
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="bg-gray-50 p-4 rounded-lg mt-2 text-sm">
                                                {xray.notes}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-4 italic">
                                                Uploaded on {format(new Date(xray.upload_date), "MMMM d, yyyy")}
                                                {xray.assistant?.first_name && (
                                                  <span> by {xray.assistant.first_name} {xray.assistant.last_name}</span>
                                                )}
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Action button at the bottom */}
                                    <Button 
                                      onClick={() => analyzeUserXRay(xray.id.toString())}
                                      className="w-full relative hover-button overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-white hover:text-transparent hover:bg-clip-text hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all duration-300 text-sm py-2.5 rounded-lg hover:-translate-y-0.5 active:translate-y-0 font-medium border border-transparent hover:border-cyan-300 mt-4"
                                      disabled={analyzingXRay && selectedXRay?.id === xray.id}
                                    >
                                      <span className="relative z-10 flex items-center justify-center gap-2">
                                        {analyzingXRay && selectedXRay?.id === xray.id ? (
                                          <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing...
                                          </>
                                        ) : (
                                          <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white hover-button-icon transition-colors duration-300">
                                              <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z"></path>
                                              <path d="m3.09 8.84 12.35-6.61a1.93 1.93 0 0 1 1.81 0l3.65 1.9a2.12 2.12 0 0 1 .1 3.69L8.73 14.75a2 2 0 0 1-1.94 0L3 12.51a2.12 2.12 0 0 1 .09-3.67Z"></path>
                                              <line x1="12" y1="22" x2="12" y2="13"></line>
                                              <path d="M20 13.5v3.37a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13.5"></path>
                                            </svg>
                                            Quick Scan
                                            <svg 
                                              className="h-4 w-4 transform transition-all duration-300 hover-button-icon" 
                                              xmlns="http://www.w3.org/2000/svg" 
                                              width="24" 
                                              height="24" 
                                              viewBox="0 0 24 24" 
                                              fill="none" 
                                              stroke="currentColor"
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            >
                                              <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                          </>
                                        )}
                                      </span>
                                      <span className="absolute inset-0 h-full w-full scale-0 rounded-lg bg-white/20 transition-all duration-300 group-hover:scale-100"></span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Removing the inner pagination component since we have one at the bottom of the card */}
                      {userXRays.length > xRayImagesPerPage && (
                        <></>
                      )}
                    </div>
                  ) : (
                    <div className="w-full py-12 text-center">
                      <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <path d="M14 2v6h6"></path>
                          <path d="M12 18v-6"></path>
                          <path d="M9.5 15.5L12 18l2.5-2.5"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No X-ray Results Found</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        You don't have any X-ray results yet. Book an appointment with a healthcare provider to get an X-ray scan.
                      </p>
                      <div className="mt-6 flex justify-center space-x-3">
                        <Button
                          onClick={() => navigate('/appointment')}
                          className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-white hover:text-transparent hover:bg-clip-text hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all duration-300 text-sm px-8 py-2.5 rounded-lg hover:-translate-y-0.5 active:translate-y-0 font-medium border border-transparent hover:border-cyan-300"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="text-white group-hover:text-cyan-500 transition-colors duration-300"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                              <path d="M8 14h.01"></path>
                              <path d="M12 14h.01"></path>
                              <path d="M16 14h.01"></path>
                              <path d="M8 18h.01"></path>
                              <path d="M12 18h.01"></path>
                              <path d="M16 18h.01"></path>
                            </svg>
                            Book Appointment
                          </span>
                        </Button>
                        <Button
                          onClick={refreshData}
                          variant="outline"
                          className="border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                          disabled={loadingXRays}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Pagination - Moved completely outside the Card */}
              {userXRays.length > xRayImagesPerPage && (
                <div className="mt-4 flex justify-center">
                  <div className="relative w-full max-w-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-xl blur-xl -z-10 transform scale-105 opacity-60"></div>
                    <div className="pagination-Glass px-5 py-3 rounded-xl w-full flex items-center justify-between shadow-md backdrop-blur-sm bg-white/40 border border-white/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentXRayPage(page => Math.max(1, page - 1))}
                        disabled={currentXRayPage === 1}
                        className={cn(
                          "h-9 px-3 rounded-full transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1",
                          currentXRayPage === 1 && "pointer-events-none opacity-50"
                        )}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Previous</span>
                      </Button>
                      
                      <span className="text-sm font-medium text-gray-700">
                        Page {currentXRayPage} of {Math.ceil(userXRays.length / xRayImagesPerPage)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentXRayPage(page => Math.min(Math.ceil(userXRays.length / xRayImagesPerPage), page + 1))}
                        disabled={currentXRayPage === Math.ceil(userXRays.length / xRayImagesPerPage)}
                        className={cn(
                          "h-9 px-3 rounded-full transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1",
                          currentXRayPage === Math.ceil(userXRays.length / xRayImagesPerPage) && "pointer-events-none opacity-50"
                        )}
                      >
                        <span className="text-sm font-medium">Next</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-4 sm:p-6 md:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:justify-between sm:items-center bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200/60">
                  <div className="flex flex-col">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                      <span className="bg-cyan-50 p-1 sm:p-1.5 rounded-md inline-flex items-center justify-center">
                        <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-600" />
                      </span>
                      <span>Scan History</span>
                    </h2>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                      View and manage your previous scan analyses
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-1 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all text-[10px] xs:text-xs w-full sm:w-auto justify-between sm:justify-start h-7 sm:h-8 px-2 sm:px-2.5 py-0.5 sm:py-1">
                          {sortOption === 'newest' || sortOption === 'oldest' 
                            ? <History className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-cyan-500 flex-shrink-0" /> 
                            : <FilterX className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-cyan-500 flex-shrink-0" />}
                          <span className="text-gray-600 hidden xs:inline text-[10px] xs:text-xs">Sort by: </span>
                          <span className="font-medium text-cyan-600 truncate text-[10px] xs:text-xs">
                            {sortOption === 'newest' && 'Newest first'}
                            {sortOption === 'oldest' && 'Oldest first'}
                            {sortOption === 'highest-id' && 'ID (high to low)'}
                            {sortOption === 'lowest-id' && 'ID (low to high)'}
                          </span>
                          <SortDesc className="h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5 sm:ml-1 text-gray-400 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 sm:w-48 shadow-lg border border-gray-200 rounded-lg p-1 animate-in fade-in-80 zoom-in-95">
                        <DropdownMenuLabel className="text-[10px] sm:text-xs uppercase text-gray-500 tracking-wider">Sort Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md transition-colors ${sortOption === 'newest' ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSortChange('newest')}
                        >
                          <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                          Newest first
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md transition-colors ${sortOption === 'oldest' ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSortChange('oldest')}
                        >
                          <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" />
                          Oldest first
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md transition-colors ${sortOption === 'highest-id' ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSortChange('highest-id')}
                        >
                          <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                          ID (high to low)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-md transition-colors ${sortOption === 'lowest-id' ? 'bg-cyan-50 text-cyan-700 font-medium' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSortChange('lowest-id')}
                        >
                          <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" />
                          ID (low to high)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      onClick={() => navigateToTab('quickscan')}
                      className={cn(chopperButton, "min-w-0 w-full sm:w-auto h-7 sm:h-8 text-[10px] xs:text-xs")}
                    >
                      <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span className="truncate">New Scan</span>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-6">
                  {getCurrentPageScans().map((scan, index) => {
                    const isNormal = scan.result?.toLowerCase() === 'normal';
                    const confidence = scan.confidence_score ? (scan.confidence_score * 100).toFixed(1) : null;
                    
                    return (
                    <Card 
                      key={scan.id} 
                      className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm border border-gray-200/50 relative hover:border-cyan-200 hover:-translate-y-1 active:translate-y-0 rounded-xl"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Status indicator strip */}
                      <div className={cn(
                        "absolute top-0 left-0 w-1 sm:w-1.5 h-full group-hover:w-1.5 sm:group-hover:w-2 transition-all duration-300", 
                        isNormal ? "bg-green-500" : "bg-red-500"
                      )} />
                      
                      <CardContent className="p-0">
                        <div className="pl-3 sm:pl-5 pr-3 sm:pr-5 py-3 sm:py-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 md:gap-7 relative">
                          {/* Scan Image Preview */}
                          <div className="flex-shrink-0 w-full sm:w-24 md:w-32 h-24 sm:h-24 md:h-32 relative rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-md border border-gray-200/70 group-hover:shadow-lg transition-all duration-300">
                            {scan.image ? (
                              <img 
                                src={scan.image} 
                                alt={`Scan ${scan.id}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
                              </div>
                            )}
                          </div>

                          {/* Scan Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between mb-2 sm:mb-4 gap-1.5 sm:gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors duration-300">
                                    <span className="text-gray-500 group-hover:text-gray-400 transition-colors duration-300">ScanID:</span> {scan.id}
                                  </h3>
                                  <Badge className={cn(
                                    "px-1.5 sm:px-2 sm:px-2.5 py-0.5 text-[10px] xs:text-xs font-medium transition-all duration-300 group-hover:shadow-sm", 
                                    getStatusColor(scan.result),
                                    scan.result?.toLowerCase() === 'completed' && "group-hover:bg-green-200",
                                    scan.result?.toLowerCase() === 'processing' && "group-hover:bg-yellow-200",
                                    scan.result?.toLowerCase() === 'failed' && "group-hover:bg-red-200"
                                  )}>
                                    {scan.result}
                                  </Badge>
                                </div>
                                <p className="text-[10px] xs:text-xs sm:text-xs text-gray-500 mt-1 sm:mt-1.5 flex items-center gap-1 sm:gap-1.5 group-hover:text-gray-600 transition-colors duration-300">
                                  <span className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-500 group-hover:text-cyan-600 transition-colors duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                  </span>
                                  <span className="hidden xs:inline">{format(new Date(scan.upload_date), "MMMM d, yyyy 'at' h:mm a")}</span>
                                  <span className="inline xs:hidden">{format(new Date(scan.upload_date), "MMM d, yyyy")}</span>
                                </p>
                              </div>
                              
                              {/* Consultation button aligned with Scan ID */}
                              {!isNormal && scan.result && (
                                <Button
                                  onClick={() => navigate('/consultation')}
                                  className="consult-btn relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-600 hover:bg-white text-white hover:text-transparent hover:bg-clip-text hover:from-red-500 hover:to-rose-600 border border-transparent hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-300 text-[10px] xs:text-xs font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full hover:-translate-y-0.5 active:translate-y-0 mt-0 sm:mt-0.5"
                                >
                                  <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="consult-icon text-white transition-colors duration-300">
                                      <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1" />
                                      <path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3" />
                                    </svg>
                                    Consult Doctor
                                  </span>
                                </Button>
                              )}
                            </div>

                            {/* Result Card */}
                            {scan.result && (
                              <div className={cn(
                                "mt-2 sm:mt-3 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border transition-all duration-300 group-hover:shadow-md",
                                isNormal
                                  ? "bg-gradient-to-br from-green-50/80 to-green-50/50 border-green-200 group-hover:from-green-50/90 group-hover:to-green-50/70 group-hover:border-green-300"
                                  : "bg-gradient-to-br from-red-50/80 to-red-50/50 border-red-200 group-hover:from-red-50/90 group-hover:to-red-50/70 group-hover:border-red-300"
                              )}>
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                                  <div className="flex items-center gap-1.5 sm:gap-3">
                                    {isNormal ? (
                                      <div className="relative">
                                        <CheckCircle className={cn(
                                          "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 z-10 relative",
                                          isNormal ? "text-green-500 group-hover:text-green-600" : "text-red-500 group-hover:text-red-600",
                                          "transition-colors duration-300"
                                        )} />
                                        <div className="absolute -inset-1 bg-green-400/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-500 group-hover:text-red-600 transition-colors duration-300 z-10 relative" />
                                        <div className="absolute -inset-1 bg-red-400/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                      </div>
                                    )}
                                    <div>
                                      <p className={cn(
                                        "font-medium text-xs sm:text-sm md:text-base transition-colors duration-300",
                                        isNormal ? "text-green-700 group-hover:text-green-800" : "text-red-700 group-hover:text-red-800"
                                      )}>
                                        {isNormal ? "Normal Scan Result" : 
                                         scan.result === "Pneumonia" ? "Pneumonia Detected" : 
                                         scan.result === "Lung_Opacity" || scan.result === "Lung Opacity" ? "Lung Opacity Detected" : 
                                         "Abnormality Detected"}
                                      </p>
                                      <p className={cn(
                                        "text-[10px] xs:text-xs mt-0.5 sm:mt-1 transition-colors duration-300",
                                        isNormal ? "text-green-600 group-hover:text-green-700" : "text-red-600 group-hover:text-red-700"
                                      )}>
                                        {isNormal 
                                          ? "No signs of pneumonia were detected in this scan." 
                                          : scan.result === "Pneumonia"
                                            ? "Signs of pneumonia were detected. Please consult with a healthcare professional."
                                            : scan.result === "Lung_Opacity" || scan.result === "Lung Opacity" 
                                              ? "Lung opacity was detected. Please consult with a healthcare professional."
                                              : "Abnormality was detected. Please consult with a healthcare professional."}
                                      </p>
                                    </div>
                                  </div>
                                  {confidence && (
                                    <Badge className={cn(
                                      "text-xs px-3 py-1.5 transition-all duration-300 rounded-full flex items-center gap-1.5",
                                      isNormal 
                                        ? "bg-green-100 text-green-800 ring-1 ring-green-600/20 group-hover:bg-green-200 group-hover:ring-green-600/30" 
                                        : "bg-red-100 text-red-800 ring-1 ring-red-600/20 group-hover:bg-red-200 group-hover:ring-red-600/30"
                                    )}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isNormal ? "text-green-600" : "text-red-600"}>
                                        <path d="m12 14 4-4" />
                                        <path d="M12 14v7" />
                                        <path d="M12 14v-4a2 2 0 0 1 2-2c2.4 0 4.5 1.8 4.5 4a4.5 4.5 0 1 1-9 0" />
                                        <path d="M12 3v4" />
                                      </svg>
                                      {confidence}% Confidence
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Notes Section */}
                            {scan.notes && (
                              <div className="mt-3 sm:mt-4 bg-gradient-to-br from-gray-50/90 to-gray-50/60 rounded-xl p-4 border border-gray-200 group-hover:border-gray-300 group-hover:from-gray-50 group-hover:to-gray-50/80 transition-all duration-300 group-hover:shadow-sm">
                                <div className="flex items-center gap-2 text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="text-xs sm:text-sm font-medium">Doctor's Notes</span>
                                </div>
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 pl-5 sm:pl-6 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                                  {scan.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                  {filteredScans.length === 0 && (
                    <div className="text-center py-16 px-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Cloud className="h-10 w-10 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No scans yet</h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                        Get started by uploading your first scan for AI-powered analysis. Our system can detect pneumonia from chest X-rays with high accuracy.
                      </p>
                      <div className="mt-6">
                        <Button 
                          onClick={() => navigateToTab('quickscan')}
                          className={cn(chopperButton)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload First Scan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Pagination Component */}
                {filteredScans.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <div className="pagination-Glass px-3 py-2 rounded-xl w-auto inline-flex items-center gap-3 shadow-sm bg-cyan-50/50 border border-cyan-200/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScanPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={cn(
                          "h-9 w-9 p-0 rounded-full transition-all duration-300 hover:bg-white/60 hover:text-cyan-600 dark:hover:bg-slate-800/50",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      >
                        <ArrowLeft className="h-5 w-5 text-cyan-500" />
                        <span className="sr-only">Previous</span>
                      </Button>
                      
                      {/* Dynamic Page Numbers */}
                      {(() => {
                        const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
                        const pageNumbers = [];
                        const maxVisiblePages = 5; // Maximum visible page buttons
                        
                        let startPage = 1;
                        let endPage = totalPages;
                        
                        if (totalPages > maxVisiblePages) {
                          // Calculate start and end page numbers
                          const halfVisible = Math.floor(maxVisiblePages / 2);
                          
                          if (currentPage <= halfVisible + 1) {
                            // Near the start
                            endPage = maxVisiblePages;
                          } else if (currentPage >= totalPages - halfVisible) {
                            // Near the end
                            startPage = totalPages - maxVisiblePages + 1;
                          } else {
                            // In the middle
                            startPage = currentPage - halfVisible;
                            endPage = currentPage + halfVisible;
                          }
                        }
                        
                        // Add first page button if not visible
                        if (startPage > 1) {
                          pageNumbers.push(
                            <Button
                              key="first"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScanPageChange(1)}
                              className="h-8 w-8 p-0 rounded-full text-sm text-cyan-600 hover:bg-white/60 hover:text-cyan-700"
                            >
                              1
                            </Button>
                          );
                          
                          // Add ellipsis if needed
                          if (startPage > 2) {
                            pageNumbers.push(
                              <span key="ellipsis-1" className="text-cyan-500">
                                ...
                              </span>
                            );
                          }
                        }
                        
                        // Add page number buttons
                        for (let i = startPage; i <= endPage; i++) {
                          pageNumbers.push(
                            <Button
                              key={i}
                              variant={i === currentPage ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleScanPageChange(i)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-full text-sm",
                                i === currentPage 
                                  ? "bg-cyan-600 text-white hover:bg-cyan-700" 
                                  : "text-cyan-600 hover:bg-white/60 hover:text-cyan-700"
                              )}
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Add last page button if not visible
                        if (endPage < totalPages) {
                          // Add ellipsis if needed
                          if (endPage < totalPages - 1) {
                            pageNumbers.push(
                              <span key="ellipsis-2" className="text-cyan-500">
                                ...
                              </span>
                            );
                          }
                          
                          pageNumbers.push(
                            <Button
                              key="last"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScanPageChange(totalPages)}
                              className="h-8 w-8 p-0 rounded-full text-sm text-cyan-600 hover:bg-white/60 hover:text-cyan-700"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pageNumbers;
                      })()}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScanPageChange(currentPage + 1)}
                        disabled={currentPage === Math.ceil(filteredScans.length / itemsPerPage)}
                        className={cn(
                          "h-9 w-9 p-0 rounded-full transition-all duration-300 hover:bg-white/60 hover:text-cyan-600 dark:hover:bg-slate-800/50",
                          currentPage === Math.ceil(filteredScans.length / itemsPerPage) && "pointer-events-none opacity-50"
                        )}
                      >
                        <ArrowRight className="h-5 w-5 text-cyan-500" />
                        <span className="sr-only">Next</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
              </div>
      
      {/* Image Dialog */}
      <Dialog open={selectedImageDialog.id !== null} onOpenChange={(open) => !open && closeImageDialog()}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600">
              <FileText className="h-5 w-5" />
              X-ray Image - ID: {selectedImageDialog.id}
            </DialogTitle>
            <DialogDescription>
              X-ray scan details
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
            {selectedImageDialog.url && (
              <div className="relative pt-[75%]">
                <img 
                  src={selectedImageDialog.url} 
                  alt={`X-ray ID: ${selectedImageDialog.id}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/images/placeholder-xray.jpg';
                  }}
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Click outside or press ESC to close
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (selectedImageDialog.url) {
                    // Create a temporary anchor element
                    const a = document.createElement('a');
                    a.href = selectedImageDialog.url;
                    a.download = `xray-${selectedImageDialog.id}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-white hover:text-transparent hover:bg-clip-text hover:from-cyan-500 hover:to-blue-500 text-white hover:text-cyan-500 shadow-md transition-all duration-300 text-sm py-2 rounded-lg border border-transparent hover:border-cyan-400 hover:border-opacity-70 hover:shadow-lg flex items-center gap-1.5 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-4 w-4 transform transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </span>
                <span className="absolute inset-0 h-full w-full scale-0 rounded-lg bg-white/20 transition-all duration-300 group-hover:scale-100"></span>
              </Button>
              
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ScanPage;