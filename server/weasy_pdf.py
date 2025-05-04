"""
WeasyPrint PDF generation module for CV builder
"""
import os
import sys
import json
import base64
from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from typing import Dict, Any

# Get the current directory path where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(SCRIPT_DIR, 'templates')

# Create Jinja2 environment
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

def format_date(date_str, is_current=False):
    """Format date string for display in the CV"""
    if is_current:
        return 'Present'
    if not date_str:
        return ''
    try:
        # Handle different types of input
        if isinstance(date_str, str):
            date_str = date_str.strip()
            if not date_str:  # If it's just whitespace
                return ''
        else:
            # If it's not a string and not None (already checked above)
            # Try to convert it to string
            try:
                date_str = str(date_str).strip()
                if not date_str:
                    return ''
            except:
                return ''
        
        # Try to parse the date
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%b %Y')  # Format as 'Mar 2023'
    except (ValueError, TypeError, AttributeError):
        # Return a cleaned string if parsing fails
        try:
            return str(date_str).strip() if date_str else ''
        except:
            return ''

def prepare_image_for_template(photo_url):
    """Convert image URL/base64 to a format usable in templates"""
    if not photo_url:
        return None
        
    # Check if it's already a base64 encoded image
    if photo_url.startswith('data:image'):
        return photo_url
        
    # If it's a file path, convert to base64
    try:
        if os.path.exists(photo_url):
            with open(photo_url, 'rb') as img_file:
                encoded_img = base64.b64encode(img_file.read()).decode('utf-8')
                img_type = photo_url.split('.')[-1].lower()
                if img_type == 'jpg':
                    img_type = 'jpeg'
                return f'data:image/{img_type};base64,{encoded_img}'
    except:
        pass
        
    # If it's a URL, return as is (will be fetched by browser)
    return photo_url

def generate_pdf(data, template_name='professional'):
    """
    Generate PDF from CV data using WeasyPrint
    
    Args:
        data: The CompleteCV data object
        template_name: Name of the template to use
        
    Returns:
        PDF document as bytes
    """
    # Add additional data processing for templates
    context = {
        'cv': data,
        'format_date': format_date,
        'now': datetime.now().strftime('%B %d, %Y')
    }
    
    # Process photo if it exists
    if data.get('personal', {}).get('photoUrl'):
        context['photo_url'] = prepare_image_for_template(data['personal']['photoUrl'])
    
    # Get template
    template = env.get_template(f'{template_name}.html')
    
    # Render HTML
    html_content = template.render(**context)
    
    # Get template-specific CSS
    css_path = os.path.join(TEMPLATES_DIR, f'{template_name}.css')
    css = None
    if os.path.exists(css_path):
        css = CSS(filename=css_path)
    
    # Create PDF
    html = HTML(string=html_content)
    if css:
        pdf = html.write_pdf(stylesheets=[css])
    else:
        pdf = html.write_pdf()
    
    return pdf

# Command-line interface
if __name__ == "__main__":
    # Check if the correct number of arguments is provided
    if len(sys.argv) < 3:
        print("Usage: python weasy_pdf.py <input_json_file> <output_pdf_file> [template_name]")
        sys.exit(1)
    
    # Parse command-line arguments
    input_json_file = sys.argv[1]
    output_pdf_file = sys.argv[2]
    template_name = sys.argv[3] if len(sys.argv) > 3 else 'professional'
    
    try:
        # Read JSON data from input file
        with open(input_json_file, 'r') as f:
            data = json.load(f)
        
        # Generate PDF
        pdf_content = generate_pdf(data, template_name)
        
        # Write PDF content to output file
        with open(output_pdf_file, 'wb') as f:
            f.write(pdf_content)
        
        print(f"PDF generated successfully and saved to {output_pdf_file}")
        sys.exit(0)
    except Exception as e:
        print(f"Error generating PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)