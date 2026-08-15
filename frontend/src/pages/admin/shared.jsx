import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

export const TEAL = '#079A9A';
export const NAVY = '#101B36';
export const MUTED = '#5C6780';
export const BORDER = '#E8EDF2';
export const BG = '#F7F9FC';

const STATUS_STYLES = {
  PENDING: { bg: '#FFF7E6', color: '#B45309' },
  APPROVED: { bg: '#E6F7F5', color: '#0F766E' },
  ACTIVE: { bg: '#E6F7F5', color: '#0F766E' },
  CONFIRMED: { bg: '#E6F7F5', color: '#0F766E' },
  COMPLETED: { bg: '#E6F7F5', color: '#0F766E' },
  REJECTED: { bg: '#FEE2E2', color: '#B91C1C' },
  DECLINED: { bg: '#FEE2E2', color: '#B91C1C' },
  CANCELLED: { bg: '#FEE2E2', color: '#B91C1C' },
  SUSPENDED: { bg: '#F3F4F6', color: '#6B7280' },
  HIDDEN: { bg: '#F3F4F6', color: '#6B7280' },
  FLAGGED: { bg: '#FEF2E6', color: '#C2410C' },
  REPORTED: { bg: '#FEF2E6', color: '#C2410C' },
};

export const StatusChip = ({ status }) => {
  const key = (status || '').toUpperCase();
  const style = STATUS_STYLES[key] || { bg: '#EEF2F7', color: '#475569' };
  return (
    <Chip
      size="small"
      label={(status || '—').replace(/_/g, ' ')}
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, fontSize: '0.72rem', height: 24 }}
    />
  );
};

export const PageHeader = ({ title, subtitle, action }) => (
  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
    <Box>
      <Typography variant="h5" fontWeight={800} color={NAVY}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);

export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const isToday = (d) => {
  if (!d) return false;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
};
