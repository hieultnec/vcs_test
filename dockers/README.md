# Docker & Docker Compose Guide

This guide explains how to build and run both the backend and frontend of this project using Docker and Docker Compose.

---

## 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) (if not included with Docker Desktop)
- (Optional) `.env` file for environment variables

---

## 2. Project Structure

```
/
├── backend/
├── frontend/
├── dockers/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── README.md
├── docker-compose.yml
└── ...
```

---

## 3. Dockerfiles

- **Backend:** `dockers/Dockerfile.backend`
- **Frontend:** `dockers/Dockerfile.frontend`

---

## 4. docker-compose.yml

- Defines services for:
  - `backend` (Flask or FastAPI, etc.)
  - `mongodb`
  - (Optional) `frontend` (commented out by default)

---

## 5. Usage

### 5.1. Build and Run All Services

```sh
docker-compose up --build
```

- This will build the backend image and start backend and MongoDB containers.
- The backend will be available at [http://localhost:5000](http://localhost:5000).

### 5.2. Run in Detached Mode

```sh
docker-compose up -d --build
```

### 5.3. Stopping Services

```sh
docker-compose down
```

---

## 6. Frontend (Vite) Service

- The `frontend` service is commented out in `docker-compose.yml` by default.
- To enable, uncomment the `frontend` section and adjust the `VITE_BACKEND` environment variable as needed.

### Example:

```yaml
frontend:
  build:
    context: .
    dockerfile: dockers/Dockerfile.frontend
  depends_on:
    - mongodb
    - backend
  ports:
    - "5173:5173"
  networks:
    - atc_network
  environment:
    - VITE_BACKEND=http://localhost:5000
```

- Then access the frontend at [http://localhost:5173](http://localhost:5173).

---

## 7. Environment Variables

- Place a `.env` file in the project root for variables used by backend, frontend, or MongoDB.
- Example variables:
  - `VITE_API_BASE_URL=http://localhost:5000`
  - `FLASK_ENV=development`
  - etc.

---

## 8. Useful Commands

- **View logs:**  
  `docker-compose logs -f`
- **Rebuild only backend:**  
  `docker-compose build backend`
- **Rebuild only frontend:**  
  `docker-compose build frontend`

---

## 9. Troubleshooting

- Make sure ports `5000` (backend), `5173` (frontend), and `27017` (MongoDB) are not in use.
- If you change environment variables, rebuild the containers.

---

## 10. References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

--- 