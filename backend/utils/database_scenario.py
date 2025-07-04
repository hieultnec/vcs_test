from utils.database import get_connection, MONGODB_DATABASE
import logging
logger = logging.getLogger(__name__)

def save_scenarios(project_id, scenarios):
    logger.info(f"Saving scenarios for project_id: {project_id}")
    try:
        client = get_connection()
        db = client[MONGODB_DATABASE]
        db.scenarios.delete_many({'project_id': project_id})
        for scenario in scenarios:
            scenario_doc = dict(scenario)
            scenario_doc['project_id'] = project_id
            db.scenarios.insert_one(scenario_doc)
        return True
    except Exception as e:
        logger.error(f"Error saving scenarios: {e}")
        return False

def get_scenarios(project_id):
    logger.info(f"Fetching scenarios for project_id: {project_id}")
    try:
        client = get_connection()
        db = client[MONGODB_DATABASE]
        scenarios = list(db.scenarios.find({'project_id': project_id}, {'_id': 0}))
        return scenarios
    except Exception as e:
        logger.error(f"Error fetching scenarios: {e}")
        return []

def update_scenario(project_id, scenario_id, scenario_data):
    logger.info(f"Updating scenario {scenario_id} for project_id: {project_id}")
    try:
        client = get_connection()
        db = client[MONGODB_DATABASE]
        result = db.scenarios.update_one(
            {'project_id': project_id, 'id': scenario_id},
            {'$set': scenario_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating scenario: {e}")
        return False

def delete_scenario(project_id, scenario_id):
    logger.info(f"Deleting scenario {scenario_id} for project_id: {project_id}")
    try:
        client = get_connection()
        db = client[MONGODB_DATABASE]
        result = db.scenarios.delete_one({'project_id': project_id, 'id': scenario_id})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting scenario: {e}")
        return False 