import { logger } from '../../../logger/index.ts';
import { findGithubToken } from '../../../util/check-token.ts';
import { exec } from '../../../util/exec/index.ts';
import type { ExtraEnv } from '../../../util/exec/types.ts';
import {
  getSiblingFileName,
  readLocalFile,
  writeLocalFile,
} from '../../../util/fs/index.ts';
import { getRepoStatus } from '../../../util/git/index.ts';
import * as hostRules from '../../../util/host-rules.ts';
import type { UpdateArtifact, UpdateArtifactsResult } from '../types.ts';
import { githubWorkflowFileRe } from './common.ts';
import { ActionsLockfile } from './schema.ts';

export async function updateArtifacts({
  packageFileName,
  updatedDeps,
  newPackageFileContent,
  config,
}: UpdateArtifact): Promise<UpdateArtifactsResult[] | null> {
  logger.trace(`github-actions.updateArtifacts(${packageFileName})`);

  if (!githubWorkflowFileRe.test(packageFileName)) {
    return null;
  }

  const lockFileName = getSiblingFileName(packageFileName, 'actions.lock');
  const existingLockFileContent = await readLocalFile(lockFileName, 'utf8');
  if (!existingLockFileContent) {
    logger.debug(`No ${lockFileName} found`);
    return null;
  }

  const parsedLockfile = ActionsLockfile.safeParse(existingLockFileContent);
  if (!parsedLockfile.success) {
    logger.debug(
      { err: parsedLockfile.error },
      `Failed to parse ${lockFileName}`,
    );
    return null;
  }

  if (!(packageFileName in parsedLockfile.data.workflows)) {
    logger.debug(
      `Workflow ${packageFileName} is not onboarded to ${lockFileName}`,
    );
    return null;
  }

  if (
    !config.isLockFileMaintenance &&
    !updatedDeps.some((dep) => dep.depType === 'action')
  ) {
    logger.debug(`No action dependencies updated for ${packageFileName}`);
    return null;
  }

  await writeLocalFile(packageFileName, newPackageFileContent);

  const extraEnv: ExtraEnv = {};
  const token = findGithubToken(
    hostRules.find({
      hostType: 'github',
      url: 'https://api.github.com/',
    }),
  );
  if (token) {
    extraEnv.GH_TOKEN = token;
  }

  try {
    // `gh actions-lock` rescans every workflow under `.github/workflows/` and
    // rewrites the lock file, so it runs from the repository root.
    await exec('gh actions-lock', { extraEnv });

    const status = await getRepoStatus();
    const changedFiles = status.modified.filter(
      (fileName) => fileName !== packageFileName,
    );
    if (!changedFiles.length) {
      logger.debug(`${lockFileName} is unchanged`);
      return null;
    }

    const results: UpdateArtifactsResult[] = [];
    for (const fileName of changedFiles) {
      if (fileName !== lockFileName) {
        logger.debug({ fileName }, 'gh actions-lock modified additional file');
      }
      results.push({
        file: {
          type: 'addition',
          path: fileName,
          contents: await readLocalFile(fileName),
        },
      });
    }
    return results;
  } catch (err) {
    logger.warn({ err }, `Error updating ${lockFileName}`);
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
