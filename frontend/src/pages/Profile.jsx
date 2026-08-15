import { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Avatar, Divider,
  Alert, CircularProgress, MenuItem, FormControlLabel, Checkbox,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import userService from '../services/userService';
import doctorService from '../services/doctorService';

const TEAL = '#079A9A';
const DARK = 'var(--mf-text)';
const MUTED = 'var(--mf-muted)';
const BORDER = 'var(--mf-border)';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-card)',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const SPECIALIZATIONS = [
  'GENERAL_PHYSICIAN', 'CARDIOLOGIST', 'DERMATOLOGIST', 'NEUROLOGIST',
  'ORTHOPEDIC', 'PEDIATRICIAN', 'GYNECOLOGIST', 'PSYCHIATRIST',
  'OPHTHALMOLOGIST', 'ENT_SPECIALIST', 'DENTIST', 'GASTROENTEROLOGIST',
  'PULMONOLOGIST', 'UROLOGIST', 'ONCOLOGIST', 'ENDOCRINOLOGIST',
  'NEPHROLOGIST', 'OTHER',
];

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSeverity, setMessageSeverity] = useState('success');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Availability state (doctor only)
  const [workingDays, setWorkingDays] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(30);

  const fetchDoctorProfile = async () => {
    const data = await doctorService.getMyProfile();
    setProfile(data);

    const mapped = {
      firstName: (data.doctorName || '').split(' ')[0] || '',
      lastName: (data.doctorName || '').split(' ').slice(1).join(' '),
      phoneNumber: data.phoneNumber || '',
      email: data.email || user.email,
      specialization: data.specialization || '',
      qualification: data.qualification || '',
      experience: data.experience || '',
      consultationFee: data.consultationFee || '',
      clinicName: data.clinicName || '',
      clinicAddress: data.clinicAddress || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      about: data.about || '',
    };
    reset(mapped);

    // Load availability
    setWorkingDays(
      (data.workingDays || '').split(',').map((d) => d.trim()).filter(Boolean)
    );
    if (data.consultationStartTime) setStartTime(data.consultationStartTime.slice(0, 5));
    if (data.consultationEndTime) setEndTime(data.consultationEndTime.slice(0, 5));
    if (data.appointmentDuration) setDuration(data.appointmentDuration);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user.role === 'DOCTOR') {
          await fetchDoctorProfile();
        } else {
          const data = await userService.getProfile(user.id);
          const nameParts = (data.fullName || user.fullName || '').split(' ');
          const mapped = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' '),
            phoneNumber: data.phone || '',
            email: data.email || user.email,
            gender: data.gender || '',
            dateOfBirth: (data.dateOfBirth || '').slice(0, 10),
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
          };
          reset(mapped);
          setProfile(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setMessage('Unable to load your profile. Please try again.');
        setMessageSeverity('error');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (data) => {
    setSaving(true);
    setMessage('');
    try {
      if (user.role === 'DOCTOR') {
        const payload = {
          doctorName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience ? parseInt(data.experience, 10) : 0,
          consultationFee: data.consultationFee ? parseFloat(data.consultationFee) : 0,
          clinicName: data.clinicName,
          clinicAddress: data.clinicAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          about: data.about,
        };
        await doctorService.updateProfile(payload);
        setMessage('Profile updated successfully!');
        setMessageSeverity('success');
        await fetchDoctorProfile();
      } else {
        const payload = {
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email || null,
          phone: data.phoneNumber,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth || null,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        };
        await userService.updateProfile(user.id, payload);
        setMessage('Profile updated successfully!');
        setMessageSeverity('success');
        setProfile({ ...profile, ...payload });
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile. Please try again.');
      setMessageSeverity('error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    setMessage('');
    try {
      await doctorService.updateProfile({
        workingDays: workingDays.join(','),
        consultationStartTime: startTime,
        consultationEndTime: endTime,
        appointmentDuration: parseInt(duration, 10),
      });
      setMessage('Availability saved successfully!');
      setMessageSeverity('success');
      await fetchDoctorProfile();
    } catch (err) {
      console.error(err);
      setMessage('Failed to save availability. Please try again.');
      setMessageSeverity('error');
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Profile not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Typography variant="h5" fontWeight={800} color={DARK} mb={3}>
        My Profile
      </Typography>

      {message && (
        <Alert severity={messageSeverity} sx={{ mb: 3, borderRadius: 2 }}>
          {message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
        {/* Profile form */}
        <Paper elevation={0} sx={{ flex: 1, minWidth: 0, p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} mb={3}>
            <Avatar
              src={profile.profileImage || undefined}
              sx={{ width: 96, height: 96, mb: 2, bgcolor: TEAL, fontSize: 40 }}
            >
              <PersonIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={800} color={DARK} sx={{ textAlign: 'center' }}>
              {user.role === 'DOCTOR' && profile.doctorName ? 'Dr. ' : ''}
              {profile.firstName || ''} {profile.lastName || ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.email || user.email}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                fullWidth label="First Name"
                {...register('firstName', { required: 'First name is required' })}
                error={!!errors.firstName} helperText={errors.firstName?.message}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />
              <TextField
                fullWidth label="Last Name"
                {...register('lastName', { required: 'Last name is required' })}
                error={!!errors.lastName} helperText={errors.lastName?.message}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />
              <TextField
                fullWidth label="Phone Number"
                {...register('phoneNumber')}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />
              <TextField
                fullWidth type="email" label="Email (Optional)"
                {...register('email')}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />

              {user.role === 'PATIENT' && (
                <>
                  <TextField
                    fullWidth label="Gender" select
                    {...register('gender')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth type="date" label="Date of Birth"
                    {...register('dateOfBirth')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Address"
                    {...register('address')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                </>
              )}

              {user.role === 'DOCTOR' && (
                <>
                  <TextField
                    fullWidth label="Specialization" select
                    {...register('specialization', { required: 'Specialization is required' })}
                    error={!!errors.specialization} helperText={errors.specialization?.message}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <MenuItem key={s} value={s}>{titleCase(s.replace(/_/g, ' '))}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth label="Qualification" placeholder="e.g. MBBS, MD"
                    {...register('qualification')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Experience (Years)" type="number"
                    {...register('experience')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Consultation Fee (₹)" type="number"
                    {...register('consultationFee')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Clinic / Hospital Name"
                    {...register('clinicName')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Clinic Address"
                    {...register('clinicAddress')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="City" {...register('city')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="State" {...register('state')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <TextField
                    fullWidth label="Pincode" {...register('pincode')}
                    slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                  />
                  <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                    <TextField
                      fullWidth multiline rows={3} label="About"
                      {...register('about')}
                      slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
                    />
                  </Box>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }} mt={3}>
              <Button
                type="submit" variant="contained" size="large" disabled={saving}
                sx={{
                  px: 5, borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                  bgcolor: TEAL, boxShadow: '0 6px 16px rgba(7,154,154,0.3)',
                  '&:hover': { bgcolor: '#068A8A' },
                  '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' },
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Availability management (doctor only) */}
        {user.role === 'DOCTOR' && (
          <Paper elevation={0} sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0, p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5} mb={0.5}>
              <ScheduleIcon sx={{ color: TEAL }} />
              <Typography variant="h6" fontWeight={800} color={DARK}>
                Availability
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Set your working days and hours. Patients can only book the slots you make available.
            </Typography>

            <Typography variant="subtitle2" fontWeight={700} color={DARK} mb={1}>
              Working Days
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 2.5 }}>
              {WEEKDAYS.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      size="small"
                      checked={workingDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      sx={{ '&.Mui-checked': { color: TEAL } }}
                    />
                  }
                  label={titleCase(day)}
                  sx={{ '& .MuiTypography-root': { fontSize: '0.85rem', color: DARK } }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
              <TextField
                type="time" label="Start Time"
                value={startTime} onChange={(e) => setStartTime(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />
              <TextField
                type="time" label="End Time"
                value={endTime} onChange={(e) => setEndTime(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} sx={inputSx}
              />
            </Box>

            <Typography variant="subtitle2" fontWeight={700} color={DARK} mb={1}>
              Appointment Duration
            </Typography>
            <TextField
              select fullWidth value={duration} onChange={(e) => setDuration(e.target.value)}
              sx={inputSx}
            >
              {[15, 30, 45, 60, 90].map((m) => (
                <MenuItem key={m} value={m}>{m} minutes</MenuItem>
              ))}
            </TextField>

            <Button
              fullWidth variant="contained" disabled={savingAvailability} onClick={saveAvailability}
              sx={{
                mt: 3, py: 1.4, borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                bgcolor: TEAL, boxShadow: '0 6px 16px rgba(7,154,154,0.3)',
                '&:hover': { bgcolor: '#068A8A' },
                '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' },
              }}
            >
              {savingAvailability ? 'Saving...' : 'Save Availability'}
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Profile;
