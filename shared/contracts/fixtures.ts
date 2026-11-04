/**
 * Seeded test data that the backend creates on start and on
 * `POST /api/test/reset`. `backend/src/__tests__/contracts.test.ts`
 * logs in with every user here, so a password change in
 * `backend/src/repositories/user.repository.ts` fails CI.
 */
export interface SeededUser {
  readonly username: string;
  readonly password: string;
}

export const SEEDED_USERS = {
  admin: { username: 'admin', password: 'password123' },
  testuser: { username: 'testuser', password: 'buggybooks' },
} as const satisfies Record<string, SeededUser>;

/** IDs of books in `backend/db.json` that tests may rely on. */
export const SEEDED_BOOK_IDS = ['1', '2', '3'] as const;
