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
# Step 2.5: Clean up temporary user data directory
# ----------------------------------------
def cleanup_user_data(user_data_dir: str, logger: logging.Logger) -> None:
    """Clean up temporary user data directory"""
    try:
        import shutil
        if os.path.exists(user_data_dir) and "ChromeProfileTest_" in user_data_dir:
            shutil.rmtree(user_data_dir, ignore_errors=True)
            logger.info(f"Cleaned up user data directory: {user_data_dir}")
    except Exception as e:
        logger.warning(f"Failed to cleanup user data directory: {e}")

# ----------------------------------------
# Step 3: Main automation logic for Codex
# ----------------------------------------
def run_codex(prompt: str, repo_label: str, user_data_dir: str, profile: str, log_path: str, json_log_path: str) -> None:
    logger = setup_logger(log_path)
    logger.info("Starting Codex executor")
    log_json(json_log_path, "🚀 Starting Codex executor")

    options = Options()
    # Enhanced Windows-friendly Chrome options for maximum stability
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
    
    # Critical stability options for Windows
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-default-apps")
    options.add_argument("--disable-sync")
    options.add_argument("--disable-translate")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--mute-audio")
    options.add_argument("--no-first-run")
    options.add_argument("--safebrowsing-disable-auto-update")
    options.add_argument("--disable-ipc-flooding-protection")
    options.add_argument("--disable-hang-monitor")
    options.add_argument("--disable-prompt-on-repost")
    options.add_argument("--disable-domain-reliability")
    options.add_argument("--disable-component-update")
    options.add_argument("--disable-background-timer-throttling")
    options.add_argument("--disable-backgrounding-occluded-windows")
    options.add_argument("--disable-renderer-backgrounding")
    options.add_argument("--disable-field-trial-config")
    options.add_argument("--disable-back-forward-cache")
    options.add_argument("--disable-features=TranslateUI,BlinkGenPropertyTrees")
    
    # Use user profile for authentication
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument(f"--profile-directory={profile}")
    options.add_argument("--remote-debugging-port=9222")
    
    # Enhanced anti-detection and automation options
    options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Additional stealth options to avoid bot detection
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36")
    options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.notifications": 2,
        "profile.default_content_settings.popups": 0,
        "profile.managed_default_content_settings.images": 2,
        "profile.content_settings.exceptions.automatic_downloads.*.setting": 1
    })
    
    # Disable automation indicators
    options.add_argument("--disable-automation")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-dev-tools")
    options.add_argument("--disable-browser-side-navigation")
    options.add_argument("--disable-gpu-sandbox")

    # Try to use ChromeDriverManager for automatic driver management
    driver = None
    service = None
    
    # Configure service with additional stability options
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        service = Service(
            ChromeDriverManager().install(),
            service_args=[
                '--verbose',
                '--log-path=chromedriver.log',
                '--append-log',
                '--readable-timestamp'
            ]
        )
        logger.info("ChromeDriverManager service configured")
    except ImportError:
        logger.warning("webdriver-manager not available, using default service")
        from selenium.webdriver.chrome.service import Service
        service = Service(
            service_args=[
                '--verbose',
                '--log-path=chromedriver.log',
                '--append-log',
                '--readable-timestamp'
            ]
        )
    except Exception as e:
        logger.warning(f"Service configuration failed: {e}")
        from selenium.webdriver.chrome.service import Service
        service = Service()
    
    # Initialize Chrome driver with enhanced error handling
    max_init_retries = 2
    for init_attempt in range(max_init_retries):
        try:
            if service:
                driver = webdriver.Chrome(service=service, options=options)
            else:
                driver = webdriver.Chrome(options=options)
            logger.info(f"Chrome driver initialized successfully on attempt {init_attempt + 1}")
            break
        except Exception as e:
            logger.error(f"Chrome driver initialization attempt {init_attempt + 1} failed: {e}")
            if init_attempt == max_init_retries - 1:
                logger.error("All Chrome driver initialization attempts failed")
                log_json(json_log_path, f"❌ Failed to initialize Chrome driver after {max_init_retries} attempts: {str(e)}")
                return
            time.sleep(3)  # Wait before retry
    
    # Ensure driver was successfully initialized
    if driver is None:
        logger.error("Chrome driver was not initialized, cannot proceed")
        log_json(json_log_path, "❌ Chrome driver was not initialized")
        return
    
    # Execute stealth scripts to avoid detection
    try:
        # Remove webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # Override plugins and languages
        driver.execute_script("""
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        """)
        
        # Override chrome runtime
        driver.execute_script("""
            window.chrome = {
                runtime: {}
            };
        """)
        
        logger.info("Stealth scripts executed successfully")
    except Exception as e:
        logger.warning(f"Failed to execute stealth scripts: {e}")
        
    try:
        # Set page load timeout to prevent hanging
        driver.set_page_load_timeout(120)
        
        # Ensure we have at least one except clause to handle exceptions
        encoded_prompt = quote(prompt)
        url = f"https://chat.openai.com/codex?prompt={encoded_prompt}"
        logger.info(f"Opening {url}")
        log_json(json_log_path, f"🌐 Opening {url}")
        
        # Retry mechanism for page loading
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(url)
                logger.info(f"Page load attempt {attempt + 1} successful")
                break
            except Exception as e:
                logger.warning(f"Page load attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    logger.error("All page load attempts failed")
                    log_json(json_log_path, f"❌ All page load attempts failed: {str(e)}")
                    return
                time.sleep(2)  # Wait before retry

        logger.info("Waiting for page load or login if required")
        try:
            WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Random delay to mimic human behavior
            import random
            human_delay = random.uniform(3, 8)
            time.sleep(human_delay)
            logger.info(f"Page loaded successfully, waited {human_delay:.1f}s")
            
            # Simulate human-like mouse movement
            try:
                from selenium.webdriver.common.action_chains import ActionChains
                actions = ActionChains(driver)
                actions.move_by_offset(random.randint(100, 300), random.randint(100, 300))
                actions.perform()
                time.sleep(random.uniform(0.5, 1.5))
            except Exception:
                pass  # Ignore if action chains fail
                
        except Exception as e:
            logger.warning(f"Page load timeout or error: {e}")
            log_json(json_log_path, f"⚠️ Page load issue: {str(e)}")
            # Continue anyway, might still work

        # Helper function to check if session is still valid
        def is_session_valid():
            try:
                driver.current_url
                return True
            except Exception:
                return False

        # Step 1: Open repo dropdown
        logger.info("Clicking repository dropdown")
        try:
            # Check session validity before proceeding
            if not is_session_valid():
                logger.error("Session lost before dropdown step")
                log_json(json_log_path, "❌ Session lost before dropdown")
                return
            
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.XPATH, "//button[@aria-label='View all code environments']"))
            )

            repo_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='View all code environments']"))
            )
            
            # Human-like delay before clicking
            time.sleep(random.uniform(1, 3))
            repo_button.click()
            log_json(json_log_path, "📂 Opened repository dropdown")
            logger.info("Repository dropdown opened successfully")
            
            # Wait after clicking
            time.sleep(random.uniform(1, 2))
        except Exception as e:
            logger.warning(f"Could not open repository dropdown: {e}")
            log_json(json_log_path, f"⚠️ Repository dropdown issue: {str(e)}")
            # Check if session is still valid
            if not is_session_valid():
                logger.error("Session lost during dropdown step")
                log_json(json_log_path, "❌ Session lost during dropdown")
                return
            # Continue to next step anyway

        # Step 2: Click repo item (get its parent button)
        logger.info(f"Selecting repo: {repo_label}")
        try:
            # Check session validity before proceeding
            if not is_session_valid():
                logger.error("Session lost before repo selection")
                log_json(json_log_path, "❌ Session lost before repo selection")
                return
            
            repo_item = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{repo_label}')]/ancestor::button"))
            )
            
            # Human-like delay before clicking
            time.sleep(random.uniform(0.8, 2.5))
            repo_item.click()
            logger.info(f"Selected repo: {repo_label}")
            log_json(json_log_path, f"✅ Selected repo {repo_label}")
            
            # Wait after selection
            time.sleep(random.uniform(1.5, 3))
        except Exception as e:
            logger.warning(f"Could not select repository {repo_label}: {e}")
            log_json(json_log_path, f"⚠️ Repository selection issue: {str(e)}")
            # Check if session is still valid
            if not is_session_valid():
                logger.error("Session lost during repo selection")
                log_json(json_log_path, "❌ Session lost during repo selection")
                return
            # Continue to next step anyway

        # Step 3: Click Code button
        logger.info("Looking for 'Code' button")
        try:
            # Check session validity before proceeding
            if not is_session_valid():
                logger.error("Session lost before Code button")
                log_json(json_log_path, "❌ Session lost before Code button")
                return
            
            code_button = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Code')]"))
            )
            
            # Human-like delay before clicking
            time.sleep(random.uniform(1, 2.5))
            code_button.click()
            logger.info("Clicked Code button")
            log_json(json_log_path, "📈 Clicked Code button")
            
            # Wait after clicking
            time.sleep(random.uniform(2, 4))
        except Exception as e:
            logger.warning(f"Could not click Code button: {e}")
            log_json(json_log_path, f"⚠️ Code button issue: {str(e)}")
            # Check if session is still valid
            if not is_session_valid():
                logger.error("Session lost during Code button step")
                log_json(json_log_path, "❌ Session lost during Code button")
                return

        # Final wait with random delay
        final_wait = random.uniform(3, 7)
        time.sleep(final_wait)
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
        
        # Clean up temporary user data directory
        cleanup_user_data(user_data_dir, logger)

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