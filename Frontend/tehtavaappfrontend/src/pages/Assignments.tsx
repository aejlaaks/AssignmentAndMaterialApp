import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useAssignments } from '../hooks/useAssignments';
import { useCourses } from '../hooks/useCourses';
import { useAuthState } from '../hooks/useRedux';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { NoData } from '../components/common/NoData';
import { groupService, ISchoolGroup } from '../services/courses/groupService';
import { UserRole } from '../types';
import { IAssignment } from '../services/assignments/assignmentService';
import { useServices } from '../contexts/ServiceContext';

export const Assignments = () => {
  const { assignments, isLoading, error, getAssignments, getTeacherAssignments } = useAssignments();
  const { courses, loading: coursesLoading, error: coursesError, getCourses } = useCourses();
  const { courseService, assignmentService } = useServices();
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [ownedCourses, setOwnedCourses] = useState<string[]>([]);
  const [groups, setGroups] = useState<ISchoolGroup[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState(assignments);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const { user } = useAuthState();
  const navigate = useNavigate();
  const isStudent = user?.role === UserRole.Student;
  const isTeacherOrAdmin = user?.role === UserRole.Teacher || user?.role === UserRole.Admin;

  // Load assignments and courses when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading courses and assignments...');
        
        // Load courses first
        await getCourses();
        
        // Get enrolled courses for students
        if (isStudent && user) {
          setIsCoursesLoading(true);
          try {
            const enrolledCoursesData = await courseService.getEnrolledCourses();
            const enrolledIds = enrolledCoursesData.map(c => String(c.id));
            setEnrolledCourses(enrolledIds);
            console.log('Student is enrolled in courses:', enrolledIds);
            
            // Use regular getAssignments for students
            await getAssignments();
          } catch (error) {
            console.error('Error fetching enrolled courses:', error);
          } finally {
            setIsCoursesLoading(false);
          }
        }
        // For teachers, use the specialized method to get their assignments
        else if (isTeacherOrAdmin && user) {
          console.log('Teacher role detected - using specialized teacher assignments method');
          try {
            // Use getTeacherAssignments instead of getAssignments for teachers
            const teacherAssignments = await getTeacherAssignments();
            console.log(`Teacher-specific assignments loaded: ${teacherAssignments.length}`);
          } catch (error) {
            console.error('Error fetching teacher assignments:', error);
            // Fallback to regular assignments if teacher-specific method fails
            await getAssignments();
          }
        } 
        // Fallback for other roles
        else {
          // Use regular getAssignments for other roles
          await getAssignments();
        }
        
        console.log('Data loading complete');
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
  }, [getCourses, getAssignments, getTeacherAssignments, courseService, isStudent, isTeacherOrAdmin, user, assignmentService]);

  // Add a useEffect to log assignments when they change
  useEffect(() => {
    if (assignments && assignments.length >= 0) {
      console.log('All loaded assignments:', assignments);
      console.log('Assignments with courseId:', assignments.filter(a => a.courseId));
    }
  }, [assignments]);

  // Separate useEffect to set teacher owned courses once courses are loaded
  useEffect(() => {
    if (isTeacherOrAdmin && user && courses && courses.length > 0) {
      console.log('Setting teacher owned courses');
      console.log('User ID:', user.id);
      console.log('Available courses:', courses.map(c => ({ id: c.id, teacherId: c.teacherId, createdById: c.createdById })));
      
      // For teachers, show ALL courses by default (or you could restrict this in production)
      // Administrators especially should see all courses
      if (user.role === UserRole.Admin) {
        const allCourseIds = courses.map(course => String(course.id));
        setOwnedCourses(allCourseIds);
        console.log('Admin sees all courses:', allCourseIds);
      } else {
        // Find courses where the user is the teacher or creator
        const teacherOwnedIds = courses
          .filter(course => 
            String(course.teacherId) === String(user.id) || 
            String(course.createdById) === String(user.id)
          )
          .map(course => String(course.id));
          
        // If no courses matched, default to showing all courses for teachers
        // This is a fallback to ensure teachers see assignments
        const courseIdsToShow = teacherOwnedIds.length > 0 
          ? teacherOwnedIds 
          : courses.map(course => String(course.id));
        
        setOwnedCourses(courseIdsToShow);
        console.log('Teacher courses to show:', courseIdsToShow);
      }
    }
  }, [courses, isTeacherOrAdmin, user]);

  // Filter assignments based on user role and selected course
  useEffect(() => {
    if (!assignments || !courses || !user) return;
    
    console.log(`Filtering assignments for user role: ${user.role}`);
    console.log('All assignments before filtering:', assignments);
    
    // Check if any assignments have courseId
    const assignmentsWithCourseId = assignments.filter(a => a.courseId);
    console.log(`Found ${assignmentsWithCourseId.length} out of ${assignments.length} assignments with courseId`);
    
    // If no assignments have courseId, show all assignments regardless of user role
    if (assignmentsWithCourseId.length === 0) {
      console.log('No assignments have courseId - showing all assignments');
      setFilteredAssignments(assignments);
      return;
    }
    
    console.log('Teacher owned courses:', ownedCourses);
    
    // For students, only show assignments for enrolled courses
    if (isStudent) {
      // If a specific course is selected, filter by that
      if (selectedCourse) {
        const filtered = assignments.filter(assignment => 
          String(assignment.courseId) === String(selectedCourse)
        );
        setFilteredAssignments(filtered);
        console.log(`Filtered to ${filtered.length} assignments for selected course ${selectedCourse}`);
      } else {
        // Only show assignments for courses the student is enrolled in
        if (enrolledCourses.length > 0) {
          const filtered = assignments.filter(assignment => 
            assignment.courseId && enrolledCourses.includes(String(assignment.courseId))
          );
          
          setFilteredAssignments(filtered);
          console.log(`Filtered to ${filtered.length} assignments for enrolled courses`);
        } else {
          // If we couldn't get enrolled courses, show all assignments
          setFilteredAssignments(assignments);
        }
      }
    } 
    // For teachers, show assignments for courses they teach
    else if (isTeacherOrAdmin) {
      if (selectedCourse) {
        const filtered = assignments.filter(assignment => 
          String(assignment.courseId) === String(selectedCourse)
        );
        setFilteredAssignments(filtered);
        console.log(`Filtered to ${filtered.length} assignments for selected course ${selectedCourse}`);
      } else {
        // IMPORTANT: For teachers, show ALL assignments for now
        console.log('Teacher role detected - showing all assignments to ensure visibility');
        setFilteredAssignments(assignments);
      }
    } else {
      // Default fallback (should not normally happen)
      setFilteredAssignments(assignments);
    }
  }, [assignments, courses, selectedCourse, user, isStudent, isTeacherOrAdmin, enrolledCourses, ownedCourses]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (selectedCourse && isTeacherOrAdmin) {
        setIsGroupsLoading(true);
        try {
          const fetchedGroups = await groupService.getGroupsByCourse(selectedCourse);
          setGroups(fetchedGroups);
        } catch (error) {
          console.error('Error fetching groups:', error);
        } finally {
          setIsGroupsLoading(false);
        }
      } else {
        setGroups([]);
      }
    };

    fetchGroups();
  }, [selectedCourse, isTeacherOrAdmin]);

  const handleCourseChange = (event: SelectChangeEvent) => {
    const courseId = event.target.value;
    console.log(`Course selected: ${courseId}`);
    setSelectedCourse(courseId);
    setSelectedGroup(''); // Reset group selection when course changes
  };

  const handleGroupChange = async (event: SelectChangeEvent) => {
    const groupId = event.target.value;
    console.log(`Group selected: ${groupId}`);
    setSelectedGroup(groupId);
    
    // Note: Filtering by group will be handled in the useEffect that depends on selectedGroup
    if (groupId && selectedCourse) {
      try {
        setIsGroupsLoading(true);
        const groupsInCourse = await groupService.getGroupsByCourse(selectedCourse);
        setGroups(groupsInCourse);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsGroupsLoading(false);
      }
    }
  };

  const handleCreateAssignment = useCallback(() => {
    navigate('/assignments/create');
  }, [navigate]);

  const handleViewAssignment = useCallback((id: string) => {
    navigate(`/assignments/${id}`);
  }, [navigate]);

  // Handler for DataTable onRowClick
  const handleRowClick = useCallback((row: IAssignment) => {
    navigate(`/assignments/${row.id}`);
  }, [navigate]);

  // Show loading state if any data is loading
  if (isLoading || coursesLoading || isCoursesLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  const columns = [
    { 
      id: 'title', 
      label: 'Otsikko',
      minWidth: 200,
      format: (value: string) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
          <Typography 
            variant="body1"
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {value}
          </Typography>
        </Box>
      )
    },
    { 
      id: 'courseId', 
      label: 'Kurssi',
      minWidth: 150,
      format: (value: string) => (
        <Chip 
          label={getCourseName(value)} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      )
    },
    { 
      id: 'dueDate', 
      label: 'Palautuspäivä',
      minWidth: 150,
      format: (value: string) => {
        const date = new Date(value);
        const isOverdue = date < new Date();
        return (
          <Typography 
            variant="body2" 
            color={isOverdue ? 'error.main' : 'text.primary'}
          >
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        );
      }
    },
    { 
      id: 'status', 
      label: 'Tila',
      minWidth: 120,
      format: (value: string) => {
        let color = 'default';
        
        // Check the value case-insensitively
        const status = value ? value.toLowerCase() : '';
        
        switch (status) {
          case 'published':
            color = 'primary';
            break;
          case 'draft':
            color = 'default';
            break;
          case 'completed':
            color = 'success';
            break;
          case 'submitted':
            color = 'info';
            break;
          case 'returned':
            color = 'warning';
            break;
          case 'inprogress':
            color = 'info';
            break;
          case 'archived':
            color = 'error';
            break;
        }
        
        // For debugging, log the status value 
        console.log(`Assignment status: "${value}" (processed as "${status}")`);
        
        return <Chip label={getStatusTranslation(value)} size="small" color={color as any} />;
      }
    },
    {
      id: 'actions',
      label: 'Toiminnot',
      minWidth: 100,
      format: (_: any, row: any) => (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleViewAssignment(row.id)}
        >
          Näytä
        </Button>
      )
    }
  ];

  // Function to translate status values
  const getStatusTranslation = (status: string) => {
    if (!status) return 'Julkaistu';
    
    // Convert to lowercase for case-insensitive comparison
    switch(status.toLowerCase()) {
      case 'published': return 'Julkaistu';
      case 'draft': return 'Luonnos';
      case 'completed': return 'Arvioitu';
      case 'submitted': return 'Palautettu';
      case 'returned': return 'Palautettu korjattavaksi';
      case 'inprogress': return 'Kesken';
      case 'archived': return 'Myöhässä';
      default: return status || 'Julkaistu';
    }
  };

  // Function to get course name by ID
  const getCourseName = (courseId: string) => {
    // If courseId is null, undefined, or empty string
    if (!courseId) return 'Ei kurssia määritetty';
    
    // If courses haven't loaded yet
    if (!courses || courses.length === 0) {
      return 'Ladataan...';
    }
    
    // Try different matching strategies
    let course = courses.find(c => c.id === courseId);
    
    if (!course) {
      // Try string comparison if direct comparison fails
      course = courses.find(c => String(c.id) === String(courseId));
    }
    
    if (!course) {
      // Try case-insensitive comparison if string comparison fails
      course = courses.find(c => 
        String(c.id).toLowerCase() === String(courseId).toLowerCase()
      );
    }
    
    if (!course) {
      // Try trimming whitespace if case-insensitive comparison fails
      course = courses.find(c => 
        String(c.id).toLowerCase().trim() === String(courseId).toLowerCase().trim()
      );
    }
    
    return course ? course.name : 'Tuntematon kurssi';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Typography variant="h4" className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">
          Tehtävät
        </Typography>
        {!isStudent && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateAssignment}
            className="mt-2 sm:mt-0"
          >
            Luo Tehtävä
          </Button>
        )}
      </div>

      {isTeacherOrAdmin && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
          <FormControl className="min-w-[200px] w-full sm:w-auto">
            <InputLabel id="course-select-label">Suodata kurssin mukaan</InputLabel>
            <Select
              labelId="course-select-label"
              value={selectedCourse}
              onChange={handleCourseChange}
              label="Suodata kurssin mukaan"
              className="w-full"
            >
              <MenuItem value="">
                <em>Kaikki kurssit</em>
              </MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCourse && (
            <FormControl className="min-w-[200px] w-full sm:w-auto">
              <InputLabel id="group-select-label">Suodata ryhmän mukaan</InputLabel>
              <Select
                labelId="group-select-label"
                value={selectedGroup}
                onChange={handleGroupChange}
                label="Suodata ryhmän mukaan"
                disabled={isGroupsLoading}
                className="w-full"
              >
                <MenuItem value="">
                  <em>Kaikki ryhmät</em>
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {filteredAssignments.length === 0 ? (
          <div className="p-4 sm:p-6 md:p-8 text-center">
            <Typography variant="h6" className="text-gray-500 mb-2">
              Tehtäviä ei löytynyt
            </Typography>
            <Typography variant="body2" className="text-gray-400">
              {selectedCourse ? 'Valitse toinen kurssi tai luo uusi tehtävä.' : 'Luo ensimmäinen tehtäväsi aloittaaksesi.'}
            </Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr 
                    key={assignment.id}
                    onClick={() => handleRowClick(assignment)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    {columns.map((column) => (
                      <td key={column.id} className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                        {column.format 
                          ? column.format(assignment[column.id as keyof IAssignment], assignment)
                          : assignment[column.id as keyof IAssignment]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
