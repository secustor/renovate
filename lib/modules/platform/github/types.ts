import type { LongCommitSha } from '../../../util/schema-utils/git.ts';
import type { EmailAddress } from '../../../util/schema-utils/index.ts';
import type { Pr, PrBodyStruct } from '../types.ts';

// https://developer.github.com/v3/repos/statuses
// https://developer.github.com/v3/checks/runs/
export type CombinedBranchState = 'failure' | 'pending' | 'success';
export type BranchState = 'failure' | 'pending' | 'success' | 'error';

type VulnerabilityKey = string;
type VulnerabilityRangeKey = string;
type VulnerabilityPatch = string;
export type AggregatedVulnerabilities = Record<
  VulnerabilityKey,
  Record<VulnerabilityRangeKey, VulnerabilityPatch | null>
>;

export interface GhBranchStatus {
  context: string;
  // Genuinely absent on some responses in practice (this is an unvalidated
  // `getJsonUnchecked` response type; see index.spec.ts's "returns yellow
  // if state not present in context object"), so keep optional.
  state?: BranchState;
}

export interface CombinedBranchStatus {
  state: CombinedBranchState;
  statuses: GhBranchStatus[];
}

export interface Comment {
  id: number;
  body: string;
}

export interface GhRestRepo {
  full_name: string;
  default_branch: string;
  ssh_url: string | null;
  owner: {
    login: string;
  };
  archived: boolean;
  topics: string[];
}

export interface GhRestPr {
  // Genuinely absent on some responses in practice (this is an
  // unvalidated `getJsonUnchecked` response type; see index.spec.ts's
  // "should perform automerge if GHE >=3.3.0" fixture, whose mocked
  // `POST .../pulls` response is just `{ number: 123 }`), so keep `head`
  // and its nested fields optional rather than asserting always present.
  head?: {
    ref: string;
    sha?: LongCommitSha;
    repo?: {
      full_name: string;
      pushed_at?: string;
    };
  };
  // Genuinely absent on some responses in practice (same unvalidated
  // response type as `head` above; see index.spec.ts's
  // "reattemptPlatformAutomerge" fixtures), so keep optional.
  base?: {
    repo: {
      pushed_at?: string;
    };
    ref: string;
  };
  mergeable_state: string;
  number: number;
  title: string;
  body?: string;
  bodyStruct?: PrBodyStruct;
  state: string;
  merged_at?: string;
  created_at: string;
  closed_at?: string;
  updated_at: string;
  user?: { login?: string };
  node_id: string;
  assignee?: { login?: string };
  assignees?: { login?: string }[];
  requested_reviewers?: { login?: string }[];
  labels?: { name: string }[];
  _links?: unknown;
}

export interface GhPr extends Pr {
  updated_at: string;
  node_id: string;
}

export interface UserDetails {
  username: string;
  name: string;
  id: number;
  email: EmailAddress | null;
}

export interface PlatformConfig {
  hostType: string;
  endpoint: string;
  isGhe?: boolean;
  isGheCloud?: boolean;
  gheVersion?: string | null;
  isGHApp?: boolean;
  existingRepos?: string[];
  userDetails?: UserDetails;
  userEmail?: EmailAddress | null;
}

export interface LocalRepoConfig {
  repositoryName: string;
  pushProtection: boolean;
  prReviewsRequired: boolean;
  // Honestly optional value type: a plain `Record<string, boolean>` claims
  // every branch name is present, but this cache starts empty and is
  // filled in incrementally per-branch by getBranchForceRebase().
  branchForceRebase?: Record<string, boolean | undefined>;
  parentRepo: string | null;
  forkOrg?: string;
  forkToken?: string;
  forkCreation?: boolean;
  prList: GhPr[] | null;
  // Genuinely unset when none of squash/merge/rebase is allowed on the repo
  // (e.g. missing admin read access; see initRepo's "Could not find allowed
  // merge methods for repo" case and the "should perform automerge if GHE
  // >=3.3.0" spec), so keep optional rather than asserting always present.
  mergeMethod?: 'rebase' | 'squash' | 'merge';
  defaultBranch: string;
  repositoryOwner: string;
  repository: string | null;
  renovateUsername: string | undefined;
  renovateForkUser: string | undefined;
  productLinks: any;
  ignorePrAuthor: boolean;
  autoMergeAllowed: boolean;
  hasIssuesEnabled: boolean;
  hasVulnerabilityAlertsEnabled: boolean;
}

export interface GhRepo {
  id: string;
  sshUrl: string | null;
  isFork: boolean;
  parent?: {
    nameWithOwner: string;
  };
  isArchived: boolean;
  nameWithOwner: string;
  autoMergeAllowed: boolean;
  hasIssuesEnabled: boolean;
  hasVulnerabilityAlertsEnabled: boolean;
  mergeCommitAllowed: boolean;
  rebaseMergeAllowed: boolean;
  squashMergeAllowed: boolean;
  defaultBranchRef: {
    name: string;
    target: {
      oid: string;
    };
  };
  // Genuinely absent on some responses in practice (this is a
  // `requestGraphql` field cast, not zod-validated; the initRepo specs'
  // GraphQL fixtures routinely omit it), so keep optional.
  issues?: { nodes: unknown[] };
}

export interface GhAutomergeResponse {
  enablePullRequestAutoMerge: {
    pullRequest: { number: number };
  };
}

export interface ApiPageItem {
  number: number;
  updated_at: string;
}

/**
 * Mutable object designed to be used in the repository cache
 */
export interface ApiPageCache<T extends ApiPageItem = ApiPageItem> {
  items: Record<number, T>;
  lastModified?: string;
}
