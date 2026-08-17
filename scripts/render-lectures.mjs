import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const projectQuarto = join(projectRoot, ".tools/quarto/bin/quarto");
const quarto = process.env.QUARTO_BIN ||
  (existsSync(projectQuarto) ? projectQuarto : "quarto");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "data4ai-quarto-"));
const temporaryLectures = join(temporaryDirectory, "lectures");
const sourceDirectory = join(projectRoot, "content/lectures");
const bibliographyFile = join(projectRoot, "content/references.bib");
const generatedDirectory = join(projectRoot, "app/generated");

function toIdentifier(slug) {
  return slug.replace(/[^a-zA-Z0-9]+(.)/g, (_, character) =>
    character.toUpperCase());
}

try {
  mkdirSync(temporaryLectures);
  mkdirSync(generatedDirectory, { recursive: true });
  copyFileSync(bibliographyFile, join(temporaryDirectory, "references.bib"));

  const sourceFiles = readdirSync(sourceDirectory)
    .filter((file) => file.endsWith(".qmd"))
    .sort();

  for (const sourceFile of sourceFiles) {
    copyFileSync(
      join(sourceDirectory, sourceFile),
      join(temporaryLectures, sourceFile),
    );
  }

  for (const sourceFile of sourceFiles) {
    execFileSync(
      quarto,
      ["render", `lectures/${sourceFile}`],
      { cwd: temporaryDirectory, stdio: "inherit" },
    );

    const slug = sourceFile.replace(/\.qmd$/, "");
    const renderedFile = join(temporaryLectures, `${slug}.html`);
    const document = readFileSync(renderedFile, "utf8");
    const body = document.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

    if (!body) {
      throw new Error(`${sourceFile} did not render an HTML body.`);
    }

    const fragment = body
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<div id="quarto-search-results">[\s\S]*?<\/div>/gi, "")
      .trim();

    const exportName = `${toIdentifier(slug)}Html`;
    const moduleSource = `// Generated from content/lectures/${sourceFile}.\n` +
      `// Run \`npm run content:render\` after editing the QMD source.\n` +
      `export const ${exportName} = ${JSON.stringify(fragment)};\n`;

    writeFileSync(join(generatedDirectory, `${slug}.ts`), moduleSource);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
