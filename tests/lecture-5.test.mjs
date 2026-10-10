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

test("Lecture 5 is published without draft labels and without unpublished lecture imports", async () => {
  const label = "Lecture 5: Corpus integrity—deduplication, contamination, and privacy";
  const chapter = read("content/lectures/lecture-5.qmd");
  assert.ok(chapter.includes('title: "' + label + '"'));
  assert.ok(read("app/page.tsx").includes(label));
  assert.ok(read("content/lectures/curriculum.qmd").includes("**" + label));
  const generated = read("app/generated/lecture-5.ts");
  const html = JSON.parse(generated.match(/export const \w+ = (.*);/)[1]);
  const title = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1];
  assert.ok(title.includes(label));
  assert.doesNotMatch(title, /draft/i);
  const presentation = read("app/FutureLecturePresentation.tsx");
  assert.ok(presentation.includes("const isDraft = deck.number > 5;"));
  assert.match(presentation, /const decks: Record<number, LectureDeck> = \{ 4: lecture4, 5: lecture5 \}/);
  assert.doesNotMatch(presentation, /import lecture(?:[6-9]|1[0-6]) from/);
  assert.equal((await loadDeck(5)).slides.length + 1, 40);
});

test("Lecture 5 clustering graphs stay in chapter order and preserve policy distinctions", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const start = deck.slides.findIndex(slide => slide.title === "Near-duplicate links are not transitive");
  const graphs = deck.slides.slice(start, start + 4);
  assert.deepEqual(graphs.map(slide => slide.image?.src), [
    "lecture-5/clustering-verified-chain.svg",
    "lecture-5/clustering-policy-groups.svg",
    "lecture-5/clustering-representative-order.svg",
    "lecture-5/clustering-branch-policies.svg",
  ]);
  for (const [index, slide] of graphs.entries()) {
    assert.equal(slide.kind, "image");
    assert.ok(slide.image.alt.length > 80);
    assert.ok(chapter.includes(slide.image.src));
    const svg = read("public/" + slide.image.src);
    assert.match(svg, /aria-labelledby="title desc"/);
    assert.match(svg, /<desc id="desc">/);
    assert.doesNotMatch(svg, /<image\b/, "Use native vector diagrams, not embedded screenshots");
    const witnesses = [...svg.matchAll(/<path\b[^>]*marker-end="url\(#arrow\)"[^>]*\/>/g)];
    assert.equal(witnesses.length, [0, 1, 3, 2][index], "Every shown removal needs a visible witness arrow");
    for (const [path] of witnesses) {
      assert.equal((path.match(/\bM/g) ?? []).length, 1, "Render each witness as a separate arrow path");
    }
  }
  assert.match(graphs[1].notes, /all-pairs-consistent/);
  assert.match(graphs[1].notes, /not a unique answer/);
  assert.match(graphs[2].notes, /removed B cannot become a retained witness/);
  assert.match(graphs[3].notes, /only verified edges are A–B, B–C, B–D and D–E/);
  const divider = deck.slides.findIndex(slide => slide.title === "Decontamination");
  assert.ok(start + 4 <= divider, "Clustering remains within deduplication");
  assert.equal(deck.slides[divider + 1].title, "Define the protected boundary");
});

test("Lecture 5 goes from clustering to decontamination without the removed wrap-up slides", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const removed = [
    ["Which original or revision should survive?", "12. Choosing a representative is a modeling decision"],
    ["Find repeated blocks inside different documents", "13.1 Span-level methods"],
    ["Rolling hashes reuse the adjacent window", "13.3 Rolling hashes: update a window instead of rehashing it"],
    ["Winnowing retains local fingerprint coverage", "13.4 Winnowing: retain fingerprints with a local coverage guarantee"],
    ["Span removal can leave a proof without a claim", "13.2 Removing spans can damage structure"],
    ["Keep the evidence behind the retained copy", "2.1 Record identity must survive deduplication"],
    ["From repeated copies to a curated corpus", "9.2 Candidate generation pipeline"],
  ];
  for (const [title, section] of removed) {
    assert.ok(!deck.slides.some(slide => slide.title === title), `Removed slide must stay out: ${title}`);
    assert.ok(chapter.includes(section), `Keep the detailed chapter section: ${section}`);
  }
  const branch = deck.slides.findIndex(slide => slide.title === "Branches expose the removal policy");
  assert.equal(deck.slides[branch + 1].title, "Decontamination");
  assert.equal(deck.slides[branch + 1].kind, "divider");
  assert.equal(deck.slides[branch + 2].title, "Define the protected boundary");
  assert.doesNotMatch(deck.slides[branch + 1].notes, /has covered.*repeated spans/);
});

test("Lecture 5 decontamination follows boundary, provenance, four layers, and task verification", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const divider = deck.slides.findIndex(slide => slide.title === "Decontamination");
  const schema = deck.slides.slice(divider + 1, divider + 10).filter(slide => slide.title !== "BM25: inverted index, TF, and IDF");
  assert.deepEqual(schema.map(slide => slide.title), [
    "Define the protected boundary",
    "The same task can change its surface",
    "Provenance graph and protected closure",
    "Layer 1: exact normalized matching",
    "Layer 2: substring / containment matching",
    "Layer 3: approximate lexical retrieval",
    "Layer 4: semantic / cross-lingual retrieval",
    "Similar vectors can hide different tasks",
  ]);
  for (const slide of schema.slice(0, 7)) {
    assert.equal(slide.kind, "image");
    assert.ok(slide.image.alt.length > 100);
    assert.ok(chapter.includes(slide.image.src));
    const svg = read("public/" + slide.image.src);
    assert.match(svg, /aria-labelledby="title desc"/);
    assert.doesNotMatch(svg, /<image\b/, "Keep the examples as native vector diagrams");
  }
  assert.equal(deck.slides[divider + 10].title, "Privacy-Oriented Processing");
  for (const title of ["Protect an evaluation unit, not a topic", "Protect the descendants too", "The protected seed determines the closure", "Use several kinds of evidence", "One problem, four kinds of resemblance"]) {
    assert.ok(!deck.slides.some(slide => slide.title === title), "Replace the old decontamination opening: " + title);
  }
  assert.match(schema[2].notes, /Missing ancestry does not prove independence/);
  assert.match(schema[4].notes, /high whole-document Jaccard are not required/);
  assert.match(schema[6].notes, /top-k nearest candidates/);
  assert.match(schema[6].notes, /retrieval budget, not a confidence threshold/);
  assert.equal(schema[7].kind, "specimen");
  assert.equal(schema[7].specimens.length, 2);
  assert.match(schema[7].notes, /do not prove independence/);
});

test("Lecture 5 decontamination diagrams omit the removed summary annotations", () => {
  const annotations = [
    ["boundary", ["No protected item or derivative enters training"], ["Training corpus", "Protected benchmarks"]],
    ["task-variants", ["Same quantity · same change · same question"], ["Unit rewrite", "Rephrasing", "Translation"]],
    ["provenance", ["Protect the root + every known descendant", "Collected metadata", "or logged transformations"], ["Protected task", "Collected mirror", "Translation", "Synthetic solution"]],
    ["exact-matching", ["Equal canonical text → protected overlap", "Same exact-key method · protected set versus training set"], ["Protected prompt", "Training copy", "87efa3b8f082…"]],
    ["substring", ["Find the protected passage, not an equal document"], ["Protected question", "Long training document"]],
    ["lexical", ["Reuse lexical retrieval · query protected items against training", "Shared lexical evidence · different exact keys"], ["Shingles / word index", "Candidates", "Verify the task"]],
    ["semantic", ["Candidate retrieval → verify evidence before deciding"], ["Multilingual embedding model", "Query vector", "Document vectors", "Vector similarity search · cosine", "Top-k semantic candidates", "Human review"]],
  ];
  for (const [image, removed, retained] of annotations) {
    const svg = read(`public/lecture-5/decontamination-${image}.svg`);
    const visibleText = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1]).join("\n");
    for (const label of removed) assert.ok(!visibleText.includes(label), `Removed annotation: ${label}`);
    for (const label of retained) assert.ok(visibleText.includes(label), `Keep diagram label: ${label}`);
    assert.match(svg, /aria-labelledby="title desc"/, "Keep accessible explanations");
  }
});

test("Lecture 5 explains BM25 with an inverted index and native TF/IDF formulas after layer 3", async () => {
  const deck = await loadDeck(5);
  const index = deck.slides.findIndex(slide => slide.title === "BM25: inverted index, TF, and IDF");
  const slide = deck.slides[index];
  assert.equal(deck.slides.filter(candidate => candidate.title === slide.title).length, 1);
  assert.equal(deck.slides[index - 1].title, "Layer 3: approximate lexical retrieval");
  assert.equal(deck.slides[index + 1].title, "Layer 4: semantic / cross-lingual retrieval");
  assert.equal(slide.kind, "formula");
  assert.deepEqual(slide.rows, [["tank", "A, B, F, G"], ["40", "A, F"], ["liters", "A, B, F"], ["hour", "A, F, H"]]);
  assert.match(slide.formula, /TF\(t,D\) = f\(t,D\)/);
  assert.match(slide.formula, /IDF\(t\) = ln\(1 \+ \(N − df\(t\) \+ 0\.5\)\/\(df\(t\) \+ 0\.5\)\)/);
  assert.match(slide.formula, /k₁\(1 − b \+ b\|D\|\/avgdl\)/);
  assert.match(slide.formula, /BM25\(D,Q\) = ∑ₜ∈Q IDF\(t\) · TFnorm\(t,D\)/);
  assert.match(slide.notes, /not plain TF×IDF/);
  assert.match(slide.notes, /not exclusion decisions/);
  const chapter = read("content/lectures/lecture-5.qmd");
  assert.match(chapter, /#l5-bm25-retrieval/);
  assert.match(chapter, /#l5-bm25-formulas/);
  assert.match(chapter, /@manning2008ir/);
  const generated = read("app/generated/lecture-5.ts");
  const html = JSON.parse(generated.match(/export const \w+ = (.*);/)[1]);
  const formulas = html.split('id="l5-bm25-formulas"')[1]?.split("</div>")[0];
  assert.equal([...formulas.matchAll(/<math\b/g)].length, 4, "Render all four formulas from the lecture source");
  assert.equal([...formulas.matchAll(/<mfrac\b/g)].length, 2, "Use native fractions, not formula images");
  assert.doesNotMatch(formulas, /<merror\b|<img\b/);
});

test("Lecture 5 finishes decontamination with concrete review examples, preserving removed-slide chapter details", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  for (const [title, section] of [
    ["Apply the decision policy", "16.9 Apply a declared decision policy"],
    ["Audit the decontamination boundary", "16.10 Audit the decontamination boundary"],
    ["No matches: what may we claim?", "18. Decontamination cannot prove independence"],
    ["Repeated final-test tuning is exposure", "18.1 Development leakage versus final-test leakage"],
  ]) {
    assert.ok(!deck.slides.some(slide => slide.title === title), "Remove marked slide: " + title);
    assert.ok(chapter.includes(section), "Preserve detailed lecture section: " + section);
  }
  assert.ok(!deck.slides.some(slide => slide.title === "Verify candidates with evidence"));
  const index = deck.slides.findIndex(slide => slide.title === "Similar vectors can hide different tasks");
  const slide = deck.slides[index];
  assert.equal(deck.slides[index - 1].title, "Layer 4: semantic / cross-lingual retrieval");
  assert.equal(deck.slides[index + 1].title, "Privacy-Oriented Processing");
  assert.match(slide.specimens[0].text, /40 L[\s\S]*loses 5 L[\s\S]*6 hours[\s\S]*Answer: 10 L/);
  assert.match(slide.specimens[1].text, /100 L[\s\S]*gains 5 L[\s\S]*6 hours[\s\S]*Answer: 130 L/);
  assert.equal(40 - 5 * 6, 10);
  assert.equal(100 + 5 * 6, 130);
  assert.match(slide.notes, /no measured cosine score/);
  assert.match(slide.notes, /parameterized derivative/);
  assert.match(chapter, /top-\$k\$/);
  assert.match(chapter, /#l5-bm25-formulas/);
});

test("Lecture 5 introduces privacy processing with its renamed section divider", async () => {
  const deck = await loadDeck(5);
  const index = deck.slides.findIndex(slide => slide.title === "Privacy-Oriented Processing");
  assert.equal(deck.slides.filter(slide => slide.title === "Privacy-Oriented Processing").length, 1);
  assert.ok(!deck.slides.some(slide => slide.title === "PII removal"));
  assert.equal(deck.slides[index].kind, "divider");
  assert.equal(deck.slides[index].section, "Part III — Privacy-oriented processing");
  assert.equal(deck.slides[index - 1].title, "Similar vectors can hide different tasks");
  assert.equal(deck.slides[index + 1].title, "Mask an email; substitute a name");
  assert.match(deck.slides[index].notes, /personally identifiable information/);
  assert.match(deck.slides[index].notes, /not a formal privacy guarantee/);
});

test("Lecture 5 starts privacy with fabricated transformations, then two detector families", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const index = deck.slides.findIndex(slide => slide.title === "Privacy-Oriented Processing");
  const examples = deck.slides[index + 1];
  const detection = deck.slides[index + 2];
  assert.ok(!deck.slides.some(slide => slide.title === "“Remove PII” is not a detector specification"));
  assert.ok(chapter.includes("19. Define the privacy scope before building detectors"));
  assert.equal(examples.image.src, "lecture-5/privacy-transformation-examples.svg");
  assert.equal(detection.title, "Rule-based and model-based detection");
  assert.equal(detection.image.src, "lecture-5/privacy-detector-families.svg");
  assert.equal(deck.slides[index + 3].title, "A detector proposes; a policy acts");
  for (const slide of [examples, detection]) {
    assert.equal(slide.kind, "image");
    assert.ok(chapter.includes(slide.image.src));
    assert.ok(chapter.includes("#" + slide.textAnchor));
    const svg = read("public/" + slide.image.src);
    assert.match(svg, /aria-labelledby="title desc"/);
    assert.doesNotMatch(svg, /<image\b/, "Use native editable vector text and shapes");
  }
  const fixture = read("public/" + examples.image.src);
  for (const text of ["physlab@example.org", "&lt;EMAIL&gt;", "Mariam Petrosyan", "Anna Harutyunyan", "synthetic alias"]) assert.ok(fixture.includes(text));
  assert.equal((fixture.match(/The lab studies physics\./g) ?? []).length, 2);
  assert.equal((fixture.match(/joined the lab\./g) ?? []).length, 2);
  assert.match(examples.notes, /not automatically personal data/);
  assert.match(examples.notes, /rather than another real person's identity/);
  assert.match(examples.notes, /not a guarantee of anonymity/);
  const diagram = read("public/" + detection.image.src);
  for (const text of ["Input document", "Rule-based detection", "Model-based detection", "Regex · checksums · lists", "NER · context-aware models", "Combined sensitive span detections"]) assert.ok(diagram.includes(text));
  assert.equal((diagram.match(/<path class="edge"/g) ?? []).length, 4);
  assert.match(detection.notes, /not mutually exclusive/);
});

test("Lecture 5 replaces privacy metrics with action examples and removes marked technical slides", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const generated = read("app/generated/lecture-5.ts");
  const index = deck.slides.findIndex(slide => slide.textAnchor === "l5-privacy-action-examples");
  const slide = deck.slides[index];
  assert.equal(slide.title, "Choose how to handle sensitive data");
  assert.equal(slide.section, "22. Detection and action are separate decisions");
  assert.equal(slide.kind, "table");
  assert.deepEqual(slide.headers, ["Action", "Before", "After"]);
  assert.deepEqual(slide.rows, [
    ["Masking", "maya@example.org", "<EMAIL>"],
    ["Synthetic replacement", "Mariam joined the lab.", "Anna joined the lab."],
    ["Sentence removal", "The lab is open. Email: maya@example.org.", "The lab is open."],
    ["Document removal", "Private chat: Mariam’s diagnosis…", "Not admitted to training"],
  ]);
  assert.ok(chapter.includes("#" + slide.textAnchor));
  assert.ok(generated.includes(slide.textAnchor));
  for (const row of slide.rows) for (const cell of row) assert.ok(chapter.includes(cell));
  assert.equal(deck.slides[index - 1].title, "A detector proposes; a policy acts");
  assert.equal(index, deck.slides.length - 1, "The presentation now ends with the privacy action examples");
  assert.match(slide.notes, /fabricated classroom fixtures/);
  assert.match(slide.notes, /fictional alias rather than another real person's identity/);
  assert.match(slide.notes, /not a claim of anonymity/);
  assert.match(slide.notes, /rather than deleting all stored evidence/);
  for (const title of [
    "A document-level hit can hide missed spans",
    "One prefix, three different offsets",
    "Technical numbers are not all identifiers",
    "Replace from the end to preserve offsets",
    "Overlapping masks need one action plan",
    "Is a deduplicated, masked corpus private?",
  ]) assert.ok(!deck.slides.some(candidate => candidate.title === title));
  for (const section of [
    "21. Span detection and document detection are different metrics",
    "21.3 Offset coordinates are part of the detector contract",
    "23. False positives are not harmless",
    "22.1 Safe span replacement",
    "22.3 Resolve overlap before replacing text",
    "24. Deduplication is not a privacy guarantee",
  ]) assert.ok(chapter.includes(section), "Preserve detailed chapter section: " + section);
  assert.equal(deck.slides.length + 1, 40);
});

test("Lecture 5 omits the eleven marked closing slides while preserving the chapter", async () => {
  const deck = await loadDeck(5);
  const chapter = read("content/lectures/lecture-5.qmd");
  const removed = [
    ["Fewer records is not the success criterion", "What to remember"],
    ["Lab: make the counterexample pass", "30. Regression tests for corpus integrity"],
    ["Removing a bridge can split a duplicate group", "29.6 Incremental additions and deletions have different costs"],
    ["The lock says what; evidence says why", "29. A minimal integrity data model"],
    ["More records need not mean more families", "28.2 Family counts matter"],
    ["Which sources lost exposure?", "28. Measure how the corpus changed"],
    ["Zero observed failures is not zero risk", "27.5 What does zero observed failure establish?"],
    ["Equal audit samples are not equal populations", "27.4 Stratified audits need population weights"],
    ["Audit both removal and residual risk", "27. Audit removals, not only retained data"],
    ["Follow one record through the decisions", "26. One record through Lecture 5"],
    ["An early transformation can erase evidence", "25.1 Examples of ordering interactions"],
  ];
  for (const [title, section] of removed) {
    assert.ok(!deck.slides.some(slide => slide.title === title), "Remove marked slide: " + title);
    assert.ok(chapter.includes(section), "Preserve chapter passage: " + section);
  }
  assert.equal(deck.slides.at(-1).title, "Choose how to handle sensitive data");
  assert.equal(deck.slides.at(-2).title, "A detector proposes; a policy acts");
  assert.equal(deck.slides.length + 1, 40);
});
