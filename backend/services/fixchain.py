import uuid
from datetime import datetime, timezone
from utils.database import get_connection
from utils.logger import logger
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Optional

# MongoDB database names for different collections
SUGOI_DATABASE = "SugoiApp"  # For bug reports and general data
FIXCHAIN_RAG_DATABASE = "FixChainRAG"  # For vector store and reasoning data

class FixChainService:
    """Service class for managing FixChain imports and operations."""
    
    def __init__(self):
        """Initialize FixChain service with embedding model."""
        self._embedding_model = None
    
    @property
    def embedding_model(self):
        """Lazy load embedding model."""
        if self._embedding_model is None:
            try:
                logger.info("Loading sentence-transformers model: all-MiniLM-L6-v2")
                self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Embedding model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise e
        return self._embedding_model
    
    def generate_embedding(self, text_fields: List[str], normalize: bool = True) -> List[float]:
        """Generate embedding from text fields."""
        try:
            # Combine text fields
            combined_text = " ".join(text_fields)
            
            # Generate embedding
            embedding = self.embedding_model.encode(combined_text, normalize_embeddings=normalize)
            
            # Convert to list of floats
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise e
    
    @staticmethod
    def import_bug(data: Dict[str, Any]) -> Dict[str, Any]:
        """Import bug data into SugoiApp collection."""
        try:
            client = get_connection()
            db = client[SUGOI_DATABASE]
            logger.debug(f"[import_bug] Connected to DB: {SUGOI_DATABASE}")
            
            bug_data = data['bug']
            bug_id = bug_data.get('bug_id', str(uuid.uuid4()))
            now = datetime.now(timezone.utc)
            
            # Prepare bug document
            bug_doc = {
                'bug_id': bug_id,
                'source_file': bug_data['source_file'],
                'bug_type': bug_data['bug_type'],
                'severity': bug_data['severity'],
                'line_number': bug_data['line_number'],
                'column_number': bug_data.get('column_number'),
                'description': bug_data['description'],
                'code_snippet': bug_data.get('code_snippet'),
                'suggested_fix': bug_data.get('suggested_fix'),
                'actual_fix': bug_data.get('actual_fix'),
                'detection_method': bug_data.get('detection_method', 'manual_review'),
                'ai_confidence': bug_data.get('ai_confidence'),
                'detection_iteration': bug_data.get('detection_iteration'),
                'fix_iteration': bug_data.get('fix_iteration'),
                'status': bug_data['status'],
                'human_feedback': bug_data.get('human_feedback', {}),
                'related_bugs': bug_data.get('related_bugs', []),
                'fix_impact': bug_data.get('fix_impact', {}),
                'created_at': now,
                'updated_at': now,
                'imported_by': 'fixchain_api'
            }
            
            logger.debug(f"[import_bug] Inserting bug: {bug_doc['bug_id']}")
            result = db.bug_reports.insert_one(bug_doc)
            bug_doc['_id'] = str(result.inserted_id)
            
            logger.info(f"[import_bug] Bug imported successfully with ID: {bug_id}")
            return {
                'bug_id': bug_id,
                'created_at': now.isoformat(),
                'updated_at': now.isoformat()
            }
        except Exception as e:
            logger.error(f"[import_bug] Error importing bug: {e}", exc_info=True)
            raise e
    
    @staticmethod
    def import_bugs_batch(data: Dict[str, Any]) -> Dict[str, Any]:
        """Import multiple bugs in batch."""
        try:
            client = get_connection()
            db = client[SUGOI_DATABASE]
            logger.debug(f"[import_bugs_batch] Connected to DB: {SUGOI_DATABASE}")
            
            bugs_data = data['bugs']
            batch_metadata = data.get('batch_metadata', {})
            now = datetime.now(timezone.utc)
            
            # Prepare bug documents
            bug_docs = []
            bug_ids = []
            
            for bug_data in bugs_data:
                bug_id = bug_data.get('bug_id', str(uuid.uuid4()))
                bug_ids.append(bug_id)
                
                bug_doc = {
                    'bug_id': bug_id,
                    'source_file': bug_data['source_file'],
                    'bug_type': bug_data['bug_type'],
                    'severity': bug_data['severity'],
                    'line_number': bug_data['line_number'],
                    'column_number': bug_data.get('column_number'),
                    'description': bug_data['description'],
                    'code_snippet': bug_data.get('code_snippet'),
                    'suggested_fix': bug_data.get('suggested_fix'),
                    'actual_fix': bug_data.get('actual_fix'),
                    'detection_method': bug_data.get('detection_method', 'manual_review'),
                    'ai_confidence': bug_data.get('ai_confidence'),
                    'detection_iteration': bug_data.get('detection_iteration'),
                    'fix_iteration': bug_data.get('fix_iteration'),
                    'status': bug_data['status'],
                    'human_feedback': bug_data.get('human_feedback', {}),
                    'related_bugs': bug_data.get('related_bugs', []),
                    'fix_impact': bug_data.get('fix_impact', {}),
                    'created_at': now,
                    'updated_at': now,
                    'imported_by': 'fixchain_api',
                    'batch_metadata': batch_metadata
                }
                bug_docs.append(bug_doc)
            
            logger.debug(f"[import_bugs_batch] Inserting {len(bug_docs)} bugs")
            result = db.bug_reports.insert_many(bug_docs)
            
            logger.info(f"[import_bugs_batch] {len(bug_docs)} bugs imported successfully")
            return {
                'total_imported': len(bug_docs),
                'bug_ids': bug_ids,
                'batch_metadata': batch_metadata,
                'created_at': now.isoformat()
            }
        except Exception as e:
            logger.error(f"[import_bugs_batch] Error importing bugs batch: {e}", exc_info=True)
            raise e
    
    def import_vectordb(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Import reasoning data into FixChainRAG collection."""
        try:
            client = get_connection()
            db = client[FIXCHAIN_RAG_DATABASE]
            logger.debug(f"[import_vectordb] Connected to DB: {FIXCHAIN_RAG_DATABASE}")
            
            reasoning_data = data['reasoning']
            generate_embedding = data.get('generate_embedding', False)
            embedding_config = data.get('embedding_config', {})
            
            entry_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            
            # Generate embedding if requested
            embedding = reasoning_data.get('embedding')
            embedding_generated = False
            
            if generate_embedding and not embedding:
                try:
                    text_fields = embedding_config.get('text_fields', ['summary', 'output'])
                    normalize = embedding_config.get('normalize', True)
                    
                    # Extract text from specified fields
                    texts_to_embed = []
                    for field in text_fields:
                        if field in reasoning_data and reasoning_data[field]:
                            texts_to_embed.append(str(reasoning_data[field]))
                    
                    if texts_to_embed:
                        embedding = self.generate_embedding(texts_to_embed, normalize)
                        embedding_generated = True
                        logger.debug(f"[import_vectordb] Generated embedding with {len(embedding)} dimensions")
                except Exception as e:
                    logger.warning(f"[import_vectordb] Failed to generate embedding: {e}")
                    embedding = None
            
            # Prepare reasoning document
            reasoning_doc = {
                'entry_id': entry_id,
                'test_name': reasoning_data['test_name'],
                'attempt_id': reasoning_data['attempt_id'],
                'source_file': reasoning_data['source_file'],
                'status': reasoning_data['status'],
                'summary': reasoning_data['summary'],
                'output': reasoning_data['output'],
                'metadata': reasoning_data.get('metadata', {}),
                'embedding': embedding,
                'embedding_dimensions': len(embedding) if embedding else None,
                'human_verified': reasoning_data.get('human_verified', False),
                'verification_result': reasoning_data.get('verification_result', {}),
                'created_at': now,
                'updated_at': now,
                'imported_by': 'fixchain_api'
            }
            
            logger.debug(f"[import_vectordb] Inserting reasoning entry: {entry_id}")
            result = db.test_reasoning.insert_one(reasoning_doc)
            reasoning_doc['_id'] = str(result.inserted_id)
            
            logger.info(f"[import_vectordb] Reasoning entry imported successfully with ID: {entry_id}")
            return {
                'entry_id': entry_id,
                'embedding_generated': embedding_generated,
                'embedding_dimensions': len(embedding) if embedding else None,
                'created_at': now.isoformat()
            }
        except Exception as e:
            logger.error(f"[import_vectordb] Error importing reasoning: {e}", exc_info=True)
            raise e
    
    def import_vectordb_batch(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Import multiple reasoning entries in batch."""
        try:
            client = get_connection()
            db = client[FIXCHAIN_RAG_DATABASE]
            logger.debug(f"[import_vectordb_batch] Connected to DB: {FIXCHAIN_RAG_DATABASE}")
            
            reasoning_entries = data['reasoning_entries']
            batch_metadata = data.get('batch_metadata', {})
            generate_embeddings = data.get('generate_embeddings', False)
            now = datetime.now(timezone.utc)
            
            # Prepare reasoning documents
            reasoning_docs = []
            entry_ids = []
            embeddings_generated = 0
            
            for reasoning_data in reasoning_entries:
                entry_id = str(uuid.uuid4())
                entry_ids.append(entry_id)
                
                # Generate embedding if requested
                embedding = reasoning_data.get('embedding')
                if generate_embeddings and not embedding:
                    try:
                        texts_to_embed = [reasoning_data.get('summary', ''), reasoning_data.get('output', '')]
                        texts_to_embed = [text for text in texts_to_embed if text]
                        
                        if texts_to_embed:
                            embedding = self.generate_embedding(texts_to_embed)
                            embeddings_generated += 1
                    except Exception as e:
                        logger.warning(f"[import_vectordb_batch] Failed to generate embedding for entry {entry_id}: {e}")
                        embedding = None
                
                reasoning_doc = {
                    'entry_id': entry_id,
                    'test_name': reasoning_data['test_name'],
                    'attempt_id': reasoning_data['attempt_id'],
                    'source_file': reasoning_data['source_file'],
                    'status': reasoning_data['status'],
                    'summary': reasoning_data['summary'],
                    'output': reasoning_data['output'],
                    'metadata': reasoning_data.get('metadata', {}),
                    'embedding': embedding,
                    'embedding_dimensions': len(embedding) if embedding else None,
                    'human_verified': reasoning_data.get('human_verified', False),
                    'verification_result': reasoning_data.get('verification_result', {}),
                    'created_at': now,
                    'updated_at': now,
                    'imported_by': 'fixchain_api',
                    'batch_metadata': batch_metadata
                }
                reasoning_docs.append(reasoning_doc)
            
            logger.debug(f"[import_vectordb_batch] Inserting {len(reasoning_docs)} reasoning entries")
            result = db.test_reasoning.insert_many(reasoning_docs)
            
            logger.info(f"[import_vectordb_batch] {len(reasoning_docs)} reasoning entries imported successfully")
            return {
                'total_imported': len(reasoning_docs),
                'entry_ids': entry_ids,
                'embeddings_generated': embeddings_generated,
                'batch_metadata': batch_metadata,
                'created_at': now.isoformat()
            }
        except Exception as e:
            logger.error(f"[import_vectordb_batch] Error importing reasoning batch: {e}", exc_info=True)
            raise e
    
    @staticmethod
    def import_session(data: Dict[str, Any]) -> Dict[str, Any]:
        """Import execution session data."""
        try:
            client = get_connection()
            db = client[SUGOI_DATABASE]
            logger.debug(f"[import_session] Connected to DB: {SUGOI_DATABASE}")
            
            session_data = data['session']
            session_id = session_data.get('session_id', str(uuid.uuid4()))
            now = datetime.now(timezone.utc)
            
            # Parse datetime strings
            start_time = datetime.fromisoformat(session_data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(session_data['end_time'].replace('Z', '+00:00'))
            
            # Prepare session document
            session_doc = {
                'session_id': session_id,
                'source_file': session_data['source_file'],
                'session_number': session_data['session_number'],
                'test_types': session_data.get('test_types', []),
                'start_time': start_time,
                'end_time': end_time,
                'total_duration': session_data['total_duration'],
                'total_tokens_used': session_data.get('total_tokens_used'),
                'bugs_detected': session_data['bugs_detected'],
                'bugs_fixed': session_data['bugs_fixed'],
                'new_bugs_introduced': session_data.get('new_bugs_introduced', 0),
                'overall_status': session_data['overall_status'],
                'performance_metrics': session_data.get('performance_metrics', {}),
                'comparison_with_previous': session_data.get('comparison_with_previous', {}),
                'created_at': now,
                'updated_at': now,
                'imported_by': 'fixchain_api'
            }
            
            logger.debug(f"[import_session] Inserting session: {session_id}")
            result = db.execution_sessions.insert_one(session_doc)
            session_doc['_id'] = str(result.inserted_id)
            
            logger.info(f"[import_session] Session imported successfully with ID: {session_id}")
            return {
                'session_id': session_id,
                'created_at': now.isoformat(),
                'updated_at': now.isoformat()
            }
        except Exception as e:
            logger.error(f"[import_session] Error importing session: {e}", exc_info=True)
            raise e
    
    def bulk_import(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Import mixed data (bugs, reasoning, sessions) in bulk."""
        try:
            import_data = data['data']
            options = data.get('options', {})
            metadata = data.get('metadata', {})
            
            results = {
                'bugs': None,
                'reasoning_entries': None,
                'sessions': None,
                'metadata': metadata,
                'imported_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Import bugs if provided
            if import_data.get('bugs'):
                logger.info(f"[bulk_import] Importing {len(import_data['bugs'])} bugs")
                bugs_payload = {
                    'bugs': import_data['bugs'],
                    'batch_metadata': metadata
                }
                results['bugs'] = self.import_bugs_batch(bugs_payload)
            
            # Import reasoning entries if provided
            if import_data.get('reasoning_entries'):
                logger.info(f"[bulk_import] Importing {len(import_data['reasoning_entries'])} reasoning entries")
                reasoning_payload = {
                    'reasoning_entries': import_data['reasoning_entries'],
                    'batch_metadata': metadata,
                    'generate_embeddings': options.get('generate_embeddings', True)
                }
                results['reasoning_entries'] = self.import_vectordb_batch(reasoning_payload)
            
            # Import sessions if provided
            if import_data.get('sessions'):
                logger.info(f"[bulk_import] Importing {len(import_data['sessions'])} sessions")
                for session_data in import_data['sessions']:
                    session_payload = {'session': session_data}
                    session_result = self.import_session(session_payload)
                    if results['sessions'] is None:
                        results['sessions'] = []
                    results['sessions'].append(session_result)
            
            logger.info(f"[bulk_import] Bulk import completed successfully")
            return results
        except Exception as e:
            logger.error(f"[bulk_import] Error in bulk import: {e}", exc_info=True)
            raise e
    
    @staticmethod
    def search_similar_bugs(filters: Dict[str, Any], limit: int = 10) -> Dict[str, Any]:
        """Search for similar bugs."""
        try:
            client = get_connection()
            db = client[SUGOI_DATABASE]
            logger.debug(f"[search_similar_bugs] Connected to DB: {SUGOI_DATABASE}")
            
            query = {}
            if filters.get('source_file'):
                query['source_file'] = filters['source_file']
            if filters.get('bug_type'):
                query['bug_type'] = filters['bug_type']
            
            logger.debug(f"[search_similar_bugs] Query: {query}, Limit: {limit}")
            bugs = list(db.bug_reports.find(query, {'_id': 0}).sort('created_at', -1).limit(limit))
            
            logger.info(f"[search_similar_bugs] Found {len(bugs)} similar bugs")
            return {
                'bugs': bugs,
                'total_found': len(bugs),
                'filters_applied': filters
            }
        except Exception as e:
            logger.error(f"[search_similar_bugs] Error searching bugs: {e}", exc_info=True)
            raise e
    
    @staticmethod
    def get_reasoning_history(filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get reasoning history for a file."""
        try:
            client = get_connection()
            db = client[FIXCHAIN_RAG_DATABASE]
            logger.debug(f"[get_reasoning_history] Connected to DB: {FIXCHAIN_RAG_DATABASE}")
            
            query = {}
            if filters.get('source_file'):
                query['source_file'] = filters['source_file']
            if filters.get('test_name'):
                query['test_name'] = filters['test_name']
            
            logger.debug(f"[get_reasoning_history] Query: {query}")
            reasoning_entries = list(db.test_reasoning.find(query, {'_id': 0, 'embedding': 0}).sort('created_at', -1))
            
            logger.info(f"[get_reasoning_history] Found {len(reasoning_entries)} reasoning entries")
            return {
                'reasoning_entries': reasoning_entries,
                'total_found': len(reasoning_entries),
                'filters_applied': filters
            }
        except Exception as e:
            logger.error(f"[get_reasoning_history] Error getting reasoning history: {e}", exc_info=True)
            raise e
    
    @staticmethod
    def get_performance_analytics(filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get performance analytics for a file."""
        try:
            client = get_connection()
            db = client[SUGOI_DATABASE]
            logger.debug(f"[get_performance_analytics] Connected to DB: {SUGOI_DATABASE}")
            
            query = {}
            if filters.get('source_file'):
                query['source_file'] = filters['source_file']
            
            # Add date range filters if provided
            if filters.get('from_date') or filters.get('to_date'):
                date_query = {}
                if filters.get('from_date'):
                    date_query['$gte'] = datetime.fromisoformat(filters['from_date'].replace('Z', '+00:00'))
                if filters.get('to_date'):
                    date_query['$lte'] = datetime.fromisoformat(filters['to_date'].replace('Z', '+00:00'))
                query['created_at'] = date_query
            
            logger.debug(f"[get_performance_analytics] Query: {query}")
            
            # Get execution sessions
            sessions = list(db.execution_sessions.find(query, {'_id': 0}).sort('created_at', -1))
            
            # Calculate analytics
            analytics = {
                'total_sessions': len(sessions),
                'total_bugs_detected': sum(s.get('bugs_detected', 0) for s in sessions),
                'total_bugs_fixed': sum(s.get('bugs_fixed', 0) for s in sessions),
                'average_accuracy': 0,
                'sessions': sessions,
                'filters_applied': filters
            }
            
            # Calculate average accuracy
            accuracy_values = []
            for session in sessions:
                metrics = session.get('performance_metrics', {})
                if 'accuracy_rate' in metrics:
                    accuracy_values.append(metrics['accuracy_rate'])
            
            if accuracy_values:
                analytics['average_accuracy'] = sum(accuracy_values) / len(accuracy_values)
            
            logger.info(f"[get_performance_analytics] Generated analytics for {len(sessions)} sessions")
            return analytics
        except Exception as e:
            logger.error(f"[get_performance_analytics] Error getting analytics: {e}", exc_info=True)
            raise e

# Create service instance
fixchain_service = FixChainService()

# Export functions for controller usage
def import_bug(data):
    return FixChainService.import_bug(data)

def import_bugs_batch(data):
    return FixChainService.import_bugs_batch(data)

def import_vectordb(data):
    return fixchain_service.import_vectordb(data)

def import_vectordb_batch(data):
    return fixchain_service.import_vectordb_batch(data)

def import_session(data):
    return FixChainService.import_session(data)

def bulk_import(data):
    return fixchain_service.bulk_import(data)

def search_similar_bugs(filters, limit):
    return FixChainService.search_similar_bugs(filters, limit)

def get_reasoning_history(filters):
    return FixChainService.get_reasoning_history(filters)

def get_performance_analytics(filters):
    return FixChainService.get_performance_analytics(filters)