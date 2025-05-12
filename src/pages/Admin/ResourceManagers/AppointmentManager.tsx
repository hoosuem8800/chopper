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
import { Loader2, CalendarIcon } from 'lucide-react';
import { Appointment, User } from './types';

interface AppointmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: Appointment | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({
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
  const [selectedDate, setSelectedDate] = useState<string>(
    isAddMode ? new Date().toISOString().split('T')[0] : 
    selectedItem?.date_time ? new Date(selectedItem.date_time).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    isAddMode ? '09:00' : 
    selectedItem?.date_time ? new Date(selectedItem.date_time).toTimeString().slice(0, 5) : 
    '09:00'
  );
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  // Available time slots
  const TIME_SLOTS = [
    "09:00", "10:00", "11:00", 
    "14:00", "15:00", "16:00"
  ];

  // Status options
  const STATUS_OPTIONS = [
    { value: "scheduled", label: "Scheduled" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ];

  // Fetch users and taken slots when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (selectedDate) {
        fetchTakenSlots(selectedDate);
      }
    }
  }, [isOpen, selectedDate]);

  // Fetch users for dropdown
  const fetchUsers = async () => {
    if (users.length > 0) return; // Don't fetch if we already have users
    
    setLoadingUsers(true);
    try {
      const response = await api.get('/users/');
      let usersList: User[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        usersList = response.data.results;
      }
      
      setUsers(usersList);
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

  // Fetch taken time slots for a specific date
  const fetchTakenSlots = async (date: string) => {
    if (!date) return;
    
    try {
      const response = await api.get(`/appointments/taken-slots/?date=${date}`);
      const newTakenSlots = response.data?.taken_slots || [];
      setTakenSlots(newTakenSlots);
      console.log('Taken slots for date', date, ':', newTakenSlots);
    } catch (error) {
      console.error('Error fetching taken slots:', error);
      // If API doesn't support taken slots yet, just continue
    }
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add date and time as separate fields for the API
    if (selectedDate) {
      formData.set('date', selectedDate);
    }
    
    if (selectedTime) {
      formData.set('time', selectedTime);
    }
    
    // Include user ID from dropdown for new appointments
    if (isAddMode && selectedUserId) {
      // Explicitly set the user ID from the dropdown selection
      formData.set('user', selectedUserId);
      console.log(`Setting explicit user ID for new appointment: ${selectedUserId}`);
    } else if (!isAddMode && selectedItem?.user) {
      // For edit mode, include the user ID
      const userId = typeof selectedItem.user === 'object' && selectedItem.user
        ? selectedItem.user.id.toString()
        : selectedItem.user?.toString() || '';
      
      if (userId) {
        formData.set('user', userId);
        console.log(`Setting user ID for edit: ${userId}`);
      }
    }
    
    // Log data for debugging
    console.log('AppointmentManager: Submitting form data:', 
      Array.from(formData.entries()).reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {} as Record<string, any>)
    );
    
    // Ensure user ID is set before saving
    if (!formData.get('user')) {
      toast({
        title: "Missing patient",
        description: "Please select a patient for this appointment",
        variant: "destructive",
      });
      return;
    }
    
    onSave(formData);
  };

  // Format user display name
  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    } else if (user.username) {
      return `${user.username} (${user.email})`;
    } else {
      return user.email;
    }
  };

  // Check if a slot is available
  const isSlotAvailable = (slot: string): boolean => {
    if (!isAddMode) return true; // Don't check availability when editing
    return !takenSlots.includes(slot);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-cyan-200">
        <DialogHeader>
          <DialogTitle className="text-cyan-800">{isAddMode ? 'Add New Appointment' : 'Edit Appointment'}</DialogTitle>
          <DialogDescription>
            {isAddMode 
              ? 'Schedule a new appointment.' 
              : 'Update the appointment details below.'}
          </DialogDescription>
        </DialogHeader>
        <form 
          id="appointment-form" 
          onSubmit={handleFormSubmit}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isAddMode && selectedItem && (
                <input 
                  type="hidden" 
                  name="id" 
                  value={selectedItem.id} 
                />
              )}
              
              {/* Always include a hidden user_id field that gets populated from the dropdown selection */}
              <input 
                type="hidden" 
                name="user_id" 
                value={selectedUserId} 
              />
              
              <div>
                <label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Patient*</label>
                {isAddMode ? (
                  <Select 
                    name="user" 
                    value={selectedUserId} 
                    onValueChange={setSelectedUserId}
                    required
                  >
                    <SelectTrigger id="user" className="w-full">
                      <SelectValue placeholder="Select a patient" />
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
                        <div className="p-2 text-sm text-gray-500">No users found</div>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id="display_user" 
                    value={selectedItem?.user && typeof selectedItem.user === 'object' 
                      ? getUserDisplayName(selectedItem.user as User)
                      : `User ID: ${selectedItem?.user}`}
                    disabled
                    readOnly
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Status*</label>
                <Select 
                  name="status" 
                  defaultValue={isAddMode ? "scheduled" : (selectedItem?.status || "scheduled")}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Date*</label>
                <div className="flex">
                  <Input 
                    id="date" 
                    name="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full"
                  />
                  <div className="ml-2 p-2 bg-gray-100 rounded-md">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Time*</label>
                <Select 
                  name="time" 
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                  required
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => (
                      <SelectItem 
                        key={slot} 
                        value={slot}
                        disabled={!isSlotAvailable(slot)}
                        className={!isSlotAvailable(slot) ? "opacity-50" : ""}
                      >
                        {slot} {!isSlotAvailable(slot) && "(Taken)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Notes</label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={isAddMode ? '' : (selectedItem?.notes || '')}
                  placeholder="Additional information about the appointment..."
                  className="min-h-[80px]"
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
              {isAddMode ? 'Schedule Appointment' : 'Update Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentManager; 