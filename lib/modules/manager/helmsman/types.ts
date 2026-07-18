export interface HelmsmanDocument {
  helmRepos: Record<string, string>;
  // This is parsed from unvalidated YAML, so `apps` may genuinely be absent.
  apps?: Record<string, HelmsmanApp>;
}

export interface HelmsmanApp {
  version?: string;
  chart?: string;
}
