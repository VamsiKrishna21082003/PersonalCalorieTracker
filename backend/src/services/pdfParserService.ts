import { PDFParse } from 'pdf-parse';

export interface PDFParseResult {
  text: string;
  pageCount: number;
}

/**
 * pdf-parse v2 exposes a class-based API.
 * This wrapper keeps parser lifecycle handling in one place.
 */
const parsePDFText = async (buffer: Buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    return await parser.getText();
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

/**
 * Validates PDF buffer before parsing
 */
const validatePDFBuffer = (buffer: Buffer): void => {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF buffer is empty or invalid');
  }

  // Check PDF magic number (%PDF)
  const pdfHeader = buffer.slice(0, 4).toString('ascii');
  if (pdfHeader !== '%PDF') {
    throw new Error('File does not appear to be a valid PDF. Missing PDF header.');
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('PDF file is too large (maximum 10MB allowed)');
  }
};

/**
 * Extracts text content from PDF buffer
 * @param buffer PDF file buffer
 * @returns Extracted text and metadata
 */
export const extractTextFromPDF = async (buffer: Buffer): Promise<PDFParseResult> => {
  try {
    // Validate buffer
    validatePDFBuffer(buffer);

    console.log(`Extracting text from PDF (size: ${buffer.length} bytes)`);

    // Parse PDF
    let data;
    try {
      data = await parsePDFText(buffer);
    } catch (parseError: any) {
      console.error('pdf-parse library error:', parseError);
      if (parseError.message?.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF.');
      } else if (parseError.message?.includes('corrupted') || parseError.message?.includes('damaged')) {
        throw new Error('PDF file appears to be corrupted or damaged. Please try a different file.');
      } else {
        throw new Error(`PDF parsing failed: ${parseError.message || 'Unknown error'}`);
      }
    }

    if (!data || !data.text) {
      throw new Error('PDF file does not contain extractable text. The PDF may be image-based or encrypted.');
    }

    const text = data.text.trim();
    console.log(`Extracted ${text.length} characters from PDF (${data.total || data.pages?.length || 0} pages)`);

    if (text.length < 10) {
      throw new Error('PDF contains very little text. Unable to extract nutrition data.');
    }

    return {
      text,
      pageCount: data.total || data.pages?.length || 0,
    };
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    
    // Re-throw with more context if it's our custom error
    if (error.message && !error.message.includes('PDF text extraction error')) {
      throw error;
    }
    
    // Otherwise provide a more helpful generic error
    throw new Error(`Failed to extract text from PDF: ${error?.message || 'Unknown error occurred'}`);
  }
};
