import { useState, useCallback, useEffect } from 'react';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { PencilIcon, ImageIcon, XIcon, ZoomInIcon, RotateCwIcon, SlidersIcon, CheckIcon } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';

interface ProfilePictureEditorProps {
  currentImage: string;
  firstName: string;
  lastName: string;
  onImageChange: (file: File | null) => void;
  onClose?: () => void;
}

const filterPresets = [
  { name: 'Normal', filter: 'none' },
  { name: 'Grayscale', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Vivid', filter: 'saturate(200%)' },
  { name: 'Cool', filter: 'hue-rotate(90deg)' },
  { name: 'Warm', filter: 'hue-rotate(-30deg) saturate(150%)' },
  { name: 'Vintage', filter: 'sepia(40%) saturate(90%) brightness(90%)' },
  { name: 'High Contrast', filter: 'contrast(150%)' },
];

// Helper function to create a file from a data URL
const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Function to create a canvas with the cropped image
const createCroppedImage = (
  image: HTMLImageElement,
  crop: Area,
  rotation: number,
  filter: string
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to the cropped size
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Draw the image with specified crop, rotation, and filter
    ctx.filter = filter;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      -crop.width / 2,
      -crop.height / 2,
      crop.width,
      crop.height
    );

    // Reset the filter
    ctx.filter = 'none';

    // Convert the canvas to a data URL
    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
};

const ProfilePictureEditor = ({
  currentImage,
  firstName,
  lastName,
  onImageChange,
  onClose
}: ProfilePictureEditorProps) => {
  const [open, setOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('crop');
  
  // Cropping state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');

  // When the dialog closes, also call onClose
  const handleOpenChange = (isOpen: boolean) => {
    console.log('ProfilePictureEditor dialog open state changed:', isOpen);
    setOpen(isOpen);
    if (!isOpen && onClose) {
      console.log('Calling onClose from handleOpenChange');
      onClose();
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (onClose) {
        console.log('Calling onClose from unmount effect');
        onClose();
      }
    };
  }, [onClose]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setActiveTab('crop');
    
    // Reset editing parameters
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setSelectedFilter('none');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleSave = useCallback(async () => {
    if (!previewImage || !croppedAreaPixels) return;

    try {
      // Create an image element for the cropping function
      const image = new Image();
      image.src = previewImage;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      // Generate the cropped image
      const croppedImageUrl = await createCroppedImage(
        image,
        croppedAreaPixels,
        rotation,
        selectedFilter
      );

      // Convert to file and save
      const croppedFile = dataURLtoFile(
        croppedImageUrl,
        selectedFile?.name || 'profile-picture.jpg'
      );
      
      // Validate file size (5MB)
      if (croppedFile.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB');
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(croppedFile.type)) {
        throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF');
      }
      
      onImageChange(croppedFile);
      setOpen(false);
      if (onClose) onClose();
    } catch (e) {
      console.error('Error generating cropped image: ', e);
      // You might want to show an error toast here
    }
  }, [previewImage, croppedAreaPixels, rotation, selectedFilter, selectedFile, onImageChange, onClose]);

  const handleRemove = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    onImageChange(null);
    setOpen(false);
    if (onClose) onClose();
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile picture</DialogTitle>
        </DialogHeader>
        
        {!previewImage ? (
          // Upload area when no image is selected
          <div 
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <ImageIcon className="h-10 w-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag and drop your image here, or
                </p>
                <label 
                  htmlFor="profile-pic-upload"
                  className="text-sm text-primary underline cursor-pointer"
                >
                  browse files
                </label>
                <input 
                  id="profile-pic-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF up to 2MB
              </p>
            </div>
          </div>
        ) : (
          // Image editing area
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="crop" className="flex items-center gap-1">
                  <ZoomInIcon className="h-4 w-4" />
                  <span>Crop</span>
                </TabsTrigger>
                <TabsTrigger value="rotate" className="flex items-center gap-1">
                  <RotateCwIcon className="h-4 w-4" />
                  <span>Rotate</span>
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center gap-1">
                  <SlidersIcon className="h-4 w-4" />
                  <span>Filters</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="crop" className="space-y-4">
                <div className="relative h-60 w-full overflow-hidden rounded-lg">
                  <Cropper
                    image={previewImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    style={{
                      containerStyle: { borderRadius: '8px' },
                      cropAreaStyle: { 
                        borderRadius: '50%', 
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      },
                      mediaStyle: { filter: selectedFilter }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zoom</span>
                    <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                  </div>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="rotate" className="space-y-4">
                <div className="relative h-60 w-full overflow-hidden rounded-lg">
                  <Cropper
                    image={previewImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    style={{
                      containerStyle: { borderRadius: '8px' },
                      cropAreaStyle: { 
                        borderRadius: '50%', 
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      },
                      mediaStyle: { filter: selectedFilter }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rotation</span>
                    <span className="text-sm text-gray-500">{rotation}°</span>
                  </div>
                  <Slider
                    value={[rotation]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(value) => setRotation(value[0])}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="filters" className="space-y-4">
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                  <Cropper
                    image={previewImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    style={{
                      containerStyle: { borderRadius: '8px' },
                      cropAreaStyle: { 
                        borderRadius: '50%', 
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      },
                      mediaStyle: { filter: selectedFilter }
                    }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {filterPresets.map((preset) => (
                    <button
                      key={preset.name}
                      className={`p-1 rounded-md text-center relative ${
                        selectedFilter === preset.filter ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleFilterChange(preset.filter)}
                    >
                      <div 
                        className="h-14 w-full rounded overflow-hidden mb-1"
                        style={{ position: 'relative' }}
                      >
                        <div 
                          style={{ 
                            backgroundImage: `url(${previewImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: preset.filter,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                          }}
                        />
                        {selectedFilter === preset.filter && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {previewImage && (
            <Button variant="destructive" onClick={handleRemove}>
              <XIcon className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
          <Button onClick={handleSave} disabled={!previewImage || !croppedAreaPixels}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureEditor; 