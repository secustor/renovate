import type { HTTPError, Response } from 'got';
import type { Pr } from '../types.ts';

export interface BbsConfig {
  bbUseDefaultReviewers: boolean;
  fileList: any[];
  mergeMethod: string;
  owner: string;
  projectKey: string;
  repository: string;
  repositorySlug: string;

  prVersions: Map<number, number>;
  ignorePrAuthor: boolean;
  username: string;
}

export interface BbsPr extends Pr {
  version?: number;
}

export interface BitbucketErrorResponse {
  errors?: {
    exceptionName?: string;
    reviewerErrors?: { context?: string }[];
  }[];
}

export interface BitbucketError extends HTTPError {
  readonly response: Response<BitbucketErrorResponse>;
}

export interface BbsPrCacheData {
  items: Record<number, BbsPr>;
  updatedDate: number | null;
  author: string | null;
}
