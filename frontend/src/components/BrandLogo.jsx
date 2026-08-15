import React from 'react';
import { Box } from '@mui/material';

/**
 * MediFind brand logo (official lockup — location-pin icon, wordmark and
 * tagline) served from the public assets folder.
 *
 * The PNG artwork is entirely dark blue/cyan tones, so it is designed for a
 * light surface. This component always renders it on a white rounded chip so
 * the logo stays readable on any background (white sidebar, dark sidebar,
 * the auth page's dark gradient panel, etc.).
 */
const SIZES = {
  lg: 160, // auth page branding panel + mobile view
  md: 140, // sidebar header
  sm: 64,  // profile-setup wizard header
  xs: 52,  // top navbar
};

const BrandLogo = ({ size = 'md' }) => {
  const dim = SIZES[size] || SIZES.md;
  return (
    <Box
      sx={{
        width: dim,
        height: dim,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderRadius: dim * 0.14,
        boxShadow: '0 4px 16px rgba(16, 27, 54, 0.16)',
        border: '1px solid rgba(16, 27, 54, 0.06)',
      }}
    >
      <Box
        component="img"
        src="/medifind-logo.png"
        alt="MediFind"
        draggable={false}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
        }}
      />
    </Box>
  );
};

export default BrandLogo;
