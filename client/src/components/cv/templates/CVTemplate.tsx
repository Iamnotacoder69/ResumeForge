import React from 'react';
import { CompleteCV, TemplateType } from '@shared/types';
// Import original CSS templates
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';
// Import HTML version of Professional template
import ProfessionalTemplateHTML from './ProfessionalTemplateHTML';

interface CVTemplateProps {
  data: CompleteCV;
  templateRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Dynamic CV template loader component
 * Renders the appropriate template based on the templateSettings.template value
 * Professional template uses pure HTML, others use CSS for now
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
    } else {
      // Professional template now uses pure HTML (no CSS)
      return <ProfessionalTemplateHTML data={data} />;
    }
  };

  return (
    <div ref={templateRef} className="cv-template-wrapper">
      {renderTemplate()}
    </div>
  );
};

export default CVTemplate;