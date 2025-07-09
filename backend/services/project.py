import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger
# from services import document  # Move this import inside the function to avoid circular import

def create(data):
    """Create a new project with filesystem directory.
    
    Args:
        data (dict): Project data containing name, description, version, owner, status, (optional) dify_api_keys
    """
    from flask import request
    from services.config import save_config
    from services.workflow import create_workflow
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
    
    # Nếu có truyền dify_api_keys, tự động tạo workflow cho từng key
    api_keys = data.get('dify_api_keys', [])
    if isinstance(api_keys, str):
        # Split by comma and strip whitespace for each key
        api_keys = [k.strip() for k in api_keys.split(',') if k.strip()]
    logger.info(f"API keys to process: {api_keys}")
    created_workflows = []
    for api_key in api_keys:
        try:
            wf = create_workflow(project_id, api_key)
            created_workflows.append(wf)
        except Exception as e:
            logger.error(f"Failed to create workflow for api_key: {api_key}, error: {e}")
    # (Optional) return created workflows in response
    return {**project_data, "created_workflows": created_workflows}

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
