import React from 'react';
import { CompleteCV, TemplateType } from '@shared/types';
// Import pure HTML templates
import ProfessionalTemplateHTML from './ProfessionalTemplateHTML';
import ModernTemplateHTML from './ModernTemplateHTML';
import MinimalTemplateHTML from './MinimalTemplateHTML';

interface CVTemplateProps {
  data: CompleteCV;
  templateRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Dynamic CV template loader component
 * Renders the appropriate template based on the templateSettings.template value
 * Using pure HTML versions of templates (no CSS)
 */
const CVTemplate: React.FC<CVTemplateProps> = ({ data, templateRef }) => {
  // Determine which template to render based on the template type
  const renderTemplate = () => {
    const templateType = data.templateSettings?.template || 'professional';
    
    // Explicitly type check to satisfy TypeScript
    if (templateType === 'modern') {
      return <ModernTemplateHTML data={data} />;
    } else if (templateType === 'minimal') {
      return <MinimalTemplateHTML data={data} />;
    } else {
      // Default to professional template
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