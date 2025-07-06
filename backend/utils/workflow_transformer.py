"""
Workflow Output Transformer

This module provides functions to transform workflow output from the old format
to the new format that matches our updated API structure.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Any


def transform_workflow_output(workflow_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform workflow output from old format to new format.
    
    Args:
        workflow_output: The raw workflow output with old field names
        
    Returns:
        Transformed data with updated field names and structure
    """
    if not workflow_output or 'structured_output' not in workflow_output:
        return workflow_output
    
    structured_output = workflow_output['structured_output']
    
    # Transform scenarios
    transformed_scenarios = []
    for scenario in structured_output.get('scenarios', []):
        transformed_scenario = transform_scenario(scenario)
        transformed_scenarios.append(transformed_scenario)
    
    return {
        'project_id': structured_output.get('project_id'),
        'scenarios': transformed_scenarios
    }


def transform_scenario(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a single scenario from old format to new format.
    
    Args:
        scenario: Scenario data with old field names
        
    Returns:
        Transformed scenario with updated field names
    """
    # Transform test cases
    transformed_test_cases = []
    for test_case in scenario.get('test_cases', []):
        transformed_test_case = transform_test_case(test_case)
        transformed_test_cases.append(transformed_test_case)
    
    # Create steps from test objective and scenario
    steps = []
    if scenario.get('test_objective'):
        steps.append(f"Objective: {scenario['test_objective']}")
    if scenario.get('scenario'):
        steps.append(f"Scenario: {scenario['scenario']}")
    
    return {
        'id': scenario.get('scenario_id', str(uuid.uuid4())),
        'project_id': scenario.get('project_id'),
        'name': scenario.get('scenario_name', ''),
        'description': scenario.get('description', ''),
        'priority': determine_priority(scenario.get('scenario_name', '')),
        'version': '1.0',
        'test_cases': transformed_test_cases,
        'created_at': scenario.get('created_at', datetime.utcnow().isoformat()),
        'updated_at': scenario.get('updated_at', datetime.utcnow().isoformat())
    }


def transform_test_case(test_case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a single test case from old format to new format.
    
    Args:
        test_case: Test case data with old field names
        
    Returns:
        Transformed test case with updated field names
    """
    # Create steps from requirement, test_objective, and scenario
    steps = []
    if test_case.get('requirement'):
        steps.append(f"Requirement: {test_case['requirement']}")
    if test_case.get('test_objective'):
        steps.append(f"Objective: {test_case['test_objective']}")
    if test_case.get('scenario'):
        steps.append(f"Steps: {test_case['scenario']}")
    
    return {
        'id': test_case.get('test_case_id', str(uuid.uuid4())),
        'project_id': test_case.get('project_id'),
        'scenario_id': test_case.get('scenario_id'),
        'title': test_case.get('test_case_name', ''),
        'description': test_case.get('test_objective', ''),
        'steps': steps,
        'expected_result': test_case.get('expected_result', ''),
        'status': 'untested',
        'version': '1.0',
        'created_at': test_case.get('created_at', datetime.utcnow().isoformat()),
        'updated_at': test_case.get('updated_at', datetime.utcnow().isoformat())
    }


def determine_priority(scenario_name: str) -> str:
    """
    Determine priority based on scenario name or content.
    
    Args:
        scenario_name: The name of the scenario
        
    Returns:
        Priority level: 'High', 'Medium', or 'Low'
    """
    scenario_lower = scenario_name.lower()
    
    # High priority indicators
    high_indicators = ['critical', 'security', 'payment', 'login', 'authentication', 'performance']
    if any(indicator in scenario_lower for indicator in high_indicators):
        return 'High'
    
    # Medium priority indicators
    medium_indicators = ['report', 'export', 'search', 'filter', 'sort', 'pagination']
    if any(indicator in scenario_lower for indicator in medium_indicators):
        return 'Medium'
    
    # Default to Medium for most cases
    return 'Medium'


def validate_transformed_data(transformed_data: Dict[str, Any]) -> bool:
    """
    Validate that the transformed data has the correct structure.
    
    Args:
        transformed_data: The transformed data to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not transformed_data:
        return False
    
    if 'project_id' not in transformed_data:
        return False
    
    scenarios = transformed_data.get('scenarios', [])
    if not isinstance(scenarios, list):
        return False
    
    for scenario in scenarios:
        if not validate_scenario(scenario):
            return False
    
    return True


def validate_scenario(scenario: Dict[str, Any]) -> bool:
    """
    Validate a single scenario.
    
    Args:
        scenario: The scenario to validate
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['id', 'name', 'description', 'priority', 'version']
    for field in required_fields:
        if field not in scenario:
            return False
    
    test_cases = scenario.get('test_cases', [])
    if not isinstance(test_cases, list):
        return False
    
    for test_case in test_cases:
        if not validate_test_case(test_case):
            return False
    
    return True


def validate_test_case(test_case: Dict[str, Any]) -> bool:
    """
    Validate a single test case.
    
    Args:
        test_case: The test case to validate
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['id', 'title', 'description', 'steps', 'expected_result', 'status', 'version']
    for field in required_fields:
        if field not in test_case:
            return False
    
    if not isinstance(test_case.get('steps'), list):
        return False
    
    return True


# Example usage function
def process_workflow_output(workflow_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process workflow output and return transformed data ready for API consumption.
    
    Args:
        workflow_output: Raw workflow output
        
    Returns:
        Transformed data ready for saving to database
    """
    try:
        transformed_data = transform_workflow_output(workflow_output)
        
        if validate_transformed_data(transformed_data):
            return transformed_data
        else:
            raise ValueError("Transformed data validation failed")
            
    except Exception as e:
        print(f"Error processing workflow output: {str(e)}")
        return None 