// Test script for CloudConvert PDF generation
import fetch from 'node-fetch';

// Sample CV data
const sampleCV = {
  personal: {
    firstName: 'John',
    lastName: 'Doe',
    professionalTitle: 'Software Engineer',
    email: 'john.doe@example.com',
    phone: '(123) 456-7890',
    linkedin: 'linkedin.com/in/johndoe'
  },
  professional: {
    summary: 'Experienced software engineer with 5+ years of expertise in web development, specializing in React, Node.js, and cloud technologies.'
  },
  keyCompetencies: {
    technicalSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
    softSkills: ['Team Leadership', 'Communication', 'Problem Solving']
  },
  experience: [
    {
      companyName: 'Tech Solutions Inc.',
      jobTitle: 'Senior Software Engineer',
      startDate: '2020-01',
      endDate: '',
      isCurrent: true,
      responsibilities: 'Led development of enterprise web applications. Mentored junior developers and implemented CI/CD pipelines.'
    },
    {
      companyName: 'Web Innovations Co.',
      jobTitle: 'Software Developer',
      startDate: '2018-03',
      endDate: '2019-12',
      isCurrent: false,
      responsibilities: 'Developed and maintained client websites and web applications using React and Node.js.'
    }
  ],
  education: [
    {
      schoolName: 'University of Technology',
      major: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-05',
      achievements: 'Graduated with honors. Participated in coding competitions.'
    }
  ],
  certificates: [],
  languages: [
    {
      name: 'English',
      proficiency: 'native'
    },
    {
      name: 'Spanish',
      proficiency: 'intermediate'
    }
  ],
  extracurricular: [],
  additional: {
    skills: ['Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL']
  },
  templateSettings: {
    template: 'professional',
    includePhoto: false,
    sectionOrder: [
      { id: 'personal', name: 'Personal Information', visible: true, order: 1 },
      { id: 'summary', name: 'Professional Summary', visible: true, order: 2 },
      { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 3 },
      { id: 'experience', name: 'Experience', visible: true, order: 4 },
      { id: 'education', name: 'Education', visible: true, order: 5 },
      { id: 'certificates', name: 'Certificates', visible: false, order: 6 },
      { id: 'extracurricular', name: 'Extracurricular Activities', visible: false, order: 7 },
      { id: 'additional', name: 'Additional Information', visible: true, order: 8 }
    ]
  }
};

// Test the render-template endpoint
async function testCloudConvertPDF() {
  try {
    console.log('Step 1: Creating render template...');
    const renderRes = await fetch('http://localhost:5000/api/render-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleCV)
    });
    
    const renderData = await renderRes.json();
    if (!renderData.success) {
      throw new Error(`Failed to create render template: ${renderData.error || 'Unknown error'}`);
    }
    
    console.log('Render template created successfully:', renderData);
    console.log('Render URL:', renderData.renderUrl);
    
    console.log('\nStep 2: Generating PDF...');
    const pdfRes = await fetch(`http://localhost:5000/api/render-template/${renderData.tempId}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const pdfData = await pdfRes.json();
    if (!pdfData.success) {
      throw new Error(`Failed to generate PDF: ${pdfData.error || 'Unknown error'}`);
    }
    
    console.log('PDF generated successfully!');
    console.log('Download URL:', pdfData.downloadUrl);
    console.log('Filename:', pdfData.fileName);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Execute the test
testCloudConvertPDF();