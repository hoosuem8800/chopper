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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

/**
 * NOTE: The profile editing API in ManagementPage.tsx has been fixed!
 * The endpoint now correctly uses `/users/{userId}/profile/` for editing 
 * a specific user's profile instead of the generic `/users/profile/` endpoint 
 * which would default to editing the current admin's profile.
 * 
 * When issues occur:
 * 1. Make sure the user ID is correctly passed in the form data
 * 2. Check the browser console for the log message: "Updating profile for user ID: {userId}"
 * 3. Verify the API call is going to the correct endpoint with the right user ID
 */

// Define interfaces
interface Profile {
  id: number;
  username?: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  user?: number | {
    id: number;
    username?: string;
    email?: string;
  };
  user_data?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
  [key: string]: any;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: Profile | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  isAddMode
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch users for dropdown
  useEffect(() => {
    if (isOpen && isAddMode) {
      fetchUsers();
    }
  }, [isOpen, isAddMode]);

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
      
      // Try to fetch all existing profiles to exclude users who already have profiles
      try {
        const profilesResponse = await api.get('/profiles/');
        const existingProfiles: { user: number }[] = [];
        
        if (profilesResponse.data && Array.isArray(profilesResponse.data)) {
          existingProfiles.push(...profilesResponse.data);
        } else if (profilesResponse.data && profilesResponse.data.results && Array.isArray(profilesResponse.data.results)) {
          existingProfiles.push(...profilesResponse.data.results);
        }
        
        // Extract the user IDs of existing profiles
        const existingProfileUserIds = existingProfiles.map(profile => {
          if (typeof profile.user === 'number') {
            return profile.user;
          } else if (profile.user && typeof profile.user === 'object' && profile.user !== null) {
            // Check for id property with proper type assertion
            const userObj = profile.user as { id: number };
            if ('id' in userObj) {
              return userObj.id;
            }
          }
          return null;
        }).filter(id => id !== null);
        
        // Filter to exclude users who already have profiles
        const availableUsers = usersList.filter(user => !existingProfileUserIds.includes(user.id));
        setUsers(availableUsers);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // If we can't get the profiles, just use all users
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
    
    // Add debug logging to see what's being submitted
    console.log('ProfileManager: Form submission for', isAddMode ? 'ADD MODE' : 'EDIT MODE');
    console.log('ProfileManager: Selected item:', selectedItem);
    
    try {
      // For add mode, ensure we have a user ID
      if (isAddMode) {
        if (!selectedUserId) {
          toast({
            title: "Error",
            description: "Please select a user",
            variant: "destructive",
          });
          return;
        }
        
        // Create profile data for the API
        const profileData = new FormData();
        profileData.append('user', selectedUserId);
        profileData.append('phone_number', formData.get('phone_number') || '');
        profileData.append('address', formData.get('address') || '');
        
        // Handle profile picture upload if provided
        const profilePicture = formData.get('profile_picture');
        if (profilePicture instanceof File && profilePicture.size > 0) {
          profileData.append('profile_picture', profilePicture);
        }
        
        // Create the profile
        const response = await api.post('/profiles/', profileData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast({
          title: "Profile Created",
          description: "User profile has been created successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Close dialog and refresh
        onClose();
        window.location.reload();
      } 
      // Edit mode
      else {
        // For edit mode, get the user ID from the selectedItem
        if (!selectedItem || !selectedItem.id) {
          throw new Error("No profile selected for editing");
        }
        
        // Extract user ID - critical for directing the patch to the right profile
        let userId;
        
        // Add debugging to see the exact structure of the selected item
        console.log('Profile data structure:', selectedItem);
        
        // The API now returns user_data field in the profile data
        if (selectedItem.user_data) {
          // Handle the case where user_data contains the actual user information
          userId = selectedItem.user_data.id;
          console.log('Extracted user ID from user_data:', userId);
        }
        else if (selectedItem.user) {
          // Original case: user is in a separate property
          console.log('User data structure:', selectedItem.user);
          
          if (typeof selectedItem.user === 'object') {
            // Handle the case where user is an object with id property
            userId = selectedItem.user?.id;
            console.log('Extracted user ID from object:', userId);
          } else if (typeof selectedItem.user === 'number') {
            // Handle the case where user is directly a number
            userId = selectedItem.user;
            console.log('User ID is already a number:', userId);
          } else {
            // Handle the case where user is a string that might be a number
            console.log('User is a string or other type:', selectedItem.user);
            const parsedId = parseInt(String(selectedItem.user), 10);
            if (!isNaN(parsedId)) {
              userId = parsedId;
              console.log('Parsed user ID from string/other:', userId);
            }
          }
        } else if (selectedItem.user_id) {
          // Alternative case: user_id property instead of user
          userId = typeof selectedItem.user_id === 'number' ? 
            selectedItem.user_id : 
            parseInt(String(selectedItem.user_id), 10);
          console.log('Using user_id as fallback:', userId);
        } else if (selectedItem.id) {
          // Last resort: use the profile ID as a fallback
          // This isn't ideal but might work depending on the API
          userId = selectedItem.id;
          console.log('Using profile ID as fallback:', userId);
        }
        
        if (!userId) {
          console.error('User data structure issue. Selected item:', selectedItem);
          throw new Error("Cannot determine user ID for this profile");
        }
        
        // Create profile data for the API
        const profileData = new FormData();
        profileData.append('phone_number', formData.get('phone_number') || '');
        profileData.append('address', formData.get('address') || '');
        
        // Handle profile picture upload if provided
        const profilePicture = formData.get('profile_picture');
        if (profilePicture instanceof File && profilePicture.size > 0) {
          profileData.append('profile_picture', profilePicture);
        }
        
        // Update the profile
        console.log(`Updating profile for user ID: ${userId}, profile ID: ${selectedItem.id}`);
        
        const response = await api.patch(`/profiles/${selectedItem.id}/`, profileData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        toast({
          title: "Profile Updated",
          description: "User profile has been updated successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
        
        // Close dialog and refresh
        onClose();
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error with profile operation:', error);
      
      let errorMessage = isAddMode ? 'Failed to create profile' : 'Failed to update profile';
      
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
        title: isAddMode ? "Error creating profile" : "Error updating profile",
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
          <DialogTitle className="text-cyan-800">{isAddMode ? 'Add New Profile' : 'Edit Profile'}</DialogTitle>
          <DialogDescription>
            {isAddMode 
              ? 'Enter the information for the new user profile.' 
              : 'Update the user profile information below.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          id="profile-form" 
          onSubmit={handleFormSubmit}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isAddMode && selectedItem && (
                <>
                  {/* Hidden field for profile ID */}
                  <input 
                    type="hidden" 
                    name="id" 
                    value={selectedItem.id} 
                  />
                  
                  <div className="space-y-2">
                    <label htmlFor="display_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">User ID</label>
                    <Input 
                      id="display_id" 
                      defaultValue={selectedItem?.id}
                      disabled
                      readOnly
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                    <Input 
                      id="username" 
                      name="username"
                      defaultValue={selectedItem?.user_data?.username || selectedItem?.username || ''}
                      disabled
                    />
                  </div>
                  
                  {/* Add email display */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                    <Input 
                      id="email" 
                      name="email"
                      defaultValue={selectedItem?.user_data?.email || ''}
                      disabled
                    />
                  </div>
                </>
              )}
              
              {isAddMode && (
                <div className="space-y-2 col-span-2">
                  <label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">User*</label>
                  <Select 
                    name="user" 
                    value={selectedUserId} 
                    onValueChange={setSelectedUserId}
                    required
                  >
                    <SelectTrigger id="user" className="w-full">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
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
                        <div className="p-2 text-sm text-gray-500">No users available without profiles</div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Select a user to create a profile for</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone number</label>
                <Input 
                  id="phone_number" 
                  name="phone_number"
                  defaultValue={isAddMode ? '' : (selectedItem?.phone_number || '')}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Address</label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={isAddMode ? '' : (selectedItem?.address || '')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-500 focus:ring focus:ring-cyan-200 transition-all duration-200"
                ></Textarea>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="profile_picture" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Profile picture</label>
                <Input 
                  id="profile_picture" 
                  name="profile_picture"
                  type="file"
                  accept="image/*"
                />
                {!isAddMode && selectedItem?.profile_picture && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Current profile picture:</p>
                    <a 
                      href={typeof selectedItem.profile_picture === 'string' ? selectedItem.profile_picture : '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyan-600 hover:text-cyan-800 hover:underline transition-colors duration-200"
                    >
                      View current image
                    </a>
                  </div>
                )}
                {!isAddMode && (
                  <p className="text-xs text-gray-500">Leave empty to keep current profile picture</p>
                )}
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
              {isAddMode ? 'Add Profile' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileManager; 