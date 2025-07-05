from flask import request
from utils import return_status
from utils.logger import logger
from services.test_case import TestCaseService

def save_test_cases():
    """Save test cases for a scenario"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenario_id = data.get('scenario_id')
        test_cases = data.get('test_cases')
        
        if not project_id or not scenario_id or not test_cases:
            return return_status(400, "project_id, scenario_id, and test_cases are required")
        
        success = TestCaseService.save_test_cases(project_id, scenario_id, test_cases)
        if success:
            return return_status(200, "Test cases saved successfully")
        else:
            return return_status(500, "Failed to save test cases")
    except Exception as e:
        logger.error(f"Failed to save test cases: {str(e)}")
        return return_status(500, str(e))

def get_test_cases():
    """Get all test cases for a scenario"""
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        
        if not project_id or not scenario_id:
            return return_status(400, "project_id and scenario_id are required")
        
        test_cases = TestCaseService.get_test_cases(project_id, scenario_id)
        return return_status(200, "Success", test_cases)
    except Exception as e:
        logger.error(f"Failed to get test cases: {str(e)}")
        return return_status(500, str(e))

def create_test_case():
    """Create a new test case"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenario_id = data.get('scenario_id')
        test_case_data = data.get('test_case_data')
        
        if not project_id or not scenario_id or not test_case_data:
            return return_status(400, "project_id, scenario_id, and test_case_data are required")
        
        result = TestCaseService.create_test_case(project_id, scenario_id, test_case_data)
        if result:
            return return_status(200, "Test case created successfully", result)
        else:
            return return_status(500, "Failed to create test case")
    except Exception as e:
        logger.error(f"Failed to create test case: {str(e)}")
        return return_status(500, str(e))

def update_test_case():
    """Update a specific test case"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenario_id = data.get('scenario_id')
        test_case_id = data.get('test_case_id')
        update_data = data.get('update_data')
        
        if not project_id or not scenario_id or not test_case_id or not update_data:
            return return_status(400, "project_id, scenario_id, test_case_id, and update_data are required")
        
        success = TestCaseService.update_test_case(project_id, scenario_id, test_case_id, update_data)
        if success:
            return return_status(200, "Test case updated successfully")
        else:
            return return_status(404, "Test case not found")
    except Exception as e:
        logger.error(f"Failed to update test case: {str(e)}")
        return return_status(500, str(e))

def delete_test_case():
    """Delete a specific test case"""
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        test_case_id = request.args.get('test_case_id')
        
        if not project_id or not scenario_id or not test_case_id:
            return return_status(400, "project_id, scenario_id, and test_case_id are required")
        
        success = TestCaseService.delete_test_case(project_id, scenario_id, test_case_id)
        if success:
            return return_status(200, "Test case deleted successfully")
        else:
            return return_status(404, "Test case not found")
    except Exception as e:
        logger.error(f"Failed to delete test case: {str(e)}")
        return return_status(500, str(e))

def get_test_case():
    """Get a specific test case by ID"""
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        test_case_id = request.args.get('test_case_id')
        
        if not project_id or not scenario_id or not test_case_id:
            return return_status(400, "project_id, scenario_id, and test_case_id are required")
        
        test_case = TestCaseService.get_test_case_by_id(project_id, scenario_id, test_case_id)
        if test_case:
            return return_status(200, "Success", test_case)
        else:
            return return_status(404, "Test case not found")
    except Exception as e:
        logger.error(f"Failed to get test case: {str(e)}")
        return return_status(500, str(e)) 