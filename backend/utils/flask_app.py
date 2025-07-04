import json
import importlib
import time
from flask import Flask, Response, request, jsonify
from flask.json.provider import JSONProvider
from flask_cors import CORS
from typing import Any, Callable
from bson import ObjectId
from datetime import datetime
from .logger import logger

class CustomJSONProvider(JSONProvider):
    def dumps(self, obj: Any, **kwargs: Any) -> str:
        kwargs.setdefault('ensure_ascii', False)
        # Convert MongoDB cursor or list to list
        if hasattr(obj, 'result') and isinstance(obj['result'], (list, tuple)):
            obj['result'] = list(obj['result'])
        # Ensure consistent field names
        if isinstance(obj, dict) and 'name' in obj:
            obj['project_name'] = obj.pop('name')
        return json.dumps(obj, **kwargs, default=self.default)
    
    def loads(self, s: str | bytes, **kwargs: Any) -> Any:
        return json.loads(s, **kwargs)
    
    def default(self, obj: Any) -> Any:
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return super().default(obj)

class FlaskApp(Flask):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.json = CustomJSONProvider(self)
        self.before_request(self._log_request)
        self.after_request(self._log_response)
        # Configure CORS
        CORS(self, resources={
            r"/api/*": {
                "origins": ["http://localhost:5173", "http://localhost:8080"],  # Frontend URL
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True
            }
        })
    
    def _log_request(self):
        """Log incoming request details."""
        request.start_time = time.time()
        logger.info("Request started: %s %s", request.method, request.path)
        if request.method in ['POST', 'PUT']:
            logger.debug("Request data: %s", request.get_json())
        if request.args:
            logger.debug("Request args: %s", dict(request.args))
            
    def _log_response(self, response):
        """Log response data."""
        try:
            # Check if response is a file response
            if hasattr(response, 'direct_passthrough') and response.direct_passthrough:
                logger.info("Response is a file (binary data)")
                return
                
            # For non-file responses, log the data
            logger.warning("Response data: %s", response.get_data(as_text=True))
        except Exception as e:
            logger.error("Error logging response: %s", str(e))

    def process_response(self, response):
        """Process the response and log it."""
        # Add CORS headers to all responses
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        self._log_response(response)
        return response
        
    def register(self, json_file: str) -> None:
        """Register routes from a JSON configuration file."""
        with open(json_file, 'r') as file:
            conf = json.load(file)
            
        for prefix in conf['prefixes']:
            prefix_path = prefix['prefix']
            for route in prefix['routes']:
                # Import the controller module
                controller_module = importlib.import_module(f'controllers.{route["controller"]}')
                # Get the function from the module
                handler: Callable[..., Any] = getattr(controller_module, route['function'])
                # Register the route
                self.add_url_rule(
                    f'{prefix_path}/{route["api_name"]}',
                    f'{route["controller"]}_{route["function"]}',
                    handler,
                    methods=route['methods']
                )

def get_app(name: str) -> FlaskApp:
    """Create and configure a Flask application instance."""
    app = FlaskApp(name)
    return app
