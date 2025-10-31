# TehtavaApp Testing Documentation

This document provides an overview of the testing approach for the TehtavaApp system, with a focus on the grading feature.

## Testing Strategy

The TehtavaApp system employs a comprehensive testing strategy that includes:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components
3. **End-to-End Tests**: Testing complete user workflows

## Backend Testing

### Test Framework

The backend tests use:
- **xUnit**: The testing framework for .NET
- **Moq**: For mocking dependencies
- **Entity Framework Core InMemory**: For database testing

### Test Structure

Backend tests are organized in the `TehtavaApp.Tests` project with the following structure:

- **Controllers/**: Tests for API controllers
- **Services/**: Tests for business logic services

### Grading Feature Tests

The grading feature is tested at multiple levels:

#### Controller Tests

`AssignmentControllerTests.cs` includes tests for the `GradeSubmission` endpoint:

- `GradeSubmission_ValidInput_ReturnsOkResult`: Tests that valid input returns a successful response
- `GradeSubmission_InvalidId_ReturnsBadRequest`: Tests that an invalid submission ID returns a bad request
- `GradeSubmission_SubmissionNotFound_ReturnsNotFound`: Tests that a non-existent submission returns not found
- `GradeSubmission_NullGrade_PassesEmptyString`: Tests that a null grade is handled correctly

#### Service Tests

`AssignmentServiceTests.cs` includes tests for the `GradeSubmissionAsync` method:

- `GradeSubmissionAsync_ValidInput_UpdatesSubmission`: Tests that a valid submission is updated correctly
- `GradeSubmissionAsync_SubmissionNotFound_ReturnsNull`: Tests that a non-existent submission returns null
- `GradeSubmissionAsync_EmptyGrade_SetsNullGrade`: Tests that an empty grade string sets a null grade
- `GradeSubmissionAsync_InvalidGrade_ThrowsException`: Tests that an invalid grade format throws an exception

## Frontend Testing

### Test Framework

The frontend tests use:
- **Jest**: The testing framework
- **React Testing Library**: For testing React components
- **Mock Service Worker**: For mocking API calls

### Test Structure

Frontend tests are organized alongside the components and services they test:

- **components/submissions/__tests__/**: Tests for submission-related components
- **services/__tests__/**: Tests for service modules

### Grading Feature Tests

The grading feature is tested at multiple levels:

#### Component Tests

`EnhancedGrading.test.tsx` includes tests for the `EnhancedGrading` component:

- `renders all tabs correctly`: Tests that all tabs are rendered
- `switches between tabs correctly`: Tests that tab switching works
- `updates grade value correctly`: Tests that grade input updates correctly
- `handles feedback changes from EnhancedFeedback`: Tests feedback handling
- `submits grading with all data`: Tests the submission process
- `handles attachment operations correctly`: Tests attachment handling
- `displays read-only mode correctly`: Tests the read-only mode

#### Service Tests

`submissionService.test.ts` includes tests for the `gradeSubmission` method:

- `should call the API with correct parameters`: Tests that the API is called correctly
- `should handle API errors correctly`: Tests error handling for API errors
- `should handle network errors correctly`: Tests error handling for network errors
- `should handle grading with attachments`: Tests attachment handling
- `should handle grading without a grade value`: Tests handling of submissions without grades

## Running Tests

### Backend Tests

To run the backend tests:

```bash
cd Backend
dotnet test
```

### Frontend Tests

To run the frontend tests:

```bash
cd Frontend/tehtavaappfrontend
npm test
```

To run specific tests:

```bash
npm test -- --testPathPattern=EnhancedGrading
```

## Test Coverage

The tests cover the following aspects of the grading feature:

1. **Input Validation**: Tests that invalid inputs are handled correctly
2. **Business Logic**: Tests that the grading logic works correctly
3. **Error Handling**: Tests that errors are handled gracefully
4. **UI Interaction**: Tests that the UI responds correctly to user actions
5. **API Integration**: Tests that the frontend and backend communicate correctly

## Continuous Integration

Tests are run automatically as part of the CI/CD pipeline to ensure that changes don't break existing functionality.

## Future Improvements

Potential improvements to the testing strategy include:

1. **Increased Coverage**: Adding more tests to cover edge cases
2. **Performance Testing**: Testing the system under load
3. **Accessibility Testing**: Ensuring the UI is accessible to all users
4. **Security Testing**: Testing for common security vulnerabilities 