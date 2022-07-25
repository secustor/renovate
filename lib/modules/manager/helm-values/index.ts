import { DockerDatasource } from '../../datasource/docker';
export { extractPackageFile } from './extract';
export { bumpPackageVersion } from './update';

export const defaultConfig = {
  commitMessageTopic: 'helm values {{depName}}',
  fileMatch: ['(^|/)values.yaml$'],
  pinDigests: false,
};

export const supportedDatasources = [DockerDatasource.id];
