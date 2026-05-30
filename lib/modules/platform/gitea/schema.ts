import { z } from 'zod/v4';
import { LooseArray } from '../../../util/schema-utils/index.ts';

export const ContentsResponse = z.object({
  name: z.string(),
  path: z.string(),
  type: z.union([z.literal('file'), z.literal('dir')]),
  content: z.string().nullable(),
});

export type ContentsResponse = z.infer<typeof ContentsResponse>;

export const ContentsListResponse = z.array(ContentsResponse);

// ---- User ----
export const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  full_name: z.string().optional(),
  username: z.string(),
});
export type UserSchema = z.infer<typeof UserSchema>;

// ---- Repo permission ----
export const RepoPermissionSchema = z.object({
  admin: z.boolean().optional(),
  pull: z.boolean().optional(),
  push: z.boolean().optional(),
});

// ---- Repo ----
export const RepoSchema = z.object({
  id: z.number().optional(),
  allow_fast_forward_only_merge: z.boolean().optional(),
  allow_merge_commits: z.boolean().optional(),
  allow_rebase: z.boolean().optional(),
  allow_rebase_explicit: z.boolean().optional(),
  allow_squash_merge: z.boolean().optional(),
  archived: z.boolean().optional(),
  clone_url: z.string().optional(),
  default_merge_style: z.string().optional(),
  external_tracker: z.unknown().optional(),
  has_issues: z.boolean().optional(),
  has_pull_requests: z.boolean().optional(),
  ssh_url: z.string().optional(),
  default_branch: z.string().optional(),
  empty: z.boolean().optional(),
  fork: z.boolean().optional(),
  full_name: z.string(),
  mirror: z.boolean().optional(),
  owner: UserSchema.optional(),
  permissions: RepoPermissionSchema.optional(),
});
export type RepoSchema = z.infer<typeof RepoSchema>;

// ---- RepoSearchResults ----
export const RepoSearchResultsSchema = z.object({
  ok: z.boolean(),
  data: LooseArray(RepoSchema),
});
export type RepoSearchResultsSchema = z.infer<typeof RepoSearchResultsSchema>;

export const RepoArraySchema = LooseArray(RepoSchema);

// ---- RepoContents ----
export const RepoContentsSchema = z.object({
  path: z.string().optional(),
  content: z.any().optional(),
  contentString: z.string().optional(),
});
export type RepoContentsSchema = z.infer<typeof RepoContentsSchema>;

// ---- Label ----
export const LabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().default(''),
  color: z.string().optional().default(''),
});
export type LabelSchema = z.infer<typeof LabelSchema>;

export const LabelArraySchema = LooseArray(LabelSchema);

// ---- GiteaLabel (simplified label used in PR) ----
export const GiteaLabelSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// ---- PR ----
export const PRSchema = z.object({
  number: z.number(),
  state: z.union([z.literal('open'), z.literal('closed'), z.literal('all')]),
  title: z.string(),
  body: z.string(),
  mergeable: z.boolean(),
  merged: z.boolean().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable().optional(),
  diff_url: z.string().optional(),
  base: z
    .object({
      ref: z.string(),
    })
    .optional(),
  head: z
    .object({
      label: z.string(),
      sha: z.string(),
      repo: RepoSchema.optional(),
    })
    .optional(),
  assignee: z
    .object({
      login: z.string().optional(),
    })
    .optional(),
  assignees: z.array(z.any()).optional(),
  user: z.object({ username: z.string().optional() }).optional(),
  labels: LooseArray(GiteaLabelSchema).optional(),
});
export type PRSchema = z.infer<typeof PRSchema>;

// nullable PR used in pr-cache (API sometimes returns null items)
export const NullablePRSchema = PRSchema.nullable();
export const NullablePRArraySchema = LooseArray(NullablePRSchema);

// Used for single PR fetches where API may return null/empty/invalid body
export const FallbackPRSchema = PRSchema.nullable().catch(null);

// ---- Issue ----
export const IssueSchema = z.object({
  number: z.number(),
  state: z.union([z.literal('open'), z.literal('closed'), z.literal('all')]),
  title: z.string(),
  body: z.string(),
  assignees: LooseArray(UserSchema).catch([]),
  labels: LooseArray(LabelSchema).catch([]),
});
export type IssueSchema = z.infer<typeof IssueSchema>;

export const IssueArraySchema = LooseArray(IssueSchema);

// ---- Comment ----
export const CommentSchema = z.object({
  id: z.number(),
  body: z.string(),
});
export type CommentSchema = z.infer<typeof CommentSchema>;

export const CommentArraySchema = LooseArray(CommentSchema);

// ---- CommitUser ----
export const CommitUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  username: z.string(),
});

// ---- Commit ----
export const CommitSchema = z.object({
  id: z.string(),
  author: CommitUserSchema,
});

// ---- Branch ----
export const BranchSchema = z.object({
  name: z.string(),
  commit: CommitSchema,
});
export type BranchSchema = z.infer<typeof BranchSchema>;

// ---- CommitStatus ----
export const CommitStatusSchema = z.object({
  id: z.number(),
  // Accept any string for status to remain lenient (unknown values are handled at runtime)
  status: z.string(),
  context: z.string(),
  description: z.string().optional(),
  target_url: z.string().optional(),
  created_at: z.string(),
});
export type CommitStatusSchema = z.infer<typeof CommitStatusSchema>;

export const CommitStatusArraySchema = LooseArray(CommitStatusSchema);

// ---- Version ----
export const VersionSchema = z.object({
  version: z.string(),
});
