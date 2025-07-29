import json
import logging
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Hardcoded configuration based on command line example
DEFAULT_USER_DATA_DIR = "C:/Users/HieuLT/Desktop/ChromeProfileTest"
DEFAULT_PROFILE = "Default"
CODEX_BASE_URL = "https://chat.openai.com/codex"
LOGS_DIR = "logs"

class CodexService:
    def __init__(self, user_data_dir: str = None, profile: str = DEFAULT_PROFILE):
        # Create unique user data directory for each session to avoid conflicts
        if user_data_dir is None:
            session_id = str(uuid.uuid4())[:8]
            self.user_data_dir = os.path.join(os.path.dirname(DEFAULT_USER_DATA_DIR), f"ChromeProfileTest_{session_id}")
        else:
            self.user_data_dir = user_data_dir
        self.profile = profile
        self.driver = None
        self.logger = self._setup_logger()
        
        # Ensure logs directory exists
        os.makedirs(LOGS_DIR, exist_ok=True)
        # Ensure user data directory exists
        os.makedirs(self.user_data_dir, exist_ok=True)
    
    def _cleanup_user_data(self) -> None:
        """Clean up temporary user data directory"""
        try:
            import shutil
            if os.path.exists(self.user_data_dir) and "ChromeProfileTest_" in self.user_data_dir:
                shutil.rmtree(self.user_data_dir, ignore_errors=True)
                self.logger.info(f"Cleaned up user data directory: {self.user_data_dir}")
        except Exception as e:
            self.logger.warning(f"Failed to cleanup user data directory: {e}")
    
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
    
    def _init_driver(self) -> webdriver.Chrome:
        """Initialize Chrome driver with configured options"""
        options = Options()
        options.add_argument(f"--user-data-dir={self.user_data_dir}")
        options.add_argument(f"--profile-directory={self.profile}")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--remote-debugging-port=9222")
        options.add_argument("--headless")  # Enable headless mode for Docker container
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_argument("--disable-ipc-flooding-protection")
        # options.add_argument("--disable-javascript")  # Keep JS enabled for web interactions
        options.add_argument("--window-size=1920,1080")
        
        # Try to use ChromeDriverManager for automatic driver management
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            service = Service(ChromeDriverManager().install())
            return webdriver.Chrome(service=service, options=options)
        except ImportError:
            # Fallback to default Chrome driver
            self.logger.warning("webdriver-manager not available, using default Chrome driver")
            return webdriver.Chrome(options=options)
        except Exception as e:
            self.logger.error(f"Error with ChromeDriverManager: {e}")
            return webdriver.Chrome(options=options)
    
    def _navigate_to_codex(self, prompt: str = None) -> bool:
        """Navigate to Codex page"""
        try:
            if prompt:
                encoded_prompt = quote(prompt)
                url = f"{CODEX_BASE_URL}?prompt={encoded_prompt}"
            else:
                url = CODEX_BASE_URL
            
            self.logger.info(f"Opening {url}")
            self.driver.get(url)
            
            # Wait for page load
            WebDriverWait(self.driver, 60).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            time.sleep(3)
            return True
            
        except TimeoutException:
            self.logger.error("Timeout waiting for page to load")
            return False
        except Exception as e:
            self.logger.error(f"Error navigating to Codex: {e}")
            return False
    
    def get_list_repos(self) -> List[Dict[str, str]]:
        """Get list of available repositories from Codex"""
        self.logger.info("Getting list of repositories")
        
        # Mock data for development - replace with actual Selenium automation when needed
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
        
        # Uncomment below for actual Selenium automation:
        # try:
        #     self.driver = self._init_driver()
        #     
        #     if not self._navigate_to_codex():
        #         return []
        #     
        #     # Click repository dropdown
        #     repo_button = WebDriverWait(self.driver, 30).until(
        #         EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='View all code environments']"))
        #     )
        #     repo_button.click()
        #     time.sleep(2)
        #     
        #     # Get all repository items
        #     repo_elements = WebDriverWait(self.driver, 10).until(
        #         EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'repo-item')]//span"))
        #     )
        #     
        #     repos = []
        #     for element in repo_elements:
        #         repo_text = element.text.strip()
        #         if repo_text:
        #             repos.append({
        #                 "label": repo_text,
        #                 "value": repo_text
        #             })
        #     
        #     self.logger.info(f"Found {len(repos)} repositories")
        #     return repos
        #     
        # except TimeoutException:
        #     self.logger.error("Timeout getting repository list")
        #     return []
        # except Exception as e:
        #     self.logger.error(f"Error getting repository list: {e}")
        #     return []
        # finally:
        #     if self.driver:
        #         self.driver.quit()
        #     self._cleanup_user_data()
    
    def submit_prompt(self, prompt: str, repo_label: str) -> Dict[str, any]:
        """Submit prompt to Codex with specified repository using codex_executor.py"""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        log_path = os.path.join(LOGS_DIR, f"codex_submit_{timestamp}.log")
        json_log_path = os.path.join(LOGS_DIR, f"codex_submit_{timestamp}.json")
        
        self.logger.info(f"Submitting prompt to repo: {repo_label}")
        self._log_json(json_log_path, f"🚀 Starting prompt submission: {prompt}")
        
        try:
            # Get the directory where this script is located
            current_dir = os.path.dirname(os.path.abspath(__file__))
            executor_path = os.path.join(current_dir, "codex_executor.py")
            
            # Build the command to run codex_executor.py
            cmd = [
                sys.executable,  # Python executable
                executor_path,
                prompt,
                repo_label,
                "--user_data_dir", self.user_data_dir,
                "--profile", self.profile
            ]
            
            self.logger.info(f"Running command: {' '.join(cmd)}")
            self._log_json(json_log_path, f"🔧 Running command: {' '.join(cmd)}")
            
            # Run the subprocess
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
                cwd=current_dir
            )
            
            # Log the output
            if result.stdout:
                self.logger.info(f"Executor stdout: {result.stdout}")
                self._log_json(json_log_path, f"📝 Executor output: {result.stdout}")
            
            if result.stderr:
                self.logger.warning(f"Executor stderr: {result.stderr}")
                self._log_json(json_log_path, f"⚠️ Executor errors: {result.stderr}")
            
            if result.returncode == 0:
                self._log_json(json_log_path, "✅ Prompt submitted successfully")
                return {
                    "success": True,
                    "message": "Prompt submitted successfully",
                    "timestamp": timestamp,
                    "log_path": log_path,
                    "json_log_path": json_log_path,
                    "executor_output": result.stdout,
                    "command": ' '.join(cmd)
                }
            else:
                error_msg = f"Executor failed with return code {result.returncode}"
                self.logger.error(error_msg)
                self._log_json(json_log_path, f"❌ {error_msg}")
                return {
                    "success": False, 
                    "error": error_msg,
                    "stderr": result.stderr,
                    "stdout": result.stdout
                }
                
        except subprocess.TimeoutExpired:
            error_msg = "Timeout during prompt submission (5 minutes)"
            self.logger.error(error_msg)
            self._log_json(json_log_path, f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Error submitting prompt: {e}"
            self.logger.error(error_msg)
            self._log_json(json_log_path, f"❌ Exception: {str(e)}")
            return {"success": False, "error": error_msg}
    
    def get_task_submitted(self, repo_label: str) -> Optional[Dict[str, any]]:
        """Get the latest submitted task from Codex"""
        self.logger.info(f"Getting latest task for repo: {repo_label}")
        
        try:
            self.driver = self._init_driver()
            
            if not self._navigate_to_codex():
                return None
            
            # Navigate to the repository
            repo_button = WebDriverWait(self.driver, 30).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='View all code environments']"))
            )
            repo_button.click()
            time.sleep(2)
            
            # Select repository
            repo_item = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{repo_label}')]/ancestor::button"))
            )
            repo_item.click()
            time.sleep(2)
            
            # Look for the latest task/conversation
            try:
                # Try to find the latest conversation or task element
                latest_task = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'conversation-item')][1] | //div[contains(@class, 'task-item')][1]"))
                )
                
                task_text = latest_task.text.strip()
                task_id = latest_task.get_attribute("data-id") or f"task_{int(time.time())}"
                
                return {
                    "task_id": task_id,
                    "content": task_text,
                    "repo_label": repo_label,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "submitted"
                }
                
            except TimeoutException:
                self.logger.warning("No tasks found")
                return None
            
        except Exception as e:
            self.logger.error(f"Error getting latest task: {e}")
            return None
        finally:
            if self.driver:
                self.driver.quit()

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

def get_task_submitted(repo_label: str) -> Optional[Dict[str, any]]:
    """Get latest submitted task"""
    service = CodexService()
    return service.get_task_submitted(repo_label)

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
    
    # Get latest task
    task = service.get_task_submitted("bye-bug-codex-hub")
    print(f"Latest task: {task}")