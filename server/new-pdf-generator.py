#!/usr/bin/env python3

from xhtml2pdf import pisa
import os
import sys
import json
from io import BytesIO

def convert_html_to_pdf(html_content, output_filename):
    """
    Convert HTML content to a PDF file
    
    Args:
        html_content (str): HTML content to convert
        output_filename (str): Output filename for the PDF
        
    Returns:
        tuple: (bool, str) Path to the generated PDF file
    """
    # Create a file buffer
    pdf_buffer = BytesIO()
    
    # Convert HTML to PDF
    pisa_status = pisa.CreatePDF(
        src=html_content,
        dest=pdf_buffer,
        encoding='utf-8'
    )
    
    # Check if conversion was successful
    try:
        conversion_failed = pisa_status.err if hasattr(pisa_status, 'err') else False
        if conversion_failed:
            return False, None
    except Exception as e:
        print(f"Error checking PDF conversion status: {e}")
        return False, None
    
    # Write the PDF to a file
    output_path = os.path.join(os.getcwd(), 'generated-pdfs', output_filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write the PDF to a file
    with open(output_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"PDF generated successfully: {output_path}")
    return True, output_path

def generate_professional_template(cv_data):
    """Generate professional template HTML"""
    # Extract all data sections from cv_data
    personal = cv_data.get('personal', {})
    professional = cv_data.get('professional', {})
    keyCompetencies = cv_data.get('keyCompetencies', {})
    experience = cv_data.get('experience', [])
    education = cv_data.get('education', [])
    certificates = cv_data.get('certificates', [])
    languages = cv_data.get('languages', [])
    extracurricular = cv_data.get('extracurricular', [])
    additional = cv_data.get('additional', {})
    templateSettings = cv_data.get('templateSettings', {})
    
    # Define CSS styles for the CV - matching the web version's appearance
    html = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 1.5cm;
            }}
            body {{
                font-family: 'Arial', 'Helvetica', sans-serif;
                font-size: 11pt;
                color: #043e44;
                line-height: 1.5;
                margin: 0;
                padding: 0;
            }}
            .header {{
                margin-bottom: 20px;
            }}
            .name {{
                font-size: 24pt;
                font-weight: bold;
                color: #043e44;
                margin: 0;
                padding: 0;
            }}
            .contact-info {{
                margin: 5px 0;
                font-size: 10pt;
                color: #666;
            }}
            .section {{
                margin-bottom: 20px;
                page-break-inside: avoid;
            }}
            .section-title {{
                font-size: 14pt;
                font-weight: bold;
                color: #043e44;
                border-bottom: 2px solid #03d27c;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }}
            .company-name {{
                font-weight: bold;
                margin-bottom: 2px;
                color: #043e44;
            }}
            .job-title {{
                font-weight: 600;
                color: #03d27c;
                margin: 2px 0;
            }}
            .date-range {{
                font-size: 10pt;
                color: #666;
                margin-bottom: 5px;
            }}
            .responsibilities {{
                margin-top: 8px;
                text-align: justify;
            }}
            .school-name {{
                font-weight: bold;
                color: #043e44;
                margin-bottom: 2px;
            }}
            .degree {{
                font-weight: 600;
                color: #03d27c;
            }}
            .skills-list {{
                display: flex;
                flex-wrap: wrap;
                margin: 0;
                padding: 0;
            }}
            .skill-item {{
                background-color: rgba(3, 210, 124, 0.1);
                border: 1px solid #03d27c;
                border-radius: 4px;
                padding: 3px 8px;
                margin: 3px;
                font-size: 10pt;
                color: #043e44;
                display: inline-block;
            }}
            .skill-category {{
                font-weight: bold;
                margin-top: 10px;
                margin-bottom: 5px;
                color: #043e44;
            }}
            .language {{
                margin-bottom: 5px;
            }}
            .language-name {{
                font-weight: bold;
            }}
            .language-level {{
                color: #03d27c;
            }}
            ul {{
                padding-left: 20px;
                margin: 5px 0;
            }}
            li {{
                margin-bottom: 3px;
            }}
            
            /* Icons */
            .icon {{
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 5px;
                vertical-align: middle;
            }}
            .email-icon::before {{
                content: "✉";
                color: #03d27c;
            }}
            .phone-icon::before {{
                content: "☎";
                color: #03d27c;
            }}
            .linkedin-icon::before {{
                content: "in";
                color: #03d27c;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="name">{personal.get('firstName', '')} {personal.get('lastName', '')}</h1>
            <div class="contact-info">
                <span class="icon email-icon"></span>{personal.get('email', '')} 
                <span class="icon phone-icon" style="margin-left: 10px;"></span>{personal.get('phone', '')}
                {f'<span class="icon linkedin-icon" style="margin-left: 10px;"></span>{personal.get("linkedin", "")}' if personal.get('linkedin') else ''}
            </div>
        </div>
    """
    
    # Professional Summary
    if professional and professional.get('summary'):
        html += f"""
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>{professional.get('summary', '')}</p>
        </div>
        """
    
    # Key Competencies
    if keyCompetencies and (keyCompetencies.get('technicalSkills') or keyCompetencies.get('softSkills')):
        html += """
        <div class="section">
            <div class="section-title">Key Competencies</div>
        """
        
        # Technical Skills
        if keyCompetencies.get('technicalSkills'):
            html += """
            <div class="skill-category">Technical Skills:</div>
            <div class="skills-list">
            """
            for skill in keyCompetencies.get('technicalSkills', []):
                html += f'<div class="skill-item">{skill}</div>'
            html += "</div>"
        
        # Soft Skills
        if keyCompetencies.get('softSkills'):
            html += """
            <div class="skill-category">Soft Skills:</div>
            <div class="skills-list">
            """
            for skill in keyCompetencies.get('softSkills', []):
                html += f'<div class="skill-item">{skill}</div>'
            html += "</div>"
            
        html += "</div>"
    
    # Experience
    if experience:
        html += """
        <div class="section">
            <div class="section-title">Professional Experience</div>
        """
        
        for job in experience:
            current = job.get('isCurrent', False)
            end_date = "Present" if current else job.get('endDate', '')
            
            html += f"""
            <div style="margin-bottom: 15px;">
                <div class="company-name">{job.get('companyName', '')}</div>
                <div class="job-title">{job.get('jobTitle', '')}</div>
                <div class="date-range">{job.get('startDate', '')} - {end_date}</div>
                <div class="responsibilities">
                    {job.get('responsibilities', '')}
                </div>
            </div>
            """
        
        html += "</div>"
    
    # Education
    if education:
        html += """
        <div class="section">
            <div class="section-title">Education</div>
        """
        
        for edu in education:
            html += f"""
            <div style="margin-bottom: 15px;">
                <div class="school-name">{edu.get('schoolName', '')}</div>
                <div class="degree">{edu.get('major', '')}</div>
                <div class="date-range">{edu.get('startDate', '')} - {edu.get('endDate', '')}</div>
                {f'<p>{edu.get("achievements", "")}</p>' if edu.get('achievements') else ''}
            </div>
            """
        
        html += "</div>"
    
    # Certificates
    if certificates:
        html += """
        <div class="section">
            <div class="section-title">Certifications</div>
        """
        
        for cert in certificates:
            expiry = f" - Expires: {cert.get('expirationDate', '')}" if cert.get('expirationDate') else ""
            
            html += f"""
            <div style="margin-bottom: 10px;">
                <div class="school-name">{cert.get('name', '')}</div>
                <div class="job-title">{cert.get('institution', '')}</div>
                <div class="date-range">Acquired: {cert.get('dateAcquired', '')}{expiry}</div>
                {f'<p>{cert.get("achievements", "")}</p>' if cert.get('achievements') else ''}
            </div>
            """
        
        html += "</div>"
    
    # Extracurricular activities
    if extracurricular:
        html += """
        <div class="section">
            <div class="section-title">Extracurricular Activities</div>
        """
        
        for extra in extracurricular:
            current = extra.get('isCurrent', False)
            end_date = "Present" if current else extra.get('endDate', '')
            
            html += f"""
            <div style="margin-bottom: 15px;">
                <div class="company-name">{extra.get('organization', '')}</div>
                <div class="job-title">{extra.get('role', '')}</div>
                <div class="date-range">{extra.get('startDate', '')} - {end_date}</div>
                <div class="responsibilities">
                    {extra.get('description', '')}
                </div>
            </div>
            """
        
        html += "</div>"
    
    # Languages
    if languages:
        html += """
        <div class="section">
            <div class="section-title">Languages</div>
        """
        
        for lang in languages:
            html += f"""
            <div class="language">
                <span class="language-name">{lang.get('name', '')}</span> - 
                <span class="language-level">{lang.get('proficiency', '').capitalize()}</span>
            </div>
            """
        
        html += "</div>"
    
    # Additional Skills
    if additional and additional.get('skills'):
        html += """
        <div class="section">
            <div class="section-title">Additional Skills</div>
            <div class="skills-list">
        """
        
        for skill in additional.get('skills', []):
            html += f'<div class="skill-item">{skill}</div>'
        
        html += "</div></div>"
    
    html += """
    </body>
    </html>
    """
    
    return html

def generate_modern_template(cv_data):
    """Generate modern template HTML - simplified for now"""
    return generate_professional_template(cv_data)

def generate_minimal_template(cv_data):
    """Generate minimal template HTML - simplified for now"""
    return generate_professional_template(cv_data)

def generate_cv_pdf(json_data, template_style='professional'):
    """
    Generate a CV PDF from JSON data
    
    Args:
        json_data (dict or str): CV data as a dict or JSON string
        template_style (str): Template style to use
        
    Returns:
        tuple: (bool, str) - Success flag and path to the PDF file
    """
    # Ensure json_data is a dict
    if isinstance(json_data, str):
        try:
            json_data = json.loads(json_data)
        except json.JSONDecodeError:
            return False, "Invalid JSON data"
    
    # Get the name for the PDF file
    personal = json_data.get('personal', {})
    first_name = personal.get('firstName', 'CV')
    last_name = personal.get('lastName', 'Document')
    filename = f"{first_name}_{last_name}_CV.pdf"
    
    # Generate the HTML content based on the template style
    if template_style == 'professional':
        html_content = generate_professional_template(json_data)
    elif template_style == 'modern':
        html_content = generate_modern_template(json_data)
    elif template_style == 'minimal':
        html_content = generate_minimal_template(json_data)
    else:
        html_content = generate_professional_template(json_data)
    
    # Convert the HTML content to a PDF
    success, pdf_path = convert_html_to_pdf(html_content, filename)
    
    return success, pdf_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python pdf-generator.py <json_file_path> [template_style]")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    template_style = sys.argv[2] if len(sys.argv) > 2 else 'professional'
    
    # Read the JSON data
    with open(json_file_path, 'r') as f:
        json_data = json.load(f)
    
    # Generate the PDF
    success, pdf_path = generate_cv_pdf(json_data, template_style)
    
    if success:
        print(f"PDF generated successfully: {pdf_path}")
    else:
        print(f"Failed to generate PDF: {pdf_path}")
        sys.exit(1)