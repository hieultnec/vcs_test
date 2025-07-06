import React, { useState, useEffect } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectDocument } from '@/services/projectService';
import { documentService } from '@/services/documentService';

interface DocumentViewerProps {
  document: ProjectDocument;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, isOpen, onClose }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      loadDocumentContent();
    }
  }, [isOpen, document]);

  const loadDocumentContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to download the document content
      const blob = await documentService.downloadDocument(document.document_id);
      
      // Handle different file types
      const fileExtension = document.filename.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'txt') {
        const text = await blob.text();
        setContent(text);
      } else if (fileExtension === 'pdf') {
        // For PDFs, create a blob URL for iframe
        const url = URL.createObjectURL(blob);
        setContent(url);
      } else {
        // For other file types, show download option
        setContent('preview-not-available');
      }
    } catch (err) {
      console.error('Error loading document content:', err);
      
      // Check if it's a download endpoint error
      if (err instanceof Error && err.message.includes('download')) {
        setError('Document download is not available. Please contact your administrator.');
      } else {
        setError('Failed to load document content. Please try downloading the file instead.');
      }
      
      // Set content to show download option
      setContent('preview-not-available');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await documentService.downloadDocument(document.document_id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      
      // Check if it's a download endpoint error
      if (err instanceof Error && err.message.includes('download')) {
        setError('Document download is not available. Please contact your administrator.');
      } else {
        setError('Failed to download document. Please try again later.');
      }
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(document.filename)}</span>
              <div>
                <CardTitle className="text-lg">{document.filename}</CardTitle>
                <p className="text-sm text-gray-500">
                  Uploaded {new Date(document.uploaded_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading document...</span>
            </div>
          ) : content === 'preview-not-available' ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
              <p className="text-gray-500 mb-6">
                This file type cannot be previewed. Please download the file to view its contents.
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          ) : content && content.startsWith('blob:') ? (
            <div className="w-full h-96">
              <iframe
                src={content}
                className="w-full h-full border rounded"
                title={document.filename}
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded border">
              <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-96">
                {content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentViewer; 