import { z } from 'zod/v4';
import {
  DeepNullish,
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
  action: z.literal('COMMENTED'),
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
    type: z.union([z.literal('REPOSITORY'), z.literal('PROJECT')]),
  }),
});
export const ReviewerGroups = z.array(ReviewerGroup);

// Application properties (e.g. version info)
export const ApplicationProperties = z.object({
  version: z.string(),
});
export type ApplicationProperties = z.infer<typeof ApplicationProperties>;

// Repository object
export const BbsRestRepo = DeepNullish(
  z.object({
    id: z.number(),
    slug: z.string(),
    project: z.object({ key: z.string() }),
    origin: z.object({ name: z.string(), slug: z.string() }).optional(),
    links: z.object({
      clone: z
        .array(z.object({ href: z.string(), name: z.string() }))
        .optional(),
    }),
  }),
);
export type BbsRestRepo = z.infer<typeof BbsRestRepo>;

// Paginated list of repos
export const BbsRestRepoList = LooseArray(BbsRestRepo);

// Branch object (nullable to handle empty 204 responses)
export const BbsRestBranch = z
  .object({
    displayId: z.string(),
  })
  .catch({ displayId: '' });
export type BbsRestBranch = z.infer<typeof BbsRestBranch>;

// PR merge settings
export const PrMergeSettings = DeepNullish(
  z.object({
    mergeConfig: z
      .object({
        defaultStrategy: z.object({ id: z.string() }).optional(),
      })
      .optional(),
  }),
);
export type PrMergeSettings = z.infer<typeof PrMergeSettings>;

// PR user ref
export const BbsRestUserRef = z.object({
  user: z.object({ name: z.string() }),
});
export type BbsRestUserRef = z.infer<typeof BbsRestUserRef>;

// PR branch ref
export const BbsRestBranchRef = z.object({
  displayId: z.string(),
  id: z.string(),
});
export type BbsRestBranchRef = z.infer<typeof BbsRestBranchRef>;

// PR state enum
export const BbsRestPrState = z.enum(['OPEN', 'DECLINED', 'MERGED']);
export type BbsRestPrState = z.infer<typeof BbsRestPrState>;

// Full PR object
export const BbsRestPr = DeepNullish(
  z.object({
    id: z.number(),
    version: z.number().optional(),
    title: z.string().optional(),
    description: z.string().optional().catch(undefined),
    state: BbsRestPrState.optional().catch(undefined),
    fromRef: BbsRestBranchRef.catch({ displayId: '', id: '' }),
    toRef: BbsRestBranchRef.catch({ displayId: '', id: '' }),
    reviewers: z.array(BbsRestUserRef).default([]).catch([]),
    createdDate: z.union([z.string(), z.number()]).optional(),
    updatedDate: z.number().optional(),
  }),
);
export type BbsRestPr = z.infer<typeof BbsRestPr>;

// Paginated list of PRs
export const BbsRestPrList = LooseArray(BbsRestPr);

// Commit status summary (build-status stats endpoint)
export const BitbucketCommitStatus = z.object({
  failed: z.number().catch(0),
  inProgress: z.number().catch(0),
  successful: z.number().catch(0),
});
export type BitbucketCommitStatus = z.infer<typeof BitbucketCommitStatus>;

// Individual build state enum
export const BitbucketBranchState = z.enum([
  'SUCCESSFUL',
  'FAILED',
  'INPROGRESS',
  'STOPPED',
]);
export type BitbucketBranchState = z.infer<typeof BitbucketBranchState>;

// Individual build status
export const BitbucketStatus = z.object({
  key: z.string(),
  state: BitbucketBranchState,
});
export type BitbucketStatus = z.infer<typeof BitbucketStatus>;

// Paginated list of build statuses
export const BitbucketStatusList = LooseArray(BitbucketStatus);

// PR activities (paginated)
export const PullRequestActivityList = LooseArray(PullRequestActivity);

// Comment version response
export const CommentVersion = z.object({
  version: z.number(),
});
export type CommentVersion = z.infer<typeof CommentVersion>;

// Version-only write response (merge / reopen / decline)
export const PrVersion = z.object({ version: z.number() });
export type PrVersion = z.infer<typeof PrVersion>;

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
export const FileData = z.object({
  isLastPage: z.boolean(),
  lines: z.array(z.object({ text: z.string() })),
  size: z.number().optional().nullable(),
});
export type FileData = z.infer<typeof FileData>;
