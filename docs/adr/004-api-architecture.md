# ADR-004: API Architecture

## Status

Accepted

## Date

2026-08-08

## Context

SyncForge needs an API architecture that remains maintainable as the number of features increases.

The application contains multiple domains:

* Authentication
* Users
* Workspaces
* Projects
* Tasks
* Notifications
* Activity Logs

A single large controller or route file would become difficult to maintain.

## Decision

SyncForge will use a modular layered architecture.

The primary layers will be:

```text
Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Services
   ↓
Repositories / Data Access
   ↓
Mongoose Models
   ↓
MongoDB
```

## Responsibilities

### Routes

Define:

* HTTP method
* Endpoint
* Middleware
* Controller

Routes should not contain business logic.

### Middleware

Responsible for cross-cutting concerns such as:

* Authentication
* Authorization
* Validation
* Rate limiting
* Request processing

### Controllers

Responsible for:

* Receiving HTTP requests
* Calling services
* Returning HTTP responses

Controllers should remain thin.

### Services

Responsible for business logic.

Examples:

```text
Create workspace
Assign task
Update task status
Invite workspace member
```

### Repositories / Data Access

Responsible for database interaction where a repository layer is justified.

### Models

Define MongoDB/Mongoose schemas and database-level structure.

## Modular Organization

The backend will be organized by feature/domain rather than putting all files into large global folders.

Conceptually:

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── workspaces/
│   ├── projects/
│   ├── tasks/
│   ├── notifications/
│   └── activity-logs/
│
├── middleware/
├── config/
├── utils/
├── types/
└── app.ts
```

The exact folder structure will be finalized during backend initialization.

## Error Handling

Errors will be handled centrally through error-handling middleware.

Controllers and services should throw meaningful application errors instead of manually repeating response logic throughout the application.

## Consequences

### Positive

* Clear separation of responsibilities
* Easier testing
* Easier feature development
* Easier code review
* Better maintainability
* Reduced coupling

### Negative

* More files and abstractions
* Slightly more initial setup
* Developers need to understand the responsibility of each layer

## Decision Summary

SyncForge will use a modular layered REST API architecture with clear separation between routes, middleware, controllers, services, data access, and models.

---

**End of ADR-004**
