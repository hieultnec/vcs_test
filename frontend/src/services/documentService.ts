import apiClient from '@/config/api';
import { ProjectDocument } from './projectService';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  uploaded_at: string;
  is_current: boolean;
}

export interface DocumentMetadata {
  size?: number;
  type?: string;
  lastModified?: number;
  [key: string]: unknown;
}

export const documentService = {
  // Get documents for a project
  async getWorkflowDocuments(workflowId: string): Promise<ProjectDocument[]> {
    try {
      const response = await apiClient.get(`/api/document/list_by_workflow?workflow_id=${workflowId}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch documents for project ${workflowId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Upload a document to a project
  async uploadDocument(
    workflowId: string, 
    file: File, 
    metadata?: DocumentMetadata
  ): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workflow_id', workflowId);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await apiClient.post('/api/workflow/upload_document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.result || response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to upload document:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Delete a document
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/project/document/delete?document_id=${documentId}`);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to delete document ${documentId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get document details
  async getDocument(documentId: string): Promise<ProjectDocument> {
    try {
      const response = await apiClient.get(`/api/project/document/detail?document_id=${documentId}`);
      if (response.data.result) {
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch document ${documentId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Download document - using the filepath from document details
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/api/project/document/download?document_id=${documentId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to download document ${documentId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Set document as current - this would need to be implemented on the backend
  async setCurrentDocument(documentId: string): Promise<void> {
    try {
      // This endpoint doesn't exist in the current backend, so we'll need to implement it
      // For now, we'll throw an error to indicate this needs backend implementation
      throw new Error('Set current document endpoint not implemented on backend');
      
      // When implemented, it would look like this:
      // await apiClient.put(`/api/project/document/set-current?document_id=${documentId}`);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to set document ${documentId} as current:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },
}; 