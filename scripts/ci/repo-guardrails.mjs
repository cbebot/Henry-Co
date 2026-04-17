#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);

let mode = "repo";
const explicitFiles = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--mode" && args[index + 1]) {
    mode = args[index + 1];
    index += 1;
    continue;
  }

  if (arg.startsWith("--mode=")) {
    mode = arg.slice("--mode=".length);
    continue;
  }

  if (arg === "--files") {
    explicitFiles.push(...args.slice(index + 1));
    break;
  }
}

const HIGH_CONFIDENCE_SECRET_PATTERNS = [
  {
    key: "private_key_block",
    label: "Private key block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    key: "github_token",
    label: "GitHub token",
    regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  },
  {
    key: "aws_access_key_id",
    label: "AWS access key id",
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    key: "slack_token",
    label: "Slack token",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    key: "stripe_secret_key",
    label: "Stripe secret key",
    regex: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/,
  },
  {
    key: "google_api_key",
    label: "Google API key",
    regex: /\bAIza[0-9A-Za-z\-_]{20,}\b/,
  },
];

const PUBLIC_SECRET_ENV_PATTERNS = [
  {
    key: "public_service_role",
    label: "Public-prefixed service-role env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*\b/g,
  },
  {
    key: "public_service_key",
    label: "Public-prefixed service-key env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*SERVICE_KEY\b/g,
  },
  {
    key: "public_secret_name",
    label: "Public-prefixed secret env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*SECRET[A-Z0-9_]*\b/g,
  },
  {
    key: "public_private_name",
    label: "Public-prefixed private env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*PRIVATE[A-Z0-9_]*\b/g,
  },
  {
    key: "public_password_name",
    label: "Public-prefixed password env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*PASSWORD[A-Z0-9_]*\b/g,
  },
  {
    key: "public_auth_token_name",
    label: "Public-prefixed auth-token env",
    regex: /\b(?:NEXT_PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*AUTH_TOKEN[A-Z0-9_]*\b/g,
  },
];

const findings = [];

function runGit(argsToRun) {
  return execFileSync("git", argsToRun, {
    cwd,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function listRepoFiles() {
  return runGit(["ls-files", "-z"])
    .split("\0")
    .map(normalizePath)
    .filter(Boolean);
}

function listStagedFiles() {
  return runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
    .split("\0")
    .map(normalizePath)
    .filter(Boolean);
}

function readFileFromIndex(filePath) {
  try {
    return execFileSync("git", ["show", `:${filePath}`], {
      cwd,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function readFileFromDisk(filePath) {
  const absolutePath = resolve(cwd, filePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  try {
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  return readFileSync(absolutePath, "utf8");
}

function shouldSkipPath(filePath) {
  return (
    /(^|\/)(node_modules|dist|build|coverage|playwright-report|test-results|\.next|\.turbo|\.vercel)\//.test(
      filePath
    ) ||
    /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(filePath) ||
    /\.(png|jpe?g|gif|webp|svg|ico|pdf|woff2?|ttf|eot|zip|gz|mp4|mov|avi|webm)$/i.test(filePath)
  );
}

function isTrackedEnvFile(filePath) {
  return /(^|\/)\.env(?:\.[^/]+)*$/.test(filePath);
}

function isAllowedTrackedEnvFile(filePath) {
  return /(^|\/)\.env(?:\.[^/]+)*\.example$/i.test(filePath);
}

function isStructuredEnvTextFile(filePath) {
  return (
    isTrackedEnvFile(filePath) ||
    /\.md$/i.test(filePath) ||
    /\.ya?ml$/i.test(filePath)
  );
}

function isBinaryText(content) {
  return content.includes("\u0000");
}

function isSensitiveServerKey(key) {
  if (/^(NEXT_PUBLIC|EXPO_PUBLIC)_/.test(key)) {
    return false;
  }

  return (
    key.includes("SECRET") ||
    key.includes("SERVICE_ROLE") ||
    key.includes("PRIVATE") ||
    key.includes("PASSWORD") ||
    key.includes("WEBHOOK") ||
    key.includes("OIDC") ||
    key.includes("AUTH_TOKEN") ||
    key.includes("API_KEY") ||
    /(?:^|_)TOKEN(?:$|_)/.test(key)
  );
}

function normalizeAssignedValue(rawValue) {
  let value = String(rawValue || "").trim();

  if (value.endsWith(",")) {
    value = value.slice(0, -1).trim();
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

function isPlaceholderValue(rawValue) {
  const value = normalizeAssignedValue(rawValue);
  if (!value) return true;

  if (
    /^(?:\.\.\.|null|undefined|true|false)$/i.test(value) ||
    /^\*{3,}.*$/.test(value) ||
    /^\$\{?[A-Z0-9_]+\}?$/i.test(value) ||
    /^<[^>]+>$/.test(value) ||
    value.endsWith(".invalid")
  ) {
    return true;
  }

  if (
    /(placeholder|example|changeme|replace|redacted|dummy|sample|ci-placeholder|your[-_a-z0-9]*)/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    value.includes("example.com") ||
    value.includes("example.org") ||
    value.includes("example.net")
  ) {
    return true;
  }

  if (value === "..." || value === "***staging***") {
    return true;
  }

  return false;
}

function looksLikeLiteralAssignment(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return false;

  return !(
    value.includes("process.env") ||
    value.includes("getOptionalEnv") ||
    value.includes("cleanEnv(") ||
    value.includes("String(") ||
    value.includes("Number(") ||
    value.includes("Boolean(") ||
    value.includes("await ") ||
    value.includes("=>") ||
    value.includes("${") ||
    value.startsWith("`") ||
    value.includes("(") ||
    value.includes(")")
  );
}

function addFinding(input) {
  findings.push(input);
}

function scanTrackedEnvPath(filePath) {
  if (mode === "repo" && explicitFiles.length === 0 && readFileFromDisk(filePath) == null) {
    return;
  }

  if (isTrackedEnvFile(filePath) && !isAllowedTrackedEnvFile(filePath)) {
    addFinding({
      category: "tracked_env_snapshot",
      label: "Tracked env snapshot",
      filePath,
      message: "Track only .env.example-style templates. Local, pulled, or production env files must stay untracked.",
    });
  }
}

function scanPublicEnvBoundary(filePath, content) {
  const lines = content.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber];

    for (const pattern of PUBLIC_SECRET_ENV_PATTERNS) {
      pattern.regex.lastIndex = 0;
      const matches = [...line.matchAll(pattern.regex)];
      for (const match of matches) {
        addFinding({
          category: pattern.key,
          label: pattern.label,
          filePath,
          lineNumber: lineNumber + 1,
          message: `Found ${match[0]}, which puts a server-style secret name under a public prefix.`,
        });
      }
    }
  }
}

function scanSensitiveAssignments(filePath, content) {
  if (!isStructuredEnvTextFile(filePath)) {
    return;
  }

  const lines = content.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber];
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*[:=]\s*(.+?)\s*$/);

    if (!match) continue;

    const [, key, rawValue] = match;
    if (!isSensitiveServerKey(key)) continue;
    if (!looksLikeLiteralAssignment(rawValue)) continue;
    if (isPlaceholderValue(rawValue)) continue;

    addFinding({
      category: "sensitive_assignment",
      label: "Sensitive env assignment",
      filePath,
      lineNumber: lineNumber + 1,
      message: `Found a non-placeholder literal assigned to ${key}. Rotate and move the real value out of tracked files.`,
    });
  }
}

function scanHighConfidenceSecrets(filePath, content) {
  const lines = content.split(/\r?\n/);

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber];

    for (const pattern of HIGH_CONFIDENCE_SECRET_PATTERNS) {
      if (!pattern.regex.test(line)) continue;

      addFinding({
        category: pattern.key,
        label: pattern.label,
        filePath,
        lineNumber: lineNumber + 1,
        message: `Found a high-confidence ${pattern.label.toLowerCase()} literal. Remove it from tracked content and rotate it if real.`,
      });
    }
  }
}

function collectCandidates() {
  if (explicitFiles.length > 0) {
    return explicitFiles.map(normalizePath).filter(Boolean);
  }

  if (mode === "staged") {
    return listStagedFiles();
  }

  return listRepoFiles();
}

function readCandidateContent(filePath) {
  if (explicitFiles.length > 0) {
    return readFileFromDisk(filePath);
  }

  if (mode === "staged") {
    return readFileFromIndex(filePath);
  }

  return readFileFromDisk(filePath);
}

const candidates = collectCandidates();

for (const filePath of candidates) {
  if (!filePath || shouldSkipPath(filePath)) continue;

  scanTrackedEnvPath(filePath);

  const content = readCandidateContent(filePath);
  if (content == null || isBinaryText(content)) continue;

  scanPublicEnvBoundary(filePath, content);
  scanSensitiveAssignments(filePath, content);
  scanHighConfidenceSecrets(filePath, content);
}

if (findings.length === 0) {
  console.log(
    mode === "staged"
      ? "HenryCo staged guardrails passed."
      : "HenryCo repo guardrails passed."
  );
  process.exit(0);
}

console.error(
  mode === "staged"
    ? "HenryCo staged guardrails failed."
    : "HenryCo repo guardrails failed."
);

for (const finding of findings) {
  const location = finding.lineNumber
    ? `${finding.filePath}:${finding.lineNumber}`
    : finding.filePath;
  console.error(`- [${finding.label}] ${location}`);
  console.error(`  ${finding.message}`);
}

process.exit(1);
