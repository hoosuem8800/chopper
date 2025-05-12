import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const WelcomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      navigate('/');
    }
    
    // Auto-redirect after 8 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 8000);
    
    // Trigger confetti celebration
    const duration = 4000;
    const end = Date.now() + duration;

    const runConfetti = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00C1D4', '#4A90E2', '#10b981', '#FFD700']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00C1D4', '#4A90E2', '#10b981', '#FFD700']
      });
    };

    // Run initial confetti
    runConfetti();

    // Schedule confetti animation
    const interval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      runConfetti();
    }, 150);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="container mx-auto px-4 py-16 flex-grow flex flex-col items-center justify-center">
        <div className="relative neuro-card p-8 max-w-md w-full text-center mx-4 animate-scale-up" style={{ animationDuration: '0.6s' }}>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-pulse-slow" style={{ animationDuration: '3s' }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-10 w-10 text-primary"
              >
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold gradient-text mb-3">Welcome to Chopper!</h1>
          
          <p className="text-gray-600 mb-6">
            {user?.first_name ? `Hello ${user.first_name}! ` : ''}
            You have successfully logged in to your account. You can now access all our features and services.
          </p>
          
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl">
              <h3 className="font-medium text-primary mb-2">What you can do now:</h3>
              <ul className="space-y-2 text-left">
                <li className="flex items-start">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5 text-primary mr-2 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  <span>Upload and analyze medical scans</span>
                </li>
                <li className="flex items-start">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5 text-primary mr-2 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  <span>Book appointments with specialists</span>
                </li>
                <li className="flex items-start">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5 text-primary mr-2 mt-0.5"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  <span>Manage your health profile</span>
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={() => navigate('/')} 
              className="w-full disappear-button"
            >
              Go to Home Page <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage; 