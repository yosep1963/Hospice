// src/components/DocumentViewer.tsx
import React from 'react';
import type { DocumentMeta } from '../types';

interface Props {
  document: DocumentMeta | null;
  onClose: () => void;
  onDownload: () => Promise<void>;
}

const DocumentViewer: React.FC<Props> = ({ document: doc, onClose, onDownload }) => {
  if (!doc) return null;

  const isPdf = doc.type === 'application/pdf';
  const isImage = doc.type.startsWith('image/');
  const contentUrl = `/api/documents/${doc.id}/content`;

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer-modal">
        <div className="document-viewer-header">
          <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="btn btn-secondary text-sm"
            >
              다운로드
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="document-viewer-content">
          {isPdf ? (
            <iframe title={doc.name} src={contentUrl} className="w-full h-full border rounded" />
          ) : isImage ? (
            <img src={contentUrl} alt={doc.name} className="max-w-full max-h-full object-contain mx-auto" />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  미리보기를 지원하지 않는 형식입니다.
                </p>
                <button onClick={onDownload} className="btn btn-primary">
                  다운로드하여 열기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;