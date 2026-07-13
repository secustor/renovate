import enforceTsExtension from './rules/enforce-ts-extension.js';
import noHardcodedDocsUrl from './rules/no-hardcoded-docs-url.js';
import noNewUrl from './rules/no-new-url.js';
import noToolsImport from './rules/no-tools-import.js';
import preferPartialInSpecs from './rules/prefer-partial-in-specs.js';
import testRootDescribe from './rules/test-root-describe.js';
import zodSchemaNaming from './rules/zod-schema-naming.js';

export default {
  meta: {
    name: 'renovate',
  },
  rules: {
    'enforce-ts-extension': enforceTsExtension,
    'no-hardcoded-docs-url': noHardcodedDocsUrl,
    'no-new-url': noNewUrl,
    'no-tools-import': noToolsImport,
    'prefer-partial-in-specs': preferPartialInSpecs,
    'test-root-describe': testRootDescribe,
    'zod-schema-naming': zodSchemaNaming,
  },
};
