import {
  ATTR_VCS_OWNER_NAME,
  ATTR_VCS_PROVIDER_NAME,
  ATTR_VCS_REPOSITORY_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
import {
  isNonEmptyObject,
  isNonEmptyString,
  isNonEmptyStringAndNotWhitespace,
  isString,
} from '@sindresorhus/is';
import { ERROR } from 'bunyan';
import fs from 'fs-extra';
import semver from 'semver';
import upath from 'upath';
import { GlobalConfig } from '../../config/global.ts';
import * as configParser from '../../config/index.ts';
import { resolveConfigPresets } from '../../config/presets/index.ts';
import { validateConfigSecretsAndVariables } from '../../config/secrets.ts';
import type {
  AllConfig,
  RenovateConfig,
  RenovateRepository,
  RepoGlobalConfig,
} from '../../config/types.ts';
import { CONFIG_PRESETS_INVALID } from '../../constants/error-messages.ts';
import { pkg } from '../../expose.ts';
import { instrument } from '../../instrumentation/index.ts';
import {
  exportStats,
  finalizeReport,
} from '../../instrumentation/reporting.ts';
import { getProblems, logLevel, logger, setMeta } from '../../logger/index.ts';
import { setGlobalLogLevelRemaps } from '../../logger/remap.ts';
import { getEnv } from '../../util/env.ts';
import * as hostRules from '../../util/host-rules.ts';
import * as queue from '../../util/http/queue.ts';
import * as throttle from '../../util/http/throttle.ts';
import { regexEngineStatus } from '../../util/regex.ts';
import { addSecretForSanitizing } from '../../util/sanitize.ts';
import { coerceString } from '../../util/string.ts';
import * as repositoryWorker from '../repository/index.ts';
import type { RepositoryWorkerConfig } from '../repository/init/types.ts';
import { autodiscoverRepositories } from './autodiscover.ts';
import { parseConfigs } from './config/parse/index.ts';
import { globalFinalize, globalInitialize } from './initialize.ts';
import { isLimitReached } from './limits.ts';

function applyGlobalOption<K extends keyof RepoGlobalConfig>(
  target: RepoGlobalConfig,
  source: RepoGlobalConfig,
  key: K,
): void {
  target[key] = source[key];
  delete source[key];
}

export async function getRepositoryConfig(
  globalConfig: RenovateConfig,
  repository: RenovateRepository,
): Promise<RepositoryWorkerConfig> {
  const repoIsString = isString(repository);
  const repoName = repoIsString ? repository : repository.repository;

  const repoConfig: RepositoryWorkerConfig = {
    ...globalConfig,
    repository: repoName,
  };

  if (!repoIsString) {
    const { repository: _repository, ...repositoryEntryConfig } = repository;

    // Promote GlobalConfig.OPTIONS keys into repoConfig directly so that
    // GlobalConfig.set(repoConfig) in the repository worker picks them up
    // with per-repo overrides before onboarding checks run.
    for (const option of GlobalConfig.OPTIONS) {
      if (option in repositoryEntryConfig) {
        applyGlobalOption(repoConfig, repositoryEntryConfig, option);
      }
    }

    if (isNonEmptyObject(repositoryEntryConfig)) {
      // mergeRenovateConfig later resolves this repositories[] object-entry
      // config in the correct order
      repoConfig.repositoryEntryConfig = repositoryEntryConfig;
    }
  }

  const repoParts = repoName.split('/');
  repoParts.pop();
  repoConfig.parentOrg = repoParts.join('/');
  repoConfig.topLevelOrg = repoParts.shift();
  const platform = GlobalConfig.get('platform');
  if (platform === 'local') {
    repoConfig.localDir = process.cwd();
  } else {
    const { baseDir } = repoConfig;
    /* v8 ignore if -- TODO: types (#22198) - baseDir is always set here */
    if (!baseDir) {
      throw new Error('Missing baseDir in global config');
    }
    repoConfig.localDir = upath.join(
      baseDir,
      `./repos/${platform}/${repoName}`,
    );
  }
  await fs.ensureDir(repoConfig.localDir);
  delete repoConfig.baseDir;
  return configParser.filterConfig(repoConfig, 'repository');
}

function getGlobalConfig(): Promise<RenovateConfig> {
  return parseConfigs(getEnv(), process.argv);
}

function haveReachedLimits(): boolean {
  if (isLimitReached('Commits')) {
    logger.info('Max commits created for this run.');
    return true;
  }
  return false;
}

/* istanbul ignore next */
function checkEnv(): void {
  const range = pkg.engines.node;
  if (process.release?.name !== 'node' || !process.versions?.node) {
    logger.warn(
      { release: process.release, versions: process.versions },
      'Unknown node environment detected.',
    );
  } else if (!semver.satisfies(process.versions?.node, range)) {
    logger.error(
      { versions: process.versions, range },
      'Unsupported node environment detected. Please update your node version.',
    );
  }
}

export async function validatePresets(config: AllConfig): Promise<void> {
  logger.debug('validatePresets()');
  try {
    await resolveConfigPresets(config);
  } catch (err) /* istanbul ignore next */ {
    logger.error({ err }, CONFIG_PRESETS_INVALID);
    throw new Error(CONFIG_PRESETS_INVALID);
  }
}

export async function start(): Promise<number> {
  logger.info({ renovateVersion: pkg.version }, 'Renovate started');
  // istanbul ignore next
  if (regexEngineStatus.type === 'available') {
    logger.debug('Using RE2 regex engine');
  } else if (regexEngineStatus.type === 'unavailable') {
    logger.warn(
      { err: regexEngineStatus.err },
      'RE2 not usable, falling back to RegExp',
    );
  } else if (regexEngineStatus.type === 'ignored') {
    logger.debug('RE2 regex engine is ignored via RENOVATE_X_IGNORE_RE2');
  }

  let config: AllConfig | undefined;
  const env = getEnv();
  try {
    if (isNonEmptyStringAndNotWhitespace(env.AWS_SECRET_ACCESS_KEY)) {
      addSecretForSanitizing(env.AWS_SECRET_ACCESS_KEY, 'global');
    }
    if (isNonEmptyStringAndNotWhitespace(env.AWS_SESSION_TOKEN)) {
      addSecretForSanitizing(env.AWS_SESSION_TOKEN, 'global');
    }

    const initializedConfig = await instrument('config', async () => {
      // read global config from file, env and cli args
      let parsedConfig: AllConfig = await getGlobalConfig();
      config = parsedConfig;

      // Set allowedHeaders and userAgent in case hostRules headers are configured in file config
      GlobalConfig.set({
        allowedHeaders: parsedConfig.allowedHeaders,
        userAgent: parsedConfig.userAgent,
      });
      // initialize all submodules
      parsedConfig = await globalInitialize(parsedConfig);
      config = parsedConfig;

      // Set platform, endpoint, allowedHeaders and userAgent in case local presets are used
      GlobalConfig.set({
        allowedHeaders: parsedConfig.allowedHeaders,
        platform: parsedConfig.platform,
        endpoint: parsedConfig.endpoint,
        userAgent: parsedConfig.userAgent,
      });

      await validatePresets(parsedConfig);

      setGlobalLogLevelRemaps(parsedConfig.logLevelRemap);

      checkEnv();

      // validate secrets and variables. Will throw and abort if invalid
      validateConfigSecretsAndVariables(parsedConfig);

      return parsedConfig;
    });

    // autodiscover repositories (needs to come after platform initialization)
    const discoveredConfig = await instrument('discover', () =>
      autodiscoverRepositories(initializedConfig),
    );
    config = discoveredConfig;

    if (isNonEmptyString(discoveredConfig.writeDiscoveredRepos)) {
      const content = JSON.stringify(discoveredConfig.repositories);
      await fs.writeFile(discoveredConfig.writeDiscoveredRepos, content);
      logger.info(
        `Written discovered repositories to ${discoveredConfig.writeDiscoveredRepos}`,
      );
      return 0;
    }

    // Iterate through repositories sequentially
    for (const repository of discoveredConfig.repositories ?? []) {
      if (haveReachedLimits()) {
        break;
      }

      const { owner, repo } = repositoryToOwnerAndRepo(
        typeof repository === 'string' ? repository : repository.repository,
      );

      await instrument(
        'repository',
        async () => {
          const repoConfig = await getRepositoryConfig(
            discoveredConfig,
            repository,
          );
          if (repoConfig.hostRules) {
            logger.debug('Reinitializing hostRules for repo');
            hostRules.clear();
            repoConfig.hostRules.forEach((rule) => hostRules.add(rule));
            repoConfig.hostRules = [];
          }

          // host rules can change concurrency
          queue.clear();
          throttle.clear();

          await repositoryWorker.renovateRepository(repoConfig);
          setMeta({});
        },
        {
          attributes: {
            [ATTR_VCS_PROVIDER_NAME]: discoveredConfig.platform,
            [ATTR_VCS_OWNER_NAME]: owner,
            [ATTR_VCS_REPOSITORY_NAME]: repo,
            /** @deprecated TODO remove */
            repository:
              typeof repository === 'string'
                ? repository
                : repository.repository,
          },
        },
      );
    }

    finalizeReport();
    await exportStats(discoveredConfig);
  } catch (err) /* istanbul ignore next */ {
    if (err.message.startsWith('Init: ')) {
      logger.fatal(
        { errorMessage: err.message.substring(6) },
        'Initialization error',
      );
    } else {
      logger.fatal({ err }, 'Unknown error');
    }
    if (!config) {
      // return early if we can't parse config options
      logger.debug(`Missing config`);
      return 2;
    }
  } finally {
    await globalFinalize(config ?? {});
    if (logLevel() === 'info') {
      logger.info(
        `Renovate was run at log level "${logLevel()}". Set LOG_LEVEL=debug in environment variables to see extended debug logs.`,
      );
    }
  }
  const loggerErrors = getProblems().filter((p) => p.level >= ERROR);
  if (loggerErrors.length) {
    logger.info(
      { loggerErrors },
      'Renovate is exiting with a non-zero code due to the following logged errors',
    );
    return 1;
  }
  return 0;
}

function repositoryToOwnerAndRepo(fullName: string): {
  owner: string;
  repo: string;
} {
  const parts = fullName.split('/');
  const repo = coerceString(parts.pop());
  const owner = parts.join('/');
  return { owner, repo };
}
