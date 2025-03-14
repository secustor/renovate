import { execSync as _execSync } from 'node:child_process';
import { LocalFs } from './scm';

vi.mock('glob', () => ({
  glob: vi.fn().mockImplementation(() => Promise.resolve(['file1', 'file2'])),
}));
vi.mock('node:child_process');
const execSync = vi.mocked(_execSync);

describe('modules/platform/local/scm', () => {
  let localFs: LocalFs;

  beforeEach(() => {
    localFs = new LocalFs();
  });

  describe('dummy functions', () => {
    it('behindBaseBranch', async () => {
      expect(await localFs.isBranchBehindBase('', '')).toBe(false);
    });

    it('isBranchModified', async () => {
      expect(await localFs.isBranchModified('', '')).toBe(false);
    });

    it('isBranchConflicted', async () => {
      expect(await localFs.isBranchConflicted('', '')).toBe(false);
    });

    it('branchExists', async () => {
      expect(await localFs.branchExists('')).toBe(true);
    });

    it('getBranchCommit', async () => {
      expect(await localFs.getBranchCommit('')).toBeNull();
    });

    it('deleteBranch', async () => {
      expect(await localFs.deleteBranch('')).toBeUndefined();
    });

    it('commitAndPush', async () => {
      expect(await localFs.commitAndPush({} as any)).toBeNull();
    });

    it('checkoutBranch', async () => {
      expect(await localFs.checkoutBranch('')).toBe('');
    });
  });

  describe('getFileList', () => {
    it('should return file list using git', async () => {
      execSync.mockReturnValueOnce('file1\nfile2');
      expect(await localFs.getFileList()).toHaveLength(2);
    });

    it('should return file list using glob', async () => {
      execSync.mockImplementationOnce(() => {
        throw new Error();
      });

      expect(await localFs.getFileList()).toHaveLength(2);
    });
  });

  it('mergeAndPush', async () => {
    await expect(localFs.mergeAndPush('branchName')).resolves.toBeUndefined();
  });

  it('mergeBranch', async () => {
    await expect(localFs.mergeToLocal('branchName')).resolves.toBeUndefined();
  });
});
