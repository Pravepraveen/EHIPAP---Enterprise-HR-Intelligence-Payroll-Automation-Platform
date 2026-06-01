# Requirements Document

## Introduction

EHIPAP (Enterprise HR Intelligence & Payroll Automation Platform) is a full-stack enterprise application consisting of a React/TypeScript frontend, a Java Spring Boot microservices backend (API Gateway + 8 domain services), PostgreSQL, Redis, Kafka, and MinIO. The platform is currently runnable only on a local machine via Docker Compose.

This feature covers everything required to deploy EHIPAP publicly so that any user with a browser can access the platform through a stable public URL, log in with their credentials, and use all role-based dashboards (Super Admin, HR Manager, Employee) including leave management, payroll, recruitment, performance, and analytics — with no localhost dependencies remaining.

The deployment targets:
- **Frontend**: Vercel or Netlify (static hosting with SPA support)
- **Backend (API Gateway + microservices)**: Render or Railway (container/Docker-based PaaS)
- **Database**: Neon, Supabase, or Render PostgreSQL (managed cloud PostgreSQL)
- **Managed services**: Upstash Redis (managed Redis), Confluent Cloud or Upstash Kafka (managed Kafka)
- **Source control**: GitHub with auto-deploy on push to `main`

---

## Glossary

- **API_Gateway**: The Spring Cloud Gateway service that routes all `/api/**` requests to downstream microservices and validates JWT tokens.
- **Auth_Service**: The `identity-auth-service` Spring Boot service responsible for login, JWT issuance, and token refresh.
- **Frontend**: The React 18 / TypeScript / Vite application served as a static SPA.
- **Microservice**: Any of the eight domain Spring Boot services (employee, payroll, attendance, recruitment, performance, notification, analytics, auth).
- **Cloud_DB**: The managed PostgreSQL instance hosted on a cloud provider (Neon, Supabase, or Render Postgres).
- **Managed_Redis**: The managed Redis instance (Upstash Redis or equivalent).
- **Managed_Kafka**: The managed Kafka instance (Upstash Kafka or Confluent Cloud).
- **PaaS**: Platform-as-a-Service provider used to host containerised backend services (Render or Railway).
- **CDN_Host**: Static hosting provider used to serve the frontend (Vercel or Netlify).
- **Environment_Variable**: A runtime configuration value injected at deploy time, never committed to source control.
- **CORS**: Cross-Origin Resource Sharing — the HTTP mechanism that allows the frontend domain to call the API Gateway domain.
- **JWT**: JSON Web Token used for stateless authentication between the frontend and backend.
- **SPA_Routing**: Single-Page Application routing where the CDN_Host must serve `index.html` for all non-asset paths so React Router can handle navigation client-side.
- **Auto_Deploy**: Automatic re-deployment triggered when a commit is pushed to the `main` branch of the GitHub repository.
- **Health_Endpoint**: The Spring Boot Actuator `/actuator/health` endpoint used by PaaS platforms to determine service readiness.
- **Init_SQL**: The `infra/docker/postgres/init.sql` file containing the full schema DDL and demo seed data.
- **Flyway**: Database migration tool; currently the auth service has a `db/migration` directory with no files — schema is managed via Init_SQL.
- **Secret**: Any credential, key, or token that must never be committed to source control (database passwords, JWT secret, Redis password, Kafka credentials, MinIO keys).
- **env.example**: A committed file listing all required environment variable names with placeholder values, used as documentation for deployment configuration.

---

## Requirements

### Requirement 1: Repository Preparation

**User Story:** As a developer, I want the GitHub repository to be clean and deployment-ready, so that CI/CD pipelines and PaaS platforms can build and deploy the project without manual intervention.

#### Acceptance Criteria

1. THE Repository SHALL contain a `.gitignore` file that excludes `.env`, `*.env.local`, `target/`, `node_modules/`, `dist/`, `*.jar`, `*.class`, and all files matching `*.secret`.
2. THE Repository SHALL contain a root-level `env.example` file listing every required environment variable name. Each value in `env.example` SHALL be a descriptive placeholder string (e.g., `your-db-password-here`) that does not match the pattern of a real credential (i.e., it is not a valid JDBC URL, JWT token, or cloud service key).
3. THE Repository SHALL NOT contain any committed file that holds a real secret value. A "real secret value" is defined as any of: a JDBC connection string with a non-placeholder password, a JWT signing key of 32 or more characters that is not a recognisable placeholder, an API key or token issued by a cloud provider, or a Redis/Kafka password.
4. WHEN a developer clones the repository and copies `env.example` to `.env` with real credential values substituted, ALL eight microservices and the API Gateway SHALL start without logging any error that references a missing or invalid credential.
5. THE Repository SHALL contain a `README.md` with the following minimum sections: (a) Public URL of the deployed frontend, (b) Deployment architecture diagram or description listing all services and their hosting platforms, (c) Step-by-step instructions for configuring environment variables for a new deployment, (d) List of all required environment variable names grouped by service.

---

### Requirement 2: Frontend Build Correctness

**User Story:** As a developer, I want the frontend to produce a clean production build with no TypeScript errors and no hardcoded localhost references, so that the built artefact can be deployed to any CDN host.

#### Acceptance Criteria

1. WHEN `npm run build` is executed in the `frontend/` directory, THE Frontend SHALL complete without TypeScript compilation errors or Vite build errors.
2. THE Frontend SHALL read the API base URL exclusively from the `VITE_API_BASE_URL` environment variable at build time. A grep of all `.js` files in `dist/assets/` for the patterns `localhost`, `127.0.0.1`, and any private IP address (matching `10\.`, `192\.168\.`, `172\.(1[6-9]|2[0-9]|3[01])\.`) SHALL return zero matches.
3. WHEN `VITE_API_BASE_URL` is set to the public API Gateway URL, THE Frontend SHALL prepend that URL as an absolute URL prefix to all `/api/**` request paths before sending them.
4. WHEN `VITE_API_BASE_URL` is empty or unset at build time, THE Frontend SHALL fall back to relative `/api/**` paths so that Docker/nginx proxy deployments continue to function.
5. WHEN `VITE_API_BASE_URL` is set to a value with a trailing slash (e.g., `https://gateway.example.com/`), THE Frontend SHALL strip the trailing slash before prepending it to request paths so that no double-slash appears in the final URL.
6. THE Frontend build output in `dist/` SHALL contain only static assets (HTML, JS, CSS, images) with no server-side runtime dependencies.
7. IF the `frontend/.env.production` file exists, THEN it SHALL NOT contain any hardcoded IP address or hostname other than a recognisable placeholder string; real backend URLs SHALL be supplied exclusively via the CDN_Host dashboard environment variable settings.
8. IF the `vite.config.ts` `base` option is set to a value other than `'/'` for a CDN_Host production build, THEN the build SHALL be considered misconfigured and the CI pipeline SHALL fail with an error identifying the incorrect `base` value.

---

### Requirement 3: Frontend SPA Routing on CDN Host

**User Story:** As a user, I want to be able to refresh the browser on any page (e.g., `/dashboard`, `/leaves`) and land on the correct page, so that deep links and bookmarks work correctly.

#### Acceptance Criteria

1. WHEN a user navigates directly to any frontend route (e.g., `https://<public-url>/dashboard`), THE CDN_Host SHALL serve `index.html` so that React Router can handle the route client-side.
2. THE Repository SHALL contain a `frontend/vercel.json` file with a rewrite rule where `"source"` is `"/(.*)"` and `"destination"` is `"/index.html"`, so that Vercel serves `index.html` for all non-asset paths.
3. THE Repository SHALL contain a `frontend/public/_redirects` file with the single rule `/* /index.html 200`, so that Netlify serves `index.html` for all non-asset paths.
4. IF either `frontend/vercel.json` or `frontend/public/_redirects` is absent from the repository at the time of a CDN_Host deployment, THEN the deployment SHALL fail with an error message identifying the missing file and no new version SHALL be published.
5. IF the CDN_Host platform is Vercel, THEN THE Frontend SHALL use `BrowserRouter` (not `HashRouter`) so that URLs are clean paths without `#` fragments.
6. IF a logged-in user navigates to a route that does not exist, THEN THE Frontend SHALL redirect the user to the default dashboard route for their role within 1 second.
7. IF an unauthenticated user navigates to a route that does not exist, THEN THE Frontend SHALL redirect the user to the login page within 1 second.

---

### Requirement 4: Frontend Environment Variable Configuration for CDN Host

**User Story:** As a developer, I want to configure the frontend's API URL through the CDN host's environment variable settings, so that no rebuild is needed when the backend URL changes.

#### Acceptance Criteria

1. THE CDN_Host deployment SHALL have `VITE_API_BASE_URL` set to the public HTTPS URL of the deployed API_Gateway. The value SHALL match the pattern `https://<hostname>` with no trailing slash (e.g., `https://ehipap-gateway.onrender.com`).
2. THE CDN_Host deployment SHALL have `VITE_APP_NAME` set to `EHIPAP`.
3. WHEN the `VITE_API_BASE_URL` environment variable is updated in the CDN_Host dashboard, THE CDN_Host SHALL trigger a new build and deploy automatically within 5 minutes of the update being saved.
4. THE `frontend/.env.production` file SHALL NOT contain any real backend URL or IP address. Any value present in that file SHALL be a non-URL placeholder string (e.g., `VITE_API_BASE_URL=` or `VITE_API_BASE_URL=https://replace-with-your-gateway-url`), with real values supplied exclusively via the CDN_Host dashboard.
5. WHEN `VITE_API_BASE_URL` is absent or empty at build time, THE Frontend build SHALL complete successfully and all API calls SHALL use relative `/api/**` paths, so that the build does not fail due to a missing environment variable.

---

### Requirement 5: API Gateway CORS Configuration

**User Story:** As a developer, I want the API Gateway to accept requests from the public frontend domain, so that browser-based API calls are not blocked by CORS policy.

#### Acceptance Criteria

1. IF a browser sends a cross-origin request from the public CDN_Host domain (e.g., `https://ehipap.vercel.app`), THEN THE API_Gateway SHALL include the `Access-Control-Allow-Origin` response header set to that origin and process the request normally.
2. THE API_Gateway CORS configuration SHALL support the HTTP methods `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, and `OPTIONS`.
3. THE API_Gateway CORS configuration SHALL allow the `Authorization`, `Content-Type`, and `X-Requested-With` request headers.
4. WHEN `allowCredentials` is set to `true`, THE API_Gateway SHALL NOT use wildcard `*` in `allowedOrigins`; it SHALL list specific allowed origins explicitly.
5. THE API_Gateway SHALL read the list of allowed CORS origins from the `CORS_ALLOWED_ORIGINS` environment variable so that origins can be updated without a code change.
6. IF a preflight `OPTIONS` request is received from an allowed origin, THEN THE API_Gateway SHALL respond with HTTP 200 and include `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` headers matching the configured allowed origin, methods, and headers — all within 500ms.
7. IF a cross-origin request arrives from an origin that is NOT listed in `CORS_ALLOWED_ORIGINS`, THEN THE API_Gateway SHALL respond with HTTP 403 and SHALL NOT include any `Access-Control-Allow-Origin` header in the response.
8. WHEN the API_Gateway starts and `CORS_ALLOWED_ORIGINS` is absent or empty, THE API_Gateway SHALL fail to start and log an error message stating that `CORS_ALLOWED_ORIGINS` is required.

---

### Requirement 6: API Gateway Production Configuration

**User Story:** As a developer, I want the API Gateway to start correctly in a cloud environment using environment variables for all service URLs, so that it routes requests to the correct backend microservices.

#### Acceptance Criteria

1. THE API_Gateway SHALL read all downstream service URLs (`AUTH_SERVICE_URL`, `EMPLOYEE_SERVICE_URL`, `PAYROLL_SERVICE_URL`, `ATTENDANCE_SERVICE_URL`, `RECRUITMENT_SERVICE_URL`, `PERFORMANCE_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `ANALYTICS_SERVICE_URL`) from environment variables.
2. THE API_Gateway SHALL read the JWT secret from the `JWT_SECRET` environment variable. WHEN `JWT_SECRET` is absent or empty at startup, THE API_Gateway SHALL fail to start and log an error message identifying `JWT_SECRET` as the missing variable.
3. WHEN the `SPRING_PROFILES_ACTIVE` environment variable is set to `docker` or `prod`, THE API_Gateway SHALL use the environment-variable-supplied service URLs instead of any `localhost` defaults.
4. IF any required service URL environment variable is missing or its value does not begin with `http://` or `https://`, THEN THE API_Gateway SHALL fail to start and log an error message that names the specific missing or invalid variable.
5. IF the `PORT` environment variable is set to a value in the range 1–65535, THEN THE API_Gateway SHALL bind to `0.0.0.0` on that port. IF `PORT` is absent or set to a value outside 1–65535, THEN THE API_Gateway SHALL bind to `0.0.0.0:8080`.
6. WHEN the API_Gateway container starts, THE health endpoint at `/actuator/health` SHALL return HTTP 200 within 60 seconds of the JVM process starting.
7. WHILE the API_Gateway is starting up and before it is ready to serve traffic, THE health endpoint at `/actuator/health` SHALL return HTTP 503 so that the PaaS platform does not route traffic to the instance prematurely.

---

### Requirement 7: Microservice Production Configuration

**User Story:** As a developer, I want each microservice to start correctly in a cloud environment using environment variables for database, Redis, Kafka, and JWT configuration, so that no service fails to start due to missing or hardcoded connection strings.

#### Acceptance Criteria

1. EACH Microservice SHALL read its database connection URL from the `DB_URL` environment variable (JDBC format: `jdbc:postgresql://<host>:<port>/<db>`).
2. EACH Microservice SHALL read database credentials from `DB_USERNAME` and `DB_PASSWORD` environment variables.
3. EACH Microservice that uses Redis SHALL read the Redis connection from `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables.
4. EACH Microservice that uses Kafka SHALL read the broker address from the `KAFKA_BOOTSTRAP_SERVERS` environment variable.
5. EACH Microservice SHALL read the JWT secret from the `JWT_SECRET` environment variable. The value of `JWT_SECRET` SHALL be at least 32 characters long; if it is shorter, the microservice SHALL log a warning at startup.
6. WHEN a Microservice cannot connect to its required database within 30 seconds of startup, THE Microservice SHALL log an error message that names the failing dependency (e.g., `"Failed to connect to PostgreSQL at <DB_URL>"`) and exit with a non-zero status code.
7. WHEN a Microservice cannot connect to Redis or Kafka within 30 seconds of startup, THE Microservice SHALL log a warning message naming the failing dependency and continue starting up so that non-Redis/non-Kafka features remain functional.
8. WHEN any required environment variable (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, or `JWT_SECRET`) is absent or empty at startup, THE Microservice SHALL fail to start immediately and log an error message that names each missing variable before exiting with a non-zero status code.
9. WHEN each Microservice container starts, THE health endpoint at `/actuator/health` SHALL return HTTP 200 within 90 seconds of the JVM process starting.

---

### Requirement 8: Cloud Database Configuration

**User Story:** As a developer, I want the production PostgreSQL database to be provisioned on a managed cloud service with the full schema and demo seed data loaded, so that the application works immediately after deployment.

#### Acceptance Criteria

1. THE Cloud_DB SHALL be provisioned on a managed PostgreSQL provider (Neon, Supabase, or Render Postgres) with PostgreSQL version 15 or higher.
2. WHEN the Cloud_DB contains no application tables (i.e., it is a freshly provisioned instance), THE `Init_SQL` script SHALL be executed to create all tables, indexes, and demo seed data.
3. THE Cloud_DB connection string SHALL be provided to all Microservices via the `DB_URL` environment variable in JDBC format.
4. THE Cloud_DB SHALL have SSL mode enabled (`sslmode=require`) in the connection string to encrypt data in transit.
5. THE Cloud_DB credentials SHALL be stored exclusively as environment variables in the PaaS platform's secret store and SHALL NOT be committed to source control.
6. WHEN the `Init_SQL` script is re-executed against a database that already contains application tables, THE `INSERT` statements SHALL use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` clauses so that the script completes without error and does not duplicate existing rows.
7. IF the `Init_SQL` script fails during execution (e.g., due to a syntax error or constraint violation), THEN the database SHALL remain in its pre-execution state (no partial schema or data committed) and the provisioning process SHALL report an error identifying the failing statement.
8. WHEN a Microservice starts and `DB_URL` is absent or empty, THE Microservice SHALL fail to start immediately and log an error message stating that `DB_URL` is required, before exiting with a non-zero status code.

---

### Requirement 9: Managed Redis Configuration

**User Story:** As a developer, I want the production Redis instance to be a managed cloud service, so that the Auth_Service and other services can store session cache data without running a local Redis container.

#### Acceptance Criteria

1. THE Managed_Redis instance SHALL be provisioned on Upstash Redis or an equivalent managed provider.
2. EACH of the eight Microservices (employee, payroll, attendance, recruitment, performance, notification, analytics, auth) that uses Redis SHALL connect using the `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables supplied by the managed provider.
3. WHEN the Redis connection is unavailable at startup and the connection attempt has not succeeded within 2000ms (matching the configured `spring.redis.timeout`), THE Microservice SHALL log a warning-level message identifying Redis as unavailable and continue starting up.
4. IF the Redis connection becomes unavailable after a Microservice has started successfully, THEN THE Microservice SHALL log a warning-level message on each failed cache operation and continue processing the request using a cache-miss fallback (i.e., fetch from the database directly).
5. WHEN `REDIS_SSL` is set to `true`, THE Managed_Redis connection SHALL use TLS. WHEN `REDIS_SSL` is absent or set to `false`, THE connection SHALL use a plain TCP connection.

---

### Requirement 10: Managed Kafka Configuration

**User Story:** As a developer, I want the production Kafka instance to be a managed cloud service, so that microservices can publish and consume domain events without running a local Kafka/Zookeeper cluster.

#### Acceptance Criteria

1. THE Managed_Kafka instance SHALL be provisioned on Upstash Kafka or Confluent Cloud.
2. EACH Microservice that uses Kafka SHALL connect using the `KAFKA_BOOTSTRAP_SERVERS` environment variable.
3. WHERE Managed_Kafka requires SASL/SSL authentication, EACH Microservice SHALL read Kafka credentials from `KAFKA_SASL_USERNAME` and `KAFKA_SASL_PASSWORD` environment variables and configure SASL_SSL security protocol.
4. WHEN the Kafka broker is unavailable at startup, THE Microservice SHALL log a warning-level entry that names the broker address, THE health endpoint at `/actuator/health` SHALL respond within 5 seconds of the startup attempt completing, and all non-Kafka HTTP endpoints SHALL remain reachable and return correct responses.
5. WHEN the Kafka broker is unavailable at startup, THE Microservice SHALL attempt to reconnect to the broker every 30 seconds in the background so that Kafka functionality resumes automatically when the broker becomes available, without requiring a service restart.
6. WHEN `KAFKA_SASL_USERNAME` or `KAFKA_SASL_PASSWORD` is absent or empty and the broker requires SASL authentication, THE Microservice SHALL fail to start and log an error message identifying which credential variable is missing, before exiting with a non-zero status code.

---

### Requirement 11: Backend Containerisation and PaaS Deployment

**User Story:** As a developer, I want each backend service to be deployable as a Docker container on a PaaS platform, so that the backend is publicly accessible via a stable HTTPS URL.

#### Acceptance Criteria

1. EACH Microservice Dockerfile SHALL use a multi-stage build: a Maven build stage using `maven:3.9-eclipse-temurin-21` and a runtime stage using `eclipse-temurin:21-jre-alpine` to produce a minimal image.
2. THE API_Gateway Dockerfile SHALL expose port `8080`. IF the `PORT` environment variable is set by the PaaS platform to a value other than `8080`, THEN the `ENTRYPOINT` SHALL pass `-Dserver.port=${PORT}` to the JVM so the service binds to the PaaS-assigned port.
3. WHEN deployed to Render or Railway, THE API_Gateway SHALL respond with HTTP 200 to a GET request sent to `https://<paas-assigned-hostname>/actuator/health` from outside the PaaS network, confirming the service is publicly reachable.
4. THE PaaS deployment for the API_Gateway SHALL have a health check configured pointing to `/actuator/health` with a startup grace period of at least 90 seconds and a check interval of no more than 30 seconds.
5. EACH Microservice deployed to PaaS SHALL have all required environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `KAFKA_BOOTSTRAP_SERVERS`, `JWT_SECRET`) present in the PaaS platform's environment settings before the service is started; the PaaS deployment SHALL be considered misconfigured if any of these variables is absent.
6. WHEN a new commit is pushed to the `main` branch of the GitHub repository, THE PaaS platform SHALL automatically start a new build and deploy for the API_Gateway and all Microservices within 10 minutes of the push event being received.

---

### Requirement 12: Frontend CDN Host Deployment

**User Story:** As a developer, I want the frontend to be deployed to a CDN host with auto-deploy from GitHub, so that the latest version of the frontend is always publicly accessible.

#### Acceptance Criteria

1. THE CDN_Host project SHALL be connected to the GitHub repository and configured to deploy from the `frontend/` subdirectory as the root directory.
2. THE CDN_Host build command SHALL be `npm run build` and the publish directory SHALL be `dist`.
3. WHEN a commit is pushed to the `main` branch, THE CDN_Host SHALL automatically trigger a new build and deploy within 5 minutes of the push event being received.
4. THE CDN_Host deployment SHALL have `VITE_API_BASE_URL` set to the public HTTPS URL of the deployed API_Gateway with no trailing slash.
5. THE CDN_Host SHALL serve the frontend over HTTPS with a valid TLS certificate; HTTP requests to the CDN_Host domain SHALL be automatically redirected to HTTPS.
6. THE CDN_Host SHALL be configured with SPA fallback routing so that all non-asset paths serve `index.html` (per Requirement 3).
7. WHEN a CDN_Host build fails (non-zero exit from `npm run build`), THE CDN_Host SHALL NOT publish the failed build and SHALL retain the previously deployed version as the live version.

---

### Requirement 13: GitHub Actions CI/CD Pipeline

**User Story:** As a developer, I want a GitHub Actions workflow that validates the build on every pull request and triggers deployment on merge to main, so that broken code is caught before it reaches production.

#### Acceptance Criteria

1. THE Repository SHALL contain a `.github/workflows/ci.yml` file that is triggered on every push to `main` and on every pull request targeting `main`.
2. WHEN a pull request is opened or updated, THE CI Pipeline SHALL run `npm run build` in the `frontend/` directory; if the command exits with a non-zero code, THE CI Pipeline SHALL mark the check as failed and block the pull request from being merged.
3. WHEN a pull request is opened or updated, THE CI Pipeline SHALL run `mvn clean install -DskipTests` in the `backend/` directory; if the command exits with a non-zero code, THE CI Pipeline SHALL mark the check as failed and block the pull request from being merged.
4. THE CI Pipeline SHALL use GitHub Actions secrets for all sensitive values (e.g., `VITE_API_BASE_URL`, database URLs). Secret values SHALL NOT appear in any step's `run` output, log lines, or environment variable echoes in the workflow file.
5. WHEN the CI Pipeline completes successfully on the `main` branch, THE CDN_Host and PaaS platform SHALL detect the new commit via their GitHub integration and trigger their respective auto-deploy processes without any manual intervention.
6. THE CI Pipeline SHALL cache `node_modules` (keyed on `frontend/package-lock.json`) and the Maven local repository (keyed on `backend/pom.xml`) between runs so that subsequent builds complete faster than a cold build.

---

### Requirement 14: End-to-End Production Validation

**User Story:** As a user, I want to open the public URL in any browser, log in with my credentials, and use all features of the platform without encountering blank screens, runtime errors, or broken API calls, so that the deployment is confirmed production-ready.

#### Acceptance Criteria

1. WHEN a user navigates to the public frontend URL on a connection of at least 10 Mbps, THE Frontend SHALL load the login page and display the login form within 5 seconds of the initial navigation.
2. WHEN a user submits valid credentials (e.g., `superadmin` / `Admin@123`), THE Auth_Service SHALL return a JWT access token and THE Frontend SHALL redirect the user to their role-specific dashboard within 3 seconds of the form submission.
3. WHEN a logged-in Super Admin user navigates to the dashboard, THE Analytics_Service SHALL return dashboard data and THE Frontend SHALL render charts and statistics without a blank screen or JavaScript error.
4. WHEN a logged-in HR Manager user navigates to the Employees page, THE Employee_Service SHALL return the employee list and THE Frontend SHALL display at least one row in the data grid.
5. WHEN a logged-in Employee user navigates to the Leaves page and submits a leave request, THE Attendance_Service SHALL return HTTP 200 or HTTP 201 and THE Frontend SHALL display a success confirmation to the user.
6. WHEN a logged-in HR Manager user navigates to the Payroll page, THE Payroll_Service SHALL return payroll run data and THE Frontend SHALL display at least one payroll record without a blank screen or JavaScript error.
7. IF a user's JWT access token expires during a session, THEN THE Frontend SHALL automatically call the refresh token endpoint and, upon receiving a new access token, retry the original request — all without requiring the user to log in again.
8. IF the refresh token endpoint returns HTTP 401 or HTTP 403 (refresh token expired or invalid), THEN THE Frontend SHALL clear all stored tokens and redirect the user to the login page within 2 seconds.
9. WHEN any API call fails due to a network error (no response received), THE Frontend SHALL display a user-visible error message (e.g., a toast or inline alert) and SHALL NOT render a blank screen or throw an unhandled JavaScript exception.
10. WHILE a user is navigating between the dashboard, employees, leaves, payroll, and analytics pages, THE deployed application SHALL produce zero browser console messages of severity `error`.
11. WHEN a user refreshes the browser on any authenticated route (e.g., `/dashboard`), THE Frontend SHALL restore the session from the stored token and display the correct page without redirecting to the login page, provided the token has not expired.

---

### Requirement 15: Security and Secret Management

**User Story:** As a security-conscious developer, I want all secrets to be managed through environment variables and platform secret stores, so that no credentials are exposed in source code, logs, or build artefacts.

#### Acceptance Criteria

1. THE JWT_SECRET used in production SHALL be a randomly generated string of at least 64 characters and SHALL differ from the default development value (`ehipap_jwt_super_secret_key_2024_production_grade_minimum_256_bits`).
2. THE Cloud_DB password used in production SHALL differ from the default development value (`ehipap_secret_2024`).
3. THE API_Gateway `application.yml` CORS `allowedOrigins` list SHALL NOT contain `"*"` in the production configuration; it SHALL list only the specific CDN_Host domain.
4. WHEN a request arrives at a protected route on the API_Gateway, THE API_Gateway SHALL validate the JWT signature. WHILE the API_Gateway is running, JWT signature validation SHALL remain active and SHALL NOT be disabled by any configuration flag or environment variable.
5. IF a request to a protected route has a missing, expired, or invalid JWT token, THEN THE API_Gateway SHALL return HTTP 401 and SHALL NOT forward the request to any downstream microservice.
6. THE Frontend SHALL NOT store JWT tokens in `sessionStorage`, cookies, or any mechanism other than `localStorage`.
7. WHEN a user logs out, THE Frontend SHALL remove all JWT tokens (access token and refresh token) from `localStorage` within 500ms of the logout action being triggered.
8. THE PaaS platform environment variable store SHALL be used for all named secrets (`JWT_SECRET`, Cloud_DB password, `REDIS_PASSWORD`, `KAFKA_SASL_USERNAME`, `KAFKA_SASL_PASSWORD`); these values SHALL NOT appear in any Dockerfile `ENV` instruction or in any committed `application.yml` or `application-prod.yml` file.
9. WHEN the application is deployed, THE HTTPS protocol SHALL be enforced for all frontend and API traffic; HTTP requests to the CDN_Host domain SHALL be automatically redirected to HTTPS with a 301 status code.
