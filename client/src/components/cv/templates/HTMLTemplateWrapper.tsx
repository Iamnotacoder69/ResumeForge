import React from 'react';

/**
 * This wrapper component renders raw HTML content directly using dangerouslySetInnerHTML
 * This allows us to use native HTML table attributes like bgcolor, cellpadding, etc.
 * which are not directly supported in React's JSX/TSX
 */
interface HTMLTemplateWrapperProps {
  htmlContent: string;
}

const HTMLTemplateWrapper: React.FC<HTMLTemplateWrapperProps> = ({ htmlContent }) => {
  return (
    <div 
      className="html-template-wrapper" 
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};

export default HTMLTemplateWrapper;