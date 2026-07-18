import type { MergeStrategy } from '../../../config/types.ts';
import type { BranchStatus } from '../../../types/index.ts';
import { getPrBodyStruct } from '../pr-body.ts';
import type { Pr } from '../types.ts';
import type {
  BitbucketBranchState,
  BitbucketMergeStrategy,
  MergeRequestBody,
  PrResponse,
} from './types.ts';

const bitbucketMergeStrategies = new Map<MergeStrategy, BitbucketMergeStrategy>(
  [
    ['squash', 'squash'],
    ['merge-commit', 'merge_commit'],
    ['fast-forward', 'fast_forward'],
  ],
);

export function mergeBodyTransformer(
  mergeStrategy: MergeStrategy | undefined,
): MergeRequestBody {
  const body: MergeRequestBody = {
    close_source_branch: true,
  };

  // The `auto` strategy will use the strategy configured inside Bitbucket.
  if (mergeStrategy && mergeStrategy !== 'auto') {
    body.merge_strategy = bitbucketMergeStrategies.get(mergeStrategy);
  }

  return body;
}

export const prStates = {
  open: ['OPEN'],
  notOpen: ['MERGED', 'DECLINED', 'SUPERSEDED'],
  merged: ['MERGED'],
  closed: ['DECLINED', 'SUPERSEDED'],
  all: ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'],
};

export const buildStates: Record<BranchStatus, BitbucketBranchState> = {
  green: 'SUCCESSFUL',
  red: 'FAILED',
  yellow: 'INPROGRESS',
};

export function prInfo(pr: PrResponse): Pr {
  return {
    number: pr.id,
    bodyStruct: getPrBodyStruct(pr.summary?.raw),
    // `Pr.sourceBranch`/`targetBranch` are contractually always a real
    // `string`; `source`/`destination` can genuinely be missing on some
    // responses (see the PrResponse type), so fall back to '' rather than
    // silently letting `undefined` slip through the required field.
    sourceBranch: pr.source?.branch?.name ?? '',
    targetBranch: pr.destination?.branch?.name ?? '',
    title: pr.title,
    // `state` can genuinely be missing (see the PrResponse type); fall back
    // to '' rather than letting `undefined` slip through the required
    // `Pr.state: string` field.
    // v8 ignore start -- TODO: add test #40625
    state:
      pr.state && prStates.closed.includes(pr.state)
        ? 'closed'
        : (pr.state?.toLowerCase() ?? ''),
    // v8 ignore stop
    createdAt: pr.created_on,
  };
}

export const prFieldsFilter = [
  'values.id',
  'values.title',
  'values.state',
  'values.links.commits.href',
  'values.summary.raw',
  'values.source.branch.name',
  'values.destination.branch.name',
  'values.reviewers.display_name',
  'values.reviewers.uuid',
  'values.reviewers.nickname',
  'values.reviewers.account_status',
  'values.created_on',
  'values.updated_on',
].join(',');
