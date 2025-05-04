declare module 'html-pdf' {
  interface PdfOptions {
    /** Type of the export: png, jpeg or pdf. Default: pdf */
    type?: 'png' | 'jpeg' | 'pdf';
    /** The quality of the image if type is jpeg. Default: 75 */
    quality?: number;
    /** Format of the PDF. Default: A4 */
    format?: string;
    /** Orientation of the PDF. Default: portrait */
    orientation?: 'portrait' | 'landscape';
    /** Page width and height in mm, respective to orientation if format is set to 'custom'. Default: null */
    width?: string;
    height?: string;
    /** Bottom, left, right and top margin in mm. Default: 0 */
    border?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    /** File path where to save the PDF. If not specified, the PDF is returned as Buffer. */
    path?: string;
    /** Delay in ms before rendering. Default: 0 */
    delay?: number;
    /** Wait for window.status to equal the passed string before rendering. Default: '' */
    renderDelay?: number;
    /** The header to print on every page. */
    header?: {
      height?: string;
      contents?: string;
    };
    /** The footer to print on every page. */
    footer?: {
      height?: string;
      contents?: string;
    };
    /** PhantomJS execution timeout. Default: 30000 */
    timeout?: number;
    /** CSS styles to inject into the html. */
    base?: string;
    /** Zoom factor to apply when rendering. Default: 1 */
    zoomFactor?: number;
    /** PhantomJS script execution options. */
    script?: string;
    /** Run Phantom in debug mode. */
    debug?: boolean;
    /** The primary browser window dimensions in pixels. Default: 0x0 */
    httpHeaders?: Record<string, string>;
    /** Enables javascript in the html. Default: true */
    js?: boolean;
    /** Allows local file access from the html. Default: false */
    localToRemoteUrlAccessEnabled?: boolean;
    /** Loads remote content specified to the html. Default: false */
    javascriptEnabled?: boolean;
    /** Loads external inlined images. Default: false */
    loadImages?: boolean;
    /** See phantomjs API. Default: [] */
    phantomArgs?: string[];
    /** See phantomjs API. Default: null */
    phantomPath?: string;
    /** See phantomjs API. Default: null */
    phantomPages?: any;
    /** html2canvas compatibility mode. Default: false */
    captureAsImages?: boolean;
    /** Show or hide warning/error logs from phantom stderr */
    silent?: boolean;
  }

  interface PDF {
    toBuffer(callback: (err: Error | null, buffer: Buffer) => void): void;
    toStream(callback: (err: Error | null, stream: NodeJS.ReadableStream) => void): void;
    toFile(filename: string, callback: (err: Error | null, filename: string) => void): void;
  }

  interface HtmlPdf {
    create(html: string, options?: PdfOptions): PDF;
    create(html: string, options: PdfOptions, callback: (err: Error | null, pdf: PDF) => void): void;
  }

  const pdf: HtmlPdf;
  export = pdf;
}