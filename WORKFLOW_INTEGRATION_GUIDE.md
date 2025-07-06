# Workflow Integration Guide

This guide explains how to integrate workflow output with the updated test scenario system.

## Overview

The workflow output uses the old field names (`scenario_id`, `scenario_name`, `test_case_id`, etc.), but our updated system uses new field names (`id`, `name`, `title`, etc.). This guide provides a complete solution to transform and save workflow output.

## Problem

Your workflow output has this structure:
```json
{
  "structured_output": {
    "project_id": "MAN-HOUR",
    "scenarios": [
      {
        "scenario_id": "SC-01",
        "scenario_name": "View Activities List Performance",
        "test_cases": [
          {
            "test_case_id": "TC-MH-50-LOAD",
            "test_case_name": "Activities List Loading Time",
            "requirement": "MH-50 – View List of Activities",
            "test_objective": "Verify the activities list loads...",
            "scenario": "Load the Activities List page...",
            "expected_result": "The Activities List page loads in under 3 seconds."
          }
        ]
      }
    ]
  }
}
```

But our system expects this structure:
```json
{
  "project_id": "MAN-HOUR",
  "scenarios": [
    {
      "id": "SC-01",
      "name": "View Activities List Performance",
      "priority": "Medium",
      "version": "1.0",
      "test_cases": [
        {
          "id": "TC-MH-50-LOAD",
          "title": "Activities List Loading Time",
          "description": "Verify the activities list loads...",
          "steps": [
            "Requirement: MH-50 – View List of Activities",
            "Objective: Verify the activities list loads...",
            "Steps: Load the Activities List page..."
          ],
          "expected_result": "The Activities List page loads in under 3 seconds.",
          "status": "untested",
          "version": "1.0"
        }
      ]
    }
  ]
}
```

## Solution

### 1. Workflow Transformer (`backend/utils/workflow_transformer.py`)

This utility transforms workflow output to match our updated data structure:

**Key Transformations:**
- `scenario_id` → `id`
- `scenario_name` → `name`
- `test_case_id` → `id`
- `test_case_name` → `title`
- `test_objective` → `description`
- `requirement`, `test_objective`, `scenario` → `steps` array
- Auto-determines `priority` based on scenario name
- Adds `version` field (default: "1.0")
- Adds `status` field (default: "untested")

### 2. New API Endpoint

**Endpoint:** `POST /api/scenario/save_from_workflow`

**Request Body:**
```json
{
  "project_id": "MAN-HOUR",
  "workflow_output": {
    "structured_output": {
      "project_id": "MAN-HOUR",
      "scenarios": [...]
    }
  }
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Scenarios saved from workflow output"
}
```

### 3. Updated Service Layer

The `ScenarioService` now includes:
- `save_scenarios_from_workflow()` method
- Automatic transformation of workflow output
- Validation of transformed data
- Error handling and logging

### 4. Frontend Integration

The frontend service includes:
- `WorkflowOutput` interface for type safety
- `saveScenariosFromWorkflow()` method
- Proper error handling

## Usage Examples

### Backend Usage

```python
from utils.workflow_transformer import process_workflow_output

# Transform workflow output
transformed_data = process_workflow_output(workflow_output)

# Save to database
success = ScenarioService.save_scenarios_from_workflow(project_id, workflow_output)
```

### API Usage

```bash
curl -X POST http://localhost:5000/api/scenario/save_from_workflow \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "MAN-HOUR",
    "workflow_output": {
      "structured_output": {
        "project_id": "MAN-HOUR",
        "scenarios": [...]
      }
    }
  }'
```

### Frontend Usage

```typescript
import { scenarioService } from '@/services/scenarioService';

// Save scenarios from workflow output
await scenarioService.saveScenariosFromWorkflow(projectId, workflowOutput);
```

## Priority Determination

The transformer automatically determines priority based on scenario name:

**High Priority:** Contains keywords like "critical", "security", "payment", "login", "authentication", "performance"

**Medium Priority:** Contains keywords like "report", "export", "search", "filter", "sort", "pagination"

**Default:** Medium priority

## Validation

The transformer includes comprehensive validation:
- Required fields presence
- Data type validation
- Structure validation
- Project ID matching

## Error Handling

- Transformation failures are logged
- Invalid data is rejected
- API errors return appropriate HTTP status codes
- Frontend shows user-friendly error messages

## Testing

Run the test script to see the transformation in action:

```bash
cd backend
python test_workflow_transformer.py
```

This will show:
1. Original workflow output
2. Transformed data structure
3. Key transformations applied
4. Sample transformed scenario and test case

## Files Created/Modified

### New Files:
- `backend/utils/workflow_transformer.py` - Transformation logic
- `backend/test_workflow_transformer.py` - Test script
- `backend/example_workflow_usage.py` - Usage examples
- `WORKFLOW_INTEGRATION_GUIDE.md` - This guide

### Modified Files:
- `backend/services/scenario.py` - Added workflow support
- `backend/controllers/scenario.py` - Added new endpoint
- `backend/routes/route.json` - Added new route
- `backend/swagger/swagger.yml` - Added API documentation
- `frontend/src/services/scenarioService.ts` - Added workflow interface

## Benefits

1. **Seamless Integration:** Workflow output is automatically transformed to match the new system
2. **Backward Compatibility:** Old workflow output format is supported
3. **Data Quality:** Automatic validation ensures data integrity
4. **User Experience:** No manual data transformation required
5. **Maintainability:** Clean separation of concerns with dedicated transformer
6. **Extensibility:** Easy to add new transformation rules

## Next Steps

1. Test the transformation with your actual workflow output
2. Integrate the new endpoint into your workflow execution
3. Update any frontend components to use the new workflow interface
4. Monitor logs for any transformation issues
5. Consider adding more sophisticated priority determination logic if needed 