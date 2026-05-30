# Group 09 — Terraform (datasource) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in the Terraform provider datasource.
See `README.md` for the shared migration pattern and verification steps.

## Scope (5 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/terraform-provider/index.ts` | 183 | `TerraformProviderVersions` (backend URL) |
| `lib/modules/datasource/terraform-provider/index.ts` | 205 | `TerraformProviderReleaseBackend` (backend URL) |
| `lib/modules/datasource/terraform-provider/index.ts` | 273 | `TerraformRegistryVersions` (registry URL) |
| `lib/modules/datasource/terraform-provider/index.ts` | 301 | `TerraformRegistryBuildResponse` (registry URL) |
| `lib/modules/datasource/terraform-provider/index.ts` | 382 | `VersionDetailResponse` |

## Notes

- All five types are already defined as TypeScript interfaces in the same directory — convert
  each to a Zod schema.
- The sibling `terraform-module` datasource is already fully migrated to `getJson`
  (`lib/modules/datasource/terraform-module/index.ts:112,136,172,204`) — use it as a style reference.
- Put schemas in `lib/modules/datasource/terraform-provider/schema.ts` (or extend an existing
  schema file if one already exists).

## Done when

- No `getJsonUnchecked` remains in the file above.
- `pnpm vitest datasource/terraform-provider` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
