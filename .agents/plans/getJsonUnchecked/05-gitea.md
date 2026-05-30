# Group 05 — Gitea (platform) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in Gitea platform files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (16 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/gitea/gitea-helper.ts` | 51, 57, 70, 89, 102, 116, 184, 196, 282, 296, 305, 315, 377, 436, 459 | `User`, `{ version }`, `RepoSearchResults`, `Repo[]`, `Repo`, `RepoContents`, `PR`, `PR`, `Issue[]`, `Issue`, `Label[]`, `Label[]`, `Comment[]`, `CommitStatus[]`, `Branch` |
| `lib/modules/platform/gitea/pr-cache.ts` | 162 | `(PR \| null)[]` |

## Notes

- All types are already defined as interfaces in `lib/modules/platform/gitea/gitea-helper.ts`
  or nearby — convert to Zod schemas.
- Forgejo (group 06) has the same API shape; coordinate if Gitea and Forgejo share type
  definition files. If types are shared, put Zod schemas in a shared location (e.g. a common
  `schema.ts`) and import from both.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/gitea` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
