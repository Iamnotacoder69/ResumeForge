declare module 'pdf-parse' {
  export interface PDFResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }
  
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFResult>;
  export default pdfParse;
}