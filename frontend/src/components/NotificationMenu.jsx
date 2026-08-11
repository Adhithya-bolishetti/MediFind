import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, List, ListItem, ListItemText, ListItemIcon, CircularProgress, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const NotificationMenu = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/notifications/user/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#1a237e', mb: 4 }}>
          Notifications
        </Typography>

        <Paper elevation={2} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <Box p={5} textAlign="center">
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
                      !notification.isRead && (
                        <IconButton edge="end" color="primary" onClick={() => markAsRead(notification.id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>
                      <NotificationsIcon color={notification.isRead ? 'disabled' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="h6" fontWeight={notification.isRead ? 500 : 700}>
                          {notification.title}
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
      </Container>
    </Box>
  );
};

export default NotificationMenu;
