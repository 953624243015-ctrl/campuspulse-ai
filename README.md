# CampusPulse AI

**AI-Powered Campus Intelligence, Student Success & Smart College Operations Platform**

CampusPulse AI is a production-ready, full-stack college management platform that connects students, faculty, mentors, HODs, administrators and the principal into one intelligent ecosystem. It goes beyond data display — it analyses patterns, detects problems, generates alerts, provides recommendations and supports decision-making.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│            Tailwind CSS · React Query · Recharts         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────────────┐
│              Node.js + Express Backend (TypeScript)      │
│   JWT Auth · RBAC · Rate Limiting · Audit Logs           │
└──────┬────────────────────────────┬──────────────────────┘
       │                            │ HTTP
       ▼                            ▼
┌──────────────┐          ┌──────────────────────┐
│  PostgreSQL  │          │  Python AI Service   │
│  (Primary DB)│          │  Flask · scikit-learn│
└──────────────┘          └──────────────────────┘
       ▲
┌──────┴───────┐
│    Redis     │
│  (Sessions)  │
└──────────────┘
```

---

## Tech Stack

| Layer      | Technology |
|-----------|-----------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Query |
| Backend   | Node.js, Express, TypeScript |
| Database  | PostgreSQL 15 |
| Cache     | Redis 7 |
| AI / ML   | Python 3.11, Flask, scikit-learn, numpy, pandas |
| Auth      | JWT (access + refresh tokens), bcryptjs |
| Container | Docker, Docker Compose |

---

## Features

### Role-Based Dashboards
- **Student** — Attendance, marks, assignments, timetable, study planner, skills, events, complaints, AI assistant, digital twin
- **Faculty** — Classes, attendance marking, student analytics, at-risk alerts, mentee management, workload analytics
- **Mentor** — Mentee progress, risk alerts, mentoring session recording, follow-up tasks
- **HOD** — Department analytics, faculty workload, skill gap, AI insights
- **Admin** — User management, equipment/maintenance, announcements, sustainability, emergency alerts
- **Principal** — Executive dashboard, campus-wide KPIs, AI insights, what-if simulator

### AI Modules
- **Student Digital Twin** — Holistic student profile combining academic, engagement and skill data
- **Early Warning System** — ML-based risk detection with explainable risk factors and recommendations
- **AI Study Planner** — Personalised daily/weekly study schedules based on marks, exam dates and weak topics
- **Skill Gap Analyzer** — Compares student skills against career/industry targets with recommended resources
- **Campus AI Assistant** — Role-aware chatbot answering campus questions in English and Tamil
- **Smart Complaint Classifier** — Auto-classifies complaints by category, detects recurring clusters
- **AI Meeting Minutes** — Extracts decisions, action items and deadlines from meeting notes
- **Campus Insights Engine** — Generates proactive AI insights for attendance trends, complaint clusters, maintenance
- **What-If Simulator** — Scenario analysis for policy and infrastructure decisions

### Other Key Modules
- Smart Complaint Management (text/voice/image, duplicate detection, cluster alerts)
- Predictive Maintenance (equipment tracking, overdue alerts, maintenance history)
- Event Management (registration, QR attendance, feedback, certificates)
- Smart Announcements (targeted by role, department, section, year)
- Sustainability Dashboard (electricity, water, waste tracking by department)
- Campus Map (searchable interactive location directory)
- Emergency Alert System (admin-controlled, broadcast to all users)

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop (for PostgreSQL + Redis)
- npm 9+

### 1. Start the database

```bash
docker compose up postgres redis -d
```

Wait ~10 seconds for PostgreSQL to be ready. The schema and seed data are applied automatically on first run.

### 2. Backend

```bash
cd backend
cp .env.example .env      # already pre-filled for local dev
npm install
npm run dev
```

Backend starts on **http://localhost:5000**

### 3. AI Service

```bash
cd ai-service
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python app.py
```

AI service starts on **http://localhost:8000**

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:3000**

### Windows one-command startup

```powershell
.\start-dev.ps1
```

---

## Demo Accounts

All accounts use the password: **`CampusPulse@123`**

| Role      | Email |
|-----------|-------|
| Student   | student.arun@campuspulse.edu |
| Faculty   | faculty.rani@campuspulse.edu |
| HOD       | hod.cse@campuspulse.edu |
| Admin     | admin@campuspulse.edu |
| Principal | principal@campuspulse.edu |

> All seed data is clearly synthetic and labelled as demo data.

---

## Docker (Full Stack)

```bash
docker compose up --build
```

This starts all services: PostgreSQL, Redis, Backend, AI Service, and Frontend (nginx).

| Service    | URL |
|-----------|-----|
| Frontend  | http://localhost:3000 |
| Backend   | http://localhost:5000 |
| AI Service| http://localhost:8000 |
| PostgreSQL| localhost:5432 |

---

## API Overview

All APIs return:
```json
{ "success": true, "data": {...}, "message": "...", "meta": {...} }
```

| Prefix | Description |
|--------|------------|
| `/api/auth` | Login, logout, refresh token, me |
| `/api/students` | Student profiles, attendance, marks, timetable |
| `/api/faculty` | Faculty dashboard, attendance marking, mentees |
| `/api/complaints` | Submit, list, update complaints |
| `/api/events` | Events, registration, attendance, feedback |
| `/api/admin` | Users, equipment, announcements, sustainability |
| `/api/hod` | Department analytics, faculty workload, skill gap |
| `/api/principal` | Executive dashboard, campus analytics, what-if |
| `/api/notifications` | Notifications, announcements, emergency alerts |
| `/api/ai` | Risk alerts, study planner, skill gap, assistant, insights |
| `/api/campus` | Campus map locations, departments |

---

## Database Schema

PostgreSQL with 40+ tables. Key entities:

`users` · `students` · `faculty` · `departments` · `courses` · `batches` · `sections` · `subjects` · `enrollments` · `attendance_sessions` · `attendance_records` · `marks` · `assignments` · `assignment_submissions` · `mentoring_sessions` · `skills` · `student_skills` · `certifications` · `study_plans` · `complaints` · `equipment` · `maintenance_records` · `events` · `event_registrations` · `announcements` · `notifications` · `risk_alerts` · `ai_insights` · `sustainability_records` · `emergency_alerts` · `audit_logs`

---

## Project Structure

```
campus pulseai/
├── backend/                    # Node.js + Express + TypeScript
│   └── src/
│       ├── controllers/        # Request handlers
│       ├── routes/             # Express routers
│       ├── middleware/         # Auth, error, rate limiting, audit
│       ├── db/                 # PostgreSQL pool, schema, seed
│       ├── utils/              # JWT, logger, response helpers
│       └── types/              # TypeScript interfaces
│
├── frontend/                   # React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       │   ├── auth/           # Login
│       │   ├── student/        # All student pages
│       │   ├── faculty/        # Faculty pages
│       │   ├── hod/            # HOD pages
│       │   ├── admin/          # Admin pages
│       │   ├── principal/      # Principal pages
│       │   └── shared/         # Complaints, Events, Map, Assistant
│       ├── components/
│       │   ├── layout/         # Sidebar, Header, AppLayout
│       │   └── ui/             # Reusable components
│       ├── context/            # AuthContext, ThemeContext
│       └── services/           # Typed API client
│
├── ai-service/                 # Python + Flask
│   ├── routes/                 # Flask blueprints
│   └── services/               # ML/AI business logic
│       ├── student_risk_service.py
│       ├── study_planner_service.py
│       ├── complaint_classifier_service.py
│       ├── meeting_summarizer_service.py
│       └── campus_insight_service.py
│
├── docker-compose.yml
├── start-dev.ps1
└── README.md
```

---

## Security

- JWT access tokens (15 min) + refresh token rotation (7 days)
- Passwords hashed with bcryptjs (cost factor 12)
- Role-based access control on every API route
- Rate limiting on all APIs, stricter on auth and AI endpoints
- Input validation with express-validator and zod
- Audit logging for sensitive operations
- Soft deletes for users (data preserved)
- Students can only access their own personal data
- Anonymous complaint submission supported

---

## Design Philosophy

> **Collect → Understand → Detect → Predict → Recommend → Act → Track**

The system helps the college move from *"What happened?"* to *"Why did it happen?"* to *"What needs attention?"* to *"What action can we take?"*

All AI outputs are explainable — every insight shows the underlying data and time period. No fabricated data, no placeholder buttons, no hardcoded numbers. Every number on every dashboard comes from a real database query.
