import React from 'react';
import { Box, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FeatureItem from './FeatureItem';

const TEAL = '#079A9A';

/**
 * MediFind brand logo (official lockup — location-pin icon, wordmark and
 * tagline) served from the public assets folder.
 */
export const BrandLogo = ({ size = 'md' }) => {
  const dim = size === 'lg' ? 170 : 150;
  return (
    <Box
      component="img"
      src="/medifind-logo.png"
      alt="MediFind"
      width={dim}
      height={dim}
      sx={{ display: 'block', maxWidth: '100%' }}
    />
  );
};

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--mf-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flex: 1, minWidth: 0 }}>
        {/* Left Side — Branding & Features */}
        <Box
          sx={{
            flex: '1 1 50%',
            maxWidth: '50%',
            p: { md: 6, lg: 9 },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            background: 'var(--mf-gradient)',
            position: 'relative',
          }}
        >
          <BrandLogo size="lg" />

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 520, position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: 'var(--mf-text)',
                mb: 5,
                fontSize: { md: '2.25rem', lg: '2.75rem' },
                lineHeight: 1.15,
                letterSpacing: '-1px',
              }}
            >
              Find the Right Doctor.
              <br />
              Get the <Box component="span" sx={{ color: TEAL }}>Right Care.</Box>
            </Typography>

            <FeatureItem
              icon={<SearchRoundedIcon fontSize="large" />}
              title="Smart Doctor Search"
              description="Find doctors by symptoms, specialty, or location."
              iconBgColor="#D9F0EE"
              iconColor={TEAL}
            />
            <FeatureItem
              icon={<LocationOnRoundedIcon fontSize="large" />}
              title="Nearest Hospitals"
              description="Get recommendations for the nearest hospitals in emergencies."
              iconBgColor="#E3EDFB"
              iconColor="#1976D2"
            />
            <FeatureItem
              icon={<EventAvailableRoundedIcon fontSize="large" />}
              title="Easy Appointment Booking"
              description="Book appointments online quickly and hassle-free."
              iconBgColor="#F2E6F8"
              iconColor="#9C27B0"
            />
            <FeatureItem
              icon={<StarRoundedIcon fontSize="large" />}
              title="Trusted Reviews"
              description="Read real reviews and ratings to choose the best care."
              iconBgColor="#FFF1E0"
              iconColor="#ED6C02"
            />
          </Box>
        </Box>

        {/* Right Side — Authentication Form */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', md: '1 1 50%' },
            maxWidth: { xs: '100%', md: '50%' },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 2.5, sm: 5, md: 8 },
            py: { xs: 5, sm: 6, md: 8 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Mobile / tablet logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
              <BrandLogo size="lg" />
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
