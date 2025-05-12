import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const WelcomePremiumPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      navigate('/');
    }
    
    // Auto-redirect after 12 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 12000);
    
    // Trigger confetti celebration
    const duration = 6000;
    const end = Date.now() + duration;

    const runConfetti = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00C1D4', '#4A90E2', '#FFD700', '#f59e0b']
      });
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00C1D4', '#4A90E2', '#FFD700', '#f59e0b']
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary/10 filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-amber-500/10 filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-16 flex-grow flex flex-col items-center justify-center">
        <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-500 animate-fade-in">
          {/* Premium badge */}
          <div className="absolute -top-2 -right-2">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 text-white text-xs font-extrabold tracking-widest px-4 py-1.5 rounded-lg shadow-xl border border-amber-200 flex items-center transform translate-y-3 rotate-3">
              <span className="mr-1.5 bg-white/90 rounded-full p-0.5 flex items-center justify-center shadow-inner">
                <Crown className="h-3 w-3 text-amber-500" />
              </span>
              PREMIUM
            </div>
          </div>
          
          {/* Header section */}
          <div className="pt-20 pb-8 px-8 text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/4 w-20 h-20 bg-gradient-to-br from-primary to-amber-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <Crown className="h-10 w-10 text-white" />
        </div>
        
            <h1 className="text-3xl font-bold gradient-text mt-5 mb-3">Welcome to Premium!</h1>
            
            <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
              {user?.first_name ? `Congratulations ${user.first_name}! ` : 'Congratulations! '}
              Your premium subscription is now active with all exclusive features unlocked.
            </p>
        </div>
        
          {/* Divider */}
          <div className="w-full px-8">
            <div className="border-t border-gray-200"></div>
          </div>
          
          {/* Benefits section */}
          <div className="px-8 py-6">
            <h3 className="font-semibold text-primary mb-4 flex items-center text-lg">
              <span className="inline-block w-1.5 h-5 bg-primary mr-2 rounded-full"></span>
              Premium Benefits
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-start bg-gradient-to-r from-blue-50 to-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="bg-primary rounded-full p-1.5 mr-3 shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Unlimited AI Scans</p>
                  <p className="text-xs text-gray-600 mt-0.5">Enhanced accuracy detection</p>
                </div>
              </div>
              
              <div className="flex items-start bg-gradient-to-r from-amber-50 to-amber-100/30 p-3 rounded-lg border border-amber-200/20">
                <div className="bg-amber-500 rounded-full p-1.5 mr-3 shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Advanced Algorithms</p>
                  <p className="text-xs text-gray-600 mt-0.5">Medical-grade detection</p>
                </div>
              </div>
              
              <div className="flex items-start bg-gradient-to-r from-amber-50 to-amber-100/30 p-3 rounded-lg border border-amber-200/20">
                <div className="bg-amber-500 rounded-full p-1.5 mr-3 shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Expert Reviews</p>
                  <p className="text-xs text-gray-600 mt-0.5">Radiologist review in 24h</p>
                </div>
              </div>
              
              <div className="flex items-start bg-gradient-to-r from-blue-50 to-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="bg-primary rounded-full p-1.5 mr-3 shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Priority Support</p>
                  <p className="text-xs text-gray-600 mt-0.5">Fast-track appointments</p>
                </div>
              </div>
            </div>
        </div>
        
          {/* Call to action buttons */}
          <div className="p-8 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/scan')}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-medium py-2.5"
          >
                Start Premium Scan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/profile')}
                className="w-full border-primary text-primary hover:bg-primary/5"
          >
                View Premium Profile
          </Button>
        </div>
            
            {/* Automatic redirect notice */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Redirecting to home page in a few seconds...
            </p>
          </div>
      </div>
          </div>
    </div>
  );
};

export default WelcomePremiumPage; 