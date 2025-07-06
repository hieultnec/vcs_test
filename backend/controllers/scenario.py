from flask import request
from utils import return_status
from utils.logger import logger
from services.scenario import ScenarioService

def save_scenarios():
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenarios = data.get('scenarios')
        if not project_id or not scenarios:
            return return_status(400, "project_id and scenarios are required")
        success = ScenarioService.save_scenarios(project_id, scenarios)
        if success:
            return return_status(200, "Scenarios saved")
        else:
            return return_status(500, "Failed to save scenarios")
    except Exception as e:
        logger.error(f"Failed to save scenarios: {str(e)}")
        return return_status(500, str(e))

def save_scenarios_from_workflow():
    """Save scenarios from workflow output"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        workflow_output = data.get('workflow_output')
        
        if not project_id or not workflow_output:
            return return_status(400, "project_id and workflow_output are required")
        
        success = ScenarioService.save_scenarios_from_workflow(project_id, workflow_output)
        if success:
            return return_status(200, "Scenarios saved from workflow output")
        else:
            return return_status(500, "Failed to save scenarios from workflow output")
    except Exception as e:
        logger.error(f"Failed to save scenarios from workflow: {str(e)}")
        return return_status(500, str(e))

def get_scenarios():
    try:
        project_id = request.args.get('project_id')
        if not project_id:
            return return_status(400, "project_id is required")
        scenarios = ScenarioService.get_scenarios(project_id)
        return return_status(200, "Success", scenarios)
    except Exception as e:
        logger.error(f"Failed to get scenarios: {str(e)}")
        return return_status(500, str(e))

def create_scenario():
    """Create a new scenario"""
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenario_data = data.get('scenario_data')
        
        if not project_id or not scenario_data:
            return return_status(400, "project_id and scenario_data are required")
        
        result = ScenarioService.create_scenario(project_id, scenario_data)
        if result:
            return return_status(200, "Scenario created successfully", result)
        else:
            return return_status(500, "Failed to create scenario")
    except Exception as e:
        logger.error(f"Failed to create scenario: {str(e)}")
        return return_status(500, str(e))

def update_scenario():
    try:
        data = request.get_json()
        project_id = data.get('project_id')
        scenario_id = data.get('scenario_id')
        scenario_data = data.get('scenario_data')
        if not project_id or not scenario_id or not scenario_data:
            return return_status(400, "project_id, scenario_id, and scenario_data are required")
        success = ScenarioService.update_scenario(project_id, scenario_id, scenario_data)
        if success:
            return return_status(200, "Scenario updated")
        else:
            return return_status(404, "Scenario not found")
    except Exception as e:
        logger.error(f"Failed to update scenario: {str(e)}")
        return return_status(500, str(e))

def delete_scenario():
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        if not project_id or not scenario_id:
            return return_status(400, "project_id and scenario_id are required")
        success = ScenarioService.delete_scenario(project_id, scenario_id)
        if success:
            return return_status(200, "Scenario deleted")
        else:
            return return_status(404, "Scenario not found")
    except Exception as e:
        logger.error(f"Failed to delete scenario: {str(e)}")
        return return_status(500, str(e))

def get_scenario():
    try:
        project_id = request.args.get('project_id')
        scenario_id = request.args.get('scenario_id')
        if not project_id or not scenario_id:
            return return_status(400, "project_id and scenario_id are required")
        scenario = ScenarioService.get_scenario_by_id(project_id, scenario_id)
        if scenario:
            return return_status(200, "Success", scenario)
        else:
            return return_status(404, "Scenario not found")
    except Exception as e:
        logger.error(f"Failed to get scenario: {str(e)}")
        return return_status(500, str(e)) 