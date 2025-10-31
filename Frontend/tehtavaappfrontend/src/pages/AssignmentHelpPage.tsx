import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { PageHeader } from '../components/ui/PageHeader';
import MarkdownEditor from '../components/common/MarkdownEditor';

const examples = {
  markdown: `# Markdown Examples

## Basic Text Formatting

You can make text **bold** or *italic*.

You can also combine them for **_bold and italic_** text.

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Ordered Lists
1. First item
2. Second item
3. Third item

## Links and Images

[Link to Google](https://www.google.com)

![Image description](https://via.placeholder.com/150)

## Code

Inline \`code\` example.

\`\`\`javascript
// Code block example
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

## Blockquotes

> This is a blockquote. It can be used for highlighting important information.

## Tables

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`,

  latex: `# LaTeX Examples

## Inline Math

You can write inline math equations using $...$ syntax:

The Pythagorean theorem states that $a^2 + b^2 = c^2$.

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

## Math Blocks

For more complex equations, use the $$...$$:

$$
\\begin{align}
E &= mc^2\\\\
\\int_{-\\infty}^{\\infty} e^{-x^2} dx &= \\sqrt{\\pi}\\\\
\\frac{\\partial^2 u}{\\partial t^2} &= c^2 \\nabla^2 u
\\end{align}
$$

## Matrices

$$
\\begin{pmatrix}
a & b & c \\\\
d & e & f \\\\
g & h & i
\\end{pmatrix}
$$

## Fractions

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
$$

## Summations and Integrals

$$
\\sum_{i=0}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}
$$

$$
\\int_{a}^{b} f(x) dx = F(b) - F(a)
$$
`,

  mermaid: `# Mermaid Diagram Examples

## Flowchart (Graph TD)

\`\`\`mermaid
graph TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No --> D[Debug]
  D --> B
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
  participant Student
  participant System
  participant Teacher
  
  Student->>System: Submit assignment
  System->>Teacher: Notify new submission
  Teacher->>System: Grade assignment
  System->>Student: Notify grade available
\`\`\`

## Class Diagram

\`\`\`mermaid
classDiagram
  class Course {
    +String name
    +String description
    +Date startDate
    +Date endDate
    +addAssignment()
    +removeAssignment()
  }
  
  class Assignment {
    +String title
    +String description
    +Date dueDate
    +int points
    +submit()
    +grade()
  }
  
  Course "1" -- "many" Assignment : contains
\`\`\`

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
  COURSE ||--o{ ASSIGNMENT : contains
  STUDENT }|--|{ COURSE : enrolls
  STUDENT ||--o{ SUBMISSION : creates
  ASSIGNMENT ||--o{ SUBMISSION : receives
  TEACHER ||--|| COURSE : teaches
\`\`\`

## Gantt Chart

\`\`\`mermaid
gantt
  title Assignment Timeline
  dateFormat  YYYY-MM-DD
  
  section Planning
  Create assignment description: a1, 2023-01-01, 3d
  Prepare materials: a2, after a1, 2d
  
  section Implementation
  Publish assignment: m1, 2023-01-06, 1d
  Student work period: a3, after m1, 14d
  
  section Assessment
  Grading period: a4, after a3, 7d
  Feedback: a5, after a4, 3d
\`\`\`
`,

  graphviz: `# Graphviz Diagram Examples

## Basic Directed Graph

\`\`\`dot
digraph G {
  // Nodes
  A [label="Start", shape=box];
  B [label="Process", shape=box];
  C [label="Decision", shape=diamond];
  D [label="End", shape=box];

  // Edges
  A -> B;
  B -> C;
  C -> D [label="Yes"];
  C -> B [label="No"];
}
\`\`\`

## Node Styling

\`\`\`dot
digraph G {
  // Node styling
  node [fontname="Arial", fontsize=12];
  
  // Different node shapes and colors
  A [label="User", shape=circle, style=filled, fillcolor=lightblue];
  B [label="Application", shape=box, style=filled, fillcolor=lightgreen];
  C [label="Database", shape=cylinder, style=filled, fillcolor=lightyellow];
  D [label="API", shape=rectangle, style=filled, fillcolor=lightpink];
  
  // Connections
  A -> B;
  B -> C;
  B -> D;
  D -> C;
}
\`\`\`

## Physics Example: Ohm's Law

\`\`\`dot
digraph G {
    rankdir=LR;
    V [label="V = 10 V"];
    I [label="I = 2 A"];
    R [label="R = 5 Ω"];
    I -> R -> V;
}
\`\`\`

In Ohm's law: $V = I \\cdot R$, when current $I = 2 \\, \\text{A}$ and resistance $R = 5 \\, \\Omega$, we calculate:

$$
V = I \\cdot R = 2 \\, \\text{A} \\cdot 5 \\, \\Omega = 10 \\, \\text{V}
$$

## Subgraphs and Clusters

\`\`\`dot
digraph G {
  // Configure graph
  rankdir=LR;  // Left to right direction
  
  // Define clusters (subgraphs)
  subgraph cluster_0 {
    label="Frontend";
    style=filled;
    color=lightgrey;
    
    A [label="User Interface", shape=box];
    B [label="Components", shape=box];
    C [label="Services", shape=box];
    
    A -> B -> C;
  }
  
  subgraph cluster_1 {
    label="Backend";
    style=filled;
    color=lightblue;
    
    D [label="API", shape=box];
    E [label="Business Logic", shape=box];
    F [label="Data Access", shape=box];
    
    D -> E -> F;
  }
  
  // Connect clusters
  C -> D;
  
  // Add external node
  G [label="Database", shape=cylinder];
  F -> G;
}
\`\`\`

## Educational Example

\`\`\`dot
digraph G {
  // Graph settings
  rankdir=TB;  // Top to bottom direction
  node [shape=box, style=filled, fontname="Arial"];
  
  // Define nodes
  concept [label="Concept", fillcolor=lightblue];
  
  // Define sub-concepts (first level)
  definition [label="Definition", fillcolor=lightgreen];
  examples [label="Examples", fillcolor=lightgreen];
  application [label="Application", fillcolor=lightgreen];
  
  // Define details (second level)
  theory [label="Theoretical\\nFoundation", fillcolor=lightyellow];
  simple_ex [label="Simple\\nExamples", fillcolor=lightyellow];
  complex_ex [label="Complex\\nExamples", fillcolor=lightyellow];
  practice [label="Practice\\nProblems", fillcolor=lightyellow];
  real_world [label="Real-world\\nUses", fillcolor=lightyellow];
  
  // Connect nodes in hierarchy
  concept -> {definition, examples, application};
  definition -> theory;
  examples -> {simple_ex, complex_ex};
  application -> {practice, real_world};
  
  // Add edge styles
  edge [color="gray"];
}
\`\`\`
`
};

const AssignmentHelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [markdownValue, setMarkdownValue] = useState(examples.markdown);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) setMarkdownValue(examples.markdown);
    if (newValue === 1) setMarkdownValue(examples.latex);
    if (newValue === 2) setMarkdownValue(examples.mermaid);
    if (newValue === 3) setMarkdownValue(examples.graphviz);
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Tehtävämuotoilun ohje"
        showBackButton={true}
      />
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Monipuolinen tekstimuotoilu tehtävissä
        </Typography>
        <Typography paragraph>
          Tehtäväapp tukee monipuolista tekstimuotoilua tehtävissä käyttäen Markdownia, LaTeXia matemaattisille kaavoille, Mermaidiä kaavioille ja Graphviziä suunnatuille graafeille.
          This guide shows you how to use these features to create engaging and informative assignments.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Markdown" />
            <Tab label="LaTeX Math" />
            <Tab label="Mermaid Diagrams" />
            <Tab label="Graphviz Diagrams" />
          </Tabs>
        </Box>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Example Code
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box 
                  component="pre" 
                  sx={{ 
                    overflowX: 'auto', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1
                  }}
                >
                  {markdownValue}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <MarkdownEditor
                  value={markdownValue}
                  onChange={setMarkdownValue}
                  minHeight={600}
                  label="Editor"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AssignmentHelpPage; 