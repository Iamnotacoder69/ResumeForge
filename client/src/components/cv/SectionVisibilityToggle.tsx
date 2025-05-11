import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface SectionVisibilityToggleProps {
  sectionId: string;
  isVisible: boolean;
  onToggle: (sectionId: string, visible: boolean) => void;
}

const SectionVisibilityToggle: React.FC<SectionVisibilityToggleProps> = ({
  sectionId,
  isVisible,
  onToggle
}) => {
  return (
    <div className="flex items-center space-x-2 text-[#043e44]">
      {isVisible ? (
        <Eye className="h-4 w-4 text-[#03d27c]" />
      ) : (
        <EyeOff className="h-4 w-4 text-gray-400" />
      )}
      <Switch
        checked={isVisible}
        onCheckedChange={(checked) => onToggle(sectionId, checked)}
        id={`toggle-visibility-${sectionId}`}
        className="data-[state=checked]:bg-[#03d27c]"
      />
      <Label 
        htmlFor={`toggle-visibility-${sectionId}`} 
        className="text-sm cursor-pointer"
      >
        {isVisible ? 'Show in CV' : 'Hidden from CV'}
      </Label>
    </div>
  );
};

export default SectionVisibilityToggle;