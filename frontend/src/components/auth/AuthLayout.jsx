import React from 'react';
import { Box, Typography, Grid, useTheme, useMediaQuery } from '@mui/material';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FeatureItem from './FeatureItem';

const AuthLayout = ({ children }) => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F7F9FC' }}>
      <Grid container>
        {/* Left Side - Branding & Features */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            p: { xs: 4, md: 8, lg: 12 }, 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 4, md: 8 } }}>
            <LocalHospitalRoundedIcon sx={{ color: '#079A9A', fontSize: 32, mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#101B36', letterSpacing: '-0.5px' }}>
              MediFind
            </Typography>
          </Box>

          {/* Heading */}
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              color: '#101B36', 
              mb: 6,
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              lineHeight: 1.2
            }}
          >
            Find the Right Doctor.<br/>
            Get the <Box component="span" sx={{ color: '#079A9A' }}>Right Care.</Box>
          </Typography>

          {/* Features */}
          <Box sx={{ mb: { xs: 4, md: 0 }, maxWidth: 450, zIndex: 1 }}>
            <FeatureItem 
              icon={<SearchRoundedIcon fontSize="large" />}
              title="Smart Doctor Search"
              description="Find doctors by symptoms, specialty, or location."
              iconBgColor="#E6F4F4"
              iconColor="#079A9A"
            />
            <FeatureItem 
              icon={<LocationOnRoundedIcon fontSize="large" />}
              title="Nearest Hospitals"
              description="Get recommendations for the nearest hospitals in emergencies."
              iconBgColor="#E8F1FC"
              iconColor="#1976D2"
            />
            <FeatureItem 
              icon={<EventAvailableRoundedIcon fontSize="large" />}
              title="Easy Appointment Booking"
              description="Book appointments online quickly and hassle-free."
              iconBgColor="#F3E5F5"
              iconColor="#9C27B0"
            />
            <FeatureItem 
              icon={<StarRoundedIcon fontSize="large" />}
              title="Trusted Reviews"
              description="Read real reviews and ratings to choose the best care."
              iconBgColor="#FFF4E5"
              iconColor="#ED6C02"
            />
          </Box>

        </Grid>

        {/* Right Side - Authentication Form */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: { xs: 2, sm: 4, md: 8 }
          }}
        >
          {children}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthLayout;
