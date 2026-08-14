const axios = require('axios');

async function test() {
  try {
    const fakeEmail = `9999999999@medifind.com`;
    // 1. Register
    await axios.post('http://localhost:8080/api/auth/register', {
      fullName: 'Test Doctor',
      email: fakeEmail,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'DOCTOR'
    });

    // 2. Login
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email: fakeEmail,
      password: 'password123'
    });

    const token = loginRes.data.accessToken;

    // 3. Create Profile
    const profileData = {
      doctorName: 'Test Doctor',
      email: fakeEmail,
      phoneNumber: '9999999999',
      gender: 'Male',
      dateOfBirth: null,
      specialization: 'GENERAL_PHYSICIAN',
      qualification: 'MBBS',
      medicalLicenseNumber: 'LIC123',
      experience: 5,
      consultationFee: 500,
      languages: 'English',
      clinicName: 'Test Clinic',
      city: 'Hyderabad',
      state: 'Telangana',
      availableForOnlineConsultation: true
    };

    const profileRes = await axios.post('http://localhost:8080/api/doctors/profile', profileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Profile created successfully:', profileRes.data);

  } catch (err) {
    console.error('Error occurred:');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

test();
