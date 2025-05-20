import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/services/api';
import { ResourceManagerProps, Consultation } from './types';

interface ConsultationManagerProps extends ResourceManagerProps<Consultation> {}

const ConsultationManager: React.FC<ConsultationManagerProps> = ({
  isOpen,
  onClose,
  selectedItem,
  onSave,
  isAddMode
}) => {
  // Form state
  const [patient, setPatient] = useState<string>('');
  const [doctor, setDoctor] = useState<string>('');
  const [consultationType, setConsultationType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [scanId, setScanId] = useState<string>('none');
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  
  // Load data for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch users (patients)
        const usersResponse = await api.get('/users/');
        if (Array.isArray(usersResponse.data)) {
          setPatients(usersResponse.data);
        } else if (usersResponse.data && Array.isArray(usersResponse.data.results)) {
          setPatients(usersResponse.data.results);
        }
        
        // Fetch doctors
        const doctorsResponse = await api.get('/doctors/');
        if (Array.isArray(doctorsResponse.data)) {
          setDoctors(doctorsResponse.data);
        } else if (doctorsResponse.data && Array.isArray(doctorsResponse.data.results)) {
          setDoctors(doctorsResponse.data.results);
        }
        
        // Fetch scans
        const scansResponse = await api.get('/scans/');
        if (Array.isArray(scansResponse.data)) {
          setScans(scansResponse.data);
        } else if (scansResponse.data && Array.isArray(scansResponse.data.results)) {
          setScans(scansResponse.data.results);
        }
        
        // Now that we have the data, set the form values if we're editing
        if (selectedItem) {
          setTimeout(() => {
            setFormValuesFromSelectedItem();
          }, 100);
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);
  
  // Function to set form values from selected item
  const setFormValuesFromSelectedItem = () => {
    if (!selectedItem) return;
    
    console.log("Setting form values from selected item:", selectedItem);
    
    // Handle patient (could be an object or just an ID)
    if (typeof selectedItem.patient === 'object' && selectedItem.patient !== null) {
      console.log("Setting patient from object:", selectedItem.patient.id);
      setPatient(selectedItem.patient.id.toString());
    } else if (selectedItem.patient) {
      console.log("Setting patient from ID:", selectedItem.patient);
      setPatient(selectedItem.patient.toString());
    } else {
      console.log("No patient data found");
      setPatient('');
    }
    
    // Handle doctor (could be an object or just an ID)
    if (typeof selectedItem.doctor === 'object' && selectedItem.doctor !== null) {
      console.log("Setting doctor from object:", selectedItem.doctor.id);
      setDoctor(selectedItem.doctor.id.toString());
    } else if (selectedItem.doctor) {
      console.log("Setting doctor from ID:", selectedItem.doctor);
      setDoctor(selectedItem.doctor.toString());
    } else {
      console.log("No doctor data found");
      setDoctor('');
    }
    
    // Set other fields with appropriate fallbacks
    console.log("Setting consultation type:", selectedItem.consultation_type);
    setConsultationType(selectedItem.consultation_type || '');
    
    console.log("Setting status:", selectedItem.status);
    setStatus(selectedItem.status || 'pending');
    
    console.log("Setting scan ID:", selectedItem.scan_id);
    setScanId(selectedItem.scan_id ? selectedItem.scan_id.toString() : 'none');
    
    console.log("Setting duration:", selectedItem.duration);
    setDuration(selectedItem.duration ? selectedItem.duration.toString() : '');
    
    console.log("Setting notes:", selectedItem.notes);
    setNotes(selectedItem.notes || '');
  };
  
  // Set form values when editing an existing item or reset when adding new
  useEffect(() => {
    if (selectedItem) {
      // When editing, set form values after a short delay to ensure dropdowns are ready
      setTimeout(() => {
        setFormValuesFromSelectedItem();
      }, 100);
    } else {
      // Reset form for new item
      console.log("Resetting form for new consultation");
      setPatient('');
      setDoctor('');
      setConsultationType('');
      setStatus('pending');
      setScanId('none');
      setDuration('');
      setNotes('');
    }
  }, [selectedItem]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!patient || !doctor || !consultationType || !status) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      
      // Create FormData object for submission
      const formData = new FormData();
      formData.append('patient', patient);
      formData.append('doctor', doctor);
      formData.append('consultation_type', consultationType);
      formData.append('status', status);
      
      // Only add scan_id if it's a valid scan ID (not "none")
      if (scanId && scanId !== "none") formData.append('scan_id', scanId);
      if (duration) formData.append('duration', duration);
      if (notes) formData.append('notes', notes);
      
      // If editing, add the ID
      if (selectedItem && selectedItem.id) {
        formData.append('id', selectedItem.id.toString());
      }
      
      // Call the parent's onSave method
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving consultation:', err);
      setError('Failed to save consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format user display name
  const getUserDisplayName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    } else if (user.username) {
      return `${user.username} (${user.email})`;
    } else {
      return user.email || `User ${user.id}`;
    }
  };
  
  // Format doctor display name
  const getDoctorDisplayName = (doctor: any) => {
    // If doctor has a user property that's an object
    if (doctor.user && typeof doctor.user === 'object') {
      const doctorUser = doctor.user;
      const name = doctorUser.first_name && doctorUser.last_name 
        ? `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`
        : doctorUser.username || doctorUser.email || `Doctor ${doctor.id}`;
      
      return `${name} - ${doctor.specialty || 'General'}`;
    }
    
    return `Doctor #${doctor.id} - ${doctor.specialty || 'General'}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAddMode ? 'Add New Consultation' : 'Edit Consultation'}</DialogTitle>
          <DialogDescription>
            {isAddMode 
              ? 'Create a new consultation between a patient and doctor.' 
              : 'Update the details of this consultation.'}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient" className="text-sm font-medium">Patient*</Label>
            <div className="relative">
              <select
                id="patient"
                name="patient"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                required
                disabled={loading}
              >
                <option value="" disabled>Select a patient</option>
                {patients.map(user => (
                  <option key={`patient-${user.id}`} value={user.id.toString()}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
              {loading && (
                <div className="absolute inset-y-0 right-6 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor" className="text-sm font-medium">Doctor*</Label>
            <div className="relative">
              <select
                id="doctor"
                name="doctor"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
                required
                disabled={loading}
              >
                <option value="" disabled>Select a doctor</option>
                {doctors.map(doc => (
                  <option key={`doctor-${doc.id}`} value={doc.id.toString()}>
                    {getDoctorDisplayName(doc)}
                  </option>
                ))}
              </select>
              {loading && (
                <div className="absolute inset-y-0 right-6 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Consultation Type */}
          <div className="space-y-2">
            <Label htmlFor="consultation_type" className="text-sm font-medium">Consultation Type*</Label>
            <select
              id="consultation_type"
              name="consultation_type"
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
              required
              disabled={loading}
            >
              <option value="" disabled>Select type</option>
              <option value="initial">Initial Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status*</Label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
              required
              disabled={loading}
            >
              <option value="" disabled>Select status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Scan ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="scan_id" className="text-sm font-medium">Related Scan</Label>
            <select
              id="scan_id"
              name="scan_id"
              value={scanId}
              onChange={(e) => setScanId(e.target.value)}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition-all duration-200"
              disabled={loading}
            >
              <option value="none">None</option>
              {scans.map(scan => (
                <option key={`scan-${scan.id}`} value={scan.id.toString()}>
                  Scan #{scan.id} - {new Date(scan.upload_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the consultation"
              disabled={loading}
              rows={4}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAddMode ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                isAddMode ? 'Create Consultation' : 'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationManager; 