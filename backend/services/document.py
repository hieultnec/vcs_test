import os
import uuid
from datetime import datetime
from utils import database
from utils.logger import logger

ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx'}

def allowed_file(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def upload_document(project_id, file_storage, is_current=False, metadata=None):
    """Save uploaded file and create DB entry."""
    filename = file_storage.filename
    if not allowed_file(filename):
        raise ValueError(f"File type not allowed: {filename}")
    document_id = str(uuid.uuid4())
    project_dir = os.path.join('projects', project_id, 'documents')
    os.makedirs(project_dir, exist_ok=True)
    filepath = os.path.join(project_dir, f"{document_id}_{filename}")
    file_storage.save(filepath)
    doc_data = {
        'document_id': document_id,
        'project_id': project_id,
        'filename': filename,
        'filepath': filepath,
        'is_current': is_current,
        'uploaded_at': datetime.utcnow(),
        'metadata': metadata or {}
    }
    logger.info(f"Uploading document for project {project_id}: {filename}")
    return database.create_document(doc_data)

def get_documents(project_id):
    logger.info(f"Getting documents for project {project_id}")
    return database.get_documents_by_project(project_id)

def delete_document(document_id):
    logger.info(f"Deleting document {document_id}")
    return database.delete_document(document_id)

def get_documents_by_project(project_id):
    """Return all documents for a project."""
    return database.get_documents_by_project(project_id)

def get_document_detail(document_id):
    """Return detail for a single document."""
    return database.get_document_by_id(document_id) 