const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent public folder
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medifind';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// MongoDB Schemas and Models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['customer', 'doctor'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    bio: { type: String, required: true },
    education: { type: String, required: true },
    experience: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    reviewer: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName: { type: String, required: true },
    doctorSpecialty: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    duration: { type: Number, default: 30 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Review = mongoose.model('Review', reviewSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Enhanced symptom to specialty mapping for backend
const symptomMapping = {
    'fever': ['General Practice', 'Pediatrics'],
    'cold': ['General Practice', 'Pediatrics'],
    'cough': ['General Practice', 'Pediatrics'],
    'chest pain': ['Cardiology', 'General Practice'],
    'heart': ['Cardiology'],
    'headache': ['General Practice', 'Neurology'],
    'sore throat': ['General Practice', 'Pediatrics'],
    'flu': ['General Practice', 'Pediatrics'],
    'fatigue': ['General Practice'],
    'skin': ['Dermatology'],
    'rash': ['Dermatology'],
    'acne': ['Dermatology'],
    'bone': ['Orthopedics'],
    'joint': ['Orthopedics'],
    'muscle': ['Orthopedics'],
    'child': ['Pediatrics'],
    'children': ['Pediatrics'],
    'stomach': ['General Practice'],
    'digestive': ['General Practice'],
    'mental': ['Psychiatry'],
    'depression': ['Psychiatry'],
    'anxiety': ['Psychiatry']
};

// API Routes

// User Authentication
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            type
        });
        
        await user.save();
        
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.type
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        
        // Find user
        const user = await User.findOne({ email, type });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.type
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/doctors', async (req, res) => {
    try {
        const doctorData = req.body;
        const doctor = new Doctor(doctorData);
        await doctor.save();
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// FIXED: Completely rewritten search function - SIMPLIFIED AND WORKING
app.get('/api/doctors/search', async (req, res) => {
    try {
        const { symptoms, location, specialty, rating } = req.query;
        
        console.log('🔍 SEARCH PARAMETERS RECEIVED:', { 
            symptoms, 
            location, 
            specialty, 
            rating 
        });
        
        let query = {};
        
        // Build specialty filter
        if (specialty && specialty !== 'all') {
            query.specialty = new RegExp(specialty, 'i');
            console.log('📍 Specialty filter:', query.specialty);
        }
        
        // Build rating filter
        if (rating && rating !== '0') {
            query.rating = { $gte: parseFloat(rating) };
            console.log('⭐ Rating filter:', query.rating);
        }
        
        // Build location filter
        if (location && location.trim() !== '') {
            query.$or = [
                { city: new RegExp(location, 'i') },
                { address: new RegExp(location, 'i') }
            ];
            console.log('🗺️ Location filter:', query.$or);
        }
        
        // FIXED: SIMPLIFIED SYMPTOMS SEARCH - Just search in bio and specialty
        if (symptoms && symptoms.trim() !== '') {
            const symptomsLower = symptoms.toLowerCase().trim();
            console.log('🤒 Searching for symptoms:', symptomsLower);
            
            // Create OR conditions for symptoms search
            const symptomsConditions = {
                $or: [
                    { bio: new RegExp(symptoms, 'i') },
                    { specialty: new RegExp(symptoms, 'i') },
                    { education: new RegExp(symptoms, 'i') }
                ]
            };
            
            // If we already have location conditions, combine with AND
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or }, // Existing location conditions
                        symptomsConditions  // New symptoms conditions
                    ]
                };
            } else {
                // No existing conditions, just use symptoms
                query = symptomsConditions;
            }
            
            console.log('🔧 Final symptoms query:', JSON.stringify(query, null, 2));
        }
        
        console.log('🎯 FINAL QUERY:', JSON.stringify(query, null, 2));
        
        const doctors = await Doctor.find(query);
        console.log(`✅ Found ${doctors.length} doctors`);
        
        // Log doctor names for debugging
        if (doctors.length > 0) {
            console.log('👨‍⚕️ Doctors found:');
            doctors.forEach(doctor => {
                console.log(`   - ${doctor.name} (${doctor.specialty})`);
            });
        } else {
            console.log('❌ No doctors found with current query');
            
            // For debugging, let's see what doctors are available
            const allDoctors = await Doctor.find({});
            console.log(`📊 Total doctors in database: ${allDoctors.length}`);
            allDoctors.forEach(doc => {
                console.log(`   - ${doc.name} (${doc.specialty}) - Bio: ${doc.bio.substring(0, 50)}...`);
            });
        }
        
        res.json(doctors);
    } catch (error) {
        console.error('💥 Search error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.put('/api/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reviews
app.get('/api/reviews/doctor/:doctorId', async (req, res) => {
    try {
        const reviews = await Review.find({ doctorId: req.params.doctorId })
            .sort({ date: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { doctorId, reviewer, rating, comment } = req.body;
        
        // Validate required fields
        if (!doctorId || !reviewer || !rating || !comment) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        const review = new Review({
            doctorId,
            reviewer,
            rating,
            comment
        });
        
        await review.save();
        
        // Update doctor's rating
        const doctorReviews = await Review.find({ doctorId });
        const averageRating = doctorReviews.reduce((sum, rev) => sum + rev.rating, 0) / doctorReviews.length;
        
        await Doctor.findByIdAndUpdate(doctorId, {
            rating: Math.round(averageRating * 10) / 10,
            reviewCount: doctorReviews.length
        });
        
        res.json(review);
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Appointments
app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            doctorId: req.params.doctorId 
        }).sort({ date: -1, time: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/appointments/user/:userId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            patientId: req.params.userId 
        }).sort({ date: -1, time: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const appointmentData = req.body;
        
        // Check if appointment already exists
        const existingAppointment = await Appointment.findOne({
            doctorId: appointmentData.doctorId,
            date: appointmentData.date,
            time: appointmentData.time,
            status: { $ne: 'cancelled' }
        });
        
        if (existingAppointment) {
            return res.status(400).json({ error: 'Time slot already booked' });
        }
        
        const appointment = new Appointment(appointmentData);
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Appointment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve frontend - catch all handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});