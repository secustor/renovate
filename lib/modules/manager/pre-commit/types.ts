export interface PreCommitConfig {
  // This is untrusted, unvalidated YAML content, so `repos` may genuinely be
  // absent despite being conventionally required.
  repos?: PreCommitDependency[];
}

export interface PreCommitHook {
  language?: string;
  additional_dependencies?: string[];
}

export interface PreCommitDependency {
  repo: string;
  hooks?: PreCommitHook[];
  rev: string;
}
