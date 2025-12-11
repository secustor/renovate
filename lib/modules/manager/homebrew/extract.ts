import { logger } from '../../../logger';
import type { SkipReason } from '../../../types';
import { regEx } from '../../../util/regex';
import { GithubTagsDatasource } from '../../datasource/github-tags';
import { NpmDatasource } from '../../datasource/npm';
import type { PackageDependency, PackageFileContent } from '../types';
import type { NpmUrlParsedResult, UrlParsedResult } from './types';
import { isSpace, removeComments, skip } from './util';

function parseSha256(idx: number, content: string): string | null {
  let i = idx;
  i += 'sha256'.length;
  i = skip(i, content, (c) => isSpace(c));
  if (content[i] !== '"' && content[i] !== "'") {
    return null;
  }
  i += 1;
  const j = skip(i, content, (c) => c !== '"' && c !== "'");
  const sha256 = content.slice(i, j);
  return sha256;
}

function extractSha256(content: string): string | null {
  const sha256RegExp = regEx(/(^|\s)sha256(\s)/);
  let i = content.search(sha256RegExp);
  if (isSpace(content[i])) {
    i += 1;
  }
  return parseSha256(i, content);
}

function parseUrl(idx: number, content: string): string | null {
  let i = idx;
  i += 'url'.length;
  i = skip(i, content, (c) => isSpace(c));
  const chr = content[i];
  if (chr !== '"' && chr !== "'") {
    return null;
  }
  i += 1;
  const j = skip(i, content, (c) => c !== '"' && c !== "'" && !isSpace(c));
  const url = content.slice(i, j);
  return url;
}

function extractUrl(content: string): string | null {
  const urlRegExp = regEx(/(^|\s)url(\s)/);
  let i = content.search(urlRegExp);
  // content.search() returns -1 if not found
  if (i === -1) {
    return null;
  }
  if (isSpace(content[i])) {
    i += 1;
  }
  return parseUrl(i, content);
}

export function parseNpmUrlPath(
  urlStr: string | null | undefined,
): NpmUrlParsedResult | null {
  if (!urlStr) {
    return null;
  }
  try {
    const url = new URL(urlStr);
    if (url.hostname !== 'registry.npmjs.org') {
      return null;
    }
    const pathname = url.pathname;

    // NPM URL patterns:
    // Scoped:   /@scope/name/-/name-version.tgz
    // Unscoped: /name/-/name-version.tgz

    // Try scoped package pattern first
    const scopedRegex = regEx(/^\/@([^/]+)\/([^/]+)\/-\/\2-(.+)\.tgz$/);
    const scopedMatch = scopedRegex.exec(pathname);
    if (scopedMatch) {
      const [, scope, name, version] = scopedMatch;
      return {
        type: 'npm',
        packageName: `@${scope}/${name}`,
        currentValue: version,
      };
    }

    // Try unscoped package pattern
    const unscopedRegex = regEx(/^\/([^@][^/]*)\/-\/\1-(.+)\.tgz$/);
    const unscopedMatch = unscopedRegex.exec(pathname);
    if (unscopedMatch) {
      const [, name, version] = unscopedMatch;
      return {
        type: 'npm',
        packageName: name,
        currentValue: version,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseUrlPath(
  urlStr: string | null | undefined,
): UrlParsedResult | null {
  if (!urlStr) {
    return null;
  }

  // Try NPM URL parsing first
  const npmResult = parseNpmUrlPath(urlStr);
  if (npmResult) {
    return npmResult;
  }

  // Fall back to GitHub URL parsing
  try {
    const url = new URL(urlStr);
    if (url.hostname !== 'github.com') {
      return null;
    }
    let s = url.pathname.split('/');
    s = s.filter((val) => val);
    const ownerName = s[0];
    const repoName = s[1];
    let currentValue: string | undefined;
    if (s[2] === 'archive') {
      // old archive url in form: [...]/archive/<tag>.tar.gz
      currentValue = s[3];
      if (currentValue === 'refs') {
        // new archive url in form: [...]/archive/refs/tags/<tag>.tar.gz
        currentValue = s[5];
      }
      const targz = currentValue.slice(
        currentValue.length - 7,
        currentValue.length,
      );
      if (targz === '.tar.gz') {
        currentValue = currentValue.substring(0, currentValue.length - 7);
      }
    } else if (s[2] === 'releases' && s[3] === 'download') {
      currentValue = s[4];
    }
    if (!currentValue) {
      return null;
    }
    return { type: 'github', currentValue, ownerName, repoName };
  } catch {
    return null;
  }
}

/* This function parses the "class className < Formula" header
   and returns the className and index of the character just after the header */
function parseClassHeader(idx: number, content: string): string | null {
  let i = idx;
  i += 'class'.length;
  i = skip(i, content, (c) => isSpace(c));
  // Skip all non space and non '<' characters
  let j = skip(i, content, (c) => !isSpace(c) && c !== '<');
  const className = content.slice(i, j);
  i = j;
  // Skip spaces
  i = skip(i, content, (c) => isSpace(c));
  if (content[i] === '<') {
    i += 1;
  } else {
    return null;
  } // Skip spaces
  i = skip(i, content, (c) => isSpace(c));
  // Skip non-spaces
  j = skip(i, content, (c) => !isSpace(c));
  if (content.slice(i, j) !== 'Formula') {
    return null;
  }
  return className;
}

function extractClassName(content: string): string | null {
  const classRegExp = regEx(/(^|\s)class\s/);
  let i = content.search(classRegExp);
  if (isSpace(content[i])) {
    i += 1;
  }
  return parseClassHeader(i, content);
}

// TODO: Maybe check if quotes/double-quotes are balanced (#9591)
export function extractPackageFile(content: string): PackageFileContent | null {
  logger.trace('extractPackageFile()');
  /*
    1. match "class className < Formula"
    2. extract className
    3. extract url field (get depName from url)
    4. extract sha256 field
  */
  const cleanContent = removeComments(content);
  const className = extractClassName(cleanContent);
  if (!className) {
    logger.debug('Invalid class definition');
    return null;
  }
  const url = extractUrl(cleanContent);
  if (!url) {
    logger.debug('Invalid URL field');
  }
  const urlPathResult = parseUrlPath(url);
  const sha256 = extractSha256(cleanContent);
  let skipReason: SkipReason | undefined;
  let dep: PackageDependency;

  if (urlPathResult?.type === 'npm') {
    // NPM package handling
    dep = {
      depName: urlPathResult.packageName,
      managerData: {
        packageName: urlPathResult.packageName,
        sha256,
        url,
      },
      currentValue: urlPathResult.currentValue,
      datasource: NpmDatasource.id,
    };
  } else if (urlPathResult?.type === 'github') {
    // GitHub package handling
    dep = {
      // TODO: types (#22198)
      depName: `${urlPathResult.ownerName}/${urlPathResult.repoName}`,
      managerData: {
        ownerName: urlPathResult.ownerName,
        repoName: urlPathResult.repoName,
        sha256,
        url,
      },
      currentValue: urlPathResult.currentValue,
      datasource: GithubTagsDatasource.id,
    };
  } else {
    // Unsupported URL
    logger.debug('Error: Unsupported URL field');
    skipReason = 'unsupported-url';
    dep = {
      depName: className,
      managerData: {
        ownerName: null,
        repoName: null,
        sha256,
        url,
      },
      currentValue: null,
      datasource: undefined,
    };
  }

  if (sha256?.length !== 64) {
    logger.debug('Error: Invalid sha256 field');
    skipReason = 'invalid-sha256';
  }

  if (skipReason) {
    dep.skipReason = skipReason;
    if (skipReason === 'unsupported-url') {
      dep.depName = className;
      dep.datasource = undefined;
    }
  }
  const deps = [dep];
  return { deps };
}
