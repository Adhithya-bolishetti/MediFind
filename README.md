# MediFind Backend

MediFind is a healthcare platform built using Java 21, Spring Boot 3.x, and Spring Cloud Microservices architecture.

## Architecture

This project is structured as a multi-module Maven project. The components include:

- **Discovery Server (Eureka)**: Service registry for microservices.
- **API Gateway (Spring Cloud Gateway)**: Single entry point, routing requests to appropriate services.
- **Auth Service (Port 8081):** Manages authentication and user accounts.
- **User Service (Port 8082):** Manages user profiles.
- **Doctor Service (Port 8083):** Manages doctor profiles, availability, reviews, and recommendations.
- **Hospital Service (Port 8084):** Manages hospital profiles.
- **Notification Service (Port 8085):** Handles email and SMS notifications.
- **Appointment Service (Port 8086):** Manages appointment bookings, cancellations, and status updates.
- **Frontend:** React application built with Vite and Material UI.

## Folder Structure

```
medifind/
├── pom.xml
├── discovery-server/
├── api-gateway/
├── auth-service/
├── user-service/
├── doctor-service/
├── hospital-service/
├── notification-service/
├── appointment-service/
└── frontend/
```

## Tech Stack

- **Java 21**
- **Spring Boot 3.2.4**
- **Spring Cloud 2023.0.1**
- **Spring Security & JWT**
- **MySQL & Spring Data JPA**
- **Maven**
- **Lombok & MapStruct**
- **Swagger / OpenAPI 3**
- **React 19 & Vite**
- **Material UI**

## Ports Configuration

| Service              | Port | Description                                      |
|----------------------|------|--------------------------------------------------|
| Discovery Server     | 8761 | Eureka Dashboard & Registry                      |
| API Gateway          | 8080 | Main entry point for clients                     |
| Auth Service         | 8081 | Authentication and Users DB                      |
| User Service         | 8082 | Manages user profiles                            |
| Doctor Service       | 8083 | Manages doctor profiles, availability & reviews  |
| Hospital Service     | 8084 | Manages hospital profiles                        |
| Notification Service | 8085 | Handles email/SMS notifications                  |
| Appointment Service  | 8086 | Manages bookings and cancellations               |
| Frontend             | 5173 | React/Vite UI application                        |

## Database Configuration

The Auth Service expects a MySQL database named `medifind_db`.
Credentials defined in `auth-service/src/main/resources/application.yml`:
- Username: `root`
- Password: `root` (Change this if your MySQL setup requires a different password or no password)

```sql
CREATE DATABASE IF NOT EXISTS medifind_db;
```

## Admin Account

The application includes an Admin Dashboard (`/admin/dashboard`) for users with the `ADMIN` role.

| Field  | Value                    |
|--------|--------------------------|
| Email  | `9392392909@medifind.com` |
| Mobile | `9392392909` (login uses the `+91` country code prefix) |
| Password | `DemoAdmin@123` (DEMO CREDENTIAL) |

> **Note:** Admin accounts must be created in the database — the `ADMIN` role is never
> selectable during signup. To (re)create or reset the seeded admin account, run:
>
> ```bash
> mysql -u root -p < database/seed-admin.sql
> ```

## Test Accounts

| Role    | Mobile Number | Password     | Lands on              |
|---------|---------------|--------------|-----------------------|
| Admin   | `9392392909`  | `DemoAdmin@123` (DEMO) | Admin Dashboard      |
| Patient | `5555555555`  | `Test@12345` (DEMO) | Patient Dashboard     |
| Doctor  | `4444444444`  | `Test@12345` (DEMO) | Doctor Dashboard      |

These are seed accounts used for local testing. The patient and doctor accounts have
completed profiles; new signups are redirected to profile creation first.

## API Endpoints

### Auth Service (Accessible via API Gateway)
Base URL: `http://localhost:8080/api/auth`

- `POST /register`: Register a new user
- `POST /login`: Authenticate and receive a JWT
- `GET /me`: Get current logged-in user details (Requires `Authorization: Bearer <token>`)

### Swagger Documentation
Auth Service API Docs: `http://localhost:8081/swagger-ui.html`

## How to Run

1. **Build the project**
   Navigate to the root directory `medifind` and run:
   ```bash
   mvn clean install -DskipTests
   ```

2. **Run Discovery Server**
   ```bash
   cd discovery-server
   mvn spring-boot:run
   ```

3. **Run API Gateway**
   ```bash
   cd api-gateway
   mvn spring-boot:run
   ```

4. **Run Auth Service**
   Ensure MySQL is running, then execute:
   ```bash
   cd auth-service
   mvn spring-boot:run
   ```

5. **Run User Service**
   ```bash
   cd user-service
   mvn spring-boot:run
   ```

6. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Alternatively, you can run the `*Application.java` classes directly from your IDE for the backend services.
