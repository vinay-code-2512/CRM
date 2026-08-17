# Wireframes
# SyncForge Wireframes

**Version:** 1.0

## Purpose

This document describes the initial wireframe structure before high-fidelity UI design.

---

# 1. Login

```text
┌──────────────────────────────┐
│          SyncForge           │
│                              │
│ Email                        │
│ [________________________]   │
│                              │
│ Password                     │
│ [________________________]   │
│                              │
│ [        Login        ]      │
│                              │
│ Forgot Password?             │
│                              │
│ Don't have an account?       │
│ Register                     │
└──────────────────────────────┘
```

---

# 2. Dashboard

```text
┌──────────────┬──────────────────────────────┐
│ SyncForge    │ Top Navigation               │
├──────────────┼──────────────────────────────┤
│ Dashboard    │ Welcome                      │
│ Workspaces   │                              │
│ Projects     │ ┌──────┐ ┌──────┐ ┌──────┐ │
│ My Tasks     │ │Tasks │ │Done  │ │Projects│
│ Notifications│ └──────┘ └──────┘ └──────┘ │
│ Activity     │                              │
│ Settings     │ Recent Activity              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

---

# 3. Project Board

```text
┌─────────────────────────────────────────────────────────┐
│ Project Name                              [+ Task]       │
├──────────────┬──────────────┬──────────────┬─────────────┤
│ Todo         │ In Progress  │ Review       │ Done        │
├──────────────┼──────────────┼──────────────┼─────────────┤
│ Task         │ Task         │ Task         │ Task        │
│ Task         │ Task         │              │ Task        │
│              │              │              │             │
└──────────────┴──────────────┴──────────────┴─────────────┘
```

---

# 4. Task Details

```text
┌────────────────────────────────────────────────┐
│ Task Title                              [X]    │
├────────────────────────────────────────────────┤
│ Description                                    │
│                                                │
│ Status:       In Progress                      │
│ Priority:     High                             │
│ Assignee:     User                             │
│ Due Date:     Date                             │
│                                                │
│ Comments                                       │
│ ┌────────────────────────────────────────────┐ │
│ │ Comment                                   │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Attachments                                    │
└────────────────────────────────────────────────┘
```

---

# 5. Workspace

```text
┌────────────────────────────────────────────────┐
│ Workspace Name                  [Settings]      │
├────────────────────────────────────────────────┤
│ Projects                                       │
│                                                │
│ ┌──────────────┐ ┌──────────────┐             │
│ │ Project A    │ │ Project B    │             │
│ └──────────────┘ └──────────────┘             │
│                                                │
│ Members                         [+ Invite]      │
└────────────────────────────────────────────────┘
```

---

# 6. Design Status

These wireframes are low-fidelity and will be refined in Figma.

Before frontend implementation, high-fidelity screens will be created for:

* Login
* Registration
* Dashboard
* Workspace
* Project
* Kanban Board
* Task Details
* Notifications
* Profile
* Settings

---

**End of Wireframes**
