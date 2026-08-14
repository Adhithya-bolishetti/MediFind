import React from 'react';
import { Box, Typography } from '@mui/material';

const ProfileInfoPanel = ({ title, description, items }) => {
  return (
    <Box sx={{ 
      backgroundColor: '#F0F9F9', 
      borderRadius: 4, 
      p: 4, 
      height: '100%' 
    }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#079A9A', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#5C6780', mb: 4, lineHeight: 1.5 }}>
        {description}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ color: '#079A9A', mr: 2, mt: 0.5 }}>
              {item.icon}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#101B36', mb: 0.5 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5C6780', lineHeight: 1.4 }}>
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ProfileInfoPanel;
