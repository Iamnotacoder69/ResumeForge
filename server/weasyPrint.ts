import { CompleteCV } from "@shared/types";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Generates a PDF document from CV data using WeasyPrint
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDFWithWeasyPrint(data: CompleteCV): Promise<Buffer> {
  console.log("Generating PDF with WeasyPrint...");
  
  // Save the CV data to a temporary JSON file
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const jsonFilePath = path.join(tempDir, `cv_data_${Date.now()}.json`);
  const pdfFilePath = path.join(tempDir, `cv_${Date.now()}.pdf`);
  
  try {
    // Write CV data to temporary JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(data));
    console.log(`CV data written to ${jsonFilePath}`);
    
    // Run the Python script to generate the PDF
    const scriptPath = path.join(__dirname, "weasy_pdf.py");
    
    // Get the template name from the data or use default
    const templateName = data.templateSettings?.template || "professional";
    
    // Execute the Python script to generate the PDF
    return new Promise<Buffer>((resolve, reject) => {
      const pythonProcess = spawn("python3", [
        scriptPath,
        jsonFilePath,
        pdfFilePath,
        templateName
      ]);
      
      let outputData = "";
      let errorData = "";
      
      pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString();
        console.log(`WeasyPrint output: ${data.toString()}`);
      });
      
      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
        console.error(`WeasyPrint error: ${data.toString()}`);
      });
      
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`WeasyPrint process exited with code ${code}`);
          console.error(`Error output: ${errorData}`);
          return reject(new Error(`PDF generation failed with code ${code}: ${errorData}`));
        }
        
        // Read the generated PDF file
        try {
          const pdfBuffer = fs.readFileSync(pdfFilePath);
          console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
          resolve(pdfBuffer);
        } catch (readError) {
          console.error("Failed to read generated PDF:", readError);
          reject(readError);
        } finally {
          // Clean up temporary files
          try {
            fs.unlinkSync(jsonFilePath);
            fs.unlinkSync(pdfFilePath);
          } catch (cleanupError) {
            console.warn("Failed to clean up temporary files:", cleanupError);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error in WeasyPrint PDF generation:", error);
    // Clean up temp files if they exist
    try {
      if (fs.existsSync(jsonFilePath)) fs.unlinkSync(jsonFilePath);
      if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
    } catch (cleanupError) {
      console.warn("Failed to clean up temporary files:", cleanupError);
    }
    throw error;
  }
}