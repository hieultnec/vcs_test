# Projects Implementation

This document outlines the implementation of the projects fetching functionality, moved from the Dashboard page to a reusable component with proper error handling and Swagger API integration.

## Architecture Overview

The projects functionality has been refactored into a modular, reusable architecture:

```
Dashboard (Page)
├── Projects (Component)
│   ├── useProjects (Hook)
│   └── projectService (Service)
│       └── ApiErrorHandler (Utility)
```

## Components

### Dashboard Page (`/src/pages/Dashboard.tsx`)
- **Purpose**: Main dashboard page that displays the projects interface
- **Responsibilities**: 
  - Layout and header management
  - Integration with Projects component
  - Project selection handling

**Key Features:**
- Clean, minimal implementation
- Delegates all project logic to Projects component
- Maintains consistent UI/UX

### Projects Component (`/src/components/Projects.tsx`)
- **Purpose**: Reusable component for displaying and managing projects
- **Responsibilities**:
  - Fetching projects from API
  - Search and filtering functionality
  - Error handling and loading states
  - Project card rendering
  - Navigation to project detail pages

**Key Features:**
- **Search**: Real-time search across project name, description, and owner
- **Filtering**: Status-based filtering (All, Active, Draft, Archived)
- **Status Counts**: Dynamic count display for each status
- **Responsive Design**: Grid layout that adapts to screen size
- **Error Handling**: Comprehensive error states with retry functionality
- **Loading States**: Smooth loading indicators
- **Navigation**: Clicking project cards navigates to `/project/:id`
- **Action Buttons**: Separate buttons for workflow and history views

**Navigation Behavior:**
- **Card Click**: Navigates to project detail page (`/project/:id`)
- **View Tests Button**: Navigates to project workflow (`/project/:id/workflow`)
- **History Button**: Navigates to project versions (`/project/:id/versions`)
- **Event Handling**: Action buttons prevent card click events using `stopPropagation()`

**Props:**
```typescript
interface ProjectsProps {
  onProjectSelect?: (project: Project) => void;
}
```

## Hooks

### useProjects Hook (`/src/hooks/useProjects.ts`)
- **Purpose**: Centralized state management for projects
- **Responsibilities**:
  - Project data fetching
  - Loading and error state management
  - Project operations (delete, refresh)

**Returns:**
```typescript
interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearError: () => void;
}
```

## Services

### projectService (`/src/services/projectService.ts`)
Enhanced with comprehensive error handling and Swagger API integration.

**Key Improvements:**
- **Type Safety**: Proper TypeScript interfaces
- **Error Handling**: Integration with ApiErrorHandler
- **API Response Handling**: Support for multiple response formats
- **Swagger Compliance**: Follows API specification

**Methods:**
- `getProjects()` - Fetch all projects
- `getProject(id)` - Fetch single project
- `createProject(data)` - Create new project
- `updateProject(id, data)` - Update project
- `deleteProject(id)` - Delete project

## Error Handling

### ApiErrorHandler (`/src/utils/apiErrorHandler.ts`)
Comprehensive error handling utility that works with the Swagger API.

**Features:**
- **HTTP Status Code Handling**: Specific handling for 400, 401, 403, 404, 409, 422, 500, 502, 503
- **Network Error Detection**: Handles connection issues
- **Retry Logic**: Identifies retryable errors
- **User-Friendly Messages**: Converts technical errors to user-readable messages

**Error Types:**
```typescript
interface ApiError {
  status: number;
  message: string;
  details?: string;
}
```

**Usage Example:**
```typescript
try {
  const projects = await projectService.getProjects();
} catch (error) {
  const apiError = ApiErrorHandler.handleError(error);
  console.error(ApiErrorHandler.getErrorMessage(apiError));
}
```

## Swagger API Integration

The implementation is fully compatible with the Swagger API specification:

### API Endpoints Used
- `GET /api/projects` - List all projects
- `GET /api/project/get?id={id}` - Get project by ID
- `POST /api/project/create` - Create new project
- `PUT /api/project/update` - Update project
- `DELETE /api/project/delete?id={id}` - Delete project

### Response Format Handling
The service handles both response formats:
1. **Direct Array**: `Project[]`
2. **Wrapped Response**: `{ status: number, message: string, result: Project[] }`

### Error Response Handling
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Project not found
- **500 Server Error**: Internal server error
- **Network Errors**: Connection issues

## UI/UX Features

### Search and Filtering
- **Real-time Search**: Instant filtering as user types
- **Multi-field Search**: Searches across name, description, and owner
- **Status Filtering**: Filter by project status with counts
- **Clear Visual Feedback**: Active filters are highlighted

### Project Cards
- **Rich Information**: Name, description, owner, version, status, last updated
- **Document Count**: Shows number of uploaded documents
- **Status Badges**: Color-coded status indicators
- **Action Buttons**: View tests and history links
- **Hover Effects**: Smooth transitions and visual feedback
- **Click Indicators**: Subtle visual feedback for clickable areas
- **Group Hover**: Title color changes on card hover
- **Event Handling**: Proper event propagation for nested clickable elements

### Loading and Error States
- **Loading Spinner**: Animated loading indicator
- **Error Alerts**: Clear error messages with retry options
- **Empty States**: Helpful messages when no projects exist
- **Results Summary**: Shows filtered vs total project counts

## TypeScript Integration

### Project Interface
```typescript
interface Project {
  id: string;
  project_id: string;
  name: string;
  description: string;
  owner: string;
  status: string;
  version: string;
  created_at: string;
  lastUpdated: string;
  uploaded_documents?: ProjectDocument[];
}
```

### Type Safety
- **Strict Typing**: All components use proper TypeScript interfaces
- **Type Guards**: Safe type checking for API responses
- **Error Types**: Properly typed error handling
- **Component Props**: Fully typed component interfaces

## Performance Optimizations

### Efficient Rendering
- **Memoization**: Prevents unnecessary re-renders
- **Debounced Search**: Optimized search performance
- **Virtual Scrolling**: Ready for large project lists
- **Lazy Loading**: Components load only when needed

### State Management
- **Local State**: Component-level state for UI interactions
- **Custom Hooks**: Reusable state logic
- **Error Boundaries**: Graceful error handling
- **Loading States**: Smooth user experience

## Testing Considerations

### Unit Tests
- **Component Testing**: Test Projects component rendering
- **Hook Testing**: Test useProjects hook behavior
- **Service Testing**: Test API service methods
- **Error Handling**: Test error scenarios

### Integration Tests
- **API Integration**: Test with real API endpoints
- **User Interactions**: Test search, filtering, and navigation
- **Error Scenarios**: Test network errors and API failures

## Future Enhancements

### Planned Features
1. **Pagination**: Handle large project lists
2. **Advanced Filtering**: Date range, owner filtering
3. **Bulk Operations**: Select multiple projects
4. **Project Templates**: Pre-defined project structures
5. **Export Functionality**: Export project data
6. **Real-time Updates**: WebSocket integration for live updates

### Performance Improvements
1. **Caching**: Implement project data caching
2. **Optimistic Updates**: Immediate UI updates
3. **Background Sync**: Sync data in background
4. **Offline Support**: Work with cached data

## Usage Examples

### Basic Usage
```typescript
import Projects from '@/components/Projects';

function Dashboard() {
  return <Projects />;
}
```

### Custom Navigation Handling
```typescript
import Projects from '@/components/Projects';
import { Project } from '@/services/projectService';

function CustomDashboard() {
  const handleProjectSelect = (project: Project) => {
    // Custom logic before navigation
    console.log('Navigating to project:', project.name);
    
    // You can add analytics, logging, or other custom behavior
    analytics.track('project_selected', { projectId: project.id });
  };

  return <Projects onProjectSelect={handleProjectSelect} />;
}
```

### Error Handling
```typescript
try {
  const projects = await projectService.getProjects();
} catch (error) {
  const apiError = ApiErrorHandler.handleError(error);
  if (ApiErrorHandler.isRetryable(apiError)) {
    // Implement retry logic
    setTimeout(() => retry(), ApiErrorHandler.getRetryDelay(1));
  }
}
```

This implementation provides a robust, scalable, and user-friendly projects management system that integrates seamlessly with the Swagger API and follows React best practices. 