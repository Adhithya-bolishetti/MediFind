# Deploying MediFind to Railway

This document explains how to deploy the monolithic MediFind Spring Boot backend to Railway natively (without Docker).

## 1. Push Project to GitHub
Ensure all your latest changes are committed and pushed to your GitHub repository. The repository should contain the `medifind-backend` directory at its root.

## 2. Create Railway Project
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your MediFind repository.

## 3. Configure the Service
Before the initial build completes (or if it fails), go to the settings of your newly created Railway service:

1. Under **Settings > Build > Root Directory**, set it to:
   ```
   /medifind-backend
   ```
2. Railway's Nixpacks builder will now automatically detect the `pom.xml` inside `medifind-backend`, install Java 21 and Maven natively, and compile the application.
3. The generated JAR file will be automatically executed by Railway. You do *not* need a `Dockerfile` or `docker-compose.yml`.

## 4. Setup MySQL Hosting
Railway does not automatically provide a persistent database simply by deploying the backend codebase. You must host MySQL either on Railway (by adding a new MySQL plugin/service to your project) or externally (e.g., Aiven, PlanetScale, AWS RDS). 

Once you have your MySQL database running, collect the connection details.

## 5. Required Environment Variables
Go to your Railway service's **Variables** tab and add the following:

### Database (MySQL)
- `DB_HOST`: Your MySQL host
- `DB_PORT`: Your MySQL port (usually 3306)
- `DB_NAME`: Your MySQL database name
- `DB_USERNAME`: Your MySQL username
- `DB_PASSWORD`: Your MySQL password

### Security (JWT)
- `JWT_SECRET`: A secure, randomly generated 256-bit string (do NOT use the local development default)
- `JWT_EXPIRATION`: Token expiration in milliseconds (e.g., 86400000 for 24 hours)

### CORS (Frontend Access)
- `CORS_ALLOWED_ORIGINS`: The URL of your deployed frontend (e.g., `https://medifind-frontend.vercel.app`)

### Cloudinary (File Storage)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Note on Port
Do NOT manually configure `PORT` or `server.port`. Railway injects the `PORT` environment variable automatically, and the application is configured to listen on it (`server.port: ${PORT:8080}`).
