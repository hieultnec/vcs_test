import os
import uuid
from datetime import datetime
from utils import database
from utils.logger import logger
import requests

ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx'}

def allowed_file(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def upload_document(api_key, file_storage, workflow_id):
    from services import dify_service
    """Upload file to Dify using api_key, do not save locally."""
    filename = file_storage.filename
    if not allowed_file(filename):
        raise ValueError(f"File type not allowed: {filename}")
    try:
        document_id = str(uuid.uuid4())
        project_dir = os.path.join('projects', api_key, 'documents')
        os.makedirs(project_dir, exist_ok=True)
        filepath = os.path.join(project_dir, f"{document_id}_{filename}")
        file_storage.save(filepath)
        dify_document_id = dify_service.upload_document_to_dify(api_key, filepath, filename, file_storage.mimetype, "hieult")
    except Exception as e:
        raise ValueError(f"Failed to upload to Dify: {str(e)}")
    doc_data = {
        'document_id': document_id,
        'filename': filename,
        'dify_document_id': dify_document_id,
        'uploaded_at': datetime.utcnow(),
        'filepath': filepath,
        'workflow_id': workflow_id

    }
    logger.info(f"Uploading document for project {workflow_id}: {filename} (Dify ID: {dify_document_id})")
    return database.create_document(doc_data)

def get_documents(workflow_id):
    logger.info(f"Getting documents for workflow {workflow_id}")
    return database.get_documents_by_workflow(workflow_id)

def delete_document(document_id):
    logger.info(f"Deleting document {document_id}")
    return database.delete_document(document_id)

def get_documents_by_workflow(workflow_id):
    """Return all documents for a workflow."""
    return database.get_documents_by_workflow(workflow_id)

def get_document_detail(document_id):
    """Return detail for a single document."""
    return database.get_document_by_id(document_id) 