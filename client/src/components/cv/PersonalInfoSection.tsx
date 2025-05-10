import { useState, useEffect } from "react";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  Form,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Camera, Trash2, Upload } from "lucide-react";

type PersonalInfoSectionProps = {
  form: any;
};

const PersonalInfoSection = ({ form }: PersonalInfoSectionProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Get the current photoUrl value from the form with better error handling
  let photoUrl = "";
  try {
    photoUrl = form.watch("personal.photoUrl") || "";
  } catch (error) {
    console.error("Error watching photoUrl:", error);
  }
  
  // Update preview when photoUrl changes
  useEffect(() => {
    try {
      if (photoUrl) {
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
    } catch (error) {
      console.error("Error in photoUrl effect:", error);
    }
  }, [photoUrl]);
  
  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setUploadError('Please select an image file (PNG, JPG, JPEG)');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size should be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      form.setValue("personal.photoUrl", result);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove the photo
  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue("personal.photoUrl", "");
  };
  
  // Get initials for avatar fallback with better error handling
  const getInitials = () => {
    try {
      const firstName = form.watch("personal.firstName") || '';
      const lastName = form.watch("personal.lastName") || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } catch (error) {
      console.error("Error generating initials:", error);
      return "";
    }
  };
  
  return (
    <Card className="shadow-md border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Personal Information</h2>
        <p className="text-gray-500 text-sm mt-1">This information will appear at the top of your CV</p>
      </div>
      
      <CardContent className="pt-6 sm:pt-8">      
        <div className="flex flex-col sm:flex-row gap-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-primary/10 ring-2 ring-white shadow-md transition-transform group-hover:scale-105">
                <AvatarImage src={photoPreview || ""} alt="Profile" />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary/80">{getInitials() || <Camera className="w-10 h-10 text-primary/40" />}</AvatarFallback>
              </Avatar>
              
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Label htmlFor="photo-upload" className="w-full h-full flex items-center justify-center cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </Label>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col gap-2 w-full">
              <Label htmlFor="photo-upload" className="w-full">
                <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-md px-3 py-2 text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </div>
                <input
                  id="photo-upload-btn"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </Label>
              
              {photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removePhoto}
                  className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            
            {uploadError && (
              <div className="mt-2 text-xs bg-red-50 text-red-500 px-3 py-2 rounded-md border border-red-100">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </p>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500 text-center max-w-[200px] bg-gray-50 p-2 rounded-md border border-gray-100">
              <p className="font-medium mb-1">Photo Tips:</p>
              <ul className="text-left list-disc pl-4 space-y-1">
                <li>Professional headshot</li>
                <li>Neutral background</li>
                <li>Good lighting</li>
                <li>Business attire</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1">
            <FormField
              control={form.control}
              name="personal.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700">First Name*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      {...field} 
                      className="border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personal.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700">Last Name*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Doe" 
                      {...field} 
                      className="border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personal.professionalTitle"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="font-medium text-gray-700">Professional Title*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Senior Software Engineer" 
                      {...field} 
                      className="border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </FormControl>
                  <FormDescription className="text-xs mt-1.5">
                    This appears directly under your name on your CV (e.g., "Senior Project Manager")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personal.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700">Email Address*</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      {...field} 
                      className="border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personal.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-700">Phone Number*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+1 (555) 123-4567" 
                      {...field} 
                      className="border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personal.linkedin"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="font-medium text-gray-700">LinkedIn Profile</FormLabel>
                  <FormControl>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        linkedin.com/in/
                      </span>
                      <Input 
                        className="rounded-l-none border-gray-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="johndoe" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs mt-1.5">
                    Including your LinkedIn URL allows recruiters to learn more about your professional background
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;
