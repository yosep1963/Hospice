import { Document, DocumentUploadResponse, APIResponse } from '../types';

export class DocumentProcessor {
  private static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validates if a file can be processed
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not supported`
      };
    }

    return { isValid: true };
  }

  /**
   * Gets supported file extensions for display
   */
  static getSupportedExtensions(): string[] {
    return ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
  }

  /**
   * Extracts text content from a file (client-side for supported types)
   */
  static async extractTextContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string || '');
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } else {
        // For other file types, we'll need server-side processing
        resolve('');
      }
    });
  }

  /**
   * Uploads and processes a document
   */
  static async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', this.guessCategory(file.name));

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: APIResponse<DocumentUploadResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.data!;
    } catch (error) {
      console.error('Document upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  /**
   * Searches documents based on query and filters
   */
  static async searchDocuments(
    query: string,
    options: {
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: (options.limit || 20).toString(),
        offset: (options.offset || 0).toString(),
      });

      if (options.category) {
        params.append('category', options.category);
      }

      const response = await fetch(`/api/documents/search?${params}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result: APIResponse<{ documents: Document[]; total: number }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      return result.data!;
    } catch (error) {
      console.error('Document search error:', error);
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * Gets a document by ID
   */
  static async getDocument(id: string): Promise<Document> {
    try {
      const response = await fetch(`/api/documents/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const result: APIResponse<Document> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch document');
      }

      return result.data!;
    } catch (error) {
      console.error('Document fetch error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch document');
    }
  }

  /**
   * Deletes a document
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Document delete error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  }

  /**
   * Downloads a document
   */
  static async downloadDocument(document: Document): Promise<void> {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Document download error:', error);
      throw new Error(error instanceof Error ? error.message : 'Download failed');
    }
  }

  /**
   * Guesses document category based on filename
   */
  private static guessCategory(filename: string): string {
    const name = filename.toLowerCase();

    if (name.includes('medical') || name.includes('prescription') || name.includes('diagnosis')) {
      return 'medical';
    }
    if (name.includes('admin') || name.includes('form') || name.includes('application')) {
      return 'administrative';
    }
    if (name.includes('guide') || name.includes('instruction') || name.includes('manual')) {
      return 'educational';
    }
    if (name.includes('personal') || name.includes('family') || name.includes('contact')) {
      return 'personal';
    }

    return 'other';
  }

  /**
   * Formats file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gets file icon class based on file type
   */
  static getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'file-text';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word') || fileType.includes('document')) return 'file-text';
    if (fileType.includes('text')) return 'file-text';
    return 'file';
  }

  /**
   * Generates a summary for a document (placeholder for AI integration)
   */
  static async generateSummary(document: Document): Promise<string> {
    try {
      const response = await fetch('/api/documents/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.statusText}`);
      }

      const result: APIResponse<{ summary: string }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Summary generation failed');
      }

      return result.data!.summary;
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Summary generation is currently unavailable.';
    }
  }
}