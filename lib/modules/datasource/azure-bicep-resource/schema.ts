import { z } from 'zod/v4';

export const BicepResourceVersionIndex = z
  .object({
    resources: z.record(z.string(), z.unknown()),
  })
  .transform(({ resources }) => {
    const releaseMap = new Map<string, string[]>();

    for (const resourceReference of Object.keys(resources)) {
      const [type, version] = resourceReference.toLowerCase().split('@', 2);
      const versions = releaseMap.get(type) ?? [];
      versions.push(version);
      releaseMap.set(type, versions);
    }

    // `Object.fromEntries()` is typed as if every key seen while building the
    // map is present, but callers look this up by an arbitrary packageName
    // that may not be one of them.
    return Object.fromEntries(releaseMap) as Record<
      string,
      string[] | undefined
    >;
  });

export type BicepResourceVersionIndex = z.infer<
  typeof BicepResourceVersionIndex
>;
