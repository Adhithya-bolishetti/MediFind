import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';

/**
 * DashboardLayout wraps all authenticated pages.
 * It renders the fixed left sidebar and pushes the main content
 * to the right by the sidebar width.
 */
const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          // Small top padding on mobile to account for hamburger button
          pt: isMobile ? '56px' : 0,
          width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
