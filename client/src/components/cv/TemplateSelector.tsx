import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import from shared types instead of declaring here
import { TemplateType } from "@shared/types";

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  includePhoto: boolean;
  onTemplateChange: (template: TemplateType) => void;
  onPhotoInclusionChange: (include: boolean) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  includePhoto,
  onPhotoInclusionChange
}) => {
  // Only photo toggle is kept, templates are removed
  const handlePhotoToggle = () => {
    onPhotoInclusionChange(!includePhoto);
    console.log("Photo inclusion toggled:", !includePhoto);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <Alert className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Format Update</AlertTitle>
          <AlertDescription>
            We've switched to a Word document format for better spacing control and document quality.
            Your CV will be generated as a Word document and converted to PDF when downloaded.
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="photo-toggle"
              checked={includePhoto}
              onCheckedChange={handlePhotoToggle}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="photo-toggle" className="cursor-pointer">
              Include photo in CV
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">
            Adding a photo is optional and depends on the region and industry standards
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;