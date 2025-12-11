import { codeBlock } from 'common-tags';
import { extractPackageFile, parseNpmUrlPath } from '.';
import { Fixtures } from '~test/fixtures';

const aide = Fixtures.get('aide.rb');
const ibazel = Fixtures.get('ibazel.rb');
const claudeCode = Fixtures.get('claude-code.rb.sample');

describe('modules/manager/homebrew/extract', () => {
  describe('extractPackageFile()', () => {
    it('skips sourceforge dependency 1', () => {
      const content = codeBlock`
        class Aalib < Formula
        desc "Portable ASCII art graphics library"
        homepage "https://aa-project.sourceforge.io/aalib/"
        url "https://downloads.sourceforge.net/aa-project/aalib-1.4rc5.tar.gz"
        sha256 "fbddda9230cf6ee2a4f5706b4b11e2190ae45f5eda1f0409dc4f99b35e0a70ee"
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Aalib',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256:
                'fbddda9230cf6ee2a4f5706b4b11e2190ae45f5eda1f0409dc4f99b35e0a70ee',
              url: 'https://downloads.sourceforge.net/aa-project/aalib-1.4rc5.tar.gz',
            },
            skipReason: 'unsupported-url',
          },
        ],
      });
    });

    it('skips sourceforge dependency 2', () => {
      const content = codeBlock`
        class Aap < Formula
        desc "Make-like tool to download, build, and install software"
        homepage "http://www.a-a-p.org"
        url "https://downloads.sourceforge.net/project/a-a-p/aap-1.094.zip"
        sha256 "3f53b2fc277756042449416150acc477f29de93692944f8a77e8cef285a1efd8"
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Aap',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256:
                '3f53b2fc277756042449416150acc477f29de93692944f8a77e8cef285a1efd8',
              url: 'https://downloads.sourceforge.net/project/a-a-p/aap-1.094.zip',
            },
            skipReason: 'unsupported-url',
          },
        ],
      });
    });

    it('skips github dependency with wrong format', () => {
      const content = codeBlock`
        class Acmetool < Formula
        desc "Automatic certificate acquisition tool for ACME (Let's Encrypt)"
        homepage "https://github.com/hlandau/acme"
        url "https://github.com/hlandau/acme.git",
          :tag      => "v0.0.67",
          :revision => "221ea15246f0bbcf254b350bee272d43a1820285"
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Acmetool',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256: null,
              url: 'https://github.com/hlandau/acme.git',
            },
            skipReason: 'invalid-sha256',
          },
        ],
      });
    });

    it('extracts "releases" github dependency', () => {
      const res = extractPackageFile(aide);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.16.1',
            datasource: 'github-tags',
            depName: 'aide/aide',
            managerData: {
              ownerName: 'aide',
              repoName: 'aide',
              sha256:
                '0f2b7cecc70c1a27d35c06c98804fcdb9f326630de5d035afc447122186010b7',
              url: 'https://github.com/aide/aide/releases/download/v0.16.1/aide-0.16.1.tar.gz',
            },
          },
        ],
      });
    });

    it('extracts "archive" github dependency', () => {
      const res = extractPackageFile(ibazel);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.8.2',
            datasource: 'github-tags',
            depName: 'bazelbuild/bazel-watcher',
            managerData: {
              ownerName: 'bazelbuild',
              repoName: 'bazel-watcher',
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: 'https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz',
            },
          },
        ],
      });
    });

    it('handles old "archive" github url format', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.8.2',
            datasource: 'github-tags',
            depName: 'bazelbuild/bazel-watcher',
            managerData: {
              ownerName: 'bazelbuild',
              repoName: 'bazel-watcher',
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: 'https://github.com/bazelbuild/bazel-watcher/archive/v0.8.2.tar.gz',
            },
          },
        ],
      });
    });

    it('handles no space before class header', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.8.2',
            datasource: 'github-tags',
            depName: 'bazelbuild/bazel-watcher',
            managerData: {
              ownerName: 'bazelbuild',
              repoName: 'bazel-watcher',
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: 'https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz',
            },
          },
        ],
      });
    });

    it('returns null for invalid class header 1', () => {
      const content = codeBlock`
        class Ibazel !?# Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toBeNull();
    });

    it('returns null for invalid class header 2', () => {
      const content = codeBlock`
        class Ibazel < NotFormula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toBeNull();
    });

    it('skips if there is no url field', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        not_url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Ibazel',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: null,
            },
            skipReason: 'unsupported-url',
          },
        ],
      });
    });

    it('skips if invalid url protocol', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url ??https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Ibazel',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: null,
            },
            skipReason: 'unsupported-url',
          },
        ],
      });
    });

    it('skips if invalid url', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "invalid_url"
        sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: null,
            datasource: undefined,
            depName: 'Ibazel',
            managerData: {
              ownerName: null,
              repoName: null,
              sha256:
                '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4',
              url: 'invalid_url',
            },
            skipReason: 'unsupported-url',
          },
        ],
      });
    });

    it('skips if there is no sha256 field', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        not_sha256 '26f5125218fad2741d3caf937b02296d803900e5f153f5b1f733f15391b9f9b4'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.8.2',
            datasource: 'github-tags',
            depName: 'bazelbuild/bazel-watcher',
            managerData: {
              ownerName: 'bazelbuild',
              repoName: 'bazel-watcher',
              sha256: null,
              url: 'https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz',
            },
            skipReason: 'invalid-sha256',
          },
        ],
      });
    });

    it('skips if sha256 field is invalid', () => {
      const content = codeBlock`
        class Ibazel < Formula
        desc 'IBazel is a tool for building Bazel targets when source files change.'
        homepage 'https://github.com/bazelbuild/bazel-watcher'
        url "https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz"
        sha256 '26f5125218fad2741d3caf937b0229'
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: 'v0.8.2',
            datasource: 'github-tags',
            depName: 'bazelbuild/bazel-watcher',
            managerData: {
              ownerName: 'bazelbuild',
              repoName: 'bazel-watcher',
              sha256: '26f5125218fad2741d3caf937b0229',
              url: 'https://github.com/bazelbuild/bazel-watcher/archive/refs/tags/v0.8.2.tar.gz',
            },
            skipReason: 'invalid-sha256',
          },
        ],
      });
    });

    it('extracts scoped NPM package dependency', () => {
      const res = extractPackageFile(claudeCode);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: '1.0.0',
            datasource: 'npm',
            depName: '@anthropic-ai/claude-code',
            managerData: {
              packageName: '@anthropic-ai/claude-code',
              sha256:
                '0f2b7cecc70c1a27d35c06c98804fcdb9f326630de5d035afc447122186010b7',
              url: 'https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-1.0.0.tgz',
            },
          },
        ],
      });
    });

    it('extracts unscoped NPM package dependency', () => {
      const content = codeBlock`
        class Lodash < Formula
        desc "Lodash library"
        homepage "https://lodash.com"
        url "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz"
        sha256 "a2e8b4d7e3f8c6b9a5d4c8e7f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0"
        end
      `;

      const res = extractPackageFile(content);

      expect(res).toStrictEqual({
        deps: [
          {
            currentValue: '4.17.21',
            datasource: 'npm',
            depName: 'lodash',
            managerData: {
              packageName: 'lodash',
              sha256:
                'a2e8b4d7e3f8c6b9a5d4c8e7f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0',
              url: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
            },
          },
        ],
      });
    });
  });

  describe('parseNpmUrlPath()', () => {
    it('parses scoped NPM package URL', () => {
      const result = parseNpmUrlPath(
        'https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-1.0.0.tgz',
      );
      expect(result).toStrictEqual({
        type: 'npm',
        packageName: '@anthropic-ai/claude-code',
        currentValue: '1.0.0',
      });
    });

    it('parses unscoped NPM package URL', () => {
      const result = parseNpmUrlPath(
        'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
      );
      expect(result).toStrictEqual({
        type: 'npm',
        packageName: 'lodash',
        currentValue: '4.17.21',
      });
    });

    it('returns null for GitHub URLs', () => {
      const result = parseNpmUrlPath(
        'https://github.com/owner/repo/archive/v1.0.0.tar.gz',
      );
      expect(result).toBeNull();
    });

    it('returns null for invalid NPM URLs', () => {
      const result = parseNpmUrlPath('https://registry.npmjs.org/invalid');
      expect(result).toBeNull();
    });

    it('returns null for non-npmjs.org URLs', () => {
      const result = parseNpmUrlPath('https://example.com/package.tgz');
      expect(result).toBeNull();
    });

    it('returns null for null input', () => {
      const result = parseNpmUrlPath(null);
      expect(result).toBeNull();
    });
  });
});
