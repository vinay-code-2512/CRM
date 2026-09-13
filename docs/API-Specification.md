# API Specification

# SyncForge

**Version:** 1.0

**Base URL:** `/api/v1`

## General Guidelines

- **Format:** All requests and responses use `application/json`.

- **Authentication:** Endpoints (except public ones like login/register) require a valid JWT passed in the `Authorization: Bearer <token>` header.

- **Authorization Checks:** The backend must independently verify project/workspace membership and roles for the authenticated user before allowing access to protected resources.

- **Pagination:** Collection endpoints support standard offset pagination via `?page=1&limit=20` query parameters.

- **Error Responses:** Errors follow a standard format:

  ```json

  {

    "error": "ErrorType",

    "message": "Human readable message"

  }

  ```

---

## 1. Authentication

### Register

- **Method:** `POST /auth/register`

- **Auth Required:** No

- **Request Body:** `{ "name": "John", "email": "john@test.com", "password": "SecurePassword123" }`

- **Success (201):** `{ "message": "Registration successful. Please verify email.", "userId": "..." }`

### Login

- **Method:** `POST /auth/login`

- **Auth Required:** No

- **Request Body:** `{ "email": "john@test.com", "password": "SecurePassword123" }`

- **Success (200):** `{ "token": "jwt.token.string" }`

### Logout

- **Method:** `POST /auth/logout`

- **Auth Required:** Yes

- **Success (200):** `{ "message": "Successfully logged out" }`

- **Architecture Note:** Logout in the MVP **only removes the JWT client-side**. The API will respond with success so the frontend knows to discard the token. We intentionally avoid a server-side token blocklist, Redis, refresh-token collections, or any other unnecessary infrastructure to maintain modular-monolith simplicity.

### Email Verification & Password Reset

- **Architecture Note:** Verification and password reset tokens are generated as **stateless, short-lived JWTs**. The signing-secret derivation for reset tokens must incorporate the user's current password hash, ensuring that changing the password immediately invalidates previously issued reset tokens. This avoids introducing unnecessary token collections into the database.

- **Verify Email:** `POST /auth/verify-email` (Body: `{ "token": "..." }`)

- **Forgot Password:** `POST /auth/forgot-password` (Body: `{ "email": "..." }`)

- **Reset Password:** `POST /auth/reset-password` (Body: `{ "token": "...", "newPassword": "..." }`)

---

## 2. User Profile

### Get Current User

- **Method:** `GET /users/me`

- **Auth Required:** Yes

- **Success (200):** Profile object.

### Update Profile

- **Method:** `PATCH /users/me`

- **Auth Required:** Yes

- **Request Body:** `{ "name": "Jane", "profileData": {} }`

- **Success (200):** Updated user object.

---

## 3. Workspace Management

### Create Workspace

- **Method:** `POST /workspaces`

- **Auth Required:** Yes

- **Request Body:**

  ```json

  { "name": "Design Team", "description": "Optional desc" }

  ```

- **Success (201 Created):**

  ```json

  { "id": 1, "name": "Design Team", "description": "Optional desc", "createdAt": "...", "updatedAt": "..." }

  ```

- **Note:** The user who creates the workspace is automatically assigned the `Owner` role in the `WorkspaceMember` table.

### List My Workspaces

- **Method:** `GET /workspaces`

- **Auth Required:** Yes

- **Success (200 OK):**

  ```json

  [

    { "id": 1, "name": "Design Team", "description": "Optional desc", "createdAt": "...", "updatedAt": "..." }

  ]

  ```

### Get Workspace

- **Method:** `GET /workspaces/:id`

- **Auth Required:** Yes (Returns 403 Forbidden if the user is not a member of the workspace)

- **Success (200 OK):**

  ```json

  { "id": 1, "name": "Design Team", "description": "Optional desc", "createdAt": "...", "updatedAt": "..." }

  ```

### Update Workspace

- **Method:** `PATCH /workspaces/:id`

- **Auth Required:** Yes (**Workspace Owner or Admin**)
- **Request Body:** `{ "name": "New Name" }`
- **Success (200):** Updated workspace details.

### Delete Workspace

- **Method:** `DELETE /workspaces/:id`
- **Purpose:** Delete a workspace and cascade remove all its members.
- **Auth Required:** Yes (Authenticated requester is identified from the JWT).
- **Authorization:** Only the **Workspace Owner** can perform this operation. Admins and Members are strictly prohibited.
- **Path Parameters:**
  - `id` (integer): Target workspace ID.
- **Success (200 OK):**
  ```json
  {
    "message": "Workspace deleted successfully"
  }

---

## 4. Workspace Members & Roles

### List Workspace Members

- **Method:** `GET /workspaces/:workspaceId/members`

- **Auth Required:** Yes (Workspace Member, Admin, or Workspace Owner)

- **Success (200):** Array of members.

### Add Workspace Member

- **Method:** `POST /workspaces/:id/members`
- **Purpose:** Add an existing registered user to a workspace.
- **Auth Required:** Yes (Authenticated requester is identified from the JWT).
- **Authorization:** Only Workspace Owner or Admin of the target workspace can perform this operation.
- **Path Parameter:** 
  - `id` (integer): Target workspace ID.
- **Request Body:**
  ```json
  {
    "email": "alice@test.com",
    "role": "Member"
  }


- **Architecture Note:** The MVP performs direct member addition. The target user must already be registered in the system. If they are not, the API returns a `404 Not Found` with a message that the user must register first. We do not introduce complex invitation-state collections or external notifications.

### Update Member Role

- **Method:** `PATCH /workspaces/:workspaceId/members/:userId/role`

- **Auth Required:** Yes (**Workspace Owner or Admin**)

- **Request Body:** `{ "role": "Admin" }`

- **Success (200):** `{ "message": "Member role updated successfully", "member": { ... } }`

- **Constraints:** Only `Admin` or `Member` roles can be assigned. Cannot change the `Owner`'s role. Cannot assign the `Owner` role to anyone.


### Remove Member

- **Method:** `DELETE /workspaces/:workspaceId/members/:userId`
- **Purpose:** Remove a member from the workspace.
- **Auth Required:** Yes (Authenticated requester is identified from the JWT).
- **Authorization:** Only Workspace Owner or Admin of the target workspace can perform this operation.
- **Path Parameters:** 
  - `workspaceId` (integer): Target workspace ID.
  - `userId` (integer): ID of the user to be removed.
- **Success (200 OK):**
  ```json
  {
    "message": "Member removed successfully"
  }


---

## 5. Project Management

### Create Project

- **Method:** `POST /workspaces/:workspaceId/projects`

- **Auth Required:** Yes (Workspace Owner or Admin)

- **Request Body:** `{ "name": "Website Redesign" }`

- **Success (201):** Created project. The creator is automatically added as a Project Member to ensure access.

### List Projects

- **Method:** `GET /workspaces/:workspaceId/projects`

- **Auth Required:** Yes (Workspace Member, Admin, or Workspace Owner)

- **Success (200):** Array of active projects.

### Update / Archive Project

- **Method:** `PATCH /projects/:projectId`

- **Auth Required:** Yes (Workspace Owner or Admin)

- **Request Body:** `{ "name": "Updated Name", "isArchived": true }`

- **Success (200):** Updated project.

- **Action:** Submitting `{ "isArchived": true }` will archive the project.

### Delete Project

- **Method:** `DELETE /projects/:projectId`

- **Auth Required:** Yes (Workspace Owner or Admin)

- **Success (200):** `{ "message": "Project deleted" }`

- **Action:** Calling this endpoint will permanently delete the project.

---

## 6. Project Membership

### List Project Members

- **Method:** `GET /projects/:projectId/members`

- **Auth Required:** Yes (Project Member, Workspace Admin, or Workspace Owner)

- **Success (200):** Array of members.

### Add Member to Project

- **Method:** `POST /projects/:projectId/members`

- **Auth Required:** Yes (Workspace Owner or Admin)

- **Request Body:** `{ "userId": "..." }`

- **Success (201):** `{ "message": "User added to project" }`

- **Constraints:** `project_members` can only be created for users who are already active members of the parent workspace.

### Remove Member from Project

- **Method:** `DELETE /projects/:projectId/members/:userId`

- **Auth Required:** Yes (Workspace Owner or Admin)

- **Success (200):** `{ "message": "User removed" }`

---

## 7. Task Management (CRUD, Kanban, Search)

### Create Task

- **Method:** `POST /projects/:projectId/tasks`

- **Auth Required:** Yes (Project Member)

- **Request Body:**

  ```json

  {

    "title": "Setup database",

    "description": "Initialize PostgreSQL database",

    "priority": "High",

    "labels": ["backend", "setup"],

    "dueDate": "2026-09-01T00:00:00.000Z"

  }

  ```

- **Success (201):** Created task (defaults to status `Todo`).

### List / Filter Tasks (Kanban Board & Search)

- **Method:** `GET /projects/:projectId/tasks`

- **Auth Required:** Yes (Project Member)

- **Query Parameters:**

  - `status`: `Todo`, `In Progress`, `Review`, `Done`

  - `priority`: `Low`, `Medium`, `High`, `Urgent`

  - `assigneeId`: Filter by user.

  - `search`: Simple text match on title.

  - `page`, `limit`: Pagination.

- **Success (200):** Paginated array of tasks.

### Get Task Details

- **Method:** `GET /tasks/:taskId`

- **Auth Required:** Yes (Project Member)

- **Success (200):** Task details.

### Update Task

- **Method:** `PATCH /tasks/:taskId`

- **Auth Required:** Yes (Project Member)

- **Request Body:**

  ```json

  {

    "status": "In Progress",

    "assigneeId": "user_id_here"

  }

  ```

- **Success (200):** Updated task.

- **Constraints:** Task assignment (`assigneeId`) only allows valid project members.

### Delete Task

- **Method:** `DELETE /tasks/:taskId`

- **Auth Required:** Yes (**Workspace Owner, Workspace Admin, or Task Creator**)

- **Success (200):** `{ "message": "Task deleted" }`

- **Constraints:** Even for the Task Creator, deletion is strictly conditional on the user still having valid access to the task's parent project/workspace.

---

## 8. Task Comments

### List Comments

- **Method:** `GET /tasks/:taskId/comments`

- **Auth Required:** Yes (Project Member)

- **Query Parameters:** `page`, `limit`.

- **Success (200):** Paginated array of comments.

### Add Comment

- **Method:** `POST /tasks/:taskId/comments`

- **Auth Required:** Yes (Project Member)

- **Request Body:** `{ "content": "Working on this now." }`

- **Success (201):** Created comment.

### Update Comment

- **Method:** `PATCH /comments/:commentId`

- **Auth Required:** Yes (**Strictly Comment Author**)

- **Request Body:** `{ "content": "Updated text" }`

- **Success (200):** Updated comment.

### Delete Comment

- **Method:** `DELETE /comments/:commentId`

- **Auth Required:** Yes (**Comment Author, Workspace Owner, or Workspace Admin**)

- **Success (200):** `{ "message": "Comment deleted" }`

---

## 9. Activity Logs

### Get Workspace Activity

- **Method:** `GET /workspaces/:workspaceId/activities`

- **Auth Required:** Yes (Workspace Member, Admin, or Workspace Owner)

- **Query Parameters:** `page`, `limit`.

- **Success (200):** Paginated list of audit events scoped to the workspace.

### Get Project Activity

- **Method:** `GET /projects/:projectId/activities`

- **Auth Required:** Yes (Project Member)

- **Query Parameters:** `page`, `limit`.

- **Success (200):** Paginated list of audit events scoped to the project.

---

**End of API Specification Document**