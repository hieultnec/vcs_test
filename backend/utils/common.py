from bson import ObjectId
from datetime import datetime
from typing import Any, Optional

def serialize_value(value: Any) -> Any:
    """Serialize MongoDB BSON types to JSON-compatible format."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [serialize_value(v) for v in value]
    return value

def return_status(status: int = 0, message: str = '', result: Optional[Any] = None) -> dict:
    """Return a standardized response format with JSON-serializable data."""
    return {
        "status_code": "Success" if status == 200 else "Error",
        "status": status,  # Keep numeric status for detailed error handling
        "message": message,
        "result": serialize_value(result)
    }