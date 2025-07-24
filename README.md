# e2e_auto_test - End-to-End Automated Testing Platform

A comprehensive automated testing platform with document management, test scenario creation, workflow execution, and test case management capabilities.

## 🚀 Quick Start

### Docker Setup
```bash
# Stop existing containers
docker compose down

# Build and start services
docker compose up --build -d
```

### Access the Application
- **Frontend UI**: http://localhost:8080/
- **Backend API**: http://localhost:5000/
- **API Documentation**: http://localhost:5000/api/docs

## 🏗️ Architecture Overview

The platform consists of two main components:

### Backend (`/backend`)
- **Framework**: Flask with Connexion for OpenAPI/Swagger integration
- **Database**: MongoDB with PyMongo
- **Testing Engine**: Selenium WebDriver integration
- **AI Integration**: Dify API for intelligent test generation
- **Documentation**: Auto-generated Swagger/OpenAPI documentation

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: Redux Toolkit + React Query
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation

## 🔧 Backend Features & Functions

### Core Services

#### 1. Project Management (`/controllers/project.py`)
- **Create Project**: `POST /api/project/create`
  - Create new test projects with metadata
  - Support for Dify API key configuration
  - Project ownership and versioning
- **List Projects**: `GET /api/projects`
  - Retrieve all projects with filtering
  - Support for pagination and search
- **Get Project**: `GET /api/project/get?id={id}`
  - Fetch detailed project information
  - Include associated documents, scenarios, and test cases
- **Update Project**: `PUT /api/project/update`
  - Modify project metadata and configuration
- **Delete Project**: `DELETE /api/project/delete?id={id}`
  - Remove projects with cascade deletion

#### 2. Document Management (`/controllers/document.py`)
- **Upload Documents**: `POST /api/document/upload`
  - Multi-file upload support (PDF, DOC, DOCX, XLS, XLSX, TXT)
  - Automatic metadata extraction
  - Current document designation
- **List Documents**: `GET /api/document/list?project_id={id}`
  - Retrieve project documents with metadata
- **Download Documents**: `GET /api/document/download?id={id}`
  - Secure file download with proper headers
- **Delete Documents**: `DELETE /api/document/delete?id={id}`
  - Remove documents with file cleanup
- **Set Current Document**: `PUT /api/document/set_current`
  - Mark document as current for AI processing

#### 3. Scenario Management (`/controllers/scenario.py`)
- **Save Scenarios**: `POST /api/scenario/save`
  - Create test scenarios from manual input
  - Support for multiple scenarios per project
- **Save from Workflow**: `POST /api/scenario/save_from_workflow`
  - Generate scenarios from workflow execution
  - AI-powered scenario creation
- **List Scenarios**: `GET /api/scenario/list?project_id={id}`
  - Retrieve scenarios with test cases
- **Update Scenarios**: `PUT /api/scenario/update`
  - Modify scenario details and test cases

#### 4. Test Case Management (`/controllers/task.py`)
- **Create Test Case**: `POST /api/test_case/create`
  - Manual test case creation with steps
  - Expected results and status tracking
- **Save Test Cases**: `POST /api/test_case/save`
  - Bulk test case creation
- **List Test Cases**: `GET /api/test_case/list?scenario_id={id}`
  - Retrieve test cases by scenario
- **Update Test Case**: `PUT /api/test_case/update`
  - Modify test case details and status
- **Delete Test Case**: `DELETE /api/test_case/delete?id={id}`
  - Remove test cases

#### 5. Test Execution (`/controllers/task.py`)
- **Record Test Run**: `POST /api/test_run/record`
  - Log test execution results
  - Support for attachments and logs
- **List Test Runs**: `GET /api/test_run/list_by_case?test_case_id={id}`
  - Retrieve test execution history
- **Get Latest Run**: `GET /api/test_run/latest?test_case_id={id}`
  - Fetch most recent test execution
- **Update Test Run**: `PUT /api/test_run/update`
  - Modify test run details

#### 6. Workflow Management (`/controllers/workflow.py`)
- **Execute Workflow**: `POST /api/workflow/execute`
  - Run automated test workflows
  - Selenium WebDriver integration
  - Real-time execution monitoring
- **Get Workflow Status**: `GET /api/workflow/status?execution_id={id}`
  - Monitor workflow execution progress
- **List Workflows**: `GET /api/workflow/list?project_id={id}`
  - Retrieve workflow definitions

#### 7. Configuration Management (`/controllers/config.py`)
- **Get Configuration**: `GET /api/config/get?project_id={id}`
  - Retrieve project-specific settings
- **Update Configuration**: `PUT /api/config/update`
  - Modify project configuration
- **Dify Integration**: AI-powered test generation settings

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

## 🎨 Frontend Features & Functions

### Core Pages

#### 1. Dashboard (`/pages/Dashboard.tsx`)
- **Project Overview**: Display all projects with search and filtering
- **Quick Actions**: Create new projects, view recent activity
- **Status Monitoring**: Visual indicators for project status
- **Navigation Hub**: Central access point to all features

#### 2. Project Creation (`/pages/CreateProject.tsx`)
- **Project Setup**: Comprehensive project creation form
- **Dify Integration**: API key configuration for AI features
- **Document Upload**: Initial document upload during creation
- **Validation**: Form validation with error handling

#### 3. Project Detail (`/pages/ProjectDetail.tsx`)
- **Multi-tab Interface**: Organized project management
- **Real-time Updates**: Live data synchronization
- **Document Management**: Integrated document handling
- **Test Management**: Scenario and test case management

#### 4. Version History (`/pages/VersionHistory.tsx`)
- **Change Tracking**: Complete version history
- **Diff Viewing**: Visual comparison of changes
- **Rollback Support**: Version restoration capabilities
- **Timeline View**: Chronological change tracking

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
