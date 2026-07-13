/**
 * Matches Renovate's regex-pattern convention for string-match config values
 * (see `isRegexMatch()` in `lib/util/string-match.ts`): an optional negation
 * prefix `!` followed by a leading `/`, and a trailing `/` with an optional
 * `i` flag. Everything else is interpreted as a glob.
 */
const regexPattern = /^!?\/.*\/i?$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    messages: {
      preferGlob:
        "Prefer glob syntax for managerFilePatterns where the pattern allows (e.g. '**/build.xml').",
    },
  },
  create(context) {
    /**
     * @param {import('estree').Property} node
     * @returns {string | null}
     */
    function getKeyName(node) {
      if (node.key.type === 'Identifier') {
        return node.key.name;
      }
      if (node.key.type === 'Literal' && typeof node.key.value === 'string') {
        return node.key.value;
      }
      return null;
    }

    return {
      Property(node) {
        if (
          getKeyName(node) !== 'managerFilePatterns' ||
          node.value.type !== 'ArrayExpression'
        ) {
          return;
        }
        for (const element of node.value.elements) {
          if (
            element?.type === 'Literal' &&
            typeof element.value === 'string' &&
            regexPattern.test(element.value)
          ) {
            context.report({ node: element, messageId: 'preferGlob' });
          }
        }
      },
    };
  },
};
