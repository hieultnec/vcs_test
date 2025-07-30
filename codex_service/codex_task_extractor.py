#!/usr/bin/env python3
"""
Codex Task Extractor
Extracts tasks and content from OpenAI Codex interface

Steps:
1. Open https://chat.openai.com/codex
2. Click on first task
3. Get URL
4. Get all content from response section
"""

import json
import logging
import os
import random
import time
from datetime import datetime, timezone
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, WebDriverException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def log_json(file_path, message):
    """Log message to JSON file"""
    try:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message
        }
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        logger.error(f"Failed to write to log file: {e}")

def setup_chrome_driver():
    """Setup Chrome driver with anti-detection options and Chrome profile"""
    options = Options()
    
    # Use Chrome profile for authentication (same as codex_executor.py)
    DEFAULT_USER_DATA_DIR = "C:/Users/HieuLT/Desktop/ChromeProfileTest"
    DEFAULT_PROFILE = "Default"
    
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
    options.add_argument(f"--user-data-dir={DEFAULT_USER_DATA_DIR}")
    options.add_argument(f"--profile-directory={DEFAULT_PROFILE}")
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
    
    # Create service with verbose logging
    service = Service()
    service.log_output = True
    
    # Initialize driver with retry mechanism
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            driver = webdriver.Chrome(service=service, options=options)
            
            # Set page load timeout
            driver.set_page_load_timeout(120)
            
            # Execute stealth scripts
            driver.execute_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
                
                window.chrome = {
                    runtime: {},
                };
            """)
            
            logger.info("Chrome driver initialized successfully")
            return driver
            
        except Exception as e:
            logger.warning(f"Driver initialization attempt {attempt + 1} failed: {e}")
            if attempt < max_retries:
                time.sleep(2)
                continue
            else:
                raise e

def extract_tasks_and_content():
    """Main function to extract tasks and content from Codex"""
    
    # Setup logging
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"codex_task_extract_{timestamp}.json"
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    json_log_path = os.path.join(logs_dir, log_filename)
    
    driver = None
    result = {
        "success": False,
        "tasks": [],
        "url": None,
        "content": None,
        "error": None
    }
    
    try:
        log_json(json_log_path, "🚀 Starting Codex task extraction")
        logger.info("Starting Codex task extraction")
        
        # Setup driver
        driver = setup_chrome_driver()
        
        # Step 1: Open https://chat.openai.com/codex
        codex_url = "https://chat.openai.com/codex"
        logger.info(f"Opening {codex_url}")
        log_json(json_log_path, f"🌐 Opening {codex_url}")
        
        # Retry mechanism for loading URL
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(codex_url)
                break
            except Exception as e:
                logger.warning(f"URL load attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                else:
                    raise e
        
        # Add stealth script to avoid detection
        driver.execute_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)
        
        # Wait for initial page load
        time.sleep(3)
        
        # Check if we hit Cloudflare challenge
        page_title = driver.title.lower()
        page_source = driver.page_source.lower()
        if "just a moment" in page_title or "cloudflare" in page_source or "waiting for chatgpt.com" in page_source:
            logger.info("Detected Cloudflare challenge, waiting for completion...")
            log_json(json_log_path, "🛡️ Cloudflare challenge detected, waiting...")
            
            # Wait for Cloudflare challenge to complete (up to 120 seconds)
            max_wait = 120
            start_time = time.time()
            challenge_completed = False
            
            while time.time() - start_time < max_wait:
                try:
                    # Check if page has loaded properly
                    current_title = driver.title.lower()
                    current_source = driver.page_source.lower()
                    
                    # Check multiple indicators that challenge is complete
                    if ("just a moment" not in current_title and 
                        "cloudflare" not in current_source and 
                        "waiting for chatgpt.com" not in current_source and
                        "challenge" not in current_source and
                        "challenge-platform" not in current_source and
                        "turnstile" not in current_source and
                        ("codex" in current_title or "chat" in current_title)):
                        logger.info("Cloudflare challenge completed")
                        log_json(json_log_path, "✅ Cloudflare challenge completed")
                        challenge_completed = True
                        break
                    
                    # Keep the session alive with small interactions
                    try:
                        driver.execute_script("return document.readyState;")
                        driver.execute_script("window.scrollTo(0, 100);")
                    except:
                        pass
                    time.sleep(8)
                    
                except Exception as e:
                    logger.warning(f"Error during challenge wait: {e}")
                    time.sleep(2)
                    
            if not challenge_completed:
                logger.warning("Cloudflare challenge timeout, continuing anyway...")
                log_json(json_log_path, "⚠️ Cloudflare challenge timeout, continuing...")
        
        # Wait for page to fully load and render
        time.sleep(15)
        
        # Human-like behavior: scroll and wait for content to load
        driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(3)
        driver.execute_script("window.scrollTo(0, 600);")
        time.sleep(3)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        # Wait longer for dynamic content to load
        time.sleep(10)
        logger.info("Waiting for dynamic content to load...")
        log_json(json_log_path, "⏳ Waiting for dynamic content to load...")
        
        # Add human-like delay
        time.sleep(random.uniform(2, 5))
        
        # Simulate human-like mouse movements
        actions = ActionChains(driver)
        actions.move_by_offset(random.randint(100, 300), random.randint(100, 300))
        actions.perform()
        time.sleep(random.uniform(1, 3))
        
        log_json(json_log_path, "✅ Page loaded successfully")
        
        # Step 2: Click on first task
        logger.info("Looking for first task")
        log_json(json_log_path, "🔍 Looking for first task")
        
        # Debug: Save page source and take screenshot for analysis
        try:
            page_source = driver.page_source
            logger.info(f"Page title: {driver.title}")
            logger.info(f"Current URL: {driver.current_url}")
            
            # Save page source for debugging
            debug_file = os.path.join(os.path.dirname(json_log_path), f"debug_page_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(page_source)
            logger.info(f"Page source saved to: {debug_file}")
            
            # Take screenshot for debugging
            screenshot_file = os.path.join(os.path.dirname(json_log_path), f"debug_screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            driver.save_screenshot(screenshot_file)
            logger.info(f"Screenshot saved to: {screenshot_file}")
            
        except Exception as debug_e:
            logger.warning(f"Debug capture failed: {debug_e}")
        
        try:
            # Wait for tasks to load and find top 5 recent tasks
            # Try multiple selectors based on actual HTML structure
            task_selectors = [
                'a[href*="/codex/"]',       # Codex specific URLs
                'a[data-discover="true"]',  # Based on provided HTML context
                '.task-row-container a',     # Generic task container
                'a[href*="task_"]',         # Links containing 'task_'
                '.group.task-row-container a', # More specific container
                'a[href*="/task/"]',        # Alternative task URL pattern
                '.task-item a',             # Alternative task item
                '[data-testid*="task"] a', # Test ID based selector
                '.list-item a',             # Generic list item
                'main a',                   # Any link in main content
                'div a[href]'               # Any link in div elements
            ]
            
            task_elements = []
            for selector in task_selectors:
                try:
                    logger.info(f"Trying selector: {selector}")
                    elements = WebDriverWait(driver, 10).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                    )
                    # Filter for clickable elements
                    clickable_elements = [elem for elem in elements if elem.is_displayed() and elem.is_enabled()]
                    if clickable_elements:
                        task_elements = clickable_elements
                        logger.info(f"Found {len(task_elements)} tasks with selector: {selector}")
                        break
                except TimeoutException:
                    logger.warning(f"Selector {selector} not found, trying next...")
                    continue
            
            if not task_elements:
                logger.error("Could not find any tasks with any selector")
                # Try to find any clickable link as fallback
                try:
                    logger.info("Trying fallback: any clickable link")
                    links = driver.find_elements(By.TAG_NAME, "a")
                    clickable_links = [link for link in links if link.is_displayed() and link.is_enabled()]
                    if clickable_links:
                        task_elements = clickable_links[:5]  # Take first 5 as fallback
                        logger.info(f"Using fallback links: {len(task_elements)} found")
                except Exception as e:
                    logger.error(f"Fallback also failed: {e}")
                    
            if not task_elements:
                result["error"] = "Could not find any clickable tasks on the page"
                result["success"] = False
                return result
            
            # Get top 5 recent tasks (limit to 5)
            top_5_tasks = task_elements[:5]
            logger.info(f"Processing top {len(top_5_tasks)} tasks")
            log_json(json_log_path, f"📋 Found {len(top_5_tasks)} tasks to process")
            
            # Collect task information
            tasks_info = []
            for i, task_element in enumerate(top_5_tasks):
                try:
                    task_url = task_element.get_attribute('href')
                    task_text = task_element.text.strip() or task_element.get_attribute('title') or f"Task {i+1}"
                    tasks_info.append({
                        "index": i + 1,
                        "url": task_url,
                        "title": task_text
                    })
                    logger.info(f"Task {i+1}: {task_text} - {task_url}")
                except Exception as e:
                    logger.warning(f"Error getting info for task {i+1}: {e}")
            
            log_json(json_log_path, f"📋 Collected {len(tasks_info)} task URLs")
            
            # Click the first task to get content (as example)
            first_task = top_5_tasks[0]
            task_url = first_task.get_attribute('href')
            logger.info(f"Clicking first task: {task_url}")
            
            # Scroll to element
            driver.execute_script("arguments[0].scrollIntoView(true);", first_task)
            time.sleep(random.uniform(1, 2))
            
            # Human-like click
            ActionChains(driver).move_to_element(first_task).pause(random.uniform(0.5, 1.5)).click().perform()
            logger.info("Clicked first task")
            log_json(json_log_path, "👆 Clicked first task")
            
            # Wait for page to load
            time.sleep(random.uniform(3, 6))
            
            # Store tasks info in result
            result["tasks"] = tasks_info
            
        except TimeoutException:
            logger.error("Could not find any tasks")
            log_json(json_log_path, "❌ Could not find any tasks")
            result["error"] = "Could not find any tasks"
            result["success"] = False
            return result
        
        # Step 3: Get URL
        current_url = driver.current_url
        logger.info(f"Current URL: {current_url}")
        log_json(json_log_path, f"🔗 Current URL: {current_url}")
        result["url"] = current_url
        
        # Step 4: Get all content from response section
        logger.info("Extracting content from response section")
        log_json(json_log_path, "📄 Extracting content from response section")
        
        try:
            # Wait for response content to load
            time.sleep(random.uniform(2, 4))
            
            # Try multiple selectors based on the provided HTML context
            response_selectors = [
                '.response-content',         # Generic response content
                '[data-testid="response"]', # Test ID based
                '.task-response',           # Task response specific
                '.content-area',            # Generic content area
                '.response-section',        # Response section
                '.answer-content',          # Answer content
                '.result-content',          # Result content
                '.main-content',            # Main content area
                '.task-content',            # Task content
                '.description',             # Description area
                '.details',                 # Details section
                'main',                     # Main HTML element
                '.container .content',      # Container content
                ".flex.flex-col.gap-4",    # From context: main response container
                ".px-4.text-sm.break-words.whitespace-pre-wrap",  # From context: actual text content
                ".message-content",        # Generic message content
                "[data-testid='conversation-turn-content']",  # Test ID selector
                ".text-token-text-primary", # From context: text styling
            ]
            
            response_content = None
            for selector in response_selectors:
                try:
                    logger.info(f"Trying response selector: {selector}")
                    response_element = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    response_content = response_element.text.strip()
                    if response_content:  # Only use if content is not empty
                        logger.info(f"Found response content with selector: {selector}")
                        break
                except TimeoutException:
                    logger.warning(f"Response selector {selector} not found, trying next...")
                    continue
            
            # Fallback: get all text content from body
            if not response_content:
                logger.warning("Could not find response content with any selector, getting page text")
                try:
                    body_element = driver.find_element(By.TAG_NAME, "body")
                    response_content = body_element.text.strip()
                except Exception as e:
                    logger.error(f"Failed to get body text: {e}")
                    response_content = "Could not extract content from page"
            
            logger.info(f"Extracted content length: {len(response_content)} characters")
            log_json(json_log_path, f"📄 Extracted content: {len(response_content)} characters")
            
            result["content"] = response_content
            
        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            log_json(json_log_path, f"❌ Error extracting content: {str(e)}")
            result["error"] = f"Error extracting content: {str(e)}"
            result["success"] = False
            return result
        
        # Success
        result["success"] = True
        logger.info("Task extraction completed successfully")
        log_json(json_log_path, "🎯 Task extraction completed successfully")
        
        return result
        
    except Exception as e:
        logger.error(f"Error during task extraction: {e}")
        log_json(json_log_path, f"❌ Error during task extraction: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "tasks": [],
            "url": None,
            "content": None
        }
        
    finally:
        if driver:
            try:
                driver.quit()
                logger.info("Chrome driver closed successfully")
                log_json(json_log_path, "🔒 Chrome driver closed successfully")
            except Exception as e:
                logger.error(f"Error closing driver: {e}")
                log_json(json_log_path, f"⚠️ Error closing driver: {str(e)}")

if __name__ == "__main__":
    import sys
    try:
        result = extract_tasks_and_content()
        # Output result as JSON to stdout
        print(json.dumps(result, ensure_ascii=False, indent=2))
        # Exit with appropriate code
        if result.get("success", False):
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)