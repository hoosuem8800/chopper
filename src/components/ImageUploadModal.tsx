import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { customToast } from '@/lib/toast';
import { api } from '@/services/api';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  onSuccess: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  onSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      customToast.error('Please upload an image file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      customToast.error('Please upload an image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      customToast.error('Please select an image to upload');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('appointment_id', appointmentId.toString());

      await api.post('/appointments/send-result/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      customToast.success('X-ray image sent successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      customToast.error('Failed to send X-ray image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Send X-ray Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300",
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary",
              selectedFile && "border-green-500 bg-green-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your X-ray image here
                </p>
                <p className="text-xs text-gray-500">or click to browse files</p>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          {selectedFile && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4 mr-2" />
              Remove File
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Result'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal; 