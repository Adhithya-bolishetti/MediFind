# MediFind - Production Deployment Guide (Zero Cost Architecture)

This guide provides step-by-step instructions for deploying the MediFind backend as a completely free architecture using Render and Cloudinary.

## Architecture

*   **Frontend:** Vercel (Free)
*   **Backend:** Render Web Service (Free Tier) - Single Spring Boot Monolith
*   **Database:** Aiven MySQL / PlanetScale (Free Tier)
*   **File Storage:** Cloudinary (Free Tier)

This repository contains a unified backend. We have removed the Eureka Discovery Server and API Gateway. All microservices are now merged into a single deployable Spring Boot application to fit within the Render Free tier limitations (which does not support private services).

## Prerequisites

1.  A [Render](https://render.com/) account.
2.  A [Cloudinary](https://cloudinary.com/) account.
3.  A MySQL Database (from a free provider like Aiven).
4.  A GitHub repository containing this codebase.

## 1. Setup Cloudinary

1.  Sign up for a free Cloudinary account.
2.  Go to the Dashboard and locate your **Product Environment Credentials**:
    *   `Cloud Name`
    *   `API Key`
    *   `API Secret`
3.  Save these credentials for the Render setup.

## 2. Deploy to Render via Blueprint

The repository includes a `render.yaml` file configured for a zero-cost single Web Service deployment.

1.  Log in to the [Render Dashboard](https://dashboard.render.com/).
2.  Click **New** -> **Blueprint**.
3.  Connect your GitHub repository containing the MediFind source code.
4.  Render will automatically detect the `render.yaml` configuration.

## 3. Configure Environment Variables

Render will prompt you to provide the values for the secrets defined in `render.yaml` (`sync: false`). Enter the following:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DB_HOST` | MySQL database host | `db.example.com` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_USERNAME` | MySQL database username | `admin` |
| `DB_PASSWORD` | MySQL database password | `secret_password` |
| `DB_NAME` | MySQL database name | `medifind` |
| `JWT_SECRET` | Secret key for JWT signing | `your-256-bit-secret-key-here` |
| `CORS_ALLOWED_ORIGINS`| URL of your Vercel frontend | `https://your-frontend.vercel.app` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name | `dxxxxxx` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | `secret_abc123` |

## 4. Automatic Build & Deploy

Once the environment variables are saved, Render will:
1. Use the multi-stage `Dockerfile` located at `./medifind-backend/Dockerfile`.
2. Build the application using Maven (`mvn clean package`).
3. Run the application using the OpenJDK 21 slim runtime.
4. Inject the `$PORT` automatically (mapped in `application.yml`).

## 5. Validate Deployment

1. Once the Render service is `Live`, click the provided `.onrender.com` URL.
2. Ensure you append `/api/users/...` to test API routes, as there is no root index page.
3. Update your Vercel Frontend environment variable (`VITE_API_URL` or equivalent) to point to your new Render URL.
