import { regEx } from '../../../util/regex.ts';

// The `actions.lock` file only covers GitHub workflows, not Gitea/Forgejo
// workflows, `workflow-templates/` or composite action manifests.
export const githubWorkflowFileRe = regEx(
  /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/,
);
