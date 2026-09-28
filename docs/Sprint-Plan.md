# Sprint Plan

# SyncForge

**Version:** 1.0

## 1. Development Approach

SyncForge is built using an incremental Agile development approach suitable for a professional project at approximately 1 year of industry experience. The architecture relies on a modular monolith, strictly avoiding unnecessary enterprise patterns like Microservices, Kafka, RabbitMQ, Kubernetes, Redis, CQRS, Event Sourcing, complex DDD, or repository-heavy structures.

**Database Strategy:**

SyncForge uses **PostgreSQL with Prisma ORM** as its relational database and data-access layer.

**Frontend Timing Strategy:**

The backend is developed first. Frontend development should **NOT** begin at the start of the project. Instead, it will commence in parallel once approximately 50–60% of the core backend functionality is stable and usable. This pivotal point is expected to occur around the completion of Task Management (Sprint 4) when Authentication, Workspace Management, and Project Management are solid. This 50–60% mark is a guideline based on backend stability, not a strict mathematical requirement.

## 2. Sprint Completion Rules (Definition of Done)

A sprint is considered successfully completed only when:

- Required stories meet their exact acceptance criteria.
- Relevant unit, integration, and API tests are written and passing. (Testing must continue throughout every sprint).
- Security and authorization requirements are strictly satisfied.
- Code follows project coding standards.
- API documentation is updated where applicable.
- No known critical defects remain.
- Code has been peer-reviewed.
- Changes are committed and merged according to the project's Git workflow.

## 3. Git Workflow Integration

All sprint work is executed using feature branches. Branch names map directly to the task or story being worked on using a ticket-ID convention.

**Example Workflow:**

- `feature/SF-000-backend-foundation`
- `feature/SF-001-user-registration`
- `feature/SF-002-user-login`

---

## 4. Sprint Schedule

### Sprint 0 — Backend Foundation

**Goal:** Create a clean, runnable, secure backend foundation.

**Duration:** 1 Week

**Backlog Items Included:**

- TECH-01: Backend project initialization
- TECH-02: TypeScript configuration
- TECH-03: Express setup & basic routing
- TECH-04: PostgreSQL/Prisma database connection
- TECH-05: Environment configuration
- TECH-06: Security & Global Error Handling Middleware
- TECH-07: Input validation middleware

**Dependencies:** None.

**Expected Deliverables:** A running Express server connected to PostgreSQL through Prisma with security middleware, global error handling, and strict environment validation.

**Git Branch Example:** `feature/SF-000-backend-foundation`

### Sprint 1 — Authentication

**Goal:** Implement complete MVP user authentication and authorization foundations.

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- US-1.1: Registration
- US-1.2: Login
- US-1.3: Logout
- US-1.4: Email verification
- US-1.5: Forgot password
- US-1.6: Reset password
- US-1.7: User profile

**Dependencies:** Sprint 0 Foundation.

**Expected Deliverables:** Secure endpoints for users to manage their accounts completely, including authentication, password resets, and profile management.

**Git Branch Example:** `feature/SF-001-user-registration`

### Sprint 2 — Workspace Management

**Goal:** Implement the top-level organizational units and roles.

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- [x] US-2.1: Workspace creation
- [x] US-2.2: Add registered members
- [x] US-2.3: Remove members
- [x] US-2.4: Workspace deletion
- [] US-7.1: Workspace activity recording
- [x] US-10.1: Workspace roles/permissions

*(Note: Roles are strictly limited to Workspace Owner, Admin, and Member.)*

**Dependencies:** Sprint 1 (Authentication).

**Expected Deliverables:** Users can manage workspaces, add/remove colleagues, record workspace activity, and properly delegate Admin capabilities securely.

**Git Branch Example:** `feature/SF-008-workspace-creation`

### Sprint 3 — Project Management

**Goal:** Implement projects within workspaces and manage project-level access.

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- [x] US-3.1: Project creation
- [x] US-3.2: Project updates
- [x] US-3.3: Project membership (Add member)
- [x] US-3.4: Project archive/delete
- US-7.1: Project activity recording

*(Note: No new project-specific roles are introduced.)*

**Dependencies:** Sprint 2 (Workspace Management).

**Expected Deliverables:** Workspace Admins/Owners can create, update, and manage project lifecycles securely.

**Git Branch Example:** `feature/SF-012-project-creation`

### Sprint 4 — Task Management

**Goal:** Implement the core engine for task tracking and assignment. *(Frontend development can commence in parallel after this sprint.)*

**Duration:** 2 Weeks

**Backlog Items Included:**

- [x] US-4.1: Create task
- [x] US-4.2: View task
- [x] US-4.3: Update task fields
- [x] US-4.4: Assign task
- [x] US-4.5: Update task status
- [x] US-4.6: Update task priority
- [x] US-4.7: Delete task
- US-7.1: Task activity recording

**Dependencies:** Sprint 3 (Project Management).

**Expected Deliverables:** Fully functional CRUD endpoints for tasks, allowing assignments and strictly authorized status/priority updates.

**Git Branch Example:** `feature/SF-016-create-task`

### Sprint 4.5 — Frontend Foundation + Authentication

**Goal:** Build the frontend foundation and implement the initial authentication UI.

**Backlog Items Included:**

- [x] FE-1.1: Frontend project initialization
- [x] FE-1.2: Frontend architecture and folder structure
- [x] FE-1.3: Login page
- [x] FE-1.4: Registration page
- [x] FE-1.5: Authentication state management
- [x] FE-1.6: Protected routes
- [x] FE-1.7: Logout

### Sprint 4.6 — Frontend Workspaces & Projects

**Goal:** Implement UI for workspace management, project creation, and team member management.

**Backlog Items Included:**
- [x] FE-2.1: Workspace API & Dashboard Integration (Fetch & Empty State)
- [x] FE-2.2: Create Workspace Modal
- [x] FE-2.3: Workspace Details & Project Listing
- [x] FE-2.4: Create Project Form
- [x] FE-2.5: Manage Workspace Members

### Sprint 4.7 — Frontend Tasks & Kanban

**Goal:** Implement task lists, task details, and interactive drag-and-drop Kanban board.

**Backlog Items Included:**
- [x] FE-3.1: Task API Layer & Project Page with Task List
- [x] FE-3.2: Create Task Modal
- [x] FE-3.3: Task Detail View & Edit
- [x] FE-3.4: Kanban Board View (drag-and-drop status columns)

### Sprint 5 — Kanban + Collaboration

**Goal:** Provide visual board retrieval and team discussion features.

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- US-5.1: Retrieve tasks grouped by status (Kanban board)
- US-5.2: Board task movement
- US-6.1: Create Comment
- US-6.2: Edit/Delete own comment
- US-6.3: Admin moderate comments
- US-7.1: Comment activity recording

**Dependencies:** Sprint 4 (Task Management).

**Expected Deliverables:** Endpoints structured for Kanban rendering and full task commenting.

**Git Branch Example:** `feature/SF-023-kanban-board`

### Sprint 6 — Activity + Search

**Goal:** Provide search, filtering, pagination, and formalize audit trails.

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- US-7.1: Activity/audit trail recording *(Note: Sprint 6 focuses on activity viewing/formalization, search/filtering/pagination. Recording is handled incrementally in Sprints 2–5).*
- US-7.2: Activity viewing
- US-8.1: Search
- US-8.2: Filtering
- US-8.3: Pagination

**Dependencies:** Sprints 4 and 5.

**Expected Deliverables:** Fully paginated endpoints for searching/filtering tasks and viewing activity feeds.

**Git Branch Example:** `feature/SF-028-task-search`

### Sprint 7 — Quality + API Documentation

**Goal:** Final exhaustive quality gate, documentation, and ensuring backend production readiness. *(This sprint is NOT for finishing missing MVP functionality.)*

**Duration:** 1–2 Weeks

**Backlog Items Included:**

- TECH-08: Feature-level test completion & Integration/API testing
- TECH-09: OpenAPI/Swagger documentation completion
- Security review
- Error-handling review
- Backend code quality review

**Dependencies:** All previous sprints.

**Expected Deliverables:** A production-ready backend codebase from a code, testing, and documentation perspective. *(Actual production deployment is handled as a later, separate step.)*

**Git Branch Example:** `feature/SF-033-api-documentation`

---

## 5. MVP Story Mapping Checklist

*This checklist verifies that every required MVP story is scheduled into a sprint.*

### Epic 1 (Auth)

- [x] US-1.1: Registration -> Sprint 1
- [x] US-1.2: Login -> Sprint 1
- [x] US-1.3: Logout -> Sprint 1
- [x] US-1.4: Email verification -> Sprint 1
- [x] US-1.5: Forgot password -> Sprint 1
- [x] US-1.6: Reset password -> Sprint 1
- [x] US-1.7: User profile -> Sprint 1

### Epic 2 & Epic 10 (Workspace)

- [x] US-2.1: Workspace creation
- [x] US-2.2: Add registered members
- [x] US-2.3: Remove members
- [x] US-2.4: Workspace deletion
- [x] US-10.1: Roles/permissions

### Epic 3 (Project)

- [x] US-3.1: Project creation -> Sprint 3
- [x] US-3.2: Project updates -> Sprint 3
- [x] US-3.3: Project membership -> Sprint 3
- [x] US-3.4: Project archive/delete -> Sprint 3

### Epic 4 (Tasks)

- [x] US-4.1: Create task -> Sprint 4
- [x] US-4.2: View task -> Sprint 4
- [x] US-4.3: Update task -> Sprint 4
- [x] US-4.4: Assign task -> Sprint 4
- [x] US-4.5: Update status -> Sprint 4
- [x] US-4.6: Update priority -> Sprint 4
- [x] US-4.7: Delete task -> Sprint 4

### Epic 5 & 6 (Kanban + Comments)

- [ ] US-5.1: Retrieve Kanban board -> Sprint 5
- [ ] US-5.2: Board task movement -> Sprint 5
- [ ] US-6.1: Create Comment -> Sprint 5
- [ ] US-6.2: Edit/Delete comment -> Sprint 5
- [ ] US-6.3: Admin moderate comments -> Sprint 5

### Epic 7 & 8 (Activity + Search)

- [ ] US-7.1: Activity recording -> Distributed / Sprint 6
- [ ] US-7.2: Activity viewing -> Sprint 6
- [ ] US-8.1: Search -> Sprint 6
- [ ] US-8.2: Filtering -> Sprint 6
- [ ] US-8.3: Pagination -> Sprint 6

### Epics 11 & 12 (Tech Foundation & Quality)

- [x] TECH-01 to TECH-07 -> Sprint 0
- [ ] TECH-08 & TECH-09 -> Sprint 7

*(Note: US-9.1 Notifications is explicitly Future/Out-of-Scope for MVP).*

---

**End of Sprint Plan**