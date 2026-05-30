# Group 07 — Gerrit (platform) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in the Gerrit platform client.
See `README.md` for the shared migration pattern and verification steps.

## Scope (7 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/gerrit/client.ts` | 47, 55, 65, 128, 162, 170, 193 | `string[]` (project list), `GerritProjectInfo`, `GerritBranchInfo`, `GerritChange[]`, `GerritChange`, `GerritMergeableInfo`, change messages (check exact shape) |

## Notes

- **XSSI protection:** Gerrit prepends `)]}'` to every JSON response. Confirm that
  `lib/util/http/gerrit.ts` (or wherever the Gerrit HTTP client lives) already strips this
  prefix *before* parsing — if it does, Zod schema validation will work transparently;
  if not, the stripping must happen first.
- `GerritChange`, `GerritProjectInfo`, `GerritBranchInfo`, `GerritMergeableInfo` should each
  get Zod schemas. The message type on line 193 may be an inline `{ message: string }[]` —
  check and add accordingly.

## Done when

- No `getJsonUnchecked` remains in the file above.
- `pnpm vitest modules/platform/gerrit` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
