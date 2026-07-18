import type { DataFile } from './data-files.generated.ts';
import dataFiles from './data-files.generated.ts';

/**
 * Reads an embedded data file which is guaranteed to be present, as the map is
 * generated at build time.
 */
export function getDataFile(key: DataFile): string {
  const content = dataFiles.get(key);
  /* v8 ignore if -- unreachable: data files are bundled at build time */
  if (content === undefined) {
    throw new Error(`Missing data file: ${key}`);
  }
  return content;
}
