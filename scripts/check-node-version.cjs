#!/usr/bin/env node

const REQUIRED_MAJOR = 20;
const REQUIRED_MINOR = 9;

function parseVersion(version) {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);
  return { major, minor };
}

const current = parseVersion(process.version);
const isValid =
  current.major > REQUIRED_MAJOR ||
  (current.major === REQUIRED_MAJOR && current.minor >= REQUIRED_MINOR);

if (!isValid) {
  console.error(
    [
      "",
      "Unsupported Node.js version.",
      `Required: >= ${REQUIRED_MAJOR}.${REQUIRED_MINOR}.0`,
      `Current:  ${process.version}`,
      "",
      "Use one of the following:",
      "  - nvm:    nvm install 20 && nvm use 20",
      "  - volta:  volta install node@20",
      ""
    ].join("\n")
  );
  process.exit(1);
}
