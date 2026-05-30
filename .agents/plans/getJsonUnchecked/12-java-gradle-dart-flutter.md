# Group 12 — Java / Gradle / Dart / Flutter (datasources) → one PR

Replace all `getJsonUnchecked` calls with Zod-validated `getJson` in Java, Gradle, Dart, and Flutter datasource files.
See `README.md` for the shared migration pattern and verification steps.

## Scope (5 call sites)

| File | Line | Response type |
|------|------|---------------|
| `lib/modules/datasource/java-version/index.ts` | 35 | `AdoptiumJavaResponse` |
| `lib/modules/datasource/gradle-version/index.ts` | 42 | `GradleRelease[]` |
| `lib/modules/datasource/dart/index.ts` | 43 | `DartResult` |
| `lib/modules/datasource/dart-version/index.ts` | 50 | `DartResponse` |
| `lib/modules/datasource/flutter-version/index.ts` | 47 | `FlutterResponse` |

## Notes

- All five types are already defined as TypeScript interfaces — convert to Zod schemas and
  place in a co-located `schema.ts` file for each datasource.
- These are small, focused datasources; changes should be straightforward.

## Done when

- No `getJsonUnchecked` remains in the files above.
- `pnpm vitest datasource/java-version datasource/gradle-version datasource/dart datasource/dart-version datasource/flutter-version` passes.
- `pnpm type-check && pnpm lint` clean, 100% coverage on changed lines.
