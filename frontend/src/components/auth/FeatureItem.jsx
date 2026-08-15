import React from 'react';
import { Box, Typography } from '@mui/material';

const FeatureItem = ({ icon, title, description, iconBgColor, iconColor }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
      <Box
        sx={{
          backgroundColor: iconBgColor || '#E8F5F5',
          color: iconColor || '#079A9A',
          p: 1.5,
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mr: 2,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            // Theme-aware: resolves to #101B36 in light mode and #E2E8F0 in dark
            // mode so the title stays readable on the dark gradient panel.
            color: 'var(--mf-text)',
            mb: 0.5,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            // Theme-aware: #5C6780 in light mode, #94A3B8 in dark mode.
            color: 'var(--mf-muted)',
            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default FeatureItem;
