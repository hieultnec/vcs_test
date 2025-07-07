import json
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from datetime import datetime
from .logger import logger

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://mongodb:27017")
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "docker-fastapi-mongodb")

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format."""
    if doc is None:
        return None
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    if isinstance(doc, list):
        return [serialize_doc(v) for v in doc]
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc

def check_db_connection():
    try:
        # Replace with your MongoDB URI if needed
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=3000)

        # Force connection on a request as the connect=True parameter of MongoClient seems to be useless here        client.admin.command('ping')
        logger.info("✅ Connected to MongoDB!")
    except ConnectionFailure as e:
        logger.error("❌ Could not connect to MongoDB: %s", e)

def get_connection():
    try:
        client = MongoClient(MONGODB_URL)
        logger.info("MongoDB connection established")
        return client
    except ConnectionFailure as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        return None

def insert_or_update_item(table, query, update_data):
    """
    Inserts a new document if no document matches the query,
    otherwise updates the first matching document with the update_data.

    Args:
        query (dict): The query to find an existing document.
        update_data (dict): The data to set or update in the document.
                           You should use update operators like $set.
        table (str): name of table
    """
    try:

        conn = get_connection()
        db = conn[MONGODB_DATABASE]
        collection = db[table]
        update_result = collection.update_one(
            query,
            {'$set': update_data},
            upsert=True
        )
        conn.close()
        if update_result.upserted_id is not None:
            logger.info("New document inserted with ID: %s", update_result.upserted_id)
            return True
        elif update_result.modified_count > 0:
            logger.info("Document updated. Matched: %d, Modified: %d", 
                     update_result.matched_count, update_result.modified_count)
            return True
        else:
            logger.warning("No document matched the query and no new document was inserted")
            return False
    except ConnectionFailure as e:
        logger.error("Connection failure during upsert: %s", e)
        return False

def get(table, condition):
    logger.info("Getting document from table '%s' with condition: %s", table, condition)
    try:
        conn = get_connection()
        db = conn[MONGODB_DATABASE]
        collection = db[table]
        res = collection.find_one(condition, {'_id': 0})
        conn.close()
        logger.debug("Retrieved document: %s", res)
        return res
    except ConnectionFailure as e:
        logger.error("Connection failure during get: %s", e)

def get_all(table, condition):
    logger.info("Getting all documents from table '%s' with condition: %s", table, condition)
    try:
        conn = get_connection()
        db = conn[MONGODB_DATABASE]
        collection = db[table]
        res = list(collection.find(condition, {'_id': 0}))
        conn.close()
        logger.info("Retrieved %d documents", len(res))
        logger.debug("Retrieved documents: %s", res)
        return res
    except ConnectionFailure as e:
        logger.error("Connection failure during get_all: %s", e)

def get_all_projects():
    logger.info("Retrieving all projects")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        projects = list(db.projects.find())
        logger.info("Retrieved %d projects", len(projects))
        # Ensure all fields are present for each project
        for p in projects:
            p.setdefault('id', p.get('project_id'))
            p.setdefault('name', '')
            p.setdefault('description', '')
            p.setdefault('version', '1.0')
            p.setdefault('owner', '')
            p.setdefault('lastUpdated', p.get('created_at', datetime.utcnow()))
            p.setdefault('status', 'draft')
            p.setdefault('created_at', datetime.utcnow())
        return serialize_doc(projects)
    except Exception as e:
        logger.error("Error getting projects: %s", e)
        raise e

def create_project(data):
    logger.info("Creating new project with data: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        project = {
            'project_id': data['project_id'],
            'id': data.get('id', data['project_id']),
            'name': data['name'],
            'description': data.get('description', ''),
            'version': data.get('version', '1.0'),
            'owner': data.get('owner', ''),
            'lastUpdated': data.get('lastUpdated', data.get('created_at', datetime.utcnow())),
            'status': data.get('status', 'draft'),
            'created_at': data.get('created_at', datetime.utcnow())
        }
        logger.debug("Prepared project document: %s", project)
        result = db.projects.insert_one(project)
        project['_id'] = str(result.inserted_id)
        logger.info("Project created successfully with ID: %s", project['project_id'])
        return project
    except Exception as e:
        logger.error("Error creating project: %s", e)
        raise e

def get_project(project_id):
    logger.info("Getting project with ID: %s", project_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        # Try to find by project_id first
        logger.debug("Searching by project_id: %s", project_id)
        project = db.projects.find_one({'project_id': project_id})
        if not project:
            # Fallback to _id
            try:
                logger.debug("Project not found by project_id, trying ObjectId")
                project = db.projects.find_one({'_id': ObjectId(project_id)})
            except:
                logger.warning("Project not found with either project_id or ObjectId")
                project = None
        if project:
            logger.info("Project found: %s", project.get('name', 'Unknown'))
        return serialize_doc(project)
    except Exception as e:
        logger.error("Error getting project: %s", e)
        raise e

def get_project_tasks(project_id):
    logger.info("Getting tasks for project_id: %s", project_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        # Let's first check what's in the collection
        all_tasks = list(db.tasks.find())
        logger.debug("All tasks in collection: %s", all_tasks)
        
        # Now search with our query
        query = {'project_id': project_id}
        logger.debug("Searching tasks with query: %s", query)
        tasks = list(db.tasks.find(query))
        
        if tasks:
            logger.info("Found %d tasks for project_id %s", len(tasks), project_id)
            logger.debug("Task details before serialization: %s", tasks)
            serialized_tasks = serialize_doc(tasks)
            logger.debug("Serialized task details: %s", serialized_tasks)
            return serialized_tasks
        else:
            logger.warning("No tasks found for project_id: %s", project_id)
            logger.debug("Checking task insertion: %s", db.tasks.find_one({'_id': ObjectId("683f3ada186b07cac0a0c5f9")}))
            return []
    except Exception as e:
        logger.error("Error getting project tasks: %s", e)
        raise e

def create_task(data):
    """Create a new task in the database."""
    logger.info("Creating task with data: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
            
        db = client[MONGODB_DATABASE]
        
        # Verify required fields
        if not data.get('task_id'):
            logger.error("task_id is required")
            raise Exception("task_id is required")
            
        task = {
            'project_id': data['project_id'],
            'task_id': data['task_id'],  # Use provided task_id
            'task_name': data['task_name'],
            'url': data.get('url', ''),
            'context': data.get('context', []),
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        logger.debug("Prepared task document: %s", task)
        result = db.tasks.insert_one(task)
        task['_id'] = str(result.inserted_id)
        logger.info("Task created successfully with ID: %s", task['task_id'])
        logger.debug("Created task details: %s", task)
        return task
        
    except Exception as e:
        logger.error("Error creating task: %s", e)
        raise e

def get_task(project_id, task_id):
    """Get a specific task by project_id and task_id."""
    logger.info("Getting task. Project ID: %s, Task ID: %s", project_id, task_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
            
        db = client[MONGODB_DATABASE]
        task = db.tasks.find_one({
            'project_id': project_id,
            'task_id': task_id
        })
        
        if task:
            task['_id'] = str(task['_id'])
            logger.info("Task found: %s", task)
            return task
            
        logger.warning("Task not found")
        return None
        
    except Exception as e:
        logger.error("Error getting task: %s", str(e))
        raise e

def update_task_status(task_id, status):
    """Update task status."""
    logger.info("Updating task status. Task ID: %s, New Status: %s", task_id, status)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
            
        db = client[MONGODB_DATABASE]
        result = db.tasks.update_one(
            {'task_id': task_id}, 
            {'$set': {
                'status': status,
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            logger.info("Task status updated successfully")
            return True
            
        logger.warning("Task not found or status unchanged")
        return False
        
    except Exception as e:
        logger.error("Error updating task status: %s", str(e))
        raise e

def update_project(project_id, data):
    logger.info("Updating project. Project ID: %s", project_id)
    logger.debug("Update data: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        # Try to find by project_id first
        logger.debug("Searching by project_id first")
        project = db.projects.find_one({'project_id': project_id})
        if not project:
            # Fallback to _id
            try:
                logger.debug("Project not found by project_id, trying ObjectId")
                project = db.projects.find_one({'_id': ObjectId(project_id)})
            except:
                logger.warning("Project not found with either project_id or ObjectId")
                project = None
        if not project:
            raise Exception("Project not found")
        update_data = {
            'name': data.get('name', project.get('name', '')),
            'description': data.get('description', project.get('description', '')),
            'version': data.get('version', project.get('version', '1.0')),
            'owner': data.get('owner', project.get('owner', '')),
            'lastUpdated': data.get('lastUpdated', datetime.utcnow()),
            'status': data.get('status', project.get('status', 'draft'))
        }
        result = db.projects.update_one(
            {'_id': project['_id']},
            {'$set': update_data}
        )
        if result.modified_count > 0:
            return db.projects.find_one({'_id': project['_id']})
        return None
    except Exception as e:
        print(f"Error updating project: {e}")
        raise e

def delete_project(project_id):
    logger.info("Deleting project. Project ID: %s", project_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        # Try to find by project_id first
        logger.debug("Searching by project_id first")
        project = db.projects.find_one({'project_id': project_id})
        if not project:
            # Fallback to _id
            try:
                logger.debug("Project not found by project_id, trying ObjectId")
                project = db.projects.find_one({'_id': ObjectId(project_id)})
            except:
                logger.warning("Project not found with either project_id or ObjectId")
                project = None
                
        if not project:
            raise Exception("Project not found")
            
        # Delete all tasks associated with this project
        db.tasks.delete_many({'project_id': project_id})
        
        # Delete project directory if it exists
        project_dir = f'projects/{project_id}'
        if os.path.exists(project_dir):
            import shutil
            shutil.rmtree(project_dir)
            
        # Delete the project
        result = db.projects.delete_one({'_id': project['_id']})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting project: {e}")
        raise e

def update_task(task_id, data):
    logger.info("Updating task. Task ID: %s", task_id)
    logger.debug("Update data: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        # Log current state of task
        existing = db.tasks.find_one({'task_id': task_id})
        if existing:
            logger.debug("Found existing task by task_id: %s", existing)
        
        # Try to find by task_id first
        logger.debug("Searching by task_id first")
        task = db.tasks.find_one({'task_id': task_id})
        if not task:
            # Fallback to _id
            try:
                logger.debug("Task not found by task_id, trying ObjectId")
                task = db.tasks.find_one({'_id': ObjectId(task_id)})
            except Exception as e:
                logger.warning("Task not found with task_id and failed with ObjectId: %s. Error: %s", task_id, str(e))
                task = None
                
        if not task:
            logger.error("Task not found: %s", task_id)
            raise Exception("Task not found")
            
        update_data = {
            'task_name': data.get('task_name', task['task_name']),
            'url': data.get('url', task.get('url', '')),
            'context': data.get('context', task.get('context', []))
        }
        logger.debug("Prepared update data: %s", update_data)
        
        result = db.tasks.update_one(
            {'_id': task['_id']},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            logger.info("Task updated successfully")
            updated_task = db.tasks.find_one({'_id': task['_id']})
            logger.debug("Updated task: %s", updated_task)
            return updated_task
        logger.warning("No changes applied to task")
        return None
    except Exception as e:
        logger.error("Error updating task: %s", e)
        raise e

def delete_task(project_id, task_id):
    logger.info("Deleting task. Task ID: %s", task_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        # Try to find by task_id first
        logger.debug("Searching by task_id first")
        task = db.tasks.find_one({'project_id': project_id, 'task_id': task_id})
        if not task:
            # Fallback to _id
            try:
                logger.debug("Task not found by task_id, trying ObjectId")
                task = db.tasks.find_one({'_id': ObjectId(task_id)})
            except:
                logger.warning("Task not found with either task_id or ObjectId")
                task = None
                
        if not task:
            logger.error("Task not found: %s", task_id)
            raise Exception("Task not found")
            
        # Delete task directory if it exists
        task_dir = f'projects/{task["project_id"]}/{task_id}'
        if os.path.exists(task_dir):
            logger.info("Deleting task directory: %s", task_dir)
            import shutil
            shutil.rmtree(task_dir)
        else:
            logger.debug("Task directory does not exist: %s", task_dir)
            
        # Delete the task
        logger.debug("Deleting task from database")
        result = db.tasks.delete_one({'_id': task['_id']})
        success = result.deleted_count > 0
        if success:
            logger.info("Task deleted successfully")
        else:
            logger.warning("Task was not deleted")
        return success
    except Exception as e:
        logger.error("Error deleting task: %s", e)
        raise e

def create_document(data):
    """Create a new document entry in the database."""
    logger.info("Creating document with data: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        # If is_current, unset is_current for other docs in this project
        if data.get('is_current', False):
            db.documents.update_many({'project_id': data['project_id']}, {'$set': {'is_current': False}})
        document = {
            'document_id': data['document_id'],
            'project_id': data['project_id'],
            'filename': data['filename'],
            'filepath': data['filepath'],
            'dify_document_id': data.get('dify_document_id', ''),
            'is_current': data.get('is_current', False),
            'uploaded_at': data.get('uploaded_at', datetime.utcnow()),
            'metadata': data.get('metadata', {})
        }
        result = db.documents.insert_one(document)
        document['_id'] = str(result.inserted_id)
        logger.info("Document created successfully with ID: %s", document['document_id'])
        return document
    except Exception as e:
        logger.error("Error creating document: %s", e)
        raise e

def get_documents_by_project(project_id):
    """Get all documents for a project."""
    logger.info("Getting documents for project_id: %s", project_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        docs = list(db.documents.find({'project_id': project_id}))
        return serialize_doc(docs)
    except Exception as e:
        logger.error("Error getting documents: %s", e)
        raise e

def delete_document(document_id):
    """Delete a document by document_id."""
    logger.info("Deleting document: %s", document_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        doc = db.documents.find_one({'document_id': document_id})
        if not doc:
            logger.warning("Document not found: %s", document_id)
            return False
        # Remove file from filesystem
        filepath = doc.get('filepath')
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        result = db.documents.delete_one({'document_id': document_id})
        logger.info("Document deleted: %s", document_id)
        return result.deleted_count > 0
    except Exception as e:
        logger.error("Error deleting document: %s", e)
        raise e

def update_document(document_id, data):
    """Update document fields."""
    logger.info("Updating document %s with data: %s", document_id, data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        # If is_current is set True, unset for others in project
        if data.get('is_current', False):
            doc = db.documents.find_one({'document_id': document_id})
            if doc:
                db.documents.update_many({'project_id': doc['project_id']}, {'$set': {'is_current': False}})
        result = db.documents.update_one({'document_id': document_id}, {'$set': data})
        logger.info("Document updated: %s", document_id)
        return result.modified_count > 0
    except Exception as e:
        logger.error("Error updating document: %s", e)
        raise e

def get_document_by_id(document_id):
    """Get a single document by document_id."""
    logger.info("Getting document by document_id: %s", document_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        doc = db.documents.find_one({'document_id': document_id})
        return serialize_doc(doc)
    except Exception as e:
        logger.error("Error getting document by id: %s", e)
        raise e

def get_test_cases(task_id):
    """Get test cases for a task."""
    logger.info("Getting test cases for task_id: %s", task_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        test_cases = list(db.test_cases.find({'task_id': task_id}, {'_id': 0}))
        return test_cases
    except Exception as e:
        logger.error("Error getting test cases: %s", e)
        return []

def save_test_scenarios(task_id, test_scenarios):
    """Save test scenarios for a task."""
    logger.info("Saving test scenarios for task_id: %s", task_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        # Delete existing test scenarios for this task
        db.test_cases.delete_many({'task_id': task_id})
        # Insert new test scenarios
        for scenario in test_scenarios:
            scenario_doc = dict(scenario)
            scenario_doc['task_id'] = task_id
            db.test_cases.insert_one(scenario_doc)
        return True
    except Exception as e:
        logger.error("Error saving test scenarios: %s", e)
        return False

def get_test_scenarios(task_id):
    """Get test scenarios for a task."""
    logger.info("Getting test scenarios for task_id: %s", task_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        test_scenarios = list(db.test_cases.find({'task_id': task_id}, {'_id': 0}))
        return test_scenarios
    except Exception as e:
        logger.error("Error getting test scenarios: %s", e)
        return []

def save_workflow_execution(execution):
    """Save workflow execution record."""
    logger.info(f"Saving workflow execution: {execution.get('execution_id')}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        result = db.workflow_executions.insert_one(execution)
        client.close()
        
        if result.inserted_id:
            logger.info(f"Workflow execution saved successfully: {execution.get('execution_id')}")
            return True
        else:
            logger.error(f"Failed to save workflow execution: {execution.get('execution_id')}")
            return False
    except Exception as e:
        logger.error(f"Error saving workflow execution: {e}")
        raise e

def get_workflow_execution(execution_id):
    """Get workflow execution by ID."""
    logger.info(f"Getting workflow execution: {execution_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        execution = db.workflow_executions.find_one({'execution_id': execution_id})
        client.close()
        
        return serialize_doc(execution)
    except Exception as e:
        logger.error(f"Error getting workflow execution: {e}")
        raise e

def update_workflow_execution(execution_id, update_data):
    """Update workflow execution."""
    logger.info(f"Updating workflow execution: {execution_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        result = db.workflow_executions.update_one(
            {'execution_id': execution_id},
            {'$set': update_data}
        )
        client.close()
        
        if result.modified_count > 0:
            logger.info(f"Workflow execution updated successfully: {execution_id}")
            return True
        else:
            logger.warning(f"No changes made to workflow execution: {execution_id}")
            return False
    except Exception as e:
        logger.error(f"Error updating workflow execution: {e}")
        raise e

def get_workflow_executions(project_id):
    """Get all workflow executions for a project."""
    logger.info(f"Getting workflow executions for project: {project_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        executions = list(db.workflow_executions.find({'project_id': project_id}).sort('created_at', -1))
        client.close()
        
        return serialize_doc(executions)
    except Exception as e:
        logger.error(f"Error getting workflow executions: {e}")
        raise e

def create_workflow(data):
    """Create a new workflow."""
    logger.info("Creating workflow: %s", data)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        result = db.workflows.insert_one(data)
        data['_id'] = str(result.inserted_id)
        logger.info("Workflow created successfully with ID: %s", data.get('workflow_id'))
        client.close()
        return data
    except Exception as e:
        logger.error("Error creating workflow: %s", e)
        raise e

def get_workflow(workflow_id):
    logger.info("Getting workflow with ID: %s", workflow_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        workflow = db.workflows.find_one({'workflow_id': workflow_id})
        client.close()
        if workflow:
            workflow.pop('_id', None)
        return workflow
    except Exception as e:
        logger.error("Error getting workflow: %s", e)
        raise e

def update_workflow(workflow_id, update_data):
    logger.info("Updating workflow: %s", workflow_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        update_data['updated_at'] = datetime.utcnow()
        db.workflows.update_one({'workflow_id': workflow_id}, {'$set': update_data})
        client.close()
        return get_workflow(workflow_id)
    except Exception as e:
        logger.error("Error updating workflow: %s", e)
        raise e

def delete_workflow(workflow_id):
    logger.info("Deleting workflow: %s", workflow_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        db.workflows.delete_one({'workflow_id': workflow_id})
        client.close()
        return True
    except Exception as e:
        logger.error("Error deleting workflow: %s", e)
        raise e

def list_workflows(project_id=None):
    logger.info("Listing workflows for project_id: %s", project_id)
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        query = {'project_id': project_id} if project_id else {}
        workflows = list(db.workflows.find(query))
        for wf in workflows:
            wf.pop('_id', None)
        client.close()
        return workflows
    except Exception as e:
        logger.error("Error listing workflows: %s", e)
        raise e

def create_workflow_execution(data):
    logger.info(f"Creating workflow execution: {data}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        result = db.workflow_executions.insert_one(data)
        data['_id'] = str(result.inserted_id)
        logger.info(f"Workflow execution created successfully with ID: {data.get('id')}")
        client.close()
        return data
    except Exception as e:
        logger.error(f"Error creating workflow execution: {e}")
        raise e

def update_workflow_execution(execution_id, update_data):
    logger.info(f"Updating workflow execution: {execution_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        db.workflow_executions.update_one({'id': execution_id}, {'$set': update_data})
        client.close()
        return get_workflow_execution(execution_id)
    except Exception as e:
        logger.error(f"Error updating workflow execution: {e}")
        raise e

def get_workflow_execution(execution_id):
    logger.info(f"Getting workflow execution: {execution_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        execution = db.workflow_executions.find_one({'id': execution_id})
        client.close()
        if execution:
            execution.pop('_id', None)
        return execution
    except Exception as e:
        logger.error(f"Error getting workflow execution: {e}")
        raise e

def list_workflow_executions(workflow_id=None):
    logger.info(f"Listing workflow executions for workflow_id: {workflow_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        query = {'workflow_id': workflow_id} if workflow_id else {}
        executions = list(db.workflow_executions.find(query))
        for ex in executions:
            ex.pop('_id', None)
        client.close()
        return executions
    except Exception as e:
        logger.error(f"Error listing workflow executions: {e}")
        raise e

def get_workflow_config(project_id):
    """Get workflow configuration for a project."""
    logger.info(f"Getting workflow config for project: {project_id}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        config = db.workflow_configs.find_one({'project_id': project_id})
        client.close()
        return serialize_doc(config)
    except Exception as e:
        logger.error(f"Error getting workflow config: {e}")
        raise e

def save_workflow_config(config):
    """Save workflow configuration."""
    logger.info(f"Saving workflow config for project: {config.get('project_id')}")
    try:
        client = get_connection()
        if not client:
            logger.error("Failed to connect to MongoDB")
            raise Exception("Could not connect to MongoDB")
        db = client[MONGODB_DATABASE]
        
        # Use upsert to create or update
        result = db.workflow_configs.update_one(
            {'project_id': config['project_id']},
            {'$set': config},
            upsert=True
        )
        client.close()
        
        if result.upserted_id or result.modified_count > 0:
            logger.info(f"Workflow config saved successfully for project: {config.get('project_id')}")
            return True
        else:
            logger.warning(f"No changes made to workflow config for project: {config.get('project_id')}")
            return False
    except Exception as e:
        logger.error(f"Error saving workflow config: {e}")
        raise e