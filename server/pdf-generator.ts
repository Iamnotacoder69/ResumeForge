import CloudConvert from 'cloudconvert';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Initialize CloudConvert with API key
if (!process.env.CLOUDCONVERT_API_KEY) {
  throw new Error('CLOUDCONVERT_API_KEY is not defined in environment variables');
}
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

/**
 * Generates a PDF from HTML content using CloudConvert
 * @param html HTML content to convert to PDF
 * @param options PDF generation options
 * @returns Buffer containing the PDF data
 */
export async function generatePDFFromHTML(
  html: string, 
  options: {
    pageSize?: string;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    filename?: string;
  } = {}
): Promise<Buffer> {
  try {
    // Create a temporary file with the HTML content
    const tempId = uuidv4();
    const htmlFilePath = path.join(process.cwd(), `temp/${tempId}.html`);
    const pdfFilePath = path.join(process.cwd(), `temp/${tempId}.pdf`);
    
    // Ensure temp directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });
    }
    
    // Write HTML to temp file
    await writeFileAsync(htmlFilePath, html);
    
    // Configure CloudConvert job using simpler format
    console.log('Creating CloudConvert job for HTML to PDF conversion');
    
    const job = await cloudConvert.jobs.create({
      tasks: [
        {
          name: 'import-html',
          operation: 'import/upload'
        },
        {
          name: 'convert-to-pdf',
          operation: 'convert',
          input: 'import-html',
          output_format: 'pdf',
          engine: 'chrome',
          input_format: 'html',
          filename: options.filename || 'cv.pdf',
          zoom: 1,
          print_background: true
        },
        {
          name: 'export-pdf',
          operation: 'export/url',
          input: 'convert-to-pdf',
          archive_multiple_files: false
        }
      ],
      tag: 'cv-generator'
    });
    
    // Upload the HTML file
    const uploadTask = job.tasks.filter(task => task.name === 'import-html')[0];
    const inputFile = fs.createReadStream(htmlFilePath);
    
    await cloudConvert.tasks.upload(uploadTask, inputFile);
    
    // Wait for the job to finish
    const jobWaitResult = await cloudConvert.jobs.wait(job.id);
    
    // Get the export task and URL to download the PDF
    const exportTask = jobWaitResult.tasks.filter(task => task.name === 'export-pdf')[0];
    if (!exportTask || !exportTask.result || !exportTask.result.files || !exportTask.result.files.length) {
      throw new Error('PDF generation failed: Export task did not produce any files');
    }
    
    const file = exportTask.result.files[0];
    
    // Download the PDF file
    const writeStream = fs.createWriteStream(pdfFilePath);
    
    // Use the cloudconvert API to download the file
    await (cloudConvert as any).files.download(file.url, writeStream);
    
    // Wait for download to complete
    await new Promise<void>(resolve => {
      writeStream.on('finish', () => resolve());
    });
    
    // Read the PDF file
    const pdfBuffer = await readFileAsync(pdfFilePath);
    
    // Clean up temporary files
    await Promise.all([
      unlinkAsync(htmlFilePath),
      unlinkAsync(pdfFilePath)
    ]);
    
    return pdfBuffer;
  } catch (error: any) {
    console.error('Error generating PDF with CloudConvert:', error);
    
    // Try to extract more detailed error information
    if (error.cause && error.cause.json) {
      try {
        const jsonResponse = await error.cause.json();
        console.error('CloudConvert API error details:', jsonResponse);
        throw new Error(`Failed to generate PDF: ${jsonResponse.message || error?.message || 'Unknown error'}`);
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
      }
    }
    
    throw new Error(`Failed to generate PDF: ${error?.message || 'Unknown error'}`);
  }
}