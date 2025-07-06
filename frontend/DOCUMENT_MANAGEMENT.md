# Document Management Features

This document outlines the document management features implemented in the frontend application.

## Overview

The document management system provides a comprehensive solution for uploading, viewing, downloading, and managing documents within test projects. It includes proper TypeScript types, error handling, and a modern UI.

## Features

### 1. Document Upload
- **Multi-file upload**: Support for uploading multiple documents at once
- **File type validation**: Accepts PDF, DOC, DOCX, XLS, XLSX, and TXT files
- **Current document marking**: The first uploaded file is automatically marked as current
- **Progress indication**: Visual feedback during upload process
- **Metadata capture**: Automatically captures file size, type, and modification date

### 2. Document Management
- **Document listing**: View all documents associated with a project
- **Current document indicator**: Visual badge showing which document is marked as current
- **Document actions**: Set as current, download, delete, and preview documents
- **File information**: Display file size, upload date, and metadata

### 3. Document Preview
- **PDF preview**: In-browser PDF viewing using iframe
- **Text file preview**: Direct text content display with syntax highlighting
- **Fallback handling**: For unsupported file types, provides download option
- **Modal interface**: Clean, responsive preview modal

### 4. Document Download
- **Direct download**: One-click document download
- **Proper file naming**: Downloads with original filename
- **Blob handling**: Secure file handling using browser blob URLs

## Components

### DocumentManager
The main component for document management within a project.

**Props:**
- `projectId: string` - The ID of the project
- `onDocumentChange?: () => void` - Callback when documents change

**Features:**
- Document upload interface
- Document list with actions
- Error handling and loading states
- Integration with DocumentViewer

### DocumentViewer
Modal component for previewing document content.

**Props:**
- `document: ProjectDocument` - The document to view
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Callback to close the modal

**Features:**
- PDF and text file preview
- Download functionality
- Responsive design
- Error handling

## Services

### projectService
Enhanced with proper TypeScript types and error handling.

**Key improvements:**
- `ProjectDocument` interface replacing `any[]`
- Type-safe API response handling
- Comprehensive error handling
- Better type guards

### documentService
New service for document-specific operations.

**Methods:**
- `getProjectDocuments(projectId)` - Fetch documents for a project
- `uploadDocument(projectId, file, isCurrent, metadata)` - Upload a document
- `deleteDocument(documentId)` - Delete a document
- `downloadDocument(documentId)` - Download document as blob
- `setCurrentDocument(documentId)` - Set document as current
- `getDocument(documentId)` - Get document details

## Hooks

### useDocuments
Custom hook for managing document state and operations.

**Returns:**
- `documents: ProjectDocument[]` - List of documents
- `loading: boolean` - Loading state
- `uploading: boolean` - Upload state
- `error: string | null` - Error message
- `loadDocuments()` - Reload documents
- `uploadDocument(file, isCurrent, metadata)` - Upload document
- `deleteDocument(documentId)` - Delete document
- `setCurrentDocument(documentId)` - Set current document
- `downloadDocument(documentId, filename)` - Download document
- `clearError()` - Clear error state

## Types

### ProjectDocument
```typescript
interface ProjectDocument {
  document_id: string;
  project_id: string;
  filename: string;
  filepath: string;
  is_current: boolean;
  uploaded_at: string;
  metadata?: Record<string, unknown>;
}
```

### DocumentMetadata
```typescript
interface DocumentMetadata {
  size?: number;
  type?: string;
  lastModified?: number;
  [key: string]: unknown;
}
```

## Integration

### ProjectDetail Page
The document management system is integrated into the ProjectDetail page with:

1. **New Documents Tab**: Dedicated tab for document management
2. **Overview Integration**: Document count in project overview
3. **Recent Documents**: Preview of recent documents in overview tab
4. **Real-time Updates**: Automatic refresh when documents change

### Navigation
- Documents tab added to project detail navigation
- "View All" button in overview to navigate to documents tab
- Seamless integration with existing project workflow

## Error Handling

The system includes comprehensive error handling:

- **Network errors**: Proper error messages for API failures
- **File validation**: Clear feedback for unsupported file types
- **Upload failures**: Detailed error messages for upload issues
- **Download errors**: Graceful handling of download failures
- **User feedback**: Toast notifications and inline error messages

## Security Considerations

- **File type validation**: Only allowed file types can be uploaded
- **Blob URLs**: Secure file handling using browser blob URLs
- **Proper cleanup**: Automatic cleanup of blob URLs to prevent memory leaks
- **Input sanitization**: Proper handling of file names and metadata

## Future Enhancements

Potential improvements for the document management system:

1. **Drag and drop upload**: Enhanced upload interface
2. **Document versioning**: Track document versions and changes
3. **Document search**: Search within document content
4. **Document comments**: Add comments and annotations
5. **Bulk operations**: Select multiple documents for bulk actions
6. **Document templates**: Pre-defined document templates
7. **Advanced preview**: Support for more file types (images, spreadsheets)
8. **Document sharing**: Share documents with team members

## Usage Examples

### Basic Document Upload
```typescript
const { uploadDocument } = useDocuments(projectId);

const handleFileUpload = async (files: FileList) => {
  for (let i = 0; i < files.length; i++) {
    await uploadDocument(files[i], i === 0); // First file is current
  }
};
```

### Document Preview
```typescript
const [viewingDocument, setViewingDocument] = useState<ProjectDocument | null>(null);

<DocumentViewer
  document={viewingDocument}
  isOpen={!!viewingDocument}
  onClose={() => setViewingDocument(null)}
/>
```

### Document Management
```typescript
const { documents, deleteDocument, setCurrentDocument } = useDocuments(projectId);

// Delete a document
await deleteDocument(documentId);

// Set document as current
await setCurrentDocument(documentId);
```

This document management system provides a robust, type-safe, and user-friendly solution for managing documents within test projects. 