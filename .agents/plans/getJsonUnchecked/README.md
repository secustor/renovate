# Migrate `getJsonUnchecked` → validated `getJson`

## Why

`http.getJsonUnchecked()` fetches JSON **without** runtime validation. Its own JSDoc says
*"The usage of this method is discouraged, please use `getJson` instead"*
(`lib/util/http/http.ts:510-525`). `getJson(url, schema)` / `getJson(url, opts, schema)`
validates the response against a Zod schema and infers the response type from it
(`lib/util/http/http.ts:534-550`), giving runtime safety and a single source of truth for
the response shape.

There are **149 production call sites** across **47 files**. They are grouped by the
API/service they target so each group can be implemented independently and shipped as its
**own PR** — keeping each PR small, reviewable, and owned by people familiar with that
integration. Each `NN-*.md` file in this directory is one group = one PR.

## Migration pattern (applies to every group)

For each call site:

1. **Find or define a Zod schema** for the response type:
   - Co-locate schemas in a `schema.ts` next to the module
     (pattern: `lib/modules/datasource/python-version/schema.ts`).
   - Import zod via `import { z } from 'zod/v3';`.
   - Reuse helpers from `lib/util/schema-utils/` — `LooseArray`, `LooseRecord`, `Json`,
     `MaybeTimestamp`, etc. — instead of hand-rolling.
   - Many response types already exist as **TypeScript interfaces**
     (e.g. `GitlabTag`, `BbsRestPr`, `TerraformProviderVersions`). Convert each to a Zod
     schema and derive the type with `z.infer` so the interface and schema can't drift.
2. **Replace the call:**
   - `await http.getJsonUnchecked<T>(url)` → `await http.getJson(url, Schema)`
   - `await http.getJsonUnchecked<T>(url, opts)` → `await http.getJson(url, opts, Schema)`
   - The returned `.body` is now `z.infer<typeof Schema>`; drop the explicit `<T>` generic.
3. **Keep schemas lenient.** Zod objects are non-strict by default (extra fields pass).
   Only validate the fields Renovate actually reads; use `.nullable()` / `.optional()`
   generously. Prefer `LooseArray` where one malformed element should be skipped rather than
   failing the whole response. The goal is validation that never rejects a response the old
   code would have accepted.

### Reference examples already in the repo (copy these)

- `lib/modules/datasource/python-version/index.ts:73` + `python-version/schema.ts` —
  schema file + `getJson(url, Schema)`.
- `lib/modules/datasource/terraform-module/index.ts:112,136,172,204` — sibling of the
  terraform-provider group.
- `lib/workers/repository/update/pr/changelog/{gitea,forgejo,bitbucket}/index.ts` — already
  use `getJson`; the github/gitlab changelog siblings still use `getJsonUnchecked` and are
  part of this migration.

## Out of scope

- The `getJsonUnchecked` definition itself stays (`lib/util/http/http.ts`) — still valid for
  genuinely dynamic / user-defined responses (e.g. the custom datasource).
- No behavior changes beyond adding validation.

## Verification (per PR)

- `pnpm vitest <changed module path>` — run the co-located specs; extend fixtures so new
  schemas are exercised on real-shaped payloads.
- `pnpm type-check` — confirm `z.infer` types line up with downstream usage (most breakage
  surfaces here).
- `pnpm lint` — formatting + import ordering.
- Maintain **100% coverage** (repo requirement). Add cases for schema-rejection paths where
  they introduce new branches; use `/* v8 ignore */` only where a test would prove nothing.
- Groups are independent — no cross-PR ordering dependency. Two shared-schema cases
  (npm in group 11, Gitea/Forgejo across groups 05/06) should keep the schema in one place
  and import it.

## Group index

| # | Group | Sites | Key paths |
|---|-------|-------|-----------|
| 01 | GitHub | 22 | `platform/github/*`, `datasource/{github-tags,github-release-attachments,hermit,pod}` |
| 02 | GitLab | 25 | `platform/gitlab/*`, `datasource/{gitlab-tags,gitlab-releases,gitlab-packages}` |
| 03 | Bitbucket Cloud | 16 | `platform/bitbucket/*`, `datasource/bitbucket-tags` |
| 04 | Bitbucket Server | 15 | `platform/bitbucket-server/*` |
| 05 | Gitea | 16 | `platform/gitea/*` |
| 06 | Forgejo | 17 | `platform/forgejo/*` |
| 07 | Gerrit | 7 | `platform/gerrit/client.ts` |
| 08 | Docker | 4 | `datasource/docker/*` |
| 09 | Terraform | 5 | `datasource/terraform-provider` |
| 10 | NuGet | 3 | `datasource/nuget/v3.ts` |
| 11 | npm / Node / PyPI / Go | 7 | `datasource/{npm,node-version,pypi,go}`, `presets/npm` |
| 12 | Java / Gradle / Dart / Flutter | 5 | `datasource/{java-version,gradle-version,dart,dart-version,flutter-version}` |
| 13 | Misc + merge-confidence | 8 | `datasource/{crate,conan,puppet-forge,conda,repology,jenkins-plugins,custom}`, `util/merge-confidence` |
