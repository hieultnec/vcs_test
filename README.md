# VCS Test - E2E Auto Test Platform

A comprehensive end-to-end automated testing platform that combines AI-powered test generation, execution, and management capabilities with advanced bug tracking and project management features.

## Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd vcs_test

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:8081
# Backend API: http://localhost:8080
# MongoDB: localhost:27017
```

## Development Setup

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Codex Service Setup
```bash
cd codex_service
pip install -r requirements.txt
python codex_service.py
```

## Architecture Overview

### Backend (Flask + MongoDB + Selenium + AI Integration)
- **Flask**: RESTful API server with comprehensive endpoints
- **MongoDB**: Document database for storing projects, test cases, bugs, and results
- **Selenium**: Web automation framework for test execution
- **AI Integration**: Intelligent test case generation and analysis
- **Bug Tracking**: Advanced bug management with fix history
- **File Management**: Image upload and storage capabilities

### Frontend (React + TypeScript + Modern UI)
- **React 18**: Modern UI framework with hooks and TypeScript
- **Vite**: Fast build tool and development server
- **Radix UI**: Accessible component library with shadcn/ui
- **Redux Toolkit**: State management with RTK Query
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form validation with Zod schema

### Codex Service (AI-Powered Test Generation)
- **AI Integration**: Automated test case generation
- **Task Extraction**: Intelligent requirement analysis
- **Test Execution**: Automated test running capabilities

## Backend Features & Functionality

### Core Services
1. **Project Management**
   - Create, update, delete projects
   - Project configuration and settings
   - Project-based access control
   - Project statistics and analytics

2. **Document Management**
   - Upload and store project documents
   - Document parsing and analysis
   - Version control for documents
   - Document-based test generation

3. **Scenario Management**
   - Create test scenarios from documents
   - Scenario categorization and tagging
   - Scenario execution tracking
   - AI-powered scenario generation

4. **Test Case Management**
   - Generate test cases from scenarios
   - Manual test case creation and editing
   - Test case validation and review
   - Batch test case operations

5. **Bug Tracking System**
   - Create bugs from test failures or manual input
   - Bug severity and status management
   - Bug fix history with image support
   - Batch bug creation and management
   - Bug verification workflow

6. **Test Execution**
   - Automated test execution with Selenium
   - Real-time execution monitoring
   - Result capture and analysis
   - Failure screenshot capture

7. **Workflow Management**
   - Define custom testing workflows
   - Workflow automation and scheduling
   - Integration with CI/CD pipelines

8. **File Management**
   - Image upload and storage
   - Base64 image handling
   - File validation and security

9. **Configuration Management**
   - Environment configuration
   - Test data management
   - Browser and device settings

### AI Integration Services

#### Dify Service (`/services/dify_service.py`)
- **Document Processing**: AI-powered document analysis
- **Test Generation**: Automatic test case creation from documents
- **Scenario Creation**: Intelligent scenario generation
- **API Key Management**: Secure Dify API key handling

### Database Schema

#### Collections Structure
```json
{
  "projects": {
    "id": "UUID",
    "name": "string",
    "description": "string",
    "owner": "string",
    "status": "string",
    "version": "string",
    "created_at": "datetime",
    "lastUpdated": "datetime"
  },
  "documents": {
    "document_id": "UUID",
    "project_id": "string",
    "filename": "string",
    "filepath": "string",
    "is_current": "boolean",
    "uploaded_at": "datetime",
    "metadata": "object"
  },
  "scenarios": {
    "id": "UUID",
    "project_id": "string",
    "name": "string",
    "description": "string",
    "test_cases": "array",
    "version": "string",
    "created_at": "datetime"
  },
  "test_cases": {
    "id": "UUID",
    "project_id": "string",
    "scenario_id": "string",
    "title": "string",
    "description": "string",
    "steps": "array",
    "expected_result": "string",
    "status": "string",
    "version": "string"
  },
  "test_runs": {
    "run_id": "UUID",
    "project_id": "string",
    "test_case_id": "string",
    "executed_by": "string",
    "executed_at": "datetime",
    "status": "string",
    "logs": "string",
    "attachment_url": "string"
  }
}
```

## Frontend Features & Functionality

### Main Pages & Components
1. **Dashboard**
   - Project overview and statistics
   - Recent activity feed
   - Quick access to common actions
   - System health monitoring

2. **Project Detail**
   - Project information and settings
   - Document management interface
   - Scenario and test case views
   - Bug tracking and management
   - Execution history and reports

3. **Document Management**
   - File upload with drag-and-drop
   - Document preview and editing
   - Document categorization
   - Search and filtering
   - AI-powered document analysis

4. **Scenario Management**
   - Scenario creation and editing
   - Visual scenario builder
   - Scenario execution controls
   - Results visualization
   - AI-generated scenarios

5. **Test Case Management**
   - Test case editor with syntax highlighting
   - Test case organization and grouping
   - Bulk operations on test cases
   - Test case execution tracking
   - Automated test generation

6. **Bug Tracking System**
   - Comprehensive bug management interface
   - Bug creation from test failures
   - Bug severity and status filtering
   - Fix history with image support
   - Batch bug import functionality
   - Image modal viewer for bug screenshots
   - Bug verification workflow

7. **Test Execution**
   - Real-time execution dashboard
   - Live logs and screenshots
   - Execution queue management
   - Result analysis tools
   - Automatic bug creation on failures

8. **Workflow Management**
   - Visual workflow designer
   - Workflow templates
   - Scheduling and automation
   - Integration settings

9. **Report & Analytics**
   - Test execution reports
   - Bug tracking analytics
   - Performance metrics
   - Trend analysis
   - Export capabilities

10. **User Management**
    - User roles and permissions
    - Team collaboration features
    - Activity logging
    - Profile management

11. **Settings**
    - System configuration
    - Integration settings
    - Notification preferences
    - Theme and appearance

### Core Components

#### 1. Projects Component (`/components/Projects.tsx`)
- **Project Grid**: Responsive project card layout
- **Search & Filter**: Real-time search and status filtering
- **Status Counts**: Dynamic status statistics
- **Action Buttons**: Quick access to project features
- **Error Handling**: Comprehensive error states

#### 2. Document Management (`/components/DocumentManager.tsx`)
- **Multi-file Upload**: Drag-and-drop file upload
- **File Preview**: In-browser document viewing
- **Document Actions**: Set current, download, delete
- **Metadata Display**: File information and upload details
- **Progress Tracking**: Upload progress indicators

#### 3. Document Viewer (`/components/DocumentViewer.tsx`)
- **PDF Preview**: Native PDF viewing
- **Text Display**: Syntax-highlighted text files
- **Download Support**: Direct file download
- **Modal Interface**: Clean preview experience

#### 4. Project Detail Components (`/components/project-detail/`)

##### Configuration Tab (`ConfigurationTab.tsx`)
- **Project Settings**: Edit project metadata
- **Dify Configuration**: AI service settings
- **Environment Setup**: Test environment configuration

##### Test Scenarios Tab (`TestScenariosTab.tsx`)
- **Scenario Management**: Create, edit, delete scenarios
- **Test Case Integration**: Manage test cases within scenarios
- **Bulk Operations**: Multi-select scenario actions

##### Test Cases Tab (`TestCasesTab.tsx`)
- **Test Case Creation**: Step-by-step test case builder
- **Status Management**: Track test case status
- **Execution History**: View test run results

##### Execution Tab (`ExecutionTab.tsx`)
- **Test Execution**: Run individual or bulk tests
- **Real-time Monitoring**: Live execution status
- **Result Logging**: Capture test results and logs

##### Workflow Tab (`WorkflowTab.tsx`)
- **Workflow Definition**: Create automated test workflows
- **Execution Control**: Start, stop, monitor workflows
- **Result Analysis**: Workflow execution reports

##### Test Data Tab (`TestDataTab.tsx`)
- **Data Management**: Test data creation and management
- **Dynamic Inputs**: Variable test data handling
- **Data Validation**: Input validation and formatting

### State Management

#### Redux Store (`/store/`)
- **Project Slice**: Project state management
- **Scenario Slice**: Test scenario state
- **Execution Slice**: Test execution state
- **Global State**: Application-wide state management

#### React Query Integration
- **API Caching**: Intelligent data caching
- **Background Updates**: Automatic data synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Centralized error management

### Services Layer

#### API Services (`/services/`)
- **Project Service**: Project CRUD operations
- **Document Service**: Document management
- **Scenario Service**: Test scenario operations
- **Test Service**: Test case and execution management

#### Error Handling (`/utils/apiErrorHandler.ts`)
- **HTTP Status Handling**: Comprehensive error mapping
- **User-Friendly Messages**: Convert technical errors
- **Retry Logic**: Automatic retry for transient errors
- **Network Error Detection**: Connection issue handling

### UI/UX Features

#### Design System
- **Radix UI Components**: Accessible, customizable components
- **Tailwind CSS**: Utility-first styling
- **Dark/Light Mode**: Theme switching support
- **Responsive Design**: Mobile-first approach

#### User Experience
- **Loading States**: Smooth loading indicators
- **Error Feedback**: Clear error messages
- **Success Notifications**: Toast notifications
- **Form Validation**: Real-time validation feedback

#### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG compliant color schemes

## 🔄 Data Flow

### Backend Data Flow
1. **API Request** → **Controller** → **Service** → **Database**
2. **Document Upload** → **File Storage** → **Metadata Extraction** → **AI Processing**
3. **Test Execution** → **Selenium WebDriver** → **Result Logging** → **Status Update**

### Frontend Data Flow
1. **User Action** → **Component** → **Service** → **API Call**
2. **API Response** → **Redux Store** → **Component Update** → **UI Render**
3. **Real-time Updates** → **React Query** → **Background Sync** → **State Update**

## 🛠️ Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
- `SWAGGER_PATH`: Path to Swagger specification
- `MONGODB_URI`: MongoDB connection string
- `DIFY_API_KEY`: Dify AI service API key

## 📚 API Documentation

The backend provides comprehensive API documentation through Swagger/OpenAPI:
- **Interactive Docs**: http://localhost:5000/api/docs
- **OpenAPI Spec**: http://localhost:5000/api/swagger.json
- **Health Check**: http://localhost:5000/api/ping

## 🔒 Security Features

- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Comprehensive input sanitization
- **File Type Validation**: Secure file upload restrictions
- **API Key Management**: Secure credential handling
- **Error Sanitization**: Safe error message handling

## 🚀 Deployment

### Docker Deployment
```bash
# Production build
docker compose -f docker-compose.prod.yml up --build -d

# Development build
docker compose up --build -d
```

### Environment Configuration
- **Development**: Local development setup
- **Production**: Optimized production configuration
- **Testing**: Isolated testing environment

## 📊 Monitoring & Logging

- **Application Logs**: Comprehensive logging throughout
- **Error Tracking**: Detailed error logging and reporting
- **Performance Monitoring**: Execution time tracking
- **User Activity**: User action logging

## 🔮 Future Enhancements

### Planned Features
- **Advanced AI Integration**: Enhanced AI-powered test generation
- **Test Automation**: More sophisticated automation capabilities
- **Reporting Dashboard**: Advanced analytics and reporting
- **Team Collaboration**: Multi-user support and permissions
- **Integration APIs**: Third-party tool integrations
- **Mobile Support**: Mobile-responsive testing interface

### Technical Improvements
- **Microservices Architecture**: Service decomposition
- **Real-time Communication**: WebSocket integration
- **Advanced Caching**: Redis integration
- **Performance Optimization**: Database query optimization
- **Security Enhancements**: Advanced authentication and authorization
