import uuid
from datetime import datetime
from utils.database import get_connection, MONGODB_DATABASE
from utils.logger import logger

class TestRunService:
    @staticmethod
    def record_test_run(data):
        """Record a new test run"""
        logger.info(f"Recording test run for test_case_id: {data.get('test_case_id')}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_run_doc = dict(data)
            test_run_doc['run_id'] = data.get('run_id', str(uuid.uuid4()))
            test_run_doc['executed_at'] = data.get('executed_at', datetime.utcnow())
            test_run_doc['version'] = data.get('version', '1.0')
            
            result = db.test_runs.insert_one(test_run_doc)
            test_run_doc['_id'] = str(result.inserted_id)
            return test_run_doc
        except Exception as e:
            logger.error(f"Error recording test run: {e}")
            return None

    @staticmethod
    def get_test_runs_by_case(project_id, test_case_id):
        """Get all test runs for a specific test case"""
        logger.info(f"Fetching test runs for project_id: {project_id}, test_case_id: {test_case_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_runs = list(db.test_runs.find(
                {'project_id': project_id, 'test_case_id': test_case_id}, 
                {'_id': 0}
            ).sort('executed_at', -1))  # Sort by executed_at descending
            return test_runs
        except Exception as e:
            logger.error(f"Error fetching test runs: {e}")
            return []

    @staticmethod
    def get_latest_test_run(project_id, test_case_id):
        """Get the latest test run for a specific test case"""
        logger.info(f"Fetching latest test run for project_id: {project_id}, test_case_id: {test_case_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_run = db.test_runs.find_one(
                {'project_id': project_id, 'test_case_id': test_case_id}, 
                {'_id': 0}
            ).sort('executed_at', -1)  # Get the most recent
            return test_run
        except Exception as e:
            logger.error(f"Error fetching latest test run: {e}")
            return None

    @staticmethod
    def get_test_run_by_id(run_id):
        """Get a specific test run by run_id"""
        logger.info(f"Fetching test run {run_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_run = db.test_runs.find_one({'run_id': run_id}, {'_id': 0})
            return test_run
        except Exception as e:
            logger.error(f"Error fetching test run: {e}")
            return None

    @staticmethod
    def update_test_run(run_id, data):
        """Update a specific test run"""
        logger.info(f"Updating test run {run_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            result = db.test_runs.update_one(
                {'run_id': run_id},
                {'$set': data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating test run: {e}")
            return False

    @staticmethod
    def delete_test_run(run_id):
        """Delete a specific test run"""
        logger.info(f"Deleting test run {run_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            result = db.test_runs.delete_one({'run_id': run_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting test run: {e}")
            return False

    @staticmethod
    def get_test_runs_by_scenario(project_id, scenario_id):
        """Get all test runs for a specific scenario"""
        logger.info(f"Fetching test runs for project_id: {project_id}, scenario_id: {scenario_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_runs = list(db.test_runs.find(
                {'project_id': project_id, 'scenario_id': scenario_id}, 
                {'_id': 0}
            ).sort('executed_at', -1))
            return test_runs
        except Exception as e:
            logger.error(f"Error fetching test runs by scenario: {e}")
            return []

    @staticmethod
    def get_test_runs_by_project(project_id, limit=100):
        """Get recent test runs for a project"""
        logger.info(f"Fetching recent test runs for project_id: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            test_runs = list(db.test_runs.find(
                {'project_id': project_id}, 
                {'_id': 0}
            ).sort('executed_at', -1).limit(limit))
            return test_runs
        except Exception as e:
            logger.error(f"Error fetching test runs by project: {e}")
            return [] 