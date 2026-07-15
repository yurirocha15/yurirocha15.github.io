import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const CONTENT_PATHS = new Set([
  "src/content/career.ts",
  "src/content/profile.ts",
  "src/content/projects.ts",
  "src/content/research.ts",
  "src/content/skills.ts",
  "src/content/visualLabels.ts",
]);

const RESULT_BY_MODE = {
  skip: { publish: false, runQuality: false, e2eSuite: "none" },
  cv: { publish: true, runQuality: false, e2eSuite: "none" },
  content: { publish: true, runQuality: true, e2eSuite: "fast" },
  quality: { publish: false, runQuality: true, e2eSuite: "full" },
  full: { publish: true, runQuality: true, e2eSuite: "full" },
};

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isDocumentationPath(filePath) {
  return filePath.endsWith(".md")
    || filePath === "LICENSE"
    || filePath.startsWith("LICENSE.")
    || filePath.startsWith("docs/")
    || filePath.startsWith(".github/ISSUE_TEMPLATE/");
}

export function classifyPath(filePath) {
  const normalizedPath = normalizePath(filePath);

  if (isDocumentationPath(normalizedPath)) return "docs";
  if (normalizedPath === "cv/Dockerfile"
    || normalizedPath === "cv/Makefile"
    || normalizedPath.startsWith("cv/src/")
    || normalizedPath.startsWith("cv/scripts/")) return "cv";
  if (CONTENT_PATHS.has(normalizedPath)
    || normalizedPath.startsWith("src/content/locales/")) return "content";
  if (normalizedPath.startsWith("tests/")) return "quality";
  return "full";
}

function result(mode, reason) {
  return { mode, reason, ...RESULT_BY_MODE[mode] };
}

export function classifyChanges({
  eventName = "push",
  forced = false,
  paths = [],
  comparisonAvailable = true,
} = {}) {
  if (eventName !== "push") return result("full", `event:${eventName}`);
  if (forced) return result("full", "forced-push");
  if (!comparisonAvailable) return result("full", "comparison-unavailable");
  if (paths.length === 0) return result("full", "empty-change-set");

  const functionalGroups = new Set(
    paths.map(classifyPath).filter((group) => group !== "docs"),
  );
  if (functionalGroups.size === 0) return result("skip", "documentation-only");
  if (functionalGroups.size !== 1) return result("full", "mixed-change-set");

  const [group] = functionalGroups;
  if (group === "cv") return result("cv", "cv-only");
  if (group === "content") return result("content", "localized-content-only");
  if (group === "quality") return result("quality", "tests-only");
  return result("full", "runtime-or-unknown");
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Invalid argument sequence near ${key ?? "end of input"}`);
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function isUsableRevision(revision) {
  return Boolean(revision) && !/^0+$/.test(revision);
}

function changedPaths(base, head) {
  const output = execFileSync(
    "git",
    ["diff", "--name-only", "-z", "--diff-filter=ACDMRTUXB", base, head],
    { encoding: "utf8" },
  );
  return output.split("\0").filter(Boolean);
}

function serializeForGitHub(resultValue) {
  return [
    `mode=${resultValue.mode}`,
    `reason=${resultValue.reason}`,
    `publish=${resultValue.publish}`,
    `run_quality=${resultValue.runQuality}`,
    `e2e_suite=${resultValue.e2eSuite}`,
  ].join("\n");
}

function run() {
  const argumentsByName = parseArguments(process.argv.slice(2));
  const eventName = argumentsByName.get("event") ?? "unknown";
  const forced = argumentsByName.get("forced") === "true";
  const base = argumentsByName.get("base") ?? "";
  const head = argumentsByName.get("head") ?? "";
  const revisionsAvailable = isUsableRevision(base) && isUsableRevision(head);

  let paths = [];
  let comparisonAvailable = revisionsAvailable;
  if (eventName === "push" && !forced && revisionsAvailable) {
    try {
      paths = changedPaths(base, head);
    } catch (error) {
      comparisonAvailable = false;
      process.stderr.write(`Unable to compare revisions; selecting full CI: ${error.message}\n`);
    }
  }

  const classification = classifyChanges({
    eventName,
    forced,
    paths,
    comparisonAvailable,
  });
  process.stdout.write(`${serializeForGitHub(classification)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
