# Codex Service

This is a standalone Codex service that runs outside of the Docker container to handle browser automation tasks.

## Files

- `codex_api.py` - Flask API server that runs on port 5137
- `codex_executor.py` - Selenium automation script for Codex interactions
- `requirements.txt` - Python dependencies
- `logs/` - Directory for log files

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the API server:
```bash
python codex_api.py
```

The API will be available at `http://localhost:5137`

## API Endpoints

- `GET /health` - Health check
- `GET /repositories` - Get list of repositories
- `POST /submit_prompt` - Submit a prompt to Codex
- `GET /tasks/<task_id>` - Get task status
- `POST /run_codex` - Run Codex automation

## Usage

The backend Docker container can call this API to execute Codex automation tasks on the host machine, avoiding issues with Windows paths and Chrome browser access from within the container.