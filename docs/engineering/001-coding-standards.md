# Coding Standards
# SyncForge Coding Standards

**Version:** 1.0

## 1. Purpose

This document defines coding standards for the SyncForge project.

The goal is to keep the codebase:

* Consistent
* Readable
* Maintainable
* Testable
* Reviewable

---

# 2. Language

The backend will use:

```text
TypeScript
```

TypeScript strict mode will be enabled.

---

# 3. Naming Conventions

## Files

Use descriptive names.

Examples:

```text
auth.controller.ts
auth.service.ts
auth.routes.ts
auth.validation.ts
```

## Variables

Use camelCase:

```typescript
const userId = "123";
const workspaceName = "Engineering";
```

## Functions

Use descriptive camelCase:

```typescript
createWorkspace()
getProjectById()
updateTaskStatus()
```

## Classes

Use PascalCase:

```typescript
AuthService
WorkspaceService
TaskService
```

## Constants

Use uppercase for true global constants:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;
```

---

# 4. TypeScript Rules

Avoid:

```typescript
any
```

unless there is a documented reason.

Prefer explicit types and interfaces.

Example:

```typescript
interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
}
```

---

# 5. Functions

Functions should have one clear responsibility.

Avoid very large functions.

Prefer:

```text
Controller
    ↓
Service
    ↓
Data Access
```

instead of putting everything inside controllers.

---

# 6. Controllers

Controllers should:

* Receive HTTP requests
* Extract input
* Call services
* Return HTTP responses

Controllers should not contain complex business logic.

---

# 7. Services

Services contain business rules.

Example:

```text
createTask()
assignTask()
changeTaskStatus()
```

Services should be independently testable.

---

# 8. Validation

All external input must be validated.

Validate:

* Request body
* Parameters
* Query strings
* File uploads

Never trust client input.

---

# 9. Error Handling

Use centralized error handling.

Do not repeatedly write custom error response logic in every controller.

---

# 10. Comments

Comments should explain **why**, not simply repeat **what** the code does.

Bad:

```typescript
// Increment count by one
count++;
```

Good:

```typescript
// Retry once because the external service occasionally returns transient failures.
```

Do not over-comment obvious code.

---

# 11. Environment Variables

Secrets must never be committed to Git.

Examples:

```text
DATABASE_URL
JWT_SECRET
```

Store them in environment configuration.

---

# 12. Code Formatting

The project will use automated formatting and linting.

Tools:

* ESLint
* Prettier

Code should pass linting before pull requests are opened.

---

# 13. API Naming

Use plural resource names:

```text
/users
/workspaces
/projects
/tasks
```

Use HTTP methods to express actions.

Prefer:

```text
PATCH /tasks/:taskId/status
```

instead of unnecessarily creating RPC-style endpoints.

---

# 14. Code Review

Every significant feature should be reviewed before merging.

Reviewers should check:

* Correctness
* Security
* Tests
* Error handling
* Maintainability
* Naming
* Performance

---

# 15. Definition of Done

A feature is considered complete when:

* Code is implemented
* Validation exists
* Error handling exists
* Tests pass
* Lint passes
* Documentation is updated
* Code has been reviewed
* Changes are merged

---

**End of Coding Standards**
