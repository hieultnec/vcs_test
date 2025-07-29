import logging
from utils.logger import logger

# Configure logging for ping controller
logger = logging.getLogger('ping_controller')

def ping():
    """Simple health check endpoint."""
    logger.debug("Received ping request")
    return {"status": 200, "message": "pong"}