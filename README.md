# MediFind Backend

MediFind is a monolithic healthcare platform built using Java 21 and Spring Boot 3.x.

## Architecture

This project is a standalone Spring Boot monolithic application. All previous microservices have been merged into a single `medifind-backend` backend.

## Folder Structure

```text
medifind/
├── medifind-backend/   # The monolithic Spring Boot application
├── frontend/           # React application built with Vite and Material UI
├── database/           # Database scripts and seed data
├── RAILWAY_DEPLOYMENT.md # Deployment instructions
└── README.md
```

## Tech Stack

- **Java 21**
- **Spring Boot 3.2.4**
- **Spring Security & JWT**
- **MySQL & Spring Data JPA**
- **Maven**
- **Lombok & MapStruct**
- **Swagger / OpenAPI 3**
- **React 19 & Vite**
- **Material UI**

## Services & Ports Configuration

| Service            | Port | Description                                      |
|--------------------|------|--------------------------------------------------|
| Backend (Monolith) | 8080 | Main Spring Boot Backend                         |
| Frontend           | 5173 | React/Vite UI application                        |

## Database Configuration

The backend expects a MySQL database named `medifind_db`.
Credentials and configurations can be defined via environment variables:
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_NAME` (default: `medifind_db`)
- `DB_USERNAME` (default: `root`)
- `DB_PASSWORD` (default: `123456`)

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
| Hospital| `3333333333`  | `Test@12345` (DEMO) | Hospital Dashboard    |

These are seed accounts used for local testing. The patient, doctor, and hospital accounts have
completed profiles; new signups are redirected to profile creation first.

## API Endpoints

### API (Backend)
Base URL: `http://localhost:8080/api`

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Authenticate and receive a JWT
- `GET /auth/me`: Get current logged-in user details (Requires `Authorization: Bearer <token>`)

### Video Consultation
- `GET /video/appointments/{id}/room`: resolve the WebRTC room for an online appointment
- `ws://localhost:8080/ws/video?roomId=<id>&token=<jwt>`: signaling socket

## Video Consultation

Appointments booked with the **Online** consultation type get a peer-to-peer video
room. Media flows directly between the patient and the doctor over WebRTC — the
backend only relays the SDP/ICE handshake and never sees or stores the call itself.

**Flow**

1. A patient books a doctor and picks *Online* as the consultation type.
2. The doctor accepts the appointment (`CONFIRMED`).
3. From **My Appointments** (or either dashboard) both sides get a **Join Video
   Call** button, enabled from 15 minutes before the scheduled time until 60
   minutes after it.
4. `/appointments/:id/call` opens the call: camera and mic toggles, the peer's
   mute state, and hang-up.

**Access rules** — enforced server-side on both the REST room lookup and the
WebSocket handshake, so a leaked room token grants nothing on its own:

- The caller must be that appointment's patient or its doctor.
- The appointment must be `CONFIRMED` and of type `Online`.
- The current time must fall inside the join window.

**Connectivity** — the default configuration uses public STUN servers, which
covers most home and mobile networks. Participants behind symmetric NAT or a
corporate firewall need a TURN relay; set `VIDEO_TURN_URL`, `VIDEO_TURN_USERNAME`
and `VIDEO_TURN_CREDENTIAL` (see `.env.example`) to add one.

> Browsers only grant camera and microphone access on `https://` or `localhost`.
> Testing over a LAN IP such as `http://192.168.x.x:5173` will fail at the
> permission prompt.

### Swagger Documentation
Backend API Docs: `http://localhost:8080/swagger-ui.html`

## How to Run

1. **Ensure MySQL is running**
   Create the database `medifind_db`.

2. **Run Backend**
   Navigate to the backend directory and run:
   ```bash
   cd medifind-backend
   mvn spring-boot:run
   ```

3. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Alternatively, you can run the `MediFindApplication.java` class directly from your IDE.

## Deployment

This application natively supports deployment to **Railway** without Docker. Refer to [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for full deployment instructions.
