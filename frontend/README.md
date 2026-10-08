# SyncForge Frontend

> React-based frontend for the SyncForge project management platform.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first CSS |
| React Router | 7 | Client-side routing |
| Redux Toolkit | 2 | Global state management |
| TanStack React Query | 5 | Server state & data fetching |
| Axios | 1 | HTTP client |
| OxLint | 1 | Linting |

## Project Structure

```text
src/
├── App.tsx              # Root application component
├── main.tsx             # Entry point
├── index.css            # Global styles (Tailwind)
├── app/                 # App-level configuration
├── components/          # Shared/reusable components
├── features/            # Feature-based modules
│   ├── auth/            # Authentication
│   ├── projects/        # Project management
│   ├── tasks/           # Task management
│   └── workspaces/      # Workspace management
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── routes/              # Route definitions
├── store/               # Redux store configuration
└── types/               # TypeScript type definitions
```

## Getting Started

### Prerequisites

* Node.js (v20+)
* npm

### Setup

```bash
npm install
```

Create a `.env` file:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173` with hot module replacement.

### Build

```bash
npm run build
```

Compiles TypeScript and creates a production build in `dist/`.

### Lint

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Docker

The frontend includes a Dockerfile for containerized deployment. See the root `docker-compose.yaml` for orchestrated setup.

```bash
# From project root
docker-compose up frontend
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |

## Expanding the OxLint Configuration

For type-aware lint rules, install `oxlint-tsgolint` and update `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [OxLint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list.
