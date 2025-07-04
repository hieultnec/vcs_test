import argparse
import time
from flask import current_app
from lavague.core import WorldModel, ActionEngine
from lavague.core.agents import WebAgent
from lavague.drivers.selenium import SeleniumDriver
from lavague.contexts.gemini import GeminiContext
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options

def run_web_task(url: str, feature: str, task: str, project_path: str):
    """Execute a web task with proper cleanup and error handling."""
    # Log all parameters at start
    current_app.logger.info("=== Starting web task with parameters ===")
    current_app.logger.info(f"URL: {url}")
    current_app.logger.info(f"Feature: {feature}")
    current_app.logger.info(f"Task: {task}")
    current_app.logger.info(f"Project path: {project_path}")
    
    selenium_driver = None
    last_exception = None
    try:
        current_app.logger.info("=== Initialization Phase ===")
        
        # Initialize Context with specific model
        current_app.logger.info("Initializing GeminiContext with model...")
        context = GeminiContext(mm_llm='models/gemini-1.5-flash-latest')
        current_app.logger.info("GeminiContext initialized successfully")
        
        current_app.logger.info("Initializing SeleniumDriver...")
        chrome_options = Options()
        
        # Add Chrome options
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-software-rasterizer')
        chrome_options.add_argument('--disable-infobars')
        chrome_options.add_argument('--disable-notifications')
        chrome_options.add_argument('--disable-popup-blocking')
        chrome_options.add_argument('--disable-default-apps')
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        chrome_options.add_argument('--disable-background-networking')
        chrome_options.add_argument('--disable-background-timer-throttling')
        chrome_options.add_argument('--disable-backgrounding-occluded-windows')
        chrome_options.add_argument('--disable-breakpad')
        chrome_options.add_argument('--disable-client-side-phishing-detection')
        chrome_options.add_argument('--disable-component-extensions-with-background-pages')
        chrome_options.add_argument('--disable-datasaver-prompt')
        chrome_options.add_argument('--disable-domain-reliability')
        chrome_options.add_argument('--disable-features=TranslateUI')
        chrome_options.add_argument('--disable-hang-monitor')
        chrome_options.add_argument('--disable-metrics')
        chrome_options.add_argument('--disable-prompt-on-repost')
        chrome_options.add_argument('--disable-renderer-backgrounding')
        chrome_options.add_argument('--disable-sync')
        chrome_options.add_argument('--disable-translate')
        chrome_options.add_argument('--disable-webgl')
        chrome_options.add_argument('--disable-webgl2')
        chrome_options.add_argument('--enable-automation')
        chrome_options.add_argument('--force-color-profile=srgb')
        chrome_options.add_argument('--force-device-scale-factor=1')
        chrome_options.add_argument('--ignore-certificate-errors')
        chrome_options.add_argument('--log-level=3')
        chrome_options.add_argument('--mute-audio')
        chrome_options.add_argument('--no-first-run')
        chrome_options.add_argument('--password-store=basic')
        chrome_options.add_argument('--use-mock-keychain')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Set experimental options
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        selenium_driver = SeleniumDriver(options=chrome_options)
        current_app.logger.info("SeleniumDriver initialized successfully")

        # Build components from context - THIS IS THE CORRECT WAY
        current_app.logger.info("=== Component Building Phase ===")
        current_app.logger.info("Building WorldModel from context...")
        action_engine = ActionEngine.from_context(context=context, driver=selenium_driver)
        world_model = WorldModel.from_context(context)
        current_app.logger.info("Building ActionEngine from context...")
        # action_engine = ActionEngine(selenium_driver)  # Initialize with driver directly
        current_app.logger.info("All components built successfully")

        # Create WebAgent
        current_app.logger.info("=== WebAgent Creation Phase ===")
        agent = WebAgent(world_model, action_engine, n_steps=0)
        agent.driver.poject_path = project_path
        agent.driver.previously_scanned = True
        current_app.logger.info("WebAgent created successfully")

        # URL Navigation with retry
        current_app.logger.info("=== Navigation Phase ===")
        try:
            current_app.logger.info(f"Attempting to navigate to URL: {url}")
            agent.get(url)  # Use agent.get() instead of directly calling driver
            agent.run(feature)
            agent.n_steps = 10
            current_app.logger.info("Navigation successful on first attempt")
        except WebDriverException as e:
            current_app.logger.warning(f"First navigation attempt failed: {str(e)}")
            current_app.logger.info("Waiting 2 seconds before retry...")
            time.sleep(2)
            current_app.logger.info("Attempting second navigation...")
            agent.get(url)
            agent.run(feature)
            agent.n_steps = 10
            current_app.logger.info("Second navigation attempt succeeded")

        # Task Execution
        current_app.logger.info("=== Task Execution Phase ===")
        result = agent.run(task)  # Use agent.run() instead of parse_action_files
        current_app.logger.info("Task execution completed successfully")

        return "Success"

    except Exception as e:
        last_exception = e
        current_app.logger.error(f"=== Error in web task execution ===")
        current_app.logger.error(f"Error type: {type(e).__name__}")
        current_app.logger.error(f"Error message: {str(e)}", exc_info=True)
        raise

    finally:
        current_app.logger.info("=== Cleanup Phase ===")
        try:
            if selenium_driver:
                current_app.logger.info("Attempting to cleanup SeleniumDriver...")
                if hasattr(selenium_driver, 'driver'):  # Check if driver property exists
                    selenium_driver.driver.quit()  # Call quit() on the underlying webdriver 
                current_app.logger.info("SeleniumDriver cleanup successful")
        except Exception as cleanup_error:
            current_app.logger.error(f"Cleanup failed: {str(cleanup_error)}", exc_info=True)
            if not last_exception:
                raise

def run_web_task_by_lines(url: str, feature: str, tasks: list, project_path: str):
    # Initialize Context
    context = GeminiContext(mm_llm='models/gemini-1.5-flash-latest')
    selenium_driver = SeleniumDriver()

    # Build Action Engine and World Model from Context
    action_engine = ActionEngine.from_context(context=context, driver=selenium_driver)
    world_model = WorldModel.from_context(context)

    agent = WebAgent(world_model, action_engine, n_steps=0)
    agent.driver.poject_path = project_path
    agent.driver.previously_scanned = True
    agent.get(url)
    agent.run(feature)
    agent.n_steps = 1

    result = None
    # Run the task
    for task in tasks:
        result = agent.run(task).__dict__
        result['detail'] = agent.last_thoughts
    result['output'] = agent.run('What status or message is being displayed?').__dict__['output']
    result.pop('code')
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a web task using LaVague")
    parser.add_argument("url", help="URL to navigate to")
    parser.add_argument("feature", help="Feature to execute")
    parser.add_argument("task", help="Task to execute")
    parser.add_argument("project_path", help="Path to the project")
    
    args = parser.parse_args()
    try:
        result = run_web_task(args.url, args.feature, args.task, args.project_path)
        current_app.logger.info(f"Task execution completed with result: {result}")
    except Exception as e:
        current_app.logger.error(f"Task execution failed: {str(e)}", exc_info=True)
        raise
