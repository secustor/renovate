# Group 10 — NuGet (datasource) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in the NuGet v3 datasource.
See `README.md` for the shared migration pattern and verification steps.

## Scope (3 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/nuget/v3.ts` | 58 | `ServicesIndexRaw` (with `memCacheProvider`) |
| `lib/modules/datasource/nuget/v3.ts` | 141 | `CatalogPage` |
| `lib/modules/datasource/nuget/v3.ts` | 156 | `PackageRegistration` |

## Notes

- All three types are already defined as interfaces — convert to Zod schemas.
- Consider placing schemas in `lib/modules/datasource/nuget/schema.ts` (or an existing schema file in that directory).

## Done when

- No `getJsonUnchecked` remains in the file above.
- `pnpm vitest datasource/nuget` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
