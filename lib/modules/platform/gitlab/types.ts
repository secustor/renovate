import type { Pr } from '../types.ts';

export interface GitlabIssue {
  iid: number;

  labels?: string[];

  title: string;
}

export interface GitlabComment {
  body: string;
  id: number;
}

export interface GitLabUser {
  id: number;
  username: string;
}

export interface GitlabPr extends Pr {
  headPipelineStatus?: string;
  headPipelineSha?: string;
}

export interface UpdateMergeRequest {
  target_branch?: string;
  title?: string;
  assignee_id?: number;
  assignee_ids?: number[];
  reviewer_ids?: number[];
}

export type MergeMethod = 'merge' | 'rebase_merge' | 'ff';

export interface RepoResponse {
  id: number;
  archived: boolean;
  mirror: boolean;
  // Genuinely `null` for an empty repo (this is a plain, unvalidated
  // `getJsonUnchecked` response type, and GitLab really does this), so
  // keep this honestly nullable rather than asserting always a string.
  default_branch: string | null;
  empty_repo: boolean;
  ssh_url_to_repo: string | null;
  http_url_to_repo: string | null;
  forked_from_project: boolean;
  repository_access_level: 'disabled' | 'private' | 'enabled';
  merge_requests_access_level: 'disabled' | 'private' | 'enabled';
  // Genuinely absent in some responses in practice (same unvalidated
  // response type; see index.spec.ts's initRepo snapshot fixtures, which
  // omit it), so keep optional rather than asserting always present.
  merge_method?: MergeMethod;
  /**
   * only available with paid plans
   * https://docs.gitlab.com/ci/pipelines/merge_trains
   */
  merge_trains_enabled?: boolean;
  path_with_namespace: string;
  squash_option?: 'never' | 'always' | 'default_on' | 'default_off';
}

// See https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/graphql/types/user_status_type.rb
export interface GitlabUserStatus {
  message?: string;
  message_html?: string;
  emoji?: string;
  availability: 'not_set' | 'busy';
}

export interface GitlabPrCacheData {
  items: Record<number, GitlabPr>;
  updated_at: string | null;
  author: string | null;
}
