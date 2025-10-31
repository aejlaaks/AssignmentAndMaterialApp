# Frontend Documentation

## Architecture and Implementation

The frontend application follows a component-based architecture using React with TypeScript. The application is structured around the following key concepts:

### Component Organization
- Components are organized by feature and function (e.g., `/components/courses/detail/tabs/`)
- Common UI elements are separated into reusable components
- Dialog components are organized in a dedicated dialogs directory

### State Management
- Custom hooks for different domains (e.g., `useCourseStore`, `useCourseDialogs`, `useCourseOperations`)
- Each hook follows the Single Responsibility Principle, handling one aspect of application state
- API calls are abstracted within service modules

### Type Safety
- TypeScript interfaces for all domain objects
- Type mapping functions to handle API response transformations
- Nullable fields are properly handled with fallbacks (e.g., `description || ""`)
- **Unified type definitions in dedicated files (e.g., `CourseTypes.ts`)**
- **Type mapping utilities at API boundaries only**

### UI Components
- Material-UI based component library
- Consistent layout and styling patterns
- Loading states and error handling

## Key Design Decisions

### Custom Hooks Pattern
- **What**: Domain logic is encapsulated in custom hooks like `useCourseStore`
- **Why**: Separates UI from business logic, improves testability and reusability
- **Example**: `useCourseOperations` manages course deletion with cleanup logic

### Type Mapping
- **What**: Explicit mapping between API responses and frontend models
- **Why**: Ensures frontend has consistent data regardless of API structure changes
- **Example**: `courseMappers.toUiModel` in `CourseTypes.ts` handles different field names
- **Benefit**: Only one place to update when API changes, consistent property names throughout the application

### Component Composition
- **What**: Complex screens composed of smaller, focused components
- **Why**: Improves maintainability and enables component reuse
- **Example**: `CourseDetail` delegates to `MaterialsTab`, `TasksTab`, etc.

### Dialog Management
- **What**: Centralized dialog state management in `useCourseDialogs`
- **Why**: Provides consistent dialog behavior across the application
- **Example**: `CourseEditDialog` integrates with this system

## Areas for Improvement

### Global State Management
- Current approach uses multiple hooks for state
- Consider adopting a more structured state management solution (Redux, Zustand, Context API)
- Would improve handling of shared state across components

### API Error Handling
- Error handling is inconsistent across different service calls
- Implement standardized error handling with user-friendly messages
- Consider a global error boundary

### ~~Type Consistency~~ ✓ Improved
- ~~Multiple definitions of the same entity (e.g., Course, Assignment)~~
- ~~Unify type definitions to reduce type mapping overhead~~
- ~~Consider using code generation from API schema~~
- **Unified type system implemented with clear separation between UI and API models**
- **Type mapping utilities handle transformations at API boundaries**
- **Standardized property naming across the application**

### Performance Optimization
- Add pagination for lists of items (materials, assignments)
- Implement caching for frequently accessed data
- Use virtualization for long lists

### Form Handling
- Inconsistent form validation strategies
- Consider adopting a form library like Formik or React Hook Form
- Standardize validation error presentation 