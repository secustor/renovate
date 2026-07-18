import { z } from 'zod/v4';

export const AzurePipelinesTaskVersion = z.object({
  major: z.number(),
  minor: z.number(),
  patch: z.number(),
});

export const AzurePipelinesTask = z.object({
  id: z.string(),
  name: z.string(),
  deprecated: z.boolean().optional(),
  releaseNotes: z.string().optional(),
  serverOwned: z.boolean().optional(),
  version: AzurePipelinesTaskVersion.nullable(),
  contributionIdentifier: z.string().optional(),
});

export const AzurePipelinesJSON = z.object({
  value: AzurePipelinesTask.array(),
});

export const AzurePipelinesFallbackTasks = z
  .record(z.string(), z.string().array())
  // zod's z.record() types every string key as present, but callers look
  // this up by an arbitrary packageName that may not be one of them.
  .transform((tasks) => tasks as Record<string, string[] | undefined>);
