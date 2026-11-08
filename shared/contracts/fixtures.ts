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

/**
 * Books that tests may rely on. Book 9 is deliberately past the first catalog
 * page, so a flow can prove that "Load more" works.
 */
export const SEEDED_BOOKS = [
  { id: '1', title: 'The Great Buggy Gatsby' },
  { id: '2', title: 'To Kill a Mockingbird Exception' },
  { id: '3', title: '1984 Bugs' },
  { id: '9', title: 'War and Parse' },
] as const;

export const SEEDED_BOOK_IDS = SEEDED_BOOKS.map((book) => book.id);
