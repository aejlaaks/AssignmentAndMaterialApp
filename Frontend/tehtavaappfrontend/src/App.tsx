import { type FC, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { ServiceProvider } from './contexts/ServiceContext';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { patchAllImagesInDom } from './utils/imageUtils';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary, { LazyLoadErrorBoundary } from './components/common/ErrorBoundary';
import { UserRole } from './types';

// Custom loading components for different sections
const PageLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress size={60} />
  </Box>
);

const SectionLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress size={40} />
  </Box>
);

// Authentication Pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));

// Core Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications').then(module => ({ default: module.Notifications })));

// Course related pages - now dynamically imported for better code splitting
const Courses = lazy(() => import(/* webpackChunkName: "courses" */ './pages/Courses'));
const CourseDetail = lazy(() => import(/* webpackChunkName: "courses" */ './pages/CourseDetail'));
const CourseForm = lazy(() => import(/* webpackChunkName: "courses" */ './pages/CourseForm'));
const TeacherCourses = lazy(() => import(/* webpackChunkName: "courses" */ './pages/TeacherCourses'));
const StudentCoursesPage = lazy(() => import(/* webpackChunkName: "courses" */ './pages/StudentCoursesPage'));
const StudentCourseView = lazy(() => import(/* webpackChunkName: "courses" */ './components/student').then(module => ({ default: module.StudentCourseView })));

// Assignment related pages
const Assignments = lazy(() => import(/* webpackChunkName: "assignments" */ './pages/Assignments'));
const AssignmentForm = lazy(() => import(/* webpackChunkName: "assignments" */ './pages/AssignmentForm'));
const AssignmentDetail = lazy(() => import(/* webpackChunkName: "assignments" */ './pages/AssignmentDetail'));
const AssignmentHelpPage = lazy(() => import(/* webpackChunkName: "assignments" */ './pages/AssignmentHelpPage'));

// Group related pages
const Groups = lazy(() => import(/* webpackChunkName: "groups" */ './pages/Groups'));
const GroupDetail = lazy(() => import(/* webpackChunkName: "groups" */ './pages/GroupDetail'));
const GroupCreate = lazy(() => import(/* webpackChunkName: "groups" */ './pages/GroupCreate'));

// Materials related pages
const MaterialView = lazy(() => import(/* webpackChunkName: "materials" */ './pages/MaterialView'));
const MaterialsPage = lazy(() => import(/* webpackChunkName: "materials" */ './pages/MaterialsPage'));
const BulkUploadPage = lazy(() => import(/* webpackChunkName: "materials" */ './pages/BulkUploadPage'));

// Submission related pages
const SubmissionsView = lazy(() => import(/* webpackChunkName: "submissions" */ './pages/SubmissionsView'));
const MySubmissions = lazy(() => import(/* webpackChunkName: "submissions" */ './pages/MySubmissions'));
const EnhancedSubmissionDetail = lazy(() => import(/* webpackChunkName: "submissions" */ './pages/EnhancedSubmissionDetail'));
const SubmissionEdit = lazy(() => import(/* webpackChunkName: "submissions" */ './pages/SubmissionEdit'));

// Admin related pages
const UserManagement = lazy(() => import(/* webpackChunkName: "admin" */ './pages/UserManagement'));
const TestManagement = lazy(() => import(/* webpackChunkName: "admin" */ './pages/TestManagement'));

const App: FC = () => {
  useEffect(() => {
    // Patch all images when the app first renders
    patchAllImagesInDom();

    // Set up a mutation observer to patch new images as they're added to the DOM
    const observer = new MutationObserver((mutations) => {
      let needsPatching = false;
      
      // Check if any mutations added new images
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'IMG' || (node.nodeType === 1 && (node as Element).querySelector('img'))) {
              needsPatching = true;
            }
          });
        }
      });
      
      // If new images were added, patch them
      if (needsPatching) {
        patchAllImagesInDom();
      }
    });
    
    // Start observing changes to the DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Clean up the observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ServiceProvider>
        <NotificationProvider>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/login" element={<LazyLoadErrorBoundary><Login /></LazyLoadErrorBoundary>} />

              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute />}>
                <Route index element={<LazyLoadErrorBoundary><Dashboard /></LazyLoadErrorBoundary>} />
                <Route path="dashboard" element={<LazyLoadErrorBoundary><Dashboard /></LazyLoadErrorBoundary>} />
                
                {/* Assignment routes */}
                <Route path="assignments" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <Assignments />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="assignments/create" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <AssignmentForm />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="assignments/:id/edit" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <AssignmentForm />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="assignments/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <AssignmentDetail />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="assignments/:id/help" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <AssignmentHelpPage />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                
                {/* Course routes */}
                <Route path="courses" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <Courses />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="teacher-courses" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <TeacherCourses />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="courses/create" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <CourseForm />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="courses/:id/edit" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <CourseForm />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="courses/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <CourseDetail />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="student-courses" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <StudentCoursesPage />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="student-courses/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <StudentCourseView />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                
                {/* Group routes */}
                <Route path="groups" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <Groups />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="groups/create" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <GroupCreate />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="groups/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <GroupDetail />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />

                {/* Core routes */}
                <Route path="profile" element={<LazyLoadErrorBoundary><Profile /></LazyLoadErrorBoundary>} />
                <Route path="notifications" element={<LazyLoadErrorBoundary><Notifications /></LazyLoadErrorBoundary>} />
                <Route path="settings" element={<LazyLoadErrorBoundary><Settings /></LazyLoadErrorBoundary>} />
                
                {/* Admin routes */}
                <Route path="users" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <UserManagement />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />

                {/* Material routes */}
                <Route path="material/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <MaterialView />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="materials" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <MaterialsPage />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="bulk-upload" element={
                  <PrivateRoute requiredRole={UserRole.Teacher}>
                    <LazyLoadErrorBoundary>
                      <Suspense fallback={<SectionLoading />}>
                        <BulkUploadPage />
                      </Suspense>
                    </LazyLoadErrorBoundary>
                  </PrivateRoute>
                } />
                <Route path="bulk-upload/:courseId" element={
                  <PrivateRoute requiredRole={UserRole.Teacher}>
                    <LazyLoadErrorBoundary>
                      <Suspense fallback={<SectionLoading />}>
                        <BulkUploadPage />
                      </Suspense>
                    </LazyLoadErrorBoundary>
                  </PrivateRoute>
                } />

                {/* Submission routes */}
                <Route path="submissions/:courseId/:assignmentId" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <SubmissionsView />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="my-submissions/:courseId/:assignmentId" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <MySubmissions />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="submission/:id" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <EnhancedSubmissionDetail />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="submission/:id/edit" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <SubmissionEdit />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />

                {/* Test routes */}
                <Route path="tests" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <TestManagement />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="tests/create" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <TestManagement create />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
                <Route path="tests/:id/edit" element={
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<SectionLoading />}>
                      <TestManagement edit />
                    </Suspense>
                  </LazyLoadErrorBoundary>
                } />
              </Route>

              {/* Redirect any unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </ServiceProvider>
    </ErrorBoundary>
  );
};

export default App;
