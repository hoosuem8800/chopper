import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle } from 'lucide-react';

// Define interfaces
interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  subscription_type?: string;
  location?: string;
  is_active?: boolean;
  [key: string]: any;
}

interface UserManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: User | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}

const UserManager: React.FC<UserManagerProps> = ({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  isAddMode
}) => {
  // State for password validation
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Update passwordsMatch when either password field changes
  useEffect(() => {
    if (isAddMode) {
      setPasswordsMatch(password === confirmPassword);
    }
  }, [password, confirmPassword, isAddMode]);

  // Custom form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // For add mode, check password match
    if (isAddMode && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // For user creation, we need special handling
    if (isAddMode) {
      try {
        // Create user data object for registration
        const userData = {
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
          confirm_password: formData.get('confirm_password'),
          first_name: formData.get('first_name') || '',
          last_name: formData.get('last_name') || '',
          role: formData.get('role') || 'patient',
          subscription_type: formData.get('subscription_type') || 'free',
          location: formData.get('location') || ''
        };
        
        // Call register endpoint directly
        const response = await api.post('/users/register/', userData);
        
        // Show success toast
        toast({
          title: "User Created",
          description: "New user has been created successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Close dialog and refresh
        onClose();
        
        // Force a refresh to show the new user in the list
        window.location.reload();
      } catch (error: any) {
        console.error('Error creating user:', error);
        
        let errorMessage = 'Failed to create user';
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else {
            // Check for field validation errors
            const fieldErrors = Object.entries(error.response.data)
              .filter(([key, value]) => Array.isArray(value))
              .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
              .join('; ');
            
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        }
        
        toast({
          title: "Error creating user",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      // For edit mode, we need to handle user updates properly
      try {
        if (!selectedItem || !selectedItem.id) {
          throw new Error("No user selected for editing");
        }
        
        // Create an object for the updated user data
        const userData: Record<string, any> = {
          username: formData.get('username'),
          email: formData.get('email'),
          first_name: formData.get('first_name') || '',
          last_name: formData.get('last_name') || '',
          role: formData.get('role') || 'patient',
          subscription_type: formData.get('subscription_type') || 'free',
          location: formData.get('location') || '',
          is_active: formData.get('is_active') === 'on'
        };
        
        // Only include password if it was provided
        const password = formData.get('password');
        if (password && String(password).trim() !== '') {
          userData.password = password;
        }
        
        // Use PATCH to update just the changed fields
        await api.patch(`/users/${selectedItem.id}/`, userData);
        
        // Show success toast
        toast({
          title: "User Updated",
          description: "User has been updated successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Close dialog and refresh
        onClose();
        
        // Force a refresh to show the updated user in the list
        window.location.reload();
      } catch (error: any) {
        console.error('Error updating user:', error);
        
        let errorMessage = 'Failed to update user';
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else {
            // Check for field validation errors
            const fieldErrors = Object.entries(error.response.data)
              .filter(([key, value]) => Array.isArray(value))
              .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
              .join('; ');
            
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        }
        
        toast({
          title: "Error updating user",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-cyan-200">
        <DialogHeader>
          <DialogTitle className="text-cyan-800">{isAddMode ? 'Add New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {isAddMode 
              ? 'Enter the information for the new user.' 
              : 'Update the user information below.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          id="user-form" 
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username*</label>
                <Input 
                  id="username" 
                  name="username"
                  defaultValue={isAddMode ? '' : (selectedItem?.username || '')}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email*</label>
                <Input 
                  id="email" 
                  name="email"
                  type="email"
                  defaultValue={isAddMode ? '' : (selectedItem?.email || '')}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password*</label>
                <Input 
                  id="password" 
                  name="password"
                  type="password"
                  placeholder={isAddMode ? "Enter password" : "Enter new password to change"}
                  required={isAddMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isAddMode && (
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password*</label>
                  <Input 
                    id="confirm_password" 
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={!passwordsMatch ? "border-red-500 focus:ring-red-200 focus:border-red-500" : ""}
                  />
                  {!passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
                <Input 
                  id="first_name" 
                  name="first_name"
                  defaultValue={isAddMode ? '' : (selectedItem?.first_name || '')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
                <Input 
                  id="last_name" 
                  name="last_name"
                  defaultValue={isAddMode ? '' : (selectedItem?.last_name || '')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role*</label>
                <Select name="role" defaultValue={isAddMode ? "patient" : (selectedItem?.role || "patient")} required>
                  <SelectTrigger 
                    id="role"
                    className="focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="border-cyan-100">
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="subscription_type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subscription Type</label>
                <Select name="subscription_type" defaultValue={isAddMode ? "free" : (selectedItem?.subscription_type || "free")}>
                  <SelectTrigger id="subscription_type">
                    <SelectValue placeholder="Select subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                <Input 
                  id="location" 
                  name="location"
                  defaultValue={isAddMode ? '' : (selectedItem?.location || '')}
                />
              </div>
              {!isAddMode && (
                <div className="space-y-2 flex items-center gap-2">
                  <Checkbox 
                    id="is_active" 
                    name="is_active"
                    defaultChecked={isAddMode ? true : (selectedItem?.is_active !== false)}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active</label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              type="button"
              className="transition-all duration-200 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="transition-all duration-200 hover:bg-cyan-700 bg-cyan-600"
              disabled={isAddMode && !passwordsMatch}
            >
              {isAddMode ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManager; 