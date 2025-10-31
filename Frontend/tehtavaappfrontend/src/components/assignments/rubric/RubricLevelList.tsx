import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { RubricLevel } from '../../../types/rubric';

interface RubricLevelListProps {
  levels: RubricLevel[];
  criterionIndex: number;
  onAddLevel: () => void;
  onEditLevel: (levelIndex: number) => void;
  onDeleteLevel: (levelIndex: number) => void;
}

const RubricLevelList: React.FC<RubricLevelListProps> = ({
  levels,
  criterionIndex,
  onAddLevel,
  onEditLevel,
  onDeleteLevel
}) => {
  // Sort levels by points in descending order
  const sortedLevels = [...levels].sort((a, b) => b.points - a.points);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Arviointitasot ({levels.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={onAddLevel}
          size="small"
          variant="outlined"
        >
          Lisää taso
        </Button>
      </Box>

      {levels.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
          Ei arviointitasoja. Lisää vähintään yksi taso.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sortedLevels.map((level, levelIndex) => (
            <Grid item xs={12} sm={6} md={4} key={level.id}>
              <Card variant="outlined">
                <CardContent sx={{ position: 'relative', pb: 1 }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tooltip title="Muokkaa tasoa">
                      <IconButton
                        size="small"
                        onClick={() => onEditLevel(levels.indexOf(level))}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Poista taso">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteLevel(levels.indexOf(level))}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ mb: 1, pr: 6 }}>
                    <Typography variant="subtitle2" component="div" gutterBottom>
                      {level.title}
                    </Typography>
                    <Chip 
                      label={`${level.points} p`} 
                      size="small" 
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {level.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RubricLevelList; 