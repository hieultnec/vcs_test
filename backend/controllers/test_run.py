from flask import request
from utils import return_status
from utils.logger import logger
from services.test_run import TestRunService

def record_test_run():
    """Record a new test run"""
    try:
        data = request.get_json()
        if not data:
            return return_status(400, "Request body is required")
        
        result = TestRunService.record_test_run(data)
        if result:
            return return_status(200, "Test run recorded successfully", result)
        else:
            return return_status(500, "Failed to record test run")
    except Exception as e:
        logger.error(f"Failed to record test run: {str(e)}")
        return return_status(500, str(e))

def get_test_runs_by_case():
    """Get all test runs for a specific test case"""
    try:
        project_id = request.args.get('project_id')
        test_case_id = request.args.get('test_case_id')
        
        if not project_id or not test_case_id:
            return return_status(400, "project_id and test_case_id are required")
        
        test_runs = TestRunService.get_test_runs_by_case(project_id, test_case_id)
        return return_status(200, "Success", test_runs)
    except Exception as e:
        logger.error(f"Failed to get test runs: {str(e)}")
        return return_status(500, str(e))

def get_latest_test_run():
    """Get the latest test run for a specific test case"""
    try:
        project_id = request.args.get('project_id')
        test_case_id = request.args.get('test_case_id')
        
        if not project_id or not test_case_id:
            return return_status(400, "project_id and test_case_id are required")
        
        test_run = TestRunService.get_latest_test_run(project_id, test_case_id)
        if test_run:
            return return_status(200, "Success", test_run)
        else:
            return return_status(404, "No test runs found")
    except Exception as e:
        logger.error(f"Failed to get latest test run: {str(e)}")
        return return_status(500, str(e))

def get_test_run():
    """Get a specific test run by run_id"""
    try:
        run_id = request.args.get('run_id')
        if not run_id:
            return return_status(400, "run_id is required")
        
        test_run = TestRunService.get_test_run_by_id(run_id)
        if test_run:
            return return_status(200, "Success", test_run)
        else:
            return return_status(404, "Test run not found")
    except Exception as e:
        logger.error(f"Failed to get test run: {str(e)}")
        return return_status(500, str(e))

def update_test_run():
    """Update a specific test run"""
    try:
        data = request.get_json()
        run_id = data.get('run_id')
        update_data = data.get('update_data')
        
        if not run_id or not update_data:
            return return_status(400, "run_id and update_data are required")
        
        success = TestRunService.update_test_run(run_id, update_data)
        if success:
            return return_status(200, "Test run updated successfully")
        else:
            return return_status(404, "Test run not found")
    except Exception as e:
        logger.error(f"Failed to update test run: {str(e)}")
        return return_status(500, str(e))

def delete_test_run():
    """Delete a specific test run"""
    try:
        run_id = request.args.get('run_id')
        if not run_id:
            return return_status(400, "run_id is required")
        
        success = TestRunService.delete_test_run(run_id)
        if success:
            return return_status(200, "Test run deleted successfully")
        else:
            return return_status(404, "Test run not found")
    except Exception as e:
        logger.error(f"Failed to delete test run: {str(e)}")
        return return_status(500, str(e))

def get_test_runs_by_scenario():
    """Get all test runs for a specific scenario"""
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        
        if not project_id or not scenario_id:
            return return_status(400, "project_id and scenario_id are required")
        
        test_runs = TestRunService.get_test_runs_by_scenario(project_id, scenario_id)
        return return_status(200, "Success", test_runs)
    except Exception as e:
        logger.error(f"Failed to get test runs by scenario: {str(e)}")
        return return_status(500, str(e))

def get_test_runs_by_project():
    """Get recent test runs for a project"""
    try:
        project_id = request.args.get('project_id')
        limit = request.args.get('limit', 100, type=int)
        
        if not project_id:
            return return_status(400, "project_id is required")
        
        test_runs = TestRunService.get_test_runs_by_project(project_id, limit)
        return return_status(200, "Success", test_runs)
    except Exception as e:
        logger.error(f"Failed to get test runs by project: {str(e)}")
        return return_status(500, str(e)) 