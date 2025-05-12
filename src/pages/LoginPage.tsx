import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { customToast } from '@/lib/toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });
    
    try {
      await login(formData.email, formData.password);
      
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      navigate('/welcome');
    } catch (error: any) {
      console.error('Login error details:', error);
      
      if (error.response?.status === 401) {
        setErrors({ email: '', password: 'Incorrect password. Please check and try again.', general: '' });
      } else if (error.response?.data?.detail?.includes('user not found')) {
        setErrors({ email: 'Email not registered. Please check or create an account.', password: '', general: '' });
      } else if (error.response?.data?.detail) {
        setErrors({ email: '', password: '', general: error.response.data.detail });
      } else {
        setErrors({ email: '', password: '', general: 'Connection error. Please try again later.' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-10 flex items-center justify-center min-h-[calc(100vh-220px)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-bounce-in">
          <h1 className="text-3xl font-bold text-gradient mb-2">Welcome back</h1>
          <p className="text-gray-600">We're glad to see you again</p>
        </div>
        
        <Card className="white-card border-none shadow-xl overflow-hidden animate-bounce-in" style={{animationDelay: '0.1s'}}>
          <CardHeader className="space-y-2 pb-0 pt-6">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-gray-500">
              Access your personal dashboard
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
                
              <div className="space-y-5">
                  <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
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
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </div>
                    <Input 
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                    placeholder="Password"
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
                </div>
                
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal text-gray-600">
                    Remember me
                  </Label>
                </div>
                
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-hover hover:underline transition-colors">
                  Forgot password?
                </Link>
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
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
              
              <div className="relative py-3 text-center">
                <div className="or-divider">OR</div>
              </div>
                
              <div className="text-center text-gray-600 pb-2">
                  Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary-hover hover:underline font-medium transition-colors">
                  Create account
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default LoginPage;
