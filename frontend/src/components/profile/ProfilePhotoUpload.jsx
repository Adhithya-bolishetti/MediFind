import React, { useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';

const ProfilePhotoUpload = ({ onChange }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        if (onChange) onChange(reader.result); // Passing base64 up
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
        Profile Photo <span style={{ color: '#d32f2f' }}>*</span>
      </Typography>
      
      <Box
        component="label"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 200,
          height: 200,
          border: '2px dashed #D9DEE8',
          borderRadius: 4,
          cursor: 'pointer',
          bgcolor: '#FAFBFC',
          '&:hover': {
            borderColor: '#079A9A',
            bgcolor: '#F0F9F9'
          },
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        <input
          type="file"
          hidden
          accept="image/jpeg, image/png"
          onChange={handleFileChange}
        />
        
        {preview ? (
          <Avatar src={preview} sx={{ width: 140, height: 140, mb: 2 }} />
        ) : (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: '#E1E5ED' }} />
            <Box sx={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              bgcolor: '#079A9A', 
              color: '#fff', 
              borderRadius: '50%', 
              p: 0.5,
              display: 'flex'
            }}>
              <PhotoCameraRoundedIcon fontSize="small" />
            </Box>
          </Box>
        )}
        
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#101B36', mb: 0.5 }}>
          Click to upload photo
        </Typography>
        <Typography variant="caption" sx={{ color: '#9AA4B2' }}>
          JPG, PNG (Max. 2MB)
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfilePhotoUpload;
