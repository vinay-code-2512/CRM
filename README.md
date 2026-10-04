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
Express.js
TypeScript
PostgreSQL
Prisma (v8)
REST API
JWT
bcrypt
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

The frontend will be implemented after the backend reaches the planned integration stage.

The frontend technology will follow the approved project architecture.

## Development Tools

```text
Git
GitHub
Postman
VS Code / Antigravity
Figma
ESLint
Prettier
```

---

# 5. Architecture

High-level architecture:

```text
                    ┌───────────────────┐
                    │      Client       │
                    │     Frontend      │
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
                    │    PostgreSQL     │
                    └───────────────────┘
```

---

# 6. Project Structure

The project will follow a modular architecture.

Expected high-level structure:

```text
SyncForge/
│
├── docs/
│
├── backend/
│
├── frontend/
│
├── .gitignore
├── README.md
└── package configuration files
```

The backend structure will be finalized during backend initialization.

---

# 7. Documentation

Project documentation is maintained inside:

```text
docs/
```

Documentation includes:

```text
BRD.md
PRD.md
Product-Backlog.md
Sprint-Plan.md
Architecture.md
Database-Design.md
ER-Diagram.md
API-Specification.md
```

Architecture decisions:

```text
docs/adr/
```

UI/UX documentation:

```text
docs/ui-ux/
```

Engineering standards:

```text
docs/engineering/
```

---

# 8. Development Approach

SyncForge will be developed using an iterative Agile-style workflow.

The project will be divided into:

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

Work will be organized into sprints.

---

# 9. Backend-First Development

SyncForge will initially prioritize backend development.

The development strategy is:

```text
Requirements
     ↓
Architecture
     ↓
Database
     ↓
API Contract
     ↓
Backend Foundation
     ↓
Authentication
     ↓
Core APIs
     ↓
Testing
     ↓
Frontend Integration
```

The frontend will begin after a substantial portion of the backend foundation and core APIs are stable.

This allows the API contract and business logic to be validated before extensive frontend development.

---

# 10. Git Workflow

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

# 11. Commit Convention

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

# 12. Development Environment

## Prerequisites

Developers should have:

* Node.js
* npm
* Git
* PostgreSQL
* API testing tool
* Code editor

---

# 13. Environment Variables

Environment-specific configuration must not be committed to Git.

Example:

```text
PORT=3000
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
```

The exact environment variables will be documented as backend development progresses.

---

# 14. API

SyncForge exposes REST APIs.

Base development URL:

```text
http://localhost:3000/api/v1
```

API documentation is maintained in:

```text
docs/API-Specification.md
```

Interactive OpenAPI (Swagger) documentation is available during development at `/api-docs`.

---

# 15. Testing

Testing will include:

* Unit testing
* Integration testing
* API testing
* End-to-end testing

Tests will be introduced alongside feature development.

---

# 16. Security

Security requirements include:

* JWT authentication
* Password hashing
* Input validation
* Authorization
* Rate limiting
* Secure headers
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
