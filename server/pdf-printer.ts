import { chromium } from 'playwright';
import { CompleteCV } from '@shared/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Temporary directory for storing HTML files
const TMP_DIR = path.join(os.tmpdir(), 'cv-generator');

// Ensure the temp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Generate a PDF from a CV HTML page using Playwright
 * @param htmlContent The HTML content to print as PDF
 * @param data CV data (for filename)
 * @returns Buffer containing the PDF data
 */
export async function generatePDF(htmlContent: string, data: CompleteCV): Promise<Buffer> {
  // Create a unique ID for this PDF generation
  const id = Date.now().toString();
  const tempHtmlPath = path.join(TMP_DIR, `cv-${id}.html`);
  
  // Extract styles from HTML content (if any)
  let extractedStyles = '';
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  if (styleMatch && styleMatch[1]) {
    extractedStyles = styleMatch[1];
  }
  
  // Add base styling to ensure proper printing
  const fullHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${data.personal.firstName} ${data.personal.lastName} - CV</title>
      <style>
        @page {
          margin: 10mm;
          size: A4;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
          color: #333;
          background: white;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        ${extractedStyles}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
  
  // Write HTML content to temp file
  fs.writeFileSync(tempHtmlPath, fullHtmlContent);
  
  let browser;
  try {
    // Launch headless browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 }
    });
    const page = await context.newPage();
    
    // Navigate to the HTML file
    await page.goto(`file://${tempHtmlPath}`);
    
    // Wait for any potential JS to execute and images to load
    await page.waitForLoadState('networkidle');
    
    // Print to PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    // Cleanup
    await browser.close();
    fs.unlinkSync(tempHtmlPath);
    
    return pdfBuffer;
  } catch (error) {
    // Cleanup in case of error
    if (browser) await browser.close();
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    
    console.error('Error generating PDF with Playwright:', error);
    throw error;
  }
}