import React, { useState } from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';

// Simple item type for testing
interface Item {
  id: string;
  content: string;
}

// Group type that can hold items
interface Group {
  id: string;
  name: string;
  items: Item[];
}

// Main DragDropExample component
const DragDropExample: React.FC = () => {
  // Initialize with some test data
  const [groups, setGroups] = useState<Group[]>([
    { id: 'group1', name: 'Group 1', items: [] },
    { id: 'group2', name: 'Group 2', items: [] },
  ]);
  
  const [items, setItems] = useState<Item[]>([
    { id: 'item1', content: 'Item 1' },
    { id: 'item2', content: 'Item 2' },
    { id: 'item3', content: 'Item 3' },
    { id: 'item4', content: 'Item 4' },
  ]);
  
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  // Handle drag start for items
  const handleDragStart = (item: Item) => (e: React.DragEvent) => {
    console.log(`Dragging item: ${item.id}`);
    e.dataTransfer.setData('text/plain', item.id);
    setDraggedItemId(item.id);
  };
  
  // Handle drag end for items
  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  // Handle drag over for groups
  const handleDragOver = (group: Group) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop for groups
  const handleDrop = (group: Group) => (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    
    console.log(`Dropping item ${itemId} into group ${group.id}`);
    
    // Find the item in the items array or in any group
    let draggedItem: Item | undefined;
    let newItems = [...items];
    let newGroups = [...groups];
    
    // Check if the item is in the items array
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      draggedItem = { ...items[itemIndex] };
      newItems = [...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)];
    } else {
      // Check if the item is in any group
      for (const g of newGroups) {
        const groupItemIndex = g.items.findIndex(item => item.id === itemId);
        if (groupItemIndex !== -1) {
          draggedItem = { ...g.items[groupItemIndex] };
          g.items = [...g.items.slice(0, groupItemIndex), ...g.items.slice(groupItemIndex + 1)];
          break;
        }
      }
    }
    
    // If we found the item, add it to the target group
    if (draggedItem) {
      newGroups = newGroups.map(g => {
        if (g.id === group.id) {
          return {
            ...g,
            items: [...g.items, draggedItem!]
          };
        }
        return g;
      });
      
      // Update state
      setItems(newItems);
      setGroups(newGroups);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Native Drag and Drop Example
      </Typography>
      
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 2, 
          mb: 4
        }}
      >
        {groups.map(group => (
          <Paper 
            key={group.id} 
            elevation={2}
            sx={{ 
              p: 2, 
              border: draggedItemId ? '2px dashed #2196f3' : '1px solid #e0e0e0',
              transition: 'all 0.2s ease',
              bgcolor: draggedItemId ? 'rgba(33, 150, 243, 0.05)' : 'white',
              minHeight: '200px'
            }}
            onDragOver={handleDragOver(group)}
            onDrop={handleDrop(group)}
          >
            <Typography variant="h6" gutterBottom>
              {group.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {group.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                Drop items here
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map(item => (
                  <Paper 
                    key={item.id} 
                    elevation={1}
                    draggable
                    onDragStart={handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    sx={{ 
                      p: 1, 
                      cursor: 'grab', 
                      '&:active': { cursor: 'grabbing' },
                      bgcolor: '#f5f5f5'
                    }}
                  >
                    {item.content}
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Available Items
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {items.map(item => (
            <Paper 
              key={item.id} 
              elevation={1}
              draggable
              onDragStart={handleDragStart(item)}
              onDragEnd={handleDragEnd}
              sx={{ 
                p: 2, 
                cursor: 'grab', 
                '&:active': { cursor: 'grabbing' },
                bgcolor: '#f5f5f5'
              }}
            >
              {item.content}
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DragDropExample; 