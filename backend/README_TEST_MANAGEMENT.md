# Test Management System - VCS Backend

## Tổng quan

Hệ thống quản lý test đã được mở rộng với các module mới để quản lý test case và test run theo từng dự án.

## Cấu trúc Module

### 1. Test Case Module (`services/test_case.py`)

Quản lý các test case thuộc về scenario.

**Schema:**
```json
{
  "id": "UUID",
  "project_id": "string",
  "scenario_id": "string", 
  "title": "string",
  "description": "string",
  "steps": ["string"],
  "expected_result": "string",
  "status": "untested|passed|failed",
  "version": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**API Endpoints:**
- `POST /api/test_case/save` - Lưu danh sách test cases
- `GET /api/test_case/list` - Lấy danh sách test cases theo scenario
- `POST /api/test_case/create` - Tạo test case mới
- `PUT /api/test_case/update` - Cập nhật test case
- `DELETE /api/test_case/delete` - Xóa test case
- `GET /api/test_case/get` - Lấy test case theo ID

### 2. Test Run Module (`services/test_run.py`)

Quản lý lịch sử thực thi test.

**Schema:**
```json
{
  "run_id": "UUID",
  "project_id": "string",
  "scenario_id": "string",
  "test_case_id": "string",
  "executed_by": "string",
  "executed_at": "datetime",
  "status": "pass|fail|skipped",
  "logs": "string|array",
  "attachment_url": "string",
  "version": "string"
}
```

**API Endpoints:**
- `POST /api/test_run/record` - Ghi lại test run mới
- `GET /api/test_run/list_by_case` - Lấy test runs theo test case
- `GET /api/test_run/latest` - Lấy test run mới nhất
- `GET /api/test_run/get` - Lấy test run theo ID
- `PUT /api/test_run/update` - Cập nhật test run
- `DELETE /api/test_run/delete` - Xóa test run
- `GET /api/test_run/list_by_scenario` - Lấy test runs theo scenario
- `GET /api/test_run/list_by_project` - Lấy test runs theo project

## Liên kết giữa các Module

### Hierarchy:
```
Project
├── Tasks
│   └── Scenarios
│       └── Test Cases
│           └── Test Runs
└── Documents
```

### Cập nhật trong Project Service:
- Khi gọi `project.get(project_id)`, mỗi task sẽ có:
  - `test_scenarios`: danh sách scenarios với test cases
  - Mỗi scenario có `test_cases`: danh sách test cases

### Cập nhật trong Scenario Service:
- Khi gọi `scenario.get_scenarios(project_id)`, mỗi scenario sẽ có:
  - `test_cases`: danh sách test cases thuộc scenario đó

## Ví dụ sử dụng

### 1. Tạo Test Case
```python
# Tạo test case mới
test_case_data = {
    "title": "Login with valid credentials",
    "description": "Test user login with correct username and password",
    "steps": [
        "Navigate to login page",
        "Enter valid username",
        "Enter valid password", 
        "Click login button"
    ],
    "expected_result": "User should be logged in successfully",
    "status": "untested"
}

# Gọi API
POST /api/test_case/create
{
    "project_id": "project-123",
    "scenario_id": "scenario-456", 
    "test_case_data": test_case_data
}
```

### 2. Ghi lại Test Run
```python
# Ghi lại kết quả test
test_run_data = {
    "project_id": "project-123",
    "scenario_id": "scenario-456",
    "test_case_id": "test-case-789",
    "executed_by": "tester@example.com",
    "status": "pass",
    "logs": "Test executed successfully at 2024-01-15 10:30:00",
    "attachment_url": "https://example.com/screenshots/test-123.png"
}

# Gọi API
POST /api/test_run/record
test_run_data
```

### 3. Lấy Project với đầy đủ thông tin
```python
# Lấy project với tasks, scenarios, test cases
GET /api/project/get?id=project-123

# Response sẽ có cấu trúc:
{
    "project_id": "project-123",
    "name": "E-commerce Platform",
    "tasks": [
        {
            "task_id": "task-456",
            "task_name": "User Authentication",
            "test_scenarios": [
                {
                    "id": "scenario-789",
                    "name": "Login Flow",
                    "test_cases": [
                        {
                            "id": "test-case-123",
                            "title": "Login with valid credentials",
                            "status": "passed"
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Cải thiện Schema

### Versioning Support:
- Tất cả entities (document, scenario, test case, test run) đều có trường `version`
- Sử dụng UUID cho tất cả ID để consistency
- Timestamps: `created_at`, `updated_at` cho tracking

### Database Collections:
- `projects` - Thông tin dự án
- `tasks` - Các task trong dự án  
- `scenarios` - Test scenarios
- `test_cases` - Test cases thuộc scenario
- `test_runs` - Lịch sử thực thi test
- `documents` - Tài liệu dự án

## Logging

Tất cả các hàm đều có logging chi tiết:
- Info logs cho các operation thành công
- Error logs cho các exception
- Debug logs cho các thông tin chi tiết

## Tương thích

- Tương thích với Flask backend hiện tại
- Sử dụng MongoDB như database
- API responses theo format chuẩn của hệ thống
- Error handling consistent với các module khác 