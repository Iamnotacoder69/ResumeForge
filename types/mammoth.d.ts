declare module 'mammoth' {
  interface MammothOptions {
    path?: string;
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
    transformDocument?: any;
  }

  interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      error?: Error;
    }>;
  }

  function extractRawText(options: MammothOptions): Promise<MammothResult>;
  function convertToHtml(options: MammothOptions): Promise<MammothResult>;

  namespace transforms {
    function paragraph(transformer: (paragraph: any) => any): any;
  }

  export { extractRawText, convertToHtml, transforms };
}