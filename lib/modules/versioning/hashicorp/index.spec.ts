import { api as semver } from '.';

describe('modules/versioning/hashicorp/index', () => {
  test.each`
    version     | range                                          | expected
    ${'4.2.0'}  | ${'~> 4.0'}                                    | ${true}
    ${'4.2.0'}  | ${'~> 4.0.0'}                                  | ${false}
    ${'4.6.0'}  | ${'~> 4.0, >= 4.5.0'}                          | ${true}
    ${'4.2.0'}  | ${'~> 4.0, >= 4.5.0'}                          | ${false}
    ${'3.56.0'} | ${'>= 2.0.0, >= 2.33.0, >= 3.44.0, ~> 3.56.0'} | ${true}
    ${'4.2.0'}  | ${'>= 2.0.0, >= 2.33.0, >= 3.44.0, ~> 3.56.0'} | ${false}
  `(
    'matches("$version", "$range") === $expected',
    ({ version, range, expected }) => {
      expect(semver.matches(version, range)).toBe(expected);
    }
  );

  test.each`
    versions                                         | range         | expected
    ${['0.4.0', '0.5.0', '4.0.0', '4.2.0', '5.0.0']} | ${'~> 4.0'}   | ${'4.2.0'}
    ${['0.4.0', '0.5.0', '4.0.0', '4.2.0', '5.0.0']} | ${'~> 4.0.0'} | ${'4.0.0'}
  `(
    'getSatisfyingVersion($versions, "$range") === $expected',
    ({ versions, range, expected }) => {
      expect(semver.getSatisfyingVersion(versions, range)).toBe(expected);
    }
  );

  test.each`
    input                   | expected
    ${'>= 1.0.0, <= 2.0.0'} | ${true}
  `('isValid("$input") === $expected', ({ input, expected }) => {
    const res = !!semver.isValid(input);
    expect(res).toBe(expected);
  });

  test.each`
    version    | range                   | expected
    ${'0.9.0'} | ${'>= 1.0.0, <= 2.0.0'} | ${true}
    ${'1.9.0'} | ${'>= 1.0.0, <= 2.0.0'} | ${false}
  `(
    'isLessThanRange($version, $range) === $expected',
    ({ version, range, expected }) => {
      expect(semver.isLessThanRange?.(version, range)).toBe(expected);
    }
  );

  test.each`
    versions                                | range         | expected
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']} | ${'~> 4.0'}   | ${'4.2.0'}
    ${['0.4.0', '0.5.0', '4.2.0', '5.0.0']} | ${'~> 4.0.0'} | ${null}
  `(
    'minSatisfyingVersion($versions, "$range") === $expected',
    ({ versions, range, expected }) => {
      expect(semver.minSatisfyingVersion(versions, range)).toBe(expected);
    }
  );

  test.each`
    currentValue                        | rangeStrategy        | currentVersion | newVersion  | expected
    ${'>= 2.0.0, >= 2.33.0, >= 3.56.0'} | ${'replace'}         | ${'3.56.0'}    | ${'3.73.0'} | ${'>= 2.0.0, >= 2.33.0, >= 3.56.0'}
    ${'~> 1.2'}                         | ${'replace'}         | ${'1.2.3'}     | ${'2.0.7'}  | ${'~> 2.0'}
    ${'~> 1.2.0'}                       | ${'replace'}         | ${'1.2.3'}     | ${'2.0.7'}  | ${'~> 2.0.0'}
    ${'~> 0.14.0'}                      | ${'replace'}         | ${'0.14.1'}    | ${'0.15.0'} | ${'~> 0.15.0'}
    ${'~> 0.14.0'}                      | ${'replace'}         | ${'0.14.1'}    | ${'0.15.1'} | ${'~> 0.15.0'}
    ${'~> 0.14.6'}                      | ${'replace'}         | ${'0.14.6'}    | ${'0.15.0'} | ${'~> 0.15.0'}
    ${'>= 1.0.0, <= 2.0.0'}             | ${'replace'}         | ${'1.2.3'}     | ${'2.0.7'}  | ${'>= 1.0.0, <= 2.0.7'}
    ${'>= 1.0.0, <= 2.0.0'}             | ${'widen'}           | ${'1.2.3'}     | ${'2.0.7'}  | ${'>= 1.0.0, <= 2.0.7'}
    ${'>= 2.0.0, >= 3.38.0, ~> 4.0'}    | ${'replace'}         | ${'4.13.0'}    | ${'4.14.0'} | ${'>= 2.0.0, >= 3.38.0, ~> 4.0'}
    ${'>= 2.0.0, >= 3.38.0, ~> 4.0'}    | ${'replace'}         | ${'4.13.0'}    | ${'5.0.0'}  | ${'>= 2.0.0, >= 3.38.0, ~> 5.0'}
    ${'0.14'}                           | ${'replace'}         | ${'0.14.2'}    | ${'0.15.0'} | ${'0.15'}
    ${'~> 0.14'}                        | ${'replace'}         | ${'0.14.2'}    | ${'0.15.0'} | ${'~> 0.14'}
    ${'~> 0.14'}                        | ${'update-lockfile'} | ${'0.14.2'}    | ${'0.14.6'} | ${'~> 0.14'}
    ${'~> 0.14'}                        | ${'update-lockfile'} | ${'0.14.2'}    | ${'0.15.0'} | ${'~> 0.14'}
    ${'~> 2.62.0'}                      | ${'update-lockfile'} | ${'2.62.0'}    | ${'2.62.1'} | ${'~> 2.62.0'}
    ${'~> 2.62.0'}                      | ${'update-lockfile'} | ${'2.62.0'}    | ${'2.67.0'} | ${'~> 2.67.0'}
  `(
    'getNewValue("$currentValue", "$rangeStrategy", "$currentVersion", "$newVersion") === "$expected"',
    ({ currentValue, rangeStrategy, currentVersion, newVersion, expected }) => {
      const res = semver.getNewValue({
        currentValue,
        rangeStrategy,
        currentVersion,
        newVersion,
      });
      expect(res).toEqual(expected);
    }
  );

  test.each`
    currentValue | rangeStrategy | currentVersion | newVersion   | expected
    ${'v0.14'}   | ${'replace'}  | ${'v0.14.2'}   | ${'v0.15.0'} | ${'v0.15'}
  `(
    'getNewValue("$currentValue", "$rangeStrategy", "$currentVersion", "$newVersion") === "$expected"',
    ({ currentValue, rangeStrategy, currentVersion, newVersion, expected }) => {
      const res = semver.getNewValue({
        currentValue,
        rangeStrategy,
        currentVersion,
        newVersion,
      });
      expect(res).toEqual(expected);
    }
  );
});
