# Group 08 — Docker (datasource) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in the Docker datasource.
See `README.md` for the shared migration pattern and verification steps.

## Scope (4 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/docker/common.ts` | 68 | untyped — registry API availability check (response body likely unused) |
| `lib/modules/datasource/docker/common.ts` | 201 | `{ token?: string; access_token?: string }` |
| `lib/modules/datasource/docker/index.ts` | 668 | `QuayRestDockerTags` |
| `lib/modules/datasource/docker/index.ts` | 718 | `{ tags: string[] }` |

## Notes

- `common.ts:68` — if the response body is never read (only HTTP status matters), use
  `z.unknown()` as the schema. Inspect the surrounding code to confirm before adding a
  more precise schema.
- `{ token?: string; access_token?: string }` is small enough for an inline schema; no
  need for a separate `schema.ts` entry unless the type is reused elsewhere.
- `QuayRestDockerTags` likely exists as an interface — convert to Zod.
- `{ tags: string[] }` → `z.object({ tags: z.array(z.string()) })`.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest datasource/docker` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
