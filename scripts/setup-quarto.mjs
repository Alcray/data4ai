import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { arch, platform } from "node:os";
import { join, resolve } from "node:path";

const version = "1.9.38";
const releases = {
  "linux:x64": {
    archive: `quarto-${version}-linux-amd64.tar.gz`,
    sha256: "ea8c897368791ad9f200010c087ea3111b2e556b12a960487dd4e216902aa102",
  },
  "linux:arm64": {
    archive: `quarto-${version}-linux-arm64.tar.gz`,
    sha256: "75fbc5c1121ffe65e564e9d24711db2ad8f617f9552f5dc7d8a06307d72dde38",
  },
};

const projectRoot = resolve(import.meta.dirname, "..");
const toolsDirectory = join(projectRoot, ".tools");
const installDirectory = join(toolsDirectory, "quarto");
const quartoBinary = join(installDirectory, "bin/quarto");
const release = releases[`${platform()}:${arch()}`];

if (!release) {
  throw new Error(
    `Project-local Quarto setup does not support ${platform()} ${arch()}. ` +
      "Install Quarto manually and set QUARTO_BIN to its executable.",
  );
}

if (existsSync(quartoBinary)) {
  const installedVersion = execFileSync(quartoBinary, ["--version"], {
    encoding: "utf8",
  }).trim();

  if (installedVersion !== version) {
    throw new Error(
      `Expected Quarto ${version}, but ${quartoBinary} is ${installedVersion}.`,
    );
  }

  console.log(`Quarto ${version} is already installed at ${quartoBinary}`);
  process.exit(0);
}

if (existsSync(installDirectory)) {
  throw new Error(
    `${installDirectory} already exists but does not contain bin/quarto. ` +
      "Move that directory aside and run this command again.",
  );
}

mkdirSync(toolsDirectory, { recursive: true });
const temporaryDirectory = mkdtempSync(join(toolsDirectory, ".quarto-install-"));
const archivePath = join(temporaryDirectory, release.archive);
const downloadUrl =
  `https://github.com/quarto-dev/quarto-cli/releases/download/v${version}/${release.archive}`;

try {
  console.log(`Downloading Quarto ${version}...`);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}.`);
  }

  const archive = Buffer.from(await response.arrayBuffer());
  const actualSha256 = createHash("sha256").update(archive).digest("hex");

  if (actualSha256 !== release.sha256) {
    throw new Error(
      `Checksum mismatch: expected ${release.sha256}, received ${actualSha256}.`,
    );
  }

  writeFileSync(archivePath, archive);
  execFileSync("tar", ["-xzf", archivePath, "-C", temporaryDirectory], {
    stdio: "inherit",
  });

  const extractedDirectory = join(temporaryDirectory, `quarto-${version}`);
  if (!existsSync(join(extractedDirectory, "bin/quarto"))) {
    throw new Error("Downloaded Quarto archive did not contain bin/quarto.");
  }

  renameSync(extractedDirectory, installDirectory);
  const installedVersion = execFileSync(quartoBinary, ["--version"], {
    encoding: "utf8",
  }).trim();

  if (installedVersion !== version) {
    throw new Error(`Installed Quarto reported unexpected version ${installedVersion}.`);
  }

  console.log(`Installed Quarto ${installedVersion} at ${quartoBinary}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
