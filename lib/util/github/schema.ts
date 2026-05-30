import { z } from 'zod/v3';
import { LooseArray } from '../schema-utils/index.ts';

export const GithubRestAssetSchema = z.object({
  name: z.string(),
  url: z.string(),
  browser_download_url: z.string().optional(),
  size: z.number().optional(),
});
export type GithubRestAssetSchema = z.infer<typeof GithubRestAssetSchema>;

export const GithubRestReleaseSchema = z.object({
  id: z.number().optional(),
  tag_name: z.string().optional(),
  published_at: z.string().optional(),
  prerelease: z.boolean().optional(),
  draft: z.boolean().optional(),
  assets: LooseArray(GithubRestAssetSchema).catch([]),
  html_url: z.string().optional(),
  name: z.string().optional(),
  body: z.string().optional(),
});
export type GithubRestReleaseSchema = z.infer<typeof GithubRestReleaseSchema>;

// https://docs.github.com/en/rest/git/trees#get-a-tree
export const GithubGitTreeNodeSchema = z.object({
  path: z.string(),
  type: z.string().optional(),
  sha: z.string().optional(),
  url: z.string().optional(),
  size: z.number().optional(),
  mode: z.string().optional(),
});

export const GithubGitTreeSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: LooseArray(GithubGitTreeNodeSchema).catch([]),
  truncated: z.boolean(),
});
export type GithubGitTreeSchema = z.infer<typeof GithubGitTreeSchema>;

// https://docs.github.com/en/rest/git/blobs#get-a-blob
export const GithubGitBlobSchema = z.object({
  type: z.string().optional(),
  content: z.string(),
  encoding: z.string(),
  sha: z.string().optional(),
  url: z.string().optional(),
  size: z.number().optional(),
});
export type GithubGitBlobSchema = z.infer<typeof GithubGitBlobSchema>;

// For GitHub repo default_branch endpoint
export const GithubRepoDefaultBranchSchema = z.object({
  default_branch: z.string(),
});
export type GithubRepoDefaultBranchSchema = z.infer<
  typeof GithubRepoDefaultBranchSchema
>;
