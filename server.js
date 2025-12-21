require('dotenv').config();

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
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    initializeSampleData();
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('Please check your MongoDB connection string');
});

// MongoDB Schemas and Models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['customer', 'doctor', 'medical_shop'], required: true },
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

const medicalShopSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalShop', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalShop', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    orderDate: { type: Date, default: Date.now },
    orderNumber: { type: String, unique: true }
});

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Review = mongoose.model('Review', reviewSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const MedicalShop = mongoose.model('MedicalShop', medicalShopSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Symptom to specialty mapping
const symptomMapping = {
    'fever': ['General Practice', 'Pediatrics'],
    'cold': ['General Practice', 'Pediatrics'],
    'cough': ['General Practice', 'Pediatrics', 'Pulmonology'],
    'chest pain': ['Cardiology', 'General Practice'],
    'headache': ['General Practice', 'Neurology'],
    'sore throat': ['General Practice', 'Pediatrics', 'ENT'],
    'flu': ['General Practice', 'Pediatrics'],
    'fatigue': ['General Practice', 'Endocrinology'],
    'stomach': ['Gastroenterology', 'General Practice'],
    'allergy': ['General Practice', 'Immunology'],
    'diarrhea': ['Gastroenterology', 'General Practice'],
    'constipation': ['Gastroenterology', 'General Practice'],
    'skin': ['Dermatology'],
    'rash': ['Dermatology'],
    'joint': ['Orthopedics', 'Rheumatology'],
    'back pain': ['Orthopedics', 'Physiotherapy'],
    'anxiety': ['Psychiatry', 'Psychology'],
    'depression': ['Psychiatry', 'Psychology']
};

// Initialize sample data
async function initializeSampleData() {
    try {
        // Check and initialize sample doctors
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
                    bio: "Experienced general practitioner with 10+ years of experience in family medicine.",
                    education: "MD from Harvard Medical School",
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
                    bio: "Cardiologist specializing in heart disease prevention and treatment.",
                    education: "MD from Johns Hopkins University",
                    experience: 15,
                    rating: 4.9,
                    reviewCount: 31
                }
            ];

            await Doctor.insertMany(sampleDoctors);
            console.log('✅ Sample doctors initialized successfully');
        }

        // Check and initialize sample medical shops
        const shopCount = await MedicalShop.countDocuments();
        if (shopCount === 0) {
            console.log('Initializing sample medical shops...');
            
            const sampleShops = [
                {
                    shopName: "City Medical Pharmacy",
                    ownerName: "Rajesh Kumar",
                    email: "rajesh@pharmacy.com",
                    phone: "+1 (555) 987-6543",
                    address: "456 Health Street",
                    city: "New York",
                    lat: 40.7306,
                    lng: -73.9352,
                    licenseNumber: "PH123456",
                    ownerId: new mongoose.Types.ObjectId(),
                    rating: 4.5,
                    reviewCount: 15
                },
                {
                    shopName: "Central Medicine Store",
                    ownerName: "Priya Sharma",
                    email: "priya@centralmed.com",
                    phone: "+1 (555) 876-5432",
                    address: "789 Medical Plaza",
                    city: "Brooklyn",
                    lat: 40.6782,
                    lng: -73.9442,
                    licenseNumber: "PH789012",
                    ownerId: new mongoose.Types.ObjectId(),
                    rating: 4.2,
                    reviewCount: 8
                },
                {
                    shopName: "Green Cross Pharmacy",
                    ownerName: "Amit Patel",
                    email: "amit@greencross.com",
                    phone: "+1 (555) 765-4321",
                    address: "321 Wellness Road",
                    city: "Queens",
                    lat: 40.7282,
                    lng: -73.7949,
                    licenseNumber: "PH345678",
                    ownerId: new mongoose.Types.ObjectId(),
                    rating: 4.7,
                    reviewCount: 22
                }
            ];

            await MedicalShop.insertMany(sampleShops);
            console.log('✅ Sample medical shops initialized successfully');
        }

    } catch (error) {
        console.error('❌ Error initializing sample data:', error);
    }
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==================== API ROUTES ====================

// User Authentication
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
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
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

// ==================== DOCTORS ROUTES ====================

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
        const { symptoms, location, specialty, rating, sort } = req.query;
        
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
            
            let suggestedSpecialties = [];
            Object.keys(symptomMapping).forEach(symptom => {
                if (symptomsLower.includes(symptom)) {
                    suggestedSpecialties = [...suggestedSpecialties, ...symptomMapping[symptom]];
                }
            });
            
            suggestedSpecialties = [...new Set(suggestedSpecialties)];
            
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
        
        let doctors = await Doctor.find(query);
        
        // Apply sorting
        if (sort === 'name-asc') {
            doctors.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'rating-desc') {
            doctors.sort((a, b) => b.rating - a.rating);
        }
        
        res.json(doctors);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error during search' });
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

// ==================== REVIEWS ROUTES ====================

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

// ==================== APPOINTMENTS ROUTES ====================

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

// ==================== MEDICAL SHOP ROUTES ====================

app.post('/api/medicalshops/register', async (req, res) => {
    try {
        const { shopName, ownerName, email, phone, address, city, lat, lng, licenseNumber, ownerId } = req.body;
        
        const existingShop = await MedicalShop.findOne({ licenseNumber });
        if (existingShop) {
            return res.status(400).json({ error: 'Shop with this license already exists' });
        }
        
        const existingShopByEmail = await MedicalShop.findOne({ email });
        if (existingShopByEmail) {
            return res.status(400).json({ error: 'Shop with this email already exists' });
        }
        
        const medicalShop = new MedicalShop({
            shopName,
            ownerName,
            email,
            phone,
            address,
            city,
            lat,
            lng,
            licenseNumber,
            ownerId
        });
        
        await medicalShop.save();
        res.json(medicalShop);
    } catch (error) {
        console.error('Medical shop registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.get('/api/medicalshops', async (req, res) => {
    try {
        const { search, sort, lat, lng } = req.query;
        
        let query = {};
        
        if (search && search.trim() !== '') {
            query.shopName = new RegExp(search, 'i');
        }
        
        let shops = await MedicalShop.find(query);
        
        // Calculate distances if lat/lng provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            
            shops = shops.map(shop => {
                const distance = calculateDistance(userLat, userLng, shop.lat, shop.lng);
                return {
                    ...shop.toObject(),
                    distance
                };
            });
            
            // Apply sorting
            if (sort === 'name-asc') {
                shops.sort((a, b) => a.shopName.localeCompare(b.shopName));
            } else if (sort === 'distance-asc') {
                shops.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            } else if (sort === 'rating-desc') {
                shops.sort((a, b) => b.rating - a.rating);
            }
        } else {
            // Apply sorting without distance
            if (sort === 'name-asc') {
                shops.sort((a, b) => a.shopName.localeCompare(b.shopName));
            } else if (sort === 'rating-desc') {
                shops.sort((a, b) => b.rating - a.rating);
            }
        }
        
        res.json(shops);
    } catch (error) {
        console.error('Get medical shops error:', error);
        res.status(500).json({ error: 'Server error fetching medical shops' });
    }
});

app.get('/api/medicalshops/owner/:ownerId', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.ownerId)) {
            return res.status(400).json({ error: 'Invalid owner ID format' });
        }

        const shop = await MedicalShop.findOne({ ownerId: req.params.ownerId });
        if (!shop) {
            return res.status(404).json({ error: 'Medical shop not found for this owner' });
        }
        res.json(shop);
    } catch (error) {
        console.error('Get medical shop by owner error:', error);
        res.status(500).json({ error: 'Server error fetching medical shop' });
    }
});

// ==================== REMEDIES ROUTES ====================

app.get('/api/remedies', async (req, res) => {
    try {
        const { symptoms } = req.query;
        
        if (!symptoms || symptoms.trim() === '') {
            return res.status(400).json({ error: 'Symptoms parameter is required' });
        }
        
        const symptomsLower = symptoms.toLowerCase().trim();
        
        // Remedies database
        const remediesDatabase = {
            'fever': {
                title: 'Fever Remedies',
                remedies: [
                    'Drink plenty of fluids (water, herbal tea)',
                    'Take rest and avoid exertion',
                    'Use a cool compress on forehead',
                    'Take a lukewarm bath',
                    'Drink ginger or tulsi tea'
                ],
                medicines: [
                    'Paracetamol (Acetaminophen) - 500mg every 6 hours',
                    'Ibuprofen - 200-400mg every 6-8 hours',
                    'Aspirin (for adults only) - 325-650mg every 4 hours'
                ],
                warning: 'If fever persists for more than 3 days or exceeds 103°F, consult a doctor.'
            },
            'cold': {
                title: 'Common Cold Remedies',
                remedies: [
                    'Drink warm water with honey and lemon',
                    'Steam inhalation with eucalyptus oil',
                    'Gargle with warm salt water',
                    'Drink turmeric milk before bed',
                    'Rest and stay hydrated'
                ],
                medicines: [
                    'Cetirizine (Antihistamine) - 10mg once daily',
                    'Phenylephrine (Decongestant) - 10mg every 4 hours',
                    'Dextromethorphan (Cough suppressant) - 15-30mg every 4-6 hours'
                ],
                warning: 'If symptoms persist beyond 7-10 days, consult a doctor.'
            },
            'cough': {
                title: 'Cough Remedies',
                remedies: [
                    'Honey with warm water or tea',
                    'Ginger tea with honey',
                    'Steam inhalation',
                    'Salt water gargle',
                    'Thyme tea (natural expectorant)'
                ],
                medicines: [
                    'Guaifenesin (Expectorant) - 200-400mg every 4 hours',
                    'Dextromethorphan (Cough suppressant) - 15-30mg every 4-6 hours',
                    'Benzonatate - 100-200mg three times daily'
                ],
                warning: 'If cough persists for more than 3 weeks or includes blood, see a doctor.'
            },
            'headache': {
                title: 'Headache Remedies',
                remedies: [
                    'Apply cold compress to forehead',
                    'Drink plenty of water',
                    'Practice relaxation techniques',
                    'Massage temples gently',
                    'Rest in a dark, quiet room'
                ],
                medicines: [
                    'Ibuprofen - 200-400mg every 4-6 hours',
                    'Paracetamol - 500mg every 6 hours',
                    'Aspirin - 325-650mg every 4 hours',
                    'Naproxen - 220mg every 8-12 hours'
                ],
                warning: 'For severe, sudden headaches or those with vision changes, seek immediate medical attention.'
            },
            'sore throat': {
                title: 'Sore Throat Remedies',
                remedies: [
                    'Salt water gargle (1/2 tsp salt in warm water)',
                    'Honey and lemon in warm water',
                    'Chamomile tea',
                    'Licorice root gargle',
                    'Stay hydrated with warm liquids'
                ],
                medicines: [
                    'Lozenges with benzocaine or menthol',
                    'Ibuprofen or Paracetamol for pain',
                    'Chloraseptic spray for temporary relief'
                ],
                warning: 'If sore throat persists beyond 5-7 days or includes high fever, see a doctor.'
            },
            'stomach': {
                title: 'Stomach Pain Remedies',
                remedies: [
                    'Drink ginger or peppermint tea',
                    'Apply warm compress to abdomen',
                    'BRAT diet (Bananas, Rice, Applesauce, Toast)',
                    'Stay hydrated with clear liquids',
                    'Avoid spicy, fatty, or dairy foods'
                ],
                medicines: [
                    'Antacids (Tums, Rolaids) as directed',
                    'Simethicone for gas relief',
                    'Loperamide for diarrhea (short-term use)'
                ],
                warning: 'For severe abdominal pain, vomiting blood, or black stools, seek emergency care.'
            },
            'diarrhea': {
                title: 'Diarrhea Remedies',
                remedies: [
                    'Stay hydrated with ORS solution',
                    'BRAT diet (Bananas, Rice, Applesauce, Toast)',
                    'Drink coconut water',
                    'Avoid dairy and fatty foods',
                    'Rest the digestive system'
                ],
                medicines: [
                    'Loperamide - 4mg initially, then 2mg after each loose stool',
                    'Bismuth subsalicylate - 524mg every 30-60 minutes',
                    'Probiotics to restore gut flora'
                ],
                warning: 'If diarrhea persists beyond 2 days or includes blood, consult a doctor.'
            },
            'constipation': {
                title: 'Constipation Remedies',
                remedies: [
                    'Drink plenty of water (8-10 glasses daily)',
                    'Increase fiber intake (fruits, vegetables)',
                    'Exercise regularly',
                    'Drink warm water in the morning',
                    'Prune or pear juice'
                ],
                medicines: [
                    'Psyllium husk (Metamucil) - 1 tsp in water daily',
                    'Docusate sodium (stool softener) - 100mg twice daily',
                    'Bisacodyl (stimulant laxative) - 5-15mg as needed'
                ],
                warning: 'If constipation persists for more than 2 weeks, consult a doctor.'
            },
            'allergy': {
                title: 'Allergy Remedies',
                remedies: [
                    'Use saline nasal spray',
                    'Keep windows closed during high pollen seasons',
                    'Use air purifiers',
                    'Shower after being outdoors',
                    'Wash bedding frequently in hot water'
                ],
                medicines: [
                    'Cetirizine - 10mg once daily',
                    'Loratadine - 10mg once daily',
                    'Fexofenadine - 60mg twice daily or 180mg once daily',
                    'Fluticasone nasal spray'
                ],
                warning: 'For severe allergic reactions (difficulty breathing, swelling), seek emergency care.'
            }
        };
        
        // Find matching remedies
        const foundRemedies = [];
        Object.keys(remediesDatabase).forEach(key => {
            if (symptomsLower.includes(key)) {
                foundRemedies.push(remediesDatabase[key]);
            }
        });
        
        // If no specific match found, provide general advice
        if (foundRemedies.length === 0) {
            foundRemedies.push({
                title: 'General Health Advice',
                remedies: [
                    'Stay hydrated by drinking plenty of water',
                    'Get adequate rest and sleep',
                    'Maintain a balanced diet with fruits and vegetables',
                    'Practice good hygiene and hand washing',
                    'Consider over-the-counter pain relief if needed'
                ],
                medicines: [
                    'Paracetamol (Acetaminophen) for general pain/fever',
                    'Ibuprofen for inflammation and pain',
                    'Consult pharmacist for specific symptom relief'
                ],
                warning: 'If symptoms persist or worsen, consult a healthcare professional.'
            });
        }
        
        res.json({
            symptoms: symptoms,
            remedies: foundRemedies,
            caution: '⚠️ IMPORTANT: The information provided is for educational purposes only. Always consult with a healthcare professional before trying any remedies or medications. Use at your own risk and care.'
        });
    } catch (error) {
        console.error('Get remedies error:', error);
        res.status(500).json({ error: 'Server error fetching remedies' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access the application at http://localhost:${PORT}`);
});