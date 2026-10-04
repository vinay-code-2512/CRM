# Product Backlog

# SyncForge

**Version:** 1.0

## 1. Epics Overview

1. Authentication & User Management

2. Workspace Management

3. Project Management

4. Task Management

5. Kanban Board

6. Comments

7. Activity & Audit Trail

8. Search, Filtering & Pagination

9. Notifications (Future/Low Priority)

10. Administration & Permissions

11. Testing & Quality

12. Documentation & Deployment

---

## 2. User Stories

### Epic 1: Authentication & User Management

**ID:** US-1.1

**Story:** As a user, I want to register for a new account using my name, email, and password, so that I can access the platform.

**Priority:** High

**Acceptance Criteria:** Validates input; passwords are securely hashed (bcrypt); returns success response.

**Dependencies:** TECH-01, TECH-04

**Status:** Done

**ID:** US-1.2

**Story:** As a user, I want to log in using my email and password, so that I can receive an authentication token (JWT) to access secure APIs.

**Priority:** High

**Acceptance Criteria:** Verifies credentials; generates JWT; handles invalid credentials cleanly.

**Dependencies:** US-1.1

**Status:** Done

**ID:** US-1.3

**Story:** As a user, I want to log out, so that my authentication state is cleared.

**Priority:** High

**Acceptance Criteria:** Client authentication state is cleared.

**Dependencies:** US-1.2

**Status:** Done

**ID:** US-1.4

**Story:** As a new user, I want to verify my email address, so that my account is confirmed and fully active.

**Priority:** High

**Acceptance Criteria:** Verification token generated; email sent; token validated upon verification endpoint hit.

**Dependencies:** US-1.1

**Status:** Done

**ID:** US-1.5

**Story:** As a user who forgot their password, I want to request a password reset, so that I can regain access to my account.

**Priority:** Medium

**Acceptance Criteria:** Reset token generated; email sent; token expires appropriately.

**Dependencies:** US-1.1

**Status:** Done

**ID:** US-1.6

**Story:** As a user with a reset token, I want to set a new password, so that I can log in again.

**Priority:** Medium

**Acceptance Criteria:** Validates token; securely hashes new password.

**Dependencies:** US-1.5

**Status:** Done

**ID:** US-1.7

**Story:** As a user, I want to view and update my profile information, so that my details are accurate.

**Priority:** Medium

**Acceptance Criteria:** Can update name; updating email requires re-verification.

**Dependencies:** US-1.2

**Status:** Done

### Epic 2: Workspace Management

**ID:** US-2.1

**Story:** As a user, I want to create a new workspace, so that I can organize my team's projects.

**Priority:** High

**Acceptance Criteria:** User who creates workspace is automatically assigned the `Workspace Owner` role.

**Dependencies:** US-1.2

**Status:** Done

**ID:** US-2.2

**Story:** As a Workspace Owner or Admin, I want to add registered members, so that my team can collaborate.

**Acceptance Criteria:**

- Workspace Owner/Admin can search for or enter the email of an existing registered user to add them.
- Target user is added to the workspace immediately with a specified role (Admin or Member).
- System returns an error if the user is not registered in the system.
- Added members can see the workspace upon their next login/refresh.

**Priority:** High
**Status:** Done

**ID:** US-2.3

**Story:** As a Workspace Owner or Admin, I want to remove a member, so that I can manage access.

**Priority:** High

**Acceptance Criteria:** Member loses access to the workspace. This explicitly cascades, instantly removing their ability to access any projects or tasks within that workspace. Project membership must never override workspace membership.

**Dependencies:** US-2.2

**Status:** Done

**ID:** US-2.4

**Story:** As a Workspace Owner, I want to delete the workspace, so that our organization's account is removed.

**Priority:** Medium

**Acceptance Criteria:** Only Workspace Owner can perform this; Admins cannot delete a workspace. Deletion must remove/disable all user access to the workspace.

**Status:** Done

**Dependencies:** US-2.1

### Epic 3: Project Management

**ID:** US-3.1

**Story:** As a Workspace Owner or Admin, I want to create a project, so that I can organize tasks for a specific initiative.

**Priority:** High

**Acceptance Criteria:** Validates workspace membership and role; creates project entity.

**Dependencies:** US-2.1

**Status:** Done

**ID:** US-3.2

**Story:** As a Workspace Owner or Admin, I want to update project details, so that the information stays relevant.

**Priority:** Medium

**Acceptance Criteria:** Can update project name and description.

**Dependencies:** US-3.1

**Status:** Done

**ID:** US-3.3

**Story:** As a Workspace Owner or Admin, I want to add a workspace member to a project, so that they can view and manage tasks.

**Priority:** High

**Acceptance Criteria:** Validates that the user is already a workspace member.

**Dependencies:** US-3.1, US-2.2

**Status:** Done

**ID:** US-3.4

**Story:** As a Workspace Owner or Admin, I want to archive or delete a project, so that outdated work is removed.

**Priority:** Low

**Acceptance Criteria:** Workspace Owner or Admin can archive or delete a project. Users cannot access an archived/deleted project according to the final product rules.

**Dependencies:** US-3.1

**Status:** Done

### Epic 4: Task Management

**ID:** US-4.1

**Story:** As an authorized project member, I want to create a task, so that work can be tracked.

**Priority:** High

**Acceptance Criteria:** Task requires Title, Status (`Todo`), Priority. System manages `createdBy`, `createdAt`, `updatedAt`.

**Dependencies:** US-3.3

**Status:** Done

**ID:** US-4.2

**Story:** As an authorized project member, I want to view task details, so that I understand what needs to be done.

**Priority:** High

**Acceptance Criteria:** Retrieves task fields. Strongly prevents access if user is not in the project.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-4.3

**Story:** As an authorized project member, I want to update general task fields (Description, Due Date, Labels), so that information stays current.

**Priority:** High

**Acceptance Criteria:** Updates are persisted; updates `updatedAt`.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-4.4

**Story:** As an authorized project member, I want to assign a task to another project member, so that responsibility is clear.

**Priority:** High

**Acceptance Criteria:** Assignee must be a verified project member.

**Dependencies:** US-4.1, US-3.3

**Status:** Done

**ID:** US-4.5

**Story:** As an authorized project member, I want to update a task's status, so that I can reflect its current workflow state.

**Priority:** High

**Acceptance Criteria:** Allowed statuses: Todo, In Progress, Review, Done.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-4.6

**Story:** As an authorized project member, I want to update a task's priority, so that it reflects current urgency.

**Priority:** High

**Acceptance Criteria:** Allowed priorities: Low, Medium, High, Urgent.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-4.7

**Story:** As a Workspace Owner or Admin, I want to delete a task, so that erroneous items are removed.

**Priority:** Medium

**Acceptance Criteria:** Standard members cannot delete tasks; only Workspace Owners or Admins can.

**Dependencies:** US-4.1

**Status:** Done

### Epic 5: Kanban Board

**ID:** US-5.1

**Story:** As an authorized project member, I want to retrieve a list of tasks grouped by status, so that I can visualize them on a Kanban board.

**Priority:** High

**Acceptance Criteria:** Retrieves and groups tasks effectively for Kanban representation.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-5.2

**Story:** As an authorized project member, I want to perform board-oriented task movement, so that I can easily transition tasks between columns.

**Priority:** High

**Acceptance Criteria:** Supports moving a task across the board and reflects the status change accordingly.

**Dependencies:** US-5.1, US-4.5

**Status:** Done

### Epic 6: Comments

**ID:** US-6.1

**Story:** As an authorized project member, I want to add a comment to a task, so that I can discuss work with my team.

**Priority:** Medium

**Acceptance Criteria:** Comment saved, belongs directly to task and author.

**Dependencies:** US-4.2

**Status:** Done

**ID:** US-6.2

**Story:** As a comment author, I want to edit or delete my own comment, so that I can fix mistakes.

**Priority:** Low

**Acceptance Criteria:** Validates author ID before allowing edit/delete.

**Dependencies:** US-6.1

**Status:** Done

**ID:** US-6.3

**Story:** As a Workspace Owner or Admin, I want to moderate comments in my projects, so that I can enforce professional communication.

**Priority:** Low

**Acceptance Criteria:** Workspace Owners/Admins can delete any comment within their accessible projects.

**Dependencies:** US-6.1

**Status:** Done

### Epic 7: Activity & Audit Trail

**ID:** US-7.1

**Story:** As a user, I want the system to record important actions, so that there is an audit trail.

**Priority:** Medium

**Acceptance Criteria:** System inserts append-only activity logs for actions: task created, assigned, status changed, priority changed, comment added, project created, member added/removed.

**Dependencies:** US-4.1, US-4.4, US-4.5, US-4.6

**Status:** Done

**ID:** US-7.2

**Story:** As a project member, I want to view the recent activity on a task or project, so that I understand its history.

**Priority:** Medium

**Acceptance Criteria:** Returns paginated activity logs.

**Dependencies:** US-7.1

**Status:** Done

### Epic 8: Search, Filtering & Pagination

**ID:** US-8.1

**Story:** As an authorized project member, I want to search for tasks by title, so that I can quickly find what I am looking for.

**Priority:** Medium

**Acceptance Criteria:** Text search query implementation on task titles.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-8.2

**Story:** As an authorized project member, I want to filter tasks by status, priority, or assignee, so that I can focus on specific work.

**Priority:** Medium

**Acceptance Criteria:** Supports multiple filter query parameters simultaneously.

**Dependencies:** US-4.1

**Status:** Done

**ID:** US-8.3

**Story:** As a user, I want long lists to be paginated, so that the application remains fast.

**Priority:** Medium

**Acceptance Criteria:** Applies pagination logic to appropriate list endpoints (e.g., long lists of tasks, activities). Not blindly forced on every endpoint.

**Dependencies:** US-4.1

**Status:** Done

### Epic 9: Notifications (Future Scope)

**ID:** US-9.1

**Story:** As a user, I want to receive notifications for important events, so that I am kept in the loop.

**Priority:** Low (Future)

**Acceptance Criteria:** Future enhancement. Not part of MVP.

**Dependencies:** US-7.1

**Status:** Blocked

### Epic 10: Administration & Permissions

**ID:** US-10.1

**Story:** As a Workspace Owner, I want to manage roles of my members, so that I can delegate administrative tasks.

**Priority:** Medium

**Acceptance Criteria:**

- Workspace Owner can promote a Member to Admin.

- Workspace Owner can demote an Admin to Member.

- Members cannot change roles.

- Admins cannot arbitrarily change the Workspace Owner's role.

- Exactly one Workspace Owner exists at all times (no ownership transfer for MVP).

**Dependencies:** US-2.2

**Status:** Todo

---

## 3. Technical & Foundation Tasks (TECH)

**ID:** TECH-01

**Task:** Backend project initialization.

**Priority:** High

**Details:** Setup `package.json`, folder structure, and development scripts.

**Status:** Done

**ID:** TECH-02

**Task:** TypeScript configuration.

**Priority:** High

**Details:** Setup `tsconfig.json` and strict type checking.

**Status:** Done

**ID:** TECH-03

**Task:** Express setup & basic routing.

**Priority:** High

**Details:** Configure Express app, base router, and health-check endpoint.

**Status:** Done

**ID:** TECH-04

**Task:** PostgreSQL/Prisma database connection.

**Priority:** High

**Details:** Establish PostgreSQL connection through Prisma, configure the Prisma Client, environment-based database connection string, migrations, and basic startup failure handling. (Avoid unnecessary retry infrastructure).

**Status:** Done

**ID:** TECH-05

**Task:** Environment configuration & Validation.

**Priority:** High

**Details:** Setup `dotenv` and `zod` schema to strictly validate environment variables on boot.

**Status:** Done

**ID:** TECH-06

**Task:** Security & Global Error Handling Middleware.

**Priority:** High

**Details:** Implement `helmet`, `cors`, rate limiting, and a centralized error handling middleware to sanitize responses.

**Status:** Done

**ID:** TECH-07

**Task:** Input validation middleware.

**Priority:** High

**Details:** Generic middleware to validate request bodies/queries against `zod` schemas.

**Status:** Done

**ID:** TECH-08

**Task:** Testing setup.

**Priority:** Medium

**Details:** Configure Jest/Supertest for API and Unit tests. (Note: This is just the foundation; individual feature stories must include their own specific tests).

**Status:** Todo

**ID:** TECH-09

**Task:** API Documentation.

**Priority:** Medium

**Details:** Setup OpenAPI/Swagger to document endpoints as they are built.

**Status:** Todo

---

## 4. Priorities & Dependency Flow

1. **Phase 1 (Foundation)**: TECH-01 through TECH-07. (High Priority).

2. **Phase 2 (Auth)**: US-1.1, US-1.2, US-1.3, US-1.4. (High Priority).

3. **Phase 3 (Core Organization)**: US-2.1, US-2.2, US-3.1, US-3.3. (High Priority).

4. **Phase 4 (Core Engine)**: US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6, US-5.1, US-5.2. (High Priority).

5. **Phase 5 (Secondary Features)**: Comments, Search, Filters, Pagination, Activity, Documentation (TECH-09). (Medium Priority).

---

## 5. Definition of Done (DoD)

A backlog item (User Story or Tech Task) is strictly considered **Done** only when:

1. **Implementation is complete:** The code fully satisfies all Acceptance Criteria.

2. **Coding Standards:** Code strictly follows project standards (naming, TypeScript strict mode, ESLint/Prettier).

3. **Validation & Security:** Input validation is implemented, and authorization/security requirements are satisfied (e.g., verifying workspace membership).

4. **Testing:** Relevant unit, integration, and API tests specifically covering the feature are written and passing. (Do not rely solely on the TECH-08 foundation to test the app at the end).

5. **Documentation:** API documentation is updated where applicable.

6. **Defect-Free:** No known critical defects remain.

7. **Code Review:** The code has been reviewed and approved.

8. **Git Workflow:** Changes are committed and merged using the project's Git conventions.

---

**End of Product Backlog**