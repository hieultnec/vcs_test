import json
import logging
import os
import requests
import time
from datetime import datetime, timezone
from typing import List, Dict, Optional

# Configuration for Codex API service
CODEX_API_BASE_URL = "http://localhost:5137/api/codex"
LOGS_DIR = "logs"

class CodexService:
    def __init__(self):
        self.api_base_url = CODEX_API_BASE_URL
        self.logger = self._setup_logger()
        
        # Ensure logs directory exists
        os.makedirs(LOGS_DIR, exist_ok=True)
    

    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for codex service"""
        logger = logging.getLogger("codex_service")
        logger.setLevel(logging.INFO)
        
        if logger.hasHandlers():
            logger.handlers.clear()
        
        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        
        # Console handler
        sh = logging.StreamHandler()
        sh.setFormatter(logging.Formatter("%(levelname)s - %(message)s"))
        logger.addHandler(sh)
        
        logger.propagate = False
        return logger
    
    def _log_json(self, json_path: str, message: str) -> None:
        """Append message to JSON log file"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message,
        }
        with open(json_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    
    def _make_api_request(self, endpoint: str, method: str = "GET", data: dict = None) -> dict:
        """Make HTTP request to Codex API service"""
        url = f"{self.api_base_url}/{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=300)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"API request failed: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            self.logger.error(f"Unexpected error in API request: {e}")
            return {"success": False, "error": str(e)}
    
    def get_list_repos(self) -> List[Dict[str, str]]:
        """Get list of repositories from Codex API"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_log_path = os.path.join(LOGS_DIR, f"codex_{timestamp}.json")
        
        try:
            self.logger.info("Starting Codex repository list retrieval via API")
            self._log_json(json_log_path, "Codex repository list retrieval started")
            
            # Make API request to get repositories
            response = self._make_api_request("repositories")
            
            if response.get("success", False):
                repositories = response.get("repositories", [])
                self.logger.info(f"Found {len(repositories)} repositories")
                self._log_json(json_log_path, f"Found {len(repositories)} repositories")
                return repositories
            else:
                error_msg = response.get("error", "Unknown error")
                self.logger.error(f"API request failed: {error_msg}")
                self._log_json(json_log_path, f"API Error: {error_msg}")
                return []
            
        except Exception as e:
            self.logger.error(f"Error getting repository list: {e}")
            self._log_json(json_log_path, f"Error: {str(e)}")
            return []
        

    
    def submit_prompt(self, prompt: str, repo_label: str) -> Dict[str, any]:
        """Submit prompt to Codex API with specified repository"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_log_path = os.path.join(LOGS_DIR, f"codex_{timestamp}.json")
        
        try:
            self.logger.info(f"Submitting prompt to repository: {repo_label} via API")
            self._log_json(json_log_path, f"Submitting prompt to repository: {repo_label}")
            
            # Prepare API request data
            request_data = {
                "prompt": prompt,
                "repository": repo_label
            }
            
            # Make API request to submit prompt
            response = self._make_api_request("submit", method="POST", data=request_data)
            
            if response.get("success", False):
                self.logger.info("Prompt submitted successfully")
                self._log_json(json_log_path, "Prompt submitted successfully")
                return response
            else:
                error_msg = response.get("error", "Unknown error")
                self.logger.error(f"API request failed: {error_msg}")
                self._log_json(json_log_path, f"API Error: {error_msg}")
                return {
                    "success": False,
                    "message": f"Failed to submit prompt: {error_msg}",
                    "error": error_msg
                }
            
        except Exception as e:
            self.logger.error(f"Error submitting prompt: {e}")
            self._log_json(json_log_path, f"Error: {str(e)}")
            return {
                "success": False,
                "message": f"Error submitting prompt: {str(e)}",
                "error": str(e)
            }
    


# Convenience functions for backward compatibility
def get_list_repos() -> List[Dict[str, str]]:
    """Get list of available repositories"""
    service = CodexService()
    try:
        return service.get_list_repos()
    finally:
        service._cleanup_user_data()

def submit_prompt(prompt: str, repo_label: str) -> Dict[str, any]:
    """Submit prompt to Codex"""
    service = CodexService()
    return service.submit_prompt(prompt, repo_label)



# Example usage
if __name__ == "__main__":
    # Test the services
    service = CodexService()
    
    # Get repositories
    repos = service.get_list_repos()
    print(f"Available repos: {repos}")
    
    # Submit a prompt
    result = service.submit_prompt("Refactor checkout flow", "bye-bug-codex-hub")
    print(f"Submit result: {result}")