import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, IconButton, Chip, Alert,
} from '@mui/material';
import { useToast } from '../context/ToastContext';
import hospitalService from '../services/hospitalService';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import StarIcon from '@mui/icons-material/Star';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';
const MAX_IMAGES = 10;

const HospitalImages = () => {
  const { showToast } = useToast();
  const [hospital, setHospital] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const p = await hospitalService.getMyProfile();
      setHospital(p);
      setImages(p.images || []);
    } catch {
      setError('Unable to load hospital images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setError('');
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const hospitalId = hospital.id;
    let room = MAX_IMAGES - images.length;

    for (const file of files) {
      if (room <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        break;
      }
      if (!okTypes.includes(file.type)) {
        setError('Only JPG, PNG and WEBP images are supported.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be smaller than 5MB.');
        continue;
      }
      room -= 1;
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      setSaving(true);
      try {
        await hospitalService.addImage(hospitalId, dataUrl);
      } catch (err) {
        setError(err.response?.data?.message || 'Image upload failed.');
      } finally {
        setSaving(false);
      }
    }
    e.target.value = '';
    await load();
  };

  const handleRemove = async (imageId) => {
    if (!window.confirm('Remove this image from your hospital profile?')) return;
    setSaving(true);
    try {
      await hospitalService.deleteImage(imageId);
      showToast('Image removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove image.');
    } finally {
      setSaving(false);
      await load();
    }
  };

  const handleReplace = async (imageId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG and WEBP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    setSaving(true);
    try {
      await hospitalService.replaceImage(imageId, dataUrl);
      showToast('Image replaced.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to replace image.');
    } finally {
      setSaving(false);
      await load();
    }
    e.target.value = '';
  };

  const move = async (index, dir) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    setSaving(true);
    try {
      await hospitalService.reorderImages(hospital.id, next.map((img) => img.id));
      await load();
    } catch (err) {
      setError('Unable to reorder images.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Typography variant="h5" fontWeight={800} color={NAVY} mb={0.5}>Hospital Images</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload up to 10 images of your hospital, facilities, departments, rooms, or other areas.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color={NAVY}>
              {images.length}/{MAX_IMAGES} images
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG, WEBP · Max 5MB each
            </Typography>
          </Box>
          <Box component="label" sx={{ cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer' }}>
            <input type="file" hidden multiple disabled={images.length >= MAX_IMAGES} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleUpload} />
            <Button
              component="span"
              variant="contained"
              disabled={images.length >= MAX_IMAGES || saving}
              startIcon={<AddPhotoAlternateOutlinedIcon />}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, fontWeight: 700, '&:hover': { bgcolor: '#068A8A' } }}
            >
              {images.length >= MAX_IMAGES ? 'Maximum 10 Images' : 'Upload Images'}
            </Button>
          </Box>
        </Box>

        {images.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed var(--mf-border)', borderRadius: 3 }}>
            <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 48, color: 'var(--mf-border)', mb: 1.5 }} />
            <Typography variant="body1" color="text.secondary">No images uploaded yet.</Typography>
            <Typography variant="caption" color="text.secondary">Upload photos to make your hospital stand out.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)' }, gap: 2 }}>
            {images.map((img, i) => (
              <Box key={img.id} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--mf-border)', position: 'relative', bgcolor: 'var(--mf-surface)' }}>
                <Box
                  component="img"
                  src={img.imageUrl}
                  alt={`Hospital image ${i + 1}`}
                  sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                />
                {i === 0 && (
                  <Chip icon={<StarIcon sx={{ fontSize: 12 }} />} label="Cover" size="small" sx={{ position: 'absolute', top: 6, left: 6, height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: TEAL, color: '#fff' }} />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.75 }}>
                  <IconButton size="small" disabled={i === 0 || saving} onClick={() => move(i, -1)} sx={{ color: 'var(--mf-muted)' }} title="Move left">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" disabled={i === images.length - 1 || saving} onClick={() => move(i, 1)} sx={{ color: 'var(--mf-muted)' }} title="Move right">
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ flex: 1 }} />
                  <Box component="label" sx={{ cursor: 'pointer' }}>
                    <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => handleReplace(img.id, e)} />
                    <Button component="span" size="small" sx={{ textTransform: 'none', fontSize: '0.7rem', color: TEAL, fontWeight: 700, minWidth: 0 }}>
                      Replace
                    </Button>
                  </Box>
                  <IconButton size="small" onClick={() => handleRemove(img.id)} disabled={saving} sx={{ color: '#EF4444' }} title="Remove">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 2.5 }}>
          Images are optional. Your hospital can be listed without any photos.
        </Typography>
      </Paper>
    </Box>
  );
};

export default HospitalImages;
