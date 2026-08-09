# MediFind Backend

MediFind is a healthcare platform built using Java 21, Spring Boot 3.x, and Spring Cloud Microservices architecture.

## Architecture

This project is structured as a multi-module Maven project. The components include:

- **Discovery Server (Eureka)**: Service registry for microservices.
- **API Gateway (Spring Cloud Gateway)**: Single entry point, routing requests to appropriate services.
- **User Service (Port 8082):** Manages user profiles.
- **Doctor Service (Port 8083):** Manages doctor profiles, availability, reviews, and recommendations.
- **Hospital Service (Port 8084):** Manages hospital profiles.
- **Appointment Service (Port 8086):** Manages appointment bookings, cancellations, and status updates.

## Folder Structure

```
medifind/
├── pom.xml
├── discovery-server/
├── api-gateway/
├── auth-service/
└── user-service/
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

## Ports Configuration

| Service          | Port | Description                  |
|------------------|------|------------------------------|
| Discovery Server | 8761 | Eureka Dashboard & Registry  |
| API Gateway      | 8080 | Main entry point for clients |
| Auth Service     | 8081 | Authentication and Users DB  |
| User Service     | 8082 | User profiles (skeleton)     |

## Database Configuration

The Auth Service expects a MySQL database named `medifind_db`.
Credentials defined in `auth-service/src/main/resources/application.yml`:
- Username: `root`
- Password: `root` (Change this if your MySQL setup requires a different password or no password)

```sql
CREATE DATABASE IF NOT EXISTS medifind_db;
```

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

Alternatively, you can run the `*Application.java` classes directly from your IDE.
