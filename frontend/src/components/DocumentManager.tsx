import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Calendar,
  User,
  Star,
  AlertCircle,
  Eye,
  Link,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectDocument } from "@/services/projectService";
import { documentService } from "@/services/documentService";
import { useToast } from "@/hooks/use-toast";

interface DocumentManagerProps {
  workflowId: string;
  onDocumentChange?: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  workflowId,
  onDocumentChange,
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] =
    useState<ProjectDocument | null>(null);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(
    null
  );
  const [copyingLink, setCopyingLink] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [workflowId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getWorkflowDocuments(workflowId);
      setDocuments(docs);
    } catch (err) {
      setError("Failed to load documents");
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isCurrent = i === 0; // First file is current
        await documentService.uploadDocument(workflowId, file, {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
      }

      await loadDocuments();
      onDocumentChange?.();
    } catch (err) {
      setError("Failed to upload document");
      console.error("Error uploading document:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docItem: ProjectDocument) => {
    try {
      const blob = await documentService.downloadDocument(docItem.document_id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = docItem.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download document");
      console.error("Error downloading document:", err);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentService.deleteDocument(documentId);
      await loadDocuments();
      onDocumentChange?.();
    } catch (err) {
      setError("Failed to delete document");
      console.error("Error deleting document:", err);
    }
  };

  const handleSetCurrent = async (documentId: string) => {
    try {
      await documentService.setCurrentDocument(documentId);
      await loadDocuments();
      onDocumentChange?.();
    } catch (err) {
      setError("Failed to set document as current");
      console.error("Error setting current document:", err);
    }
  };

  const handleViewDocument = async (doc: ProjectDocument) => {
    try {
      setViewingDocumentId(doc.document_id);
      setContentLoading(true);
      setError(null);

      // Fetch the latest document details to ensure we have the most up-to-date information
      const updatedDocument = await documentService.getDocument(
        doc.document_id
      );
      setViewingDocument(updatedDocument);

      // Load document content for preview
      const blob = await documentService.downloadDocument(doc.document_id);

      // Handle different file types
      const fileExtension = doc.filename.split(".").pop()?.toLowerCase();

      if (fileExtension === "txt") {
        const text = await blob.text();
        setDocumentContent(text);
      } else if (fileExtension === "pdf") {
        // For PDFs, create a blob URL for iframe
        const url = URL.createObjectURL(blob);
        setDocumentContent(url);
      } else {
        // For other file types, show download option
        setDocumentContent("preview-not-available");
      }
    } catch (err) {
      setError("Failed to load document details");
      console.error("Error loading document details:", err);
    } finally {
      setViewingDocumentId(null);
      setContentLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewingDocument(null);
    setDocumentContent(null);
    // Clean up blob URL if it exists
    if (documentContent && documentContent.startsWith("blob:")) {
      URL.revokeObjectURL(documentContent);
    }
  };

  const handleCopyLink = async (doc: ProjectDocument) => {
    try {
      setCopyingLink(doc.document_id);
      setError(null);

      // Use the serve endpoint with filepath for secure access
      const documentUrl = `${
        window.location.origin
      }/api/project/document/serve?filepath=${encodeURIComponent(
        doc.filepath
      )}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(documentUrl);

      // Show success toast with file type info
      const fileExt = doc.filename.split(".").pop()?.toUpperCase() || "FILE";
      toast({
        title: "Link copied!",
        description: `Direct ${fileExt} file path (${doc.filepath}) has been copied to your clipboard.`,
      });
    } catch (err) {
      setError("Failed to copy link");
      console.error("Error copying link:", err);

      // Show error toast
      toast({
        title: "Failed to copy link",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    } finally {
      setCopyingLink(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "txt":
        return "📄";
      default:
        return "📎";
    }
  };

  const canPreview = (filename: string): boolean => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext === "pdf" || ext === "txt";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload documents to this project. The first file will be marked as
            current.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="document-upload"
            />
            <label htmlFor="document-upload">
              <Button asChild disabled={uploading}>
                <span>
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </>
                  )}
                </span>
              </Button>
            </label>
            {uploading && (
              <span className="text-sm text-gray-500">
                Uploading documents...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet.</p>
              <p className="text-sm">
                Upload your first document to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">
                      {getFileIcon(doc.filename)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {doc.filename}
                        </h4>
                        {doc.is_current && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(doc.uploaded_at)}
                        </span>
                        {doc.metadata?.size && (
                          <span>
                            {formatFileSize(doc.metadata.size as number)}
                          </span>
                        )}
                        {doc.dify_document_id && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Dify ID: {doc.dify_document_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!doc.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetCurrent(doc.document_id)}
                        title="Set as current"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    {canPreview(doc.filename) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        title="View document"
                        disabled={viewingDocumentId === doc.document_id}
                      >
                        {viewingDocumentId === doc.document_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.document_id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(doc)}
                      title="Copy Link"
                      disabled={copyingLink === doc.document_id}
                    >
                      {copyingLink === doc.document_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <Link className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getFileIcon(viewingDocument.filename)}
                </span>
                <div>
                  <CardTitle className="text-lg">
                    {viewingDocument.filename}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Uploaded{" "}
                    {new Date(viewingDocument.uploaded_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(viewingDocument)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleCloseView}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {contentLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading document...</span>
              </div>
            ) : documentContent === "preview-not-available" ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview Not Available
                </h3>
                <p className="text-gray-500 mb-6">
                  This file type cannot be previewed. Please download the file
                  to view its contents.
                </p>
                <Button onClick={() => handleDownload(viewingDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            ) : documentContent && documentContent.startsWith("blob:") ? (
              <div className="w-full h-96">
                <iframe
                  src={documentContent}
                  className="w-full h-full border rounded"
                  title={viewingDocument.filename}
                />
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded border">
                <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-96">
                  {documentContent}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentManager;
