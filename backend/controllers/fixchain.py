from flask import request
from utils.common import return_status
from utils.logger import logger

def import_bug():
    """Import bug data into SugoiApp collection."""
    try:
        from services import fixchain
        data = request.get_json()
        
        # Validate required fields for bug import
        if 'bug' not in data:
            return return_status(400, "bug data is required")
        
        bug_data = data['bug']
        required_fields = ['source_file', 'bug_type', 'severity', 'line_number', 'description', 'status']
        for field in required_fields:
            if not bug_data.get(field):
                return return_status(400, f"bug.{field} is required")
        
        # Validate enum values
        valid_bug_types = ['syntax', 'type', 'security', 'logic', 'performance']
        valid_severities = ['critical', 'high', 'medium', 'low']
        valid_statuses = ['detected', 'fixed', 'verified', 'rejected', 'in_progress']
        
        if bug_data['bug_type'] not in valid_bug_types:
            return return_status(400, f"Invalid bug_type. Must be one of: {', '.join(valid_bug_types)}")
        
        if bug_data['severity'] not in valid_severities:
            return return_status(400, f"Invalid severity. Must be one of: {', '.join(valid_severities)}")
        
        if bug_data['status'] not in valid_statuses:
            return return_status(400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        # Validate line_number
        if not isinstance(bug_data['line_number'], int) or bug_data['line_number'] <= 0:
            return return_status(400, "line_number must be a positive integer")
        
        # Validate ai_confidence if provided
        if 'ai_confidence' in bug_data:
            confidence = bug_data['ai_confidence']
            if confidence is not None and (not isinstance(confidence, (int, float)) or not (0 <= confidence <= 1)):
                return return_status(400, "ai_confidence must be a number between 0 and 1")
        
        result = fixchain.import_bug(data)
        return return_status(200, "Bug imported successfully", result)
    except Exception as e:
        logger.error(f"Failed to import bug: {str(e)}")
        return return_status(500, str(e))

def import_bugs_batch():
    """Import multiple bugs in batch."""
    try:
        from services import fixchain
        data = request.get_json()
        
        if 'bugs' not in data or not isinstance(data['bugs'], list):
            return return_status(400, "bugs array is required")
        
        if len(data['bugs']) == 0:
            return return_status(400, "bugs array cannot be empty")
        
        # Validate each bug in the batch
        for i, bug_data in enumerate(data['bugs']):
            required_fields = ['source_file', 'bug_type', 'severity', 'line_number', 'description', 'status']
            for field in required_fields:
                if not bug_data.get(field):
                    return return_status(400, f"bugs[{i}].{field} is required")
        
        result = fixchain.import_bugs_batch(data)
        return return_status(200, "Bugs imported successfully", result)
    except Exception as e:
        logger.error(f"Failed to import bugs batch: {str(e)}")
        return return_status(500, str(e))

def import_vectordb():
    """Import reasoning data into FixChainRAG collection."""
    try:
        from services import fixchain
        data = request.get_json()
        
        # Validate required fields for reasoning import
        if 'reasoning' not in data:
            return return_status(400, "reasoning data is required")
        
        reasoning_data = data['reasoning']
        required_fields = ['test_name', 'attempt_id', 'source_file', 'status', 'summary', 'output']
        for field in required_fields:
            if not reasoning_data.get(field):
                return return_status(400, f"reasoning.{field} is required")
        
        # Validate enum values
        valid_test_names = ['syntax', 'type', 'security', 'performance']
        valid_statuses = ['pass', 'fail', 'error', 'skip']
        
        if reasoning_data['test_name'] not in valid_test_names:
            return return_status(400, f"Invalid test_name. Must be one of: {', '.join(valid_test_names)}")
        
        if reasoning_data['status'] not in valid_statuses:
            return return_status(400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        # Validate metadata if provided
        if 'metadata' in reasoning_data:
            metadata = reasoning_data['metadata']
            if 'iteration' in metadata and (not isinstance(metadata['iteration'], int) or metadata['iteration'] <= 0):
                return return_status(400, "metadata.iteration must be a positive integer")
        
        # Validate embedding if provided
        if 'embedding' in reasoning_data:
            embedding = reasoning_data['embedding']
            if not isinstance(embedding, list) or len(embedding) != 384:
                return return_status(400, "embedding must be an array of 384 numbers")
            if not all(isinstance(x, (int, float)) for x in embedding):
                return return_status(400, "embedding must contain only numbers")
        
        result = fixchain.import_vectordb(data)
        return return_status(200, "Reasoning entry imported successfully", result)
    except Exception as e:
        logger.error(f"Failed to import vectordb: {str(e)}")
        return return_status(500, str(e))

def import_vectordb_batch():
    """Import multiple reasoning entries in batch."""
    try:
        from services import fixchain
        data = request.get_json()
        
        if 'reasoning_entries' not in data or not isinstance(data['reasoning_entries'], list):
            return return_status(400, "reasoning_entries array is required")
        
        if len(data['reasoning_entries']) == 0:
            return return_status(400, "reasoning_entries array cannot be empty")
        
        # Validate each reasoning entry in the batch
        for i, reasoning_data in enumerate(data['reasoning_entries']):
            required_fields = ['test_name', 'attempt_id', 'source_file', 'status', 'summary', 'output']
            for field in required_fields:
                if not reasoning_data.get(field):
                    return return_status(400, f"reasoning_entries[{i}].{field} is required")
        
        result = fixchain.import_vectordb_batch(data)
        return return_status(200, "Reasoning entries imported successfully", result)
    except Exception as e:
        logger.error(f"Failed to import vectordb batch: {str(e)}")
        return return_status(500, str(e))

def import_session():
    """Import execution session data."""
    try:
        from services import fixchain
        data = request.get_json()
        
        # Validate required fields for session import
        if 'session' not in data:
            return return_status(400, "session data is required")
        
        session_data = data['session']
        required_fields = ['source_file', 'session_number', 'start_time', 'end_time', 
                          'total_duration', 'bugs_detected', 'bugs_fixed', 'overall_status']
        for field in required_fields:
            if field not in session_data:
                return return_status(400, f"session.{field} is required")
        
        # Validate session_number
        if not isinstance(session_data['session_number'], int) or session_data['session_number'] <= 0:
            return return_status(400, "session_number must be a positive integer")
        
        # Validate bugs counts
        if not isinstance(session_data['bugs_detected'], int) or session_data['bugs_detected'] < 0:
            return return_status(400, "bugs_detected must be a non-negative integer")
        
        if not isinstance(session_data['bugs_fixed'], int) or session_data['bugs_fixed'] < 0:
            return return_status(400, "bugs_fixed must be a non-negative integer")
        
        if session_data['bugs_fixed'] > session_data['bugs_detected']:
            return return_status(400, "bugs_fixed cannot be greater than bugs_detected")
        
        # Validate accuracy_rate if provided
        if 'performance_metrics' in session_data and 'accuracy_rate' in session_data['performance_metrics']:
            accuracy = session_data['performance_metrics']['accuracy_rate']
            if accuracy is not None and (not isinstance(accuracy, (int, float)) or not (0 <= accuracy <= 1)):
                return return_status(400, "performance_metrics.accuracy_rate must be a number between 0 and 1")
        
        result = fixchain.import_session(data)
        return return_status(200, "Session imported successfully", result)
    except Exception as e:
        logger.error(f"Failed to import session: {str(e)}")
        return return_status(500, str(e))

def bulk_import():
    """Import mixed data (bugs, reasoning, sessions) in bulk."""
    try:
        from services import fixchain
        data = request.get_json()
        
        # if 'import_type' not in data or data['import_type'] != 'mixed':
        #     return return_status(400, "import_type must be 'mixed'")
        
        if 'data' not in data:
            return return_status(400, "data field is required")
        
        import_data = data['data']
        
        # At least one type of data must be provided
        if not any(import_data.get(key) for key in ['bugs', 'reasoning_entries', 'sessions']):
            return return_status(400, "At least one of bugs, reasoning_entries, or sessions must be provided")
        
        result = fixchain.bulk_import(data)
        return return_status(200, "Bulk import completed successfully", result)
    except Exception as e:
        logger.error(f"Failed to bulk import: {str(e)}")
        return return_status(500, str(e))

def search_similar_bugs():
    """Search for similar bugs."""
    try:
        from services import fixchain
        
        source_file = request.args.get('source_file')
        bug_type = request.args.get('bug_type')
        limit = request.args.get('limit', 10)
        
        try:
            limit = int(limit)
            if limit <= 0 or limit > 100:
                return return_status(400, "limit must be between 1 and 100")
        except ValueError:
            return return_status(400, "limit must be a valid integer")
        
        filters = {}
        if source_file:
            filters['source_file'] = source_file
        if bug_type:
            filters['bug_type'] = bug_type
        
        result = fixchain.search_similar_bugs(filters, limit)
        return return_status(200, "Similar bugs retrieved successfully", result)
    except Exception as e:
        logger.error(f"Failed to search similar bugs: {str(e)}")
        return return_status(500, str(e))

def get_reasoning_history():
    """Get reasoning history for a file."""
    try:
        from services import fixchain
        
        source_file = request.args.get('source_file')
        test_name = request.args.get('test_name')
        
        if not source_file:
            return return_status(400, "source_file parameter is required")
        
        filters = {'source_file': source_file}
        if test_name:
            filters['test_name'] = test_name
        
        result = fixchain.get_reasoning_history(filters)
        return return_status(200, "Reasoning history retrieved successfully", result)
    except Exception as e:
        logger.error(f"Failed to get reasoning history: {str(e)}")
        return return_status(500, str(e))

def get_performance_analytics():
    """Get performance analytics for a file."""
    try:
        from services import fixchain
        
        source_file = request.args.get('source_file')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        if not source_file:
            return return_status(400, "source_file parameter is required")
        
        filters = {'source_file': source_file}
        if from_date:
            filters['from_date'] = from_date
        if to_date:
            filters['to_date'] = to_date
        
        result = fixchain.get_performance_analytics(filters)
        return return_status(200, "Performance analytics retrieved successfully", result)
    except Exception as e:
        logger.error(f"Failed to get performance analytics: {str(e)}")
        return return_status(500, str(e))

def add_reasoning():
    """Add reasoning entry to RAG store."""
    try:
        data = request.get_json()
        if not data or 'content' not in data or 'metadata' not in data:
            return return_status(400, "content and metadata are required")
        
        # Mock implementation for now
        doc_id = f"doc_{hash(data['content']) % 10000}"
        return return_status(200, "Reasoning entry added successfully", {"doc_id": doc_id})
    except Exception as e:
        logger.error(f"Failed to add reasoning: {str(e)}")
        return return_status(500, str(e))

def search_reasoning():
    """Search for similar reasoning entries."""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return return_status(400, "query is required")
        
        # Mock implementation for now
        results = []
        return return_status(200, "Search completed", results)
    except Exception as e:
        logger.error(f"Failed to search reasoning: {str(e)}")
        return return_status(500, str(e))

def get_stats():
    """Get RAG collection statistics."""
    try:
        # Mock implementation for now
        stats = {
            "total_documents": 0,
            "collection_name": "reasoning",
            "database_name": "fixchain",
            "indexes": []
        }
        return return_status(200, "Statistics retrieved", stats)
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        return return_status(500, str(e))

def delete_reasoning(doc_id):
    """Delete a reasoning entry."""
    try:
        if not doc_id:
            return return_status(400, "doc_id is required")
        
        # Mock implementation for now
        return return_status(200, "Entry deleted successfully", {"message": "Entry deleted"})
    except Exception as e:
        logger.error(f"Failed to delete reasoning: {str(e)}")
        return return_status(500, str(e))