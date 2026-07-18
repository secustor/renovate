import { getParentName } from './utils.ts';

describe('config/validation-helpers/utils', () => {
  describe('getParentName()', () => {
    it('ignores encrypted in root', () => {
      expect(getParentName('encrypted')).toBeEmptyString();
    });

    it('handles array types', () => {
      expect(getParentName('hostRules[1]')).toBe('hostRules');
    });

    it('handles encrypted within array types', () => {
      expect(getParentName('hostRules[0].encrypted')).toBe('hostRules');
    });

    it('returns the last segment of a dotted path', () => {
      expect(getParentName('config.hostRules')).toBe('hostRules');
    });

    it('returns dot for undefined path', () => {
      expect(getParentName(undefined)).toBe('.');
    });
  });
});
