import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  User,
  Image,
  Calendar,
  MessageCircle,
  DollarSign,
  Bell,
  Stethoscope,
  Database,
  ArrowRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // API resources available for management
  const apiResources = [
    {
      name: 'Users',
      description: 'Manage user accounts, roles, and permissions',
      icon: <Users className="h-10 w-10 text-primary" />,
      path: '/admin/manage/users',
      color: 'bg-blue-50',
    },
    {
      name: 'Doctors',
      description: 'Manage doctor profiles and availability',
      icon: <Stethoscope className="h-10 w-10 text-emerald-600" />,
      path: '/admin/manage/doctors',
      color: 'bg-emerald-50',
    },
    {
      name: 'Patient Profiles',
      description: 'Manage patient profiles and information',
      icon: <User className="h-10 w-10 text-violet-600" />,
      path: '/admin/manage/profiles',
      color: 'bg-violet-50',
    },
    {
      name: 'Appointments',
      description: 'Manage scheduled appointments',
      icon: <Calendar className="h-10 w-10 text-red-600" />,
      path: '/admin/manage/appointments',
      color: 'bg-red-50',
    },
    {
      name: 'Consultations',
      description: 'Manage doctor-patient consultations',
      icon: <MessageCircle className="h-10 w-10 text-indigo-600" />,
      path: '/admin/manage/consultations',
      color: 'bg-indigo-50',
    },
    {
      name: 'Payments',
      description: 'Manage payment transactions and history',
      icon: <DollarSign className="h-10 w-10 text-green-600" />,
      path: '/admin/manage/payments',
      color: 'bg-green-50',
    },
  ];

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-10">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user.first_name || user.username}. Manage your application's data and services from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {apiResources.map((resource) => (
          <Card key={resource.path} className="overflow-hidden transition-all duration-300 hover:shadow-md max-w-sm">
            <CardHeader className={`${resource.color} pb-3`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{resource.name}</CardTitle>
                <div className="rounded-full p-2 bg-white/80 backdrop-blur-sm shadow-sm">
                  {resource.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <CardDescription className="text-gray-600 min-h-[60px]">
                {resource.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="ghost" className="gap-2 text-primary mb-4" asChild>
                <Link to={resource.path}>
                  Manage <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard; 