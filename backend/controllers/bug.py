from flask import request
from utils.common import return_status
from utils.logger import logger

def create_bug():
    """Create a new bug from execution failure or manual input."""
    try:
        from services import bug
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['project_id', 'summary', 'description', 'severity']
        for field in required_fields:
            if not data.get(field):
                return return_status(400, f"{field} is required")
        
        result = bug.create_bug(data)
        return return_status(200, "Bug created successfully", result)
    except Exception as e:
        logger.error(f"Failed to create bug: {str(e)}")
        return return_status(500, str(e))

def get_bugs():
    """Get all bugs for a project with optional filters."""
    try:
        from services import bug
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        
        # Optional filters
        filters = {
            'status': request.args.get('status'),
            'severity': request.args.get('severity'),
            'task_id': request.args.get('task_id'),
            'scenario_id': request.args.get('scenario_id')
        }
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        bugs = bug.get_bugs(project_id, filters)
        return return_status(200, "Success", bugs)
    except Exception as e:
        logger.error(f"Failed to get bugs: {str(e)}")
        return return_status(500, str(e))

def get_bug():
    """Get bug details by bug_id."""
    try:
        from services import bug
        bug_id = request.args.get('bug_id')
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        bug_detail = bug.get_bug(bug_id)
        if not bug_detail:
            return return_status(404, "Bug not found")
        
        return return_status(200, "Success", bug_detail)
    except Exception as e:
        logger.error(f"Failed to get bug: {str(e)}")
        return return_status(500, str(e))

def update_bug():
    """Update bug information."""
    try:
        from services import bug
        data = request.get_json()
        bug_id = data.get('bug_id')
        
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        result = bug.update_bug(bug_id, data)
        if not result:
            return return_status(404, "Bug not found")
        
        return return_status(200, "Bug updated successfully", result)
    except Exception as e:
        logger.error(f"Failed to update bug: {str(e)}")
        return return_status(500, str(e))

def delete_bug():
    """Delete a bug and all related data."""
    try:
        from services import bug
        bug_id = request.args.get('bug_id')
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        success = bug.delete_bug(bug_id)
        if not success:
            return return_status(404, "Bug not found")
        
        return return_status(200, "Bug deleted successfully")
    except Exception as e:
        logger.error(f"Failed to delete bug: {str(e)}")
        return return_status(500, str(e))

def create_bug_fix():
    """Create a bug fix record."""
    try:
        from services import bug
        data = request.get_json()
        
        required_fields = ['bug_id', 'fix_description', 'fixed_by']
        for field in required_fields:
            if not data.get(field):
                return return_status(400, f"{field} is required")
        
        result = bug.create_bug_fix(data)
        return return_status(200, "Bug fix created successfully", result)
    except Exception as e:
        logger.error(f"Failed to create bug fix: {str(e)}")
        return return_status(500, str(e))

def verify_bug_fix():
    """Verify a bug fix."""
    try:
        from services import bug
        data = request.get_json()
        fix_id = data.get('fix_id')
        verified_by = data.get('verified_by')
        fix_status = data.get('fix_status', 'verified')
        
        if not all([fix_id, verified_by]):
            return return_status(400, "fix_id and verified_by are required")
        
        result = bug.verify_bug_fix(fix_id, verified_by, fix_status)
        if not result:
            return return_status(404, "Bug fix not found")
        
        return return_status(200, "Bug fix verified successfully", result)
    except Exception as e:
        logger.error(f"Failed to verify bug fix: {str(e)}")
        return return_status(500, str(e))

def get_bug_fixes():
    """Get all fixes for a bug."""
    try:
        from services import bug
        bug_id = request.args.get('bug_id')
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        fixes = bug.get_bug_fixes(bug_id)
        return return_status(200, "Success", fixes)
    except Exception as e:
        logger.error(f"Failed to get bug fixes: {str(e)}")
        return return_status(500, str(e))

def create_bug_history():
    """Create bug history record (before/after states)."""
    try:
        from services import bug
        data = request.get_json()
        
        required_fields = ['bug_id', 'before_state', 'after_state', 'captured_by']
        for field in required_fields:
            if not data.get(field):
                return return_status(400, f"{field} is required")
        
        result = bug.create_bug_history(data)
        return return_status(200, "Bug history created successfully", result)
    except Exception as e:
        logger.error(f"Failed to create bug history: {str(e)}")
        return return_status(500, str(e))

def get_bug_history():
    """Get history for a bug."""
    try:
        from services import bug
        bug_id = request.args.get('bug_id')
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        history = bug.get_bug_history(bug_id)
        return return_status(200, "Success", history)
    except Exception as e:
        logger.error(f"Failed to get bug history: {str(e)}")
        return return_status(500, str(e))

def execute_bug_test():
    """Execute bug test in an execution."""
    try:
        from services import bug
        data = request.get_json()
        
        required_fields = ['execution_id', 'bug_id', 'status', 'executed_by']
        for field in required_fields:
            if not data.get(field):
                return return_status(400, f"{field} is required")
        
        result = bug.execute_bug_test(data)
        return return_status(200, "Bug test executed successfully", result)
    except Exception as e:
        logger.error(f"Failed to execute bug test: {str(e)}")
        return return_status(500, str(e))

def get_bug_executions():
    """Get all executions for a bug."""
    try:
        from services import bug
        bug_id = request.args.get('bug_id')
        if not bug_id:
            return return_status(400, "bug_id is required")
        
        executions = bug.get_bug_executions(bug_id)
        return return_status(200, "Success", executions)
    except Exception as e:
        logger.error(f"Failed to get bug executions: {str(e)}")
        return return_status(500, str(e))

def get_execution_bugs():
    """Get all bugs tested in an execution."""
    try:
        from services import bug
        execution_id = request.args.get('execution_id')
        if not execution_id:
            return return_status(400, "execution_id is required")
        
        bugs = bug.get_execution_bugs(execution_id)
        return return_status(200, "Success", bugs)
    except Exception as e:
        logger.error(f"Failed to get execution bugs: {str(e)}")
        return return_status(500, str(e))

def get_bug_reports():
    """Generate bug reports with statistics."""
    try:
        from services import bug
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        
        # Optional filters for reports
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        group_by = request.args.get('group_by', 'status')  # status, severity, task, developer
        
        reports = bug.get_bug_reports(project_id, start_date, end_date, group_by)
        return return_status(200, "Success", reports)
    except Exception as e:
        logger.error(f"Failed to generate bug reports: {str(e)}")
        return return_status(500, str(e))