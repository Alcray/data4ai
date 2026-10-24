import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const chapter = read("content/lectures/lecture-7.qmd");
const html = JSON.parse(read("app/generated/lecture-7.ts").match(/export const \w+ = (.*);/)[1]);
const source = read("app/future-decks/lecture-7.ts");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const deck = (await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"))).default;

test("Lecture 7 builds on earlier lectures without repeating their pipeline", () => {
  assert.equal([...chapter.matchAll(/^### \d+\./gm)].length, 17);
  assert.equal([...chapter.matchAll(/^## Part [IV]+ —/gm)].length, 4);
  assert.doesNotMatch(chapter, /### .*Accidental duplication|### .*Mixture weight cannot rescue|### .*Count what actually enters the loss|### .*What to submit/);
  assert.match(chapter, /Optimizer implementations, distributed loaders, and recovery belong to Lecture 8/);
  assert.match(chapter, /^title: "Lecture 7:/m);
  assert.doesNotMatch(chapter, /^title:.*\(draft\)/m);
});

test("Lecture 7 keeps all slide destinations and technical chapter anchors", () => {
  const headings = new Set([...chapter.matchAll(/^#{1,4}\s+(.+?)(?:\s*\{[^}]+\})?\s*$/gm)].map(match => match[1]));
  for (const slide of deck.slides) assert.ok(headings.has(slide.section), slide.title);
  for (const anchor of ["documents-versus-tokens", "sampler-objective", "static-mix-and-chunk", "static-document-sampling", "document-dynamic-feedback", "record-target-shares", "record-target-conversion", "target-quota", "realized-mixture-distance", "replacement-coverage", "finite-pool-motivation", "coverage-draw-trace", "source-exposure", "expected-unique-coverage", "uniform-coverage-example", "repetition-caps", "capped-proportional-allocation", "transfer-motivation", "doremi-update", "regmix-surrogate", "processed-compute", "scaling-optimum", "data-constrained-scaling", "mixture-curriculum"]) {
    assert.ok(chapter.includes("{#" + anchor + "}"));
    assert.ok(html.includes('id="' + anchor + '"'));
  }
  assert.equal(deck.slides.filter(slide => slide.kind !== "divider").length, 26);
  assert.equal(deck.slides.length + 1, 30);
});

test("Lecture 7 opens with document shares versus token shares, not a loss comparison", () => {
  const slide = deck.slides.find(slide => slide.textAnchor === "documents-versus-tokens");
  assert.equal(slide.title, "30% of documents, 60% of tokens");
  assert.deepEqual(slide.headers, ["Document type", "Documents", "Share of docs", "Share of tokens"]);
  const data = [
    { name: "Code files", documents: 300, mean: 4000 },
    { name: "Web articles", documents: 500, mean: 1000 },
    { name: "Manuals", documents: 200, mean: 1500 },
  ];
  const documents = data.reduce((sum, row) => sum + row.documents, 0);
  const tokens = data.reduce((sum, row) => sum + row.documents * row.mean, 0);
  assert.equal(documents, 1000);
  assert.equal(tokens, 2000000);
  assert.deepEqual(slide.rows.slice(0, 3), data.map(row => [row.name, String(row.documents), `${100 * row.documents / documents}%`, `${100 * row.documents * row.mean / tokens}%`]));
  assert.deepEqual(slide.rows.at(-1), ["Total", "1,000", "100%", "100%"]);
  assert.match(slide.source.label, /Illustrative.*Not measured/);
  assert.ok(!deck.slides.some(slide => slide.title === "Normalization changes the expected gradient"));
  assert.match(chapter, /Reference: loss normalization/);
});

test("The sampling formula defines each symbol without the removed loss equation", () => {
  const slide = deck.slides.find(slide => slide.textAnchor === "record-target-shares");
  assert.equal(slide.formula, "μᵢ = E[length | source i]\npᵢ = (qᵢ × μᵢ) / Σⱼ(qⱼ × μⱼ)");
  assert.deepEqual(slide.rows.map(row => row[0]), ["i, j", "qᵢ", "μᵢ", "pᵢ", "E[·]", "Σⱼ"]);
  assert.match(slide.rows[1][1], /document draws/);
  assert.match(slide.rows[2][1], /tokens per document/);
  assert.match(slide.rows[3][1], /emitted tokens/);
  assert.doesNotMatch(slide.formula, /L\(|θ|loss/);
  assert.ok(html.includes('id="record-target-shares"'));
});

test("Two stream-construction approaches precede the formula and replace the removed quiz", () => {
  const indices = ["static-mix-and-chunk", "static-document-sampling", "record-target-shares"].map(anchor => deck.slides.findIndex(slide => slide.textAnchor === anchor));
  assert.ok(indices[0] >= 0 && indices[0] < indices[1] && indices[1] < indices[2]);
  assert.ok(!deck.slides.some(slide => slide.title === "Ninety percent of draws: how many targets?"));
  for (const anchor of ["static-mix-and-chunk", "static-document-sampling", "document-dynamic-feedback"]) {
    const slide = deck.slides.find(slide => slide.textAnchor === anchor);
    assert.equal(slide.kind, "image");
    assert.ok(chapter.includes(slide.image.src));
    const svg = read("public/" + slide.image.src);
    assert.match(svg, /aria-labelledby="title desc"/);
    assert.match(svg, /data-boundaries="preserved"/);
    assert.match(svg, /data-block-length="4096"/);
    assert.doesNotMatch(svg, /<image\b/);
  }
  const staticSvg = read("public/lecture-7/static-mix-and-chunk.svg");
  const code = Number(staticSvg.match(/data-code-tokens="(\d+)"/)[1]);
  const other = Number(staticSvg.match(/data-text-tokens="(\d+)"/)[1]);
  assert.equal(code / (code + other), 0.6);
  assert.match(chapter, /Shuffle whole documents or chunks, not individual tokens/);
  assert.match(chapter, /Hybrid loaders/);
});

test("The inverse formula is visually distinct from its numerical example", () => {
  const slide = deck.slides.find(slide => slide.title === "Invert the target-share equation");
  assert.equal(slide.formula, "qᵢ = (pᵢ / μᵢ) / Σⱼ(pⱼ / μⱼ)");
  assert.doesNotMatch(slide.formula, /0\.9|100|0\.989/);
  assert.match(slide.items[0], /^Example:/);
  assert.match(slide.items[1], /0\.9890.*0\.0110/);
});

test("Deficit and realized-mixture formulas define their terms", () => {
  const deficit = deck.slides.find(slide => slide.textAnchor === "target-quota");
  const distance = deck.slides.find(slide => slide.textAnchor === "realized-mixture-distance");
  assert.deepEqual(deficit.rows.map(row => row[0]), ["Tᵢ", "t", "pᵢ", "δᵢ", "i*", "arg maxᵢ"]);
  assert.deepEqual(distance.rows.map(row => row[0]), ["Tᵢ", "Σⱼ Tⱼ", "pᵢ", "p̂ᵢ", "|pᵢ − p̂ᵢ|", "TV(p, p̂)"]);
  for (const slide of [deficit, distance]) {
    assert.equal(slide.formulaLayout, "legend");
    assert.ok(slide.rows.every(row => row[1].length > 10));
  }
  assert.match(chapter, /negative means over its current quota/);
  assert.match(chapter, /Return the index with the largest value/);
  assert.match(chapter, /factor one-half avoids counting/);
});

test("Every Lecture 7 formula explains its symbols and interpretation on the slide", () => {
  const formulas = deck.slides.filter(slide => slide.kind === "formula");
  assert.equal(formulas.length, 15);
  for (const slide of formulas) {
    assert.equal(slide.formulaLayout, "legend", slide.title);
    assert.deepEqual(slide.headers, ["Term", "Meaning"], slide.title);
    assert.ok(slide.rows?.length >= 3, slide.title);
    assert.ok(slide.rows.every(([term, meaning]) => term.trim() && meaning.trim()), slide.title);
    assert.ok(slide.formulaExplanation?.length >= 30, slide.title);
  }
  const coverage = formulas.find(slide => slide.title === "Sum the probability that each item is seen");
  assert.deepEqual(coverage.rows.map(row => row[0]), ["Vₙ", "E[·]", "aⱼ", "n", "Σⱼ"]);
  assert.match(coverage.formulaExplanation, /at least once/);
  assert.doesNotMatch(coverage.formula + coverage.formulaExplanation, /0\.63|63\.2|exp\(/);
  const example = formulas.find(slide => slide.textAnchor === "uniform-coverage-example");
  assert.equal(deck.slides.indexOf(example), deck.slides.indexOf(coverage) + 1);
  assert.match(example.formula, /0\.632/);
});

test("Lecture 7 uses a feedback diagram and a complete 2B-target plan", () => {
  const feedback = deck.slides.findIndex(slide => slide.textAnchor === "document-dynamic-feedback");
  assert.equal(deck.slides[feedback + 1].textAnchor, "target-quota");
  assert.match(read("public/lecture-7/static-document-sampling.svg"), /data-approach="document-static"/);
  assert.match(read("public/lecture-7/dynamic-document-sampling.svg"), /data-feedback="consumed-targets"/);
  const table = deck.slides.find(slide => slide.textAnchor === "finite-pool-motivation");
  const amount = value => Number(value.replaceAll(",", "").replace("M", ""));
  assert.equal(table.rows.slice(0, -1).reduce((total, row) => total + amount(row[2]), 0), 2000);
  assert.equal(amount(table.rows.at(-1)[2]), 2000);
  for (const title of ["Update the counter after each selected record", "Ten draws can leave half the pool unseen", "Repetition caps restrict the simplex"]) {
    assert.ok(!deck.slides.some(slide => slide.title === title));
  }
});

test("Lecture 7 presents three parts with plain Lecture 6-style dividers", () => {
  const expected = [
    ["Part 1 — Sampling and target shares", "Part I — Turn target weights into a sampler", "mixture-sampler", "1. Start from the frozen target inventory"],
    ["Part 2 — Finite data and repetition", "Part II — Allocate finite data", "finite-data", "5. Coverage under repeated sampling"],
    ["Part 3 — Learning mixture weights", "Part III — Learn a mixture with proxy experiments", "proxy-mixtures", "9. Why one source can help another"],
  ];
  const dividers = deck.slides.filter(slide => slide.kind === "divider");
  assert.deepEqual(dividers.map(slide => [slide.title, slide.section, slide.textAnchor]), expected.map(row => row.slice(0, 3)));
  assert.equal(deck.slides[0], dividers[0]);
  assert.equal(deck.parts?.length ?? 0, 0, "Use plain title dividers without an extra outline or inserted part slides");
  for (const [part, divider] of dividers.entries()) {
    const index = deck.slides.indexOf(divider);
    assert.equal(deck.slides[index + 1].section, expected[part][3]);
    assert.ok(html.includes('id="' + divider.textAnchor + '"'));
    assert.ok(divider.notes.length >= 80);
    const next = part + 1 < dividers.length ? deck.slides.indexOf(dividers[part + 1]) : deck.slides.length;
    for (const slide of deck.slides.slice(index + 1, next)) {
      const section = Number(slide.section.match(/^(\d+)\./)?.[1]);
      assert.ok(section >= [1, 5, 9][part] && section <= [4, 8, 12][part], slide.title);
    }
  }
});

test("Lecture 7 keeps Part 4 in the chapter and removes it from the presentation", () => {
  assert.match(chapter, /C\\approx6PN/);
  assert.match(chapter, /C\\approx\\frac\{6PT\}\{\\rho\}/);
  assert.match(chapter, /Only when.*\\rho\\approx1/);
  assert.ok(chapter.includes("## Part IV — Allocate compute and order the data"));
  assert.ok(!deck.slides.some(slide => slide.section.startsWith("Part IV") || Number(slide.section.match(/^(\d+)\./)?.[1]) >= 13));
  assert.equal(deck.slides.at(-1).title, "Fix the evaluation before comparing mixtures");
});

test("Lecture 7 preserves algorithmic distinctions and numerical provenance", () => {
  assert.match(chapter, /Clipping \*\*after\*\* averaging would give A the wrong score/);
  assert.match(chapter, /uniform-domain minibatch proposal/);
  assert.match(chapter, /average domain weights across proxy steps/);
  assert.match(chapter, /ridge and LightGBM regressors/);
  assert.match(chapter, /teaching fixture, not the paper's fitted response/);
  assert.match(chapter, /not a fit to Armenian, English, or a released model/);
  assert.ok(deck.slides.some(slide => slide.items?.some(item => item.includes("0.62234"))));
  assert.ok(deck.slides.some(slide => slide.formula?.includes("2.2875")));
});

test("Lecture 7 includes reproducible examples and valid primary-source citations", () => {
  assert.match(chapter, /python3 scripts\/lecture7-mixture-examples\.py/);
  assert.match(chapter, /python3 tests\/lecture7-mixtures\.test\.py/);
  const keys = new Set([...read("content/references.bib").matchAll(/@\w+\s*\{\s*([^,\s]+)/g)].map(match => match[1]));
  for (const [, key] of chapter.matchAll(/@([a-zA-Z][\w:-]*)/g)) assert.ok(keys.has(key), key);
  assert.doesNotMatch(html, /\[\?\?\?|citation-not-found/);
});
