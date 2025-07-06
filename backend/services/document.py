import os
import uuid
from datetime import datetime
from utils import database
from utils.logger import logger
import requests

ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx'}

def allowed_file(filename):
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def upload_document(project_id, file_storage, is_current=False, metadata=None, user=None):
    """Save uploaded file to Dify, then create DB entry with Dify document ID."""
    from services.workflow import get_workflow_config
    filename = file_storage.filename
    if not allowed_file(filename):
        raise ValueError(f"File type not allowed: {filename}")
    document_id = str(uuid.uuid4())
    project_dir = os.path.join('projects', project_id, 'documents')
    os.makedirs(project_dir, exist_ok=True)
    filepath = os.path.join(project_dir, f"{document_id}_{filename}")
    file_storage.save(filepath)

    # Get Dify API URL and key from workflow config
    config = get_workflow_config(project_id)
    logger.info(f"Retrieved workflow config for project {project_id}: {config}")
    dify_api_url = None
    dify_api_key = None
    
    if config and config.get('variables'):
        for var in config['variables']:
            if var.get('key') == 'dify_api_workflow_upload':
                dify_api_url = var.get('value')
                logger.info(f"Found Dify API URL: {dify_api_url}")
            elif var.get('key') == 'dify_api_key':
                dify_api_key = var.get('value')
                logger.info(f"Found Dify API Key: {dify_api_key[:10]}...")
    
    if not dify_api_url:
        logger.error(f"No Dify API URL found in config for project {project_id}. Config: {config}")
        raise ValueError("Dify API URL not configured for this project.")
    
    if not dify_api_key:
        logger.error(f"No Dify API Key found in config for project {project_id}")
        raise ValueError("Dify API Key not configured for this project.")

    # Upload to Dify
    try:
        logger.info(f"Starting Dify upload for file: {filename}")
        headers = {"Authorization": f"Bearer {dify_api_key}"}
        logger.info(f"Using Dify API Key from config: {dify_api_key[:10]}...")
        
        files = {
            'file': (filename, open(filepath, 'rb'), file_storage.mimetype)
        }
        data = {
            'user': user or (metadata.get('user') if metadata else '') or 'hieult',
            'type': 'document'
        }
        logger.info(f"Dify upload data: {data}")
        
        upload_url = f"{dify_api_url}"
        logger.info(f"Uploading to Dify URL: {upload_url}")
        
        response = requests.post(upload_url, headers=headers, files=files, data=data)
        logger.info(f"Dify upload response status: {response.status_code}")
        logger.info(f"Dify upload response: {response.text}")
        
        response.raise_for_status()
        
        response_json = response.json()
        logger.info(f"Dify response JSON: {response_json}")
        
        dify_document_id = response_json.get('id')
        if not dify_document_id:
            logger.error(f"No 'id' field in Dify response: {response_json}")
            raise ValueError("Failed to get Dify document ID from upload response.")
        
        logger.info(f"Successfully uploaded to Dify, document ID: {dify_document_id}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Dify upload request failed: {str(e)}")
        raise ValueError(f"Failed to upload to Dify: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during Dify upload: {str(e)}")
        raise e

    doc_data = {
        'document_id': document_id,
        'project_id': project_id,
        'filename': filename,
        'filepath': filepath,
        'dify_document_id': dify_document_id,  # Store Dify doc ID
        'is_current': is_current,
        'uploaded_at': datetime.utcnow(),
        'metadata': metadata or {}
    }
    logger.info(f"Uploading document for project {project_id}: {filename} (Dify ID: {dify_document_id})")
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