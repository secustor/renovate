import crypto from 'node:crypto';
import path from "node:path";
import extract from 'extract-zip';
import upath from 'upath';
import { logger } from '../../../../logger';
import {
  coerceArray,
  deduplicateArray,
  isNotNullOrUndefined,
} from '../../../../util/array';
import { cache } from '../../../../util/cache/package/decorator';
import * as fs from '../../../../util/fs';
import { ensureCacheDir } from '../../../../util/fs';
import { Http } from '../../../../util/http';
import * as p from '../../../../util/promises';
import { TerraformProviderDatasource } from '../../../datasource/terraform-provider';
import type { TerraformBuild } from '../../../datasource/terraform-provider/types';

export class TerraformProviderHash {
  static http = new Http(TerraformProviderDatasource.id);

  static terraformDatasource = new TerraformProviderDatasource();

  static hashCacheTTL = 10080; // in minutes == 1 week

  private static async hashFiles(baseDir: string, files: string[]): Promise<string> {
    const rootHash = crypto.createHash('sha256');

    for (const file of files) {
      const relativePath = path.relative(baseDir,file)

      // build for every file a line looking like "aaaaaaaaaaaaaaa  file.txt\n"
      const hash = crypto.createHash('sha256');

      // a sha256sum displayed as lowercase hex string to root hash
      const fileBuffer = await fs.readCacheFile(file);
      hash.update(fileBuffer);
      rootHash.update(hash.digest('hex'));

      // add double space, the filename and a new line char
      rootHash.update('  ');
      rootHash.update(relativePath);
      rootHash.update('\n');
    }

    return rootHash.digest('base64');
  }

  public static async hashOfZipContent(
    zipFilePath: string,
    extractPath: string,
  ): Promise<string> {
    await extract(zipFilePath, { dir: extractPath });
    const contentList = await fs.listCacheDir(extractPath, {recursive: true});

    // ignore directories and dot files
    const files = contentList.filter((content => content.isFile()));
    const filesWithPath = files.map(content => `${content.path}/${content.name}`)

    const result = await TerraformProviderHash.hashFiles(extractPath,filesWithPath);

    // delete extracted files
    await fs.rmCache(extractPath);

    return result;
  }

  @cache({
    namespace: `datasource-${TerraformProviderDatasource.id}-build-hashes`,
    key: (build: TerraformBuild) => build.url,
    ttlMinutes: TerraformProviderHash.hashCacheTTL,
  })
  static async calculateSingleHash(
    build: TerraformBuild,
    cacheDir: string,
  ): Promise<string> {
    const downloadFileName = upath.join(cacheDir, build.filename);
    const extractPath = upath.join(cacheDir, 'extract', build.filename);
    logger.trace(
      `Downloading archive and generating hash for ${build.name}-${build.version}...`,
    );
    const readStream = TerraformProviderHash.http.stream(build.url);
    const writeStream = fs.createCacheWriteStream(downloadFileName);

    try {
      await fs.pipeline(readStream, writeStream);

      const hash = await this.hashOfZipContent(downloadFileName, extractPath);
      logger.trace(
        { hash },
        `Generated hash for ${build.name}-${build.version}`,
      );
      return hash;
    } finally {
      // delete zip file
      await fs.rmCache(downloadFileName);
    }
  }

  static async calculateHashScheme1Hashes(
    builds: TerraformBuild[],
  ): Promise<string[]> {
    const cacheDir = await ensureCacheDir('./others/terraform');

    // for each build download ZIP, extract content and generate hash for all containing files
    return p.map(builds, (build) => this.calculateSingleHash(build, cacheDir), {
      concurrency: 4,
    });
  }

  static async createHashes(
    registryURL: string,
    repository: string,
    version: string,
  ): Promise<string[] | null> {
    const builds = await TerraformProviderHash.terraformDatasource.getBuilds(
      registryURL,
      repository,
      version,
    );
    if (!builds) {
      return null;
    }

    // check if the publisher uses one shasum file for all builds or separate ones
    // we deduplicate to reduce the number of API calls
    const shaUrls = deduplicateArray(
      builds.map((build) => build.shasums_url).filter(isNotNullOrUndefined),
    );

    const zhHashes: string[] = [];
    for (const shaUrl of shaUrls) {
      const hashes =
        await TerraformProviderHash.terraformDatasource.getZipHashes(shaUrl);

      zhHashes.push(...coerceArray(hashes));
    }

    const h1Hashes =
      await TerraformProviderHash.calculateHashScheme1Hashes(builds);

    const hashes = [];
    hashes.push(...h1Hashes.map((hash) => `h1:${hash}`));
    hashes.push(...zhHashes.map((hash) => `zh:${hash}`));

    // sorting the hash alphabetically as terraform does this as well
    return hashes.sort();
  }
}
