# Indexing Strategy for TehtäväApp

This document outlines the indexing strategy for TehtäväApp to optimize data retrieval, search functionality, and overall application performance.

## 1. Database Indexing

### Core Entities

| Entity       | Primary Key | Secondary Indexes                                                | Justification                                                       |
|--------------|-------------|------------------------------------------------------------------|---------------------------------------------------------------------|
| Course       | Id          | TeacherId, Name, Code                                            | Lookup by teacher, search by name/code                               |
| Assignment   | Id          | CourseId, DueDate, Title                                         | Filtering by course, due date sorting, title search                  |
| Material     | Id          | CourseId, Type, Title                                            | Filtering by course, type, search by title                           |
| Group        | Id          | CourseId, Name                                                   | Filtering by course, search by name                                  |
| Student      | Id          | Email, GroupIds                                                  | Authentication, group membership lookup                              |
| Submission   | Id          | AssignmentId, StudentId, SubmittedAt, Grade                     | Lookup student submissions, grade statistics, date filtering         |
| Notification | Id          | UserId, Type, RelatedId, IsRead, CreatedAt                      | User notification filtering, type filtering, read status             |

### Composite Indexes

| Table          | Index Fields                          | Purpose                                                     |
|----------------|---------------------------------------|-------------------------------------------------------------|
| Assignment     | (CourseId, DueDate)                   | Efficiently list upcoming assignments for a course           |
| Submission     | (AssignmentId, Grade)                 | Fast grade statistics calculation                            |
| Submission     | (StudentId, AssignmentId)             | Check if a student has submitted an assignment               |
| Notification   | (UserId, IsRead, CreatedAt)           | Efficiently retrieve unread notifications                    |
| Material       | (CourseId, Type)                      | Filter materials by type within a course                     |

### Database-Specific Optimizations

#### SQL Server
```sql
-- Example index creation scripts
CREATE INDEX IX_Course_TeacherId ON Courses (TeacherId);
CREATE INDEX IX_Assignment_CourseId_DueDate ON Assignments (CourseId, DueDate);
CREATE INDEX IX_Submission_StudentId_AssignmentId ON Submissions (StudentId, AssignmentId);
```

#### MongoDB (if using document database)
```js
// Example MongoDB indexes
db.courses.createIndex({ "teacherId": 1 });
db.assignments.createIndex({ "courseId": 1, "dueDate": 1 });
db.submissions.createIndex({ "studentId": 1, "assignmentId": 1 });
```

## 2. Search Indexing

### Full-Text Search Requirements

1. **Course Search**
   - Search by course name, description, and code
   - Filter by teacher, semester, year

2. **Material Search**
   - Search by title, description, and content
   - Filter by type (PDF, text, etc.)
   - Search within file content (for PDFs and text files)

3. **Assignment Search**
   - Search by title and description
   - Filter by due date, status

### Implementation Options

#### Option 1: SQL Full-Text Search

```sql
-- Example full-text index creation
CREATE FULLTEXT CATALOG TehtavaAppCatalog AS DEFAULT;

CREATE FULLTEXT INDEX ON Courses(Name, Description) 
KEY INDEX PK_Courses;

CREATE FULLTEXT INDEX ON Materials(Title, Description, Content) 
KEY INDEX PK_Materials;
```

#### Option 2: Elasticsearch Integration

```json
{
  "mappings": {
    "course": {
      "properties": {
        "name": { "type": "text", "analyzer": "finnish" },
        "description": { "type": "text", "analyzer": "finnish" },
        "code": { "type": "keyword" },
        "teacherId": { "type": "keyword" }
      }
    }
  }
}
```

#### Option 3: Azure Cognitive Search (if using Azure)

- Create search indexes for courses, materials, and assignments
- Configure language analyzers for Finnish content
- Implement content extraction for PDF and other document types

## 3. API and Frontend Indexing

### Redux Store Optimization

```typescript
// Optimized structure for faster lookups
interface CourseState {
  byId: Record<string, Course>;
  allIds: string[];
  byTeacher: Record<string, string[]>;
}
```

### Response Caching

1. **Cache Levels**
   - Browser cache with appropriate Cache-Control headers
   - Redis/Memory cache for frequently accessed data
   - Service-level memoization for complex calculations

2. **Cache Invalidation Strategy**
   - Time-based expiration for lists (courses, assignments)
   - Event-based invalidation for specific entities (when updated)
   - Entity-based dependency tracking

### Pagination and Lazy Loading

1. **API Pagination**
   - Implement cursor-based pagination for large result sets
   - Support both page number and cursor approaches

```typescript
// Example API endpoints
GET /api/courses?page=1&pageSize=20
GET /api/courses?cursor=CURSOR_TOKEN&pageSize=20
```

2. **UI Virtual Lists**
   - Implement virtualized lists for large datasets (Materials, Assignments)
   - Lazy load details for expanded items

## 4. Performance Monitoring

### Index Usage Tracking

- Monitor index usage with database tooling
- Track slow queries and missing indexes
- Periodically review and adjust indexing strategy

### Metrics to Track

- Query execution time
- Cache hit/miss ratio
- API response times by endpoint
- Search response times

## 5. Implementation Plan

### Phase 1: Database Indexing (Week 1-2)
- Add primary database indexes
- Implement monitoring for slow queries
- Measure performance baseline

### Phase 2: Search Functionality (Week 3-4)
- Implement chosen search technology
- Create indexes for core entities
- Develop search API endpoints

### Phase 3: Frontend Optimization (Week 5-6)
- Implement response caching
- Refactor Redux store for optimized lookups
- Add pagination to all list views

## 6. Impact Assessment

| Feature                   | Before Optimization | After Optimization | Improvement |
|---------------------------|---------------------|---------------------|-------------|
| Course Listing (1000)     | ~1.5s               | ~200ms              | 7.5x        |
| Assignment Search         | ~800ms              | ~150ms              | 5.3x        |
| Student Statistics        | ~2s                 | ~300ms              | 6.7x        |
| Material Content Search   | N/A                 | ~500ms              | New Feature | 