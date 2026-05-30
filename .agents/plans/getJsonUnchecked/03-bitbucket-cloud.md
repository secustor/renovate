# Group 03 — Bitbucket Cloud (platform + datasource) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` across Bitbucket Cloud files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (16 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/bitbucket/index.ts` | 111, 257, 360, 420, 453, 490, 605, 855, 966, 1059, 1198 | `Account`, `RepoBranchingModel`, `PagedResult<PrResponse>`, `PrResponse`, `BranchResponse`, `PagedResult<BitbucketStatus>`, `{ values: BbIssue[] }`, `{ values: Issue[] }`, `Account` (reviewer), `PagedResult<EffectiveReviewer>`, `PrResponse` |
| `lib/modules/platform/bitbucket/comments.ts` | 30 | `PagedResult<Comment>` |
| `lib/modules/platform/bitbucket/pr-cache.ts` | 152 | `PagedResult<PrResponse>` |
| `lib/modules/datasource/bitbucket-tags/index.ts` | 68, 113, 178 | `PagedResult<BitbucketTag>`, `BitbucketTag`, `PagedResult<BitbucketCommit>` |

## Notes

- `PagedResult<T>` is a generic wrapper — model it as `z.object({ values: Schema.array(), ... })`
  or a helper: `const PagedResult = <T extends z.ZodTypeAny>(item: T) => z.object({ values: item.array(), next: z.string().optional() })`.
- `Account`, `RepoBranchingModel`, `BitbucketTag`, `BitbucketCommit` etc. likely exist as
  TypeScript interfaces in the platform code; convert to Zod schemas.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/bitbucket datasource/bitbucket-tags` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
