declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ImageElement {
    contentType: string;
    read: (encoding?: string) => Promise<Buffer | string>;
  }

  export interface ConvertOptions {
    convertImage?: (element: ImageElement) => Promise<{ src: string } | Record<string, unknown>>;
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
  }

  export function convertToHtml(
    input: { buffer: Buffer } | { path: string },
    options?: ConvertOptions
  ): Promise<ConversionResult>;

  export function extractRawText(
    input: { buffer: Buffer } | { path: string }
  ): Promise<ConversionResult>;
}
