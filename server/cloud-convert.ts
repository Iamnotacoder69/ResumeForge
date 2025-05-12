import CloudConvert from 'cloudconvert';

// Check if CloudConvert API key is available
if (!process.env.CLOUDCONVERT_API_KEY) {
  console.warn('CloudConvert API key not found. PDF generation via CloudConvert will not work.');
}

// Initialize the CloudConvert SDK
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'dummy-key-for-type-checking');

/**
 * Create a CloudConvert job to convert HTML to PDF
 * @param renderUrl URL of the HTML that should be converted to PDF
 * @returns Object with status and download URL or error
 */
export async function createHtmlToPdfJob(renderUrl: string) {
  try {
    console.log('Creating CloudConvert job for render URL:', renderUrl);
    
    // Create a job with import, convert, and export tasks
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-url': {
          operation: 'import/url',
          url: renderUrl,
          filename: 'cv.html'
        },
        'convert-to-pdf': {
          operation: 'convert',
          input: 'import-url',
          output_format: 'pdf',
          engine: 'chrome',
          input_format: 'html',
          page_width: 210, // A4 width in mm
          page_height: 297, // A4 height in mm
          margin_top: 0,
          margin_bottom: 0,
          margin_left: 0,
          margin_right: 0,
          print_background: true,
          display_header_footer: false,
          wait_until: 'networkidle0',
          wait_time: 2000, // 2 seconds to ensure all resources are loaded
          scale: 1.0
        },
        'export-result': {
          operation: 'export/url',
          input: 'convert-to-pdf'
        }
      }
    });
    
    console.log('CloudConvert job created with ID:', job.id);

    // Wait for job completion
    console.log('Waiting for CloudConvert job to complete...');
    const jobResult = await cloudConvert.jobs.wait(job.id);

    // Log the job result for debugging
    console.log('CloudConvert job result:', JSON.stringify(jobResult, null, 2));
    
    // Find the export task to get the file URL
    const exportTask = jobResult.tasks.find(task => task.operation === 'export/url');
    
    if (!exportTask) {
      console.error('Export task not found in job result.');
      throw new Error('Export task not found');
    }
    
    if (exportTask.status !== 'finished') {
      console.error('Export task status is not finished:', exportTask.status);
      console.error('Export task details:', JSON.stringify(exportTask, null, 2));
      throw new Error(`Export task failed with status: ${exportTask.status}`);
    }

    // Get the file URL
    if (!exportTask.result || !exportTask.result.files || !exportTask.result.files.length) {
      console.error('No files found in export task result:', JSON.stringify(exportTask.result, null, 2));
      throw new Error('No files found in export task result');
    }
    
    const file = exportTask.result.files[0];
    console.log('PDF file generated successfully:', file.url);
    
    return {
      success: true,
      downloadUrl: file.url,
      fileName: file.filename
    };
  } catch (error) {
    console.error('CloudConvert job failed:', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'PDF conversion failed';
    return {
      success: false,
      error: errorMessage
    };
  }
}