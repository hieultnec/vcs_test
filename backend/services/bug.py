import uuid
from datetime import datetime
from utils.database import get_connection, MONGODB_DATABASE
from utils.logger import logger
from collections import defaultdict

class BugService:
    """Service class for managing bugs and related operations."""
    
    @staticmethod
    def create_bug(data):
        """Create a new bug."""
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            logger.debug(f"[create_bug] Connected to DB: {MONGODB_DATABASE} at {client.address}")

            bug_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Ensure project_id is str
            project_id = str(data['project_id'])

            bug_doc = {
                'bug_id': bug_id,
                'project_id': project_id,
                'task_id': data.get('task_id'),
                'scenario_id': data.get('scenario_id'),
                'summary': data['summary'],
                'description': data['description'],
                'status': data.get('status', 'open'),
                'severity': data['severity'],
                'images': data.get('images', []),  # Array of base64 images
                'created_at': now,
                'updated_at': now,
                'created_by': data.get('created_by', 'system'),
                'environment': data.get('environment', {})
            }

            logger.debug(f"[create_bug] Inserting bug: {bug_doc}")
            result = db.bugs.insert_one(bug_doc)
            bug_doc['_id'] = str(result.inserted_id)

            logger.info(f"[create_bug] Bug created successfully with ID: {bug_id}")
            return bug_doc
        except Exception as e:
            logger.error(f"[create_bug] Error creating bug: {e}", exc_info=True)
            raise e

    @staticmethod
    def create_bugs_batch(data):
        """Create multiple bugs in batch."""
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            logger.debug(f"[create_bugs_batch] Connected to DB: {MONGODB_DATABASE} at {client.address}")

            now = datetime.utcnow()
            project_id = str(data['project_id'])
            task_id = data.get('task_id')
            scenario_id = data.get('scenario_id')
            bugs_data = data['bugs']

            # Prepare bug documents
            bug_docs = []
            for bug_data in bugs_data:
                bug_id = str(uuid.uuid4())
                bug_doc = {
                    'bug_id': bug_id,
                    'project_id': project_id,
                    'task_id': task_id,
                    'scenario_id': scenario_id,
                    'summary': bug_data['summary'],
                    'description': bug_data['description'],
                    'status': bug_data.get('status', 'open'),
                    'severity': bug_data['severity'],
                    'images': bug_data.get('images', []),  # Array of base64 images
                    'created_at': now,
                    'updated_at': now,
                    'created_by': bug_data.get('created_by', 'system'),
                    'environment': bug_data.get('environment', {})
                }
                bug_docs.append(bug_doc)

            logger.debug(f"[create_bugs_batch] Inserting {len(bug_docs)} bugs")
            result = db.bugs.insert_many(bug_docs)
            
            # Add _id to each document
            for i, inserted_id in enumerate(result.inserted_ids):
                bug_docs[i]['_id'] = str(inserted_id)

            logger.info(f"[create_bugs_batch] {len(bug_docs)} bugs created successfully")
            return {
                'project_id': project_id,
                'task_id': task_id,
                'scenario_id': scenario_id,
                'bugs': bug_docs,
                'total_created': len(bug_docs)
            }
        except Exception as e:
            logger.error(f"[create_bugs_batch] Error creating bugs batch: {e}", exc_info=True)
            raise e


    @staticmethod
    def get_bugs(project_id, filters=None):
        """Get all bugs for a project with optional filters."""
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            logger.debug(f"[get_bugs] Connected to DB: {MONGODB_DATABASE} at {client.address}")

            # Ensure project_id is str
            project_id = str(project_id)
            query = {'project_id': project_id}

            if filters:
                query.update({k: v for k, v in filters.items() if v is not None})

            logger.debug(f"[get_bugs] Query: {query}")
            bugs = list(db.bugs.find(query, {'_id': 0}).sort('created_at', -1))
            logger.debug(f"[get_bugs] Total bugs returned: {len(bugs)}")

            # Optional: log existing bugs for verification
            all_bugs = list(db.bugs.find({}, {'_id': 0}))
            logger.debug(f"[get_bugs] Current bugs in DB: {all_bugs}")

            return bugs
        except Exception as e:
            logger.error(f"[get_bugs] Error fetching bugs: {e}", exc_info=True)
            return []


    @staticmethod
    def get_bug(bug_id):
        """Get detailed information for a single bug."""
        logger.info(f"Fetching bug details for: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            bug = db.bugs.find_one({'bug_id': bug_id}, {'_id': 0})
            if bug:
                # Get related fixes
                bug['fixes'] = list(db.bug_fixes.find({'bug_id': bug_id}, {'_id': 0}))
                # Get history
                bug['history'] = list(db.bug_histories.find({'bug_id': bug_id}, {'_id': 0}))
                # Get executions
                bug['executions'] = list(db.bug_executions.find({'bug_id': bug_id}, {'_id': 0}))
            
            return bug
        except Exception as e:
            logger.error(f"Error fetching bug details: {e}")
            return None

    @staticmethod
    def update_bug(bug_id, data):
        """Update bug information."""
        logger.info(f"Updating bug: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            # Remove bug_id from update data to avoid conflicts
            update_data = {k: v for k, v in data.items() if k != 'bug_id'}
            update_data['updated_at'] = datetime.utcnow()
            
            result = db.bugs.update_one(
                {'bug_id': bug_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                # Return updated bug
                return db.bugs.find_one({'bug_id': bug_id}, {'_id': 0})
            return None
        except Exception as e:
            logger.error(f"Error updating bug: {e}")
            return None

    @staticmethod
    def delete_bug(bug_id):
        """Delete a bug and all related data."""
        logger.info(f"Deleting bug: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            # Delete related records first
            db.bug_executions.delete_many({'bug_id': bug_id})
            db.bug_histories.delete_many({'bug_id': bug_id})
            db.bug_fixes.delete_many({'bug_id': bug_id})
            
            # Delete the bug
            result = db.bugs.delete_one({'bug_id': bug_id})
            
            logger.info(f"Bug {bug_id} deleted successfully")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting bug: {e}")
            return False

    @staticmethod
    def create_bug_fix(data):
        """Create a bug fix record."""
        logger.info(f"Creating bug fix for bug: {data.get('bug_id')}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            fix_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            fix_doc = {
                'fix_id': fix_id,
                'bug_id': data['bug_id'],
                'fix_description': data['fix_description'],
                'fix_status': data.get('fix_status', 'pending'),
                'fixed_by': data['fixed_by'],
                'verified_by': data.get('verified_by'),
                'images': data.get('images', []),  # Array of base64 images
                'fixed_at': now,
                'verified_at': None
            }
            
            result = db.bug_fixes.insert_one(fix_doc)
            fix_doc['_id'] = str(result.inserted_id)
            
            # Update bug status to 'fixed' if it's currently 'open' or 'in_progress'
            db.bugs.update_one(
                {
                    'bug_id': data['bug_id'],
                    'status': {'$in': ['open', 'in_progress']}
                },
                {
                    '$set': {
                        'status': 'fixed',
                        'updated_at': now
                    }
                }
            )
            
            logger.info(f"Bug fix created successfully with ID: {fix_id}")
            return fix_doc
        except Exception as e:
            logger.error(f"Error creating bug fix: {e}")
            raise e

    @staticmethod
    def verify_bug_fix(fix_id, verified_by, fix_status='verified'):
        """Verify a bug fix."""
        logger.info(f"Verifying bug fix: {fix_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            now = datetime.utcnow()
            result = db.bug_fixes.update_one(
                {'fix_id': fix_id},
                {
                    '$set': {
                        'fix_status': fix_status,
                        'verified_by': verified_by,
                        'verified_at': now
                    }
                }
            )
            
            if result.modified_count > 0:
                # Update bug status based on fix verification
                fix_record = db.bug_fixes.find_one({'fix_id': fix_id})
                if fix_record:
                    bug_status = 'closed' if fix_status == 'verified' else 'open'
                    db.bugs.update_one(
                        {'bug_id': fix_record['bug_id']},
                        {
                            '$set': {
                                'status': bug_status,
                                'updated_at': now
                            }
                        }
                    )
                
                return db.bug_fixes.find_one({'fix_id': fix_id}, {'_id': 0})
            return None
        except Exception as e:
            logger.error(f"Error verifying bug fix: {e}")
            return None

    @staticmethod
    def get_bug_fixes(bug_id):
        """Get all fixes for a bug."""
        logger.info(f"Fetching fixes for bug: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            fixes = list(db.bug_fixes.find({'bug_id': bug_id}, {'_id': 0}).sort('fixed_at', -1))
            return fixes
        except Exception as e:
            logger.error(f"Error fetching bug fixes: {e}")
            return []

    @staticmethod
    def create_bug_history(data):
        """Create bug history record."""
        logger.info(f"Creating bug history for bug: {data.get('bug_id')}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            history_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            history_doc = {
                'history_id': history_id,
                'bug_id': data['bug_id'],
                'before_state': data['before_state'],
                'after_state': data['after_state'],
                'captured_at': now,
                'captured_by': data['captured_by']
            }
            
            result = db.bug_histories.insert_one(history_doc)
            history_doc['_id'] = str(result.inserted_id)
            
            logger.info(f"Bug history created successfully with ID: {history_id}")
            return history_doc
        except Exception as e:
            logger.error(f"Error creating bug history: {e}")
            raise e

    @staticmethod
    def get_bug_history(bug_id):
        """Get history for a bug."""
        logger.info(f"Fetching history for bug: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            history = list(db.bug_histories.find({'bug_id': bug_id}, {'_id': 0}).sort('captured_at', -1))
            return history
        except Exception as e:
            logger.error(f"Error fetching bug history: {e}")
            return []

    @staticmethod
    def execute_bug_test(data):
        """Execute bug test in an execution."""
        logger.info(f"Executing bug test for bug: {data.get('bug_id')} in execution: {data.get('execution_id')}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            now = datetime.utcnow()
            
            execution_doc = {
                'execution_id': data['execution_id'],
                'bug_id': data['bug_id'],
                'status': data['status'],  # passed, failed, blocked
                'notes': data.get('notes', ''),
                'executed_by': data['executed_by'],
                'executed_at': now
            }
            
            # Use upsert to handle duplicate executions
            result = db.bug_executions.update_one(
                {
                    'execution_id': data['execution_id'],
                    'bug_id': data['bug_id']
                },
                {'$set': execution_doc},
                upsert=True
            )
            
            logger.info(f"Bug execution recorded successfully")
            return execution_doc
        except Exception as e:
            logger.error(f"Error executing bug test: {e}")
            raise e

    @staticmethod
    def get_bug_executions(bug_id):
        """Get all executions for a bug."""
        logger.info(f"Fetching executions for bug: {bug_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            executions = list(db.bug_executions.find({'bug_id': bug_id}, {'_id': 0}).sort('executed_at', -1))
            return executions
        except Exception as e:
            logger.error(f"Error fetching bug executions: {e}")
            return []

    @staticmethod
    def get_execution_bugs(execution_id):
        """Get all bugs tested in an execution."""
        logger.info(f"Fetching bugs for execution: {execution_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            # Get bug executions with bug details
            pipeline = [
                {'$match': {'execution_id': execution_id}},
                {
                    '$lookup': {
                        'from': 'bugs',
                        'localField': 'bug_id',
                        'foreignField': 'bug_id',
                        'as': 'bug_info'
                    }
                },
                {'$unwind': '$bug_info'},
                {
                    '$project': {
                        '_id': 0,
                        'execution_id': 1,
                        'bug_id': 1,
                        'status': 1,
                        'notes': 1,
                        'executed_by': 1,
                        'executed_at': 1,
                        'bug_summary': '$bug_info.summary',
                        'bug_severity': '$bug_info.severity',
                        'bug_status': '$bug_info.status'
                    }
                }
            ]
            
            bugs = list(db.bug_executions.aggregate(pipeline))
            return bugs
        except Exception as e:
            logger.error(f"Error fetching execution bugs: {e}")
            return []

    @staticmethod
    def get_bug_reports(project_id, start_date=None, end_date=None, group_by='status'):
        """Generate bug reports with statistics."""
        logger.info(f"Generating bug reports for project: {project_id}")
        try:
            client = get_connection()
            db = client[MONGODB_DATABASE]
            
            # Build match query
            match_query = {'project_id': project_id}
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter['$gte'] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if end_date:
                    date_filter['$lte'] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                match_query['created_at'] = date_filter
            
            # Group by specified field
            group_field = f'${group_by}' if group_by in ['status', 'severity'] else '$status'
            
            pipeline = [
                {'$match': match_query},
                {
                    '$group': {
                        '_id': group_field,
                        'count': {'$sum': 1},
                        'bugs': {'$push': '$$ROOT'}
                    }
                },
                {'$sort': {'count': -1}}
            ]
            
            grouped_data = list(db.bugs.aggregate(pipeline))
            
            # Generate summary statistics
            total_bugs = db.bugs.count_documents(match_query)
            open_bugs = db.bugs.count_documents({**match_query, 'status': 'open'})
            fixed_bugs = db.bugs.count_documents({**match_query, 'status': 'fixed'})
            closed_bugs = db.bugs.count_documents({**match_query, 'status': 'closed'})
            
            # Bug severity distribution
            severity_stats = list(db.bugs.aggregate([
                {'$match': match_query},
                {
                    '$group': {
                        '_id': '$severity',
                        'count': {'$sum': 1}
                    }
                }
            ]))
            
            # Top contributors (bug reporters and fixers)
            created_by_stats = list(db.bugs.aggregate([
                {'$match': match_query},
                {
                    '$group': {
                        '_id': '$created_by',
                        'reported_count': {'$sum': 1}
                    }
                },
                {'$sort': {'reported_count': -1}},
                {'$limit': 10}
            ]))
            
            fixed_by_stats = list(db.bug_fixes.aggregate([
                {
                    '$lookup': {
                        'from': 'bugs',
                        'localField': 'bug_id',
                        'foreignField': 'bug_id',
                        'as': 'bug_info'
                    }
                },
                {'$unwind': '$bug_info'},
                {'$match': {'bug_info.project_id': project_id}},
                {
                    '$group': {
                        '_id': '$fixed_by',
                        'fixed_count': {'$sum': 1}
                    }
                },
                {'$sort': {'fixed_count': -1}},
                {'$limit': 10}
            ]))
            
            report = {
                'project_id': project_id,
                'generated_at': datetime.utcnow(),
                'date_range': {'start': start_date, 'end': end_date},
                'summary': {
                    'total_bugs': total_bugs,
                    'open_bugs': open_bugs,
                    'fixed_bugs': fixed_bugs,
                    'closed_bugs': closed_bugs,
                    'fix_rate': round((fixed_bugs + closed_bugs) / total_bugs * 100, 2) if total_bugs > 0 else 0
                },
                'grouped_data': grouped_data,
                'severity_distribution': severity_stats,
                'top_reporters': created_by_stats,
                'top_fixers': fixed_by_stats
            }
            
            return report
        except Exception as e:
            logger.error(f"Error generating bug reports: {e}")
            return {}

# Create service instance functions for backward compatibility
def create_bug(data):
    return BugService.create_bug(data)

def get_bugs(project_id, filters=None):
    return BugService.get_bugs(project_id, filters)

def get_bug(bug_id):
    return BugService.get_bug(bug_id)

def update_bug(bug_id, data):
    return BugService.update_bug(bug_id, data)

def delete_bug(bug_id):
    return BugService.delete_bug(bug_id)

def create_bug_fix(data):
    return BugService.create_bug_fix(data)

def verify_bug_fix(fix_id, verified_by, fix_status='verified'):
    return BugService.verify_bug_fix(fix_id, verified_by, fix_status)

def get_bug_fixes(bug_id):
    return BugService.get_bug_fixes(bug_id)

def create_bug_history(data):
    return BugService.create_bug_history(data)

def get_bug_history(bug_id):
    return BugService.get_bug_history(bug_id)

def execute_bug_test(data):
    return BugService.execute_bug_test(data)

def get_bug_executions(bug_id):
    return BugService.get_bug_executions(bug_id)

def get_execution_bugs(execution_id):
    return BugService.get_execution_bugs(execution_id)

def get_bug_reports(project_id, start_date=None, end_date=None, group_by='status'):
    return BugService.get_bug_reports(project_id, start_date, end_date, group_by)

def create_bugs_batch(data):
    return BugService.create_bugs_batch(data)