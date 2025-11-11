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

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, './public')));

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
    initializeSampleData();
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

// Enhanced symptom to specialty mapping
const symptomMapping = {
    'fever': ['General Practice', 'Pediatrics'],
    'cold': ['General Practice', 'Pediatrics'],
    'cough': ['General Practice', 'Pediatrics', 'Pulmonology'],
    'chest pain': ['Cardiology', 'General Practice'],
    'heart': ['Cardiology'],
    'lung': ['Pulmonology', 'General Practice'],
    'lungs': ['Pulmonology', 'General Practice'],
    'breathing': ['Pulmonology', 'General Practice'],
    'headache': ['General Practice', 'Neurology'],
    'sore throat': ['General Practice', 'Pediatrics', 'ENT'],
    'flu': ['General Practice', 'Pediatrics'],
    'fatigue': ['General Practice', 'Endocrinology'],
    'skin': ['Dermatology'],
    'rash': ['Dermatology'],
    'acne': ['Dermatology'],
    'bone': ['Orthopedics'],
    'joint': ['Orthopedics'],
    'muscle': ['Orthopedics'],
    'child': ['Pediatrics'],
    'children': ['Pediatrics'],
    'kid': ['Pediatrics'],
    'stomach': ['Gastroenterology', 'General Practice'],
    'digestive': ['Gastroenterology'],
    'mental': ['Psychiatry'],
    'depression': ['Psychiatry'],
    'anxiety': ['Psychiatry'],
    'brain': ['Neurology'],
    'nerve': ['Neurology']
};

// Initialize sample data
async function initializeSampleData() {
    try {
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            console.log('Initializing sample doctors...');
            
            const sampleDoctors = [
                {
                    name: "Dr. Sarah Johnson",
                    specialty: "General Practice",
                    email: "s.johnson@hospital.com",
                    phone: "+1 (555) 123-4567",
                    address: "123 Medical Center Dr",
                    city: "New York",
                    lat: 40.7128,
                    lng: -74.0060,
                    bio: "Experienced general practitioner with 10+ years of experience in family medicine and preventive care. Specializes in routine check-ups, vaccinations, and managing chronic conditions like diabetes and hypertension. Committed to providing comprehensive healthcare for the whole family.",
                    education: "MD from Harvard Medical School, Board Certified in Family Medicine",
                    experience: 10,
                    rating: 4.8,
                    reviewCount: 24
                },
                {
                    name: "Dr. Michael Chen",
                    specialty: "Cardiology",
                    email: "m.chen@cardiac.com",
                    phone: "+1 (555) 234-5678",
                    address: "456 Heart Center Blvd",
                    city: "New York",
                    lat: 40.7215,
                    lng: -74.0090,
                    bio: "Cardiologist specializing in heart disease prevention and treatment. Expert in cardiac catheterization, echocardiography, and managing hypertension and heart failure. Passionate about helping patients maintain cardiovascular health through lifestyle changes and advanced treatments.",
                    education: "MD from Johns Hopkins University, Fellowship in Cardiology",
                    experience: 15,
                    rating: 4.9,
                    reviewCount: 31
                },
                {
                    name: "Dr. Emily Rodriguez",
                    specialty: "Pediatrics",
                    email: "e.rodriguez@childrensclinic.com",
                    phone: "+1 (555) 345-6789",
                    address: "789 Pediatric Center",
                    city: "Brooklyn",
                    lat: 40.6782,
                    lng: -73.9442,
                    bio: "Pediatrician with a passion for child healthcare. Specializes in child development, vaccinations, and treating common childhood illnesses like ear infections, asthma, and allergies. Believes in building strong relationships with both children and parents.",
                    education: "MD from Stanford University, Pediatric Board Certified",
                    experience: 8,
                    rating: 4.7,
                    reviewCount: 18
                },
                {
                    name: "Dr. James Wilson",
                    specialty: "Dermatology",
                    email: "j.wilson@skincare.com",
                    phone: "+1 (555) 456-7890",
                    address: "321 Skin Health Center",
                    city: "Manhattan",
                    lat: 40.7589,
                    lng: -73.9851,
                    bio: "Dermatologist specializing in skin cancer prevention, acne treatment, and cosmetic dermatology. Expert in managing eczema, psoriasis, and other skin conditions. Committed to providing comprehensive skin care with the latest treatments.",
                    education: "MD from Yale School of Medicine, Dermatology Residency",
                    experience: 12,
                    rating: 4.6,
                    reviewCount: 22
                },
                {
                    name: "Dr. Lisa Thompson",
                    specialty: "Orthopedics",
                    email: "l.thompson@boneandjoint.com",
                    phone: "+1 (555) 567-8901",
                    address: "654 Orthopedic Center",
                    city: "Queens",
                    lat: 40.7282,
                    lng: -73.7949,
                    bio: "Orthopedic surgeon specializing in sports injuries, joint replacements, and fracture care. Expert in arthroscopic surgery and treating conditions like arthritis and back pain. Dedicated to helping patients regain mobility and return to active lifestyles.",
                    education: "MD from Columbia University, Orthopedic Surgery Fellowship",
                    experience: 14,
                    rating: 4.8,
                    reviewCount: 27
                },
                {
                    name: "Dr. Robert Kim",
                    specialty: "Neurology",
                    email: "r.kim@neurocare.com",
                    phone: "+1 (555) 678-9012",
                    address: "987 Neurology Associates",
                    city: "Boston",
                    lat: 42.3601,
                    lng: -71.0589,
                    bio: "Neurologist specializing in headache disorders, epilepsy, and stroke prevention. Expert in diagnosing and treating conditions like migraines, multiple sclerosis, and Parkinson's disease. Focuses on personalized treatment plans for neurological health.",
                    education: "MD from University of California, Neurology Residency",
                    experience: 11,
                    rating: 4.7,
                    reviewCount: 19
                },
                {
                    name: "Dr. Maria Garcia",
                    specialty: "Psychiatry",
                    email: "m.garcia@mentalwellness.com",
                    phone: "+1 (555) 789-0123",
                    address: "147 Mental Health Plaza",
                    city: "Chicago",
                    lat: 41.8781,
                    lng: -87.6298,
                    bio: "Psychiatrist specializing in depression, anxiety disorders, and stress management. Provides both medication management and psychotherapy. Committed to reducing mental health stigma and providing compassionate care.",
                    education: "MD from University of Chicago, Psychiatry Residency",
                    experience: 9,
                    rating: 4.9,
                    reviewCount: 33
                }
            ];

            await Doctor.insertMany(sampleDoctors);
            console.log('Sample doctors initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Helper function to generate random coordinates
function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

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
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, type } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check type if provided
        if (type && user.type !== type) {
            return res.status(400).json({ error: `User is not a ${type}` });
        }
        
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.type
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Doctors - FIXED ROUTE ORDER: search route must come before :id route
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: 'Server error fetching doctors' });
    }
});

// FIXED: Search route moved BEFORE the :id route to avoid conflict
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
        }
        
        // Build rating filter
        if (rating && rating !== '0') {
            query.rating = { $gte: parseFloat(rating) };
        }
        
        // Build location filter
        if (location && location.trim() !== '') {
            query.$or = [
                { city: new RegExp(location, 'i') },
                { address: new RegExp(location, 'i') }
            ];
        }
        
        // Enhanced symptoms search with symptom mapping
        if (symptoms && symptoms.trim() !== '') {
            const symptomsLower = symptoms.toLowerCase().trim();
            console.log('🤒 Searching for symptoms:', symptomsLower);
            
            // Get specialties from symptom mapping
            let suggestedSpecialties = [];
            Object.keys(symptomMapping).forEach(symptom => {
                if (symptomsLower.includes(symptom)) {
                    suggestedSpecialties = [...suggestedSpecialties, ...symptomMapping[symptom]];
                }
            });
            
            // Remove duplicates
            suggestedSpecialties = [...new Set(suggestedSpecialties)];
            
            console.log('🎯 Suggested specialties:', suggestedSpecialties);
            
            // Create search conditions
            const symptomsConditions = {
                $or: [
                    { bio: new RegExp(symptoms, 'i') },
                    { specialty: new RegExp(symptoms, 'i') },
                    { education: new RegExp(symptoms, 'i') },
                    { name: new RegExp(symptoms, 'i') }
                ]
            };
            
            // Add suggested specialties to search
            if (suggestedSpecialties.length > 0) {
                symptomsConditions.$or.push({
                    specialty: { $in: suggestedSpecialties.map(s => new RegExp(s, 'i')) }
                });
            }
            
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
        }
        
        console.log('🎯 FINAL QUERY:', JSON.stringify(query, null, 2));
        
        const doctors = await Doctor.find(query);
        console.log(`✅ Found ${doctors.length} doctors`);
        
        res.json(doctors);
    } catch (error) {
        console.error('💥 Search error:', error);
        res.status(500).json({ error: 'Server error during search: ' + error.message });
    }
});

// Get single doctor by ID - MOVED AFTER search route
app.get('/api/doctors/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid doctor ID format' });
        }

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        console.error('Get doctor by ID error:', error);
        res.status(500).json({ error: 'Server error fetching doctor' });
    }
});

app.post('/api/doctors', async (req, res) => {
    try {
        const doctorData = req.body;
        
        // Check if doctor already exists with this email
        const existingDoctor = await Doctor.findOne({ email: doctorData.email });
        if (existingDoctor) {
            return res.status(400).json({ error: 'Doctor with this email already exists' });
        }
        
        const doctor = new Doctor(doctorData);
        await doctor.save();
        res.json(doctor);
    } catch (error) {
        console.error('Create doctor error:', error);
        res.status(500).json({ error: 'Server error creating doctor' });
    }
});

app.put('/api/doctors/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid doctor ID format' });
        }

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
        console.error('Update doctor error:', error);
        res.status(500).json({ error: 'Server error updating doctor' });
    }
});

// Reviews
app.get('/api/reviews/doctor/:doctorId', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID format' });
        }

        const reviews = await Review.find({ doctorId: req.params.doctorId })
            .sort({ date: -1 });
        res.json(reviews);
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Server error fetching reviews' });
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
        res.status(500).json({ error: 'Server error submitting review' });
    }
});

// Appointments
app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID format' });
        }

        const appointments = await Appointment.find({ 
            doctorId: req.params.doctorId 
        }).sort({ date: -1, time: -1 });
        res.json(appointments);
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({ error: 'Server error fetching appointments' });
    }
});

app.get('/api/appointments/user/:userId', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const appointments = await Appointment.find({ 
            patientId: req.params.userId 
        }).sort({ date: -1, time: -1 });
        res.json(appointments);
    } catch (error) {
        console.error('Get user appointments error:', error);
        res.status(500).json({ error: 'Server error fetching appointments' });
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
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Server error creating appointment' });
    }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid appointment ID format' });
        }

        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ error: 'Server error updating appointment' });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid appointment ID format' });
        }

        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({ error: 'Server error deleting appointment' });
    }
});

// Serve frontend - catch all handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access the application at http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB URI: ${MONGODB_URI}`);
});