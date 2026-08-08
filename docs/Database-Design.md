# Database Design
# SyncForge

**Version:** 1.0
**Database:** MongoDB
**ODM:** Mongoose
**Database Type:** NoSQL Document Database

---

## 1. Database Overview

SyncForge utilizes MongoDB as its primary database, accessed via the Mongoose Object Data Modeling (ODM) library in Node.js. 
- **MongoDB** provides a flexible, scalable document model perfectly suited for a project management application.
- **Mongoose** provides schema definition, strict type casting, robust validation, and helpful query building capabilities, ensuring our flexible NoSQL database maintains predictable structure and data integrity.

---

## 2. Collections

To keep the data model simple and performant without unnecessary complexity, we define the following core collections for the MVP:

- `users`: Core account and profile data.
- `workspaces`: Top-level organizational units.
- `workspace_members`: Dedicated collection linking users to workspaces and defining their roles.
- `projects`: Groupings of tasks, belonging to a specific workspace.
- `project_members`: Dedicated collection linking users to projects to determine access.
- `tasks`: The core work items, belonging to a specific project.
- `task_comments`: Discussion threads attached directly to tasks.
- `activity_logs`: An append-only audit log tracking important system actions.

---

## 3. User Data
**Collection:** `users`
**Purpose:** Stores authentication credentials and profile information.

**Fields:**
- `_id` (ObjectId, auto)
- `name` (String, required)
- `email` (String, required, unique)
- `passwordHash` (String, required)
- `isEmailVerified` (Boolean, default: false)
- `profileData` (Object, optional)
- `createdAt`, `updatedAt` (Timestamps, auto)

**Security Constraints:** 
- The system explicitly **does not** store plaintext passwords or temporary `confirmPassword` request fields.
- There is **no system-level global role** (e.g., Admin/Employee). Roles are handled at the workspace level.

---

## 4. Workspace Data
**Collection:** `workspaces`
**Purpose:** Represents the top-level organizational boundary.

**Fields:**
- `_id` (ObjectId, auto)
- `name` (String, required)
- `description` (String, optional)
- `createdAt`, `updatedAt` (Timestamps, auto)

---

## 5. Workspace Member Data
**Collection:** `workspace_members`
**Purpose:** Connects users to workspaces and defines their workspace-level permissions.

**Fields:**
- `_id` (ObjectId, auto)
- `workspaceId` (ObjectId, references Workspace, required)
- `userId` (ObjectId, references User, required)
- `role` (String, enum: `Owner`, `Admin`, `Member`, required)
- `createdAt`, `updatedAt` (Timestamps, auto)

*Clarification:* `Owner` represents the Workspace Owner and has full control over the workspace.

**Indexes:**
- `workspaceId` + `userId`: Unique Compound Index (User cannot have duplicate memberships).

---

## 6. Project Data
**Collection:** `projects`
**Purpose:** Groups tasks together under a workspace.

**Fields:**
- `_id` (ObjectId, auto)
- `workspaceId` (ObjectId, references Workspace, required)
- `name` (String, required)
- `description` (String, optional)
- `isArchived` (Boolean, default: false)
- `createdAt`, `updatedAt` (Timestamps, auto)

**Business Rules:**
- Does not contain a separate `ownerId` or `status` enum. It simply supports being active or archived.
- Project authorization (access to tasks/comments) strictly requires project membership, even for Workspace Owners/Admins. Upon project creation, the creator must be automatically added to `project_members`.

---

## 7. Project Member Data
**Collection:** `project_members`
**Purpose:** Defines which users have access to a specific project.

**Fields:**
- `_id` (ObjectId, auto)
- `projectId` (ObjectId, references Project, required)
- `userId` (ObjectId, references User, required)
- `createdAt`, `updatedAt` (Timestamps, auto)

**Indexes:**
- `projectId` + `userId`: Unique Compound Index.

**Business Rules:**
- Only dictates *membership/access*. It **does not** have project-specific roles (no Manager/Member roles here).
- A project member must also be an active member of the parent workspace.

---

## 8. Task Data
**Collection:** `tasks`
**Purpose:** The core actionable work items.

**Fields:**
- `_id` (ObjectId, auto)
- `projectId` (ObjectId, references Project, required)
- `title` (String, required)
- `description` (String, optional)
- `status` (String, enum: `Todo`, `In Progress`, `Review`, `Done`, default: `Todo`)
- `priority` (String, enum: `Low`, `Medium`, `High`, `Urgent`, default: `Medium`)
- `assigneeId` (ObjectId, references User, optional)
- `createdBy` (ObjectId, references User, required)
- `labels` (Array of Strings, optional)
- `dueDate` (Date, optional)
- `createdAt`, `updatedAt` (Timestamps, auto)

---

## 9. Comment Data
**Collection:** `task_comments`
**Purpose:** Stores user discussions attached to tasks.

**Fields:**
- `_id` (ObjectId, auto)
- `taskId` (ObjectId, references Task, required)
- `authorId` (ObjectId, references User, required)
- `content` (String, required)
- `createdAt`, `updatedAt` (Timestamps, auto)

**Ownership Rules:**
- Comment authors own their comments (can edit/delete).
- Workspace Owners/Admins have moderation rights to delete any comment.

---

## 10. Activity Data
**Collection:** `activity_logs`
**Purpose:** An append-only audit trail tracking important system actions.

**Fields:**
- `_id` (ObjectId, auto)
- `workspaceId` (ObjectId, references Workspace, optional for scoping)
- `projectId` (ObjectId, references Project, optional for scoping)
- `actorId` (ObjectId, references User, required)
- `action` (String, required)
- `targetEntity` (String, required)
- `targetId` (ObjectId, required)
- `metadata` (Object, flexible payload, optional)
- `createdAt` (Timestamp, auto)

---

## 11. Relationships & Representation
The application primarily utilizes explicit **ObjectId references** across dedicated collections rather than deep embedding. 
- Dedicated collections (`workspace_members`, `project_members`) are used for many-to-many relationships, providing highly scalable access control.
- Embedding is reserved only for simple arrays like `labels` on Tasks.

---

## 12. Indexing Strategy
To guarantee fast query execution, we propose targeted indexes:
- `users.email` (Unique)
- `workspace_members.workspaceId` + `userId` (Unique Compound)
- `project_members.projectId` + `userId` (Unique Compound)
- `projects.workspaceId` (Index)
- `tasks.projectId` (Index)
- `tasks.assigneeId` (Index)
- `activity_logs.workspaceId`, `activity_logs.projectId` (Indexes for audit feeds)

---

## 13. Data Integrity & Constraints
MongoDB does not provide traditional SQL foreign keys. Integrity is maintained via:
- **Mongoose Validation:** Enforcing required fields, strict types, and enums (`status`, `priority`).
- **Application/Service Validation:** Request validation schemas before DB interaction.
- **Service-Level Checks:** Ensuring users exist in `workspace_members` before being added to `project_members`.

---

## 14. Security
- **Data Protection:** `passwordHash` is stored securely using bcrypt.
- **Access Control:** The service layer strictly checks `workspace_members` and `project_members` authorization before returning any resources.

---

## 15. Pagination / Search / Filtering
- **Pagination:** List endpoints (Activities, Tasks) will use standard `skip` and `limit` offset pagination for MVP simplicity.
- **Filtering:** Mongoose query objects will support direct filtering by `status`, `priority`, and `assigneeId`.
- **Search:** Task title search will initially use a Mongoose regular expression (`$regex`) query. Search indexing or a dedicated search solution may be considered later if production requirements justify it.

---

## 16. Timestamps & Archival
- **Timestamps:** Mongoose `{ timestamps: true }` manages `createdAt` and `updatedAt` for all collections.
- **Archival:** Projects support an `isArchived` flag. We do not use global `isDeleted` soft-delete patterns. Deletions on tasks or comments are hard deletes to keep the architecture simple.

---

## 17. Database Design Decisions

| Decision | Choice | Reason |
| :--- | :--- | :--- |
| **Database** | MongoDB | Flexible schema supports project management structures easily. |
| **ODM** | Mongoose | Essential for defining structure, strict casting, and validation. |
| **Relational Strategy**| Dedicated Membership Collections | `workspace_members` and `project_members` safely scale many-to-many relationships without document size limits. |
| **Indexing** | Targeted Indexing | Indexes only created for explicitly known access patterns. |
| **Timestamps** | Mongoose Timestamps | Automates timeline tracking reliably. |
| **Archival vs Deletion**| Project-only Archival | Avoids global soft-delete complexity while preserving project history. |

---

## 18. Future Considerations
*Note: The following features are explicitly **NOT** part of the current MVP architecture. They are mentioned only as future scaling options if actual production requirements demand them.*
- **Notifications:** A dedicated `notifications` collection to alert users of assignments or mentions.
- **Task Attachments:** A dedicated `task_attachments` collection for file uploads.
- **Caching & Queues:** Introducing Redis for caching heavy queries or background processing queues for activity logs.

---
**End of Database Design Document**
