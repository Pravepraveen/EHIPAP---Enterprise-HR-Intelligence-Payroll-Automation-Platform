# EHIPAP - Enterprise HR Intelligence & Payroll Automation Platform

## 🚀 Quick Start (copy-paste — run from project root)

### Step 0 — Open Docker Desktop first
Wait until Docker shows **Running** (green) before continuing.

### One command (backend + frontend) — recommended

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project"
.\scripts\start-all.ps1
```

### Step 1 — Terminal 1 (backend + database)

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project"
.\scripts\build-backend.ps1
.\scripts\start-local.ps1
```

> **Important:** Always run from `H R project` folder — NOT from `backend` folder.  
> Open **Docker Desktop** first and wait until it shows **Running**.

### Step 2 — Terminal 2 (frontend)

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project\frontend"
npm run dev
```

Open **http://localhost:5173** and login with a demo account — each role gets a **different dashboard and sidebar**:

| Role | User | Password | Dashboard |
|------|------|----------|-----------|
| Super Admin | `superadmin` | `Admin@123` | Org-wide analytics & admin actions |
| HR Manager | `hrmanager` | `HRManager@123` | Approvals, hiring, team metrics |
| Employee | `john.doe` | `Employee@123` | Personal leave, attendance, payslips |

### Step 3 — Verify everything works

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project"
.\verify.ps1
```

### Stop services (before rebuild)

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project"
.\scripts\stop-local.ps1
```

### Full stack (Docker — needs ~8GB RAM)

```powershell
cd "c:\Users\DELL\OneDrive\Desktop\H R project"
docker compose up --build
```

## 🌐 Access URLs

| Service       | URL (Docker)                 | URL (Local dev)              |
|---------------|------------------------------|------------------------------|
| Frontend      | http://localhost:3001        | http://localhost:5173        |
| API Gateway   | http://localhost:8880        | http://localhost:8880        |
| Auth Service  | http://localhost:8081        |
| Employee Svc  | http://localhost:8082        |
| Payroll Svc   | http://localhost:8083        |
| Attendance    | http://localhost:8084        |
| Recruitment   | http://localhost:8085        |
| Performance   | http://localhost:8086        |
| Notification  | http://localhost:8087        |
| Analytics     | http://localhost:8088        |
| Elasticsearch | http://localhost:9200        |
| Kibana        | http://localhost:5601        |
| MinIO Console | http://localhost:9001        |

## 🔐 Demo Credentials

| Role        | Username   | Password       |
|-------------|------------|----------------|
| Super Admin | superadmin | Admin@123      |
| HR Manager  | hrmanager  | HRManager@123  |
| Employee    | john.doe   | Employee@123   |

## 🏗️ Architecture

- **API Gateway** (Port 8080) — Spring Cloud Gateway with JWT validation
- **Auth Service** (Port 8081) — JWT authentication, refresh tokens
- **Employee Service** (Port 8082) — Employee lifecycle management
- **Payroll Engine** (Port 8083) — Payroll computation, payslips
- **Attendance Service** (Port 8084) — Attendance & leave management
- **Recruitment ATS** (Port 8085) — Job postings, candidate pipeline
- **Performance** (Port 8086) — Reviews, goals, cycles
- **Notifications** (Port 8087) — Real-time notifications
- **Analytics** (Port 8088) — Reports and dashboards

## 🛠️ Tech Stack

**Backend:** Java 21, Spring Boot 3.3, Spring Security 6, JWT, PostgreSQL, Redis, Kafka  
**Frontend:** React 18, TypeScript, Material UI, Redux Toolkit, Recharts, Vite  
**DevOps:** Docker, Docker Compose, Kubernetes, Helm


to output:
# Open Docker Desktop first and wait until it shows "Running"

cd "c:\Users\DELL\OneDrive\Desktop\H R project"

# First time only (or after code changes):
# .\scripts\build-backend.ps1

# Start everything (Docker + all Java services):
.\scripts\start-all.ps1
