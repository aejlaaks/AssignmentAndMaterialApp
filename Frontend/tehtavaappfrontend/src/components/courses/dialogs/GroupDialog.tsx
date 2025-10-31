import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  CircularProgress,
  Typography
} from '@mui/material';
import { SchoolGroup } from '../../../types';
import { groupService } from '../../../services/courses/groupService';
import GroupForm from '../../forms/GroupForm';

interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreateGroup: (data: any) => void;
  onAddExistingGroups: (groupIds: string[]) => void;
}

const GroupDialog: React.FC<GroupDialogProps> = ({
  open,
  onClose,
  courseId,
  onCreateGroup,
  onAddExistingGroups
}) => {
  const [tabValue, setTabValue] = useState<'create' | 'existing'>('create');
  const [availableGroups, setAvailableGroups] = useState<SchoolGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tabValue === 'existing' && open) {
      fetchAvailableGroups();
    }
  }, [tabValue, open]);

  const fetchAvailableGroups = async () => {
    try {
      setLoading(true);
      console.log('Fetching available groups that are not already in the course...');
      // Get all groups
      const allGroups = await groupService.getGroups();
      console.log(`Fetched ${allGroups.length} total groups`);
      
      // Get groups already in this course
      const courseGroups = await groupService.getGroupsByCourse(courseId);
      console.log(`Course ${courseId} already has ${courseGroups.length} groups`);
      
      // Filter out groups that are already in this course
      const courseGroupIds = courseGroups.map(g => g.id);
      const filteredGroups = allGroups.filter(g => !courseGroupIds.includes(g.id));
      
      console.log(`Found ${filteredGroups.length} groups available to add to this course`);
      setAvailableGroups(filteredGroups);
    } catch (error) {
      console.error('Error fetching available groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'create' | 'existing') => {
    setTabValue(newValue);
  };

  const handleAddExisting = () => {
    onAddExistingGroups(selectedGroupIds);
    setSelectedGroupIds([]);
  };

  const handleClose = () => {
    setSelectedGroupIds([]);
    onClose();
  };

  const handleGroupCreated = (data: any) => {
    // Pass the data to the parent component to handle group creation
    onCreateGroup(data);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Lisää ryhmä kurssille</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab value="create" label="Luo uusi" />
          <Tab value="existing" label="Käytä olemassa olevaa" />
        </Tabs>

        {tabValue === 'create' && (
          <GroupForm
            courseId={courseId}
            onSuccess={handleGroupCreated}
            onCancel={handleClose}
          />
        )}

        {tabValue === 'existing' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Valitse olemassa olevat ryhmät lisättäväksi tälle kurssille
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Huomaa: Opettajana voit nyt lisätä kurssiisi minkä tahansa ryhmän ja myös lisätä opiskelijoita ryhmiin.
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {availableGroups.length === 0 ? (
                  <Typography color="text.secondary">
                    Ei saatavilla olevia ryhmiä, jotka eivät ole jo tällä kurssilla.
                  </Typography>
                ) : (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="group-select-label">Ryhmät</InputLabel>
                    <Select
                      labelId="group-select-label"
                      multiple
                      value={selectedGroupIds}
                      onChange={(e) => {
                        const values = e.target.value as (string | number)[];
                        const stringValues = values.map(val => String(val));
                        setSelectedGroupIds(stringValues);
                      }}
                      input={<OutlinedInput label="Ryhmät" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((groupId) => {
                            const group = availableGroups.find(g => g.id === groupId);
                            return (
                              <Chip 
                                key={groupId} 
                                label={group ? group.name : groupId} 
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {availableGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          <Checkbox checked={selectedGroupIds.indexOf(group.id) > -1} />
                          <ListItemText primary={group.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleAddExisting}
                  disabled={selectedGroupIds.length === 0}
                >
                  Lisää valitut ryhmät
                </Button>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Peruuta</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupDialog; 