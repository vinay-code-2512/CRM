# ADR-003: Authentication Strategy

## Status

Accepted

## Date

2026-08-08

## Context

SyncForge needs secure authentication for users accessing workspaces, projects, and tasks.

The authentication system must support:

* Registration
* Login
* Logout
* Password reset
* Email verification
* Protected APIs
* Role-based authorization

## Decision

SyncForge will use:

**JWT-based authentication**

with:

**bcrypt password hashing**

## Authentication Flow

```text
User
 ↓
Login API
 ↓
Validate credentials
 ↓
Compare hashed password
 ↓
Generate JWT
 ↓
Return access token
 ↓
Client sends token with API requests
 ↓
Authentication middleware verifies token
 ↓
Authorization middleware checks permissions
```

## Password Security

Passwords must never be stored as plain text.

Passwords will be hashed using bcrypt before being stored.

During login:

```text
Plain Password
      ↓
bcrypt.compare()
      ↓
Stored Password Hash
```

## JWT

The JWT will contain only the minimum required identity information.

Example conceptual payload:

```json
{
  "userId": "64f123...",
  "role": "Employee"
}
```

Sensitive information must never be stored inside the token.

## Authorization

Authentication and authorization are separate responsibilities.

### Authentication

Answers:

> Who is this user?

### Authorization

Answers:

> What is this user allowed to do?

SyncForge will implement both.

## Resource-Level Authorization

Role checks alone are not sufficient.

The backend must also verify:

```text
User
 ↓
Workspace Membership
 ↓
Project Membership
 ↓
Resource Permission
```

This prevents users from accessing resources simply by knowing their IDs.

## Alternatives Considered

### Session-Based Authentication

Sessions were considered but JWT was selected because SyncForge is being designed as a separated REST API backend that can serve a web frontend independently.

### OAuth

OAuth providers may be added in a future version.

## Consequences

### Positive

* Stateless API authentication
* Easy frontend integration
* Clear middleware architecture
* Suitable for REST APIs

### Negative

* Token lifecycle must be managed carefully.
* Token revocation requires additional design if needed.
* Storing sensitive data in JWTs must be avoided.

## Decision Summary

JWT authentication with bcrypt password hashing is selected for SyncForge V1.

---

**End of ADR-003**
