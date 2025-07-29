# Testing Guide for ScanSetupModal Integration

This guide explains how to run tests for the ScanSetupModal component and its integration with TestCasesTab.

## Setup

### 1. Install Dependencies

```bash
npm install
```

The following testing dependencies have been added:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for testing
- `@vitest/ui` - Visual test runner interface
- `@vitest/coverage-v8` - Code coverage reports

### 2. Test Configuration

The project is configured with:
- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Global test setup
- Mock implementations for UI components

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test

# Run tests once and exit
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Specific Test Files

```bash
# Run ScanSetupModal component tests
npx vitest src/components/__tests__/ScanSetupModal.test.tsx

# Run TestCasesTab integration tests
npx vitest src/components/project-detail/__tests__/ScanSetupModal.integration.test.tsx

# Run TestScenariosTab integration tests
npx vitest src/components/project-detail/__tests__/TestScenariosTab.integration.test.tsx

# Run all integration tests
npx vitest src/components/project-detail/__tests__/
```

## Test Files Overview

### 1. `ScanSetupModal.test.tsx`
Unit tests for the ScanSetupModal component:
- Modal rendering and visibility
- Template selection
- Repository selection
- Form validation
- Scan initiation
- Loading states
- Form reset functionality

### 2. `ScanSetupModal.integration.test.tsx`
Integration tests between ScanSetupModal and TestCasesTab:
- Modal opening from Run button
- Modal closing
- Scan execution flow
- Test case status updates
- Multiple test case handling

### 3. `TestScenariosTab.integration.test.tsx`
Integration tests between ScanSetupModal and TestScenariosTab:
- Scenario rendering with run buttons
- Modal opening from scenario run button
- Scan initiation and status tracking
- Button disable/enable states
- Multiple scenario handling
- Tooltip text updates based on status

## Test Coverage

The tests cover:

✅ **Component Rendering**
- Modal visibility states
- Template prompt cards
- Repository selector
- Form elements

✅ **User Interactions**
- Template selection
- Repository selection
- Custom prompt input
- Button clicks

✅ **Form Validation**
- Required field validation
- Button enable/disable states
- Form reset on modal close

✅ **Integration Flow**
- Opening modal from TestCasesTab and TestScenariosTab
- Passing data between components
- Status updates after scan
- Service mocking for API calls

✅ **Loading States**
- Scan initiation loading
- Button state changes
- Progress indicators

## Mock Strategy

The tests use comprehensive mocking for:

### UI Components
- `@/components/ui/*` - All shadcn/ui components
- Custom implementations that preserve functionality
- Proper prop forwarding for testing

### Icons
- `lucide-react` icons replaced with simple text/emoji
- Maintains visual testing without complex SVG rendering

### External Dependencies
- Isolated component testing
- Predictable behavior
- Fast test execution

## Usage Example

Here's how to integrate ScanSetupModal with your components:

### TestCasesTab Integration
```tsx
import React, { useState } from 'react';
import ScanSetupModal from './ScanSetupModal';

function TestCasesTab() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  const handleRunTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setIsScanModalOpen(true);
  };

  const handleScanStart = (scanData) => {
    console.log('Starting scan with:', scanData);
    // Implement your scan logic here
    setIsScanModalOpen(false);
  };

  return (
    <div>
      {/* Your test cases UI */}
      <button onClick={() => handleRunTestCase(testCase)}>
        Run
      </button>

      <ScanSetupModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanStart={handleScanStart}
      />
    </div>
  );
}
```

### TestScenariosTab Integration
```tsx
import React, { useState } from 'react';
import ScanSetupModal from '../ScanSetupModal';

function TestScenariosTab({ projectId }) {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioStatuses, setScenarioStatuses] = useState({});

  const handleRunScenario = (scenarioId, scenarioName) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
      setIsScanModalOpen(true);
    }
  };

  const handleScanStart = (scanData) => {
    if (!selectedScenario) return;
    
    // Update status to Running
    setScenarioStatuses(prev => ({
      ...prev,
      [selectedScenario.id]: 'Running'
    }));
    
    setIsScanModalOpen(false);
    
    // Simulate scan execution
    setTimeout(() => {
      setScenarioStatuses(prev => ({
        ...prev,
        [selectedScenario.id]: 'Passed' // or 'Failed'
      }));
    }, 4000);
  };

  return (
    <div>
      {/* Scenario UI with run buttons */}
      <ScanSetupModal
        isOpen={isScanModalOpen}
        onClose={() => {
          setIsScanModalOpen(false);
          setSelectedScenario(null);
        }}
        onScanStart={handleScanStart}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all UI components are properly mocked
   - Check path aliases in `vitest.config.ts`

2. **Test Timeouts**
   - Increase timeout for async operations
   - Use `waitFor` for state changes

3. **Mock Issues**
   - Verify mock implementations match actual component APIs
   - Clear mocks between tests with `vi.clearAllMocks()`

### Debug Tips

```bash
# Run tests with verbose output
npx vitest --reporter=verbose

# Run specific test with debugging
npx vitest --run src/components/__tests__/ScanSetupModal.test.tsx --reporter=verbose

# Open test UI for interactive debugging
npm run test:ui
```

## Next Steps

1. **Add E2E Tests**: Consider adding Playwright or Cypress for full user journey testing
2. **Visual Regression**: Add visual testing for UI consistency
3. **Performance Tests**: Test component rendering performance
4. **Accessibility Tests**: Add a11y testing with @testing-library/jest-dom

## Contributing

When adding new tests:
1. Follow the existing mock patterns
2. Test both happy path and error scenarios
3. Ensure proper cleanup in `beforeEach`/`afterEach`
4. Add meaningful test descriptions
5. Group related tests with `describe` blocks