# Render Deployment Preparation for MediFind

The MediFind backend has been successfully configured and prepared for deployment on Render using Docker. This document explains the architecture and provides step-by-step manual deployment instructions.

## 1. Architecture Overview

- **Database**: `mysql` (Docker image on Render Private Service)
- **Discovery**: `discovery-server` (Render Private Service, Port 8761)
- **Gateway**: `api-gateway` (Render Web Service, Public Port 8080)
- **Services**: `auth-service`, `user-service`, `doctor-service`, `hospital-service`, `appointment-service`, `notification-service` (Render Private Services)

*Note on Database: Render does not provide managed MySQL natively. To keep MySQL as the backend database without rewriting to PostgreSQL, we deploy a Private Service running the official MySQL Docker image with a Persistent Disk.*

## 2. GitHub Repository Setup

Ensure all created Dockerfiles (`*/Dockerfile`) and the `docker-compose.yml` are committed and pushed to your GitHub repository.

## 3. Deployment Order

You must create and deploy the services on Render in the following order:

1. **MySQL Database**
2. **Discovery Server**
3. **Backend Microservices (Auth, User, Doctor, Hospital, Appointment, Notification)**
4. **API Gateway**

## 4. Creating the Services

### 4.1 MySQL Database (Private Service)

1. **Type:** New Private Service
2. **Name:** `medifind-mysql`
3. **Repository:** Your GitHub Repository
4. **Environment:** Docker
5. **Start Command:** (Leave Blank)
6. **Docker Build Context:** `.` (Root of repository)
7. **Dockerfile Path:** Create a simple `Dockerfile.mysql` at the root, or for the Private Service just configure it using a raw image. *Since Render Private Services need a repo, create a `Dockerfile.mysql` in the repo with `FROM mysql:8.0`.*
   *Alternative:* Use a managed MySQL database from a provider like Aiven or AWS RDS and skip this step.
8. **Disks:**
   - Mount Path: `/var/lib/mysql`
   - Size: 5 GB
9. **Environment Variables:**
   - `MYSQL_ROOT_PASSWORD` = `<your-secure-password>`
   - `MYSQL_DATABASE` = `medifind_db`

### 4.2 Discovery Server (Private Service)

1. **Type:** New Private Service
2. **Name:** `discovery-server`
3. **Repository:** Your GitHub Repository
4. **Environment:** Docker
5. **Docker Build Context:** `.` (Root)
6. **Dockerfile Path:** `discovery-server/Dockerfile`
7. **Environment Variables:**
   - `EUREKA_HOSTNAME` = `discovery-server`

### 4.3 Microservices (Private Services)

For **each** of the microservices (`auth-service`, `user-service`, `doctor-service`, `hospital-service`, `appointment-service`, `notification-service`), create a Render Private Service.

1. **Type:** New Private Service
2. **Name:** `<service-name>` (e.g., `user-service`)
3. **Repository:** Your GitHub Repository
4. **Environment:** Docker
5. **Docker Build Context:** `.` (Root)
6. **Dockerfile Path:** `<service-name>/Dockerfile`
7. **Environment Variables:**
   - `EUREKA_SERVER_URL` = `http://discovery-server:8761/eureka/`
   - `DB_HOST` = `medifind-mysql` (Or your managed DB host)
   - `DB_PORT` = `3306`
   - `DB_USERNAME` = `root` (Or your managed DB username)
   - `DB_PASSWORD` = `<your-secure-password>`
   - `JWT_SECRET` = `<your-strong-jwt-secret>`

### 4.4 API Gateway (Web Service)

1. **Type:** New Web Service
2. **Name:** `api-gateway`
3. **Repository:** Your GitHub Repository
4. **Environment:** Docker
5. **Docker Build Context:** `.` (Root)
6. **Dockerfile Path:** `api-gateway/Dockerfile`
7. **Environment Variables:**
   - `EUREKA_SERVER_URL` = `http://discovery-server:8761/eureka/`
   - `CORS_ALLOWED_ORIGINS` = `https://<your-vercel-frontend-domain>`
   - `PORT` = `8080` (Render will override this, but it's safe to define)

## 5. Health Checks

Render will automatically use TCP health checks. For the API Gateway (Web Service), it will ensure the container binds to the `PORT` and accepts connections. Since actuator is not included by default, the default TCP health check is perfectly sufficient.

## 6. Frontend Connection

Once the API Gateway is successfully deployed, Render will provide a public URL like `https://api-gateway-xxxx.onrender.com`.

1. Go to your **Vercel** dashboard for the frontend deployment.
2. Update the environment variable:
   `VITE_API_BASE_URL` = `https://api-gateway-xxxx.onrender.com`
3. Redeploy the frontend.

## 7. Troubleshooting

- **Eureka Registration Issues:** Ensure all microservices have `EUREKA_SERVER_URL` correctly pointed to the Discovery Server's Render internal hostname (`discovery-server`).
- **Database Connection Issues:** Check that `DB_HOST` and credentials exactly match the MySQL Private Service or your managed DB.
- **CORS Errors:** Verify that `CORS_ALLOWED_ORIGINS` on the API Gateway matches the exact Vercel URL (without a trailing slash).
- **Authentication Errors:** Ensure `JWT_SECRET` is identical across all microservices that validate tokens.
