import React from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, Container } from '@mui/material';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';

const ProfileSetupLayout = ({ title, subtitle, steps, activeStep, children, infoPanel }) => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F7F9FC', py: 4, display: 'flex', flexDirection: 'column' }}>
      {/* Top Logo */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
        <LocalHospitalRoundedIcon sx={{ color: '#079A9A', fontSize: 32, mr: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#101B36', letterSpacing: '-0.5px' }}>
          MediFind
        </Typography>
      </Box>

      {/* Main Container */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 5, lg: 6 }, 
            borderRadius: 4, 
            border: '1px solid #D9DEE8',
            boxShadow: '0px 10px 40px rgba(16, 27, 54, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1
          }}
        >
          {/* Header Row: Title on left, Stepper on right */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', lg: 'center' },
            mb: 4,
            gap: 4
          }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#101B36', mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="body1" sx={{ color: '#5C6780' }}>
                {subtitle}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '100%', lg: '50%' } }}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{
                  '& .MuiStepConnector-line': {
                    borderColor: '#D9DEE8',
                    borderTopStyle: 'dashed',
                  },
                  '& .MuiStepIcon-root': {
                    color: '#D9DEE8',
                    '&.Mui-active': { color: '#079A9A' },
                    '&.Mui-completed': { color: '#079A9A' }
                  },
                  '& .MuiStepLabel-label': {
                    mt: 1,
                    fontWeight: 600,
                    color: '#5C6780',
                    '&.Mui-active': { color: '#101B36' },
                    '&.Mui-completed': { color: '#101B36' }
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>

          <Box sx={{ borderBottom: '1px solid #D9DEE8', mb: 4 }} />

          {/* Content Row: Form on left, Info Panel on right */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 6,
            flexGrow: 1
          }}>
            <Box sx={{ flex: 1 }}>
              {children}
            </Box>
            
            {infoPanel && (
              <Box sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0 }}>
                {infoPanel}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfileSetupLayout;
