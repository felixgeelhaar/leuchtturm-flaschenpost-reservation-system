# Test Infrastructure Documentation

This document provides comprehensive information about the testing infrastructure for the Leuchtturm Flaschenpost Reservation System.

## 📋 Overview

The testing setup includes:

- **Unit Tests**: Component and utility function testing with Vitest + Vue Test Utils
- **Integration Tests**: API endpoint and service integration testing
- **E2E Tests**: Complete user workflow testing with Playwright
- **Comprehensive Coverage**: Targeting >80% code coverage across all critical components

## 🏗️ Test Architecture

```
tests/
├── unit/                    # Unit tests for components and utilities
│   ├── components/          # Vue component tests
│   └── lib/                 # Library and utility tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   └── services/            # Service integration tests
├── e2e/                     # End-to-end tests
│   ├── fixtures/            # E2E test data
│   └── utils/               # E2E test helpers
└── setup.ts                 # Global test setup
```

## 🛠️ Technology Stack

- **Vitest**: Fast unit test runner with native ESM support
- **Vue Test Utils**: Official Vue.js testing utilities
- **Playwright**: Modern E2E testing framework
- **Happy DOM**: Lightweight DOM implementation for testing
- **TypeScript**: Full type safety in tests
- **Zod**: Runtime type validation testing

## 🚀 Quick Start

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test

# Run smoke tests only
npm run test:smoke
```

### Test Development

```bash
# Run tests in UI mode for debugging
npm run test:e2e:ui

# Generate coverage report
npm run test:coverage
```

## 📝 Writing Tests

### Unit Tests

Create unit tests in `tests/unit/` directory:

```typescript
import { describe, it, expect } from "vitest";
import { mountComponent } from "../../helpers/vue-test-utils";
import MyComponent from "@/components/MyComponent.vue";

describe("MyComponent", () => {
  it("should render correctly", () => {
    const wrapper = mountComponent(MyComponent, {
      props: { title: "Test Title" },
    });

    expect(wrapper.text()).toContain("Test Title");
  });
});
```

### Integration Tests

Create integration tests in `tests/integration/` directory:

```typescript
import { describe, it, expect } from "vitest";
import { apiTestUtils } from "../../helpers/api-test-utils";

describe("API Integration", () => {
  it("should handle API requests", async () => {
    const mockApi = apiTestUtils
      .createMockApi()
      .success("GET", "/api/test", { data: "test" });
    mockApi.apply();

    const response = await fetch("/api/test");
    const result = await response.json();

    expect(result.data).toBe("test");
  });
});
```

### E2E Tests

Create E2E tests in `tests/e2e/` directory:

```typescript
import { test, expect } from "@playwright/test";
import { ReservationFormHelpers } from "./utils/test-helpers";

test("should complete reservation flow", async ({ page }) => {
  const form = new ReservationFormHelpers(page);

  await page.goto("/");
  await form.fillCompletePickupForm();
  await form.submitForm();
  await form.expectSuccessMessage();
});
```

## 🧪 Test Utilities

### Vue Test Utils Helpers

Located in `tests/helpers/vue-test-utils.ts`:

- `mountComponent()`: Enhanced component mounting
- `fillFormFields()`: Fill multiple form fields
- `submitForm()`: Submit form with proper event handling
- `expectValidationError()`: Assert validation errors
- `mockFetchResponse()`: Mock API responses

### API Test Utils

Located in `tests/helpers/api-test-utils.ts`:

- `MockApiBuilder`: Fluent API for mocking endpoints
- `ApiCallTracker`: Track and assert API calls
- `requestValidators`: Validate request structures
- `responseValidators`: Validate response formats

### E2E Test Helpers

Located in `tests/e2e/utils/test-helpers.ts`:

- `ReservationFormHelpers`: Form interaction helpers
- `ConsentBannerHelpers`: GDPR consent handling
- `PageHelpers`: General page utilities
- `PerformanceHelpers`: Performance testing utilities

## 📊 Test Data Strategy

### Inline Test Data

Test data is now defined inline within each test file to avoid mock dependencies:

```typescript
// Example from database.test.ts
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  phone: "+49123456789",
  createdAt: "2024-01-01T00:00:00Z",
};

const validFormDataPickup = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  magazineId: "123e4567-e89b-12d3-a456-426614174000",
  quantity: 1,
  deliveryMethod: "pickup",
  pickupLocation: "Berlin Mitte",
  consents: { essential: true },
};
```

### Production-Ready Approach

This approach ensures:

- **No mock dependencies**: Tests are self-contained with inline data
- **Production readiness**: No mock files or demo data in the codebase
- **Test isolation**: Each test defines its own required data
- **Maintainability**: Test data is co-located with tests that use it

## 🎯 Coverage Targets

The project targets >80% test coverage with specific thresholds:

- **Global**: 80% branches, functions, lines, statements
- **Critical Components**: 85% coverage
  - `ReservationForm.vue`
  - `database.ts`
  - `reservations.ts` API

### Coverage Reports

Coverage reports are generated in `coverage/` directory:

- `coverage/index.html`: Interactive HTML report
- `coverage/lcov.info`: LCOV format for CI/CD
- `coverage/junit.xml`: JUnit format for test results

## 🔧 Configuration

### Vitest Configuration

Main config: `vitest.config.ts`
Integration config: `vitest.config.integration.ts`

Key features:

- Vue SFC support
- TypeScript integration
- Path alias resolution
- Happy DOM environment
- Coverage with v8 provider

### Playwright Configuration

Config: `playwright.config.ts`

Features:

- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device simulation
- Screenshot and video capture
- Parallel execution
- Global setup/teardown

### TypeScript Configuration

Tests are included in `tsconfig.json` with:

- Vitest globals
- Playwright types
- Test directory includes

## 🚦 CI/CD Integration

### Test Scripts

Package.json includes optimized test scripts:

```json
{
  "test": "vitest",
  "test:unit": "vitest run --reporter=verbose --coverage",
  "test:integration": "vitest run --config vitest.config.integration.ts",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage",
  "test:smoke": "playwright test --grep='@smoke'"
}
```

### GitHub Actions Ready

Tests are configured for CI/CD with:

- Parallel test execution
- Artifact collection (screenshots, videos)
- Coverage reporting
- Performance monitoring

## 🐛 Debugging Tests

### Unit/Integration Tests

```bash
# Run specific test file
npx vitest tests/unit/components/ReservationForm.test.ts

# Debug with browser dev tools
npx vitest --inspect-brk

# Run tests in UI mode
npx vitest --ui
```

### E2E Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test
npx playwright test reservation-flow.test.ts

# Generate test reports
npx playwright show-report
```

## 🔍 Test Patterns

### Component Testing Pattern

```typescript
describe("Component Name", () => {
  describe("Rendering", () => {
    // Test what gets rendered
  });

  describe("User Interactions", () => {
    // Test user events and responses
  });

  describe("Props and Events", () => {
    // Test component API
  });

  describe("Edge Cases", () => {
    // Test error conditions and boundaries
  });
});
```

### API Testing Pattern

```typescript
describe("API Endpoint", () => {
  describe("Success Cases", () => {
    // Test happy path scenarios
  });

  describe("Validation", () => {
    // Test input validation
  });

  describe("Error Handling", () => {
    // Test error responses
  });

  describe("Security", () => {
    // Test authentication, authorization
  });
});
```

### E2E Testing Pattern

```typescript
test.describe("Feature Name", () => {
  test("happy path @smoke", async ({ page }) => {
    // Test main user journey
  });

  test("error scenarios", async ({ page }) => {
    // Test error handling
  });

  test("edge cases", async ({ page }) => {
    // Test boundary conditions
  });
});
```

## 📈 Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Clear Test Names**: Use descriptive test names that explain the scenario
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Test Data Isolation**: Use fresh test data for each test

### Mocking Strategy

1. **Mock External Dependencies**: Database, APIs, third-party services
2. **Keep Mocks Simple**: Focus on the interface, not implementation
3. **Consistent Mock Data**: Use centralized test fixtures
4. **Reset Mocks**: Clear mocks between tests

### Assertion Patterns

1. **Specific Assertions**: Test exact values when possible
2. **Meaningful Messages**: Use custom error messages for complex assertions
3. **Multiple Assertions**: Group related assertions in single tests
4. **Async Handling**: Properly await async operations

### Performance Considerations

1. **Parallel Execution**: Configure tests to run in parallel
2. **Selective Testing**: Use tags for smoke tests and critical paths
3. **Resource Cleanup**: Clean up resources in test teardown
4. **Efficient Selectors**: Use data-testid attributes for stable selectors

## 🔧 Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing libraries current
2. **Review Coverage**: Monitor coverage trends and gaps
3. **Performance Monitoring**: Track test execution times
4. **Test Data Maintenance**: Keep test fixtures relevant

### Troubleshooting

Common issues and solutions:

1. **Import Errors**: Check path aliases and module resolution
2. **Async Issues**: Ensure proper awaiting of promises
3. **Mock Problems**: Verify mock setup and cleanup
4. **Flaky E2E Tests**: Add proper waits and stable selectors

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Guide](https://vue-test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns and conventions
2. Add appropriate test data to fixtures
3. Update this documentation for new utilities
4. Ensure tests pass in CI/CD environment
5. Maintain or improve coverage percentages

For questions or issues with the testing infrastructure, please create an issue with the `testing` label.
