import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CloudUpload, X } from 'lucide-react';
import { appointmentService } from '@/services/api';
import { customToast } from '@/lib/toast';

interface XRayUploadModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: number;
  patientData: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
  };
  assistantData: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
  };
}

export const XRayUploadModal: React.FC<XRayUploadModalProps> = ({
  open,
  onClose,
  appointmentId,
  patientData,
  assistantData,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      customToast.error('Please select an image file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      customToast.error('Please select an X-ray image to upload');
      return;
    }

    setIsUploading(true);
    try {
      console.log(`Uploading X-ray for appointment ${appointmentId}`, {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        notes: notes || 'No notes provided',
        patientId: patientData.id,
        assistantId: assistantData.id
      });
      
      const response = await appointmentService.sendResult(appointmentId, selectedFile, notes);
      console.log('X-ray upload successful:', response);
      customToast.success('X-ray image uploaded successfully');
      onClose();
    } catch (error: any) {
      console.error('Error uploading X-ray:', error);
      let errorMessage = 'Failed to upload X-ray image';
      
      // Extract more specific error details if available
      if (error.response) {
        console.error('API error response:', error.response);
        
        if (error.response.data?.detail) {
          errorMessage = `Upload failed: ${error.response.data.detail}`;
        } else if (error.response.data?.error) {
          errorMessage = `Upload failed: ${error.response.data.error}`;
        } else if (error.response.data?.message) {
          errorMessage = `Upload failed: ${error.response.data.message}`;
        } else if (typeof error.response.data === 'string') {
          errorMessage = `Upload failed: ${error.response.data}`;
        } else if (error.response.status === 500) {
          errorMessage = 'Upload failed: Server error. Please check the server logs.';
        }
      } else if (error.request) {
        errorMessage = 'Upload failed: No response from server. Please check your connection.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      customToast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload X-Ray Result</DialogTitle>
        </DialogHeader>

        {/* Patient Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={patientData.profile_picture} />
              <AvatarFallback>
                {patientData.first_name[0]}{patientData.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-medium">Patient</h4>
              <p className="text-sm">
                {patientData.first_name} {patientData.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {patientData.email}
              </p>
            </div>
          </div>

          {/* Assistant Information */}
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <Avatar>
              <AvatarImage src={assistantData.profile_picture} />
              <AvatarFallback>
                {assistantData.first_name[0]}{assistantData.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-medium">Assistant</h4>
              <p className="text-sm">
                {assistantData.first_name} {assistantData.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {assistantData.email}
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div
            className="border-2 border-dashed border-primary rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="X-ray preview"
                  className="max-w-full max-h-[200px] object-contain mx-auto"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <CloudUpload className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm font-medium">Drop X-ray image here</p>
                <p className="text-sm text-muted-foreground">or click to select file</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="xray-upload-input"
                />
                <Label
                  htmlFor="xray-upload-input"
                  className="cursor-pointer"
                >
                  Select File
                </Label>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the X-ray..."
              className="h-24"
            />
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Send Result'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 