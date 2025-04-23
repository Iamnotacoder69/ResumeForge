declare module 'mammoth' {
  interface MammothOptions {
    path?: string;
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
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

  export { extractRawText, convertToHtml };
}