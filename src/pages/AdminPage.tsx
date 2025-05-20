import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Shield, 
  User, 
  Stethoscope, 
  Crown, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Filter,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import UserRoleManager from '@/components/UserRoleManager';
import { customToast } from '@/lib/toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'user' | 'premium';
  profile_picture?: string;
  phone_number?: string;
  address?: string;
  subscription_type?: 'free' | 'premium';
  subscription_end_date?: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      customToast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;
    
    const fieldA = a[sortField as keyof User];
    const fieldB = b[sortField as keyof User];
    
    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admin") return matchesSearch && user.role === "admin";
    if (activeTab === "doctor") return matchesSearch && user.role === "doctor";
    if (activeTab === "premium") return matchesSearch && user.subscription_type === "premium";
    if (activeTab === "free") return matchesSearch && (!user.subscription_type || user.subscription_type === "free");
    
    return matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'doctor':
        return <Stethoscope className="h-4 w-4 text-blue-500" />;
      case 'premium':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'doctor':
        return <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200"><Stethoscope className="h-3 w-3" /> Doctor</Badge>;
      case 'premium':
        return <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200"><Crown className="h-3 w-3" /> Premium</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" /> Standard</Badge>;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">User Management</h1>
        <p className="text-gray-600 mt-2">Manage user accounts, roles and subscriptions</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="doctor">Doctors</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="mb-8 overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer" 
                    onClick={() => handleSort('first_name')}
                  >
                    User
                    {sortField === 'first_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer" 
                    onClick={() => handleSort('email')}
                  >
                    Contact
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer" 
                    onClick={() => handleSort('role')}
                  >
                    Role
                    {sortField === 'role' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer" 
                    onClick={() => handleSort('subscription_type')}
                  >
                    Subscription
                    {sortField === 'subscription_type' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={userItem.profile_picture} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {userItem.first_name?.[0] || ''}{userItem.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.first_name} {userItem.last_name}
                        </div>
                        <div className="text-sm text-gray-500">@{userItem.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-400" /> {userItem.email}
                    </div>
                    {userItem.phone_number && (
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" /> {userItem.phone_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      {getRoleBadge(userItem.role)}
                      <UserRoleManager 
                        userId={userItem.id} 
                        currentRole={userItem.role}
                        onRoleChange={fetchUsers}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Crown className={`h-4 w-4 ${
                          userItem.subscription_type === 'premium' 
                            ? 'text-yellow-500' 
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-sm ${userItem.subscription_type === 'premium' ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                          {userItem.subscription_type ? userItem.subscription_type.charAt(0).toUpperCase() + userItem.subscription_type.slice(1) : 'Free'}
                        </span>
                      </div>
                      {userItem.subscription_end_date && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(userItem.subscription_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>View Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Send Email</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <Card className="py-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No users found</p>
            {searchTerm && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                <X className="mr-2 h-4 w-4" />
                Clear search
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="mt-4 text-right text-sm text-gray-500">
        Total users: {filteredUsers.length}
      </div>
    </div>
  );
};

export default AdminPage; 