import React, { useState, useEffect } from 'react';
import { DocumentViewerProps } from '../types';
import { DocumentProcessor } from '../utils/documentProcessor';
import { X, Download, FileText, Image, Eye, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onDownload,
  className = ''
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    loadDocumentContent();
  }, [document.id]);

  const loadDocumentContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For text files, try to load content directly
      if (document.type === 'text/plain' && document.content) {
        setContent(document.content);
      } else {
        // For other files, we would need to fetch content from the server
        const response = await fetch(`/api/documents/${document.id}/content`);

        if (!response.ok) {
          throw new Error('Failed to load document content');
        }

        const data = await response.json();
        setContent(data.content || 'Content not available for this file type.');
      }
    } catch (error) {
      console.error('Error loading document content:', error);
      setError('Failed to load document content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (onDownload) {
        onDownload();
      } else {
        await DocumentProcessor.downloadDocument(document);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const formatFileSize = (bytes: number) => {
    return DocumentProcessor.formatFileSize(bytes);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
          <span className="ml-2">Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{error}</p>
            <button
              onClick={loadDocumentContent}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Handle different document types
    if (document.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        </div>
      );
    }

    if (document.type === 'application/pdf') {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">PDF preview not available</p>
            <p className="text-sm text-gray-500 mb-4">
              Please download the file to view its contents
            </p>
            <button
              onClick={handleDownload}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      );
    }

    // Text content
    return (
      <div
        className="prose prose-sm max-w-none p-4"
        style={{
          fontSize: `${zoom}%`,
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
          {content}
        </pre>
      </div>
    );
  };

  return (
    <div className="document-viewer-overlay" onClick={onClose}>
      <div
        className={`document-viewer-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="document-viewer-header">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {document.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{formatFileSize(document.size)}</span>
              <span>{formatDate(document.uploadDate)}</span>
              {document.category && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {document.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Zoom controls for images and text */}
            {(document.type.startsWith('image/') || document.type === 'text/plain') && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Rotation control for images */}
            {document.type.startsWith('image/') && (
              <button
                onClick={handleRotate}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
                title="Rotate"
                aria-label="Rotate image"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
              title="Download"
              aria-label="Download document"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
              title="Close"
              aria-label="Close document viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="document-viewer-content overflow-auto">
          {renderDocumentContent()}
        </div>

        {/* Footer */}
        <div className="document-viewer-footer">
          {document.summary && (
            <div className="flex-1 text-sm text-gray-600">
              <strong>Summary:</strong> {document.summary}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;