import uuid
from utils import run_web_task_by_lines
from utils.logger import logger
from utils import database
import shutil
import os


def remove_all_contents(directory):
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        if os.path.isfile(item_path) or os.path.islink(item_path):
            os.remove(item_path)
            print(f"Removed file: {item_path}")
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path)
            print(f"Removed directory: {item_path}")


def create(request):
    """Create a new task and its directory."""
    logger.info("Creating new task from request")
    task_id = str(uuid.uuid4())
    project_id = request.json["project_id"]

    # Create task directory
    logger.info(f"Creating directory for project {project_id} and task {task_id}")
    os.mkdir(f"projects/{project_id}/{task_id}")

    # Prepare task data - Include task_id to ensure consistency
    data = {
        "project_id": project_id,
        "task_id": task_id,  # Pass the same task_id that was used for directory
        "task_name": request.json["task_name"],
        "context": request.json["context"],
        "url": request.json["url"],
        "output": request.json["output"],
    }

    logger.info(f"Creating task in database with data: {data}")
    result = database.create_task(data)
    logger.info(f"Task created successfully with ID: {task_id}")
    return result


def ex_task(t_task):
    """Execute a task with project_id and task_id."""
    logger.info(f"Executing task: {t_task}")

    try:
        # Get task info from database
        info = database.get_task(t_task["project_id"], t_task["task_id"])
        if not info:
            logger.error("Task not found")
            raise Exception("Task not found")

        logger.info(f"Retrieved task info: {info}")

        # Check if task is already running
        if info.get("status") == "running":
            logger.warning("Task is already running")
            raise Exception("Task is already running")

        # Update task status to running
        database.update_task_status(info["task_id"], "running")

        try:
            # Format task context
            logger.info("=== Context Processing ===")
            logger.info(f"Original context array: {info['context']}")
            logger.info(
                f"First element of context: {info['context'][0] if info['context'] else 'Empty context'}"
            )

            # Format task context - using all elements
            # task = """{}""".format("\n ".join(info['context'][1:]))
            logger.info("Formatted task with all context elements:")
            logger.info("""{}""".format("\n ".join(info["context"][1:])))

            # Execute the web task with retries
            logger.info(f"Running web task for URL: {info['url']}")
            max_retries = 3
            retry_count = 0
            last_error = None
            retry_delay = 5  # Increased delay between retries

            while retry_count < max_retries:
                try:
                    # Clear any existing Chrome processes before retry
                    if retry_count > 0:
                        try:
                            import psutil

                            for proc in psutil.process_iter(["pid", "name"]):
                                if "chrome" in proc.info["name"].lower():
                                    proc.kill()
                            import time

                            time.sleep(retry_delay)  # Wait longer between retries
                        except Exception as e:
                            logger.warning(
                                f"Failed to cleanup Chrome processes: {str(e)}"
                            )

                    remove_all_contents(
                        f'projects/{info["project_id"]}/{info["task_id"]}'
                    )
                    result = run_web_task_by_lines(
                        info["url"],
                        info["task_name"],
                        info["context"],
                        f'projects/{info["project_id"]}/{info["task_id"]}',
                    )
                    # Success - update status and return result
                    database.update_task_status(info["task_id"], "completed")
                    return result
                except Exception as e:
                    retry_count += 1
                    last_error = e
                    logger.warning(
                        f"Task execution attempt {retry_count} failed: {str(e)}"
                    )
                    if retry_count < max_retries:
                        logger.info(
                            f"Waiting {retry_delay} seconds before retry {retry_count + 1}..."
                        )
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff

            # All retries failed
            logger.error(
                f"Task execution failed after {max_retries} attempts: {str(last_error)}"
            )
            database.update_task_status(info["task_id"], "failed")
            raise last_error if last_error else Exception("Task execution failed")

        except Exception as e:
            # Update task status to failed on error
            database.update_task_status(info["task_id"], "failed")
            logger.error(f"Task execution failed: {str(e)}")
            raise e
    except Exception as e:
        logger.error(f"Task setup failed: {str(e)}")
        raise e


def get(t_task):
    logger.info(f"Getting task details: {t_task}")
    result = database.get("task", t_task)
    if result and "task_id" in result:
        result["test_scenarios"] = database.get_test_cases(result["task_id"])
    logger.info(f"Retrieved task: {result}")
    return result


def delete(project_id, task_id):
    return database.delete_task(project_id, task_id)


def get_all(project_id):
    tasks = database.get_project_tasks(project_id)
    # For each task, fetch its test scenarios
    for t in tasks:
        t["test_scenarios"] = database.get_test_cases(t["task_id"])
    return tasks


def update(task_id, data):
    return database.update_task(task_id, data)


def save_test_scenarios(task_id, test_scenarios):
    return database.save_test_scenarios(task_id, test_scenarios)


def get_test_scenarios(task_id):
    return database.get_test_scenarios(task_id)
