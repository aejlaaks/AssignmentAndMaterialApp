# Markdown with LaTeX and Mermaid Support

This document provides examples of how to use LaTeX and Mermaid diagrams in your course materials.

## LaTeX Examples

You can include mathematical expressions using LaTeX syntax enclosed in dollar signs for inline math or double dollar signs for block math.

### Inline Math

Inline math expressions can be written like this: $E = mc^2$

### Block Math

Block math expressions are centered and displayed on their own line:

$$
\frac{d}{dx}(x^n) = nx^{n-1}
$$

$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

### More Complex Examples

Maxwell's Equations:

$$
\begin{aligned}
\nabla \times \vec{E} &= -\frac{\partial \vec{B}}{\partial t} \\
\nabla \times \vec{B} &= \mu_0 \vec{J} + \mu_0 \varepsilon_0 \frac{\partial \vec{E}}{\partial t} \\
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0
\end{aligned}
$$

Matrix:

$$
\begin{pmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{pmatrix}
$$

## Mermaid Diagram Examples

Mermaid diagrams can be included using the mermaid code block syntax.

### Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Student
    participant System
    Student->>System: Submit Assignment
    System->>System: Validate Submission
    System-->>Student: Confirmation
    Note right of System: Assignment is stored
    System->>Teacher: Notification
```

### Class Diagram

```mermaid
classDiagram
    class Course {
        +String name
        +String description
        +Teacher teacher
        +addStudent()
        +removeStudent()
    }
    class Student {
        +String name
        +String email
        +submitAssignment()
    }
    class Teacher {
        +String name
        +String email
        +gradeAssignment()
    }
    Course "1" -- "many" Student: contains
    Course "many" -- "1" Teacher: taught by
```

### Entity Relationship Diagram

```mermaid
erDiagram
    COURSE ||--o{ ASSIGNMENT : contains
    COURSE ||--o{ STUDENT : enrolls
    STUDENT ||--o{ SUBMISSION : submits
    ASSIGNMENT ||--o{ SUBMISSION : has
```

### Gantt Chart

```mermaid
gantt
    title Course Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Course Design      :a1, 2025-01-01, 30d
    Content Creation   :after a1, 45d
    section Execution
    Course Start       :milestone, 2025-03-01, 0d
    Module 1           :2025-03-01, 14d
    Module 2           :2025-03-15, 14d
    Module 3           :2025-03-29, 14d
    Final Exam         :milestone, 2025-04-15, 0d
```

## Combining LaTeX and Markdown

You can combine LaTeX and regular markdown formatting:

**The quadratic formula** is given by:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

Where:
- $a$, $b$, and $c$ are coefficients in the quadratic equation $ax^2 + bx + c = 0$
- The discriminant $\Delta = b^2 - 4ac$ determines the number of solutions

## Tips for Using LaTeX and Mermaid

1. For LaTeX:
   - Use `$...$` for inline math
   - Use `$$...$$` for block math
   - Escape special characters with a backslash
   - Use `\begin{aligned}...\end{aligned}` for multi-line equations

2. For Mermaid:
   - Use triple backticks followed by "mermaid" to start a diagram
   - End with triple backticks
   - Different diagram types have different syntax
   - Refer to the [Mermaid documentation](https://mermaid.js.org/intro/) for more examples
