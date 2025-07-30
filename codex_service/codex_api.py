from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging
from datetime import datetime

# Import the local codex service
from codex_service import CodexService, get_list_repos, submit_prompt

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.route('/api/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Codex API is running',
        'timestamp': datetime.now().isoformat(),
        'port': 5137
    })

@app.route('/api/codex/repos', methods=['GET'])
def get_repos():
    """Get list of available repositories"""
    try:
        logger.info("Getting list of repositories")
        repos = get_list_repos()
        return jsonify({
            'status': 'success',
            'data': repos,
            'count': len(repos)
        })
    except Exception as e:
        logger.error(f"Error getting repositories: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/codex/repositories', methods=['GET'])
def get_repositories():
    """Get list of available repositories - alternative endpoint"""
    try:
        logger.info("Getting list of repositories")
        repos = get_list_repos()
        return jsonify({
            'success': True,
            'repositories': repos,
            'count': len(repos)
        })
    except Exception as e:
        logger.error(f"Error getting repositories: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/codex/submit', methods=['POST'])
def submit_codex_prompt():
    """Submit prompt to Codex"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided'
            }), 400
        
        prompt = data.get('prompt')
        repo_label = data.get('repository') or data.get('repo_label')
        
        if not prompt:
            return jsonify({
                'status': 'error',
                'message': 'Prompt is required'
            }), 400
        
        if not repo_label:
            return jsonify({
                'status': 'error',
                'message': 'Repository is required'
            }), 400
        
        logger.info(f"Submitting prompt to repo: {repo_label}")
        logger.info(f"Prompt: {prompt[:100]}...")  # Log first 100 chars
        
        result = submit_prompt(prompt, repo_label)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'data': result,
                'message': 'Prompt submitted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'data': result,
                'error': result.get('error', 'Unknown error occurred')
            }), 500
            
    except Exception as e:
        logger.error(f"Error submitting prompt: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500



@app.route('/api/codex/run', methods=['POST', 'OPTIONS'])
def run_codex():
    """Run codex with prompt and repository - compatible with existing frontend"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        return jsonify({'status': 'ok'})
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided'
            }), 400
        
        prompt = data.get('prompt')
        repo_label = data.get('repo_label') or data.get('repository')
        
        if not prompt:
            return jsonify({
                'status': 'error',
                'message': 'Prompt is required'
            }), 400
        
        if not repo_label:
            return jsonify({
                'status': 'error',
                'message': 'Repository label is required'
            }), 400
        
        logger.info(f"Running Codex with prompt for repo: {repo_label}")
        
        result = submit_prompt(prompt, repo_label)
        
        if result.get('success'):
            return jsonify({
                'status': 'success',
                'data': result,
                'message': 'Codex executed successfully'
            })
        else:
            return jsonify({
                'status': 'error',
                'data': result,
                'message': result.get('error', 'Unknown error occurred')
            }), 500
            
    except Exception as e:
        logger.error(f"Error running Codex: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    logger.info("Starting Codex API server on port 5137")
    logger.info("Available endpoints:")
    logger.info("  GET  /api/ping - Health check")
    logger.info("  GET  /api/codex/repos - Get repositories")
    logger.info("  POST /api/codex/submit - Submit prompt")
    logger.info("  GET  /api/codex/task - Get latest task")
    logger.info("  POST /api/codex/run - Run codex (compatible endpoint)")
    
    app.run(
        host='0.0.0.0',
        port=5137,
        debug=True,
        threaded=True
    )