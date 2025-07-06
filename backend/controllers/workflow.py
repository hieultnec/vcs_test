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

def create_workflow():
    try:
        from services import workflow
        data = request.get_json()
        project_id = data.get('project_id')
        name = data.get('name')
        dify_workflow_run_id = data.get('dify_workflow_run_id')
        description = data.get('description')
        inputs = data.get('inputs', [])
        if not (project_id and name and dify_workflow_run_id):
            return return_status(400, 'Missing required fields')
        wf = workflow.create_workflow(project_id, name, dify_workflow_run_id, description, inputs)
        return return_status(200, 'Workflow created', wf)
    except Exception as e:
        logger.error(f'Failed to create workflow: {str(e)}')
        return return_status(500, str(e))

def get_workflow():
    try:
        from services import workflow
        workflow_id = request.args.get('workflow_id')
        if not workflow_id:
            return return_status(400, 'workflow_id is required')
        wf = workflow.get_workflow(workflow_id)
        if not wf:
            return return_status(404, 'Workflow not found')
        return return_status(200, 'Success', wf)
    except Exception as e:
        logger.error(f'Failed to get workflow: {str(e)}')
        return return_status(500, str(e))

def update_workflow():
    try:
        from services import workflow
        data = request.get_json()
        workflow_id = data.get('workflow_id')
        update_data = data.get('update_data', {})
        if not workflow_id:
            return return_status(400, 'workflow_id is required')
        wf = workflow.update_workflow(workflow_id, update_data)
        return return_status(200, 'Workflow updated', wf)
    except Exception as e:
        logger.error(f'Failed to update workflow: {str(e)}')
        return return_status(500, str(e))

def delete_workflow():
    try:
        from services import workflow
        workflow_id = request.args.get('workflow_id')
        if not workflow_id:
            return return_status(400, 'workflow_id is required')
        workflow.delete_workflow(workflow_id)
        return return_status(200, 'Workflow deleted')
    except Exception as e:
        logger.error(f'Failed to delete workflow: {str(e)}')
        return return_status(500, str(e))

def list_workflows():
    try:
        from services import workflow
        project_id = request.args.get('project_id')
        wfs = workflow.list_workflows(project_id)
        return return_status(200, 'Success', wfs)
    except Exception as e:
        logger.error(f'Failed to list workflows: {str(e)}')
        return return_status(500, str(e))

def execute_workflow():
    try:
        from services import workflow
        data = request.get_json()
        workflow_id = data.get('workflow_id')
        inputs = data.get('inputs', {})
        if not workflow_id:
            return return_status(400, 'workflow_id is required')
        # You may want to validate inputs against workflow definition here
        execution = workflow.create_execution(workflow_id, status='pending', inputs=inputs)
        # Optionally, trigger actual execution logic here
        return return_status(200, 'Workflow execution started', execution)
    except Exception as e:
        logger.error(f'Failed to execute workflow: {str(e)}')
        return return_status(500, str(e))

def get_execution_history():
    try:
        from services import workflow
        workflow_id = request.args.get('workflow_id')
        executions = workflow.get_execution_history(workflow_id)
        return return_status(200, 'Success', executions)
    except Exception as e:
        logger.error(f'Failed to get execution history: {str(e)}')
        return return_status(500, str(e))

def get_execution():
    try:
        from services import workflow
        execution_id = request.args.get('execution_id')
        if not execution_id:
            return return_status(400, 'execution_id is required')
        db = workflow.get_db()
        execution = db.workflow_executions.find_one({'id': execution_id})
        if execution:
            execution.pop('_id', None)
            return return_status(200, 'Success', execution)
        else:
            return return_status(404, 'Execution not found')
    except Exception as e:
        logger.error(f'Failed to get execution: {str(e)}')
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