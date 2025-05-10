import React from 'react';
import { CompleteCV, TemplateType } from '@shared/types';
import ProfessionalTemplate from './ProfessionalTemplate';
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';

interface CVTemplateProps {
  data: CompleteCV;
  templateRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Dynamic CV template loader component
 * Renders the appropriate template based on the templateSettings.template value
 */
const CVTemplate: React.FC<CVTemplateProps> = ({ data, templateRef }) => {
  // Determine which template to render based on the template type
  const renderTemplate = () => {
    const templateType = data.templateSettings?.template || 'professional';
    
    // Use a switch statement for better type safety
    switch (templateType) {
      case 'modern':
        return <ModernTemplate data={data} />;
      case 'minimal':
        return <MinimalTemplate data={data} />;
      case 'professional':
      default:
        // Default to professional template
        return <ProfessionalTemplate data={data} />;
    }
  };

  return (
    <div ref={templateRef} className="cv-template-wrapper">
      {renderTemplate()}
    </div>
  );
};

export default CVTemplate;