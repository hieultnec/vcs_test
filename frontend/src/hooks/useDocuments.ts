import { useState, useEffect, useCallback } from 'react';
import { ProjectDocument } from '@/services/projectService';
import { documentService, DocumentMetadata } from '@/services/documentService';

interface UseDocumentsReturn {
  documents: ProjectDocument[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  loadDocuments: () => Promise<void>;
  uploadDocument: (file: File, isCurrent?: boolean, metadata?: DocumentMetadata) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  setCurrentDocument: (documentId: string) => Promise<void>;
  downloadDocument: (documentId: string, filename: string) => Promise<void>;
  clearError: () => void;
}

export const useDocuments = (projectId: string): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getProjectDocuments(projectId);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const uploadDocument = useCallback(async (
    file: File, 
    isCurrent: boolean = false, 
    metadata?: DocumentMetadata
  ) => {
    try {
      setUploading(true);
      setError(null);
      
      await documentService.uploadDocument(projectId, file, isCurrent, {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        ...metadata,
      });
      
      await loadDocuments();
    } catch (err) {
      setError('Failed to upload document');
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
    }
  }, [projectId, loadDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      setError(null);
      await documentService.deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  }, [loadDocuments]);

  const setCurrentDocument = useCallback(async (documentId: string) => {
    try {
      setError(null);
      await documentService.setCurrentDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError('Failed to set document as current');
      console.error('Error setting current document:', err);
    }
  }, [loadDocuments]);

  const downloadDocument = useCallback(async (documentId: string, filename: string) => {
    try {
      setError(null);
      const blob = await documentService.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download document');
      console.error('Error downloading document:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId, loadDocuments]);

  return {
    documents,
    loading,
    uploading,
    error,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    setCurrentDocument,
    downloadDocument,
    clearError,
  };
}; 