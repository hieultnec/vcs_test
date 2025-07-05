import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger
from services import document

def create(data, files=None):
    """Create a new project with filesystem directory.
    
    Args:
        data (dict): Project data containing name, description, version, owner, status
        files (list): List of uploaded files (optional)
    """
    from flask import request
    logger.info("Creating new project with data: %s", data)
    project_id = str(uuid.uuid4())
    
    # Create project directory
    project_path = os.path.join('projects', project_id)
    logger.info("Creating project directory: %s", project_path)
    os.makedirs(project_path, exist_ok=True)

    # Prepare project data with new fields
    now = datetime.utcnow()
    project_data = {
        "project_id": project_id,
        "id": project_id,  # for frontend compatibility
        "name": data.get('name'),
        "description": data.get('description', ''),
        "version": data.get('version', '1.0'),
        "owner": data.get('owner', ''),
        "lastUpdated": now,
        "status": data.get('status', 'draft'),
        "created_at": now
    }

    # Save to database
    logger.info("Saving project to database: %s", project_data)
    database.create_project(project_data)
    logger.info("Project created successfully with ID: %s", project_id)
    # Handle document upload if files are present
    uploaded_docs = []
    if files:
        for idx, file in enumerate(files):
            if file and file.filename:
                is_current = data.get('is_current', False)
                # Only the first file is marked is_current if multiple
                uploaded_doc = document.upload_document(project_id, file, is_current if idx == 0 else False)
                uploaded_docs.append(uploaded_doc)
    if uploaded_docs:
        project_data['uploaded_documents'] = uploaded_docs
    return project_data

def get(project_id):
    logger.info("Getting project details: %s", project_id)
    result = database.get_project(project_id)
    if result:
        logger.info("Project found: %s", project_id)
        # Fetch all tasks for this project
        tasks = database.get_project_tasks(project_id)
        # For each task, fetch its test scenarios with test cases
        from services.scenario import ScenarioService
        for t in tasks:
            t['test_scenarios'] = ScenarioService.get_scenarios(project_id)
        result['tasks'] = tasks
    else:
        logger.warning("Project not found: %s", project_id)
    return result

def get_all():
    """Get all projects."""
    logger.info("Getting all projects")
    projects = database.get_all_projects()
    logger.info("Retrieved %d projects", len(projects) if projects else 0)
    return projects

def delete(project_id):
    """Delete a project and its directory."""
    logger.info("Deleting project: %s", project_id)
    try:
        # Delete project directory
        project_path = os.path.join('projects', project_id)
        if os.path.exists(project_path):
            logger.info("Deleting project directory: %s", project_path)
            import shutil
            shutil.rmtree(project_path)
        else:
            logger.warning("Project directory does not exist: %s", project_path)
        
        # Delete from database
        logger.info("Deleting project from database: %s", project_id)
        success = database.delete_project(project_id)
        if success:
            logger.info("Project deleted successfully: %s", project_id)
        else:
            logger.warning("Failed to delete project: %s", project_id)
        return success
    except Exception as e:
        logger.error("Error deleting project: %s - %s", project_id, str(e))
        raise e

def update(project_id, data):
    """Update project details."""
    logger.info("Updating project %s with data: %s", project_id, data)
    try:
        # Add lastUpdated field
        data['lastUpdated'] = datetime.utcnow()
        result = database.update_project(project_id, data)
        if result:
            logger.info("Successfully updated project: %s", project_id)
        else:
            logger.warning("Failed to update project: %s - not found", project_id)
        return result
    except Exception as e:
        logger.error("Error updating project %s: %s", project_id, str(e))
        raise e
