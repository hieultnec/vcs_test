# FixChain Integration Guide

FixChain đã được tích hợp thành công vào VCS backend như một module độc lập. Module này cung cấp khả năng AI bug detection và RAG (Retrieval-Augmented Generation) system để cải thiện quá trình phát hiện và sửa lỗi.

## 🏗️ Kiến trúc

### Database Structure

FixChain sử dụng 2 MongoDB databases riêng biệt:

1. **SugoiApp** - Database chính cho VCS
   - `bug_reports`: Lưu trữ tất cả thông tin về bugs
   - `execution_sessions`: Lưu trữ thông tin về các phiên thực thi
   - Các collections khác của VCS

2. **FixChainRAG** - Database chuyên dụng cho RAG system
   - `test_reasoning`: Lưu trữ vector embeddings và reasoning data

### Module Structure

```
backend/
├── controllers/
│   └── fixchain.py          # API endpoints
├── services/
│   └── fixchain.py          # Business logic
├── scripts/
│   └── init_fixchain_db.py  # Database initialization
├── swagger/
│   └── swagger.yml          # API documentation (updated)
└── requirements.txt         # Dependencies (updated)
```

## 🚀 Setup và Installation

### 1. Environment Variables

Các biến môi trường đã được thêm vào `.env`:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DATABASE=SugoiApp
FIXCHAIN_RAG_DATABASE=FixChainRAG

# FixChain Configuration
FIXCHAIN_EMBEDDING_MODEL=all-MiniLM-L6-v2
FIXCHAIN_MAX_EMBEDDING_DIMENSION=384
```

### 2. Dependencies

Các dependencies mới đã được thêm vào `requirements.txt`:

```
sentence-transformers==2.2.2
numpy==1.24.3
torch==2.0.1
transformers==4.30.2
scikit-learn==1.3.0
```

### 3. Database Initialization

Chạy script khởi tạo database:

```bash
cd /d:/vcs_test/backend
python scripts/init_fixchain_db.py
```

Script này sẽ:
- Tạo các indexes cần thiết cho hiệu suất tối ưu
- Tạo sample data để test
- Verify setup

### 4. Docker Setup

MongoDB đã được cấu hình trong `docker-compose.yml` để hỗ trợ cả 2 databases.

## 📡 API Endpoints

### Import APIs

#### 1. Import Single Bug
```http
POST /api/fixchain/import/bug
Content-Type: application/json

{
  "bug": {
    "source_file": "src/example.py",
    "bug_type": "logic_error",
    "severity": "medium",
    "line_number": 42,
    "description": "Variable used before assignment",
    "status": "detected"
  }
}
```

#### 2. Import Bugs Batch
```http
POST /api/fixchain/import/bugs/batch
Content-Type: application/json

{
  "bugs": [
    { /* bug object 1 */ },
    { /* bug object 2 */ }
  ],
  "batch_metadata": {
    "source": "static_analysis",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 3. Import Vector Database (Reasoning)
```http
POST /api/fixchain/import/vectordb
Content-Type: application/json

{
  "reasoning": {
    "test_name": "test_variable_initialization",
    "attempt_id": "attempt-001",
    "source_file": "src/example.py",
    "status": "passed",
    "summary": "Successfully detected uninitialized variable",
    "output": "Static analysis found potential NameError..."
  },
  "generate_embedding": true,
  "embedding_config": {
    "text_fields": ["summary", "output"],
    "normalize": true
  }
}
```

#### 4. Import Execution Session
```http
POST /api/fixchain/import/session
Content-Type: application/json

{
  "session": {
    "source_file": "src/example.py",
    "session_number": 1,
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T10:45:00Z",
    "total_duration": 2700,
    "bugs_detected": 3,
    "bugs_fixed": 2,
    "overall_status": "success"
  }
}
```

#### 5. Bulk Import
```http
POST /api/fixchain/import/bulk
Content-Type: application/json

{
  "data": {
    "bugs": [/* array of bugs */],
    "reasoning_entries": [/* array of reasoning */],
    "sessions": [/* array of sessions */]
  },
  "options": {
    "generate_embeddings": true
  },
  "metadata": {
    "import_source": "batch_analysis",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Query APIs

#### 1. Search Similar Bugs
```http
GET /api/fixchain/search/bugs?source_file=src/example.py&bug_type=logic_error&limit=10
```

#### 2. Get Reasoning History
```http
GET /api/fixchain/reasoning/history?source_file=src/example.py&test_name=test_variable_init
```

#### 3. Get Performance Analytics
```http
GET /api/fixchain/analytics/performance?source_file=src/example.py&from_date=2024-01-01T00:00:00Z&to_date=2024-01-31T23:59:59Z
```

## 🔧 Usage Examples

### Python Client Example

```python
import requests
import json

# Base URL
base_url = "http://localhost:5000/api/fixchain"

# Import a bug
bug_data = {
    "bug": {
        "source_file": "src/calculator.py",
        "bug_type": "logic_error",
        "severity": "high",
        "line_number": 25,
        "description": "Division by zero not handled",
        "code_snippet": "result = a / b  # No check for b == 0",
        "status": "detected"
    }
}

response = requests.post(f"{base_url}/import/bug", json=bug_data)
print(f"Bug imported: {response.json()}")

# Import reasoning with auto-embedding
reasoning_data = {
    "reasoning": {
        "test_name": "test_division_by_zero",
        "attempt_id": "attempt-123",
        "source_file": "src/calculator.py",
        "status": "failed",
        "summary": "Division by zero error detected",
        "output": "ZeroDivisionError: division by zero at line 25"
    },
    "generate_embedding": True
}

response = requests.post(f"{base_url}/import/vectordb", json=reasoning_data)
print(f"Reasoning imported: {response.json()}")

# Search for similar bugs
response = requests.get(f"{base_url}/search/bugs", params={
    "source_file": "src/calculator.py",
    "bug_type": "logic_error",
    "limit": 5
})
print(f"Similar bugs: {response.json()}")
```

## 🎯 Key Features

### 1. Automatic Embedding Generation
- Sử dụng sentence-transformers model `all-MiniLM-L6-v2`
- Tự động tạo vector embeddings từ text content
- Hỗ trợ similarity search

### 2. Dual Database Architecture
- **SugoiApp**: Lưu trữ bugs và sessions cho VCS
- **FixChainRAG**: Chuyên dụng cho vector store và RAG
- Tối ưu hóa hiệu suất cho từng use case

### 3. Comprehensive API Coverage
- Single và batch import
- Bulk import cho mixed data
- Query APIs cho analytics và search
- Full CRUD operations

### 4. Performance Optimization
- Database indexes được tối ưu hóa
- Lazy loading cho embedding model
- Efficient vector operations

### 5. Human Feedback Integration
- Hỗ trợ human verification
- Feedback loop cho AI improvement
- Performance metrics tracking

## 🔍 Monitoring và Debugging

### Database Verification

```bash
# Check collections
mongosh mongodb://localhost:27017
use SugoiApp
show collections
db.bug_reports.countDocuments({})

use FixChainRAG
show collections
db.test_reasoning.countDocuments({})
```

### API Testing

```bash
# Health check
curl http://localhost:5000/api/ping

# Test FixChain import
curl -X POST http://localhost:5000/api/fixchain/import/bug \
  -H "Content-Type: application/json" \
  -d '{"bug": {"source_file": "test.py", "bug_type": "syntax_error", "severity": "low", "line_number": 1, "description": "Test bug", "status": "detected"}}'
```

## 📊 Performance Metrics

FixChain tracking các metrics sau:

- **Accuracy Rate**: Tỷ lệ phát hiện bug chính xác
- **False Positive Rate**: Tỷ lệ báo sai
- **Fix Success Rate**: Tỷ lệ sửa lỗi thành công
- **Average Fix Time**: Thời gian trung bình để sửa lỗi
- **Improvement Metrics**: So sánh với các session trước

## 🚨 Troubleshooting

### Common Issues

1. **Embedding Model Loading Error**
   ```
   Solution: Ensure sufficient memory and internet connection for model download
   ```

2. **Database Connection Issues**
   ```
   Solution: Check MongoDB service and environment variables
   ```

3. **Import Validation Errors**
   ```
   Solution: Verify required fields in request payload
   ```

### Logs

Check logs trong Docker container:
```bash
docker-compose logs backend
```

## 🔮 Future Enhancements

1. **Advanced Vector Search**
   - Semantic similarity search
   - Multi-modal embeddings
   - Custom embedding models

2. **AI Model Integration**
   - Multiple AI model support
   - Model performance comparison
   - Custom fine-tuning

3. **Analytics Dashboard**
   - Real-time metrics
   - Trend analysis
   - Performance visualization

4. **Advanced RAG Features**
   - Context-aware retrieval
   - Multi-document reasoning
   - Incremental learning

---

**Note**: FixChain module đã được tích hợp hoàn toàn vào VCS backend và sẵn sàng sử dụng. Tất cả APIs đã được documented trong Swagger UI tại `/docs` endpoint.