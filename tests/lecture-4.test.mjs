import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const bibliography = read("content/references.bib");
const citationKeys = new Set([...bibliography.matchAll(/@\w+\s*\{\s*([^,\s]+)/g)].map((match) => match[1]));

async function loadDeck(number) {
  const source = read(`app/future-decks/lecture-${number}.ts`);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`)).default;
}

test("Lecture 4 has published labels in the chapter, navigation, curriculum, and slides", () => {
  const label = "Lecture 4: Document extraction, quality filtering, and corpus auditing";
  assert.ok(read("content/lectures/lecture-4.qmd").includes('title: "' + label + '"'));
  assert.ok(read("content/lectures/curriculum.qmd").includes("**" + label + ".**"));
  assert.doesNotMatch(read("content/lectures/curriculum.qmd"), /Draft material|Lecture 4 \(draft\)/);
  assert.ok(read("app/page.tsx").includes('const lecture4Name = "' + label + '"'));
  assert.doesNotMatch(read("app/generated/lecture-4.ts"), /Lecture 4 \(draft\)/);
  const presentation = read("app/FutureLecturePresentation.tsx");
  assert.ok(presentation.includes("const isDraft = deck.number !== 4;"));
  assert.ok(presentation.includes('{isDraft && " · DRAFT"}'));
  assert.ok(presentation.includes('{isDraft && "DRAFT · "}LECTURE {deck.number}'));
});

test("Lecture 4 presentation follows the chapter's five major parts", async () => {
  const chapter = read("content/lectures/lecture-4.qmd");
  const deck = await loadDeck(4);
  const partHeadings = [...chapter.matchAll(/^## (Part [IVX]+): (.+?) \{#([^}]+)\}$/gm)];
  assert.equal(deck.parts?.length, 5);
  assert.deepEqual(deck.parts.map(({ label, title, id }) => [label, title, id]), partHeadings.map((match) => match.slice(1)));
  const starts = deck.parts.map((part) => deck.slides.findIndex((slide) => slide.title === part.startAt));
  assert.equal(starts[0], 0, "The first content slide belongs to Part I");
  assert.equal(new Set(deck.parts.map((part) => part.id)).size, 5, "Part jump targets must be unique");
  for (const [index, part] of deck.parts.entries()) {
    assert.equal(deck.slides.filter((slide) => slide.title === part.startAt).length, 1, "Each part has one unambiguous starting slide");
    if (index > 0) assert.ok(starts[index] > starts[index - 1], "Parts stay in chapter order");
    assert.ok(part.notes.length >= 80, "Part transitions need speaker notes");
    assert.equal(part.topics.length, 3, "Keep divider text brief");
  }
  let currentPart;
  const chapterParts = new Map();
  for (const line of chapter.split("\n")) {
    if (/^## Part /.test(line)) currentPart = line.match(/\{#([^}]+)\}/)[1];
    const heading = line.match(/^#{3,4} (.+?)(?:\s*\{[^}]+\})?\s*$/);
    if (heading) chapterParts.set(heading[1], currentPart);
  }
  for (const [index, slide] of deck.slides.entries()) {
    const partIndex = starts.findLastIndex((start) => start <= index);
    assert.equal(deck.parts[partIndex].id, chapterParts.get(slide.section), `Wrong part for: ${slide.title}`);
  }
});

test("Every Lecture 4 slide has a valid, unique destination in the rendered text", async () => {
  const deck = await loadDeck(4);
  const generated = read("app/generated/lecture-4.ts");
  const html = JSON.parse(generated.match(/export const \w+ = (.*);/)[1]);
  const renderedIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const destinations = [
    { title: deck.title, anchor: deck.textAnchor },
    { title: "Lecture outline", anchor: deck.outlineTextAnchor },
    ...deck.parts.map((part) => ({ title: `${part.label}: ${part.title}`, anchor: part.id })),
    ...deck.slides.map((slide) => ({ title: slide.title, anchor: slide.textAnchor })),
  ];
  for (const { title, anchor } of destinations) {
    assert.match(anchor ?? "", /^[a-z][a-z0-9-]+$/, `${title}: needs an explicit text destination`);
    assert.equal(renderedIds.filter((id) => id === anchor).length, 1, `${title}: destination must resolve to exactly one passage`);
  }
});

test("Lecture 4 concrete examples appear in both chapter and slides", async () => {
  const chapter = read("content/lectures/lecture-4.qmd");
  const deck = await loadDeck(4);
  for (const anchor of [
    "natural-armenian-specimen", "educational-armenian-specimen", "translated-stem-specimen",
    "modular-extraction-pipeline",
    "forum-document-example", "document-length-and-sequences", "formula-reference-example",
    "toloka-selective-retry", "html-baseline-input", "dom-baseline-code", "dom-failure-fixtures",
    "pdf-column-order-example", "ocr-error-specimens",
    "parenthetical-reading-guidelines", "extraction-reference-specimens",
    "normalization-policy-examples", "idempotence-pass-example", "idempotence-not-correctness",
    "precision-recall-readable-example",
  ]) {
    assert.ok(chapter.includes(anchor), "Missing chapter example: " + anchor);
    assert.ok(deck.slides.some(slide => slide.textAnchor === anchor), "Missing slide example: " + anchor);
  }
  assert.match(chapter, /Illustrative counts only/);
  assert.match(chapter, /not a real worker submission/);
  assert.match(chapter, /selective-retry design is illustrative/);
  assert.doesNotMatch(chapter, /This is deliberately \*\*not\*\* a production extractor/);
  for (const slide of deck.slides.filter(slide => slide.kind === "specimen")) {
    assert.equal(slide.specimens.length, 2, "Keep comparisons to two panels");
    for (const panel of slide.specimens) {
      assert.ok(panel.label && panel.text);
      assert.ok(panel.text.split("\n").length <= 10, slide.title + ": specimen must fit");
    }
  }
  for (const slide of deck.slides.filter(slide => slide.kind === "image")) {
    assert.ok(slide.image?.alt && slide.image?.caption, "Images need accessible descriptions and context");
    assert.match(slide.image.src, /^lecture-4\/[a-z0-9-]+\.(?:png|svg)$/);
    assert.ok(readFileSync(new URL("public/" + slide.image.src, root)).length > 0, "Image asset exists");
  }
});

test("Lecture 4 reference examples distinguish selection, order, and reading policy", async () => {
  const chapter = read("content/lectures/lecture-4.qmd");
  const deck = await loadDeck(4);
  const expected = ["A", "B", "C", "D"];
  function coverage(extracted) {
    const lengths = Array.from({ length: expected.length + 1 }, () => Array(extracted.length + 1).fill(0));
    for (let i = 1; i <= expected.length; i++) {
      for (let j = 1; j <= extracted.length; j++) {
        lengths[i][j] = expected[i - 1] === extracted[j - 1]
          ? lengths[i - 1][j - 1] + 1
          : Math.max(lengths[i - 1][j], lengths[i][j - 1]);
      }
    }
    return lengths[expected.length][extracted.length] / expected.length;
  }
  for (const [sequence, score] of [
    [["A", "B", "C", "D"], 1],
    [["A", "C", "B", "D"], 0.75],
    [["A", "B", "D"], 0.75],
    [["A", "N", "B", "C", "D"], 1],
  ]) assert.equal(coverage(sequence), score);
  assert.match(chapter, /\| A, C, B, D \| 3\/4 = 0\.75/);
  assert.match(chapter, /\| A, B, D \| 3\/4 = 0\.75/);
  assert.match(chapter, /\| A, N, B, C, D \| 4\/4 = 1\.00/);
  assert.match(chapter, /Match each reference occurrence at most once/);
  const prompt = "Երևանում Հայաստանի մայրաքաղաքում բացվեց նոր գիտական կենտրոն";
  const shortReading = "Երևանում բացվեց նոր գիտական կենտրոն";
  assert.equal(prompt.split(" ").length, 7);
  assert.equal(prompt.split(" ").length - shortReading.split(" ").length, 2);
  const readingSlide = deck.slides.find(slide => slide.textAnchor === "parenthetical-reading-guidelines");
  assert.equal(readingSlide.kind, "reading");
  assert.equal(readingSlide.readingText, "Երևանում (Հայաստանի մայրաքաղաքում) բացվեց նոր գիտական կենտրոն։");
  assert.equal(readingSlide.specimens, undefined);
  assert.equal(readingSlide.items, undefined);
  assert.match(readingSlide.notes, /28\.6% WER/);
  assert.match(chapter, /constructed sentence/);
  const svg = read("public/lecture-4/block-order-lcs.svg");
  assert.match(svg, /<title id="title">/);
  assert.match(svg, /Chosen chain: A → B → D/);
  assert.match(svg, /3 \/ 4 = 0\.75/);
});

test("Lecture 4 revisions remove marked slides while retaining detailed chapter material", async () => {
  const chapter = read("content/lectures/lecture-4.qmd");
  const deck = await loadDeck(4);
  for (const anchor of [
    "armenian-toloka-case", "toloka-prompt-filtering", "toloka-quality-controls",
    "toloka-wer-example", "toloka-assignment-acceptance", "web-extraction-path",
    "pdf-extraction-recipe", "lcs-order-example",
    "annotator-agreement", "audit-population-weights", "processing-policy-lab",
  ]) {
    assert.ok(chapter.includes(anchor), "Preserve chapter passage: " + anchor);
    assert.ok(!deck.slides.some(slide => slide.textAnchor === anchor), "Remove marked slide: " + anchor);
  }
  assert.equal(deck.slides.length + deck.parts.length + 2, 59);
  const forum = deck.slides.find(slide => slide.textAnchor === "forum-document-example");
  assert.equal(forum.items, undefined);
  assert.equal(forum.image.src, "lecture-4/reddit-thread-hierarchy.svg");
  const hierarchy = read("public/" + forum.image.src);
  for (const label of ["r/learnpython", "THREAD A", "THREAD B", "THREAD C", "REPLY TO COMMENT 1"]) {
    assert.ok(hierarchy.includes(label));
  }
  assert.match(hierarchy, /not a captured user conversation/);
  const broken = deck.slides.find(slide => slide.textAnchor === "formula-reference-example");
  assert.ok(broken.specimens.every(panel => !panel.text.includes("Fluent text. Missing premises.")));
});

test("Lecture 4 makes retained precision, lost coverage, and filter cost readable", async () => {
  const deck = await loadDeck(4);
  const questionIndex = deck.slides.findIndex(slide => slide.textAnchor === "precision-recall-question");
  assert.match(deck.slides[questionIndex].answer, /how many good documents were discarded/);
  const example = deck.slides[questionIndex + 1];
  assert.equal(example.textAnchor, "precision-recall-readable-example");
  assert.equal(example.kind, "specimen");
  assert.match(example.specimens[0].text, /95 good pages/);
  assert.match(example.specimens[1].text, /405 good pages/);
  assert.match(example.items.join(" "), /95 of 100 kept pages are good → 95%/);
  assert.match(example.items.join(" "), /95 of 500 good pages were kept → 19%/);
  assert.equal(95 / 100, 0.95);
  assert.equal(95 / (95 + 405), 0.19);
  const cost = deck.slides.find(slide => slide.textAnchor === "filter-order-cost");
  assert.equal(cost.kind, "specimen");
  assert.equal(cost.formula, undefined);
  assert.match(cost.specimens[0].text, /Check 100 pages: 100 units/);
  assert.match(cost.specimens[0].text, /Score 70 survivors: 1,400 units/);
  assert.match(cost.specimens[1].text, /Score 100 pages: 2,000 units/);
  assert.match(cost.specimens[1].text, /Check 60 survivors: 60 units/);
  assert.equal(100 + 70 * 20, 1500);
  assert.equal(100 * 20 + 60, 2060);
  assert.match(cost.notes, /same unchanged input/);
  assert.match(cost.notes, /saving 560 units/);
  assert.ok(!deck.parts.some(part => part.topics.join(" ").includes("lab")));
});

test("Lecture 4 examples expose actual HTML, OCR, normalization, and language decisions", async () => {
  const chapter = read("content/lectures/lecture-4.qmd");
  const deck = await loadDeck(4);
  const htmlIndex = deck.slides.findIndex(slide => slide.textAnchor === "html-baseline-input");
  const [input, code, output] = deck.slides.slice(htmlIndex, htmlIndex + 3);
  assert.match(input.code, /<nav>Home \| Physics \| Contact<\/nav>/);
  assert.match(input.code, /<div class="equation">F = ma<\/div>/);
  assert.equal(code.textAnchor, "dom-baseline-code");
  assert.equal(output.textAnchor, "dom-failure-fixtures");
  assert.match(output.specimens[0].text, /\[equation\] F = ma/);
  assert.equal(output.specimens[1].text, "[heading] Newton's second law\n\n[paragraph]\nFor constant mass, force equals\nmass times acceleration.");
  assert.deepEqual(output.items, ["Equation missing: div not selected"]);
  const ocr = deck.slides.find(slide => slide.textAnchor === "ocr-error-specimens");
  assert.equal(ocr.kind, "specimen");
  assert.match(ocr.specimens[0].text, /−3 m\/s²/);
  assert.match(ocr.specimens[1].text, /F = rna/);
  assert.match(ocr.specimens[1].text, /a = 3 m\/s2/);
  const normal = deck.slides.find(slide => slide.textAnchor === "normalization-policy-examples");
  assert.match(normal.specimens[0].text, /U\+0065 U\+0301/);
  assert.match(normal.specimens[1].text, /12  →  տասներկու/);
  const passesIndex = deck.slides.findIndex(slide => slide.textAnchor === "idempotence-pass-example");
  assert.equal(deck.slides[passesIndex + 1].textAnchor, "idempotence-not-correctness");
  assert.equal(deck.slides[passesIndex + 1].answerCode, 'def normalize(text):\n    return ""');
  const evidence = deck.slides.find(slide => slide.textAnchor === "language-evidence-sources");
  assert.equal(JSON.parse(evidence.specimens[0].text).human_audit_label, null);
  for (const label of ["mostly_hy", "mostly_en", "mixed_hy_en", "unknown", "insufficient_text"]) {
    assert.ok(evidence.specimens[1].text.includes(label));
    assert.ok(chapter.includes(label));
  }
  const baseRate = deck.slides.find(slide => slide.textAnchor === "language-base-rate-example");
  assert.match(baseRate.specimens[0].text, /90 correct flags/);
  assert.match(baseRate.specimens[1].text, /999 wrong flags/);
  assert.match(baseRate.items.join(" "), /90 \/ 1,089 ≈ 8\.3%/);
  assert.equal((90 / (90 + 999) * 100).toFixed(1), "8.3");
  assert.match(chapter, /90 \+ 999 = 1,089/);
});

for (let number = 4; number <= 4; number += 1) {
  test(`Lecture ${number}: chapter and browser presentation stay aligned`, async () => {
    const chapter = read(`content/lectures/lecture-${number}.qmd`);
    const headings = new Set([...chapter.matchAll(/^#{1,4}\s+(.+?)(?:\s*\{[^}]+\})?\s*$/gm)].map((match) => match[1]));
    assert.ok(chapter.split(/\s+/).length >= 3500, "Chapter must be a detailed lesson, not an outline");
    assert.match(chapter, /## What to remember/);
    assert.match(chapter, /## References/);
    const generated = read(`app/generated/lecture-${number}.ts`);
    const html = JSON.parse(generated.match(/export const \w+ = (.*);/)?.[1] ?? '""');
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, "Render exactly one chapter title");
    if (number >= 9) assert.match(chapter, /<details[\s>]/, "Include an answer-reveal checkpoint");
    assert.match(chapter, /```(?:python|bash|json)/, "Include a concrete technical artifact");
    assert.doesNotMatch(chapter, /^title:.*\(draft\)/m);
    for (const citation of chapter.matchAll(/\[[^\]\n]*@[a-zA-Z][^\]\n]*\]/g)) {
      for (const [, key] of citation[0].matchAll(/@([a-zA-Z][\w:-]*)/g)) {
        assert.ok(citationKeys.has(key), `Missing bibliography entry: ${key}`);
      }
    }

    const deck = await loadDeck(number);
    assert.equal(deck.number, number);
    assert.ok(deck.title && deck.subtitle);
    assert.ok(deck.slides.length >= 25, "Expected a complete teaching deck");
    assert.ok(deck.slides.some((slide) => slide.kind === "question"), "Include a teaching pause");
    assert.ok(deck.slides.some((slide) => ["flow", "table", "comparison", "bars"].includes(slide.kind)), "Include visual structure");

    for (const [index, slide] of deck.slides.entries()) {
      const label = `Lecture ${number}, slide ${index + 2}: ${slide.title}`;
      assert.ok(slide.title?.length <= 60, `${label}: title is too long`);
      assert.ok(headings.has(slide.section), `${label}: section is not an exact chapter heading: ${slide.section}`);
      assert.ok(slide.notes?.length >= 80, `${label}: needs explanatory speaker notes`);
      assert.ok(slide.source?.label, `${label}: needs a source/constructed-example footer`);
      assert.ok(!slide.items || slide.items.length <= 6, `${label}: too many visible items`);
      assert.ok(!slide.rows || slide.rows.length <= 6, `${label}: too many table rows`);
      assert.ok(!slide.headers || slide.headers.length <= 4, `${label}: too many table columns`);
      if (slide.rows && slide.headers) for (const row of slide.rows) {
        assert.equal(row.length, slide.headers.length, `${label}: mismatched table cells`);
      }
      if (slide.kind === "question") assert.ok(slide.prompt && slide.answer, `${label}: incomplete question`);
      if (slide.kind === "reading") assert.ok(slide.readingText, `${label}: missing reading prompt`);
      if (slide.kind === "formula") {
        assert.ok(slide.formula, `${label}: missing formula`);
        assert.doesNotMatch(slide.formula, /\\(?:frac|sum|theta|mathcal|begin)/, `${label}: use native math, not unrendered TeX`);
      }
      if (slide.kind === "code") assert.ok(slide.code && slide.code.split("\n").length <= 12, `${label}: code must fit the slide`);
      if (slide.kind === "bars") for (const bar of slide.bars ?? []) {
        assert.ok(bar.label && Number.isFinite(bar.value) && bar.value >= 0, `${label}: invalid bar`);
        if (slide.unit === "%") assert.ok(bar.value <= 100, `${label}: percentage exceeds the fixed chart scale`);
      }
      if (slide.source?.url) assert.match(slide.source.url, /^https:\/\//, `${label}: invalid source URL`);
    }
  });
}
