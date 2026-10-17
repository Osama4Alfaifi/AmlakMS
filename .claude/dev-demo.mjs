// Runs the dev server in static-demo mode (in-browser mock backend, no Firebase)
// on port 3100 so visual work can be previewed and logged into safely.
import { spawn } from "node:child_process";
const child = spawn("npx", ["next", "dev", "-p", "3100"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_DEMO: "true" },
});
child.on("exit", (code) => process.exit(code ?? 0));
