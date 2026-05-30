# Group 06 — Forgejo (platform) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in Forgejo platform files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (17 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/forgejo/forgejo-helper.ts` | 53, 61, 79, 97, 116, 129, 143, 211, 223, 309, 323, 332, 342, 404, 463, 486 | `User`, `{ version }`, *untyped* (line 79), `RepoSearchResults`, `Repo[]`, `Repo`, `RepoContents`, `PR`, `PR`, `Issue[]`, `Issue`, `Label[]`, `Label[]`, `Comment[]`, `CommitStatus[]`, `Branch` |
| `lib/modules/platform/forgejo/pr-cache.ts` | 172 | `(PR \| null)[]` |

## Notes

- Forgejo is a fork of Gitea and shares the same API shape. Coordinate with group 05 — if
  types are shared between `gitea-helper.ts` and `forgejo-helper.ts`, define Zod schemas once
  and import them in both.
- **Line 79** calls `getJsonUnchecked` with no type parameter — inspect what the actual
  response is used for before adding a schema. The response body may be unused (e.g. only
  status code matters), in which case `z.unknown()` is appropriate.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/forgejo` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
