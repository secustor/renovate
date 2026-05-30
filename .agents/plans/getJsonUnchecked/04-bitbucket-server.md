# Group 04 — Bitbucket Server / Data Center (platform) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in Bitbucket Server files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (15 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/bitbucket-server/index.ts` | 137, 207, 230, 275, 281, 333, 366, 438, 495, 549, 854, 889, 1026, 1032 | `{ id; headers }`, `BbsRestRepo[]`, `FileData`, `BbsRestRepo`, `BbsRestBranch`, `{ isLastPage; values }`, `BbsRestPr`, `BbsRestPr[]`, `utils.BitbucketCommitStatus`, `utils.BitbucketStatus[]`, `PullRequestActivity[]`, `{ version }`, `{ id }`, `{ name }[]` |
| `lib/modules/platform/bitbucket-server/pr-cache.ts` | 172 | `{ isLastPage; values: ... }` |

## Notes

- Several anonymous inline types (`{ id: number }`, `{ name: string }[]`, `{ version: number }`,
  `{ isLastPage: boolean; values: T[] }`) need small Zod schemas.
- `BbsRestRepo`, `BbsRestBranch`, `BbsRestPr`, `PullRequestActivity`,
  `utils.BitbucketCommitStatus`, `utils.BitbucketStatus` should each get a Zod schema.
- The paged response wrapper (`isLastPage` + `values`) appears in multiple places — extract
  a reusable helper schema.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/bitbucket-server` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
