Database Design

SyncForge

Version: 1.0

Database: PostgreSQL

ORM: Prisma

Database Type: Relational SQL Database

1. Database Overview

SyncForge utilizes PostgreSQL as its primary relational database, accessed through Prisma ORM in Node.js/TypeScript.

PostgreSQL provides relational data integrity, foreign keys, unique constraints, transactions, indexing, and structured querying.

Prisma provides a type-safe schema and database client for application access, migrations, and predictable data operations.

The database design uses explicit relationships between users, workspaces, workspace memberships, projects, project memberships, tasks, comments, and activity logs.

2. Tables

To keep the data model simple and performant without unnecessary complexity, we define the following core tables for the MVP:

user: Core account and profile data.

workspace: Top-level organizational units.

workspaceMember: Junction table linking users to workspaces and defining their roles.

project: Groupings of tasks, belonging to a specific workspace.

projectMember: Junction table linking users to projects to determine access.

task: The core work items, belonging to a specific project.

taskComment: Discussion threads attached directly to tasks.

activityLog: An append-only audit log tracking important system actions.

3. User Data

Table: user

Purpose: Stores authentication credentials and profile information.

Fields:

id (Int, auto-increment, primary key)

name (String, required)

email (String, required, unique)

passwordHash (String, required)

isEmailVerified (Boolean, default: false)

profileData (JSON, optional)

createdAt, updatedAt (timestamps)

Security Constraints:

The system explicitly does not store plaintext passwords or temporary confirmPassword request fields.

There is no system-level global role (e.g., Admin/Employee). Roles are handled at the workspace level.

4. Workspace Data

Table: workspace

Purpose: Represents the top-level organizational boundary.

Fields:

id (Int, auto-increment, primary key)

name (String, required)

description (String, optional)

createdAt, updatedAt (timestamps)

5. Workspace Member Data

Table: workspaceMember

Purpose: Connects users to workspaces and defines their workspace-level permissions.

Fields:

id (Int, auto-increment, primary key)

workspaceId (Int, foreign key -> workspace.id, required)

userId (Int, foreign key -> user.id, required)

role (Enum: Owner, Admin, Member, required)

createdAt, updatedAt (timestamps)

Clarification: Owner represents the Workspace Owner and has full control over the workspace.

Constraints and Indexes:

Unique compound constraint on workspaceId + userId (a user cannot have duplicate membership in the same workspace).

Indexes should support common membership lookups by workspaceId and userId.

Foreign keys maintain referential integrity between users and workspaces.

6. Project Data

Table: project

Purpose: Groups tasks together under a workspace.

Fields:

id (Int, auto-increment, primary key)

workspaceId (Int, foreign key -> workspace.id, required)

name (String, required)

description (String, optional)

isArchived (Boolean, default: false)

createdAt, updatedAt (timestamps)

Business Rules:

Does not contain a separate ownerId or status enum. It simply supports being active or archived.

Project authorization (access to tasks/comments) strictly requires project membership, even for Workspace Owners/Admins. Upon project creation, the creator must be automatically added to projectMember.

7. Project Member Data

Table: projectMember

Purpose: Defines which users have access to a specific project.

Fields:

id (Int, auto-increment, primary key)

projectId (Int, foreign key -> project.id, required)

userId (Int, foreign key -> user.id, required)

createdAt, updatedAt (timestamps)

Indexes and Constraints:

Unique compound constraint on projectId + userId.

Foreign keys maintain referential integrity between projects and users.

Business Rules:

Only dictates membership/access. It does not have project-specific roles.

A project member must also be an active member of the parent workspace.

8. Task Data

Table: task

Purpose: The core actionable work items.

Fields:

id (Int, auto-increment, primary key)

projectId (Int, foreign key -> project.id, required)

title (String, required)

description (String, optional)

status (Enum: Todo, In Progress, Review, Done, default: Todo)

priority (Enum: Low, Medium, High, Urgent, default: Medium)

assigneeId (Int, foreign key -> user.id, optional)

createdBy (Int, foreign key -> user.id, required)

labels (String array, optional)

dueDate (DateTime, optional)

createdAt, updatedAt (timestamps)

9. Comment Data

Table: taskComment

Purpose: Stores user discussions attached to tasks.

Fields:

id (Int, auto-increment, primary key)

taskId (Int, foreign key -> task.id, required)

authorId (Int, foreign key -> user.id, required)

content (String, required)

createdAt, updatedAt (timestamps)

Ownership Rules:

Comment authors own their comments (can edit/delete).

Workspace Owners/Admins have moderation rights to delete any comment.

10. Activity Data

Table: activityLog

Purpose: An append-only audit trail tracking important system actions.

Fields:

id (Int, auto-increment, primary key)

workspaceId (Int, foreign key -> workspace.id, optional for scoping)

projectId (Int, foreign key -> project.id, optional for scoping)

actorId (Int, foreign key -> user.id, required)

action (String, required)

targetEntity (String, required)

targetId (Int, required)

metadata (JSON, optional)

createdAt (Timestamp, auto)

11. Relationships & Representation

The application uses explicit relational foreign keys and dedicated junction tables rather than deep document embedding.

workspaceMember and projectMember represent many-to-many relationships.

A user can belong to multiple workspaces.

A workspace can contain multiple users.

A user can belong to multiple projects.

A project can contain multiple users.

Foreign keys enforce valid relationships between related records.

JSON is used only where flexible structured data is appropriate, such as profileData and activity metadata.

Simple arrays such as task labels may use PostgreSQL array support where appropriate.

12. Indexing Strategy

To guarantee efficient query execution, targeted indexes should support known access patterns:

user.email (Unique)

workspaceMember.workspaceId + userId (Unique Compound)

projectMember.projectId + userId (Unique Compound)

project.workspaceId (Index)

task.projectId (Index)

task.assigneeId (Index)

activityLog.workspaceId (Index)

activityLog.projectId (Index)

Indexes should be added deliberately because indexes improve read performance but also add storage and write/update overhead.

13. Data Integrity & Constraints

PostgreSQL provides strong relational integrity through:

Primary keys: Uniquely identify each record.

Foreign keys: Prevent invalid references between related tables.

Unique constraints: Prevent duplicate emails and duplicate memberships.

Check/enum constraints: Restrict values such as workspace roles, task status, and task priority.

NOT NULL constraints: Enforce required fields.

Application/Service Validation: Request validation schemas and business rules are still enforced before database interaction.

Transactions: Used when multiple related database changes must succeed or fail together.

14. Security

Data Protection: passwordHash is stored securely using bcrypt.

Access Control: The service layer strictly checks workspaceMember and projectMember authorization before returning or modifying protected resources.

Query Safety: Prisma Client provides parameterized/type-safe query operations rather than constructing raw SQL from untrusted input.

Database Permissions: Application credentials should use only the database permissions required by the application.

15. Pagination / Search / Filtering

Pagination: List endpoints such as Activities and Tasks will use standard page and limit pagination for MVP simplicity. The application translates these into SQL OFFSET/LIMIT operations where appropriate.

Filtering: Prisma query conditions will support filtering by status, priority, and assigneeId.

Search: Task title search will initially use a straightforward PostgreSQL query strategy appropriate to the MVP. More advanced full-text/search indexing may be considered later if production requirements justify it.

16. Timestamps & Archival

Timestamps: Prisma schema fields and PostgreSQL timestamp columns manage createdAt and updatedAt.

Archival: Projects support an isArchived flag. We do not use global isDeleted soft-delete patterns. Deletions on tasks or comments are hard deletes to keep the architecture simple.

17. Database Design Decisions

Decision

Choice

Reason

Database

PostgreSQL

Relational integrity, foreign keys, transactions, constraints, and structured querying suit SyncForge.

ORM

Prisma

Provides type-safe database access, schema management, migrations, and strong TypeScript integration.

Relational Strategy

Dedicated Junction Tables

workspaceMember and projectMember safely represent many-to-many relationships.

Indexing

Targeted Indexing

Indexes are created for explicitly known access patterns.

Timestamps

PostgreSQL/Prisma Timestamps

Provides reliable creation and update tracking.

Archival vs Deletion

Project-only Archival

Avoids global soft-delete complexity while preserving project lifecycle history.

18. Future Considerations

Note: The following features are explicitly NOT part of the current MVP architecture. They are mentioned only as future scaling options if actual production requirements demand them.

Notifications: A dedicated notification table to alert users of assignments or mentions.

Task Attachments: Dedicated tables/storage integration for file uploads.

Caching & Queues: Introducing Redis or background processing only when actual production requirements justify them.

Advanced Search: PostgreSQL full-text search or a dedicated search solution if simple task-title search becomes insufficient.

End of Database Design Document