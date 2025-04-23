import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Create a temporary directory for file processing
const tempDir = path.join(os.tmpdir(), 'cv-uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Convert PDF to text using pdftotext (from poppler-utils)
async function convertPdfToText(filePath: string): Promise<string> {
  const outputPath = `${filePath}.txt`;
  
  try {
    // Use pdftotext command from poppler-utils
    await execAsync(`pdftotext -layout "${filePath}" "${outputPath}"`);
    const textContent = fs.readFileSync(outputPath, 'utf8');
    
    // Cleanup temporary files
    fs.unlinkSync(outputPath);
    
    return textContent;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert PDF to text');
  }
}

// Convert DOCX to text using textract
async function convertDocxToText(filePath: string): Promise<string> {
  try {
    // Use cat for very basic extraction (this would be replaced with docx2txt or similar in production)
    const { stdout } = await execAsync(`cat "${filePath}"`);
    
    // In a real implementation, you would use a proper docx parser library
    // For example: npm install docx-parser or mammoth.js
    // Since this is a prototype and we want to keep dependencies minimal,
    // we'll use this placeholder and recommend proper implementation
    
    return stdout || 'DOCX extraction not fully implemented. Please use PDF for better results.';
  } catch (error) {
    console.error('DOCX conversion error:', error);
    throw new Error('Failed to convert DOCX to text');
  }
}

export async function processUploadedCV(file: Express.Multer.File): Promise<{ textContent: string }> {
  try {
    // Save file to temp location
    const tempFilePath = path.join(tempDir, file.originalname);
    fs.writeFileSync(tempFilePath, file.buffer);

    let textContent = '';
    
    // Process based on file type
    if (file.mimetype === 'application/pdf') {
      textContent = await convertPdfToText(tempFilePath);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      textContent = await convertDocxToText(tempFilePath);
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Cleanup
    fs.unlinkSync(tempFilePath);
    
    return { textContent };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}