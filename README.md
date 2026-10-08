# SyncForge

> Enterprise-style project management platform for software development teams.

## 1. Overview

SyncForge is a full-stack project management platform designed to help software development teams organize work, manage projects, track tasks, collaborate, and monitor team activity.

The platform is inspired by the workflows and concepts found in tools such as Jira, Asana, and similar project management platforms.

SyncForge is being developed using an industry-style software development process with:

* Requirements documentation
* Product backlog
* Sprint planning
* Architecture documentation
* Database design
* REST API specification
* ADRs
* Coding standards
* Git workflow
* Testing strategy
* Security standards
* Code reviews

---

# 2. Main Goals

SyncForge aims to provide:

* Centralized workspace management
* Project management
* Task management
* Kanban boards
* Team collaboration
* Role-based access control
* Notifications
* Activity tracking
* Search and filtering
* Project analytics

---

# 3. Target Users

SyncForge is designed for:

* Software Developers
* QA Engineers
* Product Managers
* Engineering Managers
* Team Leads
* Administrators

---

# 4. Technology Stack

## Backend

```text
Node.js
Express.js (v5)
TypeScript
PostgreSQL (Neon)
Prisma (v8)
REST API
JWT (jsonwebtoken)
bcryptjs
Helmet
express-rate-limit
Swagger (swagger-jsdoc + swagger-ui-express)
```

### Database Updates (Prisma 8)
When you modify the database schema (`backend/prisma/contract.prisma`), run the following commands in the `backend/` directory:

1. `npx prisma contract emit` 
   *(Note: this is the correct Prisma 8 command to compile. It generates the new `contract.json` based on your model).*
2. `npx prisma db update --dry-run`
   *(This connects to the database, diffs the schema, and predicts the operations to ensure there are no destructive warnings).*
3. `npx prisma db update --yes`
   *(This applies the schema to the live database in the background without asking for interactive prompts).*

## Frontend

```text
React 19
TypeScript
Vite 8
Tailwind CSS v4
React Router v7
Redux Toolkit + React-Redux
TanStack React Query
Axios
OxLint
```

## DevOps & Tooling

```text
Docker + Docker Compose
Git / GitHub
Postman
VS Code / Antigravity
Figma
Jest + Supertest (backend testing)
SWC (test transpilation)
Nodemon (backend dev server)
```

---

# 5. Architecture

High-level architecture:

```text
                    ┌───────────────────┐
                    │      Client       │
                    │  React + Vite     │
                    └─────────┬─────────┘
                              │
                              │ HTTPS / REST
                              ▼
                    ┌───────────────────┐
                    │    Express API    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │    Middleware     │
                    │ Auth / Validation │
                    │ Authorization     │
                    │ Rate Limiting     │
                    │ Helmet / CORS     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │    Controllers    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Services      │
                    │  Business Logic   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Data Access Layer │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │      Prisma       │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PostgreSQL (Neon)│
                    └───────────────────┘
```

---

# 6. Project Structure

```text
SyncForge/
│
├── docs/
│   ├── BRD.md
│   ├── PRD.md
│   ├── Product-Backlog.md
│   ├── Sprint-Plan.md
│   ├── Architecture.md
│   ├── Database-Design.md
│   ├── ER-Diagram.md
│   ├── API-Specification.md
│   ├── adr/
│   │   ├── 001-backend-stack.md
│   │   ├── 002-database.md
│   │   ├── 003-authentication.md
│   │   └── 004-api-architecture.md
│   ├── engineering/
│   │   ├── 001-coding-standards.md
│   │   ├── 002-git-workflow.md
│   │   ├── 003-testing-strategy.md
│   │   └── 004-security-standards.md
│   └── ui-ux/
│       ├── 001-design-system.md
│       ├── 002-user-flows.md
│       ├── 003-page-map.md
│       └── 004-wireframes.md
│
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   │   ├── activity.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   └── workspace.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── comment.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   └── workspace.routes.ts
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── lib/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   ├── prisma/
│   ├── migrations/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   └── workspaces/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── store/
│   │   └── types/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── docker-compose.yaml
├── .gitignore
└── README.md
```

---

# 7. Documentation

Project documentation is maintained inside:

```text
docs/
```

Documentation includes:

| Document | Description |
|---|---|
| `BRD.md` | Business Requirements Document |
| `PRD.md` | Product Requirements Document |
| `Product-Backlog.md` | Full product backlog |
| `Sprint-Plan.md` | Sprint planning details |
| `Architecture.md` | System architecture |
| `Database-Design.md` | Database schema design |
| `ER-Diagram.md` | Entity-Relationship diagram |
| `API-Specification.md` | REST API specification |

Architecture decisions:

```text
docs/adr/
├── 001-backend-stack.md
├── 002-database.md
├── 003-authentication.md
└── 004-api-architecture.md
```

UI/UX documentation:

```text
docs/ui-ux/
├── 001-design-system.md
├── 002-user-flows.md
├── 003-page-map.md
└── 004-wireframes.md
```

Engineering standards:

```text
docs/engineering/
├── 001-coding-standards.md
├── 002-git-workflow.md
├── 003-testing-strategy.md
└── 004-security-standards.md
```

---

# 8. Development Approach

SyncForge is developed using an iterative Agile-style workflow.

The project is divided into:

```text
Epic
  ↓
User Story
  ↓
Task
  ↓
Development
  ↓
Testing
  ↓
Code Review
  ↓
Merge
```

Work is organized into sprints.

---

# 9. Getting Started

## Prerequisites

* Node.js (v20+)
* npm
* Git
* Docker & Docker Compose (optional, for containerized setup)
* PostgreSQL (or use the Neon cloud database)

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```text
PORT=3000
NODE_ENV=development
JWT_SECRET=<your-secret>
DATABASE_URL=<your-postgresql-connection-string>
```

Start the development server:

```bash
npm run dev
```

The backend will be available at `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Docker Setup

Run the entire stack with Docker Compose from the project root:

```bash
docker-compose up --build
```

This starts:

| Service | Port | Description |
|---|---|---|
| `frontend` | `5173` | React + Vite dev server |
| `backend` | `3000` | Express API server |

To stop the services:

```bash
docker-compose down
```

---

# 10. Available Scripts

## Backend (`backend/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start dev server with nodemon |
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Run compiled production server |
| `test` | `npm test` | Run Jest tests (sequential) |

## Frontend (`frontend/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Vite dev server |
| `build` | `npm run build` | TypeScript check + Vite production build |
| `lint` | `npm run lint` | Run OxLint |
| `preview` | `npm run preview` | Preview production build |

---

# 11. API

SyncForge exposes REST APIs.

Base development URL:

```text
http://localhost:3000/api/v1
```

### API Modules

| Module | Endpoint Prefix | Description |
|---|---|---|
| Auth | `/api/v1/auth` | Registration, login, profile |
| Workspaces | `/api/v1/workspaces` | Workspace CRUD & members |
| Projects | `/api/v1/projects` | Project management |
| Tasks | `/api/v1/tasks` | Task management |
| Comments | `/api/v1/comments` | Task comments |

API documentation is maintained in:

```text
docs/API-Specification.md
```

Interactive OpenAPI (Swagger) documentation is available during development at `/api-docs`.

---

# 12. Git Workflow

Development work should not be performed directly on `main`.

Feature branches should follow:

```text
feature/<ticket-id>-<description>
```

Example:

```text
feature/SF-001-user-registration
```

Bug fixes:

```text
fix/<ticket-id>-<description>
```

Changes should be submitted through Pull Requests.

---

# 13. Commit Convention

Commits should follow a conventional format.

Examples:

```text
feat: add user registration
fix: prevent duplicate workspace members
test: add task authorization tests
docs: update API specification
refactor: simplify task service
chore: update dependencies
```

---

# 14. Environment Variables

Environment-specific configuration must not be committed to Git.

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: `3000`) |
| `NODE_ENV` | Yes | Environment (`development` / `production`) |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | No | Direct PostgreSQL connection string |
| `NEON_BRANCH` | No | Neon database branch name |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |

---

# 15. Testing

Testing includes:

* **Unit testing** — Jest + SWC
* **Integration testing** — Supertest
* **API testing** — Postman / Swagger
* **End-to-end testing** — Planned

Run backend tests:

```bash
cd backend
npm test
```

Tests are organized mirroring the source structure:

```text
backend/tests/
├── app.test.ts
├── setup.ts
├── config/
├── controllers/
├── middleware/
├── routes/
└── services/
```

---

# 16. Security

Security requirements include:

* JWT authentication
* Password hashing (bcryptjs)
* Input validation
* Authorization (role-based)
* Rate limiting (express-rate-limit)
* Secure headers (Helmet)
* CORS configuration
* Secure environment variables
* File upload validation
* Safe error handling

---

# 17. Development Status

Current stage:

```text
CI/CD & Production Deployment
```

Completed planning & execution:

```text
✓ Business Requirements
✓ Product Requirements
✓ Product Backlog
✓ Sprint Planning
✓ System Architecture
✓ Database Design
✓ ER Diagram
✓ API Specification
✓ Architecture Decision Records
✓ UI/UX Planning
✓ Engineering Standards
✓ Backend Foundation & Core APIs
✓ Frontend Integration & Full-System Testing
✓ Docker Containerization
```

Next stage:

```text
Automated Deployments & Maintenance
```

---

# 18. Project Development Lifecycle

```text
Planning
   ↓
Architecture
   ↓
Database Design
   ↓
API Design
   ↓
Backend Development
   ↓
Backend Testing
   ↓
Frontend Development
   ↓
Frontend Integration
   ↓
Full-System Testing
   ↓
Docker Containerization
   ↓
CI/CD
   ↓
Deployment
   ↓
Monitoring & Maintenance
```

---

# 19. Definition of Done

A feature is considered complete when:

* Requirements are understood
* Implementation is complete
* Validation is implemented
* Authorization is implemented where required
* Error handling is implemented
* Tests are written
* Tests pass
* Lint passes
* Documentation is updated
* Code is reviewed
* Pull Request is approved
* Changes are merged

---

# 20. Project Principle

SyncForge is being developed as an industry-style software project rather than simply as a demo application.

The focus is on:

```text
Clean Architecture
+
Maintainable Code
+
Security
+
Testing
+
Documentation
+
Git Discipline
+
Code Reviews
+
Incremental Delivery
```

---

**End of README**
