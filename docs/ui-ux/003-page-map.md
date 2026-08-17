# Page Map
# SyncForge Page Map

**Version:** 1.0

# Public Pages

```text
/
├── Login
├── Register
├── Forgot Password
├── Reset Password
└── Email Verification
```

# Authenticated Pages

```text
/dashboard

/workspaces
/workspaces/:workspaceId

/projects
/projects/:projectId

/projects/:projectId/board

/tasks
/tasks/:taskId

/notifications

/activity

/profile

/settings
```

# Administrative Pages

```text
/admin/users
/admin/roles
/admin/permissions
/admin/activity
```

# Page Responsibilities

## Dashboard

Provides:

* Overview
* Recent activity
* Task statistics
* Project statistics
* Personal task summary

## Workspace

Provides:

* Workspace information
* Members
* Projects
* Workspace settings

## Project

Provides:

* Project information
* Project members
* Task list
* Project statistics

## Kanban Board

Provides:

* Todo
* In Progress
* Review
* Done

Users can move tasks between permitted statuses.

## Task Details

Provides:

* Task information
* Assignee
* Priority
* Due date
* Comments
* Attachments
* Activity

---

**End of Page Map**
