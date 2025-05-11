#!/usr/bin/env python3
"""
PDF Generator script using WeasyPrint
This script converts HTML to PDF with proper CSS styling
"""

import sys
import json
import base64
import tempfile
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

def html_to_pdf(html_content, css_content=None, output_path=None):
    """
    Convert HTML content to PDF using WeasyPrint
    
    Args:
        html_content (str): HTML content to convert
        css_content (str, optional): Additional CSS content
        output_path (str, optional): Path to save the PDF, if not provided returns base64 content
        
    Returns:
        str: Base64 encoded PDF or None if output_path is provided
    """
    try:
        # Configure fonts
        font_config = FontConfiguration()
        
        # Create temporary file for HTML content if needed
        if html_content.startswith('<!DOCTYPE') or html_content.startswith('<html'):
            with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as f:
                f.write(html_content.encode('utf-8'))
                html_path = f.name
            html = HTML(filename=html_path)
        else:
            # Assume it's either a file path or URL
            html = HTML(string=html_content)
        
        # Apply CSS if provided
        stylesheets = []
        if css_content:
            stylesheets.append(CSS(string=css_content, font_config=font_config))
        
        # Generate PDF
        if output_path:
            html.write_pdf(output_path, stylesheets=stylesheets, font_config=font_config)
            return {"success": True, "file_path": output_path}
        else:
            pdf_bytes = html.write_pdf(stylesheets=stylesheets, font_config=font_config)
            # Ensure pdf_bytes is not None before encoding
            if pdf_bytes:
                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            else:
                raise Exception("Failed to generate PDF: Empty output")
            return {"success": True, "pdf_base64": pdf_base64}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    # This script can be called from Node.js via child_process
    try:
        # Read input JSON from stdin
        input_json = json.loads(sys.stdin.read())
        html_content = input_json.get('html')
        css_content = input_json.get('css')
        output_path = input_json.get('output_path')
        
        result = html_to_pdf(html_content, css_content, output_path)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))