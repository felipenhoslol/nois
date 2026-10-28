// PostToolUse: runs the project's Prettier on the edited file. No-op until `npm install` has run.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  const file = JSON.parse(raw || "{}").tool_input?.file_path ?? "";
  if (!/\.(tsx?|css|json|md)$/.test(file) || file.endsWith("routeTree.gen.ts")) return;
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cli = join(root, "node_modules", "prettier", "bin", "prettier.cjs");
  if (!existsSync(cli)) return;
  spawnSync(process.execPath, [cli, "--write", "--ignore-unknown", file], {
    cwd: root,
    stdio: "ignore",
  });
});
