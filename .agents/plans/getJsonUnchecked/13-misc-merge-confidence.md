# Group 13 — Misc datasources + merge-confidence → one PR

Replace all remaining `getJsonUnchecked` calls with Zod-validated `getJson` across the smaller
datasources and the merge-confidence utility.
See `README.md` for the shared migration pattern and verification steps.

## Scope (8 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/crate/index.ts` | 229 | `Response` (Cargo / crates.io) |
| `lib/modules/datasource/conan/index.ts` | 133 | *untyped* (Conan registry) |
| `lib/modules/datasource/puppet-forge/index.ts` | 32 | `PuppetModule` |
| `lib/modules/datasource/conda/index.ts` | 65 | *untyped* (Conda registry) |
| `lib/modules/datasource/repology/index.ts` | 59 | `RepologyPackage[]` |
| `lib/modules/datasource/jenkins-plugins/index.ts` | 136 | generic `T` |
| `lib/modules/datasource/custom/formats/json.ts` | 7 | *user-defined* (custom datasource) |
| `lib/util/merge-confidence/index.ts` | 196 | `{ confidence: MergeConfidence }` |

## Notes

- **`conan/index.ts:133` and `conda/index.ts:65`** are currently untyped (`getJsonUnchecked` with
  no type param). Inspect the actual API responses used downstream to derive a minimal Zod schema.
- **`jenkins-plugins/index.ts:136`** uses a generic `T` parameter — check all callers to determine
  if a concrete schema can be inlined, or if the helper should accept a `schema` parameter.
- **`custom/formats/json.ts:7`** — the response shape is user-defined. Use `z.unknown()` as the
  schema so it passes validation unconditionally. The call can technically remain as `getJsonUnchecked`
  since there is nothing to validate; use whichever approach is cleaner.
- `PuppetModule`, `RepologyPackage`, `MergeConfidence` are already defined — convert to Zod schemas.

## Done when

- No `getJsonUnchecked` remains in the files above (or `custom/formats/json.ts` uses `z.unknown()` via `getJson`).
- `pnpm vitest datasource/crate datasource/conan datasource/puppet-forge datasource/conda datasource/repology datasource/jenkins-plugins datasource/custom util/merge-confidence` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
