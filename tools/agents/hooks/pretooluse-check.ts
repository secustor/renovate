import { deny } from './utils/output.ts';
import { PreToolUseHookInput } from './utils/schemas.ts';
import { readStdin } from './utils/stdin.ts';

const raw = await readStdin();
const result = PreToolUseHookInput.safeParse(JSON.parse(raw));

if (result.success) {
  // The schema only parses `Bash` tool inputs, so no tool_name check is needed
  const { command } = result.data.tool_input;
  if (/(?:^|\s)(?:npm|npx|yarn)(?:\s|$)/.test(command)) {
    deny('Use pnpm instead of npm/npx/yarn');
  }
  if (/(?:^|\s)pnpm\s+(?:run\s+|exec\s+)?jest(?:\s|$)/.test(command)) {
    deny('Use pnpm vitest instead of pnpm jest');
  }
}
