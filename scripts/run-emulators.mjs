// Wrapper around `firebase emulators:start` that makes sure a Java 21+
// runtime is on PATH for the Firestore emulator, even if the machine's
// default `java` resolves to an older version (common on Windows when
// multiple JDKs are installed side by side).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function javaMajorVersion(javaBin) {
  const result = spawnSync(javaBin, ["-version"], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const match = output.match(/version "(\d+)/);
  return match ? Number(match[1]) : null;
}

function findJdk21Plus() {
  const roots = [
    "C:\\Program Files\\Eclipse Adoptium",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Amazon Corretto",
    "C:\\Program Files\\Microsoft\\jdk-21",
  ];

  for (const root of roots) {
    if (!existsSync(root)) continue;
    let entries;
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const match = entry.match(/(?:jdk-?)(\d+)/i);
      const version = match ? Number(match[1]) : null;
      if (version && version >= 21) {
        const binDir = join(root, entry, "bin");
        if (existsSync(join(binDir, "java.exe"))) return binDir;
      }
    }
  }
  return null;
}

const currentVersion = javaMajorVersion("java");
let env = process.env;

if (!currentVersion || currentVersion < 21) {
  const jdk21Bin = findJdk21Plus();
  if (jdk21Bin) {
    console.log(`Using Java 21+ runtime for the emulator: ${jdk21Bin}`);
    env = { ...process.env, PATH: `${jdk21Bin};${process.env.PATH}` };
  } else {
    console.warn(
      "\nWarning: no Java 21+ runtime found on this machine, and the default `java` is version " +
        `${currentVersion ?? "unknown"}.\n` +
        "The Firestore emulator requires Java 21+. Install one (e.g. https://adoptium.net/) and re-run `npm run emulators`.\n"
    );
  }
}

// Persist emulator data across restarts: imported on start if present,
// written back out on a clean exit (Ctrl+C). Without this, every restart
// comes back with only the seeded data and loses anything created since.
const dataDir = ".firebase-emulator-data";
const args = [
  "firebase",
  "emulators:start",
  "--only",
  "firestore,auth",
  "--project",
  "amlakms-dev",
  "--export-on-exit",
  dataDir,
];
if (existsSync(dataDir)) {
  args.push("--import", dataDir);
  console.log(`Restoring emulator data from ./${dataDir}`);
} else {
  console.log("No saved emulator data found — starting empty (run `npm run seed` after this starts).");
}

const child = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
