import { z } from 'zod/v4';
import {
  EmailAddress,
  LooseArray,
} from '../../../util/schema-utils/index.ts';

export const User = z.object({
  name: z.string(),
  displayName: z.string(),
  emailAddress: EmailAddress.catch(''),
  active: z.boolean(),
});

export const Users = z.array(User);

export const Files = z.array(z.string());

export const Comment = z.object({
  text: z.string(),
  id: z.number(),
});

export type Comment = z.infer<typeof Comment>;

export const PullRequestMerge = z.object({
  autoMerge: z.boolean().optional(),
});

export type PullRequestMerge = z.infer<typeof PullRequestMerge>;

export const PullRequestCommentActivity = z.object({
  action: z.literal("COMMENTED"),
  commentAction: z.string(),
  comment: Comment,
});

export type PullRequestCommentActivity = z.infer<
  typeof PullRequestCommentActivity
>;

export const PullRequestActivity = z.union([
  PullRequestCommentActivity,
  z.object({ action: z.string() }),
]);

export type PullRequestActivity = z.infer<typeof PullRequestActivity>;

export const ReviewerGroup = z.object({
  name: z.string(),
  users: z.array(User),
  scope: z.object({
    type: z.union([z.literal("REPOSITORY"), z.literal("PROJECT")]),
  }),
});
export const ReviewerGroups = z.array(ReviewerGroup);

// Application properties (e.g. version info)
export const ApplicationProperties = z.object({
  version: z.string(),
});
export type ApplicationProperties = z.infer<typeof ApplicationProperties>;

// Repository object
export const BbsRestRepoSchema = z.object({
  id: z.number(),
  slug: z.string(),
  project: z.object({ key: z.string() }),
  origin: z
    .object({ name: z.string(), slug: z.string() })
    .optional()
    .nullable(),
  links: z.object({
    clone: z
      .array(z.object({ href: z.string(), name: z.string() }))
      .optional()
      .nullable(),
  }),
});
export type BbsRestRepoSchema = z.infer<typeof BbsRestRepoSchema>;

// Paginated list of repos
export const BbsRestRepoList = LooseArray(BbsRestRepoSchema);

// Branch object (nullable to handle empty 204 responses)
export const BbsRestBranchSchema = z
  .object({
    displayId: z.string(),
  })
  .catch({ displayId: '' });
export type BbsRestBranchSchema = z.infer<typeof BbsRestBranchSchema>;

// PR merge settings
export const PrMergeSettings = z.object({
  mergeConfig: z
    .object({
      defaultStrategy: z
        .object({
          id: z.string(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});
export type PrMergeSettings = z.infer<typeof PrMergeSettings>;

// PR user ref
const BbsRestUserRefSchema = z.object({
  user: z.object({ name: z.string() }),
});

// PR branch ref
const BbsRestBranchRefSchema = z.object({
  displayId: z.string(),
  id: z.string(),
});

// Full PR object
export const BbsRestPrSchema = z.object({
  id: z.number(),
  version: z.number().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable().catch(null),
  state: z
    .enum(["OPEN", "DECLINED", "MERGED"])
    .optional()
    .nullable()
    .catch(null),
  fromRef: BbsRestBranchRefSchema.catch({ displayId: "", id: "" }),
  toRef: BbsRestBranchRefSchema.catch({ displayId: "", id: "" }),
  reviewers: z.array(BbsRestUserRefSchema).default([]).catch([]),
  createdDate: z.union([z.string(), z.number()]).optional().nullable(),
  updatedDate: z.number().optional().nullable(),
});
export type BbsRestPrSchema = z.infer<typeof BbsRestPrSchema>;

// Paginated list of PRs
export const BbsRestPrList = LooseArray(BbsRestPrSchema);

// Commit status summary (build-status stats endpoint)
export const BitbucketCommitStatusSchema = z.object({
  failed: z.number().catch(0),
  inProgress: z.number().catch(0),
  successful: z.number().catch(0),
});
export type BitbucketCommitStatusSchema = z.infer<
  typeof BitbucketCommitStatusSchema
>;

// Individual build status
export const BitbucketStatusSchema = z.object({
  key: z.string(),
  state: z.enum(["SUCCESSFUL", "FAILED", "INPROGRESS", "STOPPED"]),
});
export type BitbucketStatusSchema = z.infer<typeof BitbucketStatusSchema>;

// Paginated list of build statuses
export const BitbucketStatusList = LooseArray(BitbucketStatusSchema);

// PR activities (paginated)
export const PullRequestActivityList = LooseArray(PullRequestActivity);

// Comment version response
export const CommentVersion = z.object({
  version: z.number(),
});
export type CommentVersion = z.infer<typeof CommentVersion>;

// Repo id response (minimal)
export const RepoId = z.object({
  id: z.number(),
});
export type RepoId = z.infer<typeof RepoId>;

// Default reviewer entry
export const DefaultReviewer = z.object({
  name: z.string(),
});
export const DefaultReviewerList = LooseArray(DefaultReviewer);

// PR cache sync response
export const PrPageResponse = z.object({
  nextPageStart: z.union([z.string(), z.number()]).optional().nullable(),
  values: BbsRestPrList,
});
export type PrPageResponse = z.infer<typeof PrPageResponse>;

// File data from browse API
export const FileDataSchema = z.object({
  isLastPage: z.boolean(),
  lines: z.array(z.object({ text: z.string() })),
  size: z.number().optional().nullable(),
});
export type FileDataSchema = z.infer<typeof FileDataSchema>;
