---
name: dev-coding-standards
description: Strict coding standards and best practices for BuggyBooks backend (Express) and frontend (React/Vite) development.
---

# Dev Coding Standards

When writing production or test code for BuggyBooks, the following standards must be applied to ensure type safety, clean architecture, and testability.

---

### 1. TypeScript & Strict Typing

- **Zero `any` Policy**: TypeScript operates with `strict: true`. The `any` type is strictly forbidden. Use `unknown` with explicit type narrowing or domain interfaces from `/shared/types/`.
- **Zod & Runtime Validation**: Validate external request payloads and query parameters using Zod schemas:
  ```typescript
  import { z } from 'zod';

  export const BookOrderSchema = z.object({
    bookId: z.string(),
    quantity: z.number().int().positive(),
  });
  export type BookOrder = z.infer<typeof BookOrderSchema>;
  ```

---

### 2. Express Backend Standards (`/backend`)

- **Layered Architecture**: Keep controllers lean. Abstract business logic into service/repository modules (`backend/src/repositories/`).
- **Structured Error Responses**: Always return consistent JSON error objects:
  ```json
  {
    "success": false,
    "error": "Book not found or out of stock",
    "statusCode": 404
  }
  ```
- **Winston Structured Logging**: Use the shared Winston logger instance (`src/core/logger` or `src/utils/logger.ts`) instead of raw `console.log`:
  ```typescript
  logger.info('Processing order request', { orderId, userId });
  logger.error('Failed to process payment', { error: err.message });
  ```

---

### 3. React Frontend Standards (`/frontend`)

- **React 19 & Vite**: Functional components with explicit TypeScript interfaces for props and states.
- **HSL Design Tokens**: Adhere to the established HSL color variables and styling conventions in `src/styles/_variables.css` and `src/styles/_base.css`.
- **Component Mocking with MSW**: Component tests using Vitest must intercept network requests using Mock Service Worker (`src/mocks/server.ts`) rather than hitting live endpoints.

---

### 4. Code Hygiene & Review Checklist

Before committing:
- Remove debug `console.log` statements and commented-out dead code.
- Ensure all imports are utilized and cleanly organized.
- Keep function parameters on a single line for consistent diff readability.
