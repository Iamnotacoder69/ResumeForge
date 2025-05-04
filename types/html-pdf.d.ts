declare module 'html-pdf' {
  interface HtmlPdfOptions {
    format?: string;
    orientation?: 'portrait' | 'landscape';
    border?: string | { top?: string; right?: string; bottom?: string; left?: string };
    header?: { height?: string; contents?: string };
    footer?: { height?: string; contents?: string };
    type?: 'pdf' | 'png' | 'jpeg';
    quality?: number;
    renderDelay?: number;
    zoomFactor?: number;
    base?: string;
    [key: string]: any;
  }

  interface HtmlPdf {
    create(html: string, options?: HtmlPdfOptions): HtmlPdfResult;
  }

  interface HtmlPdfResult {
    toFile(filePath: string, callback: (error: Error | null, res: any) => void): void;
    toBuffer(callback: (error: Error | null, buffer: Buffer) => void): void;
    toStream(callback: (error: Error | null, stream: NodeJS.ReadableStream) => void): void;
  }

  const htmlPdf: HtmlPdf;
  export = htmlPdf;
}