import json
import logging
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CodexService:
    def __init__(self):
        self.logger = logger
        
    def get_list_repos(self) -> List[Dict[str, str]]:
        """Get list of available repositories from Codex"""
        self.logger.info("Getting list of repositories")
        
        # Mock data for development - replace with actual implementation when needed
        mock_repos = [
            {
                "label": "innolabvn/byebug-backend",
                "value": "innolabvn/byebug-backend"
            },
            {
                "label": "innolabvn/asset-management", 
                "value": "innolabvn/asset-management"
            },
            {
                "label": "innolabvn/byebug-codex-hub",
                "value": "innolabvn/byebug-codex-hub"
            }
        ]
        
        # Simulate processing delay
        time.sleep(0.5)
        
        self.logger.info(f"Found {len(mock_repos)} repositories (mock data)")
        return mock_repos
    
    def submit_prompt(self, prompt: str, repo_label: str) -> Dict:
        """Submit prompt to Codex using subprocess to call codex_executor.py"""
        try:
            self.logger.info(f"Submitting prompt to repo: {repo_label}")
            self.logger.info(f"Prompt: {prompt[:100]}...")  # Log first 100 chars
            
            # Get the directory where this script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            codex_executor_path = os.path.join(script_dir, "codex_executor.py")
            
            # Prepare command
            cmd = [
                sys.executable,  # Use current Python interpreter
                codex_executor_path,
                prompt,
                repo_label
            ]
            
            self.logger.info(f"Running command: {' '.join(cmd)}")
            
            # Run the command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=script_dir,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                self.logger.info("Codex executor completed successfully")
                return {
                    "success": True,
                    "message": "Prompt submitted successfully",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "task_id": str(uuid.uuid4())[:8]
                }
            else:
                self.logger.error(f"Codex executor failed with return code: {result.returncode}")
                self.logger.error(f"Error output: {result.stderr}")
                return {
                    "success": False,
                    "error": f"Execution failed with return code {result.returncode}",
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
                
        except subprocess.TimeoutExpired:
            self.logger.error("Codex executor timed out")
            return {
                "success": False,
                "error": "Execution timed out after 5 minutes"
            }
        except Exception as e:
            self.logger.error(f"Error submitting prompt: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_task_submitted(self, repo_label: str) -> Optional[Dict]:
        """Get latest submitted task for a repository"""
        try:
            self.logger.info(f"Getting latest task for repo: {repo_label}")
            
            # Look for the latest log file
            logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
            
            if not os.path.exists(logs_dir):
                return None
            
            # Get all JSON log files
            log_files = [f for f in os.listdir(logs_dir) if f.endswith('.json')]
            
            if not log_files:
                return None
            
            # Sort by modification time, get the latest
            log_files.sort(key=lambda x: os.path.getmtime(os.path.join(logs_dir, x)), reverse=True)
            latest_log = log_files[0]
            
            # Read the latest log file
            log_path = os.path.join(logs_dir, latest_log)
            with open(log_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if lines:
                # Parse the last line as JSON
                last_entry = json.loads(lines[-1].strip())
                return {
                    "task_id": latest_log.replace('.json', ''),
                    "timestamp": last_entry.get('timestamp'),
                    "message": last_entry.get('message'),
                    "repo_label": repo_label,
                    "status": "completed" if "Browser closed" in last_entry.get('message', '') else "running"
                }
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting latest task: {e}")
            return None

# Global service instance
codex_service = CodexService()

# Convenience functions for backward compatibility
def get_list_repos() -> List[Dict[str, str]]:
    """Get list of available repositories"""
    return codex_service.get_list_repos()

def submit_prompt(prompt: str, repo_label: str) -> Dict:
    """Submit prompt to Codex"""
    return codex_service.submit_prompt(prompt, repo_label)

def get_task_submitted(repo_label: str) -> Optional[Dict]:
    """Get latest submitted task"""
    return codex_service.get_task_submitted(repo_label)