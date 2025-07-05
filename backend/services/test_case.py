import uuid
from datetime import datetime
from utils.database import get_connection, MONGODB_DATABASE
from utils.logger import logger

class TestCaseService:
    @staticmethod
    def save_test_cases(project_id, scenario_id, test_cases):
        """Save test cases for a scenario"""
        logger.info(f"Saving test cases for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            # Delete existing test cases for this scenario
            db.test_cases.delete_many({'project_id': project_id, 'scenario_id': scenario_id})
            # Insert new test cases
            for test_case in test_cases:
                test_case_doc = dict(test_case)
                test_case_doc['id'] = test_case.get('id', str(uuid.uuid4()))
                test_case_doc['project_id'] = project_id
                test_case_doc['scenario_id'] = scenario_id
                test_case_doc['created_at'] = test_case.get('created_at', datetime.utcnow())
                test_case_doc['updated_at'] = datetime.utcnow()
                test_case_doc['version'] = test_case.get('version', '1.0')
                db.test_cases.insert_one(test_case_doc)
            return True
        except Exception as e:
            logger.error(f"Error saving test cases: {e}")
            return False

    @staticmethod
    def get_test_cases(project_id, scenario_id):
        """Get all test cases for a scenario"""
        logger.info(f"Fetching test cases for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_cases = list(db.test_cases.find(
                {'project_id': project_id, 'scenario_id': scenario_id}, 
                {'_id': 0}
            ))
            return test_cases
        except Exception as e:
            logger.error(f"Error fetching test cases: {e}")
            return []

    @staticmethod
    def update_test_case(project_id, scenario_id, test_case_id, data):
        """Update a specific test case"""
        logger.info(f"Updating test case {test_case_id} for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            # Add updated_at timestamp
            data['updated_at'] = datetime.utcnow()
            result = db.test_cases.update_one(
                {'project_id': project_id, 'scenario_id': scenario_id, 'id': test_case_id},
                {'$set': data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating test case: {e}")
            return False

    @staticmethod
    def delete_test_case(project_id, scenario_id, test_case_id):
        """Delete a specific test case"""
        logger.info(f"Deleting test case {test_case_id} for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            result = db.test_cases.delete_one({
                'project_id': project_id, 
                'scenario_id': scenario_id, 
                'id': test_case_id
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting test case: {e}")
            return False

    @staticmethod
    def get_test_case_by_id(project_id, scenario_id, test_case_id):
        """Get a specific test case by ID"""
        logger.info(f"Fetching test case {test_case_id} for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_case = db.test_cases.find_one(
                {'project_id': project_id, 'scenario_id': scenario_id, 'id': test_case_id}, 
                {'_id': 0}
            )
            return test_case
        except Exception as e:
            logger.error(f"Error fetching test case: {e}")
            return None

    @staticmethod
    def create_test_case(project_id, scenario_id, test_case_data):
        """Create a new test case"""
        logger.info(f"Creating test case for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_case_doc = dict(test_case_data)
            test_case_doc['id'] = str(uuid.uuid4())
            test_case_doc['project_id'] = project_id
            test_case_doc['scenario_id'] = scenario_id
            test_case_doc['created_at'] = datetime.utcnow()
            test_case_doc['updated_at'] = datetime.utcnow()
            test_case_doc['version'] = test_case_data.get('version', '1.0')
            test_case_doc['status'] = test_case_data.get('status', 'untested')
            
            result = db.test_cases.insert_one(test_case_doc)
            test_case_doc['_id'] = str(result.inserted_id)
            return test_case_doc
        except Exception as e:
            logger.error(f"Error creating test case: {e}")
            return None 