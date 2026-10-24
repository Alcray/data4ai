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

test("Lecture 6 is published without exposing other unpublished lectures", async () => {
  const label = "Lecture 6: Tokenization and sequence construction";
  const chapter = read("content/lectures/lecture-6.qmd");
  const navigation = read("app/page.tsx");
  const presentation = read("app/FutureLecturePresentation.tsx");
  const html = JSON.parse(read("app/generated/lecture-6.ts").match(/export const \w+ = (.*);/)[1]);
  assert.ok(chapter.includes('title: "' + label + '"'));
  assert.ok(navigation.includes(label));
  assert.ok(read("content/lectures/curriculum.qmd").includes("**" + label));
  assert.ok(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].includes(label));
  assert.doesNotMatch(html, /Lecture 6 \(draft\)/);
  assert.ok(presentation.includes("const isDraft = deck.number > 7;"));
  assert.match(presentation, /6: lecture6/);
  assert.doesNotMatch(presentation, /import lecture(?:[8-9]|1[0-6]) from/);
  assert.doesNotMatch(navigation, /generated\/lecture-(?:[8-9]|1[0-6])/);
  const deck = await loadDeck(6);
  assert.equal(deck.slides.length + 1, 44);
  const citationKeys = new Set([...read("content/references.bib").matchAll(/@\w+\s*\{\s*([^,\s]+)/g)].map(match => match[1]));
  for (const [, key] of chapter.matchAll(/@([a-zA-Z][\w:-]*)/g)) assert.ok(citationKeys.has(key), `Missing citation: ${key}`);
  for (const slide of deck.slides) {
    assert.ok(slide.notes.length >= 80, `Keep speaker notes: ${slide.title}`);
    if (slide.textAnchor) assert.ok(html.includes('id="' + slide.textAnchor + '"'), `Missing chapter destination: ${slide.title}`);
    if (slide.image) assert.match(read("public/" + slide.image.src), /<svg\b/);
  }
});

test("Lecture 6 replaces its opening lists with two measured text visuals", async () => {
  const chapter = read("content/lectures/lecture-6.qmd");
  const deck = await loadDeck(6);
  assert.equal(deck.subtitle, undefined);
  assert.equal(deck.slides.length + 1, 44);
  assert.deepEqual(deck.slides.slice(0, 2).map(slide => slide.textAnchor), ["text-to-model", "tokenizer-text-stages"]);
  for (const title of ["What does the model actually receive?", "One string, several lengths", "Freeze the whole tokenizer"]) {
    assert.ok(!deck.slides.some(slide => slide.title === title), "Replace abstract opening slide: " + title);
  }
  for (const heading of ["Running example: from the curated corpus to tensors", "1. “Token” names several different objects", "2. A tokenizer is not just a vocabulary file"]) {
    assert.ok(chapter.includes(heading), "Preserve detailed chapter material: " + heading);
  }
  for (const slide of deck.slides.slice(0, 2)) {
    assert.equal(slide.kind, "image");
    assert.equal(slide.items, undefined);
    assert.ok(slide.image.alt.length > 120);
    assert.ok(chapter.includes(slide.image.src));
    assert.ok(chapter.includes(`{#${slide.textAnchor}}`));
    const svg = read("public/" + slide.image.src);
    assert.match(svg, /aria-labelledby="title desc"/);
    assert.doesNotMatch(svg, /<image\b/, "Use native text and shapes, not rasterized diagrams");
    if (slide.textAnchor === "text-to-model") assert.match(svg, /· = space/);
    assert.match(slide.source.label, /Qwen3\.8-27B.*Measured/);
  }
});

test("Lecture 6 visual token pieces and IDs reproduce the pinned tokenizer trace", () => {
  const audit = JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const trace = audit.models.find(model => model.name === "Qwen3.8-27B").opening_trace;
  assert.equal(trace.measured_on, "2026-10-16");
  assert.equal(trace.input, "Cafe\u0301 prices change.");
  assert.equal(trace.normalized, trace.input.normalize("NFC"));
  assert.notEqual(trace.normalized, trace.input);
  assert.deepEqual(trace.pre_regions, ["Café", " prices", " change", "."]);
  assert.deepEqual(trace.pieces, ["C", "af", "é", " prices", " change", "."]);
  assert.deepEqual(trace.ids, [34, 2492, 933, 7336, 2222, 13]);
  assert.equal(trace.pieces.join(""), trace.decoded);
  assert.equal(trace.decoded, trace.normalized);
  for (const asset of ["text-to-model", "tokenizer-text-stages"]) {
    const svg = read(`public/lecture-6/${asset}.svg`);
    const mapping = [...svg.matchAll(/<g data-piece="([^"]*)" data-id="(\d+)">/g)].map(match => [match[1], Number(match[2])]);
    assert.deepEqual(mapping, trace.pieces.map((piece, index) => [piece, trace.ids[index]]));
    for (const color of ["violet", "teal", "amber", "blue", "rose", "slate"]) {
      assert.equal((svg.match(new RegExp(`class="token ${color}"`, "g")) ?? []).length, 2, "Match each piece color to its ID color");
    }
  }
  const stages = read("public/lecture-6/tokenizer-text-stages.svg");
  for (const step of ["Normalize", "Pre-tokenize", "Segment", "Assign IDs", "Decode"]) assert.ok(stages.includes(step));
  assert.match(stages, /Cafe\\u0301 prices change\./);
  const visibleStageText = [...stages.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(match => match[1]).join(" ");
  assert.doesNotMatch(visibleStageText, /NFC:|normalized text|combining acute accent|· = space/);
  const intro = read("public/lecture-6/text-to-model.svg");
  for (const label of ["Embedding lookup", "Transformer", "Language model"]) assert.ok(intro.includes(label));
});

test("Lecture 6 release inspection preserves distinct inventory counts and immutable revisions", async () => {
  const chapter = read("content/lectures/lecture-6.qmd");
  const audit = JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const deck = await loadDeck(6);
  assert.equal(audit.inspected_on, "2026-10-13");
  assert.deepEqual(audit.libraries, { tokenizers: "0.23.3", tiktoken: "0.14.0" });
  assert.equal(audit.models.length, 4);
  assert.deepEqual(audit.models.map(model => model.name), ["Qwen3.8-27B", "DeepSeek-V4-Pro", "GLM-5.3", "Kimi-K3"]);
  const inventory = deck.slides.find(slide => slide.textAnchor === "released-tokenizer-artifacts");
  assert.deepEqual(inventory.headers, ["Release", "BPE entries", "Loaded IDs", "Embedding rows"]);
  for (const [index, model] of audit.models.entries()) {
    assert.match(model.revision, /^[a-f0-9]{40}$/);
    assert.ok(chapter.includes(`${model.repository}/tree/${model.revision}`));
    for (const hash of Object.values(model.sha256)) assert.match(hash, /^[a-f0-9]{64}$/);
    const counts = [model.model_entries, model.effective_ids, model.embedding_rows];
    assert.deepEqual(inventory.rows[index].slice(1), counts.map(n => n.toLocaleString("en-US")));
    assert.ok(counts[0] <= counts[1] && counts[1] <= counts[2]);
  }
  assert.match(chapter, /already includes three boundary\/padding entries/);
  assert.match(chapter, /ignore_merges: true/);
  assert.match(chapter, /does \*\*not\*\* mean it uses an OpenAI model's vocabulary/);
  assert.match(chapter, /A newer checkpoint can retain its subwords while changing its interface/);
  assert.match(chapter, /older revisions establish the comparison, not a substitute implementation/);
  assert.deepEqual(inventory.rows.map(row => row[0]), ["Qwen3.8", "DeepSeek-V4", "GLM-5.3", "Kimi K3"]);
});

test("Lecture 6 measured fixtures remain in the chapter after the audit slide is removed", async () => {
  const audit = JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const deck = await loadDeck(6);
  const chapter = read("content/lectures/lecture-6.qmd");
  assert.ok(!deck.slides.some(slide=>slide.textAnchor==="released-tokenizer-audit"));
  assert.match(chapter,/14\.1 A measured released-tokenizer fixture audit/);
  const digits = deck.slides.find(slide => slide.title === "Pre-tokenization: one digit or three?");
  assert.equal(Object.keys(audit.fixtures).length, 9);
  assert.equal(audit.fixtures.code, "def square(x):\n    return x * x\n");
  assert.deepEqual(audit.models.map(m => m.results.armenian.count), [27, 23, 37, 23]);
  assert.deepEqual(audit.models.map(m => m.results.digits.count), [9, 3, 5, 3]);
  for (const [index, model] of audit.models.entries()) {
    for (const [fixture, result] of Object.entries(model.results)) {
      assert.equal(result.count, result.ids.length);
      assert.ok(result.ids.every(id => Number.isInteger(id) && id >= 0 && id < model.effective_ids));
      const expected = index === 0 ? audit.fixtures[fixture].normalize("NFC") : audit.fixtures[fixture];
      assert.equal(result.decoded, expected);
      assert.equal(result.original_bytes_preserved, expected === audit.fixtures[fixture]);
    }
    const composed = model.results.composed_accent;
    const decomposed = model.results.decomposed_accent;
    assert.equal(composed.count, 1);
    assert.equal(decomposed.count, index === 0 ? 1 : 2);
    if (index === 0) assert.deepEqual(composed.ids, decomposed.ids);
  }
  assert.match(chapter, /A small correctness fixture set is not a language benchmark/);
  assert.deepEqual(digits.headers, ["123456789", "Pre-tokenizer regions", "Max digits / region"]);
  for (const [index, model] of audit.models.slice(0, 2).entries()) {
    const regions = model.pretokenization_probes["123456789"];
    assert.equal(digits.rows[index][1], regions.join(" / "));
    assert.equal(digits.rows[index][2], String(Math.max(...regions.map(region => region.length))));
    assert.deepEqual(model.pretokenization_probes["hello world"], ["hello", " world"]);
    assert.deepEqual(model.pretokenization_probes["hello world!"], ["hello", " world", "!"]);
  }
  assert.match(chapter, /does \*\*not\*\* disable recognition/);
  assert.match(read("scripts/audit-lecture6-tokenizers.py"), /ast\.literal_eval/);
  assert.doesNotMatch(read("scripts/audit-lecture6-tokenizers.py"), /trust_remote_code\s*=\s*True/);
});

test("Lecture 6 uses example-only normalization and introduces bytes and BPE before the models", async () => {
  const chapter = read("content/lectures/lecture-6.qmd");
  const deck = await loadDeck(6);
  const at = anchor => deck.slides.findIndex(slide => slide.textAnchor === anchor);
  assert.ok(at("tokenizer-text-stages") < at("normalization-overview"));
  assert.ok(at("normalization-overview") < at("pretokenization-hello"));
  assert.ok(at("pretokenization-hello") < deck.slides.findIndex(slide => slide.title === "Pre-tokenization: one digit or three?"));
  assert.ok(at("pretokenization-hello") < at("segmentation-methods"));
  assert.ok(at("pretokenization-hello") < at("byte-level-bpe"));
  assert.ok(at("released-number-splits") < at("byte-level-bpe"));
  assert.ok(at("normalization-overview") < at("utf8-character-bytes"));
  assert.ok(at("utf8-character-bytes") < at("byte-level-bpe"));
  assert.ok(at("byte-level-bpe") < at("bpe-visual-counts"));
  assert.ok(at("bpe-visual-counts") < at("bpe-visual-recount"));
  assert.ok(at("bpe-visual-recount") < at("bpe-visual-result"));
  assert.ok(at("bpe-visual-result") < at("released-tokenizer-artifacts"));
  const overview = deck.slides[at("normalization-overview")];
  assert.equal(overview.kind, "image");
  const normalization = read("public/" + overview.image.src);
  const visibleNormalizationText = [...normalization.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(match => match[1]);
  assert.deepEqual([...normalization.matchAll(/<g data-before="([^"]+)" data-after="([^"]+)">/g)].map(match => match.slice(1)), [["e + ◌́","é"],["ａ","a"],["ﬃ","ffi"],["①","1"],["HELLO","hello"],["եվ","և"],["7","seven"]]);
  assert.equal(visibleNormalizationText.length, 21, "Only seven before/arrow/after rows");
  assert.doesNotMatch(visibleNormalizationText.join(" "), /NFC|NFKC|Normalization Form|Lowercasing|Technique|Operation|policy|decomposition|composition/);
  assert.equal(deck.slides.filter(slide => /normalization-(?:nfc|nfkc|lowercase|custom|overview)/.test(slide.textAnchor ?? "")).length, 1);
  for (const title of ["Lossless with respect to what?", "A round trip can change the original bytes"]) {
    assert.ok(!deck.slides.some(slide => slide.title === title));
  }
  for (const anchor of ["normalization-nfc", "normalization-nfkc", "normalization-lowercase", "normalization-custom"]) {
    assert.ok(chapter.includes(`{#${anchor}}`), "Keep detailed normalization material in the chapter");
  }
  assert.equal("e\u0301".normalize("NFC"), "é");
  assert.equal("ａ".normalize("NFKC"), "a");
  assert.equal("а".normalize("NFKC"), "а", "Do not conflate Cyrillic and Latin a");
  assert.equal("և".normalize("NFC"), "և");
  assert.equal("և".normalize("NFKC"), "եւ");
  assert.equal("ԲԱՐԵՎ".toLowerCase().replaceAll("եվ", "և"), "բարև");
  assert.equal("ԲԱՐԵՎ".replaceAll("եվ", "և").toLowerCase(), "բարեվ");
  assert.match(chapter, /not a universal Armenian spelling corrector/);
  assert.match(chapter, /not a blanket NFKC-plus-lowercase-plus-rewrite pipeline/);
  const map = deck.slides[at("segmentation-methods")];
  assert.equal(map.title, "Other tokenization techniques");
  assert.deepEqual(map.rows.map(row => row[0]), ["BPE", "Unigram", "WordPiece", "Byte Latent Transformer"]);
  assert.match(map.rows.at(-1)[1], /no fixed subwords/);
  for (const title of ["An overlap cannot be merged twice", "Encoding replays learned merge priority", "Unigram chooses a segmentation path", "WordPiece takes the longest match first", "Beyond fixed vocabulary: adaptive byte patches", "BPE training keeps four connected views", "One merge changes only nearby edges", "Refresh priorities; skip stale heap entries"]) {
    assert.ok(!deck.slides.some(slide => slide.title === title), "Remove marked presentation slide: " + title);
  }
  for (const passage of ["6.2 Overlap matters", "8. Encoding new text requires the learned merge order", "11. Best unigram segmentation by dynamic programming", "WordPiece: greedy longest-match encoding", "11.1 A research frontier: adaptive byte patches", "Indexed BPE training", "Update only neighboring edges", "Lazy heap updates"]) {
    assert.ok(chapter.includes(passage), "Keep the written explanation: " + passage);
  }
});

test("Lecture 6 shows exact one-, two-, and three-byte UTF-8 examples", async () => {
  const deck = await loadDeck(6);
  const slide = deck.slides.find(slide => slide.textAnchor === "utf8-character-bytes");
  assert.equal(slide.kind, "image");
  assert.match(slide.title, /UTF-8/);
  const svg = read("public/" + slide.image.src);
  const rows = [...svg.matchAll(/<g data-character="([^"]+)" data-bytes="([^"]+)">/g)].map(match => [match[1], match[2].split(",").map(Number)]);
  assert.deepEqual(rows, [["A",[65]],["Я",[208,175]],["中",[228,184,173]]]);
  assert.deepEqual(rows.map(([char,bytes]) => [Buffer.from(char).length,bytes.length]), [[1,1],[2,2],[3,3]]);
  for (const [char, bytes] of rows) assert.deepEqual([...Buffer.from(char,"utf8")],bytes);
  assert.match(slide.notes, /supplementary-plane characters can require four bytes/);
  assert.match(read("content/lectures/lecture-6.qmd"), /not fixed byte counts for languages/);
});

test("Lecture 6 moves from complete tokenizer mechanics into a plain Part 2 selection divider", async () => {
  const deck=await loadDeck(6);
  const dividerIndex=deck.slides.findIndex(slide=>slide.textAnchor==="choosing-tokenizer");
  const divider=deck.slides[dividerIndex];
  assert.equal(divider.kind,"divider");
  assert.equal(divider.title,"Part 2 — Choosing a tokenizer");
  for(const field of ["items","image","rows","code","formula","prompt"])assert.equal(divider[field],undefined,"Keep the divider plain");
  for(const anchor of ["tokenizer-text-stages","normalization-overview","utf8-character-bytes","byte-level-bpe","bpe-hashmap-scan","bpe-build-inverted-index","bpe-create-merged-token","bpe-indexed-replacement","bpe-indexed-result","pretokenization-hello","segmentation-methods"]) {
    const index=deck.slides.findIndex(slide=>slide.textAnchor===anchor);
    assert.ok(index>=0&&index<dividerIndex,"Explain mechanics before selection: "+anchor);
  }
  assert.equal(deck.slides[dividerIndex-1].textAnchor,"segmentation-methods");
  assert.deepEqual(deck.slides.slice(dividerIndex+1,dividerIndex+4).map(slide=>slide.textAnchor),["vocabulary-size-experiment","tokenizer-sampling-example","tokenizer-sampling-heldout"]);
  for(const title of ["Two samplers, two different jobs","An audit makes the tradeoff visible","Measure the same text, not vocabulary size","Inherit the checkpoint's token meanings"]) {
    assert.ok(!deck.slides.some(slide=>slide.title===title));
  }
  assert.equal(deck.slides[dividerIndex+4].textAnchor,"serializing-content");
  assert.ok(read("content/lectures/lecture-6.qmd").includes("{#choosing-tokenizer}"));
});

test("Lecture 6 uses plain numbered Part 2–4 dividers at the teaching transitions", async () => {
  const deck=await loadDeck(6);
  const chapter=read("content/lectures/lecture-6.qmd");
  const html=JSON.parse(read("app/generated/lecture-6.ts").match(/export const \w+ = (.*);/)[1]);
  const expected=[
    ["Part 2 — Choosing a tokenizer","choosing-tokenizer","BPE vocabulary size: diminishing returns"],
    ["Part 3 — Additional tokens and multimodality","serializing-content","Qwen: message borders and roles"],
    ["Part 4 — Packing and context","packing-and-context","Shift once: every arrow is a target"],
  ];
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==="divider").map(slide=>slide.title),expected.map(row=>row[0]));
  for(const [title,anchor,next] of expected) {
    const index=deck.slides.findIndex(slide=>slide.title===title),slide=deck.slides[index];
    assert.equal(slide.textAnchor,anchor);
    assert.equal(deck.slides[index+1].title,next);
    for(const field of ["image","items","rows","code","formula","prompt"])assert.equal(slide[field],undefined);
    assert.ok(chapter.includes(`{#${anchor}}`));
    assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]===anchor).length,1,"Divider has one rendered chapter destination: "+anchor);
  }
});

test("Lecture 6 vocabulary-size example distinguishes illustrative held-out totals from vocabulary sizes", async () => {
  const deck=await loadDeck(6),example=JSON.parse(read("content/fixtures/lecture6-selection-examples.json"));
  assert.equal(example.status,"illustrative-not-measured");
  const setup=example.vocabulary_comparison;
  assert.equal(setup.fitting_documents,100000);
  assert.match(setup.evaluation,/held-out.*disjoint/);
  assert.deepEqual(setup.candidates,[{vocabulary_ids:32000,heldout_tokens:50000000},{vocabulary_ids:64000,heldout_tokens:40000000},{vocabulary_ids:128000,heldout_tokens:38000000}]);
  assert.equal(setup.conditional_choice,64000);
  const plot=read("public/lecture-6/bpe-vocabulary-size.svg");
  const shown=[...plot.matchAll(/data-vocabulary="(\d+)" data-heldout-tokens="(\d+)" data-reduction="([^"]+)"/g)].map(m=>[Number(m[1]),Number(m[2]),m[3]==="none"?null:Number(m[3])]);
  assert.deepEqual(shown,setup.candidates.map((row,i)=>[row.vocabulary_ids,row.heldout_tokens,i?100*(setup.candidates[i-1].heldout_tokens-row.heldout_tokens)/setup.candidates[i-1].heldout_tokens:null]));
  assert.deepEqual(shown.map(row=>row[2]),[null,20,5]);
  assert.equal(setup.candidates[2].vocabulary_ids/setup.candidates[1].vocabulary_ids,2);
  const slide=deck.slides.find(slide=>slide.textAnchor==="vocabulary-size-experiment");
  assert.match(slide.source.label,/Illustrative.*Not measured/);
  assert.match(slide.notes,/same disjoint held-out text/);
  assert.match(slide.notes,/constructed teaching case, not results/);
  assert.match(plot,/Illustrative outcomes, not measurements/);
  for(const title of ["A vocabulary is a parameter budget","The same window covers different text","Would you choose the shortest tokenizer?"])assert.ok(!deck.slides.some(slide=>slide.title===title));
  assert.match(read("content/lectures/lecture-6.qmd"),/67\{,\}108\{,\}864/);
});

test("Lecture 6 sampling case reconciles GB, held-out totals, and declared word/lexeme denominators", async () => {
  const deck=await loadDeck(6),sample=JSON.parse(read("content/fixtures/lecture6-selection-examples.json")).sampling_comparison;
  const slices=sample.slices;
  assert.equal(sample.pool_bytes,100e9);assert.equal(sample.sample_bytes,10e9);assert.equal(sample.vocabulary_ids,64000);
  assert.deepEqual(slices.map(row=>row.name),["English","Spanish","Code"]);
  for(const [key,total] of [["pool_bytes",sample.pool_bytes],["sample_a_bytes",sample.sample_bytes],["sample_b_bytes",sample.sample_bytes]]) {
    assert.equal(slices.reduce((sum,row)=>sum+row[key],0),total);
    for(const row of slices)assert.ok(row[key]<=row.pool_bytes,"Samples fit within the eligible pool");
  }
  assert.deepEqual(slices.map(row=>100*row.pool_bytes/sample.pool_bytes),[80,15,5]);
  assert.deepEqual(slices.map(row=>100*row.sample_a_bytes/sample.sample_bytes),[80,15,5]);
  assert.deepEqual(slices.map(row=>100*row.sample_b_bytes/sample.sample_bytes),[50,40,10]);
  const mixture=read("public/lecture-6/bpe-sampling-mixtures.svg");
  assert.deepEqual([...mixture.matchAll(/data-slice="([^"]+)" data-pool-bytes="(\d+)" data-sample-a-bytes="(\d+)" data-sample-b-bytes="(\d+)"/g)].map(m=>[m[1],...m.slice(2).map(Number)]),slices.map(row=>[row.name,row.pool_bytes,row.sample_a_bytes,row.sample_b_bytes]));
  const evaluation=read("public/lecture-6/bpe-sampling-evaluation.svg");
  assert.deepEqual([...evaluation.matchAll(/data-slice="([^"]+)" data-units="(\d+)" data-unit="([^"]+)" data-tokens-a="(\d+)" data-tokens-b="(\d+)" data-ratio-a="([^"]+)" data-ratio-b="([^"]+)"/g)].map(m=>[m[1],Number(m[2]),m[3],...m.slice(4).map(Number)]),slices.map(row=>[row.name,row.heldout_units,row.unit,row.tokens_a,row.tokens_b,row.tokens_a/row.heldout_units,row.tokens_b/row.heldout_units]));
  assert.deepEqual(slices.map(row=>[row.tokens_a/row.heldout_units,row.tokens_b/row.heldout_units]),[[1.3,1.38],[1.8,1.45],[1.65,1.4]]);
  assert.equal(slices[2].unit,"lexeme");assert.match(slices[2].reference_segmentation,/Python tokenize/);
  assert.deepEqual(slices.map(row=>(100*(row.tokens_b-row.tokens_a)/row.tokens_a).toFixed(1)),["6.2","-19.4","-15.2"]);
  for(const anchor of ["tokenizer-sampling-example","tokenizer-sampling-heldout"])assert.match(deck.slides.find(slide=>slide.textAnchor===anchor).source.label,/Illustrative.*Not measured/);
  const chapter=read("content/lectures/lecture-6.qmd");
  assert.match(chapter,/Do not multiply the 80\/15\/5 \*\*byte\*\* shares/);
  assert.match(chapter,/not outputs of fitting the two 10 GB samples/);
});

test("Lecture 6 explains added IDs after the inventory, then compares one measured sentence", async () => {
  const deck = await loadDeck(6);
  const audit = JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const index = deck.slides.findIndex(slide => slide.textAnchor === "released-tokenizer-artifacts");
  assert.equal(deck.slides[index + 1].textAnchor, "added-ids-embedding-capacity");
  const comparison = deck.slides[index + 2];
  assert.equal(comparison.textAnchor, "released-tokenizer-comparison");
  assert.equal(comparison.kind, "image");
  const svg = read("public/" + comparison.image.src);
  assert.match(svg, /· = space/);
  assert.match(svg, /local to each vocabulary/);
  for (const model of audit.models) {
    const trace = model.comparison_trace;
    assert.equal(trace.input, "The tokenizer sees 123456.");
    assert.equal(trace.pieces.join(""), trace.input);
    assert.equal(trace.decoded, trace.input);
    assert.equal(trace.pieces.length, trace.ids.length);
    const row = svg.split(`<g data-model="${model.name}">`)[1].split(/<g data-model=/)[0];
    const mapping = [...row.matchAll(/<g data-piece="([^"]*)" data-id="(\d+)">/g)].map(match => [match[1], Number(match[2])]);
    assert.deepEqual(mapping, trace.pieces.map((piece, i) => [piece, trace.ids[i]]));
  }
  assert.deepEqual(audit.models.map(model => model.comparison_trace.pieces.filter(piece => /^\d+$/.test(piece))), [["1","2","3","4","5","6"],["123","456"],["123","45","6"],["123","456"]]);
  assert.ok(audit.models[1].comparison_trace.pieces.includes(" token"));
  assert.ok(audit.models[1].comparison_trace.pieces.includes("izer"));
});

test("Lecture 6 added-ID figure matches pinned Qwen entries and does not invent weight values", async () => {
  const audit=JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const qwen=audit.models.find(model=>model.name==="Qwen3.8-27B"),extension=qwen.inventory_extension;
  assert.equal(qwen.model_entries+extension.added_count,qwen.effective_ids);
  assert.equal(qwen.effective_ids+extension.allocated_without_tokenizer_id,qwen.embedding_rows);
  assert.equal(extension.added_count,33);
  assert.equal(extension.allocated_without_tokenizer_id,243);
  assert.deepEqual(extension.unassigned_row_range,[248077,248319]);
  assert.equal(extension.weight_values_inspected,false);
  assert.deepEqual(extension.examples.map(({content,id,special})=>[content,id,special]),[["<|im_start|>",248045,true],["<|im_end|>",248046,true],["<think>",248068,false],["</think>",248069,false]]);
  const svg=read("public/lecture-6/tokenizer-added-ids.svg");
  for(const {content,id} of extension.examples)assert.ok(svg.includes(`data-added-token="${content.replaceAll("<","&lt;")}" data-id="${id}"`));
  const visibleText=[...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(match=>match[1]).join(" ");
  assert.doesNotMatch(visibleText,/Extra rows ≠ extra token spellings|Allocated vectors, not empty cells|Weight values were not inspected/);
  assert.match(read("content/lectures/lecture-6.qmd"),/not inherently zero or random/);
});

test("Lecture 6 replaces the dense structure slides while retaining the chapter's reference figures", async () => {
  const deck=await loadDeck(6);
  const index=deck.slides.findIndex(slide=>slide.textAnchor==="released-tokenizer-comparison");
  assert.deepEqual(deck.slides.slice(index+1,index+6).map(slide=>slide.textAnchor),["bpe-hashmap-scan","bpe-build-inverted-index","bpe-create-merged-token","bpe-indexed-replacement","bpe-indexed-result"]);
  const trace=JSON.parse(read("content/fixtures/lecture6-incremental-bpe-trace.json"));
  const local=read("public/lecture-6/bpe-local-update.svg");
  const shown=[...local.matchAll(/<g data-pair="([^"]+)" data-delta="(-?\d+)" data-before="(\d+)" data-after="(\d+)">/g)].map(m=>[m[1],...m.slice(2).map(Number)]);
  assert.deepEqual(shown,[["98,97",-1,3,2],["97,110",-1,5,4],["110,97",-1,4,3],["98,256",1,0,1],["256,97",1,0,1]]);
  const heap=read("public/lecture-6/bpe-lazy-heap.svg");
  const pops=[...heap.matchAll(/data-pop="\d+" data-pair="([^"]+)" data-count="(\d+)" data-valid="(true|false)"/g)].map(m=>[m[1],Number(m[2]),m[3]==="true"]);
  assert.deepEqual(pops,[...trace.rounds[1].stale.map(e=>[e.pair.join(","),e.count,false]),[trace.rounds[1].pair.join(","),trace.rounds[1].selectionCount,true]]);
  const structures=read("public/lecture-6/bpe-training-structures.svg");
  for(const name of ["Linked list","Hash map","Inverted index","Max-heap"])assert.ok(structures.includes(name));
});

test("Lecture 6 progressive pair-map and index figures reproduce the checked training trace", () => {
  const trace=JSON.parse(read("content/fixtures/lecture6-indexed-walkthrough-trace.json"));
  assert.deepEqual(trace.documents,["abab","abac"]);
  const scan=read("public/lecture-6/bpe-hashmap-scan.svg");
  assert.deepEqual([...scan.matchAll(/data-scan-node="(\d+)" data-pair="([^"]+)" data-count="(\d+)"/g)].map(m=>[Number(m[1]),m[2],Number(m[3])]),trace.scan.filter(e=>e.doc===0).map(e=>[e.node,e.pair.join(","),e.count]));
  const inverted=read("public/lecture-6/bpe-build-inverted-index.svg");
  assert.deepEqual([...inverted.matchAll(/data-scan-position="([^"]+)" data-pair="([^"]+)" data-positions="([^"]+)"/g)].map(m=>m.slice(1)),trace.scan.filter(e=>e.doc===0).map(e=>[`${e.doc}:${e.node}`,e.pair.join(","),e.positions.join(";")]));
  assert.deepEqual([...inverted.matchAll(/data-index-pair="([^"]+)" data-positions="([^"]+)"/g)].map(m=>m.slice(1)),trace.initial.positions.map(e=>[e.pair.join(","),e.positions.join(";")]));
  const allocation=read("public/lecture-6/bpe-create-merged-token.svg");
  assert.match(allocation,/data-merge-pair="97,98" data-new-id="256"/);
  const local=read("public/lecture-6/bpe-indexed-replacement.svg");
  const shown=[...local.matchAll(/<g data-pair="([^"]+)" data-delta="(-?\d+)" data-before="(\d+)" data-after="(\d+)" data-position="([^"]+)">/g)].map(m=>[m[1],...m.slice(2,5).map(Number),m[5]]);
  assert.deepEqual(shown,[["97,98",-1,3,2,"0:0"],["98,97",-1,2,1,"0:1"],["256,97",1,0,1,"0:0"]]);
  const final=read("public/lecture-6/bpe-indexed-result.svg");
  assert.deepEqual([...final.matchAll(/data-document="\d+" data-ids="([^"]+)"/g)].map(m=>m[1].split(",").map(Number)),trace.sequences);
  assert.deepEqual([...final.matchAll(/data-pair="([^"]+)" data-count="(\d+)" data-positions="([^"]+)"/g)].map(m=>[m[1],Number(m[2]),m[3]]),trace.rounds[0].countsAfter.map(({pair,count})=>[pair.join(","),count,trace.rounds[0].positionsAfter.find(e=>String(e.pair)===String(pair)).positions.join(";")]));
});

test("Lecture 6 colored byte-BPE figures reproduce two frequency-selected merges", async () => {
  const deck = await loadDeck(6);
  let seqs = ["banana", "banana", "band"].map(text => [...Buffer.from(text)]);
  const countPairs = sequences => {
    const counts = new Map();
    for (const seq of sequences) for (let i=0;i+1<seq.length;i++) {
      const key = `${seq[i]},${seq[i+1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts].sort((a,b) => b[1]-a[1] || Number(a[0].split(",")[0])-Number(b[0].split(",")[0]) || Number(a[0].split(",")[1])-Number(b[0].split(",")[1]));
  };
  for (let step=0;step<2;step++) {
    const slide = deck.slides.find(slide => slide.textAnchor === ["bpe-visual-counts", "bpe-visual-recount"][step]);
    assert.equal(slide.kind, "image");
    const svg = read("public/" + slide.image.src);
    const shown = [...svg.matchAll(/<g data-pair="([^"]+)" data-count="(\d+)">/g)].map(match => [match[1], Number(match[2])]);
    const counted = countPairs(seqs);
    assert.deepEqual(shown, counted);
    assert.deepEqual([...svg.matchAll(/<g data-document="\d+" data-ids="([^"]+)">/g)].map(match => match[1].split(",").map(Number)), seqs);
    assert.match(svg, / selected/);
    const pair = counted[0][0].split(",").map(Number);
    assert.deepEqual([pair, counted[0][1]], step === 0 ? [[97,110],5] : [[98,256],3]);
    seqs = seqs.map(seq => {
      const out=[];
      for(let i=0;i<seq.length;i++) {
        if(seq[i]===pair[0] && seq[i+1]===pair[1]) {out.push(256+step);i++;} else out.push(seq[i]);
      }
      return out;
    });
  }
  const final = read("public/lecture-6/byte-bpe-merge-result.svg");
  assert.deepEqual([...final.matchAll(/<g data-document="\d+" data-ids="([^"]+)">/g)].map(match => match[1].split(",").map(Number)), seqs);
  assert.deepEqual(seqs, [[257,256,97],[257,256,97],[257,100]]);
  assert.match(final, /data-merge-rank="0" data-pair="97,110" data-new-id="256"/);
  assert.match(final, /data-merge-rank="1" data-pair="98,256" data-new-id="257"/);
  assert.match(final, /Encoding new text: replay learned merge priorities/);
  assert.equal(deck.slides.find(slide => slide.textAnchor === "byte-level-bpe").image.src, "lecture-6/byte-bpe-utf8.svg");
});

test("Lecture 6 UTF-8 diagram uses a single downward merge arrow and no toy-example label", () => {
  const svg=read("public/lecture-6/byte-bpe-utf8.svg");
  assert.doesNotMatch(svg,/toy example/i);
  assert.match(svg,/All 256 byte values are available before learning merges/);
  assert.deepEqual([...Buffer.from("café","utf8")],[99,97,102,195,169]);
  const merge=svg.match(/<g data-merge="195,169" data-result="256">([\s\S]*?)<\/g>/)?.[1];
  assert.ok(merge);
  const branches=merge.match(/<path data-merge-branches="C3,A9"[^>]+\/>/)?.[0];
  assert.ok(branches);
  assert.doesNotMatch(branches,/class="edge"|marker-end/);
  assert.match(branches,/d="M779 251V264H924V251"/);
  assert.equal([...merge.matchAll(/class="edge"/g)].length,1);
  const arrow=merge.match(/data-merge-arrow="C3,A9" d="M([\d.]+) (\d+)V(\d+)"/);
  const box=merge.match(/class="token rose selected" x="(\d+)" y="(\d+)" width="(\d+)"/);
  assert.ok(arrow&&box);
  assert.equal(Number(arrow[1]),Number(box[1])+Number(box[3])/2);
  assert.ok(Number(arrow[2])<Number(arrow[3])&&Number(arrow[3])<Number(box[2]));
  assert.deepEqual([...svg.matchAll(/data-unchanged-byte="(\d+)"/g)].map(m=>Number(m[1])),[99,97,102]);
  assert.equal([...svg.matchAll(/<path class="edge"/g)].length,9);
});

test("Lecture 6 replaces cleaning slides with chat borders, four formats, thinking, tools and images", async () => {
  const deck=await loadDeck(6),chapter=read("content/lectures/lecture-6.qmd");
  const begin=deck.slides.findIndex(slide=>slide.textAnchor==="serializing-content");
  const end=deck.slides.findIndex(slide=>slide.textAnchor==="packing-and-context");
  const section=deck.slides.slice(begin+1,end);
  assert.equal(deck.slides[begin].title,"Part 3 — Additional tokens and multimodality");
  assert.equal(deck.slides.find(slide=>slide.textAnchor==="choosing-tokenizer").title,"Part 2 — Choosing a tokenizer");
  assert.deepEqual(section.map(slide=>slide.textAnchor),["chat-reasoning-contract","deepseek-chat-template","glm-chat-template","kimi-chat-template","reasoning-format-controls","tool-call-formats","tool-roundtrip-example","multimodal-token-contract","multimodal-big-picture"]);
  assert.equal(section.at(-1).kind,"image");
  const visible=JSON.stringify(section.map(({title,code,rows,items})=>({title,code,rows,items})));
  assert.doesNotMatch(visible,/Sidecar evidence|Deduplication cluster|Privacy and quality decisions|quality_score/);
  for(const title of ["Serialize content, not every metadata field","A printed marker is not a control ID","Same message, different serialized controls","An image marker is not an image budget"])assert.ok(!deck.slides.some(slide=>slide.title===title));
  assert.match(chapter,/17\. Structured corpus records are not automatically model-visible text/);
  const html=JSON.parse(read("app/generated/lecture-6.ts").match(/export const \w+ = (.*);/)[1]);
  for(const slide of section) {
    assert.ok(chapter.includes(`{#${slide.textAnchor}}`));
    assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]===slide.textAnchor).length,1);
  }
});

test("Lecture 6 chat code matches the pinned format fixtures without inventing a shared wrapper", async () => {
  const deck=await loadDeck(6),audit=JSON.parse(read("content/fixtures/lecture6-chat-controls.json"));
  assert.equal(audit.inspected_on,"2026-10-17");
  assert.equal(audit.jinja2,"3.1.6");
  const anchors=["chat-reasoning-contract","deepseek-chat-template","glm-chat-template","kimi-chat-template"];
  const old=JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  audit.models.forEach((model,i)=>{
    assert.equal(model.revision,old.models[i].revision);
    assert.equal(model.display_parts.join(""),model.serialized);
    assert.equal(model.display_code,model.display_parts.map(part=>part.replaceAll("\n","\\n")).join("\n\n"));
    assert.equal(deck.slides.find(slide=>slide.textAnchor===anchors[i]).code,model.display_code);
    for(const hash of Object.values(model.sha256))assert.match(hash,/^[a-f0-9]{64}$/);
    assert.ok(model.serialized.includes("Be concise.")&&model.serialized.includes("Hello")&&model.serialized.includes("Hi."));
  });
  const thinking=deck.slides.find(slide=>slide.textAnchor==="reasoning-format-controls");
  assert.deepEqual(thinking.rows.map(row=>row.slice(1)),audit.models.map(model=>[model.thinking_open,model.thinking_close]));
  const tool=deck.slides.find(slide=>slide.textAnchor==="tool-call-formats");
  assert.match(tool.rows[1][1],/<｜DSML｜tool_calls>/);
  assert.doesNotMatch(JSON.stringify(tool),/tool▁calls▁begin/);
  assert.match(tool.rows[2][1],/<arg_key> \/ <arg_value>/);
  assert.match(tool.rows[3][2],/role="tool"/);
  const roundtrip=deck.slides.find(slide=>slide.textAnchor==="tool-roundtrip-example");
  assert.ok(roundtrip.code.includes(audit.models[0].tool_call));
  assert.match(roundtrip.notes,/No clock function was executed/);
  assert.match(audit.scope,/no model generation/);
});

test("Lecture 6 image path separates preprocessing, learned vision features, and text embeddings", async () => {
  const deck=await loadDeck(6),slide=deck.slides.find(slide=>slide.textAnchor==="multimodal-token-contract");
  const svg=read("public/"+slide.image.src);
  assert.deepEqual([...svg.matchAll(/data-stage="([^"]+)"/g)].map(match=>match[1]),["text-input","text-embedding","text-vectors","image-input","image-preprocessing","vision-encoder","feature-insertion","language-model"]);
  assert.match(svg,/pixels \+ grid metadata/);
  assert.match(svg,/visual feature vectors/);
  assert.match(svg,/does not contain the pixels/);
  assert.match(slide.notes,/schematic, not a measured patch count/);
  assert.match(slide.notes,/accepts image media, not arbitrary video inputs/);
});

test("Lecture 6 ends its multimodal section with image and text vectors joining the model input", async () => {
  const deck=await loadDeck(6),index=deck.slides.findIndex(slide=>slide.textAnchor==="multimodal-big-picture");
  const slide=deck.slides[index],svg=read("public/"+slide.image.src);
  assert.equal(deck.slides[index-1].textAnchor,"multimodal-token-contract");
  assert.equal(deck.slides[index+1].textAnchor,"packing-and-context");
  assert.equal(slide.kind,"image");
  assert.deepEqual([...svg.matchAll(/data-stage="([^"]+)"/g)].map(match=>match[1]),["image-input","vision-encoding","visual-embeddings","text-input","text-embedding","text-embeddings","embedding-sequence","language-model"]);
  const edges=[...svg.matchAll(/data-from="([^"]+)" data-to="([^"]+)"/g)].map(match=>match.slice(1));
  assert.deepEqual(edges,[["image-input","vision-encoding"],["vision-encoding","visual-embeddings"],["text-input","text-embedding"],["text-embedding","text-embeddings"],["visual-embeddings","embedding-sequence"],["text-embeddings","embedding-sequence"],["embedding-sequence","language-model"]]);
  assert.equal([...svg.matchAll(/data-vector="visual"/g)].length,8);
  assert.equal([...svg.matchAll(/data-vector="text"/g)].length,6);
  assert.match(svg,/Vision encoder/);
  assert.match(svg,/projector/);
  assert.match(svg,/numerical vector/);
  assert.match(slide.notes,/not a universal architecture/);
  assert.match(slide.notes,/not measured values or a fixed token count/);
  assert.match(read("content/lectures/lecture-6.qmd"),/\{#multimodal-big-picture\}/);
});

test("Lecture 6 folds next-token targets into the renumbered packing part", async () => {
  const deck=await loadDeck(6),start=deck.slides.findIndex(slide=>slide.textAnchor==="packing-and-context");
  assert.equal(deck.slides[start].title,"Part 4 — Packing and context");
  assert.deepEqual(deck.slides.slice(start+1,start+4).map(slide=>slide.textAnchor),["next-token-targets","causal-attention-example","packing-capacity-example"]);
  assert.equal(deck.slides[start+1].title,"Shift once: every arrow is a target");
  for(const title of ["Part 4 — Targets and loss","Part 5 — Packing and context","Part 6 — Counts and tests","The label array matches the input","The denominator names the objective"])assert.ok(!deck.slides.some(slide=>slide.title===title));
  assert.ok(!deck.slides.some(slide=>slide.textAnchor==="accounting-and-tests"));
  assert.ok(!deck.slides.some(slide=>slide.title==="Two utilizations, not one"));
  assert.ok(!deck.slides.some(slide=>slide.title==="Will next-fit pack both cases equally well?"));
  assert.equal(deck.slides.at(-1).title,"Every target survives; its context may not");
  const masks=["packed-document-attention","packing-loss-mask","packing-padding-mask","packing-position-ids"].map(anchor=>deck.slides.find(slide=>slide.textAnchor===anchor));
  assert.ok(masks.every(slide=>slide.kind==="image"));
  assert.equal(new Set(masks.map(slide=>slide.image.src)).size,4);
  const chapter=read("content/lectures/lecture-6.qmd"),html=JSON.parse(read("app/generated/lecture-6.ts").match(/export const \w+ = (.*);/)[1]);
  for(const anchor of ["next-token-targets","causal-attention-example","packing-capacity-example",...masks.map(slide=>slide.textAnchor)]){
    assert.ok(chapter.includes(`{#${anchor}}`));
    assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]===anchor).length,1);
  }
  assert.match(chapter,/21\. Write the loss with its mask and denominator/);
});

test("Lecture 6 attention visuals compute causal and same-document permissions", () => {
  const fixture=JSON.parse(read("content/fixtures/lecture6-packing-example.json"));
  const segments=fixture.documents.flatMap(doc=>doc.tokens.slice(0,-1).map(()=>doc.id));
  const cells=filename=>[...read("public/lecture-6/"+filename).matchAll(/data-mask="([^"]+)" data-query="(\d+)" data-key="(\d+)" data-allowed="([01])" data-reason="([^"]*)"/g)].map(m=>({mask:m[1],q:Number(m[2]),k:Number(m[3]),allowed:Number(m[4]),reason:m[5]}));
  const causal=cells("causal-attention.svg");
  assert.equal(causal.length,25);
  for(const cell of causal)assert.equal(cell.allowed,Number(cell.k<=cell.q));
  assert.deepEqual(causal.filter(cell=>cell.q===2&&cell.allowed).map(cell=>cell.k),[0,1,2]);
  const packed=cells("packed-document-attention.svg");
  assert.equal(packed.length,72);
  for(const cell of packed)assert.equal(cell.allowed,Number(cell.k<=cell.q&&(cell.mask==="packed-causal"||segments[cell.q]===segments[cell.k])));
  assert.equal(packed.filter(cell=>cell.mask==="packed-causal"&&cell.allowed).length,21);
  assert.equal(packed.filter(cell=>cell.mask==="packed-isolated"&&cell.allowed).length,12);
  assert.equal(packed.filter(cell=>cell.mask==="packed-isolated"&&cell.reason==="other-document").length,9);
});

test("Lecture 6 capacity example distinguishes sequence length from block batch size", () => {
  const fixture=JSON.parse(read("content/fixtures/lecture6-packing-example.json")),svg=read("public/lecture-6/packing-capacity.svg");
  const rows=[...svg.matchAll(/data-documents="(\d+)" data-inputs="(\d+)" data-padding="(\d+)" data-utilization="([\d.]+)"/g)].map(m=>m.slice(1).map(Number));
  assert.deepEqual(rows,[[1,512,3584,.125],[2,1024,3072,.25],[8,4096,0,1]]);
  for(const [count,used,pad,utilization] of rows){
    assert.equal(used,count*fixture.capacity.input_positions_per_document);
    assert.equal(used+pad,fixture.capacity.sequence_length);
    assert.equal(utilization,used/fixture.capacity.sequence_length);
  }
  assert.match(svg,/Batch: B blocks/);
  assert.match(svg,/Sequence length: L = 4,096 positions/);
});

test("Lecture 6 loss, padding and position slides keep the same shifted fixture aligned", () => {
  const fixture=JSON.parse(read("content/fixtures/lecture6-packing-example.json")),rows={input:[],target:[],segment:[],position:[],loss:[],valid:[]};
  for(const doc of fixture.documents)doc.tokens.slice(0,-1).forEach((token,i)=>{
    rows.input.push(token);rows.target.push(doc.tokens[i+1]);rows.segment.push(doc.id);rows.position.push(i);rows.loss.push(Number(doc.score_targets[i]));rows.valid.push(1);
  });
  while(rows.input.length<fixture.block_length){rows.input.push(fixture.pad);rows.target.push(fixture.pad);rows.segment.push("—");rows.position.push(0);rows.loss.push(0);rows.valid.push(0);}
  for(const [name,fields] of [["loss-mask",["input","target","loss"]],["padding-mask",["input","valid","target"]],["position-ids",["input","segment","position"]]]){
    const svg=read(`public/lecture-6/packing-${name}.svg`);
    const actual=Object.fromEntries([...svg.matchAll(/data-field="([^"]+)" data-values="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    assert.deepEqual(Object.keys(actual),fields);
    for(const field of fields)assert.equal(actual[field],rows[field].join(","));
  }
  assert.deepEqual(rows.loss,[0,1,1,0,1,1,0,0]);
  assert.deepEqual(rows.valid,[1,1,1,1,1,1,0,0]);
  assert.deepEqual(rows.position,[0,1,2,0,1,2,0,0]);
  assert.equal(rows.loss.reduce((sum,n)=>sum+n,0),4);
  assert.notDeepEqual(rows.loss,rows.valid);
  assert.deepEqual(rows.input.slice(0,6).map((input,i)=>[input,rows.target[i]]),[["BOS","a"],["a","b"],["b","EOS"],["BOS","c"],["c","d"],["d","EOS"]]);
});


test("Lecture 6 removes all marked slides and the complete final Part 5", async () => {
  const deck=await loadDeck(6);
  const removed=["Two samplers, two different jobs","An audit makes the tradeoff visible","Measure the same text, not vocabulary size","Inherit the checkpoint's token meanings","Packing selects a conditioning policy","Does EOS create an attention wall?","Boolean masks are API-specific","Overlap can repeat the wrong thing","Will next-fit pack both cases equally well?","Do not silently drop the last block","Part 5 — Counts and tests","Keep the source on every scored target","Averages need target weights","Changing tokenizers changes perplexity units","Prove target conservation","Test information flow, not only shapes","Lab: break the sequence builder","The handoff is a tensor-generating contract"];
  for(const title of removed)assert.ok(!deck.slides.some(slide=>slide.title===title),"Removed from presentation: "+title);
  assert.equal(deck.slides.length+1,44);
  assert.deepEqual(deck.slides.filter(slide=>slide.kind==="divider").map(slide=>slide.title),["Part 2 — Choosing a tokenizer","Part 3 — Additional tokens and multimodality","Part 4 — Packing and context"]);
  assert.ok(!deck.slides.some(slide=>slide.kind==="question"));
  assert.equal(deck.slides.at(-1).title,"Every target survives; its context may not");
});

test("Lecture 6 removes marked diagram text while retaining example provenance and data", async () => {
  const visible=path=>[...read("public/lecture-6/"+path).matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1]).join(" ");
  const bpe=visible("byte-bpe-merge-1.svg");
  assert.doesNotMatch(bpe,/Training corpus:|Each ASCII letter/);
  assert.match(bpe,/Count pairs inside each pre-tokenized region/);
  assert.match(bpe,/Never across region or document boundaries/);
  assert.doesNotMatch(visible("bpe-vocabulary-size.svg"),/Same held-out text|Illustrative outcomes, not measured/);
  assert.doesNotMatch(visible("bpe-sampling-mixtures.svg"),/Both BPEs:|Same preprocessing/);
  const picture=visible("multimodal-big-picture.svg");
  assert.match(picture,/Each column is a numerical vector\./);
  assert.doesNotMatch(picture,/not a word/);
  assert.doesNotMatch(visible("packing-loss-mask.svg"),/Zero loss/);
  assert.doesNotMatch(visible("packing-padding-mask.svg"),/PAD targets: no loss/);
  assert.doesNotMatch(visible("packing-position-ids.svg"),/Coordinates do not block attention/);
  const deck=await loadDeck(6);
  for(const anchor of ["vocabulary-size-experiment","tokenizer-sampling-example","tokenizer-sampling-heldout"])assert.match(deck.slides.find(slide=>slide.textAnchor===anchor).source.label,/Illustrative.*Not measured/);
  assert.match(read("content/lectures/lecture-6.qmd"),/Never create a pair across a region or document boundary/);
});

test("Lecture 6 explains DeepSeek chat mode without inventing XML closing tags", async () => {
  const deck=await loadDeck(6),slide=deck.slides.find(slide=>slide.textAnchor==="deepseek-chat-template");
  const fixture=JSON.parse(read("content/fixtures/lecture6-chat-controls.json")).models.find(model=>model.name==="DeepSeek-V4-Pro");
  assert.equal(slide.code,fixture.display_code);
  assert.ok(slide.code.startsWith("<｜begin▁of▁sentence｜>Be concise."));
  assert.ok(slide.code.includes("<｜Assistant｜></think>Hi.<｜end▁of▁sentence｜>"));
  assert.ok(!slide.code.includes("<think>"));
  assert.ok(!slide.code.includes("</｜begin"));
  assert.ok(!slide.code.includes("<｜System｜>"));
  assert.match(slide.items.join(" "),/System prompt: Be concise\./);
  assert.match(slide.items.join(" "),/control tokens, not XML tags/);
  assert.match(slide.notes,/without an earlier opening think marker/);
  assert.match(slide.source.url,/encoding\/README\.md$/);
});

test("Lecture 6 uses Kimi K3 segment-aware controls, not the K2.6 chat format", async () => {
  const chapter = read("content/lectures/lecture-6.qmd");
  const audit = JSON.parse(read("content/fixtures/lecture6-tokenizer-audit.json"));
  const kimi = audit.models.find(model => model.name === "Kimi-K3");
  const deck = await loadDeck(6);
  const chat = deck.slides.find(slide => slide.textAnchor === "kimi-chat-template");
  assert.ok(kimi.sha256["encoding_k3.py"]);
  assert.ok(kimi.sha256["kimi_k3_processor.py"]);
  assert.equal(kimi.sha256["chat_template.jinja"], undefined);
  const probe = kimi.control_probe;
  assert.equal(probe.marker, "<|end_of_msg|>");
  assert.equal(probe.reserved_id, 163586);
  assert.deepEqual(probe.structural_ids, [163586]);
  assert.ok(probe.literal_content_ids.length > 1);
  assert.ok(!probe.literal_content_ids.includes(probe.reserved_id));
  assert.match(probe.scope, /not a full chat or media audit/);
  const portion = '<|open|>message role="user"<|sep|>Hello<|close|>message<|sep|><|end_of_msg|>';
  assert.ok(chapter.includes(portion));
  assert.ok(chat.code.includes(portion));
  assert.doesNotMatch(chat.code, /<\|im_user\|>|<\|im_middle\|>/);
  assert.doesNotMatch(JSON.stringify(deck), /Qwen3\.6|GLM-5\.1|Kimi-K2\.6/);
  assert.match(chapter, /messages, tokenize=True, add_generation_prompt=False/);
  assert.doesNotMatch(chapter, /tokenizer\(rendered, add_special_tokens=False\)/);
  assert.match(chapter, /direct segment-aware tokenization/);
  assert.match(chapter, /public API always enables thinking/);
  assert.match(chapter, /low.*,.*medium.*,.*xhigh/);
  assert.match(chapter, /clear_thinking/);
});

test("Lecture 6 frontier passages remain available in chapter and presentation", async () => {
  const chapter = read("content/lectures/lecture-6.qmd");
  const generated = read("app/generated/lecture-6.ts");
  const html = JSON.parse(generated.match(/export const \w+ = (.*);/)[1]);
  const deck = await loadDeck(6);
  for (const anchor of ["normalization-overview", "utf8-character-bytes", "choosing-tokenizer", "added-ids-embedding-capacity", "bpe-hashmap-scan", "bpe-build-inverted-index", "bpe-create-merged-token", "bpe-indexed-replacement", "bpe-indexed-result", "released-tokenizer-comparison", "bpe-visual-counts", "bpe-visual-recount", "bpe-visual-result", "pretokenization-hello", "segmentation-methods", "byte-level-bpe", "released-tokenizer-artifacts", "released-number-splits", "chat-reasoning-contract", "multimodal-token-contract"]) {
    assert.ok(chapter.includes(`{#${anchor}}`));
    assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(match => match[1] === anchor).length, 1);
    assert.ok(deck.slides.some(slide => slide.textAnchor === anchor));
  }
  for (const anchor of ["bpe-indexed-training", "bpe-local-updates", "bpe-lazy-priorities", "wordpiece-segmentation", "byte-patch-frontier", "released-tokenizer-audit", "checkpoint-tokenizer-contract", "accounting-and-tests"]) {
    assert.ok(chapter.includes(`{#${anchor}}`));
    assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(match=>match[1]===anchor).length,1);
    assert.ok(!deck.slides.some(slide=>slide.textAnchor===anchor),"Keep removed slide detail in the chapter only: "+anchor);
  }
  assert.match(chapter, /BLT is a 2024 research example/);
  assert.match(chapter, /not\*\* the tokenizer implementation found in the four releases/);
  assert.match(chapter, /resizing alone does not teach their meanings/);
  assert.match(chapter, /special: false/);
  assert.match(chapter, /template does not automatically define the loss mask/);
  assert.match(chapter, /never assume media-placeholder IDs should receive ordinary text-generation loss/);
});
