from flask import request, send_file
from utils import return_status
from utils.logger import logger
from services import task
import os
from pathlib import Path
from datetime import datetime, timedelta

def create():
    if request.method == "POST":
        try:
            logger.info("Handling POST request to create task")
            data = request.get_json()
            logger.debug("Received data: %s", data)
            if not data:
                logger.warning("Missing request body")
                return return_status(400, "Request body is required")
            if 'project_id' not in data:
                logger.warning("Missing project_id in request")
                return return_status(400, "Project ID is required")
            if 'task_name' not in data:
                logger.warning("Missing task_name in request")
                return return_status(400, "Task name is required")
            if 'url' not in data:
                logger.warning("Missing url in request")
                return return_status(400, "URL is required")
            if 'context' not in data:
                logger.warning("Missing context in request")
                return return_status(400, "Context is required")
            
            logger.info("Creating task for project: %s", data['project_id'])
            result = task.create(request)
            logger.info("Task created successfully with ID: %s", result.get('task_id'))
            return return_status(200, "Success", result)
        except Exception as e:
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def ex_task():
    if request.method == "POST":
        try:
            logger.info("Handling POST request to execute task")
            data = request.get_json()
            logger.debug("Received data: %s", data)
            if not data:
                logger.warning("Missing request body")
                return return_status(400, "Request body is required")
            if 'project_id' not in data:
                logger.warning("Missing project_id in request")
                return return_status(400, "Project ID is required")
            if 'task_id' not in data:
                logger.warning("Missing task_id in request")
                return return_status(400, "Task ID is required")
            
            result = task.ex_task(data)
            return return_status(200, "Success", result)
        except Exception as e:
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")


def get():
    if request.method == "GET":
        try:
            project_id = request.args.get('project_id')
            if not project_id:
                logger.warning("Missing project_id in request")
                return return_status(400, "Project ID is required")

            logger.info("Getting tasks for project: %s", project_id)
            result = task.get_all(project_id)
            logger.info("Retrieved %d tasks for project %s", len(result) if result else 0, project_id)
            return return_status(200, "Success", result)
        except Exception as e:
            logger.error("Error getting tasks for project %s: %s",
                         project_id if 'project_id' in locals() else 'unknown', str(e))
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def get_all():
    if request.method == "GET":
        try:
            project_id = request.args.get('project_id')
            if not project_id:
                logger.warning("Missing project_id in request")
                return return_status(400, "Project ID is required")
            
            logger.info("Getting tasks for project: %s", project_id)
            result = task.get_all(project_id)
            logger.info("Retrieved %d tasks for project %s", len(result) if result else 0, project_id)
            return return_status(200, "Success", result)
        except Exception as e:
            logger.error("Error getting tasks for project %s: %s", project_id if 'project_id' in locals() else 'unknown', str(e))
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def update():
    if request.method == "PUT":
        try:
            logger.info("Processing task update request")
            logger.debug("Request args: %s", request.args)
            logger.debug("Request body: %s", request.get_json(silent=True))
            
            # Try to get task_id from either URL params or request body
            task_id = request.args.get('id')
            if not task_id and request.is_json:
                task_id = request.json.get('task_id')
                
            if not task_id:
                logger.error("Task ID not found in either query args or request body")
                return return_status(400, "Task ID is required")
            
            logger.info("Updating task with ID: %s", task_id)
            data = request.get_json()
            if not data:
                logger.warning("Missing request body")
                return return_status(400, "Request body is required")
            
            logger.debug("Update data: %s", data)
            res = task.update(task_id, data)
            if not res:
                logger.warning("Task not found: %s", task_id)
                return return_status(404, "Task not found")
            
            logger.info("Task updated successfully: %s", task_id)
            logger.debug("Updated task data: %s", res)
            return return_status(200, "Success", res)
        except Exception as e:
            logger.error("Error updating task %s: %s", task_id if 'task_id' in locals() else 'unknown', str(e))
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def delete():
    if request.method == "DELETE":
        try:
            task_id = request.args.get('task_id')
            project_id = request.args.get('project_id')
            if not task_id:
                logger.warning("Missing task_id in request")
                return return_status(400, "Task ID is required")
            
            logger.info("Attempting to delete task: %s", task_id)    
            success = task.delete(project_id, task_id)
            if not success:
                logger.warning("Task not found for deletion: %s", task_id)
                return return_status(404, "Task not found")
            
            logger.info("Successfully deleted task: %s", task_id)    
            return return_status(200, "Success", {"message": "Task deleted successfully"})
        except Exception as e:
            logger.error("Error deleting task %s: %s", task_id if 'task_id' in locals() else 'unknown', str(e))
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def get_screenshots():
    """Get list of screenshots for a task."""
    if request.method == "GET":
        try:
            project_id = request.args.get('project_id')
            task_id = request.args.get('task_id')
            
            if not project_id or not task_id:
                logger.warning("Missing project_id or task_id in request")
                return return_status(400, "Project ID and Task ID are required")
            
            # Get screenshots directory path
            screenshots_dir = Path(f'projects/{project_id}/{task_id}/screenshots')
            
            if not screenshots_dir.exists():
                logger.info(f"No screenshots directory found for task {task_id}")
                return return_status(200, "Success", [])
            
            # Get all screenshot files
            screenshot_files = sorted([
                str(f.relative_to(screenshots_dir))
                for f in screenshots_dir.glob('*.png')
            ])
            
            logger.info(f"Found {len(screenshot_files)} screenshots for task {task_id}")
            return return_status(200, "Success", screenshot_files)
            
        except Exception as e:
            logger.error(f"Error getting screenshots: {str(e)}")
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")

def get_screenshot():
    """Get a specific screenshot file."""
    if request.method == "GET":
        try:
            path = request.args.get('path')
            if not path:
                logger.warning("Missing path parameter")
                return return_status(400, "Path parameter is required")
            
            # Get project_id and task_id from the path
            # Path format: <project_id>/<task_id>/screenshots/<filename>
            path_parts = path.split('/')
            if len(path_parts) < 4:
                logger.warning(f"Invalid path format: {path}")
                return return_status(400, "Invalid path format")
            
            project_id = path_parts[0]
            task_id = path_parts[1]
            filename = path_parts[-1]
            
            # Construct full path
            full_path = Path('projects') / project_id / task_id / 'screenshots' / filename
            
            logger.info(f"Looking for screenshot at: {full_path}")
            
            if not full_path.exists():
                logger.warning(f"Screenshot not found: {full_path}")
                return return_status(404, "Screenshot not found")
            
            # Send the file with cache control headers
            response = send_file(
                str(full_path),
                mimetype='image/png',
                as_attachment=False
            )
            
            # Add cache control headers manually
            response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
            response.headers['Expires'] = (datetime.now() + timedelta(hours=1)).strftime('%a, %d %b %Y %H:%M:%S GMT')
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting screenshot: {str(e)}")
            return return_status(500, str(e))
    return return_status(405, "Method not allowed")