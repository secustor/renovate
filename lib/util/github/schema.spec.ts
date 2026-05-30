import {
  GithubGitBlobSchema,
  GithubGitTreeSchema,
  GithubRepoDefaultBranchSchema,
  GithubRestAssetSchema,
  GithubRestReleaseSchema,
} from './schema.ts';

describe('util/github/schema', () => {
  describe('GithubRestAssetSchema', () => {
    it('parses minimal asset', () => {
      const result = GithubRestAssetSchema.parse({
        name: 'binary-v1.0.0.tar.gz',
        url: 'https://api.github.com/repos/owner/repo/releases/assets/1',
      });
      expect(result.name).toBe('binary-v1.0.0.tar.gz');
      expect(result.browser_download_url).toBeUndefined();
      expect(result.size).toBeUndefined();
    });

    it('parses full asset', () => {
      const result = GithubRestAssetSchema.parse({
        name: 'binary.tar.gz',
        url: 'https://api.github.com/repos/owner/repo/releases/assets/1',
        browser_download_url:
          'https://github.com/owner/repo/releases/download/v1/binary.tar.gz',
        size: 1024,
      });
      expect(result.browser_download_url).toBe(
        'https://github.com/owner/repo/releases/download/v1/binary.tar.gz',
      );
      expect(result.size).toBe(1024);
    });
  });

  describe('GithubRestReleaseSchema', () => {
    it('parses minimal release (only assets)', () => {
      const result = GithubRestReleaseSchema.parse({
        assets: [
          {
            name: 'index.json',
            url: 'https://api.github.com/repos/owner/repo/releases/assets/1',
          },
        ],
      });
      expect(result.assets).toHaveLength(1);
      expect(result.assets[0].name).toBe('index.json');
    });

    it('parses full release', () => {
      const result = GithubRestReleaseSchema.parse({
        id: 123,
        tag_name: 'v1.0.0',
        published_at: '2024-01-01T00:00:00Z',
        prerelease: false,
        assets: [],
        html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
        name: 'Release v1.0.0',
        body: 'Release notes',
      });
      expect(result.tag_name).toBe('v1.0.0');
      expect(result.id).toBe(123);
    });

    it('drops invalid asset elements from LooseArray', () => {
      const result = GithubRestReleaseSchema.parse({
        assets: [
          { name: 'valid.tar.gz', url: 'https://api.github.com/...' },
          null,
          { name: 'also-valid.tar.gz', url: 'https://api.github.com/...' },
        ],
      });
      expect(result.assets).toHaveLength(2);
    });
  });

  describe('GithubGitTreeSchema', () => {
    it('parses git tree', () => {
      const result = GithubGitTreeSchema.parse({
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/abc123',
        tree: [
          { path: 'CHANGELOG.md', type: 'blob' },
          { path: 'lib', type: 'tree' },
        ],
        truncated: false,
      });
      expect(result.tree).toHaveLength(2);
      expect(result.truncated).toBe(false);
    });

    it('handles empty tree array', () => {
      const result = GithubGitTreeSchema.parse({
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/abc123',
        tree: [],
        truncated: false,
      });
      expect(result.tree).toEqual([]);
    });
  });

  describe('GithubGitBlobSchema', () => {
    it('parses blob', () => {
      const result = GithubGitBlobSchema.parse({
        content: 'SGVsbG8gV29ybGQ=',
        encoding: 'base64',
      });
      expect(result.content).toBe('SGVsbG8gV29ybGQ=');
      expect(result.encoding).toBe('base64');
    });
  });

  describe('GithubRepoDefaultBranchSchema', () => {
    it('parses repo with default branch', () => {
      const result = GithubRepoDefaultBranchSchema.parse({
        default_branch: 'main',
      });
      expect(result.default_branch).toBe('main');
    });
  });
});
