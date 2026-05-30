# Group 02 — GitLab (platform + datasources) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` across GitLab-related files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (25 call sites)

| File | Lines | Response type |
|------|-------|---------------|
| `lib/modules/platform/gitlab/index.ts` | 136, 154, 218, 251, 283, 409, 522, 607, 917, 1074, 1107, 1152, 1327 | user, `{ version }`, `RepoResponse[]`, file content, `RepoResponse`, `GitlabBranchStatus[]`, protected-branch rules, MR notes, `GitLabMergeRequest[]`, approvals, `{ description }`, `{ description }`, `GitlabComment[]` |
| `lib/modules/platform/gitlab/http.ts` | 10, 27, 54 | `{ id }[]` (members), `GitLabUser[]`, `GitlabUserStatus` |
| `lib/modules/platform/gitlab/merge-request.ts` | 13 | `GitLabMergeRequest` |
| `lib/modules/datasource/gitlab-tags/index.ts` | 51, 104, 114 | `GitlabTag[]`, `GitlabCommit`, `GitlabCommit[]` |
| `lib/modules/datasource/gitlab-releases/index.ts` | 41 | `GitlabRelease[]` |
| `lib/modules/datasource/gitlab-packages/index.ts` | 72 | `GitlabPackage[]` |
| `lib/config/presets/gitlab/index.ts` | 18 | `GitlabProject` (default branch) |
| `lib/workers/repository/update/pr/changelog/gitlab/index.ts` | 28, 72 | `GitlabTreeNode[]`, `GitlabRelease[]` |

## Notes

- Existing interfaces `GitlabTag`, `GitlabRelease`, `GitLabMergeRequest`, `GitlabProject`,
  `GitLabUser` should each get a co-located Zod schema; derive the type via `z.infer`.
- `GitlabRelease` is used by both the datasource and the changelog worker — share one schema.
- Many calls pass `{ paginate: true }` — keep the options arg, schema goes last:
  `getJson(url, { paginate: true }, Schema)`.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest modules/platform/gitlab datasource/gitlab-tags datasource/gitlab-releases datasource/gitlab-packages config/presets/gitlab changelog/gitlab` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
