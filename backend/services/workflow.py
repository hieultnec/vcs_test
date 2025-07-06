import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger
from services.document import upload_document
from services import config

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

def create_execution(workflow_id, status, inputs, outputs=None, error=None, total_steps=None, total_tokens=None):
    execution_id = str(uuid.uuid4())
    now = datetime.utcnow()
    execution = {
        'id': execution_id,
        'workflow_id': workflow_id,
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