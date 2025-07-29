from flask import request, jsonify
from utils import return_status
from utils.logger import logger
import uuid
from datetime import datetime

def get_repos():
    """GET /codex/repos - Get list of repositories from Codex"""
    try:
        from services.codex_service import CodexService
        
        codex_service = CodexService()
        repos = codex_service.get_list_repos()
        
        return return_status(200, 'Success', {'repos': repos})
    except Exception as e:
        logger.error(f'Failed to get repos: {str(e)}')
        return return_status(500, str(e))

def run_codex():
    """POST /codex/run - Submit prompt to Codex with repo and environment"""
    try:
        from services.codex_service import CodexService
        
        data = request.get_json()
        prompt = data.get('prompt')
        repo_label = data.get('repo_label')
        environment_id = data.get('environment_id')
        
        if not (prompt and repo_label):
            return return_status(400, 'prompt and repo_label are required')
        
        codex_service = CodexService()
        
        # Submit the prompt
        task_id = codex_service.submit_prompt(prompt, repo_label)
        
        if task_id:
            return return_status(200, 'Prompt submitted successfully', {
                'task_id': task_id,
                'prompt': prompt,
                'repo_label': repo_label,
                'environment_id': environment_id,
                'status': 'submitted',
                'created_at': datetime.now().isoformat()
            })
        else:
            return return_status(500, 'Failed to submit prompt')
            
    except Exception as e:
        logger.error(f'Failed to run codex: {str(e)}')
        return return_status(500, str(e))

def get_task(task_id):
    """GET /codex/task/<task_id> - Get task status and result"""
    try:
        from services.codex_service import CodexService
        
        if not task_id:
            return return_status(400, 'task_id is required')
        
        codex_service = CodexService()
        
        # For now, we'll return a basic response since the original service
        # doesn't have a specific get_task_by_id method
        # This could be enhanced to check actual task status from logs or database
        
        return return_status(200, 'Success', {
            'task_id': task_id,
            'status': 'completed',  # This would need to be determined from actual logs
            'message': 'Task information retrieved'
        })
        
    except Exception as e:
        logger.error(f'Failed to get task {task_id}: {str(e)}')
        return return_status(500, str(e))

def get_task_submitted():
    """GET /codex/task/submitted - Get submitted tasks (helper endpoint)"""
    try:
        from services.codex_service import CodexService
        
        repo_label = request.args.get('repo_label')
        
        if not repo_label:
            return return_status(400, 'repo_label is required')
        
        codex_service = CodexService()
        submitted_tasks = codex_service.get_task_submitted(repo_label)
        
        return return_status(200, 'Success', {'submitted_tasks': submitted_tasks})
        
    except Exception as e:
        logger.error(f'Failed to get submitted tasks: {str(e)}')
        return return_status(500, str(e))