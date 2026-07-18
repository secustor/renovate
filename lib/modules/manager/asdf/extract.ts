import { isTruthy } from '@sindresorhus/is';
import { logger } from '../../../logger/index.ts';
import { isSkipComment } from '../../../util/ignore.ts';
import { regEx } from '../../../util/regex.ts';
import type { PackageDependency, PackageFileContent } from '../types.ts';
import type {
  StaticTooling,
  ToolingDefinition,
} from './upgradeable-tooling.ts';
import { upgradeableTooling } from './upgradeable-tooling.ts';

export function extractPackageFile(content: string): PackageFileContent | null {
  logger.trace(`asdf.extractPackageFile()`);

  const regex = regEx(
    /^(?<toolName>([\w_-]+)) +(?<version>[^\s#]+)(?: +[^\s#]+)* *(?: #(?<comment>.*))?$/gm,
  );

  const deps: PackageDependency[] = [];

  for (const groups of [...content.matchAll(regex)]
    .map((m) => m.groups)
    .filter(isTruthy)) {
    const depName = groups.toolName.trim();
    const version = groups.version.trim();

    // `upgradeableTooling` is a fixed lookup table, but `depName` is an
    // arbitrary tool name parsed from the repo, so a miss is genuinely
    // possible despite the exported type claiming otherwise (that type stays
    // narrow because other callers iterate every entry via Object.values()).
    const toolConfig = upgradeableTooling[depName] as
      | ToolingDefinition
      | undefined;
    let toolDefinition: StaticTooling | undefined;
    if (toolConfig) {
      toolDefinition =
        typeof toolConfig.config === 'function'
          ? toolConfig.config(version)
          : toolConfig.config;
    }

    if (toolDefinition) {
      const dep: PackageDependency = {
        currentValue: version,
        depName,
        ...toolDefinition,
      };
      // The `comment` capture group is optional in the regex, but TS's
      // built-in RegExpMatchArray.groups type doesn't reflect that.
      const comment = groups.comment as string | undefined;
      if (isSkipComment((comment ?? '').trim())) {
        dep.skipReason = 'ignored';
      }

      deps.push(dep);
    } else {
      const dep: PackageDependency = {
        depName,
        skipReason: 'unsupported-datasource',
      };

      deps.push(dep);
    }
  }

  return deps.length ? { deps } : null;
}
