import logging
from utils.logger import logger

# Configure logging for ping controller
logger = logging.getLogger('ping_controller')

def ping():
    """Simple health check endpoint."""
    logger.debug("Received ping request")
    return {"status": 200, "message": "pong"}

def health():
    """FixChain service health check endpoint."""
    logger.debug("Received health check request")
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "rag_store_connected": True
    }