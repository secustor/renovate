import { ZodError } from 'zod/v4';
import { logger } from '~test/util.ts';
import {
  CheckRunsResponseSchema,
  CombinedBranchStatusSchema,
  GhBranchStatusListSchema,
  GhBranchStatusSchema,
  GhIssueCommentListSchema,
  GhRestPrListSchema,
  GhRestPrSchema,
  GhRestRepoListSchema,
  GhRestRepoSchema,
  GithubContentResponse,
  GithubFileContentSchema,
  GithubUserDetailsSchema,
  GithubUserEmailsSchema,
  GithubVulnerabilityAlerts,
  InstallationRepositoriesSchema,
} from './schema.ts';

describe('modules/platform/github/schema', () => {
  it('should be parse directory response', () => {
    const { error } = GithubContentResponse.safeParse([
      {
        type: 'file',
        size: 625,
        name: 'octokit.rb',
        path: 'lib/octokit.rb',
        sha: 'fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b',
        url: 'https://api.github.com/repos/octokit/octokit.rb/contents/lib/octokit.rb',
        git_url:
          'https://api.github.com/repos/octokit/octokit.rb/git/blobs/fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b',
        html_url:
          'https://github.com/octokit/octokit.rb/blob/master/lib/octokit.rb',
        download_url:
          'https://raw.githubusercontent.com/octokit/octokit.rb/master/lib/octokit.rb',
        _links: {
          self: 'https://api.github.com/repos/octokit/octokit.rb/contents/lib/octokit.rb',
          git: 'https://api.github.com/repos/octokit/octokit.rb/git/blobs/fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b',
          html: 'https://github.com/octokit/octokit.rb/blob/master/lib/octokit.rb',
        },
      },
      {
        type: 'dir',
        size: 0,
        name: 'octokit',
        path: 'lib/octokit',
        sha: 'a84d88e7554fc1fa21bcbc4efae3c782a70d2b9d',
        url: 'https://api.github.com/repos/octokit/octokit.rb/contents/lib/octokit',
        git_url:
          'https://api.github.com/repos/octokit/octokit.rb/git/trees/a84d88e7554fc1fa21bcbc4efae3c782a70d2b9d',
        html_url:
          'https://github.com/octokit/octokit.rb/tree/master/lib/octokit',
        download_url: null,
        _links: {
          self: 'https://api.github.com/repos/octokit/octokit.rb/contents/lib/octokit',
          git: 'https://api.github.com/repos/octokit/octokit.rb/git/trees/a84d88e7554fc1fa21bcbc4efae3c782a70d2b9d',
          html: 'https://github.com/octokit/octokit.rb/tree/master/lib/octokit',
        },
      },
      {
        type: 'symlink',
        target: '/path/to/symlink/target',
        size: 23,
        name: 'some-symlink',
        path: 'bin/some-symlink',
        sha: '452a98979c88e093d682cab404a3ec82babebb48',
        url: 'https://api.github.com/repos/octokit/octokit.rb/contents/bin/some-symlink',
        git_url:
          'https://api.github.com/repos/octokit/octokit.rb/git/blobs/452a98979c88e093d682cab404a3ec82babebb48',
        html_url:
          'https://github.com/octokit/octokit.rb/blob/master/bin/some-symlink',
        download_url:
          'https://raw.githubusercontent.com/octokit/octokit.rb/master/bin/some-symlink',
        _links: {
          git: 'https://api.github.com/repos/octokit/octokit.rb/git/blobs/452a98979c88e093d682cab404a3ec82babebb48',
          self: 'https://api.github.com/repos/octokit/octokit.rb/contents/bin/some-symlink',
          html: 'https://github.com/octokit/octokit.rb/blob/master/bin/some-symlink',
        },
      },
      {
        type: 'submodule',
        submodule_git_url: 'git://github.com/jquery/qunit.git',
        size: 0,
        name: 'qunit',
        path: 'test/qunit',
        sha: '6ca3721222109997540bd6d9ccd396902e0ad2f9',
        url: 'https://api.github.com/repos/jquery/jquery/contents/test/qunit?ref=master',
        git_url:
          'https://api.github.com/repos/jquery/qunit/git/trees/6ca3721222109997540bd6d9ccd396902e0ad2f9',
        html_url:
          'https://github.com/jquery/qunit/tree/6ca3721222109997540bd6d9ccd396902e0ad2f9',
        download_url: null,
        _links: {
          git: 'https://api.github.com/repos/jquery/qunit/git/trees/6ca3721222109997540bd6d9ccd396902e0ad2f9',
          self: 'https://api.github.com/repos/jquery/jquery/contents/test/qunit?ref=master',
          html: 'https://github.com/jquery/qunit/tree/6ca3721222109997540bd6d9ccd396902e0ad2f9',
        },
      },
    ]);
    expect(error).toBeUndefined();
  });

  it('should parse response for single file', () => {
    const { error } = GithubContentResponse.safeParse({
      type: 'file',
      encoding: 'base64',
      size: 5362,
      name: 'README.md',
      path: 'README.md',
      content: 'aaaaaaaaaa',
      sha: '3d21ec53a331a6f037a91c368710b99387d012c1',
      url: 'https://api.github.com/repos/octokit/octokit.rb/contents/README.md',
      git_url:
        'https://api.github.com/repos/octokit/octokit.rb/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1',
      html_url: 'https://github.com/octokit/octokit.rb/blob/master/README.md',
      download_url:
        'https://raw.githubusercontent.com/octokit/octokit.rb/master/README.md',
      _links: {
        git: 'https://api.github.com/repos/octokit/octokit.rb/git/blobs/3d21ec53a331a6f037a91c368710b99387d012c1',
        self: 'https://api.github.com/repos/octokit/octokit.rb/contents/README.md',
        html: 'https://github.com/octokit/octokit.rb/blob/master/README.md',
      },
    });
    expect(error).toBeUndefined();
  });

  it('should skip vulnerability alerts with unsupported ecosystems', () => {
    const result = GithubVulnerabilityAlerts.parse([
      {
        dismissed_reason: null,
        security_advisory: {
          ghsa_id: 'GHSA-1111-2222-3333',
          summary: 'Test advisory',
          description: 'Test advisory',
          identifiers: [{ type: 'CVE', value: 'CVE-2024-1234' }],
          severity: 'high',
        },
        security_vulnerability: {
          first_patched_version: { identifier: '1.0.0' },
          package: { ecosystem: 'dotnet', name: 'test-package' },
          severity: 'high',
          vulnerable_version_range: '< 1.0.0',
        },
        dependency: { manifest_path: 'package.json' },
      },
      {
        dismissed_reason: null,
        security_advisory: {
          ghsa_id: 'GHSA-4444-5555-6666',
          summary: 'Test advisory',
          description: 'Test advisory',
          identifiers: [{ type: 'CVE', value: 'CVE-2024-5678' }],
          severity: 'medium',
        },
        security_vulnerability: {
          first_patched_version: { identifier: '2.0.0' },
          package: { ecosystem: 'npm', name: 'valid-package' },
          severity: 'medium',
          vulnerable_version_range: '< 2.0.0',
        },
        dependency: { manifest_path: 'package.json' },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].security_vulnerability?.package.ecosystem).toBe('npm');
  });

  it('should log vulnerability alerts with parse errors', () => {
    const { data, success } = GithubVulnerabilityAlerts.safeParse([
      {
        dismissed_reason: null,
        security_advisory: {
          ghsa_id: 'GHSA-1111-2222-3333',
          summary: 'Test advisory',
          description: 'Test advisory',
          identifiers: [{ type: 'CVE', value: 'CVE-2024-1234' }],
          severity: 'high',
        },
        security_vulnerability: {
          first_patched_version: { identifier: '1.0.0' },
          package: { ecosystem: 'dotnet', name: 'test-package' },
          severity: 'high',
          vulnerable_version_range: '< 1.0.0',
        },
      },
    ]);
    expect(success).toBe(true);
    expect(data).toBeEmptyArray();
    expect(logger.logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(ZodError),
      }),
      'Vulnerability Alert: Failed to parse some alerts',
    );
  });

  it('should filter vulnerability alerts with missing security_vulnerability', () => {
    const { data, success } = GithubVulnerabilityAlerts.safeParse([
      {
        dismissed_reason: null,
        security_advisory: {
          ghsa_id: 'GHSA-4444-5555-6666',
          summary: 'Test advisory',
          description: 'Test advisory',
          identifiers: [{ type: 'CVE', value: 'CVE-2024-5678' }],
          severity: 'high',
        },
        security_vulnerability: null,
        dependency: { manifest_path: 'package.json' },
      },
    ]);
    expect(success).toBe(true);
    expect(data).toBeEmptyArray();
    expect(logger.logger.debug).not.toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(ZodError),
      }),
      'Vulnerability Alert: Failed to parse some alerts',
    );
  });

  it('should parse severity and cvss_severities fields', () => {
    const result = GithubVulnerabilityAlerts.parse([
      {
        dismissed_reason: null,
        security_advisory: {
          ghsa_id: 'GHSA-1111-2222-3333',
          summary: 'Test advisory',
          description: 'Test advisory',
          identifiers: [{ type: 'CVE', value: 'CVE-2024-1234' }],
          severity: 'high',
          cvss_severities: {
            cvss_v3: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              score: 9.8,
            },
            cvss_v4: null,
          },
        },
        security_vulnerability: {
          first_patched_version: { identifier: '2.0.0' },
          package: { ecosystem: 'npm', name: 'test-package' },
          severity: 'critical',
          vulnerable_version_range: '< 2.0.0',
        },
        dependency: { manifest_path: 'package.json' },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].security_advisory.severity).toBe('high');
    expect(result[0].security_vulnerability?.severity).toBe('critical');
    expect(result[0].security_advisory.cvss_severities?.cvss_v3).toEqual({
      vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      score: 9.8,
    });
    expect(result[0].security_advisory.cvss_severities?.cvss_v4).toBeNull();
  });

  describe('new schemas added for getJson migration', () => {
    it('GhRestRepoSchema: parses minimal repo response', () => {
      const result = GhRestRepoSchema.parse({
        full_name: 'a/b',
        archived: false,
      });
      expect(result.full_name).toBe('a/b');
      expect(result.archived).toBe(false);
      expect(result.topics).toEqual([]);
    });

    it('GhRestRepoListSchema: drops invalid elements', () => {
      const result = GhRestRepoListSchema.parse([
        { full_name: 'a/b', archived: false },
        null,
        { full_name: 'c/d', archived: true },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('a/b');
    });

    it('GhRestPrSchema: parses minimal PR with only number field', () => {
      const result = GhRestPrSchema.parse({ number: 42 });
      expect(result.number).toBe(42);
    });

    it('GhRestPrListSchema: parses PR list and drops invalid', () => {
      const result = GhRestPrListSchema.parse([
        { number: 1, state: 'open', title: 'PR 1', updated_at: '2024-01-01' },
        null,
        { number: 2 },
      ]);
      expect(result).toHaveLength(2);
    });

    it('CombinedBranchStatusSchema: parses with optional state', () => {
      const result = CombinedBranchStatusSchema.parse({});
      expect(result.state).toBeUndefined();
      expect(result.statuses).toEqual([]);
    });

    it('GhBranchStatusSchema: parses with optional state', () => {
      const result = GhBranchStatusSchema.parse({ context: 'ctx-1' });
      expect(result.context).toBe('ctx-1');
      expect(result.state).toBeUndefined();
    });

    it('GhBranchStatusListSchema: drops invalid elements and handles non-array', () => {
      const arrayResult = GhBranchStatusListSchema.parse([
        { context: 'ctx-1', state: 'success' },
        { context: 'ctx-2' },
      ]);
      expect(arrayResult).toHaveLength(2);

      const emptyResult = GhBranchStatusListSchema.parse({});
      expect(emptyResult).toEqual([]);
    });

    it('CheckRunsResponseSchema: handles missing conclusion', () => {
      const result = CheckRunsResponseSchema.parse({
        check_runs: [
          { name: 'ci', status: 'completed', conclusion: 'success' },
          { name: 'ci2', status: 'pending' },
        ],
      });
      expect(result.check_runs).toHaveLength(2);
      expect(result.check_runs[1].conclusion).toBe('');
    });

    it('GhIssueCommentListSchema: parses comment list', () => {
      const result = GhIssueCommentListSchema.parse([
        { id: 1, body: 'comment 1' },
        { id: 2, body: 'comment 2' },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
    });

    it('GithubFileContentSchema: parses file content', () => {
      const result = GithubFileContentSchema.parse({ content: 'SGVsbG8=' });
      expect(result.content).toBe('SGVsbG8=');
    });

    it('GithubUserDetailsSchema: handles missing optional fields', () => {
      const result = GithubUserDetailsSchema.parse({ login: 'renovate-bot' });
      expect(result.login).toBe('renovate-bot');
      expect(result.name).toBeUndefined();
      expect(result.id).toBe(0);
      expect(result.email).toBeUndefined();
    });

    it('GithubUserEmailsSchema: parses email list and drops invalid', () => {
      const result = GithubUserEmailsSchema.parse([
        { email: 'user@domain.com' },
        {},
        { email: 'other@domain.com' },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user@domain.com');
    });

    it('InstallationRepositoriesSchema: parses installation repos', () => {
      const result = InstallationRepositoriesSchema.parse({
        repositories: [
          { full_name: 'a/b', archived: false },
          { full_name: 'c/d', archived: true },
        ],
      });
      expect(result.repositories).toHaveLength(2);
    });
  });
});
