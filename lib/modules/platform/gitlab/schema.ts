import { z } from 'zod/v4';
import type { LongCommitSha } from '../../../util/git/types.ts';
import { LooseArray } from '../../../util/schema-utils/index.ts';

export const LastPipelineId = z
  .object({
    last_pipeline: z.object({
      id: z.number(),
    }),
  })
  .transform(({ last_pipeline }) => last_pipeline.id);

export const GitlabUserSchema = z.object({
  id: z.number().optional().default(0),
  username: z.string().optional().default(''),
});
export type GitLabUser = z.infer<typeof GitlabUserSchema>;

const LongCommitShaSchema = z.string().transform((val) => val as LongCommitSha);

export const GitLabMergeRequestSchema = z.object({
  iid: z.number().optional().default(0),
  title: z.string().optional().default(''),
  description: z.string().nullable().optional(),
  state: z.string().optional().default(''),
  source_branch: z.string().optional().default(''),
  target_branch: z.string().optional().default(''),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  diverged_commits_count: z.number().optional(),
  merge_status: z.string().optional(),
  assignee: GitlabUserSchema.nullish(),
  assignees: LooseArray(GitlabUserSchema).catch([]),
  reviewers: LooseArray(GitlabUserSchema).catch([]),
  labels: z.array(z.string()).optional(),
  sha: LongCommitShaSchema.nullish(),
  head_pipeline: z
    .object({
      status: z.string(),
      sha: LongCommitShaSchema,
    })
    .nullish(),
});

export const GitLabMergeRequestsSchema = z.array(GitLabMergeRequestSchema);
export type GitLabMergeRequest = z.infer<typeof GitLabMergeRequestSchema>;

// See https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/graphql/types/user_status_type.rb
export const GitlabUserStatusSchema = z.object({
  message: z.string().optional(),
  message_html: z.string().optional(),
  emoji: z.string().optional(),
  availability: z.enum(['not_set', 'busy']),
});
export type GitlabUserStatus = z.infer<typeof GitlabUserStatusSchema>;

export const RepoResponseSchema = z.object({
  id: z.number().optional(),
  archived: z.boolean().optional(),
  mirror: z.boolean().optional(),
  default_branch: z.string().nullable().optional(),
  empty_repo: z.boolean().optional(),
  ssh_url_to_repo: z.string().nullable().optional(),
  http_url_to_repo: z.string().nullable().optional(),
  forked_from_project: z.boolean().optional(),
  repository_access_level: z.string().optional(),
  merge_requests_access_level: z.string().optional(),
  merge_method: z.string().optional(),
  merge_trains_enabled: z.boolean().optional(),
  path_with_namespace: z.string().optional(),
  squash_option: z.string().optional(),
});
export type RepoResponse = z.infer<typeof RepoResponseSchema>;

export const GitlabCommentSchema = z.object({
  body: z.string().optional().default(''),
  id: z.number(),
});
export type GitlabComment = z.infer<typeof GitlabCommentSchema>;

export const GitlabCommentsSchema = z.array(GitlabCommentSchema);

export const GitlabIssueSchema = z.object({
  iid: z.number(),
  labels: z.array(z.string()).optional(),
  title: z.string().optional().default(''),
});
export type GitlabIssue = z.infer<typeof GitlabIssueSchema>;

export const GitlabIssuesSchema = z.array(GitlabIssueSchema);

export const GitlabBranchStatusSchema = z.object({
  status: z.string().optional().default(''),
  name: z.string().optional().default(''),
  allow_failure: z.boolean().optional(),
});
export type GitlabBranchStatus = z.infer<typeof GitlabBranchStatusSchema>;

export const GitlabBranchStatusesSchema = z.array(GitlabBranchStatusSchema);

export const GitlabApprovalRuleSchema = z.object({
  name: z.string().optional().default(''),
  rule_type: z.string().optional().default(''),
  id: z.number(),
});
export type GitlabApprovalRule = z.infer<typeof GitlabApprovalRuleSchema>;

export const GitlabApprovalRulesSchema = z.array(GitlabApprovalRuleSchema);

export const GitlabMergeRequestStatusSchema = z
  .object({
    merge_status: z.string().optional(),
    detailed_merge_status: z.string().optional(),
    merge_when_pipeline_succeeds: z.boolean().optional(),
    pipeline: z
      .object({
        status: z.string(),
      })
      .nullable()
      .optional(),
  })
  .catch({});
export type GitlabMergeRequestStatus = z.infer<
  typeof GitlabMergeRequestStatusSchema
>;

export const GitlabUserInfoSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  id: z.number().optional(),
  commit_email: z.string().optional(),
});
export type GitlabUserInfo = z.infer<typeof GitlabUserInfoSchema>;

export const GitlabVersionSchema = z.object({
  version: z.string(),
});
export type GitlabVersion = z.infer<typeof GitlabVersionSchema>;

export const GitlabRawFileSchema = z.object({
  content: z.string(),
});
export type GitlabRawFile = z.infer<typeof GitlabRawFileSchema>;

export const GitlabIssueBodySchema = z.object({
  description: z.string(),
});
export type GitlabIssueBody = z.infer<typeof GitlabIssueBodySchema>;

export const GitlabTreeNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  path: z.string(),
});
export type GitlabTreeNode = z.infer<typeof GitlabTreeNodeSchema>;

export const GitlabTreeSchema = z.array(GitlabTreeNodeSchema);
