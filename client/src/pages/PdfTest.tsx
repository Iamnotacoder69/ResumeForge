import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';

const PdfTest: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGeneratePdf = async () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: 'test.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
    };

    try {
      // Show loading state
      console.log('Starting PDF generation...');
      await html2pdf().set(options).from(element).save();
      console.log('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">HTML to PDF Test</h1>
      
      <Button onClick={handleGeneratePdf} className="mb-6">
        Generate PDF
      </Button>
      
      <div className="border p-4 bg-white" ref={contentRef}>
        <h2 className="text-xl font-semibold">Test Document</h2>
        <p className="my-4">This is a test document to verify html2pdf.js functionality.</p>
        
        <div className="my-6">
          <h3 className="font-medium">Features:</h3>
          <ul className="list-disc pl-6 mt-2">
            <li>Direct HTML to PDF conversion</li>
            <li>Proper styling preservation</li>
            <li>Image support</li>
            <li>Multi-page documents</li>
          </ul>
        </div>
        
        <div className="my-6">
          <h3 className="font-medium">Test Table:</h3>
          <table className="border-collapse border w-full mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Position</th>
                <th className="border p-2">Department</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">John Doe</td>
                <td className="border p-2">Developer</td>
                <td className="border p-2">Engineering</td>
              </tr>
              <tr>
                <td className="border p-2">Jane Smith</td>
                <td className="border p-2">Designer</td>
                <td className="border p-2">UX Team</td>
              </tr>
              <tr>
                <td className="border p-2">Michael Johnson</td>
                <td className="border p-2">Product Manager</td>
                <td className="border p-2">Product</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PdfTest;