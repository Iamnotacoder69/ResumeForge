import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { log } from './vite';

/**
 * Run a Python script with JSON data as input and get the PDF path as output
 * 
 * @param scriptPath Path to the Python script
 * @param jsonData JSON data to pass to the script
 * @param templateStyle Template style to use (professional, modern, minimal)
 * @returns Promise that resolves to the PDF path
 */
export async function generatePdfWithPython(
  jsonData: any, 
  templateStyle: 'professional' | 'modern' | 'minimal' = 'professional'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure the generated-pdfs directory exists
      const pdfDir = path.join(process.cwd(), 'generated-pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Create a temporary JSON file
      const tempJsonPath = path.join(pdfDir, `temp-${Date.now()}.json`);
      fs.writeFileSync(tempJsonPath, JSON.stringify(jsonData, null, 2));

      // Path to the Python script
      const scriptPath = path.join(process.cwd(), 'server', 'new-pdf-generator.py');

      // Spawn the Python process
      const pythonProcess = spawn('python3', [scriptPath, tempJsonPath, templateStyle]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temporary JSON file
        if (fs.existsSync(tempJsonPath)) {
          fs.unlinkSync(tempJsonPath);
        }

        if (code !== 0) {
          log(`Python process exited with code ${code}: ${stderr}`, 'python-utils');
          reject(new Error(`PDF generation failed: ${stderr}`));
          return;
        }

        // Parse the output to get the PDF path
        const match = stdout.match(/PDF generated successfully: (.+)/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject(new Error('Failed to extract PDF path from output'));
        }
      });

      pythonProcess.on('error', (error) => {
        log(`Error running Python script: ${error.message}`, 'python-utils');
        reject(error);
      });
    } catch (error) {
      log(`Exception in generatePdfWithPython: ${error}`, 'python-utils');
      reject(error);
    }
  });
}