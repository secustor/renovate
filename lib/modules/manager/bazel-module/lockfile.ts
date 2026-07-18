import { GlobalConfig } from '../../../config/global.ts';
import { TEMPORARY_ERROR } from '../../../constants/error-messages.ts';
import { logger } from '../../../logger/index.ts';
import { exec } from '../../../util/exec/index.ts';
import type { ExecOptions } from '../../../util/exec/types.ts';
import { deleteLocalFile, readLocalFile } from '../../../util/fs/index.ts';
import { getRepoStatus } from '../../../util/git/index.ts';
import type { UpdateArtifactsResult } from '../types.ts';

export async function updateBazelLockfile(
  lockFileName: string,
  cwdFile: string,
  isLockFileMaintenance: boolean | undefined,
  bazeliskConstraint: string | undefined,
): Promise<UpdateArtifactsResult[] | null> {
  try {
    const allowlist = GlobalConfig.get('allowedUnsafeExecutions');

    const command = 'bazel mod deps --lockfile_mode=update';

    if (!allowlist.includes('bazelModDeps')) {
      logger.once.warn(
        { command },
        'Bazel command was requested to run, but `bazelModDeps` is not permitted in the allowedUnsafeExecutions',
      );
      return null;
    }

    if (isLockFileMaintenance) {
      await deleteLocalFile(lockFileName);
    }

    const execOptions: ExecOptions = {
      cwdFile,
      docker: {},
      toolConstraints: [
        { toolName: 'bazelisk', constraint: bazeliskConstraint },
      ],
    };
    await exec(command, execOptions);

    const status = await getRepoStatus();
    if (
      !status.modified.includes(lockFileName) &&
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- simple-git's StatusResult types not_added as always an array, but this codebase's tests commonly build StatusResult via partial<>() mocks that omit it (see lockfile.spec.ts "returns null when lockfile is not modified"), so it can be undefined in practice.
      !status.not_added?.includes(lockFileName)
    ) {
      return null;
    }

    const newLockContent = await readLocalFile(lockFileName, 'utf8');
    return [
      {
        file: {
          type: 'addition',
          path: lockFileName,
          contents: newLockContent,
        },
      },
    ];
  } catch (err) {
    if (err.message === TEMPORARY_ERROR) {
      throw err;
    }
    logger.warn(
      { lockFile: lockFileName, err },
      'Failed to update MODULE.bazel.lock',
    );
    return [
      {
        artifactError: {
          fileName: lockFileName,
          stderr: err.message,
        },
      },
    ];
  }
}
