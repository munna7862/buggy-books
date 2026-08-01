---
description: "Schema and path mapping conventions for JSON test data files"
applyTo: "playwright-e2e/src/test-data/**/*.json"
---
# Test Data rules

These apply on top of the global conventions in `.github/copilot-instructions.md`.

## Path mirroring
- Test data JSON files MUST live under `src/test-data/` following the exact relative directory and file structure of the corresponding spec file under `src/tests/`:
  - `src/tests/ui/Checkout/Test_001_CompleteBookPurchase.spec.ts` → `src/test-data/ui/Checkout/Test_001_CompleteBookPurchase.json`
  - `src/tests/api/BookCatalog/Test_001_BooksApi.spec.ts` → `src/test-data/api/BookCatalog/Test_001_BooksApi.json`

## Schema & contents
- Organize test data with scenario-based object keys.
- Store both input test data and expected values/messages inside the JSON file.
- Optionally include a `_schema` block documenting required properties and expected types.
- **Secrets:** NEVER store passwords, tokens, or API keys in test data files — read credentials dynamically via `getLoginCredentials()` or `getRequiredEnv()` from `src/config/env.config`.
