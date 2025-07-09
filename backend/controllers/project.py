from flask import request
from utils import return_status
from utils.logger import logger
from services import project

def list_all():
    """List all projects."""
    logger.info("Handling request to list all projects")
    try:
        projects = project.get_all()
        logger.info("Successfully retrieved %d projects", len(projects) if projects else 0)
        return return_status(200, "Success", projects)
    except Exception as e:
        logger.error("Failed to list projects: %s", str(e))
        return return_status(500, str(e))

def create():
    """Create a new project."""
    logger.info("Handling request to create new project")
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            logger.warning("Missing project name in request")
            return return_status(400, "Project name is required")
        result = project.create(data)
        logger.info("Successfully created project with ID: %s", result.get('project_id'))
        return return_status(200, "Success", result)
    except Exception as e:
        logger.error("Failed to create project: %s", str(e))
        return return_status(500, str(e))

def get():
    """Get project details."""
    try:
        project_id = request.args.get('id')
        if not project_id:
            logger.warning("Missing project ID in request")
            return return_status(400, "Project ID is required")
            
        logger.info("Getting details for project: %s", project_id)
        result = project.get(project_id)
        if not result:
            logger.warning("Project not found: %s", project_id)
            return return_status(404, "Project not found")
            
        logger.debug("Retrieved project details: %s", result)
        return return_status(200, "Success", result)
    except Exception as e:
        logger.error("Failed to get project %s: %s", project_id, str(e))
        return return_status(500, str(e))

def update():
    """Update project details."""
    try:
        project_id = request.args.get('id')
        if not project_id:
            logger.warning("Missing project ID in request")
            return return_status(400, "Project ID is required")
            
        data = request.get_json()
        if not data:
            logger.warning("Missing request body for project update")
            return return_status(400, "Request body is required")
            
        logger.info("Updating project %s with data: %s", project_id, data)
        result = project.update(project_id, data)
        if not result:
            logger.warning("Project not found for update: %s", project_id)
            return return_status(404, "Project not found")
            
        logger.info("Successfully updated project: %s", project_id)
        return return_status(200, "Success", result)
    except Exception as e:
        logger.error("Failed to update project %s: %s", project_id, str(e))
        return return_status(500, str(e))

def delete():
    """Delete a project."""
    try:
        project_id = request.args.get('id')
        if not project_id:
            logger.warning("Missing project ID in request")
            return return_status(400, "Project ID is required")
            
        logger.info("Attempting to delete project: %s", project_id)
        result = project.delete(project_id)
        if not result:
            logger.warning("Project not found for deletion: %s", project_id)
            return return_status(404, "Project not found")
            
        logger.info("Successfully deleted project: %s", project_id)
        return return_status(200, "Success", {"message": "Project deleted successfully"})
    except Exception as e:
        logger.error("Failed to delete project %s: %s", project_id, str(e))
        return return_status(500, str(e))
