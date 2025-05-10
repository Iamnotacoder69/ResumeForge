declare module 'wkhtmltopdf' {
  interface WkhtmltopdfOptions {
    output?: string;
    pageSize?: string;
    orientation?: 'Portrait' | 'Landscape';
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    enableSmartShrinking?: boolean;
    printMediaType?: boolean;
    noBackground?: boolean;
    enableLocalFileAccess?: boolean;
    disableJavascript?: boolean;
    javascriptDelay?: number;
    [key: string]: any;
  }
  
  function wkhtmltopdf(input: string | Buffer | NodeJS.ReadableStream, options?: WkhtmltopdfOptions, callback?: (err: Error) => void): NodeJS.ReadableStream;
  function wkhtmltopdf(input: string | Buffer | NodeJS.ReadableStream, callback?: (err: Error) => void): NodeJS.ReadableStream;
  
  namespace wkhtmltopdf {
    let command: string;
    function shell(path: string): string;
  }
  
  export default wkhtmltopdf;
}

declare module 'wkhtmltopdf-installer' {
  const path: string;
  export default { path };
}