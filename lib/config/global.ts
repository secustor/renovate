import { globalConfigOptionDefaults } from '../global-config-option-defaults.generated.ts';
import type { RenovateConfig, RepoGlobalConfig } from './types.ts';

/**
 * Options without a generated default value, for which `GlobalConfig.get(key)`
 * can return `undefined` at runtime.
 */
type UndefaultedGlobalKey = 'dryRun' | 'toolSettings';

export class GlobalConfig {
  // TODO: once global config work is complete, add a test to make sure this list includes all options with globalOnly=true (#9603)
  static OPTIONS: readonly (keyof RepoGlobalConfig)[] = [
    'allowCustomCrateRegistries',
    'allowPlugins',
    'allowScripts',
    'allowShellExecutorForPostUpgradeCommands',
    'allowedCommands',
    'allowedEnv',
    'allowedHeaders',
    'allowedUnsafeExecutions',
    'autodiscoverRepoOrder',
    'autodiscoverRepoSort',
    'bbUseDevelopmentBranch',
    'binarySource',
    'cacheDir',
    'cacheHardTtlMinutes',
    'cachePrivatePackages',
    'cacheTtlOverride',
    'checkedBranches',
    'configFileNames',
    'containerbaseDir',
    'customEnvVariables',
    'dockerChildPrefix',
    'dockerCliOptions',
    'dockerMaxPages',
    'dockerSidecarImage',
    'dockerUser',
    'dryRun',
    'encryptedWarning',
    'endpoint',
    'executionTimeout',
    'exposeAllEnv',
    'gitTimeout',
    'githubTokenWarn',
    'httpCacheTtlDays',
    'ignorePrAuthor',
    'includeMirrors',
    'localDir',
    'migratePresets',
    'onboarding',
    'onboardingAutoCloseAge',
    'onboardingBranch',
    'onboardingCommitMessage',
    'onboardingConfig',
    'onboardingConfigFileName',
    'onboardingNoDeps',
    'onboardingPrTitle',
    'platform',
    'prCacheSyncMaxPages',
    'presetCachePersistence',
    'productLinks',
    'rebaseAllOpenBranches',
    'repositoryCacheForceLocal',
    'requireConfig',
    's3Endpoint',
    's3PathStyle',
    'toolSettings',
    'userAgent',
  ];

  private static config: RepoGlobalConfig = {};

  static get(): RepoGlobalConfig;
  // Keys without a generated default really can be `undefined` at runtime.
  // Only `dryRun` is typed honestly so far - extend `UndefaultedGlobalKey`
  // when fixing the remaining keys without defaults.
  static get<Key extends UndefaultedGlobalKey>(key: Key): RepoGlobalConfig[Key];
  static get<Key extends keyof RepoGlobalConfig>(
    key: Key,
  ): Required<RepoGlobalConfig>[Key];
  static get<Key extends keyof RepoGlobalConfig>(
    key?: Key,
  ): RepoGlobalConfig | Required<RepoGlobalConfig>[Key] {
    const defaultValue = key
      ? (globalConfigOptionDefaults[key] as Required<RepoGlobalConfig>[Key])
      : undefined;

    return key
      ? ((GlobalConfig.config[key] ??
          defaultValue) as Required<RepoGlobalConfig>[Key])
      : GlobalConfig.config;
  }

  static set(config: RenovateConfig & RepoGlobalConfig): RenovateConfig {
    GlobalConfig.reset();

    const result = { ...config };
    for (const option of GlobalConfig.OPTIONS) {
      GlobalConfig.config[option] = config[option] as never;
      delete result[option];
    }

    return result;
  }

  static reset(): void {
    GlobalConfig.config = {};
  }
}
