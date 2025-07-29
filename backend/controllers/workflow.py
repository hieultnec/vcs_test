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
        api_key = data.get('api_key')
        mode = data.get('mode')

        if not (project_id and api_key):
            return return_status(400, 'Missing required fields')
        wf = workflow.create_workflow(project_id, api_key, mode)
        if wf and wf.get('workflow_id'):
            return return_status(200, 'Workflow created', {'success': True, 'workflow': wf})
        else:
            return return_status(500, 'Failed to create workflow', {'success': False})
    except Exception as e:
        logger.error(f'Failed to create workflow: {str(e)}')
        return return_status(500, str(e), {'success': False})

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
        from utils.database import get_connection, MONGODB_DATABASE
        execution_id = request.args.get('execution_id')
        if not execution_id:
            return return_status(400, 'execution_id is required')
        client = get_connection()
        db = client[MONGODB_DATABASE]
        execution = db.workflow_executions.find_one({'id': execution_id})
        if execution:
            execution.pop('_id', None)
            return return_status(200, 'Success', execution)
        else:
            return return_status(404, 'Execution not found')
    except Exception as e:
        logger.error(f'Failed to get execution: {str(e)}')
        return return_status(500, str(e))

def get_workflow_execution_detail():
    try:
        from services import workflow
        execution_id = request.args.get('id')
        if not execution_id:
            return return_status(400, 'id (execution_id) is required')
        execution = workflow.get_workflow_execution_detail(execution_id)
        if not execution:
            return return_status(404, 'Execution not found')
        return return_status(200, 'Success', execution)
    except Exception as e:
        logger.error(f'Failed to get workflow execution detail: {str(e)}')
        return return_status(500, str(e))

def list_workflow_executions_by_project():
    try:
        from services import workflow
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, 'project_id is required')
        executions = workflow.list_workflow_executions_by_project(project_id)
        return return_status(200, 'Success', executions)
    except Exception as e:
        logger.error(f'Failed to list workflow executions by project: {str(e)}')
        return return_status(500, str(e))

def upload_document_to_workflow():
    """Upload a document for a workflow, requiring workflow_id."""
    try:
        from services import workflow
        if not request.content_type or not request.content_type.startswith('multipart/form-data'):
            return return_status(400, 'Content-Type must be multipart/form-data')
        workflow_id = request.form.get('workflow_id')
        # Get workflow by workflow_id to take mode 
        wf = workflow.get_workflow(workflow_id)
        if not wf:
            return return_status(404, 'Workflow not found')
        mode = wf.get('mode')
        
        file = request.files.get('file')
        if not (workflow_id and file):
            return return_status(400, 'workflow_id and file are required')
        result = workflow.upload_file_to_dify(workflow_id, file, mode)
        return return_status(200, 'Document uploaded', result)
    except Exception as e:
        logger.error(f'Failed to upload document to workflow: {str(e)}')
        return return_status(500, str(e))

# Route: /api/workflow/run (POST)
def run_dify_workflow_controller():
    try:
        from services.workflow import run_dify_workflow_async
        data = request.get_json()
        project_id = data.get('project_id')
        workflow_id = data.get('workflow_id')
        inputs = data.get('inputs', {})
        user = data.get('user', 'hieult')
        response_mode = data.get('response_mode', 'blocking')
        if not (project_id and workflow_id and inputs):
            return return_status(400, 'project_id, workflow_id, and inputs are required')
        result = run_dify_workflow_async(project_id, workflow_id, inputs, user=user, response_mode=response_mode)
        
        # Check if scenarios were auto-saved
        scenarios_saved = False
        if (result.get('dify_response', {}).get('data', {}).get('status') == 'succeeded' and 
            result.get('dify_response', {}).get('data', {}).get('outputs', {}).get('structured_output')):
            scenarios_saved = True
        
        return jsonify({
            'status': 200,
            'message': 'Dify workflow run successful',
            'dify_response': result.get('dify_response'),
            'execution_id': result.get('execution_id'),
            'scenarios_saved': scenarios_saved
        })
    except Exception as e:
        logger.error(f'Failed to run Dify workflow: {str(e)}')
        return return_status(500, str(e)) 

def sync_workflow():
    try:
        from services import workflow
        workflow_id = request.args.get('workflow_id')
        if not workflow_id:
            return return_status(400, 'workflow_id is required')
        updated = workflow.sync_workflow_status_from_logs(workflow_id)
        return return_status(200, 'Sync completed', {'updated': updated})
    except Exception as e:
        logger.error(f'Failed to sync workflow: {str(e)}')
        return return_status(500, str(e)) 