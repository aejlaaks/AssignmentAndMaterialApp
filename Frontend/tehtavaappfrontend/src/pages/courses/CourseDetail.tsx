import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useSnackbar } from 'notistack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { sendCourseNotification } from '../../services/notifications/notificationService';
import { NotificationType, NotificationPriority, UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  // Tarkistetaan, onko käyttäjä opettaja tai admin
  const isTeacher = user && (user.role === UserRole.Teacher || user.role === UserRole.Admin);
  
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.Info);
  const [notificationPriority, setNotificationPriority] = useState<NotificationPriority>(NotificationPriority.Medium);
  const [sendingNotification, setSendingNotification] = useState(false);

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage || !courseId) {
      return;
    }

    setSendingNotification(true);
    try {
      await sendCourseNotification(
        Number(courseId),
        notificationTitle,
        notificationMessage,
        notificationType,
        notificationPriority
      );
      setNotificationDialogOpen(false);
      setNotificationTitle('');
      setNotificationMessage('');
      enqueueSnackbar('Ilmoitus lähetetty onnistuneesti', { variant: 'success' });
    } catch (error) {
      console.error('Virhe ilmoituksen lähettämisessä:', error);
      enqueueSnackbar('Ilmoituksen lähettäminen epäonnistui', { variant: 'error' });
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Typography variant="h4" className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">
          Course Details
        </Typography>
        
        {isTeacher && (
          <div className="flex justify-end mt-2 sm:mt-4">
            <Button
              variant="contained"
              color="primary"
              startIcon={<NotificationsIcon />}
              onClick={() => setNotificationDialogOpen(true)}
              className="text-sm sm:text-base"
            >
              Lähetä ilmoitus opiskelijoille
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
            <Typography variant="h5" className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Course Information
            </Typography>
            
            {/* Course content will go here */}
            <div className="space-y-4">
              <div>
                <Typography variant="subtitle1" className="text-gray-600 text-sm">
                  Course ID
                </Typography>
                <Typography variant="body1">
                  {courseId}
                </Typography>
              </div>
              
              {/* More course details will be added here */}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
            <Typography variant="h5" className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Course Statistics
            </Typography>
            
            {/* Statistics will go here */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Typography variant="body2" className="text-gray-600">
                  Students
                </Typography>
                <Typography variant="body1" className="font-medium">
                  0
                </Typography>
              </div>
              
              <div className="flex justify-between items-center">
                <Typography variant="body2" className="text-gray-600">
                  Assignments
                </Typography>
                <Typography variant="body1" className="font-medium">
                  0
                </Typography>
              </div>
              
              <div className="flex justify-between items-center">
                <Typography variant="body2" className="text-gray-600">
                  Materials
                </Typography>
                <Typography variant="body1" className="font-medium">
                  0
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lähetä ilmoitus kurssin opiskelijoille</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Otsikko"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Viesti"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Tyyppi</InputLabel>
            <Select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationType)}
            >
              <MenuItem value={NotificationType.Info}>Info</MenuItem>
              <MenuItem value={NotificationType.Success}>Onnistuminen</MenuItem>
              <MenuItem value={NotificationType.Warning}>Varoitus</MenuItem>
              <MenuItem value={NotificationType.Error}>Virhe</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Prioriteetti</InputLabel>
            <Select
              value={notificationPriority}
              onChange={(e) => setNotificationPriority(e.target.value as NotificationPriority)}
            >
              <MenuItem value={NotificationPriority.Low}>Matala</MenuItem>
              <MenuItem value={NotificationPriority.Medium}>Keskitaso</MenuItem>
              <MenuItem value={NotificationPriority.High}>Korkea</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>Peruuta</Button>
          <Button 
            onClick={handleSendNotification} 
            color="primary" 
            disabled={!notificationTitle || !notificationMessage || sendingNotification}
          >
            {sendingNotification ? <CircularProgress size={24} /> : 'Lähetä'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CourseDetail; 