// PreToolUse: blocks edits to generated files, lockfiles and real .env files.
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  const file = (JSON.parse(raw || "{}").tool_input?.file_path ?? "").replace(/\\/g, "/");
  const name = file.split("/").pop();
  const blocked =
    file.endsWith("src/routeTree.gen.ts") ||
    ["package-lock.json", "bun.lock"].includes(name) ||
    (/^\.env(\..+)?$/.test(name) && name !== ".env.example");
  if (blocked) {
    console.error(
      `Bloqueado: ${name} é gerado ou sensível. Use npm/TanStack Router para gerar, ou peça para a pessoa editar.`,
    );
    process.exit(2);
  }
});
