import { Converter } from 'pdf2docx';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

/**
 * Convert a PDF file to DOCX format
 * @param pdfPath Path to the PDF file
 * @returns Path to the converted DOCX file
 */
export async function convertPdfToDocx(pdfPath: string): Promise<string> {
  try {
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!await existsAsync(tempDir)) {
      await mkdirAsync(tempDir, { recursive: true });
    }

    // Create output file path
    const outputFilename = path.basename(pdfPath, '.pdf') + '.docx';
    const outputPath = path.join(tempDir, outputFilename);

    // Set up the converter
    const converter = new Converter(pdfPath);
    
    // Convert the file
    console.log(`Converting PDF to DOCX: ${pdfPath} -> ${outputPath}`);
    await converter.convert(outputPath, {
      pagesToConvert: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Default to first 10 pages for speed
    });
    
    // Close the converter
    await converter.close();
    
    console.log('PDF to DOCX conversion completed successfully');
    return outputPath;
  } catch (error) {
    console.error('Error converting PDF to DOCX:', error);
    throw new Error(`Failed to convert PDF to DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}