from datetime import datetime
import uuid
from utils.database import get_connection, MONGODB_DATABASE
from utils.logger import logger
from utils.workflow_transformer import process_workflow_output

class ScenarioService:
    @staticmethod
    def save_scenarios(project_id, scenarios, execution_id):
        """Save scenarios for a project"""
        logger.info(f"Saving scenarios for project_id: {project_id} and execution_id: {execution_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            # Delete existing scenarios for this project
            # db.scenarios.delete_many({'project_id': project_id})
            # Insert new scenarios
            for scenario in scenarios:
                scenario_doc = dict(scenario)
                scenario_doc['project_id'] = project_id
                scenario_doc['version'] = scenario.get('version', '1.0')
                scenario_doc['created_at'] = scenario.get('created_at', datetime.utcnow())
                scenario_doc['updated_at'] = datetime.utcnow()
                scenario_doc['test_cases'] = scenario.get('test_cases', [])
                scenario_doc['execution_id'] = execution_id
                db.scenarios.insert_one(scenario_doc)
            return True
        except Exception as e:
            logger.error(f"Error saving scenarios: {e}")
            return False

    @staticmethod
    def save_scenarios_from_workflow(project_id, workflow_output, execution_id):
        """Save scenarios from workflow output after transformation"""
        logger.info(f"Saving scenarios from workflow output for project_id: {project_id}")
        try:
            # Transform the workflow output
            transformed_data = process_workflow_output(workflow_output)
            
            if not transformed_data:
                logger.error("Failed to transform workflow output")
                return False
            
            # Verify project_id matches
            if transformed_data.get('project_id') != project_id:
                logger.warning(f"Project ID mismatch: expected {project_id}, got {transformed_data.get('project_id')}")
            
            # Save the transformed scenarios
            scenarios = transformed_data.get('scenarios', [])
            return ScenarioService.save_scenarios(project_id, scenarios, execution_id)
            
        except Exception as e:
            logger.error(f"Error saving scenarios from workflow: {e}")
            return False

    @staticmethod
    def get_scenarios(project_id):
        """Get all scenarios for a project"""
        logger.info(f"Fetching scenarios for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            scenarios = list(db.scenarios.find({'project_id': project_id}, {'_id': 0}))
            
            return scenarios
        except Exception as e:
            logger.error(f"Error fetching scenarios: {e}")
            return []

    @staticmethod
    def create_scenario(project_id, scenario_data):
        """Create a new scenario"""
        logger.info(f"Creating scenario for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            scenario_doc = dict(scenario_data)
            scenario_doc['id'] = str(uuid.uuid4())
            scenario_doc['project_id'] = project_id
            scenario_doc['created_at'] = datetime.utcnow()
            scenario_doc['updated_at'] = datetime.utcnow()
            scenario_doc['version'] = scenario_data.get('version', '1.0')
            scenario_doc['test_cases'] = []
            
            result = db.scenarios.insert_one(scenario_doc)
            scenario_doc['_id'] = str(result.inserted_id)
            return scenario_doc
        except Exception as e:
            logger.error(f"Error creating scenario: {e}")
            return None

    @staticmethod
    def update_scenario(project_id, scenario_id, scenario_data):
        """Update a specific scenario"""
        logger.info(f"Updating scenario {scenario_id} for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            # Add updated_at timestamp
            scenario_data['updated_at'] = datetime.utcnow()
            result = db.scenarios.update_one(
                {'project_id': project_id, 'id': scenario_id},
                {'$set': scenario_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating scenario: {e}")
            return False

    @staticmethod
    def delete_scenario(project_id, scenario_id):
        """Delete a specific scenario"""
        logger.info(f"Deleting scenario {scenario_id} for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            result = db.scenarios.delete_one({'project_id': project_id, 'id': scenario_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting scenario: {e}")
            return False
