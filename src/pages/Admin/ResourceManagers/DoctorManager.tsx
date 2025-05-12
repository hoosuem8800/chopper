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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

// Define interfaces
interface Doctor {
  id: number;
  user?: number | {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  specialty?: string;
  years_of_experience?: number;
  license_number?: string;
  gender?: string;
  consultation_fee?: number;
  bio?: string;
  [key: string]: any;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface DoctorManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: Doctor | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}

const DoctorManager: React.FC<DoctorManagerProps> = ({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  isAddMode
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    isAddMode ? '' : (selectedItem?.user && typeof selectedItem.user === 'object' 
      ? selectedItem.user.id.toString() 
      : selectedItem?.user?.toString() || '')
  );

  // Fetch users for dropdown
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    if (users.length > 0) return; // Don't fetch if we already have users
    
    setLoadingUsers(true);
    try {
      // Fetch all users
      const response = await api.get('/users/');
      let usersList: User[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        usersList = response.data.results;
      }
      
      if (isAddMode) {
        // For Add mode: Try to fetch all existing doctors to exclude them
        try {
          const doctorsResponse = await api.get('/doctors/');
          const existingDoctors: { user: number }[] = [];
          
          if (doctorsResponse.data && Array.isArray(doctorsResponse.data)) {
            existingDoctors.push(...doctorsResponse.data);
          } else if (doctorsResponse.data && doctorsResponse.data.results && Array.isArray(doctorsResponse.data.results)) {
            existingDoctors.push(...doctorsResponse.data.results);
          }
          
          // Extract the user IDs of existing doctors
          const existingDoctorUserIds = existingDoctors.map(doctor => {
            if (typeof doctor.user === 'number') {
              return doctor.user;
            } else if (doctor.user && typeof doctor.user === 'object' && doctor.user !== null) {
              // Check for id property with proper type assertion
              const userObj = doctor.user as { id: number };
              if ('id' in userObj) {
                return userObj.id;
              }
            }
            return null;
          }).filter(id => id !== null);
          
          // Filter to exclude users who already have doctor profiles
          const availableUsers = usersList.filter(user => !existingDoctorUserIds.includes(user.id));
          setUsers(availableUsers);
        } catch (error) {
          console.error('Error fetching doctors:', error);
          // If we can't get the doctors, just use all users
          setUsers(usersList);
        }
      } else {
        // For Edit mode: Just load all users since we're not changing the user anyway
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Ensure the user ID from the dropdown is included in the form data
    if (selectedUserId) {
      formData.set('user', selectedUserId);
    }
    
    try {
      // Create an object with the form data
      const doctorData: Record<string, any> = {
        user: parseInt(selectedUserId),
        specialty: formData.get('specialty'),
        license_number: formData.get('license_number'),
        years_of_experience: parseInt(formData.get('years_of_experience')?.toString() || '0'),
        gender: formData.get('gender') || null,
        consultation_fee: parseFloat(formData.get('consultation_fee')?.toString() || '0'),
        bio: formData.get('bio') || ''
      };

      // Handle optional numeric fields
      const ageValue = formData.get('age')?.toString();
      if (ageValue && ageValue.trim() !== '') {
        doctorData.age = parseInt(ageValue);
      }

      // Handle languages and education
      doctorData.languages = formData.get('languages') || '';
      doctorData.education = formData.get('education') || '';
      doctorData.awards = formData.get('awards') || '';
      doctorData.is_accepting_new_patients = true;
      
      let response;
      
      if (isAddMode) {
        // Create new doctor
        response = await api.post('/doctors/', doctorData);
        
        toast({
          title: "Doctor Created",
          description: "New doctor profile has been created successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        // Update existing doctor
        if (!selectedItem || !selectedItem.id) {
          throw new Error("No doctor selected for editing");
        }
        
        // Update doctor
        response = await api.patch(`/doctors/${selectedItem.id}/`, doctorData);
        
        toast({
          title: "Doctor Updated",
          description: "Doctor profile has been updated successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
      
      // Close dialog and refresh
      onClose();
      
      // Force a refresh to show the updated doctor in the list
      window.location.reload();
    } catch (error: any) {
      console.error('Error with doctor profile:', error);
      
      let errorMessage = isAddMode ? 'Failed to create doctor' : 'Failed to update doctor';
      
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
        title: isAddMode ? "Error creating doctor" : "Error updating doctor",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    } else if (user.username) {
      return `${user.username} (${user.email})`;
    } else {
      return user.email;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-cyan-200">
        <DialogHeader>
          <DialogTitle className="text-cyan-800">{isAddMode ? 'Add New Doctor' : 'Edit Doctor'}</DialogTitle>
          <DialogDescription>
            {isAddMode 
              ? 'Enter the information for the new doctor.' 
              : 'Update the doctor information below.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          id="doctor-form" 
          onSubmit={handleFormSubmit}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">User*</label>
                {isAddMode ? (
                  <Select 
                    name="user" 
                    value={selectedUserId} 
                    onValueChange={setSelectedUserId}
                    required
                  >
                    <SelectTrigger id="user" className="w-full">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingUsers ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading users...</span>
                        </div>
                      ) : users.length > 0 ? (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {getUserDisplayName(user)}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No users found</div>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  // For edit mode, show the input field since the user is already assigned
                  <Input 
                    id="user" 
                    name="user"
                    defaultValue={selectedItem?.user && typeof selectedItem.user === 'object' 
                      ? selectedItem.user.id.toString() 
                      : selectedItem?.user?.toString() || ''}
                    required
                    readOnly={!isAddMode}
                  />
                )}
                <p className="text-xs text-gray-500">
                  {isAddMode 
                    ? "Select the user to associate with this doctor profile" 
                    : "ID of existing user with doctor role"}
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="specialty" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Specialty*</label>
                <Select name="specialty" defaultValue={isAddMode ? "general" : (selectedItem?.specialty || "general")} required>
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="general">General Medicine</SelectItem>
                    <SelectItem value="pulmonology">Pulmonology</SelectItem>
                    <SelectItem value="radiology">Radiology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="years_of_experience" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Years of Experience</label>
                <Input 
                  id="years_of_experience" 
                  name="years_of_experience"
                  type="number"
                  defaultValue={isAddMode ? "0" : (selectedItem?.years_of_experience?.toString() || "0")}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="license_number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Number*</label>
                <Input 
                  id="license_number" 
                  name="license_number"
                  defaultValue={isAddMode ? '' : (selectedItem?.license_number || '')}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gender</label>
                <Select name="gender" defaultValue={isAddMode ? undefined : (selectedItem?.gender || undefined)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="consultation_fee" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Consultation Fee</label>
                <Input 
                  id="consultation_fee" 
                  name="consultation_fee"
                  type="number"
                  defaultValue={isAddMode ? "0" : (selectedItem?.consultation_fee?.toString() || "0")}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label htmlFor="bio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                <Input 
                  id="bio" 
                  name="bio"
                  defaultValue={isAddMode ? '' : (selectedItem?.bio || '')}
                />
              </div>
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
            >
              {isAddMode ? 'Add Doctor' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorManager; 