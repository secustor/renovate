import {
  BranchSchema,
  CommentArraySchema,
  CommentSchema,
  CommitStatusArraySchema,
  CommitStatusSchema,
  ContentsListResponse,
  FallbackPRSchema,
  IssueArraySchema,
  IssueSchema,
  LabelArraySchema,
  LabelSchema,
  NullablePRArraySchema,
  PRSchema,
  RepoArraySchema,
  RepoContentsSchema,
  RepoSchema,
  RepoSearchResultsSchema,
  UserSchema,
  VersionSchema,
} from './schema.ts';

describe('modules/platform/gitea/schema', () => {
  it('ContentsResponseSchema', () => {
    expect(ContentsListResponse.parse([])).toBeEmptyArray();
  });

  describe('UserSchema', () => {
    it('parses valid user', () => {
      expect(
        UserSchema.parse({
          id: 1,
          email: 'user@example.com',
          username: 'user',
        }),
      ).toMatchObject({ id: 1, username: 'user' });
    });
  });

  describe('RepoSchema', () => {
    it('parses minimal repo with only full_name', () => {
      expect(RepoSchema.parse({ full_name: 'some/repo' })).toMatchObject({
        full_name: 'some/repo',
      });
    });
  });

  describe('RepoArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(RepoArraySchema.parse([])).toBeEmptyArray();
    });

    it('drops invalid repos', () => {
      const result = RepoArraySchema.parse([
        { full_name: 'valid/repo' },
        { invalid: 'no full_name' },
      ]);
      expect(result).toHaveLength(1);
    });
  });

  describe('RepoSearchResultsSchema', () => {
    it('parses valid results', () => {
      const result = RepoSearchResultsSchema.parse({
        ok: true,
        data: [{ full_name: 'some/repo' }],
      });
      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('RepoContentsSchema', () => {
    it('parses minimal contents', () => {
      expect(RepoContentsSchema.parse({})).toEqual({});
    });

    it('parses with content', () => {
      expect(
        RepoContentsSchema.parse({ path: 'file.txt', content: 'abc' }),
      ).toMatchObject({ path: 'file.txt', content: 'abc' });
    });
  });

  describe('LabelSchema', () => {
    it('parses valid label', () => {
      expect(LabelSchema.parse({ id: 1, name: 'bug' })).toMatchObject({
        id: 1,
        name: 'bug',
      });
    });
  });

  describe('LabelArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(LabelArraySchema.parse([])).toBeEmptyArray();
    });
  });

  describe('PRSchema', () => {
    const validPR = {
      number: 1,
      state: 'open',
      title: 'Test PR',
      body: 'test body',
      mergeable: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      closed_at: null,
    };

    it('parses minimal PR', () => {
      expect(PRSchema.parse(validPR)).toMatchObject({
        number: 1,
        title: 'Test PR',
      });
    });

    it('parses PR without closed_at', () => {
      const pr = { ...validPR, closed_at: undefined };
      expect(PRSchema.parse(pr)).toMatchObject({ number: 1 });
    });

    it('parses PR without diff_url', () => {
      expect(PRSchema.parse(validPR)).toBeTruthy();
    });
  });

  describe('FallbackPRSchema', () => {
    it('returns null for invalid input', async () => {
      const result = await FallbackPRSchema.parseAsync('invalid');
      expect(result).toBeNull();
    });

    it('returns null for empty string', async () => {
      const result = await FallbackPRSchema.parseAsync('');
      expect(result).toBeNull();
    });

    it('parses valid PR', async () => {
      const validPR = {
        number: 1,
        state: 'open',
        title: 'Test PR',
        body: 'test body',
        mergeable: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const result = await FallbackPRSchema.parseAsync(validPR);
      expect(result).toMatchObject({ number: 1 });
    });
  });

  describe('NullablePRArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(NullablePRArraySchema.parse([])).toBeEmptyArray();
    });

    it('keeps null items', () => {
      const result = NullablePRArraySchema.parse([null]);
      expect(result).toEqual([null]);
    });
  });

  describe('IssueSchema', () => {
    it('parses valid issue', () => {
      const issue = {
        number: 1,
        state: 'open',
        title: 'Test Issue',
        body: 'body',
        assignees: [],
        labels: [],
      };
      expect(IssueSchema.parse(issue)).toMatchObject({ number: 1 });
    });

    it('defaults null/undefined labels to empty array', () => {
      const issue = {
        number: 1,
        state: 'open',
        title: 'Test Issue',
        body: 'body',
        assignees: [],
        labels: undefined,
      };
      const result = IssueSchema.parse(issue);
      expect(result.labels).toEqual([]);
    });
  });

  describe('IssueArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(IssueArraySchema.parse([])).toBeEmptyArray();
    });
  });

  describe('CommentSchema', () => {
    it('parses valid comment', () => {
      expect(CommentSchema.parse({ id: 1, body: 'comment' })).toMatchObject({
        id: 1,
        body: 'comment',
      });
    });
  });

  describe('CommentArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(CommentArraySchema.parse([])).toBeEmptyArray();
    });
  });

  describe('BranchSchema', () => {
    it('parses valid branch', () => {
      const branch = {
        name: 'main',
        commit: {
          id: 'abc123',
          author: {
            name: 'Author',
            email: 'author@example.com',
            username: 'author',
          },
        },
      };
      expect(BranchSchema.parse(branch)).toMatchObject({ name: 'main' });
    });
  });

  describe('CommitStatusSchema', () => {
    it('parses valid commit status', () => {
      const status = {
        id: 1,
        status: 'success',
        context: 'ci',
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(CommitStatusSchema.parse(status)).toMatchObject({
        id: 1,
        status: 'success',
      });
    });

    it('maps unknown status strings to "unknown"', () => {
      const status = {
        id: 1,
        status: 'xyz',
        context: 'ci',
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(CommitStatusSchema.parse(status)).toMatchObject({
        status: 'unknown',
      });
    });
  });

  describe('CommitStatusArraySchema', () => {
    it('returns empty array for empty input', () => {
      expect(CommitStatusArraySchema.parse([])).toBeEmptyArray();
    });
  });

  describe('VersionSchema', () => {
    it('parses valid version', () => {
      expect(VersionSchema.parse({ version: '1.21.0' })).toMatchObject({
        version: '1.21.0',
      });
    });
  });
});
