export interface GitHubUrlParsedResult {
  type: 'github';
  currentValue: string;
  ownerName: string;
  repoName: string;
}

export interface NpmUrlParsedResult {
  type: 'npm';
  currentValue: string;
  packageName: string;
}

export type UrlParsedResult = GitHubUrlParsedResult | NpmUrlParsedResult;
