#!/usr/bin/env python3
"""
FixChain Database Initialization Script

This script initializes the MongoDB databases for FixChain:
- SugoiApp: Main database for bug reports and execution sessions
- FixChainRAG: Specialized database for vector store and reasoning data
"""

import os
import sys
from datetime import datetime

# Add the parent directory to the path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from pymongo import MongoClient, ASCENDING, TEXT
except ImportError:
    print("Error: pymongo not installed. Please run: pip install pymongo")
    sys.exit(1)

# Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
SUGOI_DATABASE = os.getenv('MONGODB_DATABASE', 'SugoiApp')
FIXCHAIN_RAG_DATABASE = os.getenv('FIXCHAIN_RAG_DATABASE', 'FixChainRAG')

def get_mongo_client():
    """Get MongoDB client connection"""
    try:
        client = MongoClient(MONGODB_URL)
        # Test connection
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB at {MONGODB_URL}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None

def create_indexes(client):
    """Create necessary indexes for FixChain collections"""
    print("\n🔧 Creating database indexes...")
    
    # SugoiApp database indexes
    sugoi_db = client[SUGOI_DATABASE]
    
    # Bug reports collection indexes
    bug_reports = sugoi_db['bug_reports']
    bug_reports.create_index([('source_file', ASCENDING)])
    bug_reports.create_index([('bug_type', ASCENDING)])
    bug_reports.create_index([('severity', ASCENDING)])
    bug_reports.create_index([('status', ASCENDING)])
    bug_reports.create_index([('created_at', ASCENDING)])
    bug_reports.create_index([('source_file', ASCENDING), ('bug_type', ASCENDING)])
    print("  ✅ Created indexes for bug_reports collection")
    
    # Execution sessions collection indexes
    execution_sessions = sugoi_db['execution_sessions']
    execution_sessions.create_index([('source_file', ASCENDING)])
    execution_sessions.create_index([('session_number', ASCENDING)])
    execution_sessions.create_index([('start_time', ASCENDING)])
    execution_sessions.create_index([('overall_status', ASCENDING)])
    execution_sessions.create_index([('source_file', ASCENDING), ('session_number', ASCENDING)])
    print("  ✅ Created indexes for execution_sessions collection")
    
    # FixChainRAG database indexes
    rag_db = client[FIXCHAIN_RAG_DATABASE]
    
    # Test reasoning collection indexes
    test_reasoning = rag_db['test_reasoning']
    test_reasoning.create_index([('test_name', ASCENDING)])
    test_reasoning.create_index([('source_file', ASCENDING)])
    test_reasoning.create_index([('status', ASCENDING)])
    test_reasoning.create_index([('created_at', ASCENDING)])
    test_reasoning.create_index([('test_name', ASCENDING), ('attempt_id', ASCENDING)])
    # Text index for full-text search
    test_reasoning.create_index([('summary', TEXT), ('output', TEXT)])
    print("  ✅ Created indexes for test_reasoning collection")
    
    print("\n✅ All indexes created successfully!")

def create_sample_data(client):
    """Create sample data for testing"""
    print("\n📝 Creating sample data...")
    
    sugoi_db = client[SUGOI_DATABASE]
    rag_db = client[FIXCHAIN_RAG_DATABASE]
    
    # Sample bug report
    sample_bug = {
        'source_file': 'src/example.py',
        'bug_type': 'logic_error',
        'severity': 'medium',
        'line_number': 42,
        'description': 'Variable used before assignment',
        'code_snippet': 'print(undefined_variable)',
        'status': 'detected',
        'created_at': datetime.utcnow(),
        'metadata': {
            'detector': 'static_analysis',
            'confidence': 0.85
        }
    }
    
    bug_reports = sugoi_db['bug_reports']
    if bug_reports.count_documents({'source_file': 'src/example.py'}) == 0:
        bug_reports.insert_one(sample_bug)
        print("  ✅ Created sample bug report")
    else:
        print("  ℹ️  Sample bug report already exists")
    
    # Sample execution session
    sample_session = {
        'source_file': 'src/example.py',
        'session_number': 1,
        'start_time': datetime.utcnow(),
        'end_time': datetime.utcnow(),
        'total_duration': 2700,
        'bugs_detected': 1,
        'bugs_fixed': 1,
        'overall_status': 'success',
        'metadata': {
            'ai_model': 'fixchain-v1',
            'human_verified': True
        }
    }
    
    execution_sessions = sugoi_db['execution_sessions']
    if execution_sessions.count_documents({'source_file': 'src/example.py'}) == 0:
        execution_sessions.insert_one(sample_session)
        print("  ✅ Created sample execution session")
    else:
        print("  ℹ️  Sample execution session already exists")
    
    # Sample reasoning entry
    sample_reasoning = {
        'test_name': 'test_variable_initialization',
        'attempt_id': 'attempt-001',
        'source_file': 'src/example.py',
        'status': 'passed',
        'summary': 'Successfully detected uninitialized variable usage',
        'output': 'Static analysis found potential NameError at line 42: undefined_variable is used before assignment',
        'created_at': datetime.utcnow(),
        'metadata': {
            'embedding_model': 'all-MiniLM-L6-v2',
            'embedding_dimension': 384
        }
    }
    
    test_reasoning = rag_db['test_reasoning']
    if test_reasoning.count_documents({'test_name': 'test_variable_initialization'}) == 0:
        test_reasoning.insert_one(sample_reasoning)
        print("  ✅ Created sample reasoning entry")
    else:
        print("  ℹ️  Sample reasoning entry already exists")
    
    print("\n✅ Sample data created successfully!")

def verify_setup(client):
    """Verify the database setup"""
    print("\n🔍 Verifying database setup...")
    
    sugoi_db = client[SUGOI_DATABASE]
    rag_db = client[FIXCHAIN_RAG_DATABASE]
    
    # Check collections
    sugoi_collections = sugoi_db.list_collection_names()
    rag_collections = rag_db.list_collection_names()
    
    print(f"\n📊 Database Status:")
    print(f"  SugoiApp collections: {sugoi_collections}")
    print(f"  FixChainRAG collections: {rag_collections}")
    
    # Check document counts
    bug_count = sugoi_db['bug_reports'].count_documents({})
    session_count = sugoi_db['execution_sessions'].count_documents({})
    reasoning_count = rag_db['test_reasoning'].count_documents({})
    
    print(f"\n📈 Document Counts:")
    print(f"  Bug reports: {bug_count}")
    print(f"  Execution sessions: {session_count}")
    print(f"  Reasoning entries: {reasoning_count}")
    
    # Check indexes
    bug_indexes = list(sugoi_db['bug_reports'].list_indexes())
    session_indexes = list(sugoi_db['execution_sessions'].list_indexes())
    reasoning_indexes = list(rag_db['test_reasoning'].list_indexes())
    
    print(f"\n🔧 Index Counts:")
    print(f"  Bug reports indexes: {len(bug_indexes)}")
    print(f"  Execution sessions indexes: {len(session_indexes)}")
    print(f"  Reasoning entries indexes: {len(reasoning_indexes)}")
    
    print("\n✅ Database verification completed!")

def main():
    """Main initialization function"""
    print("🚀 FixChain Database Initialization")
    print("=" * 40)
    
    print(f"\n📋 Configuration:")
    print(f"  MongoDB URL: {MONGODB_URL}")
    print(f"  SugoiApp Database: {SUGOI_DATABASE}")
    print(f"  FixChainRAG Database: {FIXCHAIN_RAG_DATABASE}")
    
    # Connect to MongoDB
    client = get_mongo_client()
    if not client:
        print("\n❌ Failed to initialize FixChain databases")
        return False
    
    try:
        # Create indexes
        create_indexes(client)
        
        # Create sample data
        create_sample_data(client)
        
        # Verify setup
        verify_setup(client)
        
        print("\n🎉 FixChain database initialization completed successfully!")
        print("\n📚 Next steps:")
        print("  1. Start your backend server")
        print("  2. Test the FixChain APIs at /api/fixchain/*")
        print("  3. Check Swagger documentation at /docs")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        return False
        
    finally:
        client.close()
        print("\n🔌 MongoDB connection closed")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)