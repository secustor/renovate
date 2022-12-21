import is from '@sindresorhus/is';
import type { RangeStrategy } from '../../../types';
import { api as ruby } from '../ruby';
import type { NewValueConfig, VersioningApi } from '../types';

export const id = 'hashicorp';
export const displayName = 'Hashicorp';
export const urls = [
  'https://www.terraform.io/docs/configuration/terraform.html#specifying-a-required-terraform-version',
];
export const supportsRanges = true;
export const supportedRangeStrategies: RangeStrategy[] = [
  'bump',
  'widen',
  'pin',
  'replace',
];

function getNewValue({
  currentValue,
  rangeStrategy,
  currentVersion,
  newVersion,
}: NewValueConfig): string | null {
  // remove additional 'v' from newVersion
  const massagedNewVersion = newVersion.startsWith('v')
    ? newVersion.replace('v', '')
    : newVersion;
  const newValue = ruby.getNewValue({
    currentValue,
    rangeStrategy,
    currentVersion,
    newVersion: massagedNewVersion,
  });

  // if the current value is a partial version e.g. '0.15'
  // shorten it to the same length
  if (isVersion(currentValue) && !is.nullOrUndefined(newValue)) {
    return newValue.substring(0, currentValue.length);
  }

  return newValue;
}

export const api: VersioningApi = {
  ...ruby,
  getNewValue,
};

// eslint-disable-next-line @typescript-eslint/unbound-method
export const { isVersion } = api;

export default api;
