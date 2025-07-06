from flask import request, jsonify
from utils import return_status
from utils.logger import logger
# from services import workflow  # Move this import inside each function
# from services.workflow import (
#     upload_file_to_dify, run_dify_workflow, get_dify_workflow_result,
#     get_workflow_template, save_workflow_template
# )
import uuid
from datetime import datetime

def get_workflow_config():
    """Get workflow configuration for a project."""
    try:
        from services import workflow
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        config = workflow.get_workflow_config(project_id)
        return return_status(200, "Success", config)
    except Exception as e:
        logger.error(f"Failed to get workflow config: {str(e)}")
        return return_status(500, str(e))

def save_workflow_config():
    """Save workflow configuration for a project."""
    try:
        from services import workflow
        data = request.get_json()
        if not data:
            return return_status(400, "Request body is required")
        project_id = data.get('project_id')
        variables = data.get('variables', [])
        if not project_id:
            return return_status(400, "project_id is required")
        config = workflow.save_workflow_config(project_id, variables)
        return return_status(200, "Workflow configuration saved", config)
    except Exception as e:
        logger.error(f"Failed to save workflow config: {str(e)}")
        return return_status(500, str(e))

def execute_workflow():
    """Execute a workflow with given variables."""
    try:
        from services import workflow
        data = request.get_json()
        if not data:
            return return_status(400, "Request body is required")
        project_id = data.get('project_id')
        variables = data.get('variables', [])
        if not project_id:
            return return_status(400, "project_id is required")
        execution = workflow.execute_workflow(project_id, variables)
        return return_status(200, "Workflow execution started", execution)
    except Exception as e:
        logger.error(f"Failed to execute workflow: {str(e)}")
        return return_status(500, str(e))

def get_execution_status():
    """Get workflow execution status."""
    try:
        from services import workflow
        execution_id = request.args.get('execution_id')
        if not execution_id:
            return return_status(400, "execution_id is required")
        execution = workflow.get_execution_status(execution_id)
        if not execution:
            return return_status(404, "Execution not found")
        return return_status(200, "Success", execution)
    except Exception as e:
        logger.error(f"Failed to get execution status: {str(e)}")
        return return_status(500, str(e))

def get_execution_history():
    """Get workflow execution history for a project."""
    try:
        from services import workflow
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        executions = workflow.get_execution_history(project_id)
        return return_status(200, "Success", executions)
    except Exception as e:
        logger.error(f"Failed to get execution history: {str(e)}")
        return return_status(500, str(e))

def cancel_execution():
    """Cancel a workflow execution."""
    try:
        from services import workflow
        execution_id = request.args.get('execution_id')
        if not execution_id:
            return return_status(400, "execution_id is required")
        success = workflow.cancel_execution(execution_id)
        if not success:
            return return_status(404, "Execution not found")
        return return_status(200, "Execution cancelled successfully")
    except Exception as e:
        logger.error(f"Failed to cancel execution: {str(e)}")
        return return_status(500, str(e))

def get_templates():
    """Get available workflow templates."""
    try:
        from services import workflow
        templates = workflow.get_templates()
        return return_status(200, "Success", templates)
    except Exception as e:
        logger.error(f"Failed to get templates: {str(e)}")
        return return_status(500, str(e))

def workflow_template():
    if request.method == 'GET':
        from services.workflow import get_workflow_template
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, 'Missing project_id')
        template = get_workflow_template(project_id)
        return return_status(200, 'Success', template)
    elif request.method == 'POST':
        from services.workflow import save_workflow_template
        data = request.get_json()
        project_id = data.get('project_id')
        template = data.get('template')
        if not project_id or not template:
            return return_status(400, 'Missing project_id or template')
        save_workflow_template(project_id, template)
        return return_status(200, 'Template saved') 