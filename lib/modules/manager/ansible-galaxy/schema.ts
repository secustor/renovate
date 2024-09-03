import z from 'zod';
import {LooseArray} from "../../../util/schema-utils";

export const AnsibleGalaxy = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  dependencies: z.record(z.string(), z.string()),
});

// collections file
export const Role = z.object({
  name: z.string(),
  version: z.string()
})

export const Collection = z.object({
  name: z.string(),
  version: z.string().optional(),
  source: z.string().optional(),
  type: z.string().optional()
})
export type Collection = z.infer<typeof Collection>

export const CollectionsFile = z.object({
  roles: LooseArray(Role).optional(),
  collections: LooseArray(Collection).optional()
})
