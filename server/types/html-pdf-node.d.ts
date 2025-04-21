declare module 'html-pdf-node' {
  interface PDFOptions {
    format?: string;
    path?: string;
    width?: number | string;
    height?: number | string;
    margin?: {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    };
    printBackground?: boolean;
    landscape?: boolean;
    scale?: number;
    args?: string[];
    timeout?: number;
  }

  interface File {
    content?: string;
    url?: string;
    path?: string;
  }

  export function generatePdf(file: File, options: PDFOptions): Promise<Buffer>;
}