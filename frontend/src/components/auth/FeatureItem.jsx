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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#101B36', mb: 0.5, lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#5C6780', lineHeight: 1.4 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default FeatureItem;
