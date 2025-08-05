#!/usr/bin/env python3
"""Startup script for VCS backend with proper PYTHONPATH configuration."""

import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Set environment variables
os.environ.setdefault('PYTHONPATH', str(backend_dir))
os.environ.setdefault('SWAGGER_PATH', 'swagger/swagger.yml')
os.environ.setdefault('FLASK_APP', 'app.py')
os.environ.setdefault('FLASK_ENV', 'development')

if __name__ == '__main__':
    # Import and run the app after setting up the path
    from app import app
    app.run(host="0.0.0.0", port=5000, debug=False)