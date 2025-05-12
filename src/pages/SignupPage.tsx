import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Loader2, Eye, EyeOff, AlertCircle, User, Mail, Phone, MapPin, Lock, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, authService } from '@/services/api';
import { customToast } from '@/lib/toast';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Check if premium plan parameter is in URL
  const params = new URLSearchParams(location.search);
  const isPremium = params.get('plan') === 'premium';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    location: '',
    password: '',
    confirmPassword: '',
    profileImage: null as File | null,
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors.general;
        return newErrors;
      });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, profileImage: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form locally
    const newErrors: Record<string, string> = {};
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Create user data object for registration
      const userData = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'patient',
        subscription_type: isPremium ? 'premium' : 'free',
        profile: {
          phone_number: formData.phoneNumber || '',
          address: formData.location || ''
        }
      };
      
      console.log('Submitting registration with data:', userData);
      
      // Call register function
      await register(userData);
      
      // If registration successful and we have a profile picture, upload it separately
      if (formData.profileImage) {
        console.log('Registration successful, updating profile picture separately');
        // Here we would upload the profile picture, but we'll handle that later
        // This would require another API call to update the profile picture
      }
      
      // Show success message
      customToast.success('Account created successfully!');
      
      // Registration was successful
      navigate('/welcome');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log detailed error response for debugging
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      if (error.response?.data) {
        // Extract backend validation errors
        const backendErrors = error.response.data;
        const formattedErrors: Record<string, string> = {};
        
        // Map backend errors to form fields with improved messages
        if (backendErrors.username) formattedErrors.email = 'Username is already taken';
        if (backendErrors.email) formattedErrors.email = 'This email is already registered. Please use a different email or login to your account.';
        if (backendErrors.password) formattedErrors.password = backendErrors.password[0];
        if (backendErrors.non_field_errors) formattedErrors.general = backendErrors.non_field_errors[0];
        
        if (Object.keys(formattedErrors).length === 0) {
          formattedErrors.general = 'Registration failed. Please check your information and try again.';
        }
        
        setErrors(formattedErrors);
        customToast.error('Please correct the errors in the form');
      } else {
        // Generic error message
        setErrors({ general: 'Connection error. Please try again later.' });
        customToast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-10 flex items-center justify-center min-h-[calc(100vh-220px)]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8 animate-bounce-in">
          <h1 className="text-3xl font-bold text-gradient mb-2">Create Account</h1>
          <p className="text-gray-600">
            {isPremium 
              ? "Join our premium tier for advanced features and priority support"
              : "Join our community for personalized healthcare services"}
          </p>
        </div>
        
        <Card className="white-card border-none shadow-xl overflow-hidden animate-bounce-in" style={{animationDelay: '0.1s'}}>
          <CardHeader className="space-y-2 pb-0 pt-6">
            <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
            <CardDescription className="text-gray-500">
              {isPremium 
                ? "Complete your premium registration"
                : "Enter your details to get started"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start mb-2 animate-bounce-in" style={{animationDelay: '0.05s'}}>
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                  </div>
                  <Input 
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`pl-10 py-6 bg-white rounded-lg border ${errors.firstName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                  </div>
                  <Input 
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`pl-10 py-6 bg-white rounded-lg border ${errors.lastName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 py-6 bg-white rounded-lg border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone size={18} />
                </div>
                <Input 
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`pl-10 py-6 bg-white rounded-lg border ${errors.phoneNumber ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={18} />
                </div>
                <Input 
                  id="location"
                  name="location"
                  placeholder="Your Location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`pl-10 py-6 bg-white rounded-lg border ${errors.location ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <Input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 8 characters)"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 py-6 bg-white rounded-lg border ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 py-6 bg-white rounded-lg border ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary'} focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center animate-bounce-in" style={{animationDelay: '0.05s'}}>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              
              <div className="space-y-3 pt-1 mb-4">
                <Label className="text-gray-600 font-medium flex items-center">
                  <UserCircle size={18} className="mr-2 text-gray-400" />
                  Profile Picture (Optional)
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor="profileImage" 
                      className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors hover:border-primary/50 group"
                    >
                      <Upload className="h-5 w-5 mr-2 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Upload Profile Picture</span>
                      <Input 
                        id="profileImage" 
                        name="profileImage" 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-white text-white hover:text-primary py-6 transition-all duration-300 ease-in-out border border-transparent hover:border-primary hover:shadow-[0_0_15px_rgba(0,193,212,0.4)] transform hover:scale-[1.02] font-medium rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    `Create Account ${isPremium ? '(Premium)' : ''}`
                  )}
                </Button>
              </div>
              
              <div className="text-center text-gray-600 pb-2">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover hover:underline font-medium transition-colors">
                  Sign in instead
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
