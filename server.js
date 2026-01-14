require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, './public')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medifind';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('MongoDB connected successfully');
  initializeSampleData();
})
.catch((error) => {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
});


mongoose.connection.on("error", err => {
  console.error("MongoDB runtime error:", err);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected (production)");
});


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

async function initializeSampleData() {
    try {
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            console.log('Initializing sample doctors...');
            
            const sampleDoctors = [
                {
                    name: "Dr. Arjun Kumar",
                    specialty: "General Practice",
                    email: "arjunkumar@hospital.com",
                    phone: "+91 9876 54321",
                    address: "123 Medical Center Dr",
                    city: "Hyderabad",
                    lat: 40.7128,
                    lng: -74.0060,
                    bio: "Experienced general practitioner with 10+ years of experience in family medicine and preventive care. Specializes in routine check-ups, vaccinations, and managing chronic conditions like diabetes and hypertension. Committed to providing comprehensive healthcare for the whole family.",
                    education: "MD from Harvard Medical School, Board Certified in Family Medicine",
                    experience: 10,
                    rating: 4.8,
                    reviewCount: 24
                },
                {
                    name: "Dr. Prashanth",
                    specialty: "Cardiology",
                    email: "m.prashanth@cardiac.com",
                    phone: "+91 98447 74732",
                    address: "456 Heart Center Blvd",
                    city: "Delhi",
                    lat: 40.7215,
                    lng: -74.0090,
                    bio: "Cardiologist specializing in heart disease prevention and treatment. Expert in cardiac catheterization, echocardiography, and managing hypertension and heart failure. Passionate about helping patients maintain cardiovascular health through lifestyle changes and advanced treatments.",
                    education: "MD from Johns Hopkins University, Fellowship in Cardiology",
                    experience: 15,
                    rating: 4.9,
                    reviewCount: 31
                },
                {
                    name: "Dr. Anand rao",
                    specialty: "Pediatrics",
                    email: "rao.anand@childrensclinic.com",
                    phone: "+91 84746 93746",
                    address: "789 Pediatric Center",
                    city: "Hyderabad",
                    lat: 40.6782,
                    lng: -73.9442,
                    bio: "Pediatrician with a passion for child healthcare. Specializes in child development, vaccinations, and treating common childhood illnesses like ear infections, asthma, and allergies. Believes in building strong relationships with both children and parents.",
                    education: "MD from Stanford University, Pediatric Board Certified",
                    experience: 8,
                    rating: 4.7,
                    reviewCount: 18
                },
            ];

            await Doctor.insertMany(sampleDoctors);
            console.log('Sample doctors initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
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
        
        const user = await User.findOne({ email, type });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: 'Server error fetching doctors' });
    }
});

app.get('/api/doctors/search', async (req, res) => {
    try {
        const { symptoms, location, specialty, rating } = req.query;
        
        console.log('SEARCH PARAMETERS RECEIVED:', { 
            symptoms, 
            location, 
            specialty, 
            rating 
        });
        
        let query = {};
        
        if (specialty && specialty !== 'all') {
            query.specialty = new RegExp(specialty, 'i');
        }
        
        if (rating && rating !== '0') {
            query.rating = { $gte: parseFloat(rating) };
        }
        
        if (location && location.trim() !== '') {
            query.$or = [
                { city: new RegExp(location, 'i') },
                { address: new RegExp(location, 'i') }
            ];
        }
        
        if (symptoms && symptoms.trim() !== '') {
            const symptomsLower = symptoms.toLowerCase().trim();
            console.log('Searching for symptoms:', symptomsLower);
            
            let suggestedSpecialties = [];
            Object.keys(symptomMapping).forEach(symptom => {
                if (symptomsLower.includes(symptom)) {
                    suggestedSpecialties = [...suggestedSpecialties, ...symptomMapping[symptom]];
                }
            });
            
            suggestedSpecialties = [...new Set(suggestedSpecialties)];
            
            console.log('Suggested specialties:', suggestedSpecialties);
            
            const symptomsConditions = {
                $or: [
                    { bio: new RegExp(symptoms, 'i') },
                    { specialty: new RegExp(symptoms, 'i') },
                    { education: new RegExp(symptoms, 'i') },
                    { name: new RegExp(symptoms, 'i') }
                ]
            };
            
            if (suggestedSpecialties.length > 0) {
                symptomsConditions.$or.push({
                    specialty: { $in: suggestedSpecialties.map(s => new RegExp(s, 'i')) }
                });
            }
            
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        symptomsConditions
                    ]
                };
            } else {
                query = symptomsConditions;
            }
        }
        
        console.log('FINAL QUERY:', JSON.stringify(query, null, 2));
        
        const doctors = await Doctor.find(query);
        console.log(`Found ${doctors.length} doctors`);
        
        res.json(doctors);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error during search: ' + error.message });
    }
});

app.get('/api/doctors/:id', async (req, res) => {
    try {
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

app.get('/api/reviews/doctor/:doctorId', async (req, res) => {
    try {
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
        
        if (!doctorId || !reviewer || !rating || !comment) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
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

app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    try {
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
    console.log(`MongoDB URI: ${MONGODB_URI}`);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});