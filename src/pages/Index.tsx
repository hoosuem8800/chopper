import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CloudUpload, Cpu, FileText, Check, Calendar, ClipboardCheck, ShieldCheck, Loader2, ExternalLink, Code, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api';

// Define interfaces for data from different APIs
interface UserProfile {
  id: number;
  user: number;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  subscription_type: string;
}

// Updated TeamMember interface to reflect what we get from the Creator API
interface Creator {
  id: number;
  user: number; // This is the foreign key to User
  job_title: string;
  role: string;
  contribution?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Composite interface that combines data from different sources
interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  job_title: string;
  role: string;
  contribution?: string;
  profile_picture?: string;
  is_active: boolean;
}

// Define interfaces for API responses
interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
}

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [apiDebugInfo, setApiDebugInfo] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const handleAuthProtectedAction = (e: React.MouseEvent, targetPath?: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
    } else if (targetPath) {
      navigate(targetPath);
    }
  };

  // Define the fallback team members data
  const fallbackTeamData: TeamMember[] = [
    {
      id: 1,
      first_name: "Hadjer",
      last_name: "Bechinia",
      email: "hadjer.bechinia@univ-constantine2.dz",
      job_title: "System Architect",
      role: "Backend Developer", 
      contribution: "Core API development and database design",
      is_active: true,
      profile_picture: "https://ui-avatars.com/api/?name=Hadjer+Bechinia&background=00C1D4&color=fff&size=256"
    },
    {
      id: 2,
      first_name: "Abderraouf",
      last_name: "Saadi",
      email: "abderraouf.saadi@univ-constantine2.dz",
      job_title: "ML Lead",
      role: "AI Specialist", 
      contribution: "Implemented machine learning detection algorithms",
      is_active: true,
      profile_picture: "https://ui-avatars.com/api/?name=Abderraouf+Saadi&background=00C1D4&color=fff&size=256"
    },
    {
      id: 3,
      first_name: "Houssem",
      last_name: "Abed",
      email: "houssem.abed@univ-constantine2.dz",
      job_title: "Project Lead",
      role: "Frontend Developer", 
      contribution: "UI/UX design and application framework",
      is_active: true,
      profile_picture: "https://ui-avatars.com/api/?name=Houssem+Abed&background=00C1D4&color=fff&size=256"
    }
  ];

  // Function to directly test the API connection
  const testApiConnection = async () => {
    setApiDebugInfo("Testing API connections...");
    setShowDebugInfo(true);
    
    let results = "API CONNECTION TEST RESULTS:\n\n";
    
    // Try with the default URL
    try {
      results += "Testing: /api/creators/\n";
      const response = await axios.get('/api/creators/');
      results += `SUCCESS - Status: ${response.status}\n`;
      results += `Data: ${JSON.stringify(response.data, null, 2).substring(0, 500)}...\n\n`;
    } catch (error) {
      results += `ERROR: ${error.message}\n\n`;
    }
    
    // Try with localhost:8000
    try {
      results += "Testing: http://localhost:8000/api/creators/\n";
      const response = await axios.get('http://localhost:8000/api/creators/');
      results += `SUCCESS - Status: ${response.status}\n`;
      results += `Data: ${JSON.stringify(response.data, null, 2).substring(0, 500)}...\n\n`;
    } catch (error) {
      results += `ERROR: ${error.message}\n\n`;
    }
    
    setApiDebugInfo(results);
  };

  // Fetch team members from the API
  useEffect(() => {
    const fetchTeamData = async () => {
      setLoadingTeam(true);
      try {
        console.log("Attempting to connect to API at:", `${API_BASE_URL}/creators/`);
        
        const response = await axios.get(`${API_BASE_URL}/creators/`, { 
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Response status:", response.status);
        
        if (response.status === 200 && response.data) {
          console.log("Successfully fetched creators data");
          console.log("Creators API raw response data:", response.data);
          
          // Process the response data and set team members
          if (Array.isArray(response.data) && response.data.length > 0) {
            const formattedTeamMembers = response.data.map(creator => ({
              id: creator.id,
              first_name: creator.first_name || '',
              last_name: creator.last_name || '',
              email: creator.email || '',
              phone_number: creator.phone_number || '',
              job_title: creator.job_title || '',
              role: creator.role || '',
              contribution: creator.contribution || '',
              profile_picture: creator.profile_picture || '',
              is_active: creator.is_active === undefined ? true : creator.is_active
            }));
            
            console.log("Formatted team members:", formattedTeamMembers);
            setTeamMembers(formattedTeamMembers);
          } else {
            // If no data or invalid format, use fallback data
            console.log("No valid team data found, using fallback data");
            setTeamMembers(fallbackTeamData);
          }
        }
      } catch (error) {
        console.error("Error fetching creators data:", error);
        // Use fallback data on error
        console.log("Error occurred, using fallback team data");
        setTeamMembers(fallbackTeamData);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamData();
  }, []);

  // Get appropriate icon for role
  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('backend') || roleLower.includes('system')) {
      return <Cpu className="w-4 h-4 mr-1" />;
    } else if (roleLower.includes('frontend') || roleLower.includes('ui')) {
      return <Code className="w-4 h-4 mr-1" />;
    } else if (roleLower.includes('ai') || roleLower.includes('ml')) {
      return <Zap className="w-4 h-4 mr-1" />;
    }
    return <ShieldCheck className="w-4 h-4 mr-1" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow mx-auto max-w-7xl w-full px-4 py-8">
        {/* Hero Section - More Compact */}
        <section className="neuroo-card-plus container my-8 py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full lg:w-1/2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 gradient-text">
                Early Chest Cancer Detection
              </h1>
              <p className="text-base md:text-lg text-gray-600 mb-8">
                Advanced AI analysis of chest x-rays and CT scans with 98.7% clinical accuracy
              </p>
              {isAuthenticated ? (
                <Link to="/scan">
                  <Button className="disappear-button px-8 py-5 text-base">
                    Let's Start
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="disappear-button px-8 py-5 text-base"
                  onClick={(e) => handleAuthProtectedAction(e)}
                >
                  Let's Start
                </Button>
              )}
            </div>
            
            <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
              <div className="scan-visual relative group homepage-scanner">
                <div className="scanner-bar"></div>
                
                {/* New elements for enhanced scanner */}
                <div className="scan-grid"></div>
                <div className="scan-tracker"></div>
                <div className="scan-tracker"></div>
                <div className="scan-tracker"></div>
                <div className="corner-bracket-top-left"></div>
                <div className="corner-bracket-top-right"></div>
                <div className="corner-bracket-bottom-left"></div>
                <div className="corner-bracket-bottom-right"></div>
                
                <div className="drag-drop-instructions absolute w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <CloudUpload className="w-16 h-16 text-primary mb-5 relative z-40" />
                  <h3 className="text-xl font-medium text-primary mb-3 relative z-40">Drag Image Here to Scan</h3>
                  <p className="text-sm text-gray-500 mb-4 relative z-40">Supports JPG, PNG, DICOM</p>
                  <div style={{
                    position: "relative",
                    color: "#00C1D4",
                    margin: "20px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    fontWeight: "bold",
                    zIndex: 40
                  }}>
                    <div style={{height: "1px", width: "60px", background: "rgba(0, 193, 212, 0.4)"}}></div>
                    OR
                    <div style={{height: "1px", width: "60px", background: "rgba(0, 193, 212, 0.4)"}}></div>
                  </div>
                  
                  {/* Replace inline button with Button component matching ScanPage.tsx */}
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white hover:bg-gray-50 text-[#00C1D4] border-[#00C1D4] rounded-md px-8 py-3 transition-all duration-300 transform group-hover:scale-105 z-40"
                    onClick={(e) => handleAuthProtectedAction(e, "/scan")}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works - More Compact */}
        <section className="container my-10 py-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 gradient-text">
            Simple 3-Step Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="neuro-card p-6 text-center h-full">
              <div className="step-number bg-primary mb-4">1</div>
              <CloudUpload className="w-16 h-16 mx-auto text-primary mb-4" />
              <h4 className="mb-3 text-lg">Upload Scan</h4>
              <p className="text-gray-600">
                Drag and drop or select your chest X-ray/CT scan in DICOM, JPG, or PNG format
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="neuro-card p-6 text-center h-full">
              <div className="step-number bg-primary mb-4">2</div>
              <Cpu className="w-16 h-16 mx-auto text-primary mb-4" />
              <h4 className="mb-3 text-lg">AI Analysis</h4>
              <p className="text-gray-600">
                Our deep learning model processes your scan using 132 clinical markers
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="neuro-card p-6 text-center h-full">
              <div className="step-number bg-primary mb-4">3</div>
              <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
              <h4 className="mb-3 text-lg">Get Results</h4>
              <p className="text-gray-600">
                Receive detailed report with risk assessment and recommended actions
              </p>
            </div>
          </div>
        </section>
        
        {/* Appointment Section - More Compact */}
        <section id="appointment" className="container my-10 py-6">
          <div className="neuro-card p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-2/3">
                <h2 className="text-xl md:text-2xl font-bold gradient-text mb-4">
                  Book Your First Scan Consultation
                </h2>
                <p className="text-base text-gray-600 mb-6">
                  Get personalized analysis from our oncology experts within 24 hours
                </p>
                <div className="flex items-center gap-6">
                  <Calendar className="w-12 h-12 text-primary" />
                  <div>
                    <h5 className="text-primary font-medium mb-2">Available Features:</h5>
                    <ul className="text-gray-600 space-y-2">
                      <li className="flex items-center"><Check className="w-5 h-5 mr-3 text-[#00C1D4]" />Priority scan analysis</li>
                      <li className="flex items-center"><Check className="w-5 h-5 mr-3 text-[#00C1D4]" />Direct doctor consultation</li>
                      <li className="flex items-center"><Check className="w-5 h-5 mr-3 text-[#00C1D4]" />Personalized health plan</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/3 text-center mt-6 lg:mt-0">
                <Link to="/appointment">
                  <Button className="disappear-button px-8 py-5 text-base bg-[#00C1D4] hover:bg-[#00C1D4]/90 text-white">
                    <Calendar className="mr-3 h-5 w-5" />Schedule Now
                  </Button>
                </Link>
                <p className="text-gray-500 text-sm mt-3">Available Mon-Sat: 8AM - 8PM EST</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Quality Section - More Compact */}
        <section className="container my-10 py-6">
          <div className="neuro-card p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2">
                <h2 className="text-xl md:text-2xl font-bold gradient-text mb-5">
                  Clinical Excellence
                </h2>
                <ul className="space-y-5">
                  <li>
                    <div className="flex items-start">
                      <ClipboardCheck className="w-6 h-6 text-primary mt-1 mr-3" />
                      <div>
                        <h5 className="font-medium mb-1 text-lg">NCCN Guidelines</h5>
                        <p className="text-gray-600">
                          Following National Comprehensive Cancer Network standards
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start">
                      <ShieldCheck className="w-6 h-6 text-primary mt-1 mr-3" />
                      <div>
                        <h5 className="font-medium mb-1 text-lg">Daily Quality Checks</h5>
                        <p className="text-gray-600">
                          Certified radiologist verification
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 mt-8 md:mt-0">
                <div className="relative flex items-center justify-center bg-gradient-to-br from-white to-gray-50 rounded-lg p-6 shadow-sm min-h-[250px]">
                  {/* All scanner effects removed from this section */}
                  
                  <div className="text-center z-10 relative">
                    <div className="text-5xl font-bold text-primary mb-2">98.7%</div>
                    <p className="text-gray-600 text-lg">
                      Clinical Accuracy<br />
                      <span className="text-sm">in validation trials</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Section - More Compact */}
        <section id="pricing" className="container my-10 py-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 gradient-text">
            Diagnostic Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="neuro-card p-8 text-center">
              <h3 className="text-xl text-gray-600 mb-4">Basic Scan</h3>
              <div className="text-5xl font-bold text-primary mb-4">Free</div>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />1 Scan/Month
                </li>
                <li className="flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />Basic Detection
                </li>
                <li className="flex items-center justify-center">
                  <span className="text-red-500 mr-3 text-xl">✕</span>Expert Review
                </li>
              </ul>
              <Button 
                className="disappear-button w-full py-3 bg-[#00C1D4] hover:bg-[#00C1D4]/90 text-white"
                onClick={(e) => handleAuthProtectedAction(e, "/scan")}
              >
                Start Free Analysis
              </Button>
            </div>
            <div className="neuro-card p-8 text-center">
              <h3 className="text-xl text-primary mb-4">Premium Care</h3>
              <div className="text-5xl font-bold text-primary mb-4">
                $49<span className="text-sm text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />Unlimited Scans
                </li>
                <li className="flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />Advanced Detection
                </li>
                <li className="flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />Expert Radiologist Review
                </li>
              </ul>
              <Button 
                className="disappear-button w-full py-3 bg-[#00C1D4] hover:bg-[#00C1D4]/90 text-white"
                onClick={(e) => handleAuthProtectedAction(e, isAuthenticated ? "/pricing" : undefined)}
              >
                Get Premium
              </Button>
            </div>
          </div>
        </section>
        
        {/* Team Section - Guaranteed to show team members */}
        <section id="team" className="container my-16 py-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The talented individuals behind our AI-powered chest cancer detection platform,
              combining expertise in medicine, artificial intelligence, and software development.
            </p>
            
          </div>
          
          {/* Debug information display */}
          {showDebugInfo && apiDebugInfo && (
            <div className="mb-8 p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">API Debug Information</h3>
                <button 
                  onClick={() => setShowDebugInfo(false)}
                  className="text-xs bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded"
                >
                  Close
                </button>
              </div>
              <pre className="text-xs overflow-auto max-h-64 p-2 bg-gray-800 text-gray-200 rounded">
                {apiDebugInfo}
              </pre>
            </div>
          )}
          
          {loadingTeam ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Loading our amazing team...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="neuro-card transform transition-all duration-300 hover:shadow-lg p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-[#00C1D4]/20 shadow-xl relative">
                      <img
                        src={member.profile_picture || `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=00C1D4&color=fff&size=256`}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.log(`Image load error for ${member.first_name} ${member.last_name}`, e);
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loops
                          target.src = `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=00C1D4&color=fff&size=256`;
                        }}
                      />
                      {/* Fallback display in case image fails */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-[#00C1D4] text-white text-xl font-bold opacity-0 hover:opacity-100 transition-opacity"
                        style={{ opacity: 0 }}
                        onError={() => { console.log("Fallback displayed"); return true; }}
                      >
                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {member.first_name} {member.last_name}
                    </h3>
                    
                    <div className="text-primary font-medium mb-2">
                      {member.job_title || "Team Member"}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>
                    
                    {member.contribution && (
                      <p className="text-gray-600 text-sm text-center italic border-t border-gray-100 pt-4 mt-2">
                        "{member.contribution}"
                      </p>
                    )}
                    
                    <a 
                      href={`mailto:${member.email}`} 
                      className="mt-4 w-full relative hover-button overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-white hover:text-transparent hover:bg-clip-text hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all duration-300 text-sm py-2.5 rounded-lg hover:-translate-y-0.5 active:translate-y-0 font-medium border border-transparent hover:border-cyan-300 flex items-center justify-center gap-2"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ExternalLink className="text-white hover-button-icon transition-colors duration-300" />
                        Contact
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
                      </span>
                      <span className="absolute inset-0 h-full w-full scale-0 rounded-lg bg-white/20 transition-all duration-300 group-hover:scale-100"></span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
