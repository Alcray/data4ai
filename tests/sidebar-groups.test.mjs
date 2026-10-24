import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const phaseSource = page.match(/const lecturePhases = \[[\s\S]*?\] as const;/)?.[0];
assert.ok(phaseSource, "Lecture phase configuration must be present");
const { outputText } = ts.transpileModule(
  "const lecturePages = Array.from({length: 8}, (_, number) => ({number}));\n" +
  phaseSource + "\nexport default lecturePhases;",
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
);
const phases = (await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"))).default;

test("Pretraining sidebar separates corpus engineering from pretraining at scale", () => {
  const pretraining = phases.find(phase => phase.name === "Pretraining");
  assert.equal(pretraining.range, "03–07");
  assert.deepEqual(pretraining.families.map(family => [family.name, family.lectures.map(lecture => lecture.number)]), [
    ["Corpus engineering", [3, 4, 5]],
    ["Pretraining at scale", [6, 7]],
  ]);
});

test("Published navigation keeps each released lecture once and excludes drafts", () => {
  const lectures = phases.flatMap(phase => phase.families.flatMap(family => family.lectures.map(lecture => lecture.number)));
  assert.deepEqual(lectures, [1, 2, 3, 4, 5, 6, 7]);
  assert.doesNotMatch(page, /generated\/lecture-(?:[8-9]|1[0-6])/);
  assert.doesNotMatch(page, /Lecture (?:[8-9]|1[0-6])(?: \(draft\))?:/);
});

test("Family labels retain accessible groups and active-state brackets", () => {
  assert.match(page, /aria-labelledby=\{familyLabelId\}/);
  assert.match(page, /lecture-family\$\{familyIsActive/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.lecture-family-marker > span \{[^}]*writing-mode: vertical-rl;/);
  assert.match(css, /\.lecture-family\.active \.lecture-family-marker/);
});
