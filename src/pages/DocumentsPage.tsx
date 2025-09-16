import React, { useState, useEffect, useCallback } from 'react';
import { Document } from '../types';
import { DocumentProcessor } from '../utils/documentProcessor';
import DocumentViewer from '../components/DocumentViewer';
import {
  Upload,
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    document.title = 'Documents - Hospice Care Assistant';
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, selectedCategory, sortBy, sortOrder]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortDocuments = useCallback(() => {
    let filtered = [...documents];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.content?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadDate || a.createdAt).getTime() - new Date(b.uploadDate || b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedCategory, sortBy, sortOrder]);

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const uploadResponse = await DocumentProcessor.uploadDocument(file);
        return uploadResponse.document || uploadResponse.data;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }
    });

    try {
      const uploadedDocs = await Promise.all(uploadPromises);
      const validDocs = uploadedDocs.filter(doc => doc !== undefined) as Document[];
      setDocuments(prev => [...validDocs, ...prev]);
    } catch (error) {
      setError('Some files failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await DocumentProcessor.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      await DocumentProcessor.downloadDocument(document);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
    }
  };

  const categories = ['all', 'medical', 'administrative', 'educational', 'personal', 'other'];

  const formatFileSize = (bytes: number) => DocumentProcessor.formatFileSize(bytes);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);

  const renderDocumentCard = (document: Document) => (
    <div key={document.id} className="document-item">
      <div className={`document-icon ${DocumentProcessor.getFileIcon(document.type)}`}>
        <FileText className="w-full h-full" />
      </div>

      <div className="document-info">
        <div className="document-name">{document.name}</div>
        <div className="document-meta">
          {formatFileSize(document.size)} • {formatDate(new Date(document.uploadDate || document.createdAt))}
          {document.category && (
            <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">
              {document.category}
            </span>
          )}
        </div>
        {document.summary && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{document.summary}</p>
        )}
      </div>

      <div className="document-actions">
        <button
          onClick={() => setSelectedDocument(document)}
          className="p-2 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
          title="View document"
          aria-label="View document"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleDownloadDocument(document)}
          className="p-2 text-gray-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-colors duration-200"
          title="Download document"
          aria-label="Download document"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleDeleteDocument(document.id)}
          className="p-2 text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors duration-200"
          title="Delete document"
          aria-label="Delete document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <a
              href="/chat"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Back to chat"
              aria-label="Back to chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Documents</h1>
              <p className="text-sm text-gray-500">
                {filteredDocuments.length} of {documents.length} documents
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/chat"
              className="btn btn-secondary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </a>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search and filters */}
            <div className="flex-1 flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="input pl-10"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View controls */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="input"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {error && (
          <div className="error-message mb-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-800 hover:text-red-900"
              aria-label="Dismiss error"
            >
              �
            </button>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className="document-upload-zone mb-6"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            {isUploading ? 'Uploading documents...' : 'Upload Documents'}
          </div>
          <p className="text-gray-600 mb-4">
            Drag and drop files here or click to browse
          </p>
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
            accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif"
          />
          <label htmlFor="file-upload" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Choose Files
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: PDF, TXT, DOC, DOCX, JPG, PNG, GIF (max 10MB)
          </p>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? 'No documents uploaded' : 'No documents match your search'}
            </h3>
            <p className="text-gray-600">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        ) : (
          <div className={`document-list ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
            {filteredDocuments.map(renderDocumentCard)}
          </div>
        )}
      </main>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={() => handleDownloadDocument(selectedDocument)}
        />
      )}
    </div>
  );
};

export default DocumentsPage;