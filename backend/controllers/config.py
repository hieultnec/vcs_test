from flask import request
from utils.common import return_status
from utils.logger import logger

def get_config():
    """Get workflow config for a project."""
    try:
        from services import config
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        result = config.get_config(project_id)
        return return_status(200, "Success", result)
    except Exception as e:
        logger.error(f"Failed to get workflow config: {str(e)}")
        return return_status(500, str(e))

def save_config():
    """Save workflow config for a project."""
    try:
        from services import config
        data = request.get_json()
        project_id = data.get('project_id')
        variables = data.get('variables', [])
        if not project_id:
            return return_status(400, "project_id is required")
        result = config.save_config(project_id, variables)
        return return_status(200, "Workflow config saved", result)
    except Exception as e:
        logger.error(f"Failed to save workflow config: {str(e)}")
        return return_status(500, str(e)) 