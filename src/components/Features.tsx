
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Bell, Calendar, Brain, ShieldCheck, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <UserCircle className="h-10 w-10 text-primary" />,
      title: "User Account Management",
      description: "Easily set up and modify your profile information, change passwords, and manage your personal details in a secure environment.",
    },
    {
      icon: <Bell className="h-10 w-10 text-primary" />,
      title: "Active Notifications",
      description: "Stay updated with appointment reminders, feature updates, and important alerts via email or in-app notifications.",
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Appointment Booking",
      description: "Schedule, reschedule, or cancel appointments seamlessly with our intuitive booking system.",
    },
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: "AI Scanning Models",
      description: "Access both Free and Premium AI-powered scanning models for comprehensive health insights.",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Secure Health Data",
      description: "Your health information is protected with enterprise-grade security and encryption protocols.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Fast Results",
      description: "Get quick and accurate scanning results powered by our advanced AI technology.",
    }
  ];

  return (
    <section className="py-16 bg-gray-50" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">User Features Overview</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover how MedScan AI empowers you to take control of your health with advanced features and intuitive tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-lg card-hover">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
