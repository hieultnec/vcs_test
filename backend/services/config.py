import uuid
from datetime import datetime
from utils import database
from utils.logger import logger

def get_config(project_id):
    """Get workflow config for a project."""
    logger.info(f"Getting workflow config for project: {project_id}")
    try:
        config = database.get_workflow_config(project_id)
        if config:
            logger.info(f"Found workflow config for project: {project_id}")
            return config
        else:
            logger.info(f"No workflow config found for project: {project_id}")
            return {
                "project_id": project_id,
                "variables": [],
                "created_at": None,
                "updated_at": None
            }
    except Exception as e:
        logger.error(f"Error getting workflow config for project {project_id}: {str(e)}")
        raise e

def save_config(project_id, variables):
    """Save workflow config for a project."""
    logger.info(f"Saving workflow config for project: {project_id}")
    try:
        now = datetime.utcnow()
        config = {
            "project_id": project_id,
            "variables": variables,
            "updated_at": now
        }
        existing_config = database.get_workflow_config(project_id)
        if existing_config:
            config["created_at"] = existing_config.get("created_at", now)
        else:
            config["created_at"] = now
        success = database.save_workflow_config(config)
        if success:
            logger.info(f"Successfully saved workflow config for project: {project_id}")
            return config
        else:
            logger.error(f"Failed to save workflow config for project: {project_id}")
            raise Exception("Failed to save workflow configuration")
    except Exception as e:
        logger.error(f"Error saving workflow config for project {project_id}: {str(e)}")
        raise e 