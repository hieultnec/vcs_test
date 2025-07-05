from datetime import datetime
from utils.database import get_connection, MONGODB_DATABASE
from utils.logger import logger
from services.test_case import TestCaseService

class ScenarioService:
    @staticmethod
    def save_scenarios(project_id, scenarios):
        """Save scenarios for a project"""
        logger.info(f"Saving scenarios for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            # Delete existing scenarios for this project
            db.scenarios.delete_many({'project_id': project_id})
            # Insert new scenarios
            for scenario in scenarios:
                scenario_doc = dict(scenario)
                scenario_doc['project_id'] = project_id
                scenario_doc['version'] = scenario.get('version', '1.0')
                scenario_doc['created_at'] = scenario.get('created_at', datetime.utcnow())
                scenario_doc['updated_at'] = datetime.utcnow()
                db.scenarios.insert_one(scenario_doc)
            return True
        except Exception as e:
            logger.error(f"Error saving scenarios: {e}")
            return False

    @staticmethod
    def get_scenarios(project_id):
        """Get all scenarios for a project"""
        logger.info(f"Fetching scenarios for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            scenarios = list(db.scenarios.find({'project_id': project_id}, {'_id': 0}))
            
            # Add test cases to each scenario
            for scenario in scenarios:
                scenario['test_cases'] = TestCaseService.get_test_cases(project_id, scenario['id'])
            
            return scenarios
        except Exception as e:
            logger.error(f"Error fetching scenarios: {e}")
            return []

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

    @staticmethod
    def get_scenario_by_id(project_id, scenario_id):
        """Get a specific scenario by ID"""
        logger.info(f"Fetching scenario {scenario_id} for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            scenario = db.scenarios.find_one(
                {'project_id': project_id, 'id': scenario_id}, 
                {'_id': 0}
            )
            
            if scenario:
                # Add test cases to the scenario
                scenario['test_cases'] = TestCaseService.get_test_cases(project_id, scenario_id)
            
            return scenario
        except Exception as e:
            logger.error(f"Error fetching scenario: {e}")
            return None 