#!/usr/bin/env python3
"""
Example usage of workflow transformation
"""

import json
import requests
from utils.workflow_transformer import process_workflow_output

# Example workflow output (your actual output)
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
  },
  "text": "JSON string representation..."
}

def example_usage():
    """Example of how to use the workflow transformation"""
    
    print("=== Workflow Output Transformation Example ===\n")
    
    # 1. Transform the workflow output
    print("1. Transforming workflow output...")
    transformed_data = process_workflow_output(workflow_output)
    
    if transformed_data:
        print("✅ Transformation successful!")
        print(f"   Project ID: {transformed_data['project_id']}")
        print(f"   Scenarios: {len(transformed_data['scenarios'])}")
        
        # 2. Show the transformed structure
        print("\n2. Transformed data structure:")
        print(json.dumps(transformed_data, indent=2))
        
        # 3. Example API call to save the transformed data
        print("\n3. Example API call to save scenarios:")
        print("POST /api/scenario/save_from_workflow")
        print("Body:")
        api_body = {
            "project_id": "MAN-HOUR",
            "workflow_output": workflow_output
        }
        print(json.dumps(api_body, indent=2))
        
        # 4. Show the differences
        print("\n4. Key transformations applied:")
        print("   • scenario_id → id")
        print("   • scenario_name → name")
        print("   • test_case_id → id")
        print("   • test_case_name → title")
        print("   • test_objective → description")
        print("   • requirement, test_objective, scenario → steps array")
        print("   • Added priority field (auto-determined)")
        print("   • Added version field")
        print("   • Added status field (default: 'untested')")
        
        # 5. Show sample transformed data
        if transformed_data.get('scenarios'):
            scenario = transformed_data['scenarios'][0]
            print(f"\n5. Sample transformed scenario:")
            print(f"   ID: {scenario['id']}")
            print(f"   Name: {scenario['name']}")
            print(f"   Priority: {scenario['priority']}")
            print(f"   Version: {scenario['version']}")
            
            if scenario.get('test_cases'):
                test_case = scenario['test_cases'][0]
                print(f"\n   Sample test case:")
                print(f"     ID: {test_case['id']}")
                print(f"     Title: {test_case['title']}")
                print(f"     Description: {test_case['description']}")
                print(f"     Status: {test_case['status']}")
                print(f"     Steps: {len(test_case['steps'])} steps")
                for i, step in enumerate(test_case['steps'], 1):
                    print(f"       {i}. {step}")
    else:
        print("❌ Transformation failed!")

def example_api_usage():
    """Example of how to use the API with workflow output"""
    
    print("\n=== API Usage Example ===\n")
    
    # Example API call
    api_url = "http://localhost:5000/api/scenario/save_from_workflow"
    api_body = {
        "project_id": "MAN-HOUR",
        "workflow_output": workflow_output
    }
    
    print("API Call:")
    print(f"POST {api_url}")
    print("Headers: Content-Type: application/json")
    print("Body:")
    print(json.dumps(api_body, indent=2))
    
    print("\nExpected Response:")
    print("200 OK")
    print('{"status": 200, "message": "Scenarios saved from workflow output"}')
    
    # Uncomment to make actual API call
    # try:
    #     response = requests.post(api_url, json=api_body)
    #     print(f"\nActual Response: {response.status_code}")
    #     print(response.json())
    # except Exception as e:
    #     print(f"Error: {e}")

if __name__ == "__main__":
    example_usage()
    example_api_usage() 