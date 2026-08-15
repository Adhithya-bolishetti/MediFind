import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';

const TEAL = '#079A9A';

/**
 * StepItem — one entry of the vertical progress tracker.
 * The active step is highlighted with a teal-tinted card + left border,
 * matching the reference design.
 */
const StepItem = ({ index, step, active, completed }) => {
  const isDone = completed;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        p: 1.5,
        borderRadius: 2.5,
        borderLeft: '3px solid',
        borderLeftColor: active ? TEAL : 'transparent',
        bgcolor: active ? 'rgba(7,154,154,0.08)' : 'transparent',
        transition: 'all 0.25s ease',
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.875rem',
          mt: 0.3,
          bgcolor: active ? TEAL : isDone ? TEAL : 'transparent',
          color: active || isDone ? '#fff' : 'var(--mf-muted)',
          border: active || isDone ? 'none' : '2px solid var(--mf-border)',
          boxShadow: active ? '0 4px 10px rgba(7,154,154,0.3)' : 'none',
        }}
      >
        {isDone ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : index + 1}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: active ? TEAL : 'var(--mf-text)',
          }}
        >
          {step.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'var(--mf-muted)', display: 'block', mt: 0.2 }}
        >
          {step.subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

const ProfileSetupLayout = ({ title, subtitle, steps, activeStep, children, infoPanel }) => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--mf-bg)', py: { xs: 3, md: 5 } }}>
      {/* Top logo bar */}
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box component="img" src="/medifind-logo.png" alt="MediFind" sx={{ width: 64, height: 64, objectFit: 'contain' }} />
          <Typography
            variant="caption"
            sx={{
              color: 'var(--mf-muted)',
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.8rem',
            }}
          >
            You can update these details anytime from your profile.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: { xs: 3, lg: 6 },
            alignItems: 'flex-start',
          }}
        >
          {/* ─────────── Left column: tracker + info ─────────── */}
          <Box
            sx={{
              width: { xs: '100%', lg: 340 },
              flexShrink: 0,
              position: { lg: 'sticky' },
              top: { lg: 24 },
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--mf-text)', mb: 0.75, letterSpacing: '-0.5px' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--mf-muted)', mb: 3 }}>
              {subtitle}
            </Typography>

            {/* Vertical step tracker */}
            <Box
              sx={{
                backgroundColor: 'var(--mf-card)',
                border: '1px solid var(--mf-border)',
                borderRadius: 3.5,
                p: 2,
                boxShadow: '0 6px 24px rgba(16, 27, 54, 0.05)',
              }}
            >
              {steps.map((step, i) => (
                <StepItem
                  key={step.label}
                  index={i}
                  step={step}
                  active={activeStep === i}
                  completed={i < activeStep}
                />
              ))}
            </Box>

            {/* Security note */}
            <Box
              sx={{
                mt: 2.5,
                p: 2.5,
                borderRadius: 3,
                backgroundColor: 'var(--mf-surface)',
                border: '1px solid var(--mf-border)',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <ShieldRoundedIcon sx={{ color: TEAL, mt: 0.3, fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'var(--mf-muted)', lineHeight: 1.45 }}>
                Your information is safe and secure with us.
              </Typography>
            </Box>
          </Box>

          {/* ─────────── Right column: form card ─────────── */}
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Box
              sx={{
                backgroundColor: 'var(--mf-card)',
                border: '1px solid var(--mf-border)',
                borderRadius: 4,
                p: { xs: 2.5, md: 5 },
                boxShadow: '0 10px 40px rgba(16, 27, 54, 0.07)',
                minHeight: 420,
              }}
            >
              {children}
            </Box>

            {infoPanel && (
              <Box sx={{ mt: 3, display: { xs: 'block', lg: 'none' } }}>{infoPanel}</Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ProfileSetupLayout;
