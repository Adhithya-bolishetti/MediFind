# Render Deployment for MediFind

The MediFind backend has been successfully configured and prepared for deployment on Render using Docker. This document explains the architecture, current limitations, and provides step-by-step deployment instructions.

## 1. Architecture Overview

- **Database**: `mysql`
- **Discovery**: `discovery-server` (Render Private Service)
- **Gateway**: `api-gateway` (Render Web Service, Public)
- **Microservices**: `auth-service`, `user-service`, `doctor-service`, `hospital-service`, `appointment-service`, `notification-service` (Render Private Services)

## 2. Render Free-Tier Reality & Limitations

**IMPORTANT: This architecture CANNOT be fully deployed on Render's Free Tier.**
- **Private Services**: Render does not offer private services on the free tier. Only 1 Web Service is free. This architecture requires at least 7 private services.
- **MySQL**: Render does not offer managed MySQL. Deploying MySQL as a Docker container on Render requires a persistent disk (which is only available for paid instances).
- **Service Count**: The microservices architecture requires 8 separate containers. The free tier limits concurrent runtimes.

**Recommendation:** You must use a paid Render account (Team plan or individual paid instances) to deploy this infrastructure. For the database, you can either deploy MySQL on a Render Private Service with a persistent disk, or use a managed MySQL provider like Aiven or AWS RDS.

## 3. Deployment using `render.yaml` (Infrastructure as Code)

We have provided a `render.yaml` Blueprint file at the root of the project to automate the creation of the services.

1. In the Render Dashboard, click **New +** > **Blueprint**.
2. Connect your GitHub repository containing the MediFind project.
3. Render will parse `render.yaml` and prompt you to enter the missing environment variables (marked as `sync: false`).

### Required Environment Variables:
- `DB_USERNAME`: Your MySQL username (e.g., `admin`).
- `DB_PASSWORD`: Your MySQL password.
- `JWT_SECRET`: A strong, random string (generate with `openssl rand -base64 48`).
- `CORS_ALLOWED_ORIGINS`: The URL of your Vercel frontend (e.g., `https://medifind-frontend.vercel.app`). Do not use `*`.

## 4. Local Validation with Docker Compose

`docker-compose.yml` is specifically designed for **LOCAL VALIDATION** and development. Render **DOES NOT** deploy `docker-compose.yml` directly.

To test the stack locally:
1. Copy `.env.example` to `.env`.
2. Fill in `.env` with dummy values for local testing. **NEVER commit `.env` to Git.**
3. Run `docker compose up -d --build`.
4. Ensure the API Gateway starts successfully on `http://localhost:8080`.

## 5. Security & Configuration Notes

- **Secrets**: No secrets are hardcoded in the codebase. All credentials, including database passwords and JWT secrets, are loaded dynamically from environment variables.
- **Ports**: All services use the Render-injected `PORT` environment variable (`server.port=${PORT:...}`) but default to their respective local ports (e.g., 8080, 8081, 8761) when running locally.
- **CORS**: Ensure your API Gateway correctly restricts origins to your Vercel frontend via the `CORS_ALLOWED_ORIGINS` variable.
- **Git Safety**: `.env` is ignored by `.gitignore`.

## 6. Frontend Configuration

After the API Gateway is deployed successfully, Render will assign it a public URL (e.g., `https://api-gateway-xxx.onrender.com`).
Go to your Vercel dashboard and set the frontend environment variable:
- `VITE_API_BASE_URL` = `https://api-gateway-xxx.onrender.com`

Redeploy the frontend to apply the changes.
