import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Hardcoded configuration based on command line example
DEFAULT_USER_DATA_DIR = "C:/Users/HieuLT/Desktop/ChromeProfileTest"
DEFAULT_PROFILE = "Default"
CODEX_BASE_URL = "https://chat.openai.com/codex"
LOGS_DIR = "logs"

# ----------------------------------------
# Step 1: Setup logger for .log output
# ----------------------------------------
def setup_logger(log_path: str) -> logging.Logger:
    logger = logging.getLogger("codex_executor")
    logger.setLevel(logging.INFO)

    if logger.hasHandlers():
        logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

    # File handler with full info
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Stream handler to console (avoid emoji if console doesn't support)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(logging.Formatter("%(levelname)s - %(message)s"))
    logger.addHandler(sh)

    logger.propagate = False
    return logger

# ----------------------------------------
# Step 2: Append to JSON log file
# ----------------------------------------
def log_json(json_path: str, message: str) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": message,
    }
    with open(json_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

# ----------------------------------------
# Step 3: Main automation logic for Codex
# ----------------------------------------
def run_codex(prompt: str, repo_label: str, user_data_dir: str, profile: str, log_path: str, json_log_path: str) -> None:
    logger = setup_logger(log_path)
    logger.info("Starting Codex executor")
    log_json(json_log_path, "🚀 Starting Codex executor")

    options = Options()
    # Windows-friendly Chrome options for stability
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    options.add_argument("--disable-images")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-features=VizDisplayCompositor")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--start-maximized")
    
    # Use user profile for authentication
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument(f"--profile-directory={profile}")
    options.add_argument("--remote-debugging-port=9222")
    
    # Add additional stability options
    options.add_argument("--disable-background-timer-throttling")
    options.add_argument("--disable-backgrounding-occluded-windows")
    options.add_argument("--disable-renderer-backgrounding")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    # Try to use ChromeDriverManager for automatic driver management
    driver = None
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        logger.info("Chrome driver initialized successfully with ChromeDriverManager")
    except ImportError:
        # Fallback to default Chrome driver
        logger.warning("webdriver-manager not available, using default Chrome driver")
        try:
            driver = webdriver.Chrome(options=options)
            logger.info("Chrome driver initialized successfully with default driver")
        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            log_json(json_log_path, f"❌ Failed to initialize Chrome driver: {str(e)}")
            return
    except Exception as e:
        logger.error(f"Error with ChromeDriverManager: {e}")
        try:
            driver = webdriver.Chrome(options=options)
            logger.info("Chrome driver initialized successfully with fallback")
        except Exception as fallback_error:
            logger.error(f"Failed to initialize Chrome driver with fallback: {fallback_error}")
            log_json(json_log_path, f"❌ Failed to initialize Chrome driver: {str(fallback_error)}")
            return
    # Ensure driver was successfully initialized
    if driver is None:
        logger.error("Chrome driver was not initialized, cannot proceed")
        log_json(json_log_path, "❌ Chrome driver was not initialized")
        return
        
    try:
        # Ensure we have at least one except clause to handle exceptions
        encoded_prompt = quote(prompt)
        url = f"https://chat.openai.com/codex?prompt={encoded_prompt}"
        logger.info(f"Opening {url}")
        log_json(json_log_path, f"🌐 Opening {url}")
        driver.get(url)

        logger.info("Waiting for page load or login if required")
        try:
            WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(5)
            logger.info("Page loaded successfully")
        except Exception as e:
            logger.warning(f"Page load timeout or error: {e}")
            log_json(json_log_path, f"⚠️ Page load issue: {str(e)}")
            # Continue anyway, might still work

        # Step 1: Open repo dropdown
        logger.info("Clicking repository dropdown")
        try:
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "//button[@aria-label='View all code environments']"))
            )

            repo_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='View all code environments']"))
            )
            repo_button.click()
            log_json(json_log_path, "📂 Opened repository dropdown")
            logger.info("Repository dropdown opened successfully")
        except Exception as e:
            logger.warning(f"Could not open repository dropdown: {e}")
            log_json(json_log_path, f"⚠️ Repository dropdown issue: {str(e)}")
            # Continue to next step anyway

        # Step 2: Click repo item (get its parent button)
        logger.info(f"Selecting repo: {repo_label}")
        try:
            repo_item = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{repo_label}')]/ancestor::button"))
            )
            repo_item.click()
            logger.info(f"Selected repo: {repo_label}")
            log_json(json_log_path, f"✅ Selected repo {repo_label}")
        except Exception as e:
            logger.warning(f"Could not select repository {repo_label}: {e}")
            log_json(json_log_path, f"⚠️ Repository selection issue: {str(e)}")
            # Continue to next step anyway

        # Step 3: Click Code button
        logger.info("Looking for 'Code' button")
        try:
            code_button = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Code')]"))
            )
            code_button.click()
            logger.info("Clicked Code button")
            log_json(json_log_path, "📈 Clicked Code button")
        except Exception as e:
            logger.warning(f"Could not click Code button: {e}")
            log_json(json_log_path, f"⚠️ Code button issue: {str(e)}")

        time.sleep(5)
        logger.info("Codex automation completed")
        log_json(json_log_path, "🎯 Codex automation completed")

    except Exception as e:
        logger.exception(f"Error occurred: {e}")
        log_json(json_log_path, f"❌ Exception: {str(e)}")

    finally:
        if driver is not None:
            try:
                driver.quit()
                logger.info("Browser closed")
                log_json(json_log_path, "🚩 Browser closed")
            except Exception as e:
                logger.error(f"Error closing browser: {e}")
                log_json(json_log_path, f"⚠️ Error closing browser: {str(e)}")
        else:
            logger.info("No browser to close")
            log_json(json_log_path, "ℹ️ No browser to close")

# ----------------------------------------
# Step 4: Parse args and generate log files
# ----------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Run Codex with Selenium")
    parser.add_argument("prompt", help="Prompt to send to Codex")
    parser.add_argument("repo_label", help="Repository label in Codex (e.g., innolabvn/byebug-backend)")
    parser.add_argument("--user_data_dir", default=DEFAULT_USER_DATA_DIR, help="Chrome user data directory")
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help="Chrome profile directory (default: Default)")
    args = parser.parse_args()

    os.makedirs(LOGS_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    log_path = os.path.join(LOGS_DIR, f"codex_{timestamp}.log")
    json_log_path = os.path.join(LOGS_DIR, f"codex_{timestamp}.json")

    run_codex(args.prompt, args.repo_label, args.user_data_dir, args.profile, log_path, json_log_path)

if __name__ == "__main__":
    main()