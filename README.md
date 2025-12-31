# MediFind - Doctor Recommendation System

## 📋 Overview

MediFind is a comprehensive web application that helps users find and book appointments with healthcare professionals based on their symptoms, location, and preferences. The platform also allows doctors to register their profiles and manage appointments.

## Features

### For Patients
- ** Symptom-based Search**: Find doctors based on specific symptoms or medical conditions
- ** Location-based Search**: Search doctors by location or use current location
- ** Advanced Filtering**: Filter by distance, specialty, and rating
- ** Doctor Profiles**: View detailed information about doctors including education, experience, and reviews
- ** Appointment Booking**: Book appointments with available time slots
- ** Review System**: Rate and review doctors
- ** Interactive Map**: View doctor locations on an interactive map

###  For Doctors
- ** Profile Registration**: Complete registration form with professional details
- ** Profile Management**: View and edit professional profile
- ** Appointment Management**: View and manage patient appointments
- ** Rating & Reviews**: Receive and display patient feedback

##  Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Maps**: Leaflet.js for interactive maps
- **Icons**: Font Awesome for UI icons
- **Styling**: Custom CSS with responsive design
- **Data Storage**: Browser localStorage (for demo purposes)


## Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Local web server for running the application

### Steps
1. **Download the project files**
2. **Set up a local server** using one of these methods:

   **Option 1: VS Code with Live Server**
   ```bash
   # Install Live Server extension
   # Right-click index.html and select "Open with Live Server"
   ```
   **Option 2: Python**
    ```bash
    # Python 3
          # python -m http.server 8000
    # Python 2
          # python -m SimpleHTTPServer 8000
    ```
    **Option 3: Node.js**
     ```bash
     # npx http-server
     ```
    or
     ```bash
     # npm install -g http-server
     # http-server
     ```
4. **Open your browser and navigate to:**
   ```bash
   # http://localhost:8000
