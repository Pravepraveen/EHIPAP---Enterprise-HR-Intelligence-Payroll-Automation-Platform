# Design Document: EHIPAP Public Deployment

## Overview

This design covers the complete deployment architecture for EHIPAP (Enterprise HR Intelligence & Payroll Automation Platform) to transform it from a localhost-only Docker Compose application into a publicly accessible cloud-native system. The deployment will enable any user with a browser to access the platform through a stable public URL with full functionality across all role-based dashboards.

### Current State

- **Frontend**: React 18 / TypeScript / Vite SPA running on localhost:5173
- **Backend**: Java Spring Boot microservices architecture with API Gateway + 8 domain services
- **Infrastructure**: PostgreSQL, Redis, Kafka, MinIO running via Docker Compose
- **Deployment**: Local development only, no public access

### Target State

- **Frontend**: Static SPA hosted on Vercel or Netlify with HTTPS and CDN distribution
- **Backend**: Containerized microservices deployed to Render or Railway PaaS
- **Database**: Managed PostgreSQL on Neon, Supabase, or Render
- **Cache**: Managed Redis on Upstash
- **Messaging**: Managed Kafka on Upstash Kafka or Confluent Cloud
- **CI/CD**: GitHub Actions with auto-deploy on push to main
- **Access**: Public HTTPS URLs with JWT-based authentication

### Design Goals

1. **Zero localhost dependencies**: All services accessible via public URLs
2. **Secure secret management**: All credentials in environment variables, never in source control
3. **Automated deployment**: Push to main triggers automatic deployment
4. **Production-ready configuration**: CORS, SSL/TLS, health checks, proper error handling
5. **Minimal infrastructure management**: Leverage managed services for PostgreSQL, Redis, Kafka
6. **Cost-effective**: Use free tiers and PaaS platforms suitable for demonstration/small-scale production


## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CDN Host (Vercel/Netlify)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React SPA (Static Assets)                                 │ │
│  │  - index.html, JS bundles, CSS, images                     │ │
│  │  - SPA routing via _redirects / vercel.json               │ │
│  │  - Environment: VITE_API_BASE_URL                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS API calls
                             │ (CORS-enabled)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              PaaS Platform (Render/Railway)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Gateway (Spring Cloud Gateway)                        │ │
│  │  - JWT validation                                          │ │
│  │  - CORS configuration                                      │ │
│  │  - Route to downstream services                           │ │
│  │  - Health check: /actuator/health                         │ │
│  └──────────┬─────────────────────────────────────────────────┘ │
│             │                                                    │
│  ┌──────────┴─────────────────────────────────────────────────┐ │
│  │  Microservices (8 services)                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Auth Service │  │ Employee Svc │  │ Payroll Svc  │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │Attendance Svc│  │Recruitment   │  │Performance   │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │  ┌──────────────┐  ┌──────────────┐                      │ │
│  │  │Notification  │  │ Analytics    │                      │ │
│  │  └──────────────┘  └──────────────┘                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────┬──────────────┬──────────────┬────────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌─────────────┐
│  Managed    │ │ Managed  │ │  Managed    │
│ PostgreSQL  │ │  Redis   │ │   Kafka     │
│ (Neon/      │ │ (Upstash)│ │ (Upstash/   │
│  Supabase)  │ │          │ │  Confluent) │
└─────────────┘ └──────────┘ └─────────────┘
```


### Component Layers

#### 1. Presentation Layer (Frontend)
- **Technology**: React 18, TypeScript, Vite, Material-UI
- **Hosting**: Vercel or Netlify (static CDN hosting)
- **Responsibilities**:
  - Serve static SPA assets (HTML, JS, CSS, images)
  - Handle client-side routing via React Router
  - Make authenticated API calls to backend
  - Store JWT tokens in localStorage
  - Automatic token refresh on expiration

#### 2. API Gateway Layer
- **Technology**: Spring Cloud Gateway
- **Hosting**: Render or Railway (containerized)
- **Responsibilities**:
  - Single entry point for all backend API calls
  - JWT token validation for protected routes
  - CORS configuration for frontend domain
  - Route requests to appropriate microservices
  - Request/response logging and monitoring

#### 3. Microservices Layer
- **Technology**: Spring Boot 3.3, Java 21
- **Hosting**: Render or Railway (containerized)
- **Services**:
  1. **Identity & Auth Service** (Port 8081): JWT authentication, login, token refresh
  2. **Employee Lifecycle Service** (Port 8082): Employee CRUD, onboarding, offboarding
  3. **Payroll Computation Engine** (Port 8083): Payroll runs, salary calculations, payslips
  4. **Attendance & Leave Service** (Port 8084): Attendance tracking, leave requests, approvals
  5. **Recruitment ATS Service** (Port 8085): Job postings, candidate pipeline, hiring
  6. **Performance Management Service** (Port 8086): Reviews, goals, performance cycles
  7. **Notification Service** (Port 8087): Email, in-app notifications, alerts
  8. **Analytics & Reporting Service** (Port 8088): Dashboards, reports, business intelligence

#### 4. Data Layer
- **PostgreSQL** (Managed): Primary data store for all microservices
- **Redis** (Managed): Session cache, token blacklist, rate limiting
- **Kafka** (Managed): Event streaming for inter-service communication


## Components and Interfaces

### Frontend Component

#### Build Configuration
- **Build Tool**: Vite 5.x
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Public HTTPS URL of API Gateway (e.g., `https://ehipap-gateway.onrender.com`)
  - `VITE_APP_NAME`: Application name (`EHIPAP`)

#### API Client Configuration
```typescript
// src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.accessToken);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```


#### SPA Routing Configuration

**Vercel Configuration** (`frontend/vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Netlify Configuration** (`frontend/public/_redirects`):
```
/*  /index.html  200
```

### API Gateway Component

#### CORS Configuration
```yaml
# application-prod.yml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: ${CORS_ALLOWED_ORIGINS}
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - PATCH
              - OPTIONS
            allowedHeaders:
              - Authorization
              - Content-Type
              - X-Requested-With
            allowCredentials: true
            maxAge: 3600
```

#### Route Configuration
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: ${AUTH_SERVICE_URL}
          predicates:
            - Path=/api/auth/**
          filters:
            - StripPrefix=1

        - id: employee-service
          uri: ${EMPLOYEE_SERVICE_URL}
          predicates:
            - Path=/api/employees/**
          filters:
            - StripPrefix=1
            - name: JwtAuthenticationFilter

        # Similar routes for other 7 microservices
```


#### JWT Validation Filter
```java
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/actuator/health"
    );
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        
        // Skip JWT validation for public paths
        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }
        
        // Extract and validate JWT token
        String token = extractToken(exchange.getRequest());
        if (token == null || !validateToken(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        
        return chain.filter(exchange);
    }
    
    private String extractToken(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    private boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(jwtSecret.getBytes())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    @Override
    public int getOrder() {
        return -100; // Execute before other filters
    }
}
```


### Microservice Component Template

Each microservice follows a common configuration pattern:

#### Application Configuration
```yaml
# application-prod.yml (common for all microservices)
spring:
  application:
    name: ${SERVICE_NAME}
  
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      password: ${REDIS_PASSWORD}
      ssl: ${REDIS_SSL:false}
      timeout: 2000ms
  
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS}
    properties:
      security.protocol: ${KAFKA_SECURITY_PROTOCOL:PLAINTEXT}
      sasl.mechanism: ${KAFKA_SASL_MECHANISM:PLAIN}
      sasl.jaas.config: ${KAFKA_SASL_JAAS_CONFIG:}

server:
  port: ${PORT:8080}
  address: 0.0.0.0

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:86400000}
```


#### Health Check Configuration
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(5)) {
                return Health.up()
                    .withDetail("database", "PostgreSQL")
                    .withDetail("status", "Connected")
                    .build();
            }
        } catch (SQLException e) {
            return Health.down()
                .withDetail("database", "PostgreSQL")
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.down().build();
    }
}
```

#### Startup Validation
```java
@Component
@Slf4j
public class StartupValidator implements ApplicationRunner {
    
    @Value("${spring.datasource.url}")
    private String dbUrl;
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting application validation...");
        
        // Validate JWT secret length
        if (jwtSecret.length() < 32) {
            log.warn("JWT_SECRET is shorter than 32 characters. Consider using a longer secret.");
        }
        
        // Validate database connection
        try (Connection conn = dataSource.getConnection()) {
            if (!conn.isValid(30)) {
                throw new IllegalStateException("Failed to connect to PostgreSQL at " + dbUrl);
            }
            log.info("Database connection validated successfully");
        } catch (SQLException e) {
            log.error("Failed to connect to PostgreSQL at {}", dbUrl, e);
            throw new IllegalStateException("Database connection failed", e);
        }
        
        log.info("Application validation completed successfully");
    }
}
```


## Data Models

### Environment Configuration Model

Each deployment environment requires the following configuration structure:

#### Frontend Environment Variables
```bash
# CDN Host (Vercel/Netlify) Environment Variables
VITE_API_BASE_URL=https://ehipap-gateway.onrender.com
VITE_APP_NAME=EHIPAP
```

#### API Gateway Environment Variables
```bash
# PaaS Platform Environment Variables
SPRING_PROFILES_ACTIVE=prod
PORT=8080

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://ehipap.vercel.app,https://ehipap.netlify.app

# JWT Configuration
JWT_SECRET=<64-character-random-string>

# Downstream Service URLs
AUTH_SERVICE_URL=https://ehipap-auth.onrender.com
EMPLOYEE_SERVICE_URL=https://ehipap-employee.onrender.com
PAYROLL_SERVICE_URL=https://ehipap-payroll.onrender.com
ATTENDANCE_SERVICE_URL=https://ehipap-attendance.onrender.com
RECRUITMENT_SERVICE_URL=https://ehipap-recruitment.onrender.com
PERFORMANCE_SERVICE_URL=https://ehipap-performance.onrender.com
NOTIFICATION_SERVICE_URL=https://ehipap-notification.onrender.com
ANALYTICS_SERVICE_URL=https://ehipap-analytics.onrender.com
```

#### Microservice Environment Variables
```bash
# PaaS Platform Environment Variables (per microservice)
SPRING_PROFILES_ACTIVE=prod
PORT=8080
SERVICE_NAME=<service-name>

# Database Configuration
DB_URL=jdbc:postgresql://ep-example.us-east-1.aws.neon.tech:5432/ehipap?sslmode=require
DB_USERNAME=ehipap_user
DB_PASSWORD=<secure-password>

# Redis Configuration
REDIS_HOST=<upstash-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-redis-password>
REDIS_SSL=true

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=<upstash-kafka-broker>
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<username>" password="<password>";

# JWT Configuration
JWT_SECRET=<64-character-random-string>
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
```


### Database Schema Management

#### Schema Initialization Strategy
The database schema is managed through the `infra/docker/postgres/init.sql` file, which contains:
- Complete DDL for all tables, indexes, constraints
- Demo seed data for testing
- Idempotent INSERT statements using `ON CONFLICT DO NOTHING`

#### Schema Deployment Process
1. **Fresh Database**: Execute `init.sql` script to create all tables and seed data
2. **Existing Database**: Re-running `init.sql` is safe due to idempotent operations
3. **Future Migrations**: Consider migrating to Flyway for versioned schema changes

#### Database Connection Security
- **SSL Mode**: All connections use `sslmode=require` for encryption in transit
- **Connection Pooling**: HikariCP with max pool size of 10 connections per service
- **Timeout Configuration**: 30-second connection timeout to fail fast on connectivity issues

### JWT Token Model

#### Access Token Structure
```json
{
  "sub": "user-id",
  "username": "john.doe",
  "role": "EMPLOYEE",
  "authorities": ["ROLE_EMPLOYEE"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

#### Token Storage Strategy
- **Access Token**: Stored in `localStorage` with key `accessToken`
- **Refresh Token**: Stored in `localStorage` with key `refreshToken`
- **Expiration**: Access token expires in 24 hours, refresh token in 7 days
- **Logout**: Both tokens removed from `localStorage` within 500ms

#### Token Refresh Flow
1. API call returns 401 Unauthorized
2. Frontend extracts refresh token from localStorage
3. POST request to `/api/auth/refresh` with refresh token
4. If successful, store new access token and retry original request
5. If refresh fails (401/403), clear localStorage and redirect to login


## Deployment Architecture

### Frontend Deployment (Vercel/Netlify)

#### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Environment Variables** (set in Vercel dashboard):
- `VITE_API_BASE_URL`: `https://ehipap-gateway.onrender.com`
- `VITE_APP_NAME`: `EHIPAP`

**Deployment Trigger**: Automatic on push to `main` branch

#### Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment Variables** (set in Netlify dashboard):
- `VITE_API_BASE_URL`: `https://ehipap-gateway.onrender.com`
- `VITE_APP_NAME`: `EHIPAP`

**Deployment Trigger**: Automatic on push to `main` branch

### Backend Deployment (Render/Railway)

#### Dockerfile Strategy (Multi-Stage Build)

**API Gateway Dockerfile**:
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]
```

**Microservice Dockerfile** (same pattern for all 8 services):
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]
```


#### Render Configuration

**render.yaml** (Infrastructure as Code):
```yaml
services:
  # API Gateway
  - type: web
    name: ehipap-gateway
    env: docker
    dockerfilePath: ./backend/infrastructure/api-gateway/Dockerfile
    dockerContext: ./backend/infrastructure/api-gateway
    healthCheckPath: /actuator/health
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: JWT_SECRET
        sync: false  # Secret, set manually
      - key: CORS_ALLOWED_ORIGINS
        value: https://ehipap.vercel.app
      - key: AUTH_SERVICE_URL
        value: https://ehipap-auth.onrender.com
      # ... other service URLs

  # Auth Service
  - type: web
    name: ehipap-auth
    env: docker
    dockerfilePath: ./backend/services/identity-auth-service/Dockerfile
    dockerContext: ./backend/services/identity-auth-service
    healthCheckPath: /actuator/health
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: DB_URL
        sync: false  # Secret, set manually
      - key: DB_USERNAME
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: REDIS_HOST
        sync: false
      - key: REDIS_PORT
        value: 6379
      - key: REDIS_PASSWORD
        sync: false
      - key: JWT_SECRET
        sync: false

  # Repeat for other 7 microservices...
```

**Health Check Configuration**:
- **Path**: `/actuator/health`
- **Startup Grace Period**: 90 seconds
- **Check Interval**: 30 seconds
- **Failure Threshold**: 3 consecutive failures


#### Railway Configuration

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": null,
    "healthcheckPath": "/actuator/health",
    "healthcheckTimeout": 90,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Deployment Process**:
1. Connect GitHub repository to Railway
2. Create separate service for each microservice + API Gateway
3. Configure environment variables in Railway dashboard
4. Set health check path to `/actuator/health`
5. Enable auto-deploy on push to `main` branch

### Managed Services Configuration

#### PostgreSQL (Neon/Supabase/Render)

**Neon Configuration**:
- **Region**: US East (or closest to PaaS region)
- **PostgreSQL Version**: 15+
- **Connection String**: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/ehipap?sslmode=require`
- **SSL Mode**: Required
- **Connection Pooling**: Enabled (PgBouncer)

**Schema Initialization**:
```bash
# Execute init.sql via psql
psql "postgresql://user:pass@host:5432/ehipap?sslmode=require" -f infra/docker/postgres/init.sql
```

#### Redis (Upstash)

**Configuration**:
- **Region**: Same as PaaS platform for low latency
- **TLS**: Enabled
- **Connection String**: `rediss://default:password@host:6379`
- **Max Connections**: 100 (shared across all services)

**Environment Variables**:
```bash
REDIS_HOST=<upstash-host>.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>
REDIS_SSL=true
```


#### Kafka (Upstash Kafka/Confluent Cloud)

**Upstash Kafka Configuration**:
```bash
KAFKA_BOOTSTRAP_SERVERS=<cluster-id>.upstash.io:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<username>" password="<password>";
```

**Confluent Cloud Configuration**:
```bash
KAFKA_BOOTSTRAP_SERVERS=<cluster-id>.confluent.cloud:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.plain.PlainLoginModule required username="<api-key>" password="<api-secret>";
```

**Topic Configuration**:
- `employee-events`: Employee lifecycle events
- `payroll-events`: Payroll computation events
- `attendance-events`: Attendance and leave events
- `notification-events`: Notification dispatch events
- Partitions: 3 per topic
- Replication Factor: 3 (managed by provider)

### CI/CD Pipeline

#### GitHub Actions Workflow

**.github/workflows/ci.yml**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Build frontend
        working-directory: frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: npm run build
      
      - name: Check for localhost references
        working-directory: frontend/dist
        run: |
          if grep -r "localhost\|127\.0\.0\.1" assets/; then
            echo "Error: Found localhost references in build output"
            exit 1
          fi
```


```yaml
  backend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      
      - name: Build backend
        working-directory: backend
        run: mvn clean install -DskipTests
      
      - name: Verify Dockerfiles
        run: |
          for dockerfile in backend/infrastructure/api-gateway/Dockerfile backend/services/*/Dockerfile; do
            if [ ! -f "$dockerfile" ]; then
              echo "Error: Missing Dockerfile at $dockerfile"
              exit 1
            fi
          done

  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check for committed secrets
        run: |
          if grep -r "jdbc:postgresql://.*:[^p]" --include="*.yml" --include="*.yaml" --include="*.properties" .; then
            echo "Error: Found potential database credentials in source code"
            exit 1
          fi
          
          if find . -name ".env" -not -path "./.git/*" | grep -q .; then
            echo "Error: Found .env file in repository"
            exit 1
          fi
```

**GitHub Secrets Configuration**:
- `VITE_API_BASE_URL`: API Gateway public URL
- Database credentials (for integration tests, if needed)
- PaaS platform API tokens (for deployment automation)


## Configuration Management

### Environment Variable Strategy

#### Hierarchy of Configuration
1. **Platform Defaults**: Hardcoded fallback values in code (only for non-sensitive config)
2. **Environment Variables**: Primary configuration source (set in PaaS dashboard)
3. **Spring Profiles**: Profile-specific configuration files (`application-prod.yml`)

#### Secret Management Rules
1. **Never commit secrets**: All credentials in environment variables only
2. **Use platform secret stores**: Render/Railway encrypted environment variables
3. **Rotate secrets regularly**: JWT secret, database passwords every 90 days
4. **Minimum secret strength**:
   - JWT secret: 64+ characters
   - Database password: 16+ characters with mixed case, numbers, symbols
   - Redis/Kafka passwords: Provider-generated strong passwords

#### Configuration Validation

**Startup Validation Checklist**:
```java
@Component
public class ConfigurationValidator implements ApplicationRunner {
    
    @Value("${spring.datasource.url:}")
    private String dbUrl;
    
    @Value("${jwt.secret:}")
    private String jwtSecret;
    
    @Value("${spring.data.redis.host:}")
    private String redisHost;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<String> errors = new ArrayList<>();
        
        // Validate required environment variables
        if (dbUrl.isEmpty()) {
            errors.add("DB_URL is required but not set");
        }
        
        if (jwtSecret.isEmpty()) {
            errors.add("JWT_SECRET is required but not set");
        } else if (jwtSecret.length() < 32) {
            log.warn("JWT_SECRET is shorter than 32 characters");
        }
        
        if (redisHost.isEmpty()) {
            log.warn("REDIS_HOST is not set - Redis features will be disabled");
        }
        
        // Validate URL formats
        if (!dbUrl.isEmpty() && !dbUrl.startsWith("jdbc:postgresql://")) {
            errors.add("DB_URL must be a valid PostgreSQL JDBC URL");
        }
        
        if (!errors.isEmpty()) {
            errors.forEach(log::error);
            throw new IllegalStateException("Configuration validation failed");
        }
        
        log.info("Configuration validation passed");
    }
}
```


### Repository Preparation

#### .gitignore Configuration
```gitignore
# Environment files
.env
.env.*
*.env.local
*.env.production
!.env.example

# Build artifacts
target/
dist/
build/
*.jar
*.war
*.class

# IDE files
.idea/
.vscode/
*.iml

# Logs
*.log
logs/

# Secrets
*.secret
*.key
*.pem
credentials.json

# OS files
.DS_Store
Thumbs.db

# Node modules
node_modules/
```

#### env.example Template
```bash
# Frontend Environment Variables
VITE_API_BASE_URL=https://your-gateway-url.onrender.com
VITE_APP_NAME=EHIPAP

# Backend - API Gateway
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
JWT_SECRET=your-64-character-jwt-secret-here
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
EMPLOYEE_SERVICE_URL=https://your-employee-service.onrender.com
PAYROLL_SERVICE_URL=https://your-payroll-service.onrender.com
ATTENDANCE_SERVICE_URL=https://your-attendance-service.onrender.com
RECRUITMENT_SERVICE_URL=https://your-recruitment-service.onrender.com
PERFORMANCE_SERVICE_URL=https://your-performance-service.onrender.com
NOTIFICATION_SERVICE_URL=https://your-notification-service.onrender.com
ANALYTICS_SERVICE_URL=https://your-analytics-service.onrender.com

# Backend - Microservices (all services)
DB_URL=jdbc:postgresql://your-db-host:5432/ehipap?sslmode=require
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_SSL=true
KAFKA_BOOTSTRAP_SERVERS=your-kafka-broker.upstash.io:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="your-username" password="your-password";
JWT_SECRET=your-64-character-jwt-secret-here
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
```


## Security Design

### Authentication Flow

```
┌─────────┐                ┌──────────┐                ┌─────────────┐
│ Browser │                │ Frontend │                │ Auth Service│
└────┬────┘                └────┬─────┘                └──────┬──────┘
     │                          │                             │
     │  1. Enter credentials    │                             │
     ├─────────────────────────>│                             │
     │                          │                             │
     │                          │  2. POST /api/auth/login    │
     │                          ├────────────────────────────>│
     │                          │                             │
     │                          │  3. Validate credentials    │
     │                          │     & generate JWT tokens   │
     │                          │<────────────────────────────┤
     │                          │                             │
     │  4. Store tokens in      │                             │
     │     localStorage         │                             │
     │<─────────────────────────┤                             │
     │                          │                             │
     │  5. Redirect to          │                             │
     │     dashboard            │                             │
     │<─────────────────────────┤                             │
     │                          │                             │
```

### Authorization Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────────┐
│ Browser │     │ Frontend │     │ API Gateway │     │ Microservice │
└────┬────┘     └────┬─────┘     └──────┬──────┘     └──────┬───────┘
     │               │                   │                   │
     │  1. API call  │                   │                   │
     ├──────────────>│                   │                   │
     │               │                   │                   │
     │               │  2. Add JWT token │                   │
     │               │     in header     │                   │
     │               ├──────────────────>│                   │
     │               │                   │                   │
     │               │  3. Validate JWT  │                   │
     │               │     signature     │                   │
     │               │                   │                   │
     │               │  4. Forward if    │                   │
     │               │     valid         │                   │
     │               │                   ├──────────────────>│
     │               │                   │                   │
     │               │                   │  5. Process &     │
     │               │                   │     respond       │
     │               │                   │<──────────────────┤
     │               │                   │                   │
     │               │  6. Return        │                   │
     │               │     response      │                   │
     │               │<──────────────────┤                   │
     │               │                   │                   │
     │  7. Display   │                   │                   │
     │     data      │                   │                   │
     │<──────────────┤                   │                   │
     │               │                   │                   │
```


### CORS Security

#### CORS Configuration Strategy
- **Allowed Origins**: Explicit list of frontend domains (no wildcards in production)
- **Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, X-Requested-With
- **Allow Credentials**: true (required for JWT cookies if used)
- **Max Age**: 3600 seconds (1 hour preflight cache)

#### CORS Validation Logic
```java
@Configuration
public class CorsConfiguration {
    
    @Value("${cors.allowed.origins}")
    private String allowedOrigins;
    
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Parse allowed origins from environment variable
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);
        
        // Configure allowed methods
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Configure allowed headers
        config.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Requested-With"
        ));
        
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
}
```

### Transport Security

#### HTTPS Enforcement
- **Frontend**: Automatic HTTPS via CDN host (Vercel/Netlify)
- **Backend**: Automatic HTTPS via PaaS platform (Render/Railway)
- **HTTP Redirect**: All HTTP requests automatically redirected to HTTPS with 301 status

#### TLS Configuration
- **Minimum TLS Version**: TLS 1.2
- **Certificate Management**: Automatic via Let's Encrypt (managed by platform)
- **Certificate Renewal**: Automatic (no manual intervention required)


### Secret Rotation Strategy

#### JWT Secret Rotation
1. Generate new 64-character random secret
2. Update `JWT_SECRET` in all services (API Gateway + 8 microservices)
3. Deploy services with new secret (rolling deployment)
4. Old tokens become invalid immediately
5. Users must re-authenticate

#### Database Password Rotation
1. Create new database user with new password
2. Update `DB_USERNAME` and `DB_PASSWORD` in all microservices
3. Deploy services with new credentials
4. Verify all services connect successfully
5. Drop old database user

#### Redis/Kafka Credential Rotation
1. Generate new credentials in managed service dashboard
2. Update environment variables in PaaS platform
3. Restart services to pick up new credentials
4. Revoke old credentials in managed service dashboard

## Data Flow

### User Login Flow

1. **User submits credentials** → Frontend validates format
2. **POST /api/auth/login** → API Gateway forwards to Auth Service
3. **Auth Service validates** → Query database for user
4. **Password verification** → BCrypt hash comparison
5. **Generate JWT tokens** → Access token (24h) + Refresh token (7d)
6. **Return tokens** → Frontend stores in localStorage
7. **Redirect to dashboard** → Role-based routing (Super Admin/HR Manager/Employee)

### Authenticated API Request Flow

1. **User action** → Frontend prepares API request
2. **Add Authorization header** → `Bearer <access-token>`
3. **Send to API Gateway** → CORS preflight if needed
4. **JWT validation** → Gateway validates signature and expiration
5. **Route to microservice** → Based on path prefix
6. **Microservice processes** → Business logic execution
7. **Database query** → PostgreSQL via HikariCP connection pool
8. **Cache check** → Redis for frequently accessed data
9. **Event publishing** → Kafka for async operations
10. **Return response** → JSON payload
11. **Frontend updates UI** → React state management


### Token Refresh Flow

1. **API call returns 401** → Access token expired
2. **Extract refresh token** → From localStorage
3. **POST /api/auth/refresh** → With refresh token in body
4. **Auth Service validates** → Check refresh token in database/Redis
5. **Generate new access token** → If refresh token valid
6. **Return new access token** → Frontend stores in localStorage
7. **Retry original request** → With new access token
8. **If refresh fails** → Clear localStorage and redirect to login

### Event-Driven Communication Flow

#### Example: Employee Onboarding

```
Employee Service                Kafka                 Notification Service
      │                          │                           │
      │  1. Create employee      │                           │
      │     in database          │                           │
      │                          │                           │
      │  2. Publish event        │                           │
      ├─────────────────────────>│                           │
      │  {                       │                           │
      │    "type": "EMPLOYEE_    │                           │
      │            CREATED",     │                           │
      │    "employeeId": "123",  │                           │
      │    "email": "..."        │                           │
      │  }                       │                           │
      │                          │                           │
      │                          │  3. Consume event         │
      │                          ├──────────────────────────>│
      │                          │                           │
      │                          │  4. Send welcome email    │
      │                          │                           │
      │                          │  5. Create notification   │
      │                          │                           │
```

### Cache Strategy

#### Redis Caching Patterns

**Cache-Aside Pattern** (for read-heavy data):
```java
public Employee getEmployee(Long id) {
    // 1. Check cache
    String cacheKey = "employee:" + id;
    Employee cached = redisTemplate.opsForValue().get(cacheKey);
    
    if (cached != null) {
        return cached;
    }
    
    // 2. Cache miss - query database
    Employee employee = employeeRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Employee not found"));
    
    // 3. Store in cache with TTL
    redisTemplate.opsForValue().set(cacheKey, employee, 1, TimeUnit.HOURS);
    
    return employee;
}
```


**Write-Through Pattern** (for write-heavy data):
```java
public Employee updateEmployee(Long id, EmployeeDTO dto) {
    // 1. Update database
    Employee employee = employeeRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Employee not found"));
    
    employee.setName(dto.getName());
    employee.setEmail(dto.getEmail());
    Employee updated = employeeRepository.save(employee);
    
    // 2. Update cache immediately
    String cacheKey = "employee:" + id;
    redisTemplate.opsForValue().set(cacheKey, updated, 1, TimeUnit.HOURS);
    
    return updated;
}
```

**Cache Invalidation**:
- **TTL-based**: All cached entries expire after 1 hour
- **Event-based**: Invalidate on update/delete events
- **Manual**: Admin endpoint to clear specific cache keys

#### Cached Data Types
- **User sessions**: JWT token metadata, user preferences
- **Employee data**: Frequently accessed employee records
- **Dashboard metrics**: Aggregated statistics (5-minute TTL)
- **Rate limiting**: API request counters per user/IP

## Error Handling

### Frontend Error Handling

#### API Error Interceptor
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;
    
    // Network error (no response)
    if (!response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - attempt token refresh
        return handleTokenRefresh(error);
      
      case 403:
        // Forbidden - insufficient permissions
        toast.error('You do not have permission to perform this action.');
        break;
      
      case 404:
        // Not found
        toast.error('The requested resource was not found.');
        break;
      
      case 500:
        // Server error
        toast.error('Server error. Please try again later.');
        break;
      
      default:
        // Generic error
        toast.error(response.data?.message || 'An error occurred.');
    }
    
    return Promise.reject(error);
  }
);
```


#### Error Boundary Component
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service (e.g., Sentry)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>
      );
    }
    
    return this.props.children;
  }
}
```

### Backend Error Handling

#### Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_ERROR", ex.getMessage()));
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized access: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("UNAUTHORIZED", ex.getMessage()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```


#### Database Connection Error Handling
```java
@Component
public class DatabaseConnectionHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 5000;
    
    @Override
    public Health health() {
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try (Connection conn = dataSource.getConnection()) {
                if (conn.isValid(5)) {
                    return Health.up()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("status", "Connected")
                        .withDetail("attempt", attempt)
                        .build();
                }
            } catch (SQLException e) {
                log.warn("Database connection attempt {} failed: {}", attempt, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                } else {
                    return Health.down()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("error", e.getMessage())
                        .withDetail("attempts", MAX_RETRIES)
                        .build();
                }
            }
        }
        
        return Health.down().build();
    }
}
```

#### Redis Connection Error Handling
```java
@Service
public class CacheService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            return Optional.ofNullable(type.cast(value));
        } catch (Exception e) {
            log.warn("Redis GET failed for key {}: {}", key, e.getMessage());
            return Optional.empty(); // Graceful degradation
        }
    }
    
    public void set(String key, Object value, long ttl, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl, unit);
        } catch (Exception e) {
            log.warn("Redis SET failed for key {}: {}", key, e.getMessage());
            // Continue without caching - don't fail the request
        }
    }
}
```


#### Kafka Connection Error Handling
```java
@Service
public class EventPublisher {
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final int MAX_RETRY_ATTEMPTS = 3;
    
    public void publishEvent(String topic, Object event) {
        CompletableFuture<SendResult<String, Object>> future = 
            kafkaTemplate.send(topic, event);
        
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish event to topic {}: {}", topic, ex.getMessage());
                // Store failed event in database for retry
                storeFailedEvent(topic, event, ex.getMessage());
            } else {
                log.debug("Event published successfully to topic {}", topic);
            }
        });
    }
    
    private void storeFailedEvent(String topic, Object event, String error) {
        // Store in database table for manual retry or scheduled job
        FailedEvent failedEvent = new FailedEvent();
        failedEvent.setTopic(topic);
        failedEvent.setPayload(serializeEvent(event));
        failedEvent.setError(error);
        failedEvent.setAttempts(0);
        failedEvent.setCreatedAt(LocalDateTime.now());
        
        failedEventRepository.save(failedEvent);
    }
}
```

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/employees",
    "details": {
      "field": "email",
      "rejectedValue": "invalid-email"
    }
  }
}
```


## Testing Strategy

### Unit Testing

#### Frontend Unit Tests
- **Framework**: Vitest + React Testing Library
- **Coverage Target**: 70%+ for business logic
- **Focus Areas**:
  - API client configuration and interceptors
  - Token refresh logic
  - Error handling and user feedback
  - Form validation
  - Redux state management

**Example Test**:
```typescript
describe('API Client', () => {
  it('should add Authorization header when token exists', async () => {
    localStorage.setItem('accessToken', 'test-token');
    
    const mockAdapter = new MockAdapter(apiClient);
    mockAdapter.onGet('/api/employees').reply(200, []);
    
    await apiClient.get('/api/employees');
    
    expect(mockAdapter.history.get[0].headers.Authorization)
      .toBe('Bearer test-token');
  });
  
  it('should attempt token refresh on 401 response', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('refreshToken', 'valid-refresh');
    
    const mockAdapter = new MockAdapter(apiClient);
    mockAdapter.onGet('/api/employees').replyOnce(401);
    mockAdapter.onPost('/api/auth/refresh').reply(200, {
      accessToken: 'new-token'
    });
    mockAdapter.onGet('/api/employees').reply(200, []);
    
    const response = await apiClient.get('/api/employees');
    
    expect(response.status).toBe(200);
    expect(localStorage.getItem('accessToken')).toBe('new-token');
  });
});
```

#### Backend Unit Tests
- **Framework**: JUnit 5 + Mockito
- **Coverage Target**: 80%+ for business logic
- **Focus Areas**:
  - JWT validation logic
  - CORS configuration
  - Service layer business logic
  - Repository layer data access
  - Error handling and exception mapping

**Example Test**:
```java
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {
    
    @Mock
    private ServerWebExchange exchange;
    
    @Mock
    private GatewayFilterChain chain;
    
    @InjectMocks
    private JwtAuthenticationFilter filter;
    
    @Test
    void shouldAllowPublicPaths() {
        when(exchange.getRequest().getPath().value())
            .thenReturn("/api/auth/login");
        
        filter.filter(exchange, chain);
        
        verify(chain).filter(exchange);
    }
    
    @Test
    void shouldRejectInvalidToken() {
        when(exchange.getRequest().getPath().value())
            .thenReturn("/api/employees");
        when(exchange.getRequest().getHeaders().getFirst("Authorization"))
            .thenReturn("Bearer invalid-token");
        
        filter.filter(exchange, chain);
        
        verify(exchange.getResponse()).setStatusCode(HttpStatus.UNAUTHORIZED);
    }
}
```


### Integration Testing

#### Database Integration Tests
- **Framework**: Testcontainers + JUnit 5
- **Scope**: Repository layer with real PostgreSQL
- **Focus Areas**:
  - Schema validation
  - Query correctness
  - Transaction management
  - Constraint enforcement

**Example Test**:
```java
@SpringBootTest
@Testcontainers
class EmployeeRepositoryIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("ehipap_test")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Test
    void shouldSaveAndRetrieveEmployee() {
        Employee employee = new Employee();
        employee.setFirstName("John");
        employee.setLastName("Doe");
        employee.setEmail("john.doe@example.com");
        
        Employee saved = employeeRepository.save(employee);
        
        assertNotNull(saved.getId());
        
        Optional<Employee> retrieved = employeeRepository.findById(saved.getId());
        
        assertTrue(retrieved.isPresent());
        assertEquals("John", retrieved.get().getFirstName());
    }
}
```

#### API Integration Tests
- **Framework**: Spring Boot Test + MockMvc
- **Scope**: Controller layer with mocked services
- **Focus Areas**:
  - Request/response mapping
  - Validation
  - Error handling
  - Security configuration

### End-to-End Testing

#### Smoke Tests (Post-Deployment)
```bash
#!/bin/bash
# smoke-test.sh

FRONTEND_URL="https://ehipap.vercel.app"
API_URL="https://ehipap-gateway.onrender.com"

echo "Running smoke tests..."

# Test 1: Frontend is accessible
echo "Test 1: Frontend accessibility"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $STATUS -eq 200 ]; then
  echo "✓ Frontend is accessible"
else
  echo "✗ Frontend returned status $STATUS"
  exit 1
fi

# Test 2: API Gateway health check
echo "Test 2: API Gateway health"
HEALTH=$(curl -s $API_URL/actuator/health | jq -r '.status')
if [ "$HEALTH" = "UP" ]; then
  echo "✓ API Gateway is healthy"
else
  echo "✗ API Gateway health check failed"
  exit 1
fi

# Test 3: Login endpoint
echo "Test 3: Login endpoint"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Login successful"
else
  echo "✗ Login failed"
  exit 1
fi

echo "All smoke tests passed!"
```


#### Manual Testing Checklist

**Pre-Deployment Validation**:
- [ ] Frontend builds without TypeScript errors
- [ ] Backend builds without compilation errors
- [ ] No localhost references in frontend build output
- [ ] No committed secrets in repository
- [ ] All Dockerfiles present and valid
- [ ] Environment variable documentation complete

**Post-Deployment Validation**:
- [ ] Frontend loads within 5 seconds
- [ ] Login with all three roles (Super Admin, HR Manager, Employee)
- [ ] Dashboard displays data without errors
- [ ] Navigate to all major pages (Employees, Leaves, Payroll, Analytics)
- [ ] Submit a leave request as Employee
- [ ] Approve a leave request as HR Manager
- [ ] View payroll records
- [ ] Check browser console for errors (should be zero)
- [ ] Refresh page on authenticated route (should not redirect to login)
- [ ] Logout and verify tokens cleared

### Performance Testing

#### Load Testing Strategy
- **Tool**: Apache JMeter or k6
- **Scenarios**:
  - 100 concurrent users browsing dashboards
  - 50 concurrent users submitting leave requests
  - 20 concurrent users running payroll
- **Acceptance Criteria**:
  - 95th percentile response time < 2 seconds
  - Error rate < 1%
  - No memory leaks over 1-hour test

### Security Testing

#### Security Checklist
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured with explicit origins (no wildcards)
- [ ] JWT signature validation active
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (Content-Security-Policy headers)
- [ ] Secrets not in source control
- [ ] Database connections use SSL
- [ ] Redis connections use TLS
- [ ] Kafka connections use SASL_SSL


## Monitoring and Observability

### Health Checks

#### Service Health Endpoints

All backend services expose Spring Boot Actuator health endpoints:

**Endpoint**: `/actuator/health`

**Response Format**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.0.0"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 10737418240,
        "free": 5368709120,
        "threshold": 10485760
      }
    }
  }
}
```

**Health Check Configuration**:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

#### PaaS Platform Health Checks

**Render Configuration**:
- **Health Check Path**: `/actuator/health`
- **Initial Delay**: 90 seconds
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Failure Threshold**: 3 consecutive failures

**Railway Configuration**:
- **Health Check Path**: `/actuator/health`
- **Timeout**: 90 seconds
- **Restart Policy**: On failure
- **Max Retries**: 3


### Logging Strategy

#### Log Levels by Environment

**Development**:
- Root: DEBUG
- Application: DEBUG
- SQL: DEBUG (show queries)

**Production**:
- Root: INFO
- Application: INFO
- SQL: WARN (no query logging)
- Security: WARN

#### Structured Logging Format

```java
@Slf4j
@RestController
public class EmployeeController {
    
    @GetMapping("/api/employees/{id}")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long id) {
        log.info("Fetching employee with id={}", id);
        
        try {
            Employee employee = employeeService.getEmployee(id);
            log.info("Successfully retrieved employee id={}", id);
            return ResponseEntity.ok(employee);
        } catch (NotFoundException e) {
            log.warn("Employee not found: id={}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error fetching employee id={}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
}
```

#### Log Aggregation

**PaaS Platform Logs**:
- Render: Built-in log viewer with search and filtering
- Railway: Built-in log viewer with real-time streaming

**Log Retention**:
- Render: 7 days on free tier, 30 days on paid tiers
- Railway: 7 days on free tier, configurable on paid tiers

**Log Export** (for long-term storage):
- Export to external service (e.g., Papertrail, Loggly)
- Or download logs periodically via CLI

### Metrics and Monitoring

#### Application Metrics

Spring Boot Actuator exposes metrics at `/actuator/metrics`:

**Key Metrics**:
- `http.server.requests`: Request count, duration, status codes
- `jvm.memory.used`: JVM memory usage
- `jvm.threads.live`: Active thread count
- `jdbc.connections.active`: Active database connections
- `cache.gets`: Redis cache hit/miss ratio

**Custom Metrics**:
```java
@Service
public class EmployeeService {
    
    private final MeterRegistry meterRegistry;
    private final Counter employeeCreatedCounter;
    
    public EmployeeService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.employeeCreatedCounter = Counter.builder("employees.created")
            .description("Number of employees created")
            .register(meterRegistry);
    }
    
    public Employee createEmployee(EmployeeDTO dto) {
        Employee employee = employeeRepository.save(toEntity(dto));
        employeeCreatedCounter.increment();
        return employee;
    }
}
```


#### Frontend Monitoring

**Error Tracking**:
```typescript
// src/utils/errorTracking.ts
export const logError = (error: Error, context?: Record<string, any>) => {
  console.error('Application error:', error, context);
  
  // Send to monitoring service (e.g., Sentry)
  if (import.meta.env.PROD) {
    // Sentry.captureException(error, { extra: context });
  }
};

// Usage in components
try {
  await apiClient.post('/api/employees', data);
} catch (error) {
  logError(error as Error, { action: 'createEmployee', data });
  toast.error('Failed to create employee');
}
```

**Performance Monitoring**:
```typescript
// src/utils/performance.ts
export const measurePerformance = (metricName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    console.log(`${metricName}: ${duration.toFixed(2)}ms`);
    
    // Send to analytics service
    if (import.meta.env.PROD) {
      // analytics.track(metricName, { duration });
    }
  };
};

// Usage
const endMeasure = measurePerformance('fetchEmployees');
const employees = await apiClient.get('/api/employees');
endMeasure();
```

### Alerting Strategy

#### Critical Alerts (Immediate Response)
- **Service Down**: Any service health check fails for 3 consecutive checks
- **Database Connection Lost**: Cannot connect to PostgreSQL for 30 seconds
- **High Error Rate**: >5% of requests return 5xx errors over 5 minutes
- **Memory Exhaustion**: JVM heap usage >90% for 5 minutes

#### Warning Alerts (Monitor)
- **Slow Response Time**: 95th percentile >3 seconds for 10 minutes
- **Redis Connection Issues**: Cache operations failing >10% of the time
- **Kafka Lag**: Consumer lag >1000 messages for 15 minutes
- **Disk Space Low**: <10% free disk space

#### Alert Channels
- **Email**: For all critical and warning alerts
- **Slack/Discord**: For critical alerts (if configured)
- **PaaS Dashboard**: Built-in notifications


## Deployment Procedures

### Initial Deployment

#### Phase 1: Repository Preparation
1. Create `.gitignore` with all sensitive files excluded
2. Create `env.example` with all required environment variables
3. Audit repository for committed secrets (use `git-secrets` or `trufflehog`)
4. Create `frontend/vercel.json` and `frontend/public/_redirects` for SPA routing
5. Update all Dockerfiles to multi-stage builds
6. Commit and push to GitHub

#### Phase 2: Managed Services Provisioning
1. **PostgreSQL**:
   - Create Neon/Supabase/Render PostgreSQL instance
   - Note connection string with SSL mode
   - Execute `init.sql` to create schema and seed data
   - Verify connection with `psql`

2. **Redis**:
   - Create Upstash Redis instance
   - Note host, port, and password
   - Enable TLS
   - Test connection with `redis-cli`

3. **Kafka**:
   - Create Upstash Kafka or Confluent Cloud cluster
   - Create topics: `employee-events`, `payroll-events`, `attendance-events`, `notification-events`
   - Note bootstrap servers and credentials
   - Test connection with `kafka-console-producer`

#### Phase 3: Backend Deployment (Render/Railway)
1. Connect GitHub repository to PaaS platform
2. Create service for API Gateway:
   - Set Dockerfile path: `backend/infrastructure/api-gateway/Dockerfile`
   - Set Docker context: `backend/infrastructure/api-gateway`
   - Configure environment variables (JWT_SECRET, CORS_ALLOWED_ORIGINS, service URLs)
   - Set health check path: `/actuator/health`
   - Deploy and verify health

3. Create services for each microservice (repeat 8 times):
   - Set Dockerfile path: `backend/services/{service-name}/Dockerfile`
   - Set Docker context: `backend/services/{service-name}`
   - Configure environment variables (DB_URL, REDIS, KAFKA, JWT_SECRET)
   - Set health check path: `/actuator/health`
   - Deploy and verify health

4. Note all service URLs for API Gateway configuration

#### Phase 4: Frontend Deployment (Vercel/Netlify)
1. Connect GitHub repository to CDN host
2. Configure build settings:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Configure environment variables:
   - `VITE_API_BASE_URL`: API Gateway URL (no trailing slash)
   - `VITE_APP_NAME`: `EHIPAP`
4. Deploy and verify build succeeds
5. Test SPA routing by navigating to `/dashboard` directly

#### Phase 5: End-to-End Validation
1. Open frontend URL in browser
2. Login with `superadmin` / `Admin@123`
3. Verify dashboard loads with data
4. Navigate to Employees, Leaves, Payroll, Analytics pages
5. Submit a leave request
6. Check browser console for errors (should be zero)
7. Refresh page on authenticated route
8. Logout and verify redirect to login


### Continuous Deployment

#### Auto-Deploy Workflow

```
Developer                GitHub                 PaaS Platform           CDN Host
    │                      │                         │                     │
    │  1. Push to main     │                         │                     │
    ├─────────────────────>│                         │                     │
    │                      │                         │                     │
    │                      │  2. Trigger CI          │                     │
    │                      │     workflow            │                     │
    │                      │                         │                     │
    │                      │  3. Build & test        │                     │
    │                      │     frontend            │                     │
    │                      │                         │                     │
    │                      │  4. Build & test        │                     │
    │                      │     backend             │                     │
    │                      │                         │                     │
    │                      │  5. CI passes           │                     │
    │                      │                         │                     │
    │                      │  6. Webhook to PaaS     │                     │
    │                      ├────────────────────────>│                     │
    │                      │                         │                     │
    │                      │  7. Pull code & build   │                     │
    │                      │     Docker images       │                     │
    │                      │                         │                     │
    │                      │  8. Deploy services     │                     │
    │                      │     (rolling)           │                     │
    │                      │                         │                     │
    │                      │  9. Webhook to CDN      │                     │
    │                      ├─────────────────────────────────────────────>│
    │                      │                         │                     │
    │                      │  10. Build frontend     │                     │
    │                      │                         │                     │
    │                      │  11. Deploy to CDN      │                     │
    │                      │                         │                     │
    │  12. Deployment      │                         │                     │
    │      complete        │                         │                     │
    │<─────────────────────┤                         │                     │
    │                      │                         │                     │
```

#### Rollback Procedure

**Frontend Rollback** (Vercel/Netlify):
1. Open deployments page in dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Verify rollback successful (< 1 minute)

**Backend Rollback** (Render/Railway):
1. Open service dashboard
2. Find previous successful deployment
3. Click "Redeploy" on previous version
4. Wait for health checks to pass (< 5 minutes)
5. Verify all services healthy

**Database Rollback**:
- Database schema changes are NOT automatically rolled back
- Manual intervention required if schema migration fails
- Always test schema changes in staging environment first


### Troubleshooting Guide

#### Common Issues and Solutions

**Issue 1: Frontend shows blank screen**
- **Symptom**: White screen, no content, console shows CORS error
- **Cause**: CORS not configured or frontend domain not in allowed origins
- **Solution**:
  1. Check API Gateway `CORS_ALLOWED_ORIGINS` environment variable
  2. Ensure frontend domain is listed (e.g., `https://ehipap.vercel.app`)
  3. Restart API Gateway service
  4. Clear browser cache and reload

**Issue 2: API calls return 401 Unauthorized**
- **Symptom**: All API calls fail with 401, even after login
- **Cause**: JWT secret mismatch between Auth Service and API Gateway
- **Solution**:
  1. Verify `JWT_SECRET` is identical in Auth Service and API Gateway
  2. Ensure secret is at least 32 characters
  3. Restart both services
  4. Clear localStorage and login again

**Issue 3: Service fails to start (database connection)**
- **Symptom**: Service logs show "Failed to connect to PostgreSQL"
- **Cause**: Invalid database URL or credentials
- **Solution**:
  1. Verify `DB_URL` format: `jdbc:postgresql://host:port/db?sslmode=require`
  2. Check `DB_USERNAME` and `DB_PASSWORD` are correct
  3. Test connection with `psql` from local machine
  4. Verify database allows connections from PaaS platform IP range
  5. Check database is not paused (Neon free tier auto-pauses)

**Issue 4: Redis connection timeout**
- **Symptom**: Service logs show "Redis connection timeout"
- **Cause**: Invalid Redis host/password or network issue
- **Solution**:
  1. Verify `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` are correct
  2. Ensure `REDIS_SSL=true` for Upstash
  3. Test connection with `redis-cli --tls -h host -p port -a password`
  4. Service should continue working (graceful degradation)

**Issue 5: Kafka consumer lag**
- **Symptom**: Events not processed, consumer lag increasing
- **Cause**: Consumer not running or broker unreachable
- **Solution**:
  1. Check service logs for Kafka connection errors
  2. Verify `KAFKA_BOOTSTRAP_SERVERS` is correct
  3. Verify SASL credentials are correct
  4. Check Kafka broker status in provider dashboard
  5. Restart consumer service

**Issue 6: Build fails in CI pipeline**
- **Symptom**: GitHub Actions workflow fails on build step
- **Cause**: TypeScript errors, missing dependencies, or test failures
- **Solution**:
  1. Run `npm run build` locally to reproduce error
  2. Fix TypeScript errors or test failures
  3. Ensure `package-lock.json` is committed
  4. Push fix and re-run workflow


## Cost Estimation

### Free Tier Deployment

**Frontend (Vercel Free Tier)**:
- Bandwidth: 100 GB/month
- Builds: Unlimited
- Deployments: Unlimited
- Custom domain: Yes
- **Cost**: $0/month

**Backend (Render Free Tier)**:
- 750 hours/month per service (enough for 1 service 24/7)
- 512 MB RAM per service
- Shared CPU
- Auto-sleep after 15 minutes of inactivity
- **Limitation**: Need paid tier for 9 services (API Gateway + 8 microservices)
- **Cost**: $0/month for 1 service, $7/month per additional service
- **Total for 9 services**: $56/month

**Database (Neon Free Tier)**:
- 0.5 GB storage
- 1 project
- Auto-suspend after 5 minutes of inactivity
- **Limitation**: May need paid tier for production workload
- **Cost**: $0/month (free tier), $19/month (paid tier)

**Redis (Upstash Free Tier)**:
- 10,000 commands/day
- 256 MB storage
- **Limitation**: May need paid tier for production workload
- **Cost**: $0/month (free tier), $10/month (paid tier)

**Kafka (Upstash Free Tier)**:
- 10,000 messages/day
- 1 topic
- **Limitation**: Need paid tier for 4 topics
- **Cost**: $0/month (free tier), $20/month (paid tier)

**Total Monthly Cost**:
- **Minimum (free tiers)**: $0/month (with limitations)
- **Recommended (production-ready)**: ~$105/month
  - Render: $56/month (9 services)
  - Neon: $19/month
  - Upstash Redis: $10/month
  - Upstash Kafka: $20/month

### Alternative: Railway Deployment

**Railway Pricing**:
- $5/month base + usage-based pricing
- ~$10-15/month per service (depending on usage)
- **Total for 9 services**: ~$90-135/month

### Cost Optimization Strategies

1. **Consolidate Services**: Combine low-traffic microservices into a single deployment
2. **Use Free Tiers**: Start with free tiers for development/demo, upgrade as needed
3. **Auto-Scaling**: Configure auto-scaling to scale down during low traffic
4. **Caching**: Aggressive caching to reduce database queries and API calls
5. **CDN**: Leverage CDN caching to reduce backend load


## Future Enhancements

### Phase 2 Improvements

1. **Database Migration Management**:
   - Migrate from `init.sql` to Flyway for versioned schema migrations
   - Implement rollback scripts for each migration
   - Add migration validation in CI pipeline

2. **Observability Enhancement**:
   - Integrate with Sentry for error tracking
   - Add distributed tracing with OpenTelemetry
   - Implement custom dashboards with Grafana

3. **Performance Optimization**:
   - Implement API response caching with Redis
   - Add database query optimization and indexing
   - Implement connection pooling tuning
   - Add CDN caching headers for static assets

4. **Security Hardening**:
   - Implement rate limiting per user/IP
   - Add API request signing for sensitive operations
   - Implement audit logging for all data modifications
   - Add Content-Security-Policy headers

5. **High Availability**:
   - Deploy multiple instances of each service
   - Implement circuit breakers with Resilience4j
   - Add retry logic with exponential backoff
   - Implement graceful shutdown handling

6. **Developer Experience**:
   - Add staging environment for pre-production testing
   - Implement feature flags for gradual rollouts
   - Add automated database seeding for test environments
   - Create developer documentation portal

7. **Backup and Disaster Recovery**:
   - Implement automated database backups (daily)
   - Add point-in-time recovery capability
   - Create disaster recovery runbook
   - Test recovery procedures quarterly

8. **Compliance and Governance**:
   - Implement GDPR compliance features (data export, deletion)
   - Add audit trail for all user actions
   - Implement data retention policies
   - Add compliance reporting


## Appendix

### Environment Variable Reference

#### Frontend Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `https://ehipap-gateway.onrender.com` | API Gateway public URL (no trailing slash) |
| `VITE_APP_NAME` | No | `EHIPAP` | Application display name |

#### API Gateway Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Spring profile to activate |
| `PORT` | No | `8080` | Port to bind (default: 8080) |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://ehipap.vercel.app` | Comma-separated list of allowed origins |
| `JWT_SECRET` | Yes | `<64-char-secret>` | JWT signing secret (min 64 chars) |
| `AUTH_SERVICE_URL` | Yes | `https://ehipap-auth.onrender.com` | Auth service URL |
| `EMPLOYEE_SERVICE_URL` | Yes | `https://ehipap-employee.onrender.com` | Employee service URL |
| `PAYROLL_SERVICE_URL` | Yes | `https://ehipap-payroll.onrender.com` | Payroll service URL |
| `ATTENDANCE_SERVICE_URL` | Yes | `https://ehipap-attendance.onrender.com` | Attendance service URL |
| `RECRUITMENT_SERVICE_URL` | Yes | `https://ehipap-recruitment.onrender.com` | Recruitment service URL |
| `PERFORMANCE_SERVICE_URL` | Yes | `https://ehipap-performance.onrender.com` | Performance service URL |
| `NOTIFICATION_SERVICE_URL` | Yes | `https://ehipap-notification.onrender.com` | Notification service URL |
| `ANALYTICS_SERVICE_URL` | Yes | `https://ehipap-analytics.onrender.com` | Analytics service URL |

#### Microservice Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Spring profile to activate |
| `PORT` | No | `8080` | Port to bind (default: 8080) |
| `SERVICE_NAME` | Yes | `employee-service` | Service name for logging |
| `DB_URL` | Yes | `jdbc:postgresql://host:5432/ehipap?sslmode=require` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Yes | `ehipap_user` | Database username |
| `DB_PASSWORD` | Yes | `<secure-password>` | Database password |
| `REDIS_HOST` | Yes | `<host>.upstash.io` | Redis host |
| `REDIS_PORT` | Yes | `6379` | Redis port |
| `REDIS_PASSWORD` | Yes | `<password>` | Redis password |
| `REDIS_SSL` | Yes | `true` | Enable Redis TLS |
| `KAFKA_BOOTSTRAP_SERVERS` | Yes | `<broker>.upstash.io:9092` | Kafka broker address |
| `KAFKA_SECURITY_PROTOCOL` | Yes | `SASL_SSL` | Kafka security protocol |
| `KAFKA_SASL_MECHANISM` | Yes | `SCRAM-SHA-256` | SASL mechanism |
| `KAFKA_SASL_JAAS_CONFIG` | Yes | `org.apache.kafka...` | SASL JAAS config |
| `JWT_SECRET` | Yes | `<64-char-secret>` | JWT signing secret (min 64 chars) |
| `JWT_EXPIRATION` | No | `86400000` | Access token expiration (ms) |
| `JWT_REFRESH_EXPIRATION` | No | `604800000` | Refresh token expiration (ms) |


### Service Port Mapping

| Service | Local Port | Container Port | PaaS Port |
|---------|------------|----------------|-----------|
| Frontend | 5173 (dev), 3001 (docker) | 80 | N/A (CDN) |
| API Gateway | 8880 | 8080 | 8080 (or $PORT) |
| Auth Service | 8081 | 8081 | 8080 (or $PORT) |
| Employee Service | 8082 | 8082 | 8080 (or $PORT) |
| Payroll Service | 8083 | 8083 | 8080 (or $PORT) |
| Attendance Service | 8084 | 8084 | 8080 (or $PORT) |
| Recruitment Service | 8085 | 8085 | 8080 (or $PORT) |
| Performance Service | 8086 | 8086 | 8080 (or $PORT) |
| Notification Service | 8087 | 8087 | 8080 (or $PORT) |
| Analytics Service | 8088 | 8088 | 8080 (or $PORT) |

### Technology Stack Summary

**Frontend**:
- React 18.3.1
- TypeScript 5.4.5
- Vite 5.3.1
- Material-UI 5.15.20
- Redux Toolkit 2.2.5
- Axios 1.7.2
- React Router 6.23.1

**Backend**:
- Java 21
- Spring Boot 3.3.x
- Spring Cloud Gateway
- Spring Security 6
- Spring Data JPA
- PostgreSQL Driver
- Redis (Lettuce)
- Kafka Client

**Infrastructure**:
- PostgreSQL 15+
- Redis 7
- Kafka (Confluent Platform 7.6.1 compatible)
- Docker
- GitHub Actions

**Deployment Platforms**:
- Vercel or Netlify (Frontend)
- Render or Railway (Backend)
- Neon, Supabase, or Render (PostgreSQL)
- Upstash (Redis & Kafka)

