// Restores the backend's seeded state before each flow (AGENTS.md test isolation).
// Runs inside Maestro's JavaScript engine, which provides the `http` and `json` globals.
// BACKEND_URL and RESET_PATH are passed in as -e variables by scripts/run-maestro.ts.
const response = http.post(BACKEND_URL + RESET_PATH, {
  headers: { 'Content-Type': 'application/json', 'x-bypass-rate-limit': 'true' },
  body: '{}',
});
if (response.status !== 200) {
  throw new Error('Backend reset failed with HTTP ' + response.status + ': ' + response.body);
}
