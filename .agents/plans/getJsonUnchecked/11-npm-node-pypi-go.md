# Group 11 — npm / Node.js / PyPI / Go (datasources + presets) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in npm, Node.js, PyPI, and Go datasource/preset files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (7 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/npm/get.ts` | 104 | `NpmResponse` |
| `lib/modules/datasource/node-version/index.ts` | 45 | `NodeRelease[]` |
| `lib/config/presets/npm/index.ts` | 36 | `NpmResponse` |
| `lib/modules/datasource/pypi/index.ts` | 131 | `PypiJSON` |
| `lib/modules/datasource/go/releases-goproxy.ts` | 184, 267 | `VersionInfo` (Go module proxy) |

## Notes

- `NpmResponse` is used in both `datasource/npm/get.ts` and `config/presets/npm/index.ts` — define
  the Zod schema **once** (in `datasource/npm/schema.ts`) and import it from both files.
- `NodeRelease` → `NodeRelease[]`: wrap the item schema in `.array()`.
- `PypiJSON` has many optional fields; use `.optional()` generously.
- `VersionInfo` in `go/releases-goproxy.ts` is used twice (lines 184 and 267) — one schema covers both.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest datasource/npm datasource/node-version datasource/pypi datasource/go config/presets/npm` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
