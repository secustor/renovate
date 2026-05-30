# Group 01 — GitHub (platform + datasources) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` across GitHub-related files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (22 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/github/index.ts` | 285, 293, 398, 424, 906, 975, 1124, 1183, 1248, 1709 | installations, user repos, repo contents, search repos, single PR, PR list, `CombinedBranchStatus`, branch status, `GhBranchStatus[]`, `Comment[]` |
| `lib/modules/platform/github/pr.ts` | 114 | `GhRestPr[]` |
| `lib/modules/platform/github/user.ts` | 40, 68 | user info, `{ email }[]` |
| `lib/modules/datasource/github-tags/index.ts` | 50 | `{ sha: string }[]` |
| `lib/modules/datasource/github-release-attachments/index.ts` | 240, 252 | `GithubRestRelease` |
| `lib/config/presets/github/index.ts` | 29 | repo contents (`{ content: string }`) |
| `lib/workers/repository/update/pr/changelog/github/index.ts` | 35, 41, 83 | `{ default_branch }`, `GithubGitTree`, `GithubGitBlob` |
| `lib/modules/datasource/hermit/index.ts` | 132 | `GithubRestRelease` (via `githubHttp`) |
| `lib/modules/datasource/pod/index.ts` | 128 | generic `T` (CocoaPods specs via `githubHttp`) |

## Notes

- Check `lib/modules/platform/github/` for existing schemas before creating new ones
  (`GhRestRepo`, `GhRestPr`, etc. may already exist as interfaces or schemas).
- `pod/index.ts:128` uses a generic `T` — inspect callers to pin a concrete schema, or accept
  a `schema` parameter on the helper.
- The changelog file has siblings (`gitea`/`forgejo`/`bitbucket`) already migrated — copy their style.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/github datasource/github-tags datasource/github-release-attachments datasource/hermit datasource/pod config/presets/github changelog/github` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
