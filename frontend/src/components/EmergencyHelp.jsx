import { useState } from 'react';
import { Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, CircularProgress, Alert, Paper } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import emergencyService from '../services/emergencyService';
import hospitalService from '../services/hospitalService';

const EmergencyHelp = () => {
  const [open, setOpen] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!symptom) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setNearestHospital(null);

    try {
      // Note: Assuming emergencyService.checkEmergency returns an object with a boolean like 'isEmergency' or similar based on backend implementation
      const res = await emergencyService.checkEmergency(symptom);
      
      // Adapt this check based on the actual backend response format
      const isEmergency = res.isEmergency !== undefined ? res.isEmergency : (res.requiresEmergency !== undefined ? res.requiresEmergency : true); 
      setResult({ ...res, isEmergency });

      if (isEmergency) {
        findNearestHospital();
      }
    } catch (err) {
      console.error(err);
      setError('Could not process triage request.');
    } finally {
      setLoading(false);
    }
  };

  const findNearestHospital = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const hospital = await hospitalService.getNearest(latitude, longitude);
            setNearestHospital(hospital);
          } catch (err) {
            console.error("Failed to fetch nearest hospital", err);
            // Fallback: tell user to search hospitals
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Location access denied or unavailable. Please manually search for hospitals.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <>
      <Fab 
        color="error" 
        aria-label="emergency" 
        sx={{ 
          position: 'fixed', 
          bottom: 32, 
          right: 32, 
          zIndex: 1000,
          animation: 'pulse 2s infinite',
          boxShadow: '0 4px 20px rgba(211,47,47,0.5)'
        }}
        onClick={() => setOpen(true)}
      >
        <WarningAmberIcon fontSize="large" />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1} color="error.main">
            <WarningAmberIcon fontSize="large" />
            <Typography variant="h5" fontWeight={700}>Emergency Triage</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" paragraph mt={2}>
            Describe your symptoms. This is NOT a medical diagnosis system. In a true medical emergency, please call your local emergency services immediately.
          </Typography>
          
          <form onSubmit={handleCheck}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="E.g., Severe chest pain and shortness of breath..."
              variant="outlined"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="error" 
              fullWidth 
              size="large"
              disabled={loading || !symptom}
              sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Evaluate Symptoms'}
            </Button>
          </form>

          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

          {result && (
            <Box mt={4} p={3} bgcolor={result.isEmergency ? '#ffebee' : '#e8f5e9'} borderRadius={3}>
              <Typography variant="h6" color={result.isEmergency ? "error.main" : "success.main"} fontWeight={700} gutterBottom>
                {result.isEmergency ? "CRITICAL: SEEK IMMEDIATE CARE" : "NON-CRITICAL"}
              </Typography>
              <Typography variant="body1">
                {result.recommendation || result.message || "Please proceed to the nearest emergency room if you feel your condition is life-threatening."}
              </Typography>
            </Box>
          )}

          {nearestHospital && (
            <Paper elevation={3} sx={{ mt: 3, p: 3, borderLeft: '6px solid #d32f2f' }}>
              <Box display="flex" alignItems="center" gap={1} mb={2} color="#d32f2f">
                <LocalHospitalIcon />
                <Typography variant="h6" fontWeight={700}>Nearest Emergency Hospital</Typography>
              </Box>
              <Typography variant="h6">{nearestHospital.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>{nearestHospital.address}, {nearestHospital.city}</Typography>
              <Typography variant="body1" fontWeight={600} mb={2}>Phone: {nearestHospital.phone || nearestHospital.phoneNumber}</Typography>
              
              <Button 
                variant="outlined" 
                color="error" 
                fullWidth
                onClick={() => window.open(`https://maps.google.com/?q=${nearestHospital.latitude},${nearestHospital.longitude}`, '_blank')}
              >
                View on Map
              </Button>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} size="large" sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmergencyHelp;
