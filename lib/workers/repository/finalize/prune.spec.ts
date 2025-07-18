import { GlobalConfig } from '../../../config/global';
import type { Pr } from '../../../modules/platform/types';
import * as cleanup from './prune';
import { git, partial, platform, scm } from '~test/util';
import type { RenovateConfig } from '~test/util';

let config: RenovateConfig;

beforeEach(() => {
  config = partial<RenovateConfig>({
    repoIsOnboarded: true,
    branchPrefix: `renovate/`,
    pruneStaleBranches: true,
    ignoredAuthors: [],
    platform: 'github',
    errors: [],
    warnings: [],
  });
});

describe('workers/repository/finalize/prune', () => {
  describe('pruneStaleBranches()', () => {
    beforeEach(() => {
      GlobalConfig.reset();
    });

    it('returns if no branchList', async () => {
      delete config.branchList;
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(0);
    });

    it('ignores reconfigure branch', async () => {
      delete config.branchList;
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(0);
    });

    it('returns if no renovate branches', async () => {
      config.branchList = [];
      git.getBranchList.mockReturnValueOnce([]);
      await expect(
        cleanup.pruneStaleBranches(config, config.branchList),
      ).resolves.not.toThrow();
    });

    it('returns if no remaining branches', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(config.branchList);
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
    });

    it('renames deletes remaining branch', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(partial<Pr>({ title: 'foo' }));
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(1);
      expect(platform.updatePr).toHaveBeenCalledTimes(1);
    });

    it('skips rename but still deletes branch', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(
        partial<Pr>({
          title: 'foo - autoclosed',
        }),
      );
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(1);
      expect(platform.updatePr).toHaveBeenCalledTimes(1);
    });

    it('deletes with base branches', async () => {
      config.branchList = ['renovate/main-a'];
      config.baseBranchPatterns = ['main', 'maint/v7'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat([
          'renovate/main-b',
          'renovate/maint/v7-a',
          'renovate/maint/v7-b',
        ]),
      );
      scm.isBranchModified.mockResolvedValueOnce(true);
      scm.isBranchModified.mockResolvedValueOnce(false);
      scm.isBranchModified.mockResolvedValueOnce(true);
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledWith('renovate/maint/v7-a');
      expect(scm.isBranchModified).toHaveBeenCalledTimes(3);
      expect(scm.isBranchModified).toHaveBeenCalledWith(
        'renovate/main-b',
        'main',
      );
      expect(scm.isBranchModified).toHaveBeenCalledWith(
        'renovate/maint/v7-a',
        'maint/v7',
      );
      expect(scm.isBranchModified).toHaveBeenCalledWith(
        'renovate/maint/v7-b',
        'maint/v7',
      );
    });

    it('does nothing on dryRun', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      GlobalConfig.set({ dryRun: 'full' });
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(partial<Pr>({ title: 'foo' }));
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });

    it('does nothing on prune stale branches disabled', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      config.pruneStaleBranches = false;
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(partial<Pr>({ title: 'foo' }));
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });

    it('notifies via PR changes if someone pushed to PR', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.getBranchPr.mockResolvedValueOnce(partial<Pr>());
      scm.isBranchModified.mockResolvedValueOnce(true);
      platform.findPr.mockResolvedValueOnce(partial<Pr>({ title: 'foo' }));
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(1);
      expect(platform.ensureComment).toHaveBeenCalledTimes(1);
    });

    it('skips appending - abandoned to PR title if already present', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.getBranchPr.mockResolvedValueOnce(partial<Pr>());
      scm.isBranchModified.mockResolvedValueOnce(true);
      platform.findPr.mockResolvedValueOnce(
        partial<Pr>({ title: 'foo - abandoned' }),
      );
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });

    it('skips changes to PR if dry run', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      GlobalConfig.set({ dryRun: 'full' });
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.getBranchPr.mockResolvedValueOnce(partial<Pr>());
      scm.isBranchModified.mockResolvedValueOnce(true);
      platform.findPr.mockResolvedValueOnce(partial<Pr>({ title: 'foo' }));
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
      expect(platform.ensureComment).toHaveBeenCalledTimes(0);
    });

    it('dry run delete branch no PR', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      GlobalConfig.set({ dryRun: 'full' });
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(null as never);
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });

    it('delete branch no PR', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      platform.findPr.mockResolvedValueOnce(null as never);
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(1);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });

    it('does not delete modified orphan branch', async () => {
      config.branchList = ['renovate/a', 'renovate/b'];
      git.getBranchList.mockReturnValueOnce(
        config.branchList.concat(['renovate/c']),
      );
      scm.isBranchModified.mockResolvedValueOnce(true);
      platform.findPr.mockResolvedValueOnce(null as never);
      await cleanup.pruneStaleBranches(config, config.branchList);
      expect(git.getBranchList).toHaveBeenCalledTimes(1);
      expect(scm.deleteBranch).toHaveBeenCalledTimes(0);
      expect(platform.updatePr).toHaveBeenCalledTimes(0);
    });
  });
});
