import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger

def get_workflow_config(project_id):
    """Get workflow configuration for a project."""
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

def save_workflow_config(project_id, variables):
    """Save workflow configuration for a project."""
    logger.info(f"Saving workflow config for project: {project_id}")
    try:
        now = datetime.utcnow()
        config = {
            "project_id": project_id,
            "variables": variables,
            "updated_at": now
        }
        
        # Check if config already exists
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