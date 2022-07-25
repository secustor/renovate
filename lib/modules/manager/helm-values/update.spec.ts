import { fs } from '../../../../test/util';
import * as helmValuesUpdater from './update';

describe('modules/manager/helm-values/update', () => {
  describe('.bumpPackageVersion()', () => {
    const chartContent = `
apiVersion: v2
name: test
version: 0.0.2`;
    const helmValuesContent = `
image:
  registry: docker.io
  repository: docker/whalesay
  tag: 1.0.0`;

    beforeEach(() => {
      jest.resetAllMocks();
      fs.readLocalFile = jest.fn();
    });

    it('return null on read error', async () => {
      fs.readLocalFile.mockImplementation(() => {
        throw new Error();
      });

      const { bumpedContent } = await helmValuesUpdater.bumpPackageVersion(
        helmValuesContent,
        '0.0.2',
        'patch',
        'values.yaml'
      );
      expect(bumpedContent).toBeNull();
    });

    it('increments', async () => {
      fs.readLocalFile.mockResolvedValueOnce(chartContent);

      const { bumpedContent, bumpedFiles } =
        await helmValuesUpdater.bumpPackageVersion(
          helmValuesContent,
          '0.0.2',
          'patch',
          'values.yaml'
        );
      expect(bumpedContent).toEqual(helmValuesContent);
      expect(bumpedFiles).toBeDefined();
      expect(bumpedFiles).toHaveLength(1);
      expect(bumpedFiles).toMatchObject([
        {
          fileName: 'Chart.yaml',
          newContent: `
apiVersion: v2
name: test
version: 0.0.3`,
        },
      ]);
    });

    it('no ops', async () => {
      fs.readLocalFile.mockResolvedValueOnce(chartContent);

      const { bumpedContent, bumpedFiles } =
        await helmValuesUpdater.bumpPackageVersion(
          helmValuesContent,
          '0.0.1',
          'patch',
          'values.yaml'
        );
      expect(bumpedContent).toEqual(helmValuesContent);
      expect(bumpedFiles).toBeDefined();
      expect(bumpedFiles).toHaveLength(1);
      expect(bumpedFiles).toStrictEqual([
        {
          fileName: 'Chart.yaml',
          newContent: chartContent,
        },
      ]);
    });

    it('updates', async () => {
      fs.readLocalFile.mockResolvedValueOnce(chartContent);

      const { bumpedContent, bumpedFiles } =
        await helmValuesUpdater.bumpPackageVersion(
          helmValuesContent,
          '0.0.1',
          'minor',
          'values.yaml'
        );
      expect(bumpedContent).toEqual(helmValuesContent);
      expect(bumpedFiles).toBeDefined();
      expect(bumpedFiles).toHaveLength(1);
      expect(bumpedFiles).toMatchObject([
        {
          fileName: 'Chart.yaml',
          newContent: `
apiVersion: v2
name: test
version: 0.1.0`,
        },
      ]);
    });

    it('returns content if bumping errors', async () => {
      fs.readLocalFile.mockResolvedValueOnce(chartContent);

      const { bumpedContent, bumpedFiles } =
        await helmValuesUpdater.bumpPackageVersion(
          helmValuesContent,
          '0.0.2',
          true as any,
          'values.yaml'
        );
      expect(bumpedContent).toEqual(helmValuesContent);
      expect(bumpedFiles).toBeUndefined();
    });
  });
});
