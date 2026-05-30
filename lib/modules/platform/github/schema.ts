import { z } from 'zod/v4';
import { logger } from '../../../logger/index.ts';
import { LooseArray } from '../../../util/schema-utils/index.ts';

const Ecosystem = z.enum([
  'actions',
  'composer',
  'go',
  'maven',
  'npm',
  'nuget',
  'pip',
  'rubygems',
  'rust',
]);
export type Ecosystem = z.infer<typeof Ecosystem>;

const Package = z.object({
  ecosystem: Ecosystem.catch((ctx) => {
    logger.debug(
      { ecosystem: ctx.input },
      'Skipping vulnerability alert with unsupported ecosystem',
    );
    return undefined as any;
  }),
  name: z.string(),
});

const Severity = z.enum(['low', 'medium', 'high', 'critical']);

const SecurityVulnerability = z
  .object({
    first_patched_version: z.object({ identifier: z.string() }).nullish(),
    package: Package,
    severity: Severity,
    vulnerable_version_range: z.string(),
  })
  .nullable();

const CvssSeverity = z.object({
  vector_string: z.string().nullable(),
  score: z.number().nullable(),
});

const SecurityAdvisory = z.object({
  ghsa_id: z.string(),
  summary: z.string(),
  description: z.string(),
  identifiers: z.array(
    z.object({
      type: z.string(),
      value: z.string(),
    }),
  ),
  references: z.array(z.object({ url: z.string() })).optional(),
  severity: Severity,
  cvss_severities: z
    .object({
      cvss_v3: CvssSeverity.nullish(),
      cvss_v4: CvssSeverity.nullish(),
    })
    .nullish(),
});
export type SecurityAdvisory = z.infer<typeof SecurityAdvisory>;

export const GithubVulnerabilityAlerts = LooseArray(
  z.object({
    dismissed_reason: z.string().nullish(),
    security_advisory: SecurityAdvisory,
    security_vulnerability: SecurityVulnerability,
    dependency: z.object({
      manifest_path: z.string(),
    }),
  }),
  {
    onError: ({ error }) => {
      logger.debug(
        { error },
        'Vulnerability Alert: Failed to parse some alerts',
      );
    },
  },
).transform((alerts) =>
  alerts.filter((alert) => alert.security_vulnerability?.package?.ecosystem),
);
export type GithubVulnerabilityAlerts = z.infer<
  typeof GithubVulnerabilityAlerts
>;
export type GithubVulnerabilityAlert = GithubVulnerabilityAlerts[number];

// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
const GithubResponseMetadata = z.object({
  name: z.string(),
  path: z.string(),
});

export const GithubFileMeta = GithubResponseMetadata.extend({
  type: z.literal('file'),
});
export type GithubFileMeta = z.infer<typeof GithubFileMeta>;

export const GithubFile = GithubFileMeta.extend({
  content: z.string(),
  encoding: z.string(),
});
export type GithubFile = z.infer<typeof GithubFile>;

export const GithubDirectory = GithubResponseMetadata.extend({
  type: z.literal('dir'),
});

export type GithubDirectory = z.infer<typeof GithubDirectory>;

export const GithubOtherContent = GithubResponseMetadata.extend({
  type: z.literal('symlink').or(z.literal('submodule')),
});

export type GithubOtherContent = z.infer<typeof GithubOtherContent>;

export const GithubElement = GithubFile.or(GithubFileMeta)
  .or(GithubDirectory)
  .or(GithubOtherContent);
export type GithubElement = z.infer<typeof GithubElement>;

export const GithubContentResponse = z.array(GithubElement).or(GithubElement);

export const GithubBranchProtection = z.object({
  required_status_checks: z
    .object({
      strict: z.boolean(),
    })
    .nullish()
    .optional(),
});
export type GithubBranchProtection = z.infer<typeof GithubBranchProtection>;

const GithubRulesetRule = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('non_fast_forward'),
  }),
  z.object({
    type: z.literal('required_status_checks'),
    parameters: z.object({
      strict_required_status_checks_policy: z.boolean().optional(),
    }),
  }),
  // prevents deletion
  z.object({
    type: z.literal('deletion'),
  }),
]);

export const GithubBranchRulesets = LooseArray(GithubRulesetRule);
export type GithubBranchRulesets = z.infer<typeof GithubBranchRulesets>;

// https://docs.github.com/en/rest/repos/repos#get-a-repository
export const GhRestRepoSchema = z.object({
  full_name: z.string(),
  default_branch: z.string().optional(),
  owner: z
    .object({
      login: z.string(),
    })
    .optional(),
  archived: z.boolean().optional().default(false),
  topics: z.array(z.string()).optional().default([]),
});
export type GhRestRepoSchema = z.infer<typeof GhRestRepoSchema>;

export const GhRestRepoListSchema = LooseArray(GhRestRepoSchema);
export type GhRestRepoListSchema = z.infer<typeof GhRestRepoListSchema>;

export const InstallationRepositoriesSchema = z.object({
  repositories: GhRestRepoListSchema,
});
export type InstallationRepositoriesSchema = z.infer<
  typeof InstallationRepositoriesSchema
>;

// https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request
// All fields optional to handle incomplete responses from API
export const GhRestPrSchema = z.object({
  head: z
    .object({
      ref: z.string().optional(),
      sha: z.string().optional(),
      repo: z
        .object({
          full_name: z.string().optional(),
          pushed_at: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  base: z
    .object({
      repo: z
        .object({
          pushed_at: z.string().optional(),
        })
        .optional(),
      ref: z.string().optional(),
    })
    .optional(),
  mergeable_state: z.string().optional(),
  number: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.string().optional(),
  merged_at: z.string().optional(),
  created_at: z.string().optional(),
  closed_at: z.string().optional(),
  updated_at: z.string().optional(),
  user: z.object({ login: z.string().optional() }).optional(),
  node_id: z.string().optional(),
  assignee: z.object({ login: z.string().optional() }).optional(),
  assignees: z.array(z.object({ login: z.string().optional() })).optional(),
  requested_reviewers: z
    .array(z.object({ login: z.string().optional() }))
    .optional(),
  labels: z.array(z.object({ name: z.string() })).optional(),
  _links: z.unknown().optional(),
});
export type GhRestPrSchema = z.infer<typeof GhRestPrSchema>;

export const GhRestPrListSchema = LooseArray(GhRestPrSchema);
export type GhRestPrListSchema = z.infer<typeof GhRestPrListSchema>;

// https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference
export const GhBranchStatusSchema = z.object({
  context: z.string(),
  state: z.string().optional(),
});
export type GhBranchStatusSchema = z.infer<typeof GhBranchStatusSchema>;

export const GhBranchStatusListSchema = LooseArray(GhBranchStatusSchema).catch(
  [],
);
export type GhBranchStatusListSchema = z.infer<typeof GhBranchStatusListSchema>;

export const CombinedBranchStatusSchema = z.object({
  state: z.string().optional(),
  statuses: LooseArray(GhBranchStatusSchema).catch([]),
});
export type CombinedBranchStatusSchema = z.infer<
  typeof CombinedBranchStatusSchema
>;

// https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference
export const CheckRunSchema = z.object({
  name: z.string(),
  status: z.string(),
  conclusion: z.string().optional().default(''),
});

export const CheckRunsResponseSchema = z.object({
  check_runs: LooseArray(CheckRunSchema).catch([]),
});
export type CheckRunsResponseSchema = z.infer<typeof CheckRunsResponseSchema>;

// https://docs.github.com/en/rest/issues/comments#list-issue-comments
export const GhIssueCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
});

export const GhIssueCommentListSchema = LooseArray(GhIssueCommentSchema);
export type GhIssueCommentListSchema = z.infer<typeof GhIssueCommentListSchema>;

// For getRawFile: contents endpoint with content field
export const GithubFileContentSchema = z.object({
  content: z.string(),
});
export type GithubFileContentSchema = z.infer<typeof GithubFileContentSchema>;

// User details schema
export const GithubUserDetailsSchema = z.object({
  login: z.string(),
  name: z.string().optional().nullable(),
  id: z.number().optional().default(0),
  email: z.string().nullable().optional(),
});
export type GithubUserDetailsSchema = z.infer<typeof GithubUserDetailsSchema>;

// User email schema
export const GithubUserEmailSchema = z.object({
  email: z.string(),
});

export const GithubUserEmailsSchema = LooseArray(GithubUserEmailSchema).catch(
  [],
);
export type GithubUserEmailsSchema = z.infer<typeof GithubUserEmailsSchema>;
