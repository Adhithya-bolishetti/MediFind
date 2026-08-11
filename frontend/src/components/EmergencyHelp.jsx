import { useState } from 'react';
import { Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, CircularProgress, Alert } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import axios from 'axios';

const EmergencyHelp = () => {
  const [open, setOpen] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!symptom) return;
    
    setLoading(true);
    setError('');
    try {
      // The API Gateway routes to doctor-service for recommendations
      // There's a new emergency triage endpoint added in Day 4: /api/doctors/emergency
      const res = await axios.post('http://localhost:8080/api/doctors/emergency', { symptom });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not process triage request.');
    } finally {
      setLoading(false);
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
            Describe your symptoms. This is NOT a medical diagnosis system. In a true medical emergency, please call 911 immediately.
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
            <Box mt={4} p={3} bgcolor={result.requiresEmergency ? '#ffebee' : '#e8f5e9'} borderRadius={3}>
              <Typography variant="h6" color={result.requiresEmergency ? "error.main" : "success.main"} fontWeight={700} gutterBottom>
                {result.requiresEmergency ? "CRITICAL: SEEK IMMEDIATE CARE" : "NON-CRITICAL"}
              </Typography>
              <Typography variant="body1">
                {result.recommendation}
              </Typography>
            </Box>
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
