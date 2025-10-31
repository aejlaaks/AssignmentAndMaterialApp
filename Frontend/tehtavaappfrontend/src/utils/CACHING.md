# Caching Implementation

This document outlines the caching strategy implemented in the application to improve performance by reducing redundant API calls.

## Overview

The application uses client-side caching for:
- Course data
- Material files
- Assignment data
- User-specific data

## Technologies Used

- **LocalForage**: For persistent browser storage
- **Axios Extensions**: For HTTP request caching

## Cache Structure

Cache keys follow these conventions:

| Data Type | Cache Key Pattern | Example |
|-----------|-------------------|---------|
| All Materials | `'all_materials'` | `'all_materials'` |
| Course Materials | `'materials_course_{courseId}'` | `'materials_course_123'` |
| Multiple Courses Materials | `'materials_courses_{sortedCourseIds}'` | `'materials_courses_123_456_789'` |
| All Assignments | `'all_assignments'` | `'all_assignments'` |
| Course Assignments | `'assignments_course_{courseId}'` | `'assignments_course_123'` |
| Multiple Courses Assignments | `'assignments_courses_{sortedCourseIds}'` | `'assignments_courses_123_456_789'` |

## Key Functions

### Storage Utilities

- `getCachedItem<T>(key: string)`: Retrieves an item from cache
- `cacheItem<T>(key: string, data: T)`: Stores an item in cache
- `invalidateCache()`: Clears all cached data
- `invalidateCacheItem(key: string)`: Clears a specific cached item
- `invalidateCourseMaterialsCache(courseId: string)`: Invalidates course-specific material caches
- `invalidateCourseAssignmentsCache(courseId: string)`: Invalidates course-specific assignment caches

### Service Methods with Caching

- `materialService.getAllMaterials(forceRefresh?: boolean)`: Gets all materials with caching
- `materialService.getMaterialsByCourse(courseId: string, forceRefresh?: boolean)`: Gets materials for a specific course
- `materialService.getMaterialsForCourses(courseIds: string[], forceRefresh?: boolean)`: Gets materials for multiple courses

- `assignmentService.getAssignments(forceRefresh?: boolean)`: Gets all assignments with caching
- `assignmentService.getAssignmentsByCourse(courseId: string, forceRefresh?: boolean)`: Gets assignments for a specific course
- `assignmentService.getAssignmentsForCourses(courseIds: string[], forceRefresh?: boolean)`: Gets assignments for multiple courses

## Cache Invalidation

Cache is invalidated in the following scenarios:
1. When a user manually refreshes data (via UI action)
2. When new data is created/updated/deleted
3. After a configurable time period (TTL not yet implemented)

## Usage Example

```typescript
// Get data with caching (uses cache if available)
const materials = await materialService.getAllMaterials();

// Force refresh (bypass cache)
const freshMaterials = await materialService.getAllMaterials(true);

// Invalidate specific cache
await invalidateCacheItem('all_materials');

// Invalidate course-specific caches
await invalidateCourseMaterialsCache('course-123');
```

## Future Improvements

- Add Time-To-Live (TTL) for cached items
- Implement more granular cache invalidation
- Add cache version for easier cache migration
- Consider implementing service worker for offline support 