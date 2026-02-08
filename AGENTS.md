# Teramisu Agents Guide

This file defines the operational protocols for AI agents working in the Teramisu repository.
Follow these guidelines strictly to ensure consistency and quality.

## 1. Environment & Commands

**Stack**: TypeScript, Bun, TurboRepo, Next.js (Web), Elysia (Server), Drizzle ORM, TailwindCSS.

| Action | Command | Scope |
|--------|---------|-------|
| **Install** | `bun install` | Root |
| **Dev** | `bun run dev` | All apps |
| **Dev (Web)** | `bun run dev:web` | Next.js only |
| **Dev (Server)**| `bun run dev:server` | Elysia only |
| **Build** | `bun run build` | All apps |
| **Type Check** | `bun run check-types` | All apps |
| **DB Push** | `bun run db:push` | Push schema to DB |
| **DB Studio** | `bun run db:studio` | Open DB GUI |
| **Test (All)** | `bun test` | Run all tests (Bun runner) |
| **Test (Single)**| `bun test <path/to/file>` | Run specific test file |

**Note**: There are currently no active tests. Use `bun test` to run newly created tests.

## 2. Code Style Guidelines

### General
- **Language**: TypeScript (Strict mode). Avoid `any`.
- **Indentation**: 2 spaces.
- **Semicolons**: Always.
- **Quotes**: Double quotes `"` preferred.

### Naming Conventions
- **Files/Directories**: `kebab-case` (e.g., `user-management.tsx`, `api/auth`).
- **React Components**: `PascalCase` (e.g., `UserProfile`, `SubmitButton`).
- **Variables/Functions**: `camelCase` (e.g., `isValid`, `fetchUserData`).
- **Database Tables**: `snake_case` (e.g., `user_accounts`, `order_items`).
- **Constants**: `UPPER_SNAKE_CASE` for global constants.

### Import Patterns
- **Internal Aliases**: Use `@/` for app-level imports (e.g., `import { Button } from "@/components/ui/button"`).
- **Workspace Packages**: Use `@Teramisu/` scope (e.g., `import { db } from "@Teramisu/db"`).
- **External**: Group external imports at the top.
- **Relative**: Use relative `./` only for sibling files in the same feature folder.

### React (apps/web)
- **Structure**: Functional Components with Hooks.
- **UI Library**: shadcn/ui (Radix + Tailwind).
- **Styling**: Tailwind CSS classes. Avoid inline styles.
- **State**: `useState` for local, `zustand` for global (if needed).
- **Data Fetching**: Server Components for initial data, Client Components for interactivity.

### Backend (apps/server & packages/api)
- **Framework**: Elysia.js.
- **Validation**: TypeBox (`t.Object`, `t.String`) or Zod.
- **Error Handling**: 
  - Use `try/catch` blocks.
  - Return structured JSON errors: `{ error: string, code?: string }`.
  - Use HTTP status codes correctly (400, 401, 404, 500).

### Database (packages/db)
- **ORM**: Drizzle ORM.
- **Schema**: Defined in `packages/db/src/schema`.
- **Migrations**: Use `db:push` for development, `db:migrate` for production.

## 3. Testing Guidelines (Future)
- **Runner**: Bun Test.
- **File Naming**: `*.test.ts` (Unit), `*.spec.ts` (Integration).
- **Location**: Co-located with source (`math.ts` -> `math.test.ts`) or in `tests/` folder.

## 4. Documentation & Agent Rules
This project includes **BMAD** agent rules in `.cursor/rules/bmad/`.

- **Core Index**: `@bmad/index`
- **Agents**: `@bmad/{module}/agents/{name}`
- **Workflows**: `@bmad/{module}/workflows/{name}`

Refer to `.cursor/rules/bmad/index.mdc` for the full list of available agent capabilities.

## 5. Agent Behavior
- **Refactoring**: Verify changes with `bun run check-types` before committing.
- **Dependencies**: Prefer existing project dependencies (Zod, date-fns, etc.) over adding new ones.
- **Comments**: Explain "Why", not "What". Document complex logic.
- **Git**: Write conventional commit messages (e.g., `feat: add user login`, `fix: resolve auth error`).
