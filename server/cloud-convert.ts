import CloudConvert from 'cloudconvert';

// Initialize the CloudConvert SDK
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

/**
 * Create a CloudConvert job to convert HTML to PDF
 * @param renderUrl URL of the HTML that should be converted to PDF
 * @returns Object with status and download URL or error
 */
export async function createHtmlToPdfJob(renderUrl: string) {
  try {
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

    // Wait for job completion
    const jobResult = await cloudConvert.jobs.wait(job.id);

    // Find the export task to get the file URL
    const exportTask = jobResult.tasks.find(task => task.operation === 'export/url');
    
    if (!exportTask || exportTask.status !== 'finished') {
      throw new Error('Export task failed or not found');
    }

    // Get the file URL
    const file = exportTask.result.files[0];
    
    return {
      success: true,
      downloadUrl: file.url,
      fileName: file.filename
    };
  } catch (error) {
    console.error('CloudConvert job failed:', error);
    return {
      success: false,
      error: error.message || 'PDF conversion failed'
    };
  }
}