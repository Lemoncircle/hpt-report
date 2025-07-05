// Document processing service for context extraction

export interface DocumentContext {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  uploadDate: Date;
  fileSize: number;
}

export class DocumentProcessor {
  private static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/rtf'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  private static readonly MAX_TEXT_LENGTH = 50000; // Limit extracted text to 50k characters

  /**
   * Check if file type is supported for document context
   */
  static isFileSupported(file: File): boolean {
    return this.SUPPORTED_TYPES.includes(file.type);
  }

  /**
   * Get supported file types for display
   */
  static getSupportedTypes(): string[] {
    return ['PDF Documents', 'Word Documents (.docx)', 'Text Files', 'Markdown', 'RTF'];
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.isFileSupported(file)) {
      return {
        isValid: false,
        error: `File type not supported. Supported types: ${this.getSupportedTypes().join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds limit. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { isValid: true };
  }

  /**
   * Process document and extract text content
   */
  static async processDocument(file: File): Promise<DocumentContext> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const buffer = await file.arrayBuffer();
    let extractedText = '';

    try {
      switch (file.type) {
        case 'text/plain':
        case 'text/markdown':
          extractedText = await this.extractTextFromPlainText(buffer);
          break;
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          extractedText = await this.extractTextFromWord(buffer);
          break;
        case 'application/rtf':
          extractedText = await this.extractTextFromRTF(buffer);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Limit text length to prevent token limit issues
      if (extractedText.length > this.MAX_TEXT_LENGTH) {
        extractedText = extractedText.substring(0, this.MAX_TEXT_LENGTH) + '\n\n[Content truncated due to length...]';
      }

      return {
        id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type,
        extractedText,
        uploadDate: new Date(),
        fileSize: file.size
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractTextFromPlainText(buffer: ArrayBuffer): Promise<string> {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }

  /**
   * Extract text from PDF files using pdf-parse library
   */
  private static async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    try {
      // Dynamic import to avoid build-time loading
      const pdfParse = await import('pdf-parse');
      const nodeBuffer = Buffer.from(buffer);
      const data = await pdfParse.default(nodeBuffer);
      return data.text || '';
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from Word documents using mammoth library
   */
  private static async extractTextFromWord(buffer: ArrayBuffer): Promise<string> {
    try {
      // Dynamic import to avoid build-time loading
      const mammoth = await import('mammoth');
      const nodeBuffer = Buffer.from(buffer);
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      return result.value || '';
    } catch (error) {
      console.error('Word document parsing error:', error);
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from RTF files
   */
  private static async extractTextFromRTF(buffer: ArrayBuffer): Promise<string> {
    // Simple RTF text extraction (removes RTF formatting)
    const decoder = new TextDecoder('utf-8');
    const rtfContent = decoder.decode(buffer);
    
    // Basic RTF to text conversion (removes most RTF formatting)
    return rtfContent
      .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF commands
      .replace(/\{|\}/g, '') // Remove braces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Create summary of document context for display
   */
  static createContextSummary(documents: DocumentContext[]): string {
    if (documents.length === 0) return '';

    const summaryParts = [
      `${documents.length} document${documents.length > 1 ? 's' : ''} uploaded for context:`,
      ...documents.map(doc => `• ${doc.fileName} (${(doc.fileSize / 1024).toFixed(1)}KB)`)
    ];

    return summaryParts.join('\n');
  }

  /**
   * Combine document contexts into a single text for AI analysis
   */
  static combineDocumentContexts(documents: DocumentContext[]): string {
    if (documents.length === 0) return '';

    const contextParts = documents.map(doc => {
      return `=== ${doc.fileName} ===\n${doc.extractedText}\n`;
    });

    return `ORGANIZATIONAL CONTEXT DOCUMENTS:\n\n${contextParts.join('\n')}`;
  }
}

// Export singleton instance
export const documentProcessor = DocumentProcessor; 