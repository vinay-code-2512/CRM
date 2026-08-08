# Entity-Relationship Diagram
# SyncForge

**Version:** 1.0

## 1. Data Model Diagram
This diagram illustrates the core collections, relationships, and essential fields for the SyncForge MVP. It is strictly based on the approved Database Design structure.

```mermaid
erDiagram
    %% Entities
    USER {
        ObjectId _id PK
        String name
        String email "unique"
        String passwordHash
        Boolean isEmailVerified
        Object profileData
        Date createdAt
        Date updatedAt
    }

    WORKSPACE {
        ObjectId _id PK
        String name
        String description
        Date createdAt
        Date updatedAt
    }

    WORKSPACE_MEMBER {
        ObjectId _id PK
        ObjectId workspaceId FK
        ObjectId userId FK
        String role "Owner | Admin | Member"
        Date createdAt
        Date updatedAt
    }

    PROJECT {
        ObjectId _id PK
        ObjectId workspaceId FK
        String name
        String description
        Boolean isArchived
        Date createdAt
        Date updatedAt
    }

    PROJECT_MEMBER {
        ObjectId _id PK
        ObjectId projectId FK
        ObjectId userId FK
        Date createdAt
        Date updatedAt
    }

    TASK {
        ObjectId _id PK
        ObjectId projectId FK
        String title
        String description
        String status "Todo | In Progress | Review | Done"
        String priority "Low | Medium | High | Urgent"
        ObjectId assigneeId FK "optional"
        ObjectId createdBy FK
        Array labels
        Date dueDate
        Date createdAt
        Date updatedAt
    }

    TASK_COMMENT {
        ObjectId _id PK
        ObjectId taskId FK
        ObjectId authorId FK
        String content
        Date createdAt
        Date updatedAt
    }

    ACTIVITY_LOG {
        ObjectId _id PK
        ObjectId workspaceId FK "optional"
        ObjectId projectId FK "optional"
        ObjectId actorId FK
        String action
        String targetEntity
        ObjectId targetId
        Object metadata
        Date createdAt
    }

    %% Relationships
    USER ||--o{ WORKSPACE_MEMBER : "has memberships"
    WORKSPACE ||--o{ WORKSPACE_MEMBER : "has members"

    WORKSPACE ||--o{ PROJECT : "contains"

    USER ||--o{ PROJECT_MEMBER : "has memberships"
    PROJECT ||--o{ PROJECT_MEMBER : "has members"

    PROJECT ||--o{ TASK : "contains"
    USER ||--o{ TASK : "creates (createdBy)"
    USER |o--o{ TASK : "assigned to (assigneeId)"

    TASK ||--o{ TASK_COMMENT : "contains"
    USER ||--o{ TASK_COMMENT : "authors (authorId)"

    USER ||--o{ ACTIVITY_LOG : "performs (actorId)"
    WORKSPACE |o--o{ ACTIVITY_LOG : "tracks workspace events"
    PROJECT |o--o{ ACTIVITY_LOG : "tracks project events"
```

## 2. Relationship Notes

### Workspace Memberships (User ↔ Workspace)
- **Implementation:** Resolved via the dedicated `WORKSPACE_MEMBER` collection rather than an embedded array (to ensure high scalability).
- **Access Boundary:** A user must possess an active `WORKSPACE_MEMBER` record to access the workspace. The `role` (Owner, Admin, or Member) on this record determines their high-level permissions.

### Project Memberships (User ↔ Project)
- **Implementation:** Resolved via the dedicated `PROJECT_MEMBER` collection.
- **Access Boundary:** Project authorization (access to tasks/comments) explicitly requires `PROJECT_MEMBER` presence, even for Workspace Owners and Admins.
- **Roles:** Project-specific roles do not exist; standard authorization bubbles down from the workspace level. A user must be an active workspace member before being added as a project member.

### Task Ownership & Assignment
- **Creation:** A task must always have a valid `createdBy` reference pointing to the user who initially created the task.
- **Assignment:** The `assigneeId` is optional (0..1 relationship from Task to User). A task does not require an assignee, but can be assigned to a valid project member.

### Activity Tracking
- **Loose Coupling:** The `ACTIVITY_LOG` collection acts as an append-only audit trail.
- **References:** An activity is strictly tied to an `actorId` (the user performing the action), but links to `workspaceId` and `projectId` are optional depending on the scope of the event (e.g., adding a workspace member only requires a workspace reference, whereas updating a task status requires both).
- **Flexibility:** `targetEntity` and `targetId` dynamically point to the entity that was acted upon (e.g., a specific Task or Project ID).

---
**End of ER Diagram Document**
