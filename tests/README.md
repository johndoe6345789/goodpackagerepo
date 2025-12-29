# E2E Tests

This directory contains end-to-end tests using Playwright.

## Setup

Install dependencies:
```bash
cd tests
npm install
npx playwright install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in headed mode (see browser):
```bash
npm run test:headed
```

Run tests with UI mode (interactive):
```bash
npm run test:ui
```

View test report:
```bash
npm run test:report
```

## Test Structure

- `e2e/home.spec.js` - Tests for the home page
- `e2e/auth.spec.js` - Tests for authentication (login, logout, password change)
- `e2e/pages.spec.js` - Tests for browse, publish, and docs pages

## Prerequisites

Before running tests, make sure:
1. The backend server is running on `http://localhost:5000`
2. The frontend dev server is running on `http://localhost:3000` (or let the test config start it automatically)

## CI/CD Integration

The tests are configured to work in CI environments. Set `CI=true` environment variable to enable CI-specific behavior (retries, single worker, etc.).
