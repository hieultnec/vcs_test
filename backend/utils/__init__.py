from .flask_app import get_app
from .common import return_status
from .models import MODELS
from .lavague_task import run_web_task, run_web_task_by_lines
from . import database
from .logger import setup_logger

# Initialize the logger
setup_logger()

__all__ = [
    "get_app",
    "return_status",
    "MODELS",
    "run_web_task",
    "run_web_task_by_lines",
    "database",
    "setup_logger"
]