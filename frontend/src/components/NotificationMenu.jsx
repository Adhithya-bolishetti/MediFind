import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, CircularProgress, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { AuthContext } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const NotificationMenu = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      // Ensure we have an array to work with
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#101B36">
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          Your latest updates and alerts.
        </Typography>
      </Box>

        <Paper elevation={2} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <Box p={5} sx={{ textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">You have no notifications.</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {notifications.map((notification, index) => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={notification.id}>
                  <ListItem
                    sx={{
                      py: 3,
                      px: 4,
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: notification.isRead ? 'transparent' : '#f0f7ff',
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: '#f8f9fa' }
                    }}
                    secondaryAction={
                      <Box>
                        {!notification.isRead && (
                          <IconButton edge="end" color="primary" onClick={() => markAsRead(notification.id)} title="Mark as Read">
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                        <IconButton edge="end" color="error" onClick={() => deleteNotification(notification.id)} title="Delete Notification" sx={{ ml: 1 }}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <NotificationsIcon color={notification.isRead ? 'disabled' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="h6" fontWeight={notification.isRead ? 500 : 700}>
                          {notification.title || notification.type || 'Notification'}
                        </Typography>
                      }
                      secondary={
                        <Box mt={1}>
                          <Typography variant="body1" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                            {new Date(notification.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          )}
        </Paper>
    </Box>
  );
};

export default NotificationMenu;
