# Git Workflow
# SyncForge Git Workflow

**Version:** 1.0

## 1. Purpose

This document defines the Git workflow used by the SyncForge development team.

---

# 2. Main Branches

```text
main
develop
```

### main

Production-ready code.

### develop

Integration branch for completed development work before production release.

---

# 3. Feature Branches

New work should be developed in feature branches.

Format:

```text
feature/<ticket-id>-<short-description>
```

Examples:

```text
feature/SF-001-user-registration
feature/SF-022-create-task
feature/SF-026-task-status
```

---

# 4. Bug Fix Branches

Format:

```text
fix/<ticket-id>-<short-description>
```

Example:

```text
fix/SF-026-task-status-validation
```

---

# 5. Commit Convention

Use conventional commit style.

Examples:

```text
feat: add user registration
feat: implement task creation API
fix: validate task assignee
docs: update API specification
test: add authentication tests
refactor: simplify task service
chore: update dependencies
```

---

# 6. Pull Request Process

Before opening a PR:

```text
1. Pull latest changes
2. Create/update feature branch
3. Implement feature
4. Run tests
5. Run lint
6. Review changes
7. Commit changes
8. Push branch
9. Open Pull Request
```

---

# 7. Pull Request Requirements

A PR should contain:

* Clear title
* Related ticket ID
* Summary
* Implementation details
* Testing performed
* Screenshots where applicable
* Known limitations

---

# 8. Example PR

```text
Title:

feat(SF-022): implement task creation API
```

Description:

```text
Summary:
Implemented task creation endpoint.

Changes:
- Added task validation
- Added task service
- Added task controller
- Added task route
- Added unit tests

Testing:
- Unit tests passed
- Integration tests passed
```

---

# 9. Merge Rules

Do not directly push development work into `main`.

Changes should be merged through Pull Requests.

---

# 10. Branch Lifecycle

```text
main
  ↓
develop
  ↓
feature/SF-XXX-description
  ↓
Pull Request
  ↓
Code Review
  ↓
Tests
  ↓
develop
  ↓
Release
  ↓
main
```

---

# 11. Commit Quality

Avoid commits such as:

```text
update
changes
fix
test
done
```

Prefer meaningful commits:

```text
feat: add workspace member invitation
fix: prevent duplicate workspace membership
test: cover task authorization rules
```

---

**End of Git Workflow**
