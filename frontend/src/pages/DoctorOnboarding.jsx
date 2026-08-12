import { useState, useContext } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, Container, TextField, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import doctorService from '../services/doctorService';
import { AuthContext } from '../context/AuthContext';

const steps = ['Personal Information', 'Professional Details', 'Upload Documents'];

const DoctorOnboarding = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    if (activeStep === steps.length - 1) {
      try {
        setError('');
        // Step 1: Create Profile
        await doctorService.createProfile({
          ...data,
          doctorName: `${data.firstName} ${data.lastName}`,
        });

        // Step 2: Upload License if provided
        if (file) {
          await doctorService.uploadLicense(file);
        }

        // Step 3: Submit for Verification
        await doctorService.submitProfile();

        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setError('Failed to submit onboarding details.');
      }
    } else {
      handleNext();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Doctor Onboarding
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" mb={4}>
          Complete your profile to start accepting appointments.
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {activeStep === 0 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="First Name" fullWidth {...register('firstName', { required: true })} error={!!errors.firstName} />
              <TextField label="Last Name" fullWidth {...register('lastName', { required: true })} error={!!errors.lastName} />
              <TextField label="Phone Number" fullWidth {...register('phoneNumber', { required: true })} error={!!errors.phoneNumber} />
              <TextField label="Email" fullWidth value={user?.email || ''} disabled />
            </Box>
          )}

          {activeStep === 1 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField select label="Specialization" fullWidth {...register('specialization', { required: true })} defaultValue="GENERAL_MEDICINE">
                <MenuItem value="CARDIOLOGY">Cardiology</MenuItem>
                <MenuItem value="NEUROLOGY">Neurology</MenuItem>
                <MenuItem value="DERMATOLOGY">Dermatology</MenuItem>
                <MenuItem value="ORTHOPEDICS">Orthopedics</MenuItem>
                <MenuItem value="PEDIATRICS">Pediatrics</MenuItem>
                <MenuItem value="GENERAL_MEDICINE">General Medicine</MenuItem>
              </TextField>
              <TextField label="Experience (Years)" type="number" fullWidth {...register('experience', { required: true })} />
              <TextField label="Consultation Fee" type="number" fullWidth {...register('consultationFee', { required: true })} />
              <TextField label="Medical License Number" fullWidth {...register('medicalLicenseNumber', { required: true })} />
              <TextField label="Clinic Name" fullWidth {...register('clinicName')} />
              <TextField label="City" fullWidth {...register('city', { required: true })} />
            </Box>
          )}

          {activeStep === 2 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="h6">Upload Medical License</Typography>
              <Button variant="outlined" component="label">
                Select File
                <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
              </Button>
              {file && <Typography variant="body2">{file.name}</Typography>}
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Button variant="contained" type="submit">
              {activeStep === steps.length - 1 ? 'Finish & Submit' : 'Next'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default DoctorOnboarding;
