import React, { type FC, useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActionArea,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Book as BookIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Notifications as NotificationIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useRedux';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { courseServiceWithCache } from '../services/courses/courseServiceCache';
import { assignmentService } from '../services/assignments/assignmentService';
import { groupServiceWithCache } from '../services/courses/groupServiceCache';
import { materialService } from '../services/materials/materialService';
import { UserRole } from '../types';
import { Course as IndexCourse, Assignment as IndexAssignment, SchoolGroup as IndexSchoolGroup } from '../types';
import { Course as CourseType } from '../types/CourseTypes';
import { Assignment as AssignmentType } from '../types/assignment';

// Extended assignment interface to include courseTitle
interface ExtendedAssignment extends IndexAssignment {
  courseTitle?: string;
}

// Memoize the DashboardCard component
const DashboardCard: FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
}> = React.memo(({ title, count, icon, onClick }) => (
  <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
    <CardActionArea onClick={onClick} className="h-full">
      <CardContent className="h-full flex flex-col">
        <div className="flex items-center mb-3">
          <div className="mr-2">{icon}</div>
          <Typography variant="h6" className="text-gray-800">
            {title}
          </Typography>
        </div>
        <Typography variant="h3" component="div" className="text-3xl font-bold mt-auto">
          {count}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
));

DashboardCard.displayName = 'DashboardCard';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'assignment' | 'course' | 'group' | 'notification';
}

interface EnrolledCourse extends CourseType {
  name: string;
  studentCount: number;
  progress: number;
}

// Regular function for getCardTitle, will be memoized when used
const getCardTitle = (type: string, isTeacher: boolean, isAdmin: boolean): string => {
  switch (type) {
    case 'courses':
      return isTeacher || isAdmin ? 'Kurssit' : 'Omat kurssit';
    case 'assignments':
      return isTeacher || isAdmin ? 'Tehtävät' : 'Omat tehtävät';
    case 'groups':
      return 'Ryhmät';
    case 'materials':
      return 'Materiaalit';
    default:
      return '';
  }
};

// Helper function to map AssignmentType to IndexAssignment
const mapAssignmentToIndexAssignment = (assignment: AssignmentType): ExtendedAssignment => {
  return {
    ...assignment,
    id: assignment.id,
    description: assignment.description || ""
  } as ExtendedAssignment;
};

// Helper function to ensure SchoolGroup's createdAt is either string or Date
const mapGroupToIndexSchoolGroup = (group: any): IndexSchoolGroup => {
  // Make sure createdAt is always a valid string or Date
  const createdAt = group.createdAt 
    ? (typeof group.createdAt === 'string' 
        ? group.createdAt 
        : group.createdAt instanceof Date 
          ? group.createdAt.toISOString() 
          : new Date().toISOString())
    : new Date().toISOString();
    
  return {
    ...group,
    id: group.id,
    createdAt
  } as IndexSchoolGroup;
};

// Helper function to ensure activity item has string date
const ensureActivityItemDateIsString = (item: any): ActivityItem => {
  return {
    ...item,
    date: typeof item.date === 'string' ? item.date : 
          (item.date instanceof Date ? item.date.toISOString() : 
          new Date().toISOString())
  };
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, error: authError } = useAuthState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseCount, setCourseCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<ExtendedAssignment[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Memoize user role checks to avoid recalculation
  const userRoles = useMemo(() => {
    if (!user) return { isStudent: false, isTeacher: false, isAdmin: false };
    return {
      isStudent: user.role === UserRole.Student,
      isTeacher: user.role === UserRole.Teacher,
      isAdmin: user.role === UserRole.Admin
    };
  }, [user]);

  const { isStudent, isTeacher, isAdmin } = userRoles;

  const fetchDashboardData = async (forceRefresh = false) => {
    if (!user) return;
    
    setIsLoading(true);
    setRefreshing(forceRefresh);
    
    try {
      let courses: CourseType[] = [];
      let assignments: AssignmentType[] = [];
      let groups: IndexSchoolGroup[] = [];
      let materials: any[] = [];

      // Haetaan data käyttäjäroolin mukaan
      if (isStudent) {
        try {
          // Opiskelijalle haetaan vain kurssit joihin hän on ilmoittautunut
          courses = await courseServiceWithCache.getEnrolledCourses(forceRefresh);
        } catch (err) {
          console.error('Virhe kurssien haussa:', err);
          setError('Kurssien lataaminen epäonnistui');
          courses = []; // Varmistetaan, että courses on tyhjä array
        }
        
        try {
          console.log('Fetching student assignments');
          
          // Haetaan opiskelijalle relevantteja tehtäviä kurssien perusteella
          const studentCourseIds = courses.map(course => course.id);
          if (studentCourseIds.length > 0) {
            assignments = await assignmentService.getAssignmentsForCourses(studentCourseIds, forceRefresh);
            console.log(`Fetched ${assignments.length} assignments for student's ${studentCourseIds.length} courses`);
          } else {
            console.log('Student has no enrolled courses, setting empty assignments array');
            assignments = [];
          }
        } catch (err) {
          console.error('Virhe tehtävien haussa:', err);
          assignments = []; // Varmistetaan, että assignments on tyhjä array
        }
        
        // Opiskelijalle näytetään vain heidän kursseihinsa liittyvät materiaalit
        try {
          const studentCourseIds = courses.map(course => course.id);
          console.log('Student enrolled in courses:', studentCourseIds);
          
          // Use the new utility function to get materials for all student courses
          if (studentCourseIds.length > 0) {
            materials = await materialService.getMaterialsForCourses(studentCourseIds, forceRefresh);
            console.log(`Fetched ${materials.length} materials for student's ${studentCourseIds.length} courses`);
          } else {
            console.log('Student has no enrolled courses, setting empty materials array');
            materials = [];
          }
        } catch (err) {
          console.error('Virhe materiaalien haussa:', err);
          materials = []; // Varmistetaan, että materials on tyhjä array
        }
      } else {
        try {
          // Opettajalle ja adminille haetaan kaikki
          courses = await courseServiceWithCache.getCourses(forceRefresh);
        } catch (err) {
          console.error('Virhe kurssien haussa:', err);
          courses = []; // Varmistetaan, että courses on tyhjä array
        }
        
        try {
          assignments = await assignmentService.getAssignments(forceRefresh);
        } catch (err) {
          console.error('Virhe tehtävien haussa:', err);
          assignments = []; // Varmistetaan, että assignments on tyhjä array
        }
        
        try {
          // Fetch groups from API
          const fetchedGroups = await groupServiceWithCache.getGroups(forceRefresh);
          // Map each group to ensure type compatibility
          groups = fetchedGroups.map(group => mapGroupToIndexSchoolGroup(group));
        } catch (err) {
          console.error('Virhe ryhmien haussa:', err);
          groups = []; // Varmistetaan, että groups on tyhjä array
        }
        
        // Haetaan kaikki materiaalit opettajalle/adminille
        try {
          const allMaterials = await materialService.getAllMaterials(forceRefresh);
          materials = Array.isArray(allMaterials) ? allMaterials : [];
          console.log(`Loaded ${materials.length} materials for teacher/admin`);
        } catch (err) {
          console.error('Virhe materiaalien haussa:', err);
          materials = []; // Varmistetaan, että materials on tyhjä array
        }
      }
      
      // Asetetaan opiskelijalle vain omat tehtävät ja materiaalit
      setCourseCount(courses.length);
      setAssignmentCount(assignments.length);
      setMaterialCount(materials.length);
      
      if (!isStudent) {
        setGroupCount(groups.length);
      }
      
      // Opiskelijalle näytetään ilmoittautuneet kurssit
      if (isStudent) {
        // Use useMemo inside this function since it's a one-time calculation
        const enrolledCoursesWithData: EnrolledCourse[] = courses.map(course => {
          // Lasketaan opiskelijoiden määrä kurssin ryhmien kautta
          const studentCount = course.groups?.reduce((count, group) => 
            count + (group.students?.length || group.studentEnrollments?.length || 0), 0) || course.studentCount || 0;
          
          // Tarkistetaan, onko käyttäjä ilmoittautunut kurssille ryhmien kautta
          const isEnrolled = course.groups?.some(group => 
            group.students?.some(student => student.id === user.id) || 
            group.studentEnrollments?.some(enrollment => enrollment.studentId === user.id)
          ) || false;
          
          // Oletusarvona edistymiselle 0
          const progress = isEnrolled ? 0 : 0; // Tässä voisi olla logiikkaa edistymisen laskemiseen
          
          return {
            ...course,
            name: course.title || "",
            studentCount,
            progress
          };
        });
        setEnrolledCourses(enrolledCoursesWithData);
        
        // Use useMemo inside this function since it's a one-time calculation
        // Järjestetään tehtävät määräajan mukaan
        const now = new Date();
        const upcomingAssignmentsFiltered = assignments
          .filter(assignment => {
            const deadline = assignment.dueDate ? new Date(assignment.dueDate) : null;
            return deadline && deadline > now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.dueDate || '');
            const dateB = new Date(b.dueDate || '');
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5) // Näytetään vain 5 seuraavaa tehtävää
          .map(assignment => mapAssignmentToIndexAssignment(assignment));
        
        setUpcomingAssignments(upcomingAssignmentsFiltered);
      }
      
      setIsLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Dashboardin tietojen lataaminen epäonnistui');
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData(false);
  }, [user, isStudent, isTeacher, isAdmin]);

  // Handler for manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Use memoization for card titles
  const coursesCardTitle = useMemo(() => getCardTitle('courses', isTeacher, isAdmin), [isTeacher, isAdmin]);
  const assignmentsCardTitle = useMemo(() => getCardTitle('assignments', isTeacher, isAdmin), [isTeacher, isAdmin]);
  const groupsCardTitle = useMemo(() => getCardTitle('groups', isTeacher, isAdmin), [isTeacher, isAdmin]);
  const materialsCardTitle = useMemo(() => getCardTitle('materials', isTeacher, isAdmin), [isTeacher, isAdmin]);

  // Memoize sorted activity items to avoid recalculating on every render
  const sortedActivityItems = useMemo(() => {
    return [...recentActivity].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [recentActivity]);

  // Memoize navigation handlers to prevent recreation on each render
  const handleCourseNavigation = useMemo(() => () => {
    navigate(isStudent ? '/student-courses' : '/courses');
  }, [navigate, isStudent]);

  const handleAssignmentNavigation = useMemo(() => () => {
    navigate('/assignments');
  }, [navigate]);

  const handleGroupNavigation = useMemo(() => () => {
    navigate('/groups');
  }, [navigate]);

  const handleMaterialNavigation = useMemo(() => () => {
    // Fix path to go to the materials page (plural form)
    navigate('/materials');
  }, [navigate]);

  if (authLoading || isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (authError || error) {
    return <ErrorAlert message={authError || error || 'Tuntematon virhe'} />;
  }

  // Get user name or fallback to a default - using firstName which is available in User interface
  const userName = user?.firstName || 'Käyttäjä';

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">
          Tervetuloa, {userName}!
        </Typography>
        <Tooltip title="Päivitä tiedot">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing} 
            color="primary"
            className="ml-2"
          >
            <RefreshIcon className={refreshing ? "animate-spin" : ""} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title={coursesCardTitle}
          count={courseCount}
          icon={<SchoolIcon color="primary" />}
          onClick={handleCourseNavigation}
        />
        <DashboardCard
          title={assignmentsCardTitle}
          count={assignmentCount}
          icon={<AssignmentIcon color="primary" />}
          onClick={handleAssignmentNavigation}
        />
        {!isStudent && (
          <DashboardCard
            title={groupsCardTitle}
            count={groupCount}
            icon={<GroupIcon color="primary" />}
            onClick={handleGroupNavigation}
          />
        )}
        <DashboardCard
          title={materialsCardTitle}
          count={materialCount}
          icon={<BookIcon color="primary" />}
          onClick={handleMaterialNavigation}
        />
      </div>

      {/* Content for different user roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student-specific content */}
        {isStudent && enrolledCourses.length > 0 && (
          <>
            {/* Enrolled courses section */}
            <Card className="shadow-sm">
              <CardContent>
                <Typography variant="h6" className="mb-4 flex items-center">
                  <SchoolIcon className="mr-2" /> Omat kurssit
                </Typography>
                <div className="space-y-3">
                  {enrolledCourses.slice(0, 5).map(course => (
                    <Card key={course.id} variant="outlined" className="p-2">
                      <CardActionArea 
                        onClick={() => navigate(`/student-courses/${course.id}`)}
                        className="p-2"
                      >
                        <div className="flex justify-between items-center">
                          <Typography variant="subtitle1">{course.name}</Typography>
                          <Typography variant="body2">
                            {course.studentCount} opiskelijaa
                          </Typography>
                        </div>
                      </CardActionArea>
                    </Card>
                  ))}
                  {enrolledCourses.length > 5 && (
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      className="cursor-pointer text-center mt-2"
                      onClick={handleCourseNavigation}
                    >
                      Näytä kaikki ({enrolledCourses.length}) kurssia
                    </Typography>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming assignments section */}
            <Card className="shadow-sm">
              <CardContent>
                <Typography variant="h6" className="mb-4 flex items-center">
                  <EventIcon className="mr-2" /> Tulevat tehtävät
                </Typography>
                {upcomingAssignments.length > 0 ? (
                  <List>
                    {upcomingAssignments.map(assignment => (
                      <React.Fragment key={assignment.id}>
                        <ListItem 
                          button 
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          <ListItemIcon>
                            <AssignmentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={assignment.title} 
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {assignment.dueDate ? `Palautus: ${new Date(assignment.dueDate).toLocaleDateString()}` : 'Ei määräaikaa'}
                                </Typography>
                                {assignment.courseTitle && (
                                  <Typography variant="body2" component="span" className="ml-2">
                                    • {assignment.courseTitle}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Ei tulevia tehtäviä
                  </Typography>
                )}
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Teacher/Admin specific content */}
        {(isTeacher || isAdmin) && (
          <>
            <Card className="shadow-sm">
              <CardContent>
                <Typography variant="h6" className="mb-4 flex items-center">
                  <TimelineIcon className="mr-2" /> Tilastot
                </Typography>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Typography variant="h5">{courseCount}</Typography>
                    <Typography variant="body2">Kursseja</Typography>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Typography variant="h5">{assignmentCount}</Typography>
                    <Typography variant="body2">Tehtäviä</Typography>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Typography variant="h5">{groupCount}</Typography>
                    <Typography variant="body2">Ryhmiä</Typography>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Typography variant="h5">{materialCount}</Typography>
                    <Typography variant="body2">Materiaaleja</Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent>
                <Typography variant="h6" className="mb-4 flex items-center">
                  <PeopleIcon className="mr-2" /> Viimeisimmät aktiviteetit
                </Typography>
                {sortedActivityItems.length > 0 ? (
                  <List>
                    {sortedActivityItems.slice(0, 5).map(activity => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemIcon>
                            {activity.type === 'assignment' && <AssignmentIcon />}
                            {activity.type === 'course' && <SchoolIcon />}
                            {activity.type === 'group' && <GroupIcon />}
                            {activity.type === 'notification' && <NotificationIcon />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={activity.title} 
                            secondary={`${new Date(activity.date).toLocaleDateString()} - ${activity.description}`}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Ei viimeaikaisia aktiviteetteja
                  </Typography>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
