#!/usr/bin/env python3
"""
Test script for workflow transformer
"""

import json
from utils.workflow_transformer import process_workflow_output

# Your workflow output
workflow_output = {
  "structured_output": {
    "project_id": "MAN-HOUR",
    "scenarios": [
      {
        "scenario_id": "SC-01",
        "project_id": "MAN-HOUR",
        "scenario_name": "View Activities List Performance",
        "description": "Tests related to the performance of viewing the list of activities.",
        "test_cases": [
          {
            "test_case_id": "TC-MH-50-LOAD",
            "project_id": "MAN-HOUR",
            "scenario_id": "SC-01",
            "test_case_name": "Activities List Loading Time",
            "requirement": "MH-50 – View List of Activities",
            "test_objective": "Verify the activities list loads within acceptable time limits with 1000 activities.",
            "scenario": "Load the Activities List page with 1000 activities provided by API.",
            "expected_result": "The Activities List page loads in under 3 seconds.",
            "created_at": "2024-01-23T12:00:00Z",
            "updated_at": "2024-01-23T12:00:00Z"
          },
          {
            "test_case_id": "TC-MH-50-FILTER",
            "project_id": "MAN-HOUR",
            "scenario_id": "SC-01",
            "test_case_name": "Activities List Filtering Performance",
            "requirement": "MH-50 – View List of Activities",
            "test_objective": "Verify filtering activities by Project ID is performed efficiently.",
            "scenario": "Filter the Activities List by selecting multiple Project IDs from the API-supplied list with 1000 activities.",
            "expected_result": "The Activities List is filtered and displayed in under 2 seconds.",
            "created_at": "2024-01-23T12:00:00Z",
            "updated_at": "2024-01-23T12:00:00Z"
          }
        ],
        "created_at": "2024-01-23T12:00:00Z",
        "updated_at": "2024-01-23T12:00:00Z"
      }
    ]
  }
}

def test_transformation():
    """Test the workflow transformation"""
    print("Original workflow output structure:")
    print(json.dumps(workflow_output, indent=2))
    print("\n" + "="*80 + "\n")
    
    # Transform the data
    transformed_data = process_workflow_output(workflow_output)
    
    if transformed_data:
        print("Transformed data structure:")
        print(json.dumps(transformed_data, indent=2))
        print("\n" + "="*80 + "\n")
        
        # Show the differences
        print("Key transformations:")
        print("1. scenario_id → id")
        print("2. scenario_name → name")
        print("3. test_case_id → id")
        print("4. test_case_name → title")
        print("5. test_objective → description")
        print("6. requirement, test_objective, scenario → steps array")
        print("7. Added priority field (auto-determined)")
        print("8. Added version field")
        print("9. Added status field (default: 'untested')")
        
        # Show a sample transformed scenario
        if transformed_data.get('scenarios'):
            scenario = transformed_data['scenarios'][0]
            print(f"\nSample transformed scenario:")
            print(f"  ID: {scenario['id']}")
            print(f"  Name: {scenario['name']}")
            print(f"  Priority: {scenario['priority']}")
            print(f"  Version: {scenario['version']}")
            
            if scenario.get('test_cases'):
                test_case = scenario['test_cases'][0]
                print(f"\nSample transformed test case:")
                print(f"  ID: {test_case['id']}")
                print(f"  Title: {test_case['title']}")
                print(f"  Description: {test_case['description']}")
                print(f"  Status: {test_case['status']}")
                print(f"  Steps: {len(test_case['steps'])} steps")
                for i, step in enumerate(test_case['steps'], 1):
                    print(f"    {i}. {step}")
    else:
        print("Transformation failed!")

if __name__ == "__main__":
    test_transformation() 