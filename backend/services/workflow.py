import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger
from services.document import upload_document, get_document_detail
from services import config
import requests
from services.scenario import ScenarioService

def create_workflow(project_id, name, dify_workflow_run_id, description, inputs):
    workflow_id = str(uuid.uuid4())
    workflow = {
        'workflow_id': workflow_id,
        'project_id': project_id,
        'name': name,
        'dify_workflow_run_id': dify_workflow_run_id,
        'description': description,
        'inputs': inputs,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    return database.create_workflow(workflow)

def get_workflow(workflow_id):
    return database.get_workflow(workflow_id)

def update_workflow(workflow_id, update_data):
    return database.update_workflow(workflow_id, update_data)

def delete_workflow(workflow_id):
    return database.delete_workflow(workflow_id)

def list_workflows(project_id=None):
    return database.list_workflows(project_id)

def create_execution(workflow_id, project_id, status, inputs, outputs=None, error=None, total_steps=None, total_tokens=None):
    execution_id = str(uuid.uuid4())
    now = datetime.utcnow()
    execution = {
        'id': execution_id,
        'workflow_id': workflow_id,
        'project_id': project_id,
        'status': status,
        'inputs': inputs,
        'outputs': outputs,
        'error': error,
        'total_steps': total_steps,
        'total_tokens': total_tokens,
        'created_at': now,
        'finished_at': None,
        'elapsed_time': None,
    }
    return database.create_workflow_execution(execution)

def finish_execution(execution_id, status, outputs=None, error=None, total_steps=None, total_tokens=None):
    finished_at = datetime.utcnow()
    execution = database.get_workflow_execution(execution_id)
    if not execution:
        return None
    elapsed_time = (finished_at - execution['created_at']).total_seconds() if execution.get('created_at') else None
    update = {
        'status': status,
        'outputs': outputs,
        'error': error,
        'total_steps': total_steps,
        'total_tokens': total_tokens,
        'finished_at': finished_at,
        'elapsed_time': elapsed_time,
    }
    return database.update_workflow_execution(execution_id, update)

def get_execution_history(workflow_id=None):
    return database.list_workflow_executions(workflow_id)

def get_execution(execution_id):
    return database.get_workflow_execution(execution_id)

def execute_workflow(project_id, variables):
    """Execute a workflow with given variables."""
    logger.info(f"Executing workflow for project: {project_id}")
    try:
        execution_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        execution = {
            "execution_id": execution_id,
            "project_id": project_id,
            "status": "pending",
            "variables": variables,
            "started_at": now,
            "created_at": now
        }
        
        # Save execution record
        success = database.save_workflow_execution(execution)
        if not success:
            raise Exception("Failed to save workflow execution")
        
        # TODO: Implement actual workflow execution logic here
        # For now, we'll simulate the execution
        logger.info(f"Starting workflow execution: {execution_id}")
        
        # Update status to running
        execution["status"] = "running"
        database.update_workflow_execution(execution_id, {"status": "running"})
        
        # Simulate some processing time
        import time
        time.sleep(2)
        
        # Update status to completed
        execution["status"] = "completed"
        execution["completed_at"] = datetime.utcnow()
        execution["result"] = {
            "message": "Workflow executed successfully",
            "variables_processed": len(variables),
            "timestamp": execution["completed_at"].isoformat()
        }
        
        database.update_workflow_execution(execution_id, {
            "status": "completed",
            "completed_at": execution["completed_at"],
            "result": execution["result"]
        })
        
        logger.info(f"Workflow execution completed: {execution_id}")
        return execution
        
    except Exception as e:
        logger.error(f"Error executing workflow for project {project_id}: {str(e)}")
        # Update execution status to failed
        if 'execution_id' in locals():
            database.update_workflow_execution(execution_id, {
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.utcnow()
            })
        raise e

def get_execution_status(execution_id):
    """Get workflow execution status."""
    logger.info(f"Getting execution status for: {execution_id}")
    try:
        execution = database.get_workflow_execution(execution_id)
        if execution:
            logger.info(f"Found execution: {execution_id}, status: {execution.get('status')}")
            return execution
        else:
            logger.warning(f"Execution not found: {execution_id}")
            return None
    except Exception as e:
        logger.error(f"Error getting execution status for {execution_id}: {str(e)}")
        raise e

def get_execution_history(project_id):
    """Get workflow execution history for a project."""
    logger.info(f"Getting execution history for project: {project_id}")
    try:
        executions = database.get_workflow_executions(project_id)
        logger.info(f"Found {len(executions) if executions else 0} executions for project: {project_id}")
        return executions or []
    except Exception as e:
        logger.error(f"Error getting execution history for project {project_id}: {str(e)}")
        raise e

def cancel_execution(execution_id):
    """Cancel a workflow execution."""
    logger.info(f"Cancelling execution: {execution_id}")
    try:
        execution = database.get_workflow_execution(execution_id)
        if not execution:
            logger.warning(f"Execution not found for cancellation: {execution_id}")
            return False
        
        if execution.get('status') in ['completed', 'failed']:
            logger.warning(f"Cannot cancel execution {execution_id} with status: {execution.get('status')}")
            return False
        
        success = database.update_workflow_execution(execution_id, {
            "status": "cancelled",
            "completed_at": datetime.utcnow()
        })
        
        if success:
            logger.info(f"Successfully cancelled execution: {execution_id}")
        else:
            logger.error(f"Failed to cancel execution: {execution_id}")
        
        return success
    except Exception as e:
        logger.error(f"Error cancelling execution {execution_id}: {str(e)}")
        raise e

def get_templates():
    """Get available workflow templates."""
    logger.info("Getting workflow templates")
    try:
        templates = [
            {
                "name": "SSH Connection",
                "variables": [
                    {
                        "id": str(uuid.uuid4()),
                        "variable_name": "ssh_host",
                        "key": "ssh_host",
                        "value": "192.168.1.9",
                        "type": "ssh_host",
                        "description": "SSH server hostname or IP address"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "variable_name": "ssh_port",
                        "key": "ssh_port",
                        "value": "22",
                        "type": "ssh_port",
                        "description": "SSH server port number"
                    }
                ]
            },
            {
                "name": "Document Processing",
                "variables": [
                    {
                        "id": str(uuid.uuid4()),
                        "variable_name": "document",
                        "key": "document",
                        "value": "http://localhost:5000/api/project/document/download?document_id=current",
                        "type": "document",
                        "description": "Document URL for workflow processing"
                    }
                ]
            }
        ]
        logger.info(f"Returning {len(templates)} workflow templates")
        return templates
    except Exception as e:
        logger.error(f"Error getting workflow templates: {str(e)}")
        raise e

def upload_file_to_dify(project_id, file_storage, is_current=False, metadata=None, user=None):
    """Proxy to upload_document for Dify integration (for workflow controller compatibility)."""
    return upload_document(project_id, file_storage, is_current, metadata, user)

def run_dify_workflow(project_id, workflow_id, inputs, user="hieult", response_mode="blocking"):
    """
    Run a workflow via Dify API, save execution trace, and return Dify response and execution id.
    """
    from services.config import get_config
    logger.info(f"Running Dify workflow for project {project_id}, workflow {workflow_id}")
    config = get_config(project_id)
    dify_api_url = None
    dify_api_key = None
    if config and config.get('variables'):
        for var in config['variables']:
            if var.get('key') == 'dify_api_workflow_run':
                dify_api_url = var.get('value')
                logger.info(f"Found Dify workflow run URL: {dify_api_url}")
            elif var.get('key') == 'dify_api_key':
                dify_api_key = var.get('value')
                logger.info(f"Found Dify API Key: {dify_api_key[:10]}...")
    if not dify_api_url:
        logger.error(f"No Dify workflow run URL found in config for project {project_id}. Config: {config}")
        raise ValueError("Dify workflow run URL not configured for this project.")
    if not dify_api_key:
        logger.error(f"No Dify API Key found in config for project {project_id}")
        raise ValueError("Dify API Key not configured for this project.")

    # --- NEW: Map document_id to dify_document_id for document-type inputs ---
    # processed_inputs = {}
    # for key, value in inputs.items():
    #     # If value is a list (as in [{{...}}]), take first element
    #     v = value[0] if isinstance(value, list) and value else value
    #     if isinstance(v, dict) and v.get('type') == 'document':
    #         doc_id = v.get('upload_file_id')
    #         if doc_id:
    #             doc = get_document_detail(doc_id)
    #             if not doc or not doc.get('upload_file_id'):
    #                 raise ValueError(f"Document {doc_id} not found or missing upload_file_id")
    #             v = v.copy()
    #             v['upload_file_id'] = doc['upload_file_id']
    #             processed_inputs[key] = [v]
    #         else:
    #             processed_inputs[key] = value
    #     else:
    #         processed_inputs[key] = value
    # # -------------------------------------------------------------

    payload = {
        "inputs": inputs,
        "response_mode": response_mode,
        "user": user
    }
    headers = {
        "Authorization": f"Bearer {dify_api_key}",
        "Content-Type": "application/json"
    }
    execution_id = None
    try:
        logger.info(f"Calling Dify workflow run API: {dify_api_url} with payload: {payload}")
        response = requests.post(dify_api_url, headers=headers, json=payload)
        logger.info(f"Dify workflow run response status: {response.status_code}")
        logger.info(f"Dify workflow run response: {response.text}")
        response.raise_for_status()
        response_json = response.json()
        # Save execution record
        status = response_json.get('data', {}).get('status', 'succeeded' if response_json.get('data') else 'unknown')
        outputs = response_json.get('data', {}).get('outputs')
        error = response_json.get('error') or None
        total_steps = response_json.get('data', {}).get('total_steps')
        total_tokens = response_json.get('data', {}).get('total_tokens')
        execution = create_execution(
            workflow_id=workflow_id,
            project_id=project_id,
            status=status,
            inputs=inputs,
            outputs=outputs,
            error=error,
            total_steps=total_steps,
            total_tokens=total_tokens
        )
        execution_id = execution.get('id') if isinstance(execution, dict) else None
        logger.info(f"Saved workflow execution record: {execution_id}")
        
        # --- NEW: Auto-save test scenarios from workflow output ---
        if status == 'succeeded' and outputs and outputs.get('structured_output'):
            try:
                logger.info(f"Auto-saving test scenarios from workflow output for project {project_id}")
                success = ScenarioService.save_scenarios_from_workflow(project_id, {"structured_output": outputs['structured_output']}, execution_id)
                if success:
                    logger.info(f"Successfully saved test scenarios from workflow output for project {project_id}")
                else:
                    logger.warning(f"Failed to save test scenarios from workflow output for project {project_id}")
            except Exception as e:
                logger.error(f"Error auto-saving test scenarios from workflow output: {str(e)}")
                # Don't fail the workflow execution if scenario saving fails
        # -------------------------------------------------------------
        
        return {"dify_response": response_json, "execution_id": execution_id}
    except Exception as e:
        logger.error(f"Error running Dify workflow: {str(e)}")
        # Save failed execution
        execution = create_execution(
            workflow_id=workflow_id,
            project_id=project_id,
            status="failed",
            inputs=inputs,
            outputs=None,
            error=str(e),
            total_steps=None,
            total_tokens=None
        )
        execution_id = execution.get('id') if isinstance(execution, dict) else None
        raise 

def get_workflow_execution_detail(execution_id):
    """Get a workflow execution by its id."""
    return database.get_workflow_execution(execution_id)

def list_workflow_executions_by_project(project_id):
    """Get all workflow executions for a project."""
    return database.get_workflow_executions(project_id) 