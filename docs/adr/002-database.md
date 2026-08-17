# ADR-002: Database Selection

## Status

Accepted

## Date

2026-08-08

## Context

SyncForge needs a database capable of storing users, workspaces, projects, tasks, comments, attachments, notifications, and activity logs.

The database must support flexible application development while providing indexes, validation, querying, and scalability.

## Decision

SyncForge will use:

**MongoDB**

with:

**Mongoose**

as the Object Data Modeling (ODM) library.

## Why MongoDB?

MongoDB is a document-oriented NoSQL database.

It is suitable for SyncForge because:

* Application entities can be represented naturally as documents.
* Schema evolution is flexible.
* It supports indexing.
* It supports aggregation.
* It works well with Node.js.
* Mongoose provides structured schemas and validation.
* It supports horizontal scaling when required.

## Why Mongoose?

Mongoose provides:

* Schema definitions
* Validation
* Middleware
* Model abstraction
* Query helpers
* TypeScript integration
* Relationship references

This provides additional structure over directly interacting with MongoDB.

## Data Modeling Strategy

SyncForge will primarily use references between collections.

Major collections include:

```text
users
workspaces
workspace_members
projects
project_members
tasks
task_comments
task_attachments
notifications
activity_logs
```

Membership collections will represent many-to-many relationships.

## Alternatives Considered

### PostgreSQL

PostgreSQL was considered because it provides strong relational modeling and transaction capabilities.

It was not selected for V1 because the project is designed around a MongoDB/Mongoose backend and the current domain does not require complex relational transactions.

### Firebase Firestore

Firestore was considered but rejected because SyncForge requires a traditional custom REST backend with explicit middleware, controllers, services, authorization, and database access layers.

## Consequences

### Positive

* Flexible document model
* Strong Node.js integration
* Easy schema evolution
* Powerful indexing and querying
* Mongoose validation and models

### Negative

* Developers must carefully design relationships.
* Poorly designed queries can cause performance problems.
* MongoDB's flexibility can become a problem without disciplined schemas.

## Decision Summary

MongoDB with Mongoose is the selected database solution for SyncForge V1.

---

**End of ADR-002**
