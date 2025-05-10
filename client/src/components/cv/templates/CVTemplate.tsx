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
    
    // Explicitly type check to satisfy TypeScript
    if (templateType === 'modern') {
      return <ModernTemplate data={data} />;
    } else if (templateType === 'minimal') {
      return <MinimalTemplate data={data} />;
    } else if (templateType === 'professional') {
      return <ProfessionalTemplate data={data} />;
    } else {
      // Default to professional template if an invalid type is provided
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