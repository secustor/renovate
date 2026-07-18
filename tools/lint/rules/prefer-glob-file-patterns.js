/**
 * Matches Renovate's regex-pattern convention for string-match config values
 * (see `isRegexMatch()` in `lib/util/string-match.ts`): an optional negation
 * prefix `!` followed by a leading `/`, and a trailing `/` with an optional
 * `i` flag. Everything else is interpreted as a glob.
 */
const regexPattern = /^!?\/.*\/i?$/;

/**
 * Escape sequences that stand for a single literal character. Anything else
 * after a backslash (`\w`, `\d`, `\s`, `\b`, ...) is a character class with no
 * exact glob equivalent.
 */
const literalEscapes = new Set(['.', '/', '-', '_']);

/**
 * Characters that make a regex non-trivial to express as a glob:
 * - `.` (unescaped): matches any character, unlike a glob literal
 * - `[` / `]`: character classes cannot be repeated in globs
 * - `*` / `+`: unbounded repetition (e.g. `.+` crosses `/`, unlike glob `*`)
 * - `{` / `}`: counted repetition
 */
const nonTrivialChars = new Set(['.', '[', ']', '*', '+', '{', '}']);

/**
 * A regex-style managerFilePatterns value is only flagged when it is
 * "trivially glob-expressible": anchored with `$`, and built solely from
 * literal text, escaped literal characters, `?`-optional groups/characters,
 * and alternations of those (e.g. `/(^|/)Chart\.ya?ml$/` =>
 * `**\/Chart.{yaml,yml}`). Renovate's glob matching (minimatch with
 * `{ dot: true, nocase: true }`) can express these with an identical match
 * set, except for case-insensitivity, which is documented Renovate behavior
 * for glob patterns. Constructs like `.+`, `.*`, `\w`, or character classes
 * have no exact glob equivalent and are intentionally not flagged.
 *
 * @param {string} pattern
 * @returns {boolean}
 */
function isTriviallyGlobExpressible(pattern) {
  const body = pattern.replace(/^!?\//, '').replace(/\/i?$/, '');
  if (!body.endsWith('$')) {
    // Unanchored regexes match path prefixes/substrings, which globs cannot.
    return false;
  }
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '\\') {
      if (!literalEscapes.has(body[i + 1])) {
        return false;
      }
      i += 1;
      continue;
    }
    if (nonTrivialChars.has(c)) {
      return false;
    }
  }
  return true;
}

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
            regexPattern.test(element.value) &&
            isTriviallyGlobExpressible(element.value)
          ) {
            context.report({ node: element, messageId: 'preferGlob' });
          }
        }
      },
    };
  },
};
