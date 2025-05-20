import React, { useState, useEffect, useCallback } from 'react';
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
  is_accepting_new_patients?: boolean;
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

const DoctorManager: React.FC<DoctorManagerProps> = React.memo(({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  isAddMode
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    isAddMode ? '' : (selectedItem?.user && typeof selectedItem.user === 'object' 
      ? selectedItem.user.id.toString() 
      : selectedItem?.user?.toString() || '')
  );

  // Update selectedUserId when selectedItem changes
  useEffect(() => {
    if (!isAddMode && selectedItem) {
      setSelectedUserId(
        selectedItem.user && typeof selectedItem.user === 'object'
          ? selectedItem.user.id.toString()
          : selectedItem.user?.toString() || ''
      );
    }
  }, [isAddMode, selectedItem]);

  // Fetch users for dropdown
  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      // Only fetch users if not already loading and dialog is open
      if (loadingUsers || !isOpen) return;
      
      setLoadingUsers(true);
      try {
        // Fetch all users
        const response = await api.get('/users/');
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        let usersList: User[] = [];
        
        if (response.data && Array.isArray(response.data)) {
          usersList = response.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          usersList = response.data.results;
        }
        
        // Filter to users with doctor role
        const doctorUsers = usersList.filter(user => user.role === 'doctor');
        
        if (isAddMode) {
          try {
            // Get existing doctor profiles to exclude those users
            const doctorsResponse = await api.get('/doctors/');
            
            if (!isMounted) return;
            
            // Extract existing doctor user IDs
            const existingDoctorUserIds: number[] = [];
            const doctorsData = Array.isArray(doctorsResponse.data) 
              ? doctorsResponse.data 
              : (doctorsResponse.data?.results || []);
            
            doctorsData.forEach((doctor: any) => {
              if (typeof doctor.user === 'number') {
                existingDoctorUserIds.push(doctor.user);
              } else if (doctor.user && typeof doctor.user === 'object') {
                existingDoctorUserIds.push(doctor.user.id);
              }
            });
            
            // Filter out users who already have doctor profiles
            const availableDoctorUsers = doctorUsers.filter(
              user => !existingDoctorUserIds.includes(user.id)
            );
            
            if (isMounted) {
              setUsers(availableDoctorUsers);
              console.log(`Found ${availableDoctorUsers.length} available doctor users`);
            }
          } catch (error) {
            console.error('Error fetching doctors:', error);
            // Fallback to all doctor users if we can't filter
            if (isMounted) {
              setUsers(doctorUsers);
              console.log(`Fallback: Using all ${doctorUsers.length} doctor users`);
            }
          }
        } else {
          // For Edit mode, we don't need to filter
          if (isMounted) {
            setUsers(usersList);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load users list. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoadingUsers(false);
        }
      }
    };
    
    // Only load users when the dialog is open
    if (isOpen) {
      loadUsers();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, isAddMode]); // Only re-run when isOpen or isAddMode changes

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // Get form values
      const userId = formData.get('user')?.toString() || selectedUserId;
      const specialty = formData.get('specialty')?.toString() || 'general';
      const licenseNumber = formData.get('license_number')?.toString() || '';
      const yearsOfExperience = formData.get('years_of_experience')?.toString() || '0';
      const gender = formData.get('gender')?.toString() || '';
      const consultationFee = formData.get('consultation_fee')?.toString() || '0';
      const bio = formData.get('bio')?.toString() || '';
      
      // Validate required fields
      if (!userId) {
        toast({
          title: "Missing User",
          description: "Please select a user for this doctor profile",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!licenseNumber) {
        toast({
          title: "Missing License Number",
          description: "Please enter a license number",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (isAddMode) {
        // Create a new doctor
        try {
          // Log what we're about to do
          console.log('Attempting to create doctor with user ID:', userId);
          
          // Create doctor data with both user and user_id fields to ensure compatibility
          const doctorData = {
            user: parseInt(userId),
            user_id: parseInt(userId),
            specialty: specialty,
            license_number: `${licenseNumber}-${Date.now()}`
          };
          
          console.log('Creating doctor with data:', doctorData);
          
          // Make the API call
          const response = await api.post('/doctors/', doctorData);
          console.log('Doctor created successfully:', response.data);
          
          toast({
            title: "Success",
            description: "Doctor profile created successfully",
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800",
          });
          
          onClose();
          
          // Reload the page to show the new doctor
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error: any) {
          console.error('Error creating doctor:', error);
          
          // Log detailed error information
          if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
            console.error('Error data:', error.response.data);
            
            // If the response contains HTML (Django error page)
            if (typeof error.response.data === 'string' && error.response.data.includes('<html')) {
              // Try to extract the error message from the HTML
              const errorMatch = error.response.data.match(/<title>(.*?)<\/title>/);
              if (errorMatch && errorMatch[1]) {
                console.error('Extracted error from HTML:', errorMatch[1]);
              }
            }
          }
          
          let errorMessage = "Failed to create doctor profile";
          
          if (error.response?.data) {
            if (typeof error.response.data === 'string' && error.response.data.includes('IntegrityError')) {
              if (error.response.data.includes('license_number')) {
                errorMessage = "This license number is already in use";
              } else if (error.response.data.includes('user_id')) {
                errorMessage = "This user already has a doctor profile";
              }
            } else if (typeof error.response.data === 'object') {
              if (error.response.data.license_number) {
                errorMessage = Array.isArray(error.response.data.license_number)
                  ? error.response.data.license_number[0]
                  : error.response.data.license_number;
              } else if (error.response.data.user) {
                errorMessage = Array.isArray(error.response.data.user)
                  ? error.response.data.user[0]
                  : error.response.data.user;
              } else if (error.response.data.detail) {
                errorMessage = error.response.data.detail;
              }
            }
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        // Update existing doctor
        try {
          if (!selectedItem || !selectedItem.id) {
            throw new Error("No doctor selected for editing");
          }
          
          // Prepare update data
          const updateData = {
            specialty: specialty,
            license_number: licenseNumber,
            years_of_experience: parseInt(yearsOfExperience),
            consultation_fee: parseFloat(consultationFee),
            bio: bio || ' ',
            is_accepting_new_patients: true
          };
          
          // Only add gender if provided
          if (gender && gender !== '') {
            updateData['gender'] = gender;
          }
          
          // Update the doctor
          await api.patch(`/doctors/${selectedItem.id}/`, updateData);
          
          toast({
            title: "Success",
            description: "Doctor profile updated successfully",
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800",
          });
          
          onClose();
          
          // Reload the page to show the updated doctor
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error: any) {
          console.error('Error updating doctor:', error);
          
          let errorMessage = "Failed to update doctor profile";
          
          if (error.response?.data) {
            if (typeof error.response.data === 'object') {
              if (error.response.data.license_number) {
                errorMessage = Array.isArray(error.response.data.license_number)
                  ? error.response.data.license_number[0]
                  : error.response.data.license_number;
              } else if (error.response.data.detail) {
                errorMessage = error.response.data.detail;
              }
            }
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  // Memoize the onOpenChange handler to prevent unnecessary re-renders
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  }, [onClose, isSubmitting]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
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
                  <div className="relative">
                    <select
                      id="user"
                      name="user"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                      required
                    >
                      <option value="" disabled>Select a user</option>
                      {loadingUsers ? (
                        <option value="" disabled>Loading users...</option>
                      ) : users.length > 0 ? (
                        users.map(user => (
                          <option key={user.id} value={user.id.toString()}>
                            {getUserDisplayName(user)}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No users found</option>
                      )}
                    </select>
                    {loadingUsers && (
                      <div className="absolute inset-y-0 right-6 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
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
                <div className="relative">
                  <select
                    id="specialty"
                    name="specialty"
                    defaultValue={isAddMode ? "general" : (selectedItem?.specialty || "general")}
                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                    required
                  >
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="general">General Medicine</option>
                    <option value="pulmonology">Pulmonology</option>
                    <option value="radiology">Radiology</option>
                  </select>
                </div>
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
                <div className="relative">
                  <select
                    id="gender"
                    name="gender"
                    defaultValue={isAddMode ? "" : (selectedItem?.gender || "")}
                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="transition-all duration-200 hover:bg-cyan-700 bg-cyan-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isAddMode ? 'Adding...' : 'Saving...'}
                </>
              ) : (
                isAddMode ? 'Add Doctor' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default DoctorManager; 