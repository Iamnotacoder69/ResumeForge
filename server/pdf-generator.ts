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
    
    // Configure CloudConvert job
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-html': {
          operation: 'import/upload'
        },
        'convert-to-pdf': {
          operation: 'convert',
          input: 'import-html',
          output_format: 'pdf',
          engine: 'chromium',
          input_format: 'html',
          page_width: options.pageSize || '8.27in', // A4 width
          page_height: options.pageSize || '11.7in', // A4 height
          margin_top: options.margin?.top || '0.5in',
          margin_right: options.margin?.right || '0.5in',
          margin_bottom: options.margin?.bottom || '0.5in',
          margin_left: options.margin?.left || '0.5in',
          filename: options.filename || 'cv.pdf',
          print_background: true
        },
        'export-pdf': {
          operation: 'export/url',
          input: 'convert-to-pdf',
          archive_multiple_files: false
        }
      },
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
    throw new Error(`Failed to generate PDF: ${error?.message || 'Unknown error'}`);
  }
}