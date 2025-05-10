#!/usr/bin/env python3

from xhtml2pdf import pisa
import os
from io import BytesIO
import json

def convert_html_to_pdf(html_content, output_filename):
    """
    Convert HTML content to a PDF file
    
    Args:
        html_content (str): HTML content to convert
        output_filename (str): Output filename for the PDF
        
    Returns:
        bool: True if successful, False otherwise
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
    if pisa_status.err:
        return False, None
    
    # Write the PDF to a file
    output_path = os.path.join(os.path.dirname(__file__), '..', 'generated-pdfs', output_filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write the PDF to a file
    with open(output_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    # Return success and the path to the PDF
    return True, output_path

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
    
    # Get the CV data
    personal = json_data.get('personal', {})
    summary = json_data.get('summary', {})
    keyCompetencies = json_data.get('keyCompetencies', {})
    experiences = json_data.get('experiences', [])
    educations = json_data.get('educations', [])
    certificates = json_data.get('certificates', [])
    languages = json_data.get('languages', [])
    additional = json_data.get('additional', {})
    templateSettings = json_data.get('templateSettings', {})
    
    # Get the name for the PDF file
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

def generate_professional_template(cv_data):
    """Generate professional template HTML"""
    personal = cv_data.get('personal', {})
    summary = cv_data.get('summary', {})
    keyCompetencies = cv_data.get('keyCompetencies', {})
    experiences = cv_data.get('experiences', [])
    educations = cv_data.get('educations', [])
    certificates = cv_data.get('certificates', [])
    languages = cv_data.get('languages', [])
    additional = cv_data.get('additional', {})
    
    html = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 1cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 11pt;
                color: #333;
                line-height: 1.4;
            }}
            .header {{
                margin-bottom: 20px;
            }}
            .name {{
                font-size: 24pt;
                font-weight: bold;
                color: #043e44;
                margin: 0;
            }}
            .title {{
                font-size: 14pt;
                color: #03d27c;
                margin: 5px 0 10px 0;
            }}
            .contact-info {{
                margin-bottom: 15px;
                font-size: 10pt;
            }}
            .section {{
                margin-bottom: 20px;
            }}
            .section-title {{
                font-size: 14pt;
                font-weight: bold;
                color: #043e44;
                border-bottom: 2px solid #03d27c;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }}
            .company-title {{
                font-weight: bold;
                margin-bottom: 0;
            }}
            .job-title {{
                font-style: italic;
                color: #03d27c;
            }}
            .date-range {{
                font-size: 10pt;
                color: #666;
            }}
            .responsibilities {{
                margin-top: 5px;
            }}
            .school-name {{
                font-weight: bold;
            }}
            .degree {{
                font-style: italic;
            }}
            .skills-list {{
                column-count: 2;
                column-gap: 20px;
            }}
            .skills-item {{
                margin-bottom: 5px;
                break-inside: avoid;
            }}
            .language {{
                margin-bottom: 5px;
            }}
            .language-name {{
                font-weight: bold;
            }}
            .language-level {{
                font-style: italic;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="name">{personal.get('firstName', '')} {personal.get('lastName', '')}</h1>
            <div class="title">{personal.get('professionalTitle', '')}</div>
            <div class="contact-info">
                {personal.get('email', '')} | {personal.get('phone', '')}
                {' | LinkedIn: ' + personal.get('linkedin', '') if personal.get('linkedin') else ''}
            </div>
        </div>
    """
    
    # Summary
    if summary.get('summary'):
        html += f"""
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>{summary.get('summary', '')}</p>
        </div>
        """
    
    # Key Competencies
    if keyCompetencies.get('technicalSkills') or keyCompetencies.get('softSkills'):
        html += f"""
        <div class="section">
            <div class="section-title">Key Competencies</div>
            <div class="skills-list">
        """
        
        if keyCompetencies.get('technicalSkills'):
            html += "<strong>Technical Skills:</strong><br/>"
            for skill in keyCompetencies.get('technicalSkills', []):
                html += f'<div class="skills-item">• {skill}</div>'
        
        if keyCompetencies.get('softSkills'):
            html += "<br/><strong>Soft Skills:</strong><br/>"
            for skill in keyCompetencies.get('softSkills', []):
                html += f'<div class="skills-item">• {skill}</div>'
        
        html += "</div></div>"
    
    # Experience
    if experiences:
        html += """
        <div class="section">
            <div class="section-title">Professional Experience</div>
        """
        
        for exp in experiences:
            current = exp.get('isCurrent', False)
            end_date = "Present" if current else exp.get('endDate', '')
            
            html += f"""
            <div style="margin-bottom: 15px;">
                <p class="company-title">{exp.get('companyName', '')}</p>
                <p class="job-title">{exp.get('jobTitle', '')}</p>
                <p class="date-range">{exp.get('startDate', '')} - {end_date}</p>
                <div class="responsibilities">
                    {exp.get('responsibilities', '')}
                </div>
            </div>
            """
        
        html += "</div>"
    
    # Education
    if educations:
        html += """
        <div class="section">
            <div class="section-title">Education</div>
        """
        
        for edu in educations:
            html += f"""
            <div style="margin-bottom: 15px;">
                <p class="school-name">{edu.get('schoolName', '')}</p>
                <p class="degree">{edu.get('major', '')}</p>
                <p class="date-range">{edu.get('startDate', '')} - {edu.get('endDate', '')}</p>
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
            expiration = f" (Expires: {cert.get('expirationDate')})" if cert.get('expirationDate') else ""
            
            html += f"""
            <div style="margin-bottom: 10px;">
                <p><strong>{cert.get('name', '')}</strong> - {cert.get('institution', '')}</p>
                <p class="date-range">Acquired: {cert.get('dateAcquired', '')}{expiration}</p>
                {f'<p>{cert.get("achievements", "")}</p>' if cert.get('achievements') else ''}
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
    if additional.get('skills'):
        html += """
        <div class="section">
            <div class="section-title">Additional Skills</div>
            <div class="skills-list">
        """
        
        for skill in additional.get('skills', []):
            html += f'<div class="skills-item">• {skill}</div>'
        
        html += "</div></div>"
    
    html += """
    </body>
    </html>
    """
    
    return html

def generate_modern_template(cv_data):
    """Generate modern template HTML"""
    personal = cv_data.get('personal', {})
    summary = cv_data.get('summary', {})
    keyCompetencies = cv_data.get('keyCompetencies', {})
    experiences = cv_data.get('experiences', [])
    educations = cv_data.get('educations', [])
    certificates = cv_data.get('certificates', [])
    languages = cv_data.get('languages', [])
    additional = cv_data.get('additional', {})
    
    html = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 1cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 11pt;
                color: #333;
                line-height: 1.4;
                margin: 0;
                padding: 0;
            }}
            .header {{
                background-color: #03d27c;
                color: white;
                padding: 25px;
                margin-bottom: 20px;
            }}
            .name {{
                font-size: 24pt;
                font-weight: bold;
                margin: 0;
            }}
            .title {{
                font-size: 14pt;
                margin: 5px 0 10px 0;
                opacity: 0.9;
            }}
            .contact-info {{
                font-size: 10pt;
                opacity: 0.9;
            }}
            .main-content {{
                padding: 0 20px;
            }}
            .section {{
                margin-bottom: 20px;
            }}
            .section-title {{
                font-size: 14pt;
                font-weight: bold;
                color: #03d27c;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }}
            .section-title:before {{
                content: "";
                display: inline-block;
                width: 10px;
                height: 10px;
                background-color: #03d27c;
                margin-right: 10px;
            }}
            .company-title {{
                font-weight: bold;
                margin-bottom: 0;
                color: #043e44;
            }}
            .job-title {{
                font-weight: bold;
                color: #03d27c;
            }}
            .date-range {{
                font-size: 10pt;
                color: #666;
                margin-bottom: 5px;
            }}
            .responsibilities {{
                margin-top: 5px;
            }}
            .school-name {{
                font-weight: bold;
                color: #043e44;
            }}
            .degree {{
                font-weight: bold;
            }}
            .skills-list {{
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }}
            .skill-pill {{
                background-color: #eee;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 10pt;
            }}
            .language {{
                margin-bottom: 5px;
            }}
            .language-name {{
                font-weight: bold;
                color: #043e44;
            }}
            .language-level {{
                font-size: 10pt;
                color: #03d27c;
            }}
            .timeline-entry {{
                position: relative;
                padding-left: 20px;
                margin-bottom: 15px;
            }}
            .timeline-entry:before {{
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background-color: #eee;
            }}
            .timeline-entry:after {{
                content: "";
                position: absolute;
                left: -4px;
                top: 0;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #03d27c;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="name">{personal.get('firstName', '')} {personal.get('lastName', '')}</h1>
            <div class="title">{personal.get('professionalTitle', '')}</div>
            <div class="contact-info">
                {personal.get('email', '')} | {personal.get('phone', '')}
                {' | LinkedIn: ' + personal.get('linkedin', '') if personal.get('linkedin') else ''}
            </div>
        </div>
        
        <div class="main-content">
    """
    
    # Summary
    if summary.get('summary'):
        html += f"""
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>{summary.get('summary', '')}</p>
        </div>
        """
    
    # Experience
    if experiences:
        html += """
        <div class="section">
            <div class="section-title">Experience</div>
        """
        
        for exp in experiences:
            current = exp.get('isCurrent', False)
            end_date = "Present" if current else exp.get('endDate', '')
            
            html += f"""
            <div class="timeline-entry">
                <p class="company-title">{exp.get('companyName', '')}</p>
                <p class="job-title">{exp.get('jobTitle', '')}</p>
                <p class="date-range">{exp.get('startDate', '')} - {end_date}</p>
                <div class="responsibilities">
                    {exp.get('responsibilities', '')}
                </div>
            </div>
            """
        
        html += "</div>"
    
    # Education
    if educations:
        html += """
        <div class="section">
            <div class="section-title">Education</div>
        """
        
        for edu in educations:
            html += f"""
            <div class="timeline-entry">
                <p class="school-name">{edu.get('schoolName', '')}</p>
                <p class="degree">{edu.get('major', '')}</p>
                <p class="date-range">{edu.get('startDate', '')} - {edu.get('endDate', '')}</p>
                {f'<p>{edu.get("achievements", "")}</p>' if edu.get('achievements') else ''}
            </div>
            """
        
        html += "</div>"
    
    # Key Competencies
    if keyCompetencies.get('technicalSkills') or keyCompetencies.get('softSkills'):
        html += """
        <div class="section">
            <div class="section-title">Key Competencies</div>
        """
        
        if keyCompetencies.get('technicalSkills'):
            html += """
            <div style="margin-bottom: 10px;">
                <p style="color: #043e44; font-weight: bold;">Technical Skills</p>
                <div class="skills-list">
            """
            
            for skill in keyCompetencies.get('technicalSkills', []):
                html += f'<div class="skill-pill">{skill}</div>'
            
            html += "</div></div>"
        
        if keyCompetencies.get('softSkills'):
            html += """
            <div>
                <p style="color: #043e44; font-weight: bold;">Soft Skills</p>
                <div class="skills-list">
            """
            
            for skill in keyCompetencies.get('softSkills', []):
                html += f'<div class="skill-pill">{skill}</div>'
            
            html += "</div></div>"
        
        html += "</div>"
    
    # Two-column section for Certificates and Languages
    if certificates or languages:
        html += """
        <div class="section" style="display: flex; gap: 20px;">
        """
        
        # Certificates
        if certificates:
            html += """
            <div style="flex: 1;">
                <div class="section-title">Certifications</div>
            """
            
            for cert in certificates:
                expiration = f" (Expires: {cert.get('expirationDate')})" if cert.get('expirationDate') else ""
                
                html += f"""
                <div style="margin-bottom: 10px;">
                    <p><strong>{cert.get('name', '')}</strong></p>
                    <p style="margin: 0;">{cert.get('institution', '')}</p>
                    <p class="date-range" style="margin-top: 2px;">Acquired: {cert.get('dateAcquired', '')}{expiration}</p>
                </div>
                """
            
            html += "</div>"
        
        # Languages
        if languages:
            html += """
            <div style="flex: 1;">
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
        
        html += "</div>"
    
    # Additional Skills
    if additional.get('skills'):
        html += """
        <div class="section">
            <div class="section-title">Additional Skills</div>
            <div class="skills-list">
        """
        
        for skill in additional.get('skills', []):
            html += f'<div class="skill-pill">{skill}</div>'
        
        html += "</div></div>"
    
    html += """
        </div>
    </body>
    </html>
    """
    
    return html

def generate_minimal_template(cv_data):
    """Generate minimal template HTML"""
    personal = cv_data.get('personal', {})
    summary = cv_data.get('summary', {})
    keyCompetencies = cv_data.get('keyCompetencies', {})
    experiences = cv_data.get('experiences', [])
    educations = cv_data.get('educations', [])
    certificates = cv_data.get('certificates', [])
    languages = cv_data.get('languages', [])
    additional = cv_data.get('additional', {})
    
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
                font-family: Arial, sans-serif;
                font-size: 11pt;
                color: #333;
                line-height: 1.4;
                text-align: center;
            }}
            .header {{
                margin-bottom: 30px;
            }}
            .name {{
                font-size: 24pt;
                font-weight: bold;
                color: #043e44;
                margin: 0;
                letter-spacing: 2px;
            }}
            .title {{
                font-size: 14pt;
                color: #03d27c;
                margin: 5px 0 20px 0;
                font-weight: 300;
            }}
            .contact-info {{
                margin-bottom: 20px;
                font-size: 10pt;
            }}
            .section {{
                margin-bottom: 30px;
                text-align: left;
            }}
            .section-title {{
                font-size: 12pt;
                font-weight: bold;
                color: #043e44;
                text-align: center;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .section-title:after {{
                content: "";
                display: block;
                width: 50px;
                height: 1px;
                background-color: #03d27c;
                margin: 5px auto 15px;
            }}
            .entry {{
                margin-bottom: 20px;
            }}
            .entry-header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 5px;
            }}
            .entry-title {{
                font-weight: bold;
                margin: 0;
            }}
            .entry-subtitle {{
                font-style: italic;
                margin: 0;
            }}
            .date-range {{
                font-size: 10pt;
                color: #666;
                text-align: right;
            }}
            .skills-grid {{
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
            }}
            .skill-pill {{
                background-color: #f5f5f5;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 10pt;
                border: 1px solid #eee;
            }}
            .divider {{
                height: 1px;
                background-color: #eee;
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="name">{personal.get('firstName', '')} {personal.get('lastName', '')}</h1>
            <div class="title">{personal.get('professionalTitle', '')}</div>
            <div class="contact-info">
                {personal.get('email', '')} | {personal.get('phone', '')}
                {' | LinkedIn: ' + personal.get('linkedin', '') if personal.get('linkedin') else ''}
            </div>
        </div>
    """
    
    # Summary
    if summary.get('summary'):
        html += f"""
        <div class="section">
            <div class="section-title">Profile</div>
            <p style="text-align: center; max-width: 600px; margin: 0 auto;">
                {summary.get('summary', '')}
            </p>
        </div>
        <div class="divider"></div>
        """
    
    # Experience
    if experiences:
        html += """
        <div class="section">
            <div class="section-title">Experience</div>
        """
        
        for exp in experiences:
            current = exp.get('isCurrent', False)
            end_date = "Present" if current else exp.get('endDate', '')
            
            html += f"""
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <p class="entry-title">{exp.get('companyName', '')}</p>
                        <p class="entry-subtitle">{exp.get('jobTitle', '')}</p>
                    </div>
                    <p class="date-range">{exp.get('startDate', '')} - {end_date}</p>
                </div>
                <div>
                    {exp.get('responsibilities', '')}
                </div>
            </div>
            """
        
        html += "</div>"
    
    # Education
    if educations:
        html += """
        <div class="divider"></div>
        <div class="section">
            <div class="section-title">Education</div>
        """
        
        for edu in educations:
            html += f"""
            <div class="entry">
                <div class="entry-header">
                    <div>
                        <p class="entry-title">{edu.get('schoolName', '')}</p>
                        <p class="entry-subtitle">{edu.get('major', '')}</p>
                    </div>
                    <p class="date-range">{edu.get('startDate', '')} - {edu.get('endDate', '')}</p>
                </div>
                {f'<p>{edu.get("achievements", "")}</p>' if edu.get('achievements') else ''}
            </div>
            """
        
        html += "</div>"
    
    # Skills - combining all skills into one section
    all_skills = []
    if keyCompetencies.get('technicalSkills'):
        all_skills.extend(keyCompetencies.get('technicalSkills', []))
    if keyCompetencies.get('softSkills'):
        all_skills.extend(keyCompetencies.get('softSkills', []))
    if additional.get('skills'):
        all_skills.extend(additional.get('skills', []))
    
    if all_skills:
        html += """
        <div class="divider"></div>
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
        """
        
        for skill in all_skills:
            html += f'<div class="skill-pill">{skill}</div>'
        
        html += "</div></div>"
    
    # Languages
    if languages:
        html += """
        <div class="divider"></div>
        <div class="section">
            <div class="section-title">Languages</div>
            <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px;">
        """
        
        for lang in languages:
            html += f"""
            <div style="margin-bottom: 5px; text-align: center;">
                <p style="margin: 0;"><strong>{lang.get('name', '')}</strong></p>
                <p style="margin: 0; font-size: 10pt; color: #666;">{lang.get('proficiency', '').capitalize()}</p>
            </div>
            """
        
        html += "</div></div>"
    
    # Certificates
    if certificates:
        html += """
        <div class="divider"></div>
        <div class="section">
            <div class="section-title">Certifications</div>
        """
        
        for cert in certificates:
            expiration = f" (Expires: {cert.get('expirationDate')})" if cert.get('expirationDate') else ""
            
            html += f"""
            <div class="entry" style="text-align: center;">
                <p style="margin: 0;"><strong>{cert.get('name', '')}</strong></p>
                <p style="margin: 0; font-style: italic;">{cert.get('institution', '')}</p>
                <p style="margin: 5px 0; font-size: 10pt; color: #666;">Acquired: {cert.get('dateAcquired', '')}{expiration}</p>
                {f'<p>{cert.get("achievements", "")}</p>' if cert.get('achievements') else ''}
            </div>
            """
        
        html += "</div>"
    
    html += """
    </body>
    </html>
    """
    
    return html

# For command-line usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python pdf-generator.py <json_file> [template_style]")
        sys.exit(1)
    
    # Read JSON data from file
    with open(sys.argv[1], 'r') as f:
        json_data = json.load(f)
    
    # Get template style
    template_style = sys.argv[2] if len(sys.argv) > 2 else 'professional'
    
    # Generate PDF
    success, pdf_path = generate_cv_pdf(json_data, template_style)
    
    if success:
        print(f"PDF generated successfully: {pdf_path}")
    else:
        print(f"Failed to generate PDF: {pdf_path}")