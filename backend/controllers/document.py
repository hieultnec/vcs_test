from flask import request, send_file
from utils import return_status
from utils.logger import logger
from services import document
import os

def upload_document():
    """Upload a document for a project."""
    try:
        project_id = request.form.get('project_id')
        is_current = request.form.get('is_current', 'false').lower() == 'true'
        if 'file' not in request.files or not project_id:
            return return_status(400, "File and project_id are required")
        file = request.files['file']
        if file.filename == '':
            return return_status(400, "No selected file")
        result = document.upload_document(project_id, file, is_current)
        return return_status(200, "Document uploaded", result)
    except Exception as e:
        logger.error(f"Failed to upload document: {str(e)}")
        return return_status(500, str(e))

def get_documents():
    """List documents for a project."""
    try:
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        docs = document.get_documents(project_id)
        return return_status(200, "Success", docs)
    except Exception as e:
        logger.error(f"Failed to get documents: {str(e)}")
        return return_status(500, str(e))

def delete_document():
    """Delete a document by document_id."""
    try:
        document_id = request.args.get('document_id')
        if not document_id:
            return return_status(400, "document_id is required")
        success = document.delete_document(document_id)
        if not success:
            return return_status(404, "Document not found")
        return return_status(200, "Document deleted")
    except Exception as e:
        logger.error(f"Failed to delete document: {str(e)}")
        return return_status(500, str(e))

def get_documents_by_project():
    """List all documents for a given project_id."""
    try:
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        docs = document.get_documents_by_project(project_id)
        return return_status(200, "Success", docs)
    except Exception as e:
        logger.error(f"Failed to get documents by project: {str(e)}")
        return return_status(500, str(e))

def get_document_detail():
    """Get detail for a document by document_id."""
    try:
        document_id = request.args.get('document_id')
        if not document_id:
            return return_status(400, "document_id is required")
        doc = document.get_document_detail(document_id)
        if not doc:
            return return_status(404, "Document not found")
        return return_status(200, "Success", doc)
    except Exception as e:
        logger.error(f"Failed to get document detail: {str(e)}")
        return return_status(500, str(e))

def download_document():
    """Download a document by document_id."""
    try:
        document_id = request.args.get('document_id')
        if not document_id:
            return return_status(400, "document_id is required")
        
        doc = document.get_document_detail(document_id)
        if not doc:
            return return_status(404, "Document not found")
        
        filepath = doc.get('filepath')
        if not filepath or not os.path.exists(filepath):
            return return_status(404, "Document file not found")
        
        # Send the file for download
        return send_file(
            filepath,
            as_attachment=True,
            download_name=doc.get('filename', 'document'),
            mimetype='application/octet-stream'
        )
    except Exception as e:
        logger.error(f"Failed to download document: {str(e)}")
        return return_status(500, str(e)) 