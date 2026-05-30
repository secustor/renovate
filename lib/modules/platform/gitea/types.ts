import type { LongCommitSha } from '../../../util/git/types.ts';
import type { EmailAddress } from '../../../util/schema-utils/index.ts';
import type { Pr, RepoSortMethod, SortMethod } from '../types.ts';
import type {
  BranchSchema,
  CommentSchema,
  CommitStatusSchema,
  IssueSchema,
  LabelSchema,
  PRSchema,
  RepoContentsSchema,
  RepoSchema,
  UserSchema,
} from './schema.ts';

export interface PrReviewersParams {
  reviewers?: string[];
  team_reviewers?: string[];
}

export type PRState = 'open' | 'closed' | 'all';
export type IssueState = 'open' | 'closed' | 'all';
export type CommitStatusType =
  | 'pending'
  | 'success'
  | 'error'
  | 'failure'
  | 'warning'
  | 'unknown';
export type PRMergeMethod =
  | 'fast-forward-only'
  | 'merge'
  | 'rebase'
  | 'rebase-merge'
  | 'squash';

export interface GiteaLabel {
  id: number;
  name: string;
}

// PR with LongCommitSha branding preserved for compatibility
export type PR = Omit<PRSchema, 'head'> & {
  head?: {
    label: string;
    sha: LongCommitSha;
    repo?: Repo;
  };
};

export type Issue = IssueSchema;

// User with EmailAddress branding preserved for compatibility
export type User = Omit<UserSchema, 'email'> & { email: EmailAddress };

// Repo with proper PRMergeMethod and User owner types
export type Repo = Omit<RepoSchema, 'default_merge_style' | 'owner'> & {
  default_merge_style: PRMergeMethod;
  owner: User;
};

export interface RepoPermission {
  admin: boolean;
  pull: boolean;
  push: boolean;
}

export type Label = LabelSchema;
export type Branch = BranchSchema;
export type CommitStatus = CommitStatusSchema;
export type Comment = CommentSchema;

export interface RepoSearchResults {
  ok: boolean;
  data: Repo[];
}

export type RepoContents = RepoContentsSchema;

export interface Commit {
  id: string;
  author: CommitUser;
}

export interface CommitUser {
  name: string;
  email: EmailAddress;
  username: string;
}

export interface CombinedCommitStatus {
  worstStatus: CommitStatusType;
  statuses: CommitStatus[];
}

export interface RepoSearchParams {
  uid?: number;
  archived?: boolean;
  topic?: boolean;
  q?: string;

  /**
   * Repo sort type, defaults to `alpha`.
   */
  sort?: RepoSortMethod;

  /**
   * Repo sort order, defaults to `asc`
   */
  order?: SortMethod;
}

export type IssueCreateParams = Partial<IssueUpdateLabelsParams> &
  IssueUpdateParams;

export interface IssueUpdateParams {
  title?: string;
  body?: string;
  state?: IssueState;
  assignees?: string[];
}

export interface IssueUpdateLabelsParams {
  labels?: number[];
}

export interface IssueSearchParams {
  state?: IssueState;
}

export interface PRCreateParams extends PRUpdateParams {
  head?: string;
}

export interface PRUpdateParams {
  title?: string;
  body?: string;
  assignees?: string[];
  labels?: number[];
  state?: PRState;
  base?: string;
}

export interface PRMergeParams {
  Do: PRMergeMethod;
  merge_when_checks_succeed?: boolean;
  delete_branch_after_merge?: boolean;
}

export type CommentCreateParams = CommentUpdateParams;

export interface CommentUpdateParams {
  body: string;
}

export interface CommitStatusCreateParams {
  context?: string;
  description?: string;
  state?: CommitStatusType;
  target_url?: string;
}

export interface GiteaPrCacheData {
  items: Record<number, Pr>;
  updated_at: string | null;
  author: string | null;
}
