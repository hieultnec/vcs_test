import uuid
import os
from datetime import datetime
from utils import database
from utils.logger import logger
from services.document import upload_document, get_document_detail
from services import config
import requests
from services.scenario import ScenarioService
from services.dify_service import (
    fetch_info,
    fetch_site,
    fetch_parameters,
    run_workflow_with_dify,
    DifyMode,
    get_workflow_logs,
)


def parse_user_input_form(user_input_form):
    inputs = []
    for item in user_input_form:
        if not isinstance(item, dict) or not item:
            continue
        field_type, field_def = next(iter(item.items()))
        input_obj = {
            "name": field_def.get("variable"),
            "type": field_def.get("type", field_type),
            "label": field_def.get("label"),
            "required": field_def.get("required", False),
            "default": field_def.get("default", ""),
            "options": field_def.get("options", []),
        }
        # Add any other fields you want to keep
        for extra in [
            "allowed_file_types",
            "allowed_file_upload_methods",
            "allowed_file_extensions",
            "max_length",
        ]:
            if extra in field_def:
                input_obj[extra] = field_def[extra]
        inputs.append(input_obj)
    return inputs


def create_workflow(project_id, api_key, mode=DifyMode.CLOUD):
    """
    Tạo workflow mới, chỉ cần project_id và api_key. Name/description lấy từ info/site nếu có.
    """
    workflow_id = str(uuid.uuid4())
    try:
        info = fetch_info(api_key, mode)
        parameters = fetch_parameters(api_key, mode)
        user_input_form = parameters.get("user_input_form", [])
        inputs = parse_user_input_form(user_input_form)
        wf_name = info.get("name") or None
        wf_description = info.get("description") or None
    except Exception as e:
        logger.error(f"Failed to fetch Dify metadata: {e}")
        raise Exception(f"Failed to fetch Dify metadata: {e}")
    workflow = {
        "workflow_id": workflow_id,
        "project_id": project_id,
        "name": wf_name,
        "api_key": api_key,
        "description": wf_description,
        "info": info,
        "parameters": parameters,
        "mode": mode,
        "inputs": inputs,
        "input_history": [],
        "output_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "running",
    }
    return database.create_workflow(workflow)


def get_workflow(workflow_id):
    return database.get_workflow(workflow_id)


def update_workflow(workflow_id, update_data):
    return database.update_workflow(workflow_id, update_data)


def delete_workflow(workflow_id):
    # Delete all scenarios related to this workflow
    ScenarioService.delete_scenarios_by_workflow(workflow_id)
    return database.delete_workflow(workflow_id)


def list_workflows(project_id=None):
    return database.list_workflows(project_id)


def create_execution(
    workflow_id,
    project_id,
    status,
    inputs,
    outputs=None,
    error=None,
    total_steps=None,
    total_tokens=None,
):
    execution_id = str(uuid.uuid4())
    now = datetime.utcnow()
    execution = {
        "id": execution_id,
        "workflow_id": workflow_id,
        "project_id": project_id,
        "status": status,
        "inputs": inputs,
        "outputs": outputs,
        "error": error,
        "total_steps": total_steps,
        "total_tokens": total_tokens,
        "created_at": now,
        "finished_at": None,
        "elapsed_time": None,
    }
    return database.create_workflow_execution(execution)


def get_execution_history(workflow_id=None):
    return database.list_workflow_executions(workflow_id)


def get_execution(execution_id):
    return database.get_workflow_execution(execution_id)


def upload_file_to_dify(workflow_id, file_storage, mode=DifyMode.CLOUD):
    """Upload a document for a workflow, requiring workflow_id."""
    workflow = get_workflow(workflow_id)
    if not workflow:
        raise ValueError("Workflow not found")
    api_key = workflow.get("api_key")
    if not api_key:
        raise ValueError("API key not found in workflow")
    return upload_document(api_key, file_storage, workflow_id, mode)


def run_dify_workflow(
    project_id,
    workflow_id,
    inputs,
    user="hieult",
    response_mode="blocking",
    mode=DifyMode.CLOUD,
):
    """
    Run a workflow via Dify API, save execution trace, and return Dify response and execution id.
    """
    workflow = get_workflow(workflow_id)
    if not workflow:
        raise ValueError("Workflow not found")
    api_key = workflow.get("api_key")
    if not api_key:
        raise ValueError("API key not found in workflow")
    try:
        response_json = run_workflow_with_dify(
            api_key, inputs, user, response_mode, workflow.get("mode")
        )
        # Save execution record
        status = response_json.get("data", {}).get(
            "status", "succeeded" if response_json.get("data") else "unknown"
        )
        outputs = response_json.get("data", {}).get("outputs")
        error = response_json.get("error") or None
        total_steps = response_json.get("data", {}).get("total_steps")
        total_tokens = response_json.get("data", {}).get("total_tokens")
        execution = create_execution(
            workflow_id=workflow_id,
            project_id=project_id,
            status=status,
            inputs=inputs,
            outputs=outputs,
            error=error,
            total_steps=total_steps,
            total_tokens=total_tokens,
        )
        execution_id = execution.get("id") if isinstance(execution, dict) else None
        # --- NEW: Auto-save test scenarios from workflow output ---
        if status == "succeeded" and outputs and outputs.get("structured_output"):
            try:
                ScenarioService.save_scenarios_from_workflow(
                    project_id,
                    {"structured_output": outputs["structured_output"]},
                    execution_id,
                )
            except Exception as e:
                logger.error(
                    f"Error auto-saving test scenarios from workflow output: {str(e)}"
                )
        return {"dify_response": response_json, "execution_id": execution_id}
    except Exception as e:
        logger.error(f"Error running Dify workflow: {str(e)}")
        execution = create_execution(
            workflow_id=workflow_id,
            project_id=project_id,
            status="failed",
            inputs=inputs,
            outputs=None,
            error=str(e),
            total_steps=None,
            total_tokens=None,
        )
        execution_id = execution.get("id") if isinstance(execution, dict) else None
        raise


def get_workflow_execution_detail(execution_id):
    """Get a workflow execution by its id."""
    return database.get_workflow_execution(execution_id)


def list_workflow_executions_by_project(project_id):
    """Get all workflow executions for a project."""
    return database.get_workflow_executions(project_id)


def sync_workflow_status_from_logs(workflow_id):
    """
    Lấy logs từ Dify, so sánh với workflow hiện tại, nếu có thay đổi thì cập nhật lại DB.
    """
    workflow = get_workflow(workflow_id)
    if not workflow:
        raise ValueError("Workflow not found")
    api_key = workflow.get("api_key")
    mode = workflow.get("mode")
    logs = get_workflow_logs(api_key, mode)
    update_data = {}
    # So sánh status
    if logs.get("status") and logs["status"] != workflow.get("status"):
        update_data["status"] = logs["status"]
    # So sánh outputs nếu có
    if logs.get("outputs") and logs["outputs"] != workflow.get("outputs"):
        update_data["outputs"] = logs["outputs"]
    # Có thể so sánh thêm các trường khác nếu cần
    if update_data:
        update_workflow(workflow_id, update_data)
        return True  # Đã cập nhật
    return False  # Không có thay đổi
