# Product Requirements Document (PRD)
# SyncForge

**Version:** 1.0

## 1. Product Vision
SyncForge aims to deliver an intuitive and fast project management tool for software teams. By focusing on a clean UI and core project management features, it reduces the complexity often found in enterprise tools while maintaining essential organization capabilities.

## 2. Functional Requirements (MVP) 

### 2.1 User Management
- **Registration**: Users sign up using name, email, and password.
- **Login / Logout**: Secure JWT-based authentication.
- **Profile**: Users can manage their personal profile information.
- **Password Reset**: Users can reset forgotten passwords.
- **Email Verification**: Users must verify their email address.
*(Note: System does not store `confirmPassword`; it is only used for request validation).*

### 2.2 Workspace Management & Permissions
Workspaces are the top-level organizational unit. Permissions are strictly enforced based on roles:
- **Workspace Owner**: Has full workspace control, manages settings, manages members and roles, and can delete the workspace.
- **Admin**: Can update workspace settings, manage workspace members (add/remove according to permissions), create/update projects, and manage project membership. Cannot delete the workspace.
- **Member**: Can access workspaces and projects they belong to, and work with assigned/accessible tasks. Cannot manage workspace-level settings or roles.

### 2.3 Project Management & Permissions
- **Creation & Updates**: Workspace Owners and Admins can create and update projects. Upon creation, the creator is automatically added as a Project Member to ensure access.
- **Deletion**: Workspace Owners and Admins can archive or delete projects.
- **Membership Management**: Workspace Owners and Admins manage project membership. Project membership must respect workspace membership (i.e., a user must be in the workspace to be added to a project).
- **Access**: Project members can access the project's tasks. Workspace Owners and Admins must also be Project Members to access project tasks, comments, and project-scoped activity.

### 2.4 Task Management
- **Task Fields**:
  - *Required*: Title, Status, Priority.
  - *Optional*: Description, Assignee, Due Date, Labels.
  - *System-managed*: Created By, Created At, Updated At.
- **Permissions**:
  - Authorized project members can create, view, and update tasks.
  - Task deletion requires appropriate project/workspace permissions.
  - Users cannot access tasks from projects they do not have access to.

### 2.5 Kanban Board Visualization
- **Statuses**: Tasks follow a strict lifecycle: `Todo`, `In Progress`, `Review`, `Done`.
- **Interactions**: Users with task-edit permission can change task status. The primary visualization is a Kanban board split by these statuses.

### 2.6 Comments
- **Scope**: Comments belong directly to tasks.
- **Permissions**:
  - Authorized project members can create comments.
  - Comment authors can edit or delete their own comments.
  - Appropriate project/workspace admins may moderate comments if required.

### 2.7 Activity Tracking
The application records important actions to provide an audit trail. These records are treated as append-only. Tracked actions include:
- Task created, assigned, status changed, or priority changed.
- Comment added.
- Project created.
- Member added or removed from a workspace/project.

### 2.8 Search, Filtering & Pagination
- **Search**: Support for task search by title.
- **Filtering**: Support filtering tasks by status, priority, and assignee.
- **Pagination**: Implement pagination for appropriate list endpoints (e.g., long lists of tasks, activities) to maintain performance, rather than enforcing it blindly on every endpoint.

## 3. Non-Functional Requirements

### 3.1 Performance
- Standard API queries should target a response time of approximately 200ms under normal expected load and properly indexed database queries.

### 3.2 Security
- Passwords must be strongly hashed (bcrypt).
- Authentication via JWT.
- Strict authorization checks at the workspace and project boundaries.
- Robust input validation.
- Standardized error responses that never expose sensitive information (e.g., database internals, stack traces) to the client.

## 4. MVP Acceptance Criteria
The MVP is considered complete when all functional requirements are successfully tested, including:
- Registration, Login, Email Verification, and Password Reset.
- Workspace creation and adding registered members.
- Role enforcement.
- Project creation and Project membership assignment.
- Task CRUD, assignment, and Kanban workflow status transitions.
- Comments, Search/Filtering, and Pagination.

**Final Acceptance Scenario:**
A user registers -> verifies email -> logs in -> creates a workspace -> adds a registered member -> creates a project -> adds the project member -> creates a task -> assigns the task -> moves the task through Kanban statuses -> adds a comment -> reaches the `Done` status.

---
**End of PRD**
