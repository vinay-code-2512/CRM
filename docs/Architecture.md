# Architecture

# SyncForge

**Version:** 1.0

## 1. System Overview

SyncForge is built using a modern, structured backend architecture designed for clarity, maintainability, and security. The system processes requests through a clean, layered pipeline:

**Client/Frontend**

→ **REST API**

→ **Express Application**

→ **Middleware**

→ **Routes**

→ **Controllers**

→ **Services**

→ **Prisma Client / Data Access**

→ **PostgreSQL**

Each layer is strictly responsible for a single concern, ensuring the system remains easy to test, debug, and expand.

---

## 2. Architecture Style

The chosen architectural style is a **Modular Monolith**.

- **Why it fits SyncForge:** A modular monolith groups related functionality (e.g., Auth, Workspaces, Tasks) into logical domains within a single deployable unit. It provides the organizational benefits of microservices without the operational overhead.

- **Appropriate for project size:** It perfectly aligns with the current team structure (equivalent to ~1 year of industry experience) and the project's MVP requirements.

- **Ease of development:** Developers don't have to manage distributed transactions, inter-service communication failures, or complex deployment orchestration.

- **Future evolution:** As the product scales, well-defined internal modules can be cleanly extracted into independent services if—and only if—the scale strictly demands it. We do not design future microservices now.

---

## 3. Backend Folder Structure

The backend repository is organized logically by technical concern, keeping module boundaries clear.

```text

backend/

├── src/

│   ├── config/       # Environment, database, and third-party configurations

│   ├── controllers/  # HTTP request handlers (req, res manipulation)

│   ├── middleware/   # Express middleware (auth, validation, errors, security)

│   ├── models/       # Prisma models and database types

│   ├── routes/       # Express route definitions

│   ├── services/     # Core business logic and database coordination

│   ├── utils/        # Shared helper functions and constants

│   ├── types/        # TypeScript type definitions

│   ├── app.ts        # Express application setup

│   └── server.ts     # Server bootstrap and startup

├── tests/            # Unit, integration, and API tests

├── package.json      # Dependencies and scripts

├── tsconfig.json     # TypeScript configuration

├── .env              # Local environment variables (git-ignored)

├── .env.example      # Template for required environment variables

├── .gitignore        # Git ignore rules

├── eslint.config.js  # Linter configuration

└── prettier.config.js# Formatting configuration

```

---

## 4. Layer Responsibilities

To maintain a clean architecture, layers must not bleed responsibilities.

### Routes

- **Responsibility:** Only endpoint definitions and HTTP method mapping to controllers. No logic or variable extraction occurs here.

### Controllers

- **Responsibility:** Receive HTTP requests, extract parameters/body/query data, invoke the appropriate Service layer function, and return standardized HTTP responses.

- **Constraint:** Strictly **no business logic** or database queries inside controllers.

### Services

- **Responsibility:** Execute business logic, enforce authorization rules, coordinate operations across multiple database models, and throw standardized application-level errors if rules are violated.

### Models

- **Responsibility:** Define the Prisma schema and database types; Prisma Client provides type-safe database access and PostgreSQL enforces database-level constraints.

- **Constraint:** We do not introduce a complex abstract Repository pattern. Services interact directly with Prisma Client.

### Middleware

- **Responsibility:** Intercept requests to handle cross-cutting concerns:

  - **Authentication:** Verifying JWTs.

  - **Authorization:** Checking role/workspace permissions.

  - **Validation:** Validating incoming payloads against schemas.

  - **Security & Rate Limiting:** Protecting against abuse (e.g., Helmet, CORS).

  - **Error Handling:** Catching exceptions and formatting responses.

### Config

- **Responsibility:** Centralized loading and strict validation of environment variables, database connection setup, and overarching application configuration.

---

## 5. Request Lifecycle

A typical request flows strictly through the defined layers:

1. **Client:** Makes an HTTP request to the API.

2. **Route:** Matches the URL and HTTP method.

3. **Middleware:** Intercepts the request to parse the body, validate the schema, and ensure the user is authenticated/authorized.

4. **Controller:** Extracts validated data and passes it to the Service.

5. **Service:** Executes business rules, checking additional constraints if necessary.

6. **Model:** Translates the Service's request into a Prisma Client database operation.

7. **PostgreSQL:** Executes the query and returns data to the Model.

8. **Service:** Processes the raw database result into a clean format.

9. **Controller:** Formats the success response (or catches errors) and sends it.

10. **Response:** Reaches the Client.

---

## 6. Authentication Architecture

Authentication ensures secure access to the platform without over-engineering session management.

- **Technology:** JSON Web Tokens (JWT) and bcrypt.

- **Registration Flow:** User provides details; password is mathematically hashed via bcrypt before saving.

- **Login Flow:** User provides credentials; backend verifies bcrypt hash; a signed JWT is issued to the client.

- **Protected Routes:** Middleware verifies the JWT signature on incoming requests, attaching the verified user identity to the request object.

- **Email Verification & Password Reset:** Securely processes verification and password reset flows using tokens according to the approved product requirements.

*(Note: Advanced token blocklists/revocation mechanisms are excluded from the MVP scope to maintain simplicity).*

---

## 7. Authorization Architecture

Authorization ensures users can only access data they own or are permitted to see. The hierarchy is strictly enforced:

**Workspace → Workspace Membership → Workspace Role → Project Membership → Task Access**

- **Roles:** Workspace Owner, Admin, Member.

- **Strict Boundary:** A user must be explicitly added to a Workspace to access it. To access a Project (and its underlying Tasks and Comments), the user must be explicitly added as a member of that specific Project. Workspace Owners and Admins do **not** automatically inherit access to project tasks merely because of their workspace role; they must also be Project Members.

- **ID Protection:** A user **must not** be able to access a project or task simply by guessing or knowing its database ID. The Service/Middleware layers must verify the user's membership against the requested resource's hierarchy.

---

## 8. Data Access Strategy

Data access is handled by using Prisma Client directly within the Service layer.

- **Reasoning:** Implementing a strict Repository/DAO pattern on top of Prisma introduces unnecessary boilerplate for an MVP. Direct Prisma Client usage inside Services keeps the architecture simple, professional, type-safe, and highly readable.

---

## 9. API Architecture

The system exposes a standard REST API.

- **Versioning:** Endpoints are versioned (e.g., `/api/v1/...`).

- **Design:** Resource-oriented URLs using standard HTTP methods (GET, POST, PUT, PATCH, DELETE).

- **Format:** Strict JSON request and response payloads.

- **Features:** Standardized pagination, filtering, and search via query parameters.

- **Documentation:** Detailed endpoint specifications will reside in `docs/API-Specification.md`.

---

## 10. Error Handling

Error handling is completely centralized to ensure clients never receive inconsistent or dangerous responses.

- **Categories:** The system distinguishes between Application errors, Validation errors, Authentication errors, Authorization errors, Not Found errors, Database errors, and Unexpected server errors.

- **Security Rule:** The API must **never** expose stack traces, database internals, passwords, secrets, or sensitive environment values to the client.

- **Format:** All errors return a standardized JSON structure with a safe, human-readable message and correct HTTP status code.

---

## 11. Security Architecture

The application employs standard, robust security measures:

- bcrypt for password hashing.

- JWT for stateless authentication.

- Strict input validation helps prevent malformed and unsafe input. Database queries must also be constructed safely and rely on Prisma's parameterized/type-safe query APIs and PostgreSQL constraints.

- Helmet.js to set secure HTTP headers.

- CORS configured strictly for allowed frontend domains.

- Rate limiting to protect authentication and public endpoints from brute force.

- Centralized, safe error responses.

---

## 12. Validation Strategy

Validation is strictly separated into three distinct boundaries:

1. **Request Validation:** Middleware (e.g., using Zod or Joi) strictly validates the shape, types, and presence of HTTP body/query data before it reaches the controller.

2. **Business Validation:** Services validate state (e.g., "Is this task already completed?", "Does this user have Admin rights?").

3. **Database Validation:** PostgreSQL constraints and the Prisma schema provide database-level integrity for types, enums, required fields, uniqueness, and relationships.

---

## 13. Database Architecture

At a high level, the application interacts with a relational SQL database.

**Application → Prisma Client (ORM) → PostgreSQL**

Detailed schema designs, relationships, and indexing strategies are documented separately in `docs/Database-Design.md`.

---

## 14. Testing Architecture

Testing is a continuous requirement, not a final-phase activity.

- **Unit Tests:** For isolated business logic and utilities.

- **Integration/API Tests:** For complete endpoint flows (Route -> Controller -> Service -> DB).

- **Auth/Security Tests:** Specifically targeting boundary enforcement and token validation.

---

## 15. Logging & Monitoring

A simple, professional observability approach is utilized:

- **HTTP Logging:** Standard request/response logging (e.g., Morgan).

- **Application Logging:** Dedicated logger (e.g., Winston/Pino) for capturing application errors and important operational events.

- *(Note: Complex distributed tracing, ELK stacks, or Prometheus/Grafana are intentionally excluded from the MVP).*

---

## 16. Environment Configuration

The system strictly enforces environment separation:

- **Environments:** Development, Test, Production.

- **Local Config:** Driven by `.env` files.

- **Security:** Secrets are **never** committed to version control. A `.env.example` file is maintained to document required variables safely.

---

## 17. Frontend Integration Strategy

Frontend development is intentionally delayed to prevent integration thrashing.

**Sequence:**

Backend Foundation → Authentication → Workspace → Projects → Tasks

**→ (Approx. 50–60% Core Backend Stability)**

→ Frontend Development Begins

→ Frontend + Backend Development continues in parallel.

This ensures the frontend builds against stable, tested, and documented APIs.

---

## 18. Scalability & Future Evolution

While built as a monolith, the architecture is designed to scale gracefully in the future:

- **Data:** Implementing targeted PostgreSQL indexing.

- **Compute:** Horizontally scaling the Express application across multiple instances.

- **Performance:** Introducing caching (e.g., Redis) for heavy read operations.

- **Asynchronous Work:** Offloading heavy tasks to background workers.

- **Extraction:** Services are decoupled enough that they can be extracted into true microservices only if organizational scale absolutely requires it.

---

## 19. Architecture Decisions

| Decision | Choice | Reason |

| :--- | :--- | :--- |

| **Architecture Style** | Modular Monolith | Balances simplicity and maintainability without distributed system overhead. |

| **Backend Language** | TypeScript (Node.js) | Type safety, excellent ecosystem, and unified language stack with frontend. |

| **API Style** | REST | Industry standard, easily consumable, highly cacheable. |

| **Database** | PostgreSQL | Relational integrity, foreign keys, transactions, and structured project-management data. |

| **ORM** | Prisma | Provides type-safe database access, schema management, migrations, and PostgreSQL integration. |

| **Authentication** | JWT + bcrypt | Stateless, scalable, and standard for modern single-page applications. |

| **Validation** | Middleware Schemas | Rejects bad data early, keeping controllers and services clean. |

| **Error Handling** | Centralized Middleware | Ensures consistent, safe API responses and prevents secret leakage. |

| **Testing Approach**| Continuous API/Unit Tests | Ensures features are stable as they are built, rather than bolting tests on at the end. |

---

## 20. Architecture Constraints

To maintain a clean, maintainable, production-style modular monolith appropriate for approximately 1 year of professional development experience, this project **explicitly and intentionally avoids**:

- Microservices

- Kafka / RabbitMQ (Message Brokers)

- Kubernetes (Complex Orchestration)

- Redis / Distributed Caching

- CQRS (Command Query Responsibility Segregation)

- Event Sourcing

- Complex Domain-Driven Design (DDD)

- Over-engineered Repository/DAO abstraction patterns

---

**End of Architecture Document**