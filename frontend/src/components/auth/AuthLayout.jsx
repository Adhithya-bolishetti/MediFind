import React from 'react';
import { Box, Typography } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FeatureItem from './FeatureItem';

const TEAL = '#079A9A';
const DARK = '#101B36';

/**
 * MediFind brand logo — rounded teal square with a medical cross,
 * followed by "Medi" (dark) + "Find" (teal). Used across auth pages.
 */
export const BrandLogo = ({ size = 'md' }) => {
  const box = size === 'lg' ? 46 : 38;
  const icon = size === 'lg' ? 26 : 21;
  const fontSize = size === 'lg' ? 'h5' : 'h6';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: box,
          height: box,
          borderRadius: '12px',
          bgcolor: TEAL,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(7, 154, 154, 0.3)',
          flexShrink: 0,
        }}
      >
        <AddBoxOutlinedIcon sx={{ color: '#fff', fontSize: icon }} />
      </Box>
      <Typography variant={fontSize} component="span" sx={{ fontWeight: 800, color: 'var(--mf-text)', letterSpacing: '-0.5px' }}>
        Medi<span style={{ fontWeight: 500, color: TEAL }}>Find</span>
      </Typography>
    </Box>
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
      {/* Decorative background */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(7,154,154,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -140,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(7,154,154,0.07), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

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
          {/* Decorative shapes inside the panel */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 80,
              left: -80,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'rgba(7,154,154,0.05)',
            }}
          />

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
