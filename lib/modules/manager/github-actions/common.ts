import { regEx } from '../../../util/regex.ts';

// `gh actions-lock` writes the locked graph of all onboarded workflows,
// including transitive dependencies of local composite actions, to a single
// lock file at a fixed location.
export const actionsLockFile = '.github/workflows/actions.lock';

// Matches GitHub workflow files, not Gitea/Forgejo workflows,
// `workflow-templates/` or composite action manifests.
export const githubWorkflowFileRe = regEx(
  /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/,
);
