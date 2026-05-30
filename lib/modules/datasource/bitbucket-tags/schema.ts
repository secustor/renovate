import { z } from 'zod/v4';
import { PagedResult } from '../../platform/bitbucket/schema.ts';

export const BitbucketTag = z.object({
  name: z.string(),
  target: z
    .object({
      date: z.string().optional(),
      hash: z.string().optional(),
    })
    .optional(),
});
export type BitbucketTag = z.infer<typeof BitbucketTag>;

export const BitbucketCommit = z.object({
  hash: z.string(),
  date: z.string().optional(),
});
export type BitbucketCommit = z.infer<typeof BitbucketCommit>;

export const BitbucketTagsResult = PagedResult(BitbucketTag);
export const BitbucketCommitsResult = PagedResult(BitbucketCommit);
