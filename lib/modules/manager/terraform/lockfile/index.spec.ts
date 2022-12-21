import { join } from 'upath';
import { Fixtures } from '../../../../../test/fixtures';
import { fs, mocked } from '../../../../../test/util';
import { GlobalConfig } from '../../../../config/global';
import { getPkgReleases } from '../../../datasource';
import type { UpdateArtifactsConfig } from '../../types';
import { updateArtifacts } from '../index';
import { TerraformProviderHash } from './hash';

// auto-mock fs
jest.mock('../../../../util/fs');
jest.mock('./hash');
jest.mock('../../../datasource');

const config = {
  constraints: {},
};

const adminConfig = {
  // `join` fixes Windows CI
  localDir: join('/tmp/github/some/repo'),
  cacheDir: join('/tmp/renovate/cache'),
  containerbaseDir: join('/tmp/renovate/cache/containerbase'),
};

const validLockfile = Fixtures.get('validLockfile.hcl');
const validLockfile2 = Fixtures.get('validLockfile2.hcl');

const mockHash = mocked(TerraformProviderHash).createHashes;
const mockGetPkgReleases = getPkgReleases as jest.MockedFunction<
  typeof getPkgReleases
>;

describe('modules/manager/terraform/lockfile/index', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    GlobalConfig.set(adminConfig);
  });

  it('returns null if no .terraform.lock.hcl found', async () => {
    fs.readLocalFile.mockResolvedValueOnce('');

    expect(
      await updateArtifacts({
        packageFileName: 'main.tf',
        updatedDeps: [{ depName: 'aws' }],
        newPackageFileContent: '',
        config,
      })
    ).toBeNull();
  });

  it('returns null if .terraform.lock.hcl is empty', async () => {
    fs.readLocalFile.mockResolvedValueOnce('empty');

    expect(
      await updateArtifacts({
        packageFileName: 'main.tf',
        updatedDeps: [{ depName: 'aws' }],
        newPackageFileContent: '',
        config,
      })
    ).toBeNull();
  });

  it('update single dependency with exact constraint and depType provider', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('.terraform.lock.hcl');

    mockHash.mockResolvedValueOnce([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'main.tf',
      updatedDeps: [
        {
          depName: 'hashicorp/aws',
          packageName: 'hashicorp/aws',
          depType: 'provider',
          newVersion: '3.36.0',
          newValue: '3.36.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: '.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('update single dependency with exact constraint and and depType required_provider', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('.terraform.lock.hcl');

    mockHash.mockResolvedValueOnce([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'main.tf',
      updatedDeps: [
        {
          depName: 'hashicorp/aws',
          packageName: 'hashicorp/aws',
          depType: 'required_provider',
          newVersion: '3.36.0',
          newValue: '3.36.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: '.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('do not update dependency with depType module', async () => {
    const result = await updateArtifacts({
      packageFileName: 'main.tf',
      updatedDeps: [
        {
          depName: 'terraform-aws-modules/vpc/aws',
          packageName: 'terraform-aws-modules/vpc/aws',
          depType: 'module',
          newVersion: '3.36.0',
          newValue: '3.36.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).toBeNull();
  });

  it('update single dependency with range constraint and minor update from private registry', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('.terraform.lock.hcl');

    mockHash.mockResolvedValueOnce([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'main.tf',
      updatedDeps: [
        {
          depName: 'azurerm',
          depType: 'provider',
          packageName: 'azurerm',
          registryUrls: ['https://registry.example.com'],
          newVersion: '2.56.0',
          newValue: '~> 2.50',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: '.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('update single dependency with range constraint and major update', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('.terraform.lock.hcl');

    mockHash.mockResolvedValueOnce([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'main.tf',
      updatedDeps: [
        {
          depName: 'random',
          packageName: 'hashicorp/random',
          depType: 'provider',
          newVersion: '3.1.0',
          newValue: '~> 3.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: '.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('update single dependency in subfolder', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('test/.terraform.lock.hcl');

    mockHash.mockResolvedValueOnce([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'test/main.tf',
      updatedDeps: [
        {
          depName: 'random',
          packageName: 'hashicorp/random',
          depType: 'provider',
          newVersion: '3.1.0',
          newValue: '~> 3.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: 'test/.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('update multiple dependencies which are not ordered', async () => {
    fs.readLocalFile.mockResolvedValue(validLockfile2);
    fs.getSiblingFileName.mockReturnValue('test/.terraform.lock.hcl');

    mockHash.mockResolvedValue([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const result = await updateArtifacts({
      packageFileName: 'test/main.tf',
      updatedDeps: [
        {
          depName: 'aws',
          packageName: 'hashicorp/aws',
          depType: 'provider',
          newVersion: '3.1.0',
          newValue: '~> 3.0',
        },
        {
          depName: 'random',
          packageName: 'hashicorp/random',
          depType: 'provider',
          newVersion: '3.1.0',
          newValue: '~> 3.0',
        },
        {
          depName: 'azurerm',
          packageName: 'hashicorp/azurerm',
          depType: 'provider',
          newVersion: '2.56.0',
          newValue: '~> 2.50',
        },
        {
          depName: 'proxmox',
          packageName: 'Telmate/proxmox',
          depType: 'provider',
          newVersion: '2.7.0',
          newValue: '~> 2.7.0',
        },
      ],
      newPackageFileContent: '',
      config,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);
    expect(result?.[0].file).not.toBeNull();
    expect(result?.[0].file).toMatchSnapshot({
      type: 'addition',
      path: 'test/.terraform.lock.hcl',
    });

    expect(mockHash.mock.calls).toBeArrayOfSize(4);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('do full lock file maintenance', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('.terraform.lock.hcl');

    mockGetPkgReleases
      .mockResolvedValueOnce({
        // aws
        releases: [
          {
            version: '2.30.0',
          },
          {
            version: '3.0.0',
          },
          {
            version: '3.36.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // azurerm
        releases: [
          {
            version: '2.50.0',
          },
          {
            version: '2.55.0',
          },
          {
            version: '2.56.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // random
        releases: [
          {
            version: '2.2.1',
          },
          {
            version: '2.2.2',
          },
          {
            version: '3.0.0',
          },
        ],
      });
    mockHash.mockResolvedValue([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };

    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);

    result?.forEach((value) => expect(value.file).not.toBeNull());
    result?.forEach((value) => expect(value.file).toMatchSnapshot());

    expect(mockHash.mock.calls).toBeArrayOfSize(2);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('do full lock file maintenance with lockfile in subfolder', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);
    fs.getSiblingFileName.mockReturnValueOnce('subfolder/.terraform.lock.hcl');

    mockGetPkgReleases
      .mockResolvedValueOnce({
        // aws
        releases: [
          {
            version: '2.30.0',
          },
          {
            version: '3.0.0',
          },
          {
            version: '3.36.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // azurerm
        releases: [
          {
            version: '2.50.0',
          },
          {
            version: '2.55.0',
          },
          {
            version: '2.56.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // random
        releases: [
          {
            version: '2.2.1',
          },
          {
            version: '2.2.2',
          },
          {
            version: '3.0.0',
          },
        ],
      });
    mockHash.mockResolvedValue([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };

    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).not.toBeNull();
    expect(result).toBeArrayOfSize(1);

    result?.forEach((value) => expect(value.file).not.toBeNull());
    result?.forEach((value) =>
      expect(value.file).toMatchSnapshot({
        type: 'addition',
        path: 'subfolder/.terraform.lock.hcl',
      })
    );

    expect(mockHash.mock.calls).toBeArrayOfSize(2);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('do full lock file maintenance without necessary changes', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);

    mockGetPkgReleases
      .mockResolvedValueOnce({
        // aws
        releases: [
          {
            version: '2.30.0',
          },
          {
            version: '3.0.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // azurerm
        releases: [
          {
            version: '2.50.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // random
        releases: [
          {
            version: '2.2.1',
          },
        ],
      });
    mockHash.mockResolvedValue([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };
    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).toBeNull();

    expect(mockHash.mock.calls).toBeArrayOfSize(0);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('return null if hashing fails', async () => {
    fs.readLocalFile.mockResolvedValueOnce(validLockfile);

    mockGetPkgReleases
      .mockResolvedValueOnce({
        // aws
        releases: [
          {
            version: '2.30.0',
          },
          {
            version: '3.0.0',
          },
          {
            version: '3.36.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // azurerm
        releases: [
          {
            version: '2.50.0',
          },
          {
            version: '2.55.0',
          },
          {
            version: '2.56.0',
          },
        ],
      })
      .mockResolvedValueOnce({
        // random
        releases: [
          {
            version: '2.2.1',
          },
          {
            version: '2.2.2',
          },
          {
            version: '3.0.0',
          },
        ],
      });
    mockHash.mockResolvedValue(null);

    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };

    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).toBeNull();

    expect(mockHash.mock.calls).toBeArrayOfSize(2);
    expect(mockHash.mock.calls).toMatchSnapshot();
  });

  it('return null if experimental flag is not set', async () => {
    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };
    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).toBeNull();
  });

  it('do not rewrite constraint if not necessary', async () => {
    const fixture = `
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "4.17.0"
  constraints = "~> 4.0, >= 4.5.0"
  hashes = [
    "h1:0i4o/1AEBOIW/fr3C45vJlG350FfRzSldJcWfViOFLc=",
    "h1:FtkENM8QDK6CLhBr4k97kx26G2CqHZk9q5sNhHcnYRc=",
    "zh:2cc932fb0af13850de3c60a5318b695c82973489c140ca4f13218f69136c36e5",
    "zh:4018884d66acfa8273f7100ef0334004ed8a3790ffc7621eaef65d1d9c3fab43",
    "zh:6a7769e5c81e543f5deaaa8596e45f92244a61f5026c8c66d5bf55f2a7fd4801",
    "zh:7956c1e17ec7647af3612cc98cbcd21d50b2d9f5e41c676b62ee214f5610c29f",
    "zh:833d9d608dbffda7da565004ef592a8a364e96b5c13cacf873f5d32714e197ff",
    "zh:9b12af85486a96aedd8d7984b0ff811a4b42e3d88dad1a3fb4c0b580d04fa425",
    "zh:a55b8b72e47999d9c7aecaa009797ed7eb3f669a719d3f6127ee5e0f1b91ecc2",
    "zh:a6f2377d71dfba9669f060e687498e589b490366026821bd83451ac9ef0cd9e8",
    "zh:b006aa281097b3db27a62ea3c8cfaf4c4d979d57f4a6c180bd2da3d0ab4bd61a",
    "zh:d6a6d29256fee6c3b35384719c84c19b13dcccc53bffce5f529023607d130d0b",
    "zh:edc155e147883872e1227aa6a4ef3205fa9de421475d96c20a34a5eaff3df01f",
    "zh:f25773dcc00dead0412e222cf3891ac6228dcb4d69da9bacfca305a0a2a1db56",
  ]
}`;
    fs.readLocalFile.mockResolvedValueOnce(fixture);

    mockGetPkgReleases.mockResolvedValueOnce({
      // aws
      releases: [
        {
          version: '4.17.0',
        },
        {
          version: '4.20.0',
        },
        {
          version: '4.20.1',
        },
      ],
    });
    mockHash.mockResolvedValue([
      'h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=',
      'h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=',
    ]);

    const localConfig: UpdateArtifactsConfig = {
      updateType: 'lockFileMaintenance',
      ...config,
    };
    const result = await updateArtifacts({
      packageFileName: '',
      updatedDeps: [],
      newPackageFileContent: '',
      config: localConfig,
    });
    expect(result).not.toBeNull();
    expect(result).toIncludeAllPartialMembers([
      {
        file: {
          type: 'addition',
          contents: `
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "4.20.1"
  constraints = "~> 4.0, >= 4.5.0"
  hashes = [
    "h1:lDsKRxDRXPEzA4AxkK4t+lJd3IQIP2UoaplJGjQSp2s=",
    "h1:6zB2hX7YIOW26OrKsLJn0uLMnjqbPNxcz9RhlWEuuSY=",
  ]
}`,
        },
      },
    ]);
    expect(mockHash.mock.calls).toBeArrayOfSize(1);
    expect(mockHash.mock.calls).toMatchObject([
      ['https://registry.terraform.io', 'hashicorp/aws', '4.20.1'],
    ]);
  });
});
