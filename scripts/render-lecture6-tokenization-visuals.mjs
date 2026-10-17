/** Native SVG lecture figures, derived from pinned measurements and a toy byte-BPE run. */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { trainIncrementalByteBpe } from "./lecture6-incremental-bpe.mjs";

const root = new URL("../", import.meta.url);
const audit = JSON.parse(readFileSync(new URL("content/fixtures/lecture6-tokenizer-audit.json", root), "utf8"));
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const text = (x, y, value, cls = "", extra = "") => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(value)}</text>`;
const palette = ["violet", "teal", "amber", "blue", "rose", "slate"];
const style = `text{font-family:"Segoe UI",Arial,sans-serif;fill:#111827}.muted{fill:#6b7280}.label{font-size:25px;fill:#6b7280}.mono{font-family:Consolas,monospace}.token{stroke-width:1.5}.violet{fill:#f2effe;stroke:#b6a4f2}.teal{fill:#e4f4ee;stroke:#8ac8b3}.amber{fill:#fff2d8;stroke:#e4bf73}.blue{fill:#e9f1fe;stroke:#9ebce9}.rose{fill:#fcebf0;stroke:#dfa4b8}.slate{fill:#edf1f5;stroke:#acb9c8}.selected{stroke:#7253ed;stroke-width:3}.accent{fill:#5b3fd4}.edge{fill:none;stroke:#7253ed;stroke-width:2.5;marker-end:url(#arrow)}`;
let figureCount = 0;
function svg(name, title, desc, width, height, body) {
  const value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#7253ed"/></marker></defs><style>${style}</style>${body}</svg>\n`;
  writeFileSync(new URL(`public/lecture-6/${name}.svg`, root), value);
  figureCount++;
}

// Examples only; terminology and policy caveats belong to the chapter and notes.
let norm = "";
const rewrites = [["e + ◌́", "é"], ["ａ", "a"], ["ﬃ", "ffi"], ["①", "1"], ["HELLO", "hello"], ["եվ", "և"], ["7", "seven"]];
for (const [i, [before, after]] of rewrites.entries()) {
  const y = 54 + i * 68;
  norm += `<g data-before="${esc(before)}" data-after="${esc(after)}">`;
  norm += text(480, y, before, "", 'font-size="46" text-anchor="end"');
  norm += text(625, y, "→", "accent", 'font-size="42" text-anchor="middle"');
  norm += text(760, y, after, "", 'font-size="46"') + "</g>";
}
svg("normalization-overview", "Text before and after", "Seven before-and-after examples: e plus a combining acute accent becomes é; full-width a becomes a; the ffi ligature becomes ffi; circled one becomes 1; HELLO becomes hello; եվ becomes և; 7 becomes seven. Each row is a separate example, not a combined processing sequence.", 1280, 500, norm);

// Exact UTF-8 encodings; these three characters illustrate lengths, not language-wide constants.
let characters = "";
for (const [row, [language, character]] of [["English", "A"], ["Russian", "Я"], ["Chinese", "中"]].entries()) {
  const values = [...Buffer.from(character, "utf8")];
  const y = 90 + row * 145;
  characters += `<g data-character="${character}" data-bytes="${values.join(",")}">`;
  characters += text(12, y + 10, language, "label", 'font-size="30"');
  characters += text(285, y + 18, character, "", 'font-size="70" text-anchor="middle"');
  characters += `<path class="edge" d="M375 ${y - 8}H455"/>`;
  values.forEach((value, i) => {
    const x = 490 + i * 140;
    characters += `<rect class="token ${palette[i]}" x="${x}" y="${y - 48}" width="118" height="78" rx="8"/>`;
    characters += text(x + 59, y + 4, value.toString(16).toUpperCase().padStart(2, "0"), "mono", 'font-size="38" text-anchor="middle"');
  });
  characters += text(1050, y + 10, `${values.length} ${values.length === 1 ? "byte" : "bytes"}`, "accent", 'font-size="36" font-weight="600"') + "</g>";
}
svg("utf8-character-bytes", "One character, different UTF-8 byte lengths", "English A encodes as hex 41, one byte. Russian Я encodes as D0 AF, two bytes. Chinese 中 encodes as E4 B8 AD, three bytes. Each outlined box is one byte. These are specific characters in UTF-8, not universal byte counts for every character used by a language.", 1280, 450, characters);

// One shared sentence; every chip and ID comes from the pinned audit.
const sentence = audit.models[0].comparison_trace.input;
let comparison = text(12, 40, `“${sentence}”`, "", 'font-size="38"');
for (const [row, model] of audit.models.entries()) {
  const trace = model.comparison_trace;
  if (trace.input !== sentence || trace.pieces.join("") !== sentence) throw new Error("Comparison must use one unchanged sentence");
  const y = 88 + row * 94;
  const label = ["Qwen3.8", "DeepSeek-V4", "GLM-5.3", "Kimi K3"][row];
  comparison += `<g data-model="${esc(model.name)}">` + text(12, y + 32, label, "accent", 'font-size="27" font-weight="600"');
  let x = 228;
  trace.pieces.forEach((piece, i) => {
    const visible = piece.replaceAll(" ", "·");
    const w = Math.max(42, visible.length * 17 + 24, String(trace.ids[i]).length * 13 + 20);
    comparison += `<g data-piece="${esc(piece)}" data-id="${trace.ids[i]}"><rect class="token ${palette[i % palette.length]}" x="${x}" y="${y}" width="${w}" height="48" rx="7"/>`;
    comparison += text(x + w / 2, y + 32, visible, "mono", 'font-size="25" text-anchor="middle"');
    comparison += text(x + w / 2, y + 73, trace.ids[i], "mono muted", 'font-size="19" text-anchor="middle"') + "</g>";
    x += w + 7;
  });
  if (x > 1260) throw new Error(`Comparison row too wide: ${model.name} ${x}`);
  comparison += "</g>";
}
comparison += text(228, 492, "· = space · Numbers below chips are token IDs, local to each vocabulary.", "muted", 'font-size="24"');
svg("model-tokenization-comparison", "One sentence through four released tokenizers", "All four tokenize The tokenizer sees 123456. Colored chips show exact decoded token pieces, with exact IDs below. Qwen separates six digits. DeepSeek splits tokenizer into space-token and izer and groups digits as 123 and 456. GLM uses 123, 45, 6. Kimi uses 123, 456. A dot denotes a preserved space, not an added character. IDs belong to each separate vocabulary; matching colors are visual aids, not shared token meanings.", 1280, 515, comparison);

// Actual added-token IDs, versus configured matrix capacity (not measured weights).
const qwen = audit.models.find(model=>model.name==="Qwen3.8-27B"), extension=qwen.inventory_extension;
let inventory=text(12,44,`${qwen.model_entries.toLocaleString("en-US")} + ${extension.added_count} = ${qwen.effective_ids.toLocaleString("en-US")}`,"accent",'font-size="37" font-weight="600"');
inventory+=text(12,88,"BPE + added entries = loaded IDs", "muted", 'font-size="26"');
inventory+=text(12,154,"Added IDs (examples)","label");
extension.examples.forEach((entry,i)=>{
  const y=208+i*59;
  inventory+=`<g data-added-token="${esc(entry.content)}" data-id="${entry.id}">`+text(12,y,entry.content,"mono",'font-size="30"')+text(425,y,entry.id,"mono accent",'font-size="29" text-anchor="end"')+"</g>";
});
inventory+=text(650,44,`${qwen.embedding_rows.toLocaleString("en-US")} embedding rows`,"",'font-size="34" font-weight="600"');
inventory+=text(650,88,"Configured capacity · schematic", "muted", 'font-size="25"');
const bands=[
  [135,105,"BPE IDs",`0 … ${extension.base_id_range[1]}`,"slate"],
  [240,105,"Added IDs",extension.added_id_range.join(" … "),"violet"],
  [345,105,`${extension.allocated_without_tokenizer_id} additional rows`,extension.unassigned_row_range.join(" … "),"slate"],
];
for(const [y,h,label,range,color] of bands){
  inventory+=`<rect class="token ${color}" x="650" y="${y}" width="590" height="${h}" rx="7"/>`;
  inventory+=text(672,y+37,label,"",'font-size="28"')+text(672,y+77,range,"mono",'font-size="25"');
  for(let i=0;i<4;i++) {
    inventory+=`<path d="M${1050+i*45} ${y+12}V${y+h-12}" stroke="#cbd0d9"/>`;
    inventory+=text(1072+i*45,y+61,["w₁","w₂","…","w_d"][i],"mono muted",'font-size="21" text-anchor="middle"');
  }
}
svg("tokenizer-added-ids", "Added token IDs and embedding capacity are different", `Pinned Qwen3.8 has ${qwen.model_entries} BPE entries plus ${extension.added_count} added entries, yielding ${qwen.effective_ids} loaded IDs. Examples include im-start, im-end, think and closing-think with the exact IDs shown. The configuration allocates ${qwen.embedding_rows} rows, ${extension.allocated_without_tokenizer_id} more than the tokenizer can name. Bands are not to scale; symbolic cells are not checkpoint values. Extra rows are numeric vectors, not empty cells; this inspection does not establish that their values are zero, random, or unchanged by training.`,1280,565,inventory);

// A tested incremental training trace: stable nodes, indexed edges, counts and lazy heap snapshots.
const incremental=trainIncrementalByteBpe(["banana","banana","band"],2,{validate:true});
writeFileSync(new URL("content/fixtures/lecture6-incremental-bpe-trace.json",root),JSON.stringify(incremental,null,2)+"\n");
const spelling=new Map([[97,"a"],[98,"b"],[110,"n"],[100,"d"],[256,"an"],[257,"ban"]]);
const pairLabel=pair=>pair.map(id=>spelling.get(id)).join(" + ");
const nodeColor=id=>({97:"teal",98:"violet",110:"amber",100:"blue",256:"rose",257:"slate"}[id]);
const link=(left,right,y)=>`<path class="edge" d="M${left} ${y-5}H${right}"/><path class="edge" d="M${right} ${y+5}H${left}"/>`;
function linkedRow(tokens,indices,y,selected=[]) {
  let body="";
  indices.forEach((index,i)=>{
    const x=180+index*125,id=tokens[i];
    body+=`<g data-node="${index}" data-token="${id}"><rect class="token ${nodeColor(id)}${selected.includes(index)?" selected":""}" x="${x}" y="${y}" width="80" height="60" rx="7"/>`;
    body+=text(x+40,y+41,spelling.get(id),"mono",'font-size="34" text-anchor="middle"')+text(x+40,y+87,`n${index}`,"mono muted",'font-size="23" text-anchor="middle"')+"</g>";
    if(i+1<indices.length)body+=link(x+84,180+indices[i+1]*125-4,y+30);
  });
  return body;
}
let structures=text(12,33,"Corpus: banana / banana / band", "", 'font-size="30"');
structures+=text(12,91,"Linked list", "accent", 'font-size="27" font-weight="600"')+linkedRow(incremental.initial.sequences[0],[0,1,2,3,4,5],56);
structures+=text(12,133,"Doc 1", "muted", 'font-size="23"');
structures+=text(12,209,"Hash map: pair → count", "accent", 'font-size="27" font-weight="600"');
structures+=text(500,209,"Inverted index: pair → occurrences", "accent", 'font-size="27" font-weight="600"');
incremental.initial.counts.forEach(({pair,count},i)=>{
  const y=255+i*44;
  structures+=`<g data-pair="${pair}" data-count="${count}">`+text(12,y,pairLabel(pair),"mono",'font-size="27"')+text(375,y,count,"mono",'font-size="28" text-anchor="end"')+"</g>";
  const positions=incremental.initial.positions.find(row=>String(row.pair)===String(pair)).positions;
  structures+=text(500,y,pairLabel(pair),"mono",'font-size="26"')+text(705,y,positions.map(p=>{const [d,n]=p.split(":");return `D${Number(d)+1}:n${n}`}).join(", "),"mono",'font-size="20"');
});
structures+=text(12,485,"Max-heap", "accent", 'font-size="27" font-weight="600"')+text(12,526,"Pop the maximum", "muted", 'font-size="24"');
structures+=`<path class="edge" d="M655 455L560 502"/><path class="edge" d="M705 455L805 502"/>`;
[["a + n : 5",580,412],["n + a : 4",450,507],["b + a : 3",730,507]].forEach(([label,x,y])=>{
  structures+=`<rect class="token violet" x="${x}" y="${y}" width="200" height="46" rx="7"/>`+text(x+100,y+32,label,"mono",'font-size="25" text-anchor="middle"');
});
structures+=text(980,541,"…", "muted", 'font-size="30"');
svg("bpe-training-structures","Four connected data structures for BPE training","A constructed training design uses doubly linked token nodes, a hash map of current pair frequencies, an inverted index from each pair to its occurrence node handles, and a max-heap of candidate frequency snapshots. The three documents are banana, banana, band. The figure shows Doc1 nodes n0 through n5; D1:n1 denotes the left node of the first a,n occurrence. The heap root is a,n with count5; lower nodes show selected candidates, with further entries omitted. This design is not a claim about the four publishers' undisclosed fitting pipelines.",1280,565,structures);

const local=incremental.rounds[0].updates[0];
let neighborhood=text(12,35,"One occurrence: Doc1, n1 + n2 → an", "", 'font-size="32"');
neighborhood+=text(12,126,"Before", "label")+linkedRow([98,97,110,97,110,97],[0,1,2,3,4,5],100,[1,2]);
neighborhood+=text(180,231,"− (b,a)    − (a,n)    − (n,a)","mono",'font-size="27"');
neighborhood+=text(12,326,"After", "label")+linkedRow([98,256,97,110,97],[0,1,3,4,5],300);
neighborhood+=text(430,421,"n2 inactive", "mono muted", 'font-size="23"');
neighborhood+=text(180,477,"+ (b,an)    + (an,a)","mono accent",'font-size="28"');
neighborhood+=text(1010,79,"Count changes", "label");
const deltas=[...local.removed.map(e=>({...e,delta:-1})),...local.added.map(e=>({...e,delta:1}))];
deltas.forEach(({pair,delta},i)=>{
  const count=incremental.initial.counts.find(e=>String(e.pair)===String(pair))?.count??0;
  neighborhood+=`<g data-pair="${pair}" data-delta="${delta}" data-before="${count}" data-after="${count+delta}">`;
  neighborhood+=text(1010,131+i*65,pairLabel(pair),"mono",'font-size="26"')+text(1010,161+i*65,`${count} → ${count+delta}`,"mono accent",'font-size="26"')+"</g>";
});
neighborhood+=text(180,540,"Remove 3 old edges; add 2 new edges. Everything else stays indexed.","muted",'font-size="25"');
svg("bpe-local-update","Update only the edges beside one merge","Zoom into the first occurrence of a,n in Doc1. Remove indexed edges b,a; a,n; n,a. Reuse node n1 for an, unlink node n2, and reconnect prev/next pointers from n0 to n1 to n3. Add edges b,an and an,a. Global counts after this single replacement change from3 to2,5 to4,4 to3,0 to1,0 to1 respectively. The final two tokens of the document and other documents are untouched by this one operation. Subsequent occurrences must use their current neighbors, not stale original neighborhoods.",1280,565,neighborhood);

const nextRound=incremental.rounds[1];
let priority=text(12,38,"After all five a + n replacements", "", 'font-size="32"');
priority+=text(12,104,"Live hash-map counts", "accent", 'font-size="28" font-weight="600"');
incremental.rounds[0].countsAfter.forEach(({pair,count},i)=>{
  priority+=text(12,173+i*77,pairLabel(pair),"mono",'font-size="33"')+text(385,173+i*77,count,"mono accent",'font-size="34" text-anchor="end"');
});
priority+=text(620,104,"Max-heap: validate each pop", "accent", 'font-size="28" font-weight="600"');
[...nextRound.stale.map(e=>({...e,valid:false})),{pair:nextRound.pair,count:nextRound.selectionCount,valid:true}].forEach((entry,i)=>{
  const y=137+i*105;
  priority+=`<g data-pop="${i}" data-pair="${entry.pair}" data-count="${entry.count}" data-valid="${entry.valid}"><rect class="token ${entry.valid?"violet selected":"slate"}" x="620" y="${y}" width="330" height="69" rx="7"/>`;
  priority+=text(642,y+44,`${pairLabel(entry.pair)} : ${entry.count}`,"mono",'font-size="30"');
  priority+=text(988,y+43,entry.valid?"select":"stale → skip",entry.valid?"accent":"muted",'font-size="27"')+"</g>";
});
priority+=text(12,496,"Push refreshed priorities only for changed pairs.","accent",'font-size="29" font-weight="600"');
priority+=text(12,542,"Check versions on pop; re-check live, adjacent nodes before replacement.","muted",'font-size="25"');
svg("bpe-lazy-heap","Refresh changed priorities and skip stale heap entries","After all five a,n replacements, live counts are b,an3; an,a2; an,an2; an,d1. Push refreshed candidates for changed pairs; do not rebuild the whole heap. In this deterministic trace, stale old n,a4 and b,a3 entries are popped and rejected before the valid b,an3 candidate. Snapshot versions are checked against the current map. Occurrence handles must also be checked for live, adjacent nodes before merging. Stale entries consume memory, so production implementations may periodically compact the heap.",1280,565,priority);

// A separate, slower-paced walkthrough of the chapter's abab / abac example.
// Every displayed count, posting and replacement comes from this checked run.
const walkthrough = trainIncrementalByteBpe(["abab", "abac"], 1, {validate:true});
const scanCounts = new Map(), scanPositions = new Map(), scan = [];
walkthrough.initial.sequences.forEach((seq, doc) => {
  for (let node=0; node+1<seq.length; node++) {
    const pair=seq.slice(node,node+2), key=pair.join(","), position=`${doc}:${node}`;
    scanCounts.set(key,(scanCounts.get(key) ?? 0)+1);
    scanPositions.set(key,[...(scanPositions.get(key) ?? []),position]);
    scan.push({doc,node,pair,count:scanCounts.get(key),positions:[...scanPositions.get(key)],counts:[...scanCounts].map(([key,count])=>({pair:key.split(",").map(Number),count}))});
  }
});
writeFileSync(new URL("content/fixtures/lecture6-indexed-walkthrough-trace.json",root),JSON.stringify({...walkthrough,scan},null,2)+"\n");
const walkSpelling=id=>id===256?"ab":String.fromCharCode(id);
const walkPair=pair=>`(${pair.map(walkSpelling).join(",")})`;
const handle=position=>{const [doc,node]=position.split(":").map(Number);return `D${doc+1}:n${node}`;};
const walkColor=id=>({97:"teal",98:"violet",99:"amber",256:"rose"}[id]);
function walkNodes(seq,indices,x,y,{selected=[],links=false,compact=false}={}) {
  let body="";
  seq.forEach((id,i)=>{
    const offset=compact?i:indices[i], left=x+offset*125;
    body+=`<g data-node="${indices[i]}" data-token="${id}"><rect class="token ${walkColor(id)}${selected.includes(indices[i])?" selected":""}" x="${left}" y="${y}" width="90" height="58" rx="7"/>`;
    body+=text(left+45,y+40,walkSpelling(id),"mono",'font-size="35" text-anchor="middle"');
    body+=text(left+45,y+87,`n${indices[i]}${id===256?" · 256":""}`,"mono muted",'font-size="22" text-anchor="middle"')+"</g>";
    if(links&&i+1<seq.length)body+=link(left+94,x+(compact?i+1:indices[i+1])*125-4,y+29);
  });
  return body;
}

let scanFigure=text(12,35,"Doc 1: abab", "", 'font-size="32"')+text(730,35,"Hash map after each step", "label");
scan.filter(e=>e.doc===0).forEach((event,i)=>{
  const y=75+i*123;
  scanFigure+=`<g data-scan-node="${event.node}" data-pair="${event.pair}" data-count="${event.count}">`;
  scanFigure+=text(12,y+40,`${i+1}`,"accent",'font-size="33"');
  scanFigure+=walkNodes(walkthrough.initial.sequences[0],[0,1,2,3],95,y,{selected:[event.node,event.node+1],compact:true});
  scanFigure+=`<path class="edge" d="M605 ${y+29}H680"/>`;
  scanFigure+=text(730,y+38,event.counts.map(({pair,count})=>`${walkPair(pair)}: ${count}`).join("   "),"mono",'font-size="29"')+"</g>";
});
scanFigure+=text(12,493,"Continue with Doc 2: abac", "", 'font-size="31"');
scanFigure+=text(12,544,walkthrough.initial.counts.map(({pair,count})=>`${walkPair(pair)}: ${count}`).join("     "),"mono accent",'font-size="34"');
svg("bpe-hashmap-scan","Build the pair-count hash map one window at a time","In a fresh byte-BPE run, scan Doc1 abab: a,b gets count1, b,a gets count1, then a,b becomes2. Doc2 abac contributes a,b, b,a, a,c. Final counts are a,b3; b,a2; a,c1. Each highlighted adjacent window contributes one map increment. Count within documents, never across their boundary.",1280,565,scanFigure);

let indexFigure=text(12,35,"D1:n0 = Doc 1, left node 0", "muted", 'font-size="29"');
scan.filter(e=>e.doc===0).forEach((event,i)=>{
  const y=106+i*78;
  indexFigure+=`<g data-scan-position="${event.doc}:${event.node}" data-pair="${event.pair}" data-positions="${event.positions.join(";")}">`;
  indexFigure+=text(12,y,handle(`${event.doc}:${event.node}`),"mono",'font-size="32"');
  indexFigure+=text(215,y,walkPair(event.pair),"mono accent",'font-size="32"');
  indexFigure+=`<path class="edge" d="M385 ${y-10}H450"/>`;
  indexFigure+=text(490,y,`[${event.positions.map(handle).join(", ")}]`,"mono",'font-size="32"')+"</g>";
});
indexFigure+='<path d="M12 313H1240" stroke="#e5e7eb"/>';
indexFigure+=text(12,362,"After both documents: pair → occurrence handles", "accent", 'font-size="29" font-weight="600"');
walkthrough.initial.positions.forEach(({pair,positions},i)=>{
  const y=418+i*60;
  indexFigure+=`<g data-index-pair="${pair}" data-positions="${positions.join(";")}">`+text(12,y,walkPair(pair),"mono",'font-size="32"')+text(235,y,`[${positions.map(handle).join(", ")}]`,"mono",'font-size="32"')+"</g>";
});
svg("bpe-build-inverted-index","Build an inverted index during the initial scan","Each scanned pair appends its stable left-node handle to that pair's posting list. Doc1 produces a,b at D1:n0, b,a at D1:n1, then another a,b at D1:n2. Continuing with Doc2 adds a,b at D2:n0, b,a at D2:n1 and a,c at D2:n2. The final posting-list lengths are3,2,1, matching the count map. Handles refer to token nodes, not shifted string offsets.",1280,565,indexFigure);

const walkRound=walkthrough.rounds[0];
let allocation=text(12,38,"Current pair counts", "label")+text(595,38,"New vocabulary entry", "label");
walkthrough.initial.counts.forEach(({pair,count},i)=>{
  const y=124+i*96;
  allocation+=`<g data-pair="${pair}" data-count="${count}">`;
  if(i===0)allocation+='<rect x="0" y="76" width="395" height="74" rx="7" fill="#f2effe"/>';
  allocation+=text(12,y,walkPair(pair),"mono",'font-size="38"')+text(355,y,count,i===0?"mono accent":"mono",'font-size="42" text-anchor="end"')+"</g>";
});
allocation+=`<g data-merge-pair="${walkRound.pair}" data-new-id="${walkRound.newId}">`;
allocation+=text(595,129,"(97,98) → 256", "mono accent", 'font-size="46"');
[[595,"a",97,"teal"],[755,"b",98,"violet"],[1055,"ab",256,"rose"]].forEach(([x,piece,id,color])=>{
  allocation+=`<rect class="token ${color}" x="${x}" y="202" width="115" height="80" rx="8"/>`+text(x+57.5,256,piece,"mono",'font-size="42" text-anchor="middle"')+text(x+57.5,325,id,"mono muted",'font-size="29" text-anchor="middle"');
});
allocation+=text(732,254,"+", "accent", 'font-size="38" text-anchor="middle"')+'<path class="edge" d="M907 243H1015"/></g>';
allocation+=text(12,439,"Look up the chosen pair's locations", "label");
allocation+=text(12,505,`index[(97,98)] → [${walkRound.positionsBefore.find(e=>String(e.pair)===String(walkRound.pair)).positions.map(handle).join(", ")}]`,"mono",'font-size="31"');
svg("bpe-create-merged-token","Choose the most frequent pair and allocate ID256","The count map selects a,b with frequency3. Base IDs97 and98 concatenate into a new byte string ab, allocated ID256 in this fresh training run. The learned rule is (97,98) to256, not arithmetic addition of the two IDs. An inverted-index lookup supplies D1:n0,D1:n2,D2:n0. No text search is needed to locate these candidates.",1280,565,allocation);

const firstWalk=walkRound.updates[0];
let replacement=text(12,35,`First posting: ${handle(`${firstWalk.doc}:${firstWalk.left}`)}`,"accent",'font-size="32" font-weight="600"');
replacement+=text(12,132,"Before", "label")+walkNodes([97,98,97,98],[0,1,2,3],195,96,{selected:[0,1],links:true});
replacement+=text(12,257,"After", "label")+walkNodes([256,97,98],[0,2,3],195,221,{links:true});
replacement+=text(12,360,"Changed pair", "label")+text(400,360,"Count", "label")+text(680,360,"Inverted-index change", "label");
const firstDeltas=[...firstWalk.removed.map(e=>({...e,delta:-1})),...firstWalk.added.map(e=>({...e,delta:1}))];
firstDeltas.forEach(({pair,position,delta},i)=>{
  const before=walkthrough.initial.counts.find(e=>String(e.pair)===String(pair))?.count??0, y=410+i*65;
  replacement+=`<g data-pair="${pair}" data-delta="${delta}" data-before="${before}" data-after="${before+delta}" data-position="${position}">`;
  replacement+=text(12,y,`(${pair.map(id=>id===256?"256":walkSpelling(id)).join(",")})`,"mono",'font-size="32"');
  replacement+=text(400,y,`${before} → ${before+delta}`,"mono accent",'font-size="32"')+text(680,y,`${delta>0?"add":"remove"} ${handle(position)}`,"mono",'font-size="31"')+"</g>";
});
svg("bpe-indexed-replacement","Follow one posting and update only its current neighboring edges","First follow D1:n0. Doc1 a,b,a,b becomes256,a,b. Reuse node0 for ab, unlink node1, and link node0 to node2. Remove a,b at D1:n0, changing count3 to2; remove b,a at D1:n1, changing2 to1; add256,a at D1:n0, changing0 to1. The a,b occurrence at stable node2 remains indexed. No left-neighbor edge exists at this document boundary.",1280,565,replacement);

let indexedResult=text(12,35,"Next: D1:n2, then D2:n0", "", 'font-size="32"');
walkRound.after.forEach((seq,doc)=>{
  const indices=doc===0?[0,2]:[0,2,3],y=143+doc*180;
  indexedResult+=`<g data-document="${doc}" data-ids="${seq}">`+text(12,y+40,`Doc ${doc+1}`,"label")+walkNodes(seq,indices,160,y,{compact:true,links:true})+"</g>";
});
indexedResult+=text(715,100,"Updated map + index", "accent", 'font-size="31" font-weight="600"');
indexedResult+=text(715,151,"Pair", "label")+text(1000,151,"Count", "label")+text(1120,151,"Location", "label");
walkRound.countsAfter.forEach(({pair,count},i)=>{
  const positions=walkRound.positionsAfter.find(e=>String(e.pair)===String(pair)).positions,y=220+i*94;
  indexedResult+=`<g data-pair="${pair}" data-count="${count}" data-positions="${positions.join(";")}">`+text(715,y,`(${pair.join(",")})`,"mono",'font-size="28"')+text(1035,y,count,"mono accent",'font-size="32" text-anchor="middle"')+text(1120,y,positions.map(handle).join(", "),"mono",'font-size="25"')+"</g>";
});
indexedResult+=text(12,539,"index[(97,98)] = []", "mono muted", 'font-size="32"');
svg("bpe-indexed-result","Finish the posting list and keep the index current","Next replace a,b at D1:n2 using its current left neighbor256, then replace a,b at D2:n0. Final sequences are256,256 and256,97,99. Pair97,99 is unchanged. The current counts are97,99 once at D2:n2;256,97 once at D2:n0;256,256 once at D1:n0. The consumed a,b posting list is empty. This trace checks every incremental state against full recounts, but those recounts are test-only validation.",1280,565,indexedResult);

// Byte coverage includes partial UTF-8 characters; IDs are example-specific.
let bytes = text(12, 42, "Text: café", "", 'font-size="38"');
bytes += text(12, 105, "UTF-8 bytes", "label") + text(12, 217, "Base tokens", "label") + text(12, 335, "One learned merge", "label");
const byteLabels = ["63", "61", "66", "C3", "A9"];
for (let i = 0; i < 5; i++) {
  const x = 285 + i * 145;
  bytes += `<rect class="token ${palette[i]}" x="${x}" y="65" width="118" height="66" rx="8"/>` + text(x + 59, 109, byteLabels[i], "mono", 'font-size="32" text-anchor="middle"');
  bytes += `<path class="edge" d="M${x + 59} 137V172"/>`;
  bytes += `<rect class="token ${palette[i]}" x="${x}" y="180" width="118" height="66" rx="8"/>` + text(x + 59, 222, ["c", "a", "f", "0xC3", "0xA9"][i], "mono", 'font-size="29" text-anchor="middle"');
}
for (let i = 0; i < 3; i++) {
  const x = 285 + i * 145;
  bytes += `<path class="edge" data-unchanged-byte="${[99,97,102][i]}" d="M${x + 59} 251V288"/>`;
  bytes += `<rect class="token ${palette[i]}" x="${x}" y="294" width="118" height="66" rx="8"/>` + text(x + 59, 337, ["c", "a", "f"][i], "mono", 'font-size="32" text-anchor="middle"');
}
bytes += `<g data-merge="195,169" data-result="256"><path data-merge-branches="C3,A9" d="M779 251V264H924V251" fill="none" stroke="#7253ed" stroke-width="2.5"/><path class="edge" data-merge-arrow="C3,A9" d="M851.5 264V288"/><rect class="token rose selected" x="720" y="294" width="263" height="66" rx="8"/>` + text(851.5, 337, "é", "mono", 'font-size="36" text-anchor="middle"') + "</g>";
bytes += text(285, 423, "C3 + A9 → C3 A9 (é) · A base byte need not be a complete character.", "", 'font-size="27"');
bytes += text(285, 469, "All 256 byte values are available before learning merges.", "muted", 'font-size="24"');
svg("byte-bpe-utf8", "UTF-8 bytes become initial byte-BPE tokens", "café becomes hex bytes 63 61 66 C3 A9. The first three bytes represent c, a, f and continue unchanged. C3 and A9 are separate initial byte tokens, not independently decodable characters. Their branches join a single downward arrow into the merged bytes of é. The declared merge illustrates byte representation, not a released vocabulary or a frequency-trained merge table.", 1280, 500, bytes);

// Reproduce the chapter's deterministic, non-overlapping byte-BPE algorithm.
const documents = ["banana", "banana", "band"];
let sequences = documents.map(value => [...Buffer.from(value)]);
const pieces = new Map(Array.from({length:256}, (_, id) => [id, Buffer.from([id]).toString("latin1")]));
const colors = new Map([[98,"violet"],[97,"teal"],[110,"amber"],[100,"blue"],[256,"rose"],[257,"slate"]]);
function counts(seqs) {
  const pairs = new Map();
  for (const seq of seqs) for (let i = 0; i + 1 < seq.length; i++) {
    const key = `${seq[i]},${seq[i + 1]}`;
    pairs.set(key, (pairs.get(key) ?? 0) + 1);
  }
  return [...pairs].map(([key, count]) => ({pair:key.split(",").map(Number), count})).sort((a,b) => b.count - a.count || a.pair[0] - b.pair[0] || a.pair[1] - b.pair[1]);
}
function replace(seq, pair, id) {
  const output=[];
  for (let i=0;i<seq.length;i++) {
    if(seq[i]===pair[0] && seq[i+1]===pair[1]){output.push(id);i++;}else output.push(seq[i]);
  }
  return output;
}
function corpusRows(seqs, selected) {
  let result="";
  for (const [doc, seq] of seqs.entries()) {
    const y = 135 + doc * 103;
    result += `<g data-document="${doc}" data-ids="${seq.join(",")}">` + text(12, y + 35, `Doc ${doc + 1}`, "label");
    let x=130;
    for (const [i,id] of seq.entries()) {
      const part=pieces.get(id); const w=Math.max(68,part.length * 28 + 28);
      const selectedHere = selected && ((seq[i] === selected[0] && seq[i+1] === selected[1]) || (seq[i-1] === selected[0] && seq[i] === selected[1]));
      result += `<g data-piece="${part}" data-id="${id}"><rect class="token ${colors.get(id)}${selectedHere ? " selected" : ""}" x="${x}" y="${y}" width="${w}" height="56" rx="7"/>`;
      result += text(x+w/2,y+38,part,"mono",'font-size="32" text-anchor="middle"');
      result += text(x+w/2,y+82,id,"mono muted",'font-size="20" text-anchor="middle"') + "</g>";
      x+=w+10;
    }
    result += "</g>";
  }
  return result;
}
const learned=[];
for(let step=0;step<2;step++) {
  const ranked=counts(sequences); const selected=ranked[0]; const id=256+step;
  let body="";
  if(step>0){
    body+=text(12,38,"After merge 1: a + n → an (ID 256)","",'font-size="33"');
    body+=text(12,83,"Each ASCII letter starts as one UTF-8 byte token.","muted",'font-size="24"');
  }
  body+=corpusRows(sequences,selected.pair);
  body+=text(900,98,"Adjacent pair counts","label");
  for(const [i,entry] of ranked.entries()) {
    const y=153+i*53; const label=entry.pair.map(n=>pieces.get(n)).join(" + ");
    body+=`<g data-pair="${entry.pair.join(",")}" data-count="${entry.count}">`;
    if(i===0)body+=`<rect x="885" y="${y-35}" width="360" height="48" rx="7" fill="#f2effe"/>`;
    body+=text(904,y,label,i===0?"mono accent":"mono",'font-size="29"');
    body+=text(1210,y,entry.count,i===0?"mono accent":"mono",'font-size="30" text-anchor="end"')+"</g>";
  }
  const joined=selected.pair.map(n=>pieces.get(n)).join("");
  body+=text(130,493,`Most frequent: ${selected.pair.map(n=>pieces.get(n)).join(" + ")} → ${joined} · ${selected.count} replacements · new ID ${id}`,"accent",'font-size="29" font-weight="600"');
  body+=text(130,526,"Count pairs inside each pre-tokenized region.","muted",'font-size="23"');
  body+=text(130,557,"Never across region or document boundaries.","muted",'font-size="23"');
  svg(`byte-bpe-merge-${step+1}`,`Byte BPE training: choose merge ${step+1}`,`Constructed corpus banana, banana, band. Each document contributes one word-region after pre-tokenization; pairs never cross region or document boundaries. Current token IDs and all adjacent-pair counts are shown. Select ${selected.pair.map(n=>pieces.get(n)).join(" plus ")}, frequency ${selected.count}, and replace its non-overlapping occurrences with ${joined}, new ID ${id}. ${step===0?"Initial byte IDs: b 98, a 97, n 110, d 100.":"Counts were recomputed after the preceding merge, not copied from the original bytes."}`,1280,565,body);
  pieces.set(id,joined); learned.push([selected.pair,id]); sequences=sequences.map(seq=>replace(seq,selected.pair,id));
}
let final=text(12,38,"After merge 2: b + an → ban (ID 257)","",'font-size="33"');
final+=text(12,83,"Stop after two merges: a deliberately small teaching budget.","muted",'font-size="24"')+corpusRows(sequences);
final+=text(900,98,"Learned merge order","label");
for(const [i,[pair,id]] of learned.entries()) {
  final+=`<g data-merge-rank="${i}" data-pair="${pair.join(",")}" data-new-id="${id}">`;
  final+=text(900,166+i*104,`${i+1}. ${pair.map(n=>pieces.get(n)).join(" + ")}`,"mono accent",'font-size="30"');
  final+=text(938,204+i*104,`→ ${pieces.get(id)} (ID ${id})`,"mono",'font-size="28"')+"</g>";
}
final+=text(130,493,"Training: recount → choose → merge → repeat", "accent", 'font-size="31" font-weight="600"');
final+=text(130,543,"Encoding new text: replay learned merge priorities, not new frequency counts.","muted",'font-size="24"');
svg("byte-bpe-merge-result","Byte BPE training: the two learned merges", "After merging a plus n five times and b plus an three times, the two banana documents are ban, an, a; band is ban, d. Stop at a two-merge teaching budget. Learned rules in order are (97,110) to 256, then (98,256) to 257. Training recomputes frequency counts; encoding replays the learned priorities instead of retraining on each input.",1280,565,final);

// Assigned teaching outcomes, deliberately separate from measured release fixtures.
const selection = JSON.parse(readFileSync(new URL("content/fixtures/lecture6-selection-examples.json",root),"utf8"));
if(selection.status!=="illustrative-not-measured")throw Error("Selection examples must remain explicitly illustrative");
const comma=n=>n.toLocaleString("en-US");
const hair=y=>`<path d="M12 ${y}H1240" stroke="#e5e7eb"/>`;
const headRule=y=>`<path d="M12 ${y}H1240" stroke="#111827" stroke-width="2"/>`;
const vcase=selection.vocabulary_comparison;
let vocabulary=text(12,38,`Fit: same ${comma(vcase.fitting_documents)} documents`,"",'font-size="33"');
vocabulary+=text(12,162,"Vocabulary IDs", "label")+text(440,162,"Held-out tokens", "label")+text(875,162,"Fewer vs previous", "label")+headRule(185);
vcase.candidates.forEach(({vocabulary_ids,heldout_tokens},i)=>{
  const y=249+i*86, previous=vcase.candidates[i-1],saving=previous?100*(previous.heldout_tokens-heldout_tokens)/previous.heldout_tokens:null;
  vocabulary+=`<g data-vocabulary="${vocabulary_ids}" data-heldout-tokens="${heldout_tokens}" data-reduction="${saving??"none"}">`;
  vocabulary+=text(12,y,comma(vocabulary_ids),"accent",'font-size="39" font-weight="600"')+text(440,y,`${heldout_tokens/1e6}M`, "", 'font-size="39"')+text(875,y,saving===null?"—":`${saving}%`, "", 'font-size="36"')+hair(y+27)+"</g>";
});
vocabulary+=text(12,529,"64k may be enough: 2× vocabulary buys only 5% fewer tokens", "accent", 'font-size="30" font-weight="600"');
svg("bpe-vocabulary-size","Compare vocabulary sizes on the same held-out corpus","Illustrative outcomes, not measurements. Fit32k,64k,128k-ID BPEs on the same100,000 documents, then encode identical unseen text excluded from fitting. Assumed totals50M,40M,38M give marginal reductions20%,5%. A64k vocabulary can be a better cost tradeoff, but sequence counts alone do not establish system cost or model quality.",1280,565,vocabulary);

const sample=selection.sampling_comparison;
const gb=n=>`${n/1e9} GB`,share=(n,total)=>`${100*n/total}%`;
let mixtures=text(12,38,`${gb(sample.pool_bytes)} pool → two ${gb(sample.sample_bytes)} fitting samples`,"",'font-size="33"');
mixtures+=text(12,160,"Source", "label")+text(330,160,"Full pool", "label")+text(650,160,"Sample A", "label")+text(970,160,"Sample B", "label")+headRule(185);
sample.slices.forEach((slice,i)=>{
  const y=244+i*95;
  mixtures+=`<g data-slice="${slice.name}" data-pool-bytes="${slice.pool_bytes}" data-sample-a-bytes="${slice.sample_a_bytes}" data-sample-b-bytes="${slice.sample_b_bytes}">`;
  mixtures+=text(12,y,slice.name,"accent",'font-size="34" font-weight="600"');
  [[330,slice.pool_bytes,sample.pool_bytes],[650,slice.sample_a_bytes,sample.sample_bytes],[970,slice.sample_b_bytes,sample.sample_bytes]].forEach(([x,bytes,total])=>{
    mixtures+=text(x,y,gb(bytes),"",'font-size="34"')+text(x,y+36,share(bytes,total),"muted",'font-size="26"');
  });
  mixtures+=hair(y+54)+"</g>";
});
mixtures+=text(12,542,"Only the tokenizer-fitting sample changes", "accent", 'font-size="30" font-weight="600"');
svg("bpe-sampling-mixtures","Two fitting samples from a100GB English Spanish code pool","A separate controlled example: the eligible fitting pool has80GB English,15GB Spanish,5GB code after evaluation texts are reserved. A10GB sample A contains8GB,1.5GB,0.5GB. Sample B contains5GB,4GB,1GB. Both fit a64,000-ID BPE with the same preprocessing. DecimalGB refer to uncompressed UTF-8 bytes. These are tokenizer-fitting allocations, not prescribed model-training exposure.",1280,565,mixtures);

let evaluation=text(12,38,"Same unseen text for A and B", "", 'font-size="33"');
evaluation+=text(12,86,"Illustrative counts · Prose words / code lexemes", "muted", 'font-size="27"');
evaluation+=text(12,162,"Slice", "label")+text(290,162,"Reference units", "label")+text(650,162,"A: 64k BPE", "label")+text(960,162,"B: 64k BPE", "label")+headRule(185);
sample.slices.forEach((slice,i)=>{
  const y=245+i*100,ratioA=slice.tokens_a/slice.heldout_units,ratioB=slice.tokens_b/slice.heldout_units;
  evaluation+=`<g data-slice="${slice.name}" data-units="${slice.heldout_units}" data-unit="${slice.unit}" data-tokens-a="${slice.tokens_a}" data-tokens-b="${slice.tokens_b}" data-ratio-a="${ratioA}" data-ratio-b="${ratioB}">`;
  evaluation+=text(12,y,slice.name,"accent",'font-size="33" font-weight="600"')+text(290,y,`${slice.heldout_units/1000}k ${slice.unit}s`,"",'font-size="29"');
  evaluation+=text(650,y,comma(slice.tokens_a),"",'font-size="34"')+text(960,y,comma(slice.tokens_b),"",'font-size="34"');
  evaluation+=text(650,y+36,`${ratioA.toFixed(2)} / ${slice.unit}`,"muted",'font-size="26"')+text(960,y+36,`${ratioB.toFixed(2)} / ${slice.unit}`,"muted",'font-size="26"')+hair(y+54)+"</g>";
});
const changes=sample.slices.map(slice=>{
  const delta=100*(slice.tokens_b-slice.tokens_a)/slice.tokens_a;
  return `${slice.name} ${delta>=0?"+":"−"}${Math.abs(delta).toFixed(1)}%`;
});
evaluation+=text(12,549,`B vs A: ${changes.join(" · ")}`,"accent",'font-size="27" font-weight="600"');
svg("bpe-sampling-evaluation","Illustrative token counts on identical held-out texts","These are assigned teaching outcomes, not measurements from fitting10GB samples. Each row uses identical evaluation text for A and B and100,000 reference units. English words:130,000 versus138,000 model tokens,1.30 versus1.38 per word. Spanish words:180,000 versus145,000,1.80 versus1.45. Python reference lexemes:165,000 versus140,000,1.65 versus1.40. B increases English count6.2%, reduces Spanish19.4%, reduces code15.2%. Byte proportions cannot be used directly as weights for per-word rates.",1280,575,evaluation);
// Schematic image-enabled model path: preprocessing is not vision encoding.
const pathBox=(x,y,w,h,lines,tint=false)=>{
  let body=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${tint?"#f2effe":"#fff"}" stroke="#d6dae3" stroke-width="1.5"/>`;
  lines.forEach((line,i)=>{body+=text(x+w/2,y+h/2+(i-(lines.length-1)/2)*33+10,line,"",'font-size="27" text-anchor="middle"');});
  return body;
};
let imagePath=text(12,35,"Qwen example: two paths into one sequence", "", 'font-size="32"');
imagePath+='<g data-stage="text-input">'+pathBox(12,95,230,90,["Text + markers","<|image_pad|>"])+"</g>";
imagePath+='<g data-stage="text-embedding">'+pathBox(320,95,260,90,["Text tokenizer","ID → embedding"])+"</g>";
imagePath+='<g data-stage="text-vectors">'+pathBox(655,95,240,90,["Text vectors"])+"</g>";
imagePath+='<g data-stage="image-input">'+pathBox(12,325,230,90,["RGB image"])+"</g>";
imagePath+='<g data-stage="image-preprocessing">'+pathBox(320,325,260,90,["Image processor"])+text(450,454,"pixels + grid metadata","muted",'font-size="23" text-anchor="middle"')+"</g>";
imagePath+='<g data-stage="vision-encoder">'+pathBox(655,325,240,90,["Vision encoder"])+text(775,454,"visual feature vectors","muted",'font-size="23" text-anchor="middle"')+"</g>";
imagePath+='<g data-stage="feature-insertion">'+pathBox(1020,205,240,100,["Fill image slots","with features"],true)+"</g>";
imagePath+='<g data-stage="language-model">'+pathBox(1020,425,240,80,["Language","model"])+"</g>";
imagePath+='<path class="edge" d="M246 140H310"/><path class="edge" d="M584 140H645"/><path class="edge" d="M899 140H955V230H1010"/>';
imagePath+='<path class="edge" d="M246 370H310"/><path class="edge" d="M584 370H645"/><path class="edge" d="M899 370H955V280H1010"/><path class="edge" d="M1140 310V415"/>';
imagePath+=text(12,544,"The marker locates visual data; it does not contain the pixels.","accent",'font-size="28" font-weight="600"');
svg("image-processing-path","Image preprocessing and vision encoding are separate","A schematic Qwen image-enabled path, not a fixed patch count. Text with image-position markers is tokenized and embedded. RGB pixels pass through a compatible image processor, yielding pixel tensors and grid metadata, then a learned vision encoder produces visual feature vectors. Those vectors occupy the indicated image positions in the model input embedding sequence. The language model receives the combined representation. An image marker by itself contains no pixels. Kimi uses its own compatible processor and segment-aware message path.",1280,565,imagePath);
// Big-picture recap: concrete image input and visible vector columns, not marker syntax.
const vectorColumns=(x,y,types)=>types.map((type,column)=>{
  const fill=type==="visual"?"#7253ed":"#64748b";
  let body=`<g data-vector="${type}">`;
  for(let row=0;row<6;row++)body+=`<rect x="${x+column*40}" y="${y+row*15}" width="31" height="12" rx="2" fill="${fill}" opacity="${[.22,.5,.75,.35,.65,.9][(row+column)%6]}"/>`;
  return body+"</g>";
}).join("");
let bigPicture='<g data-stage="image-input">';
bigPicture+=text(120,38,"Image pixels","",'font-size="29" text-anchor="middle"');
bigPicture+='<rect x="20" y="66" width="200" height="132" rx="7" fill="#f6f7f9" stroke="#d6dae3"/>';
bigPicture+='<circle cx="169" cy="98" r="18" fill="#7253ed" opacity=".5"/><path d="M21 180L77 114L125 160L153 133L219 197H21Z" fill="#cbd5e1"/><path d="M21 180L77 114L125 160L153 133L219 197" fill="none" stroke="#64748b" stroke-width="2"/>';
bigPicture+='<path d="M70 66V198M120 66V198M170 66V198M20 110H220M20 154H220" fill="none" stroke="#fff" stroke-width="2"/>';
bigPicture+=text(120,236,"Resize / patchify","muted",'font-size="23" text-anchor="middle"')+"</g>";
bigPicture+='<g data-stage="vision-encoding">'+pathBox(285,80,250,105,["Vision encoder","+ projector"])+"</g>";
bigPicture+='<g data-stage="visual-embeddings">'+text(710,38,"Visual embeddings","accent",'font-size="28" text-anchor="middle"')+vectorColumns(635,85,["visual","visual","visual","visual"])+"</g>";
bigPicture+='<g data-stage="text-input">'+pathBox(20,335,200,100,["Describe this","picture."])+text(120,475,"Text prompt","muted",'font-size="25" text-anchor="middle"')+"</g>";
bigPicture+='<g data-stage="text-embedding">'+pathBox(285,335,250,100,["Tokenizer +","embedding table"])+"</g>";
bigPicture+='<g data-stage="text-embeddings">'+text(710,310,"Text embeddings","",'font-size="28" text-anchor="middle"')+vectorColumns(655,345,["text","text","text"])+"</g>";
bigPicture+='<g data-stage="embedding-sequence">'+text(1102,178,"One input sequence","",'font-size="28" text-anchor="middle"');
bigPicture+='<rect x="940" y="200" width="320" height="125" rx="8" fill="#fff" stroke="#d6dae3" stroke-width="1.5"/>'+vectorColumns(965,218,["text","text","visual","visual","visual","visual","text"]);
bigPicture+=text(1100,365,"Text + visual vectors","muted",'font-size="25" text-anchor="middle"')+"</g>";
bigPicture+='<g data-stage="language-model">'+pathBox(980,430,240,100,["Language","model"])+"</g>";
bigPicture+='<path class="edge" data-from="image-input" data-to="vision-encoding" d="M228 132H273"/>';
bigPicture+='<path class="edge" data-from="vision-encoding" data-to="visual-embeddings" d="M543 132H603"/>';
bigPicture+='<path class="edge" data-from="text-input" data-to="text-embedding" d="M228 385H273"/>';
bigPicture+='<path class="edge" data-from="text-embedding" data-to="text-embeddings" d="M543 385H603"/>';
bigPicture+='<path class="edge" data-from="visual-embeddings" data-to="embedding-sequence" d="M821 132H890V232H928"/>';
bigPicture+='<path class="edge" data-from="text-embeddings" data-to="embedding-sequence" d="M821 385H890V290H928"/>';
bigPicture+='<path class="edge" data-from="embedding-sequence" data-to="language-model" d="M1100 374V418"/>';
bigPicture+=text(20,548,"Each column is a numerical vector.","accent",'font-size="28" font-weight="600"');
svg("multimodal-big-picture","Big picture: images become embeddings","Common image–text encoder–projector pattern, not a universal architecture. An illustrative image is resized and patchified, a vision encoder and projector produce visual embeddings, and a separate prompt passes through a tokenizer and embedding lookup. Text and visual vectors join an ordered sequence consumed by the language model. The model can respond conditioned on the image and prompt without an intermediate image caption. Shaded columns represent numerical vectors, not measured values, fixed token counts or semantic labels.",1280,565,bigPicture);
// One pre-shifted packing fixture, reused across attention, loss, padding and positions.
const packing=JSON.parse(readFileSync(new URL("content/fixtures/lecture6-packing-example.json",root),"utf8"));
const packed={input:[],target:[],segment:[],position:[],loss:[],valid:[]};
for(const doc of packing.documents){
  if(doc.score_targets.length!==doc.tokens.length-1)throw Error("One supervision flag per shifted target required");
  doc.tokens.slice(0,-1).forEach((token,i)=>{
    packed.input.push(token);packed.target.push(doc.tokens[i+1]);packed.segment.push(doc.id);
    packed.position.push(i);packed.loss.push(Number(doc.score_targets[i]));packed.valid.push(1);
  });
}
const realSlots=packed.input.length;
if(realSlots>packing.block_length)throw Error("Packing fixture exceeds its block");
while(packed.input.length<packing.block_length){
  packed.input.push(packing.pad);packed.target.push(packing.pad);packed.segment.push("—");
  packed.position.push(0);packed.loss.push(0);packed.valid.push(0);
}
const maskGrid=(name,x,y,labels,allowed,reason=()=>"")=>{
  const size=labels.length===5?56:50;
  let body="";
  labels.forEach((label,j)=>{body+=text(x+j*size+size/2,y-20,label,"mono muted",'font-size="24" text-anchor="middle"');});
  labels.forEach((label,i)=>{
    body+=text(x-20,y+i*size+size/2+8,label,"mono muted",'font-size="24" text-anchor="end"');
    labels.forEach((_,j)=>{
      const on=allowed(i,j),why=reason(i,j),fill=on?"#c5b6f6":why==="other-document"?"#e5e7eb":"#fff";
      body+=`<rect data-mask="${name}" data-query="${i}" data-key="${j}" data-allowed="${Number(on)}" data-reason="${why}" x="${x+j*size}" y="${y+i*size}" width="${size}" height="${size}" fill="${fill}" stroke="#d6dae3"/>`;
      if(why==="other-document")body+=text(x+j*size+size/2,y+i*size+size/2+8,"×","muted",'font-size="25" text-anchor="middle"');
    });
  });
  return body;
};
let causal=text(310,65,"Keys: inputs you can read","muted",'font-size="25" text-anchor="middle"');
causal+=maskGrid("causal",170,150,["BOS","a","b","c","d"],(i,j)=>j<=i,(i,j)=>j>i?"future":"");
causal+='<rect x="168" y="260" width="284" height="60" fill="none" stroke="#7253ed" stroke-width="3"/>';
causal+=text(20,115,"Query","muted",'font-size="24"');
causal+=text(675,145,"Query b can read","",'font-size="32"');
["BOS","a","b"].forEach((token,i)=>{causal+=pathBox(675+i*120,190,105,70,[token],true);});
causal+=text(675,337,"Predict next token: c","accent",'font-size="35" font-weight="600"');
causal+=text(675,409,"c and d are future inputs","muted",'font-size="28"');
causal+=text(20,539,"Read the prefix → predict the next token","accent",'font-size="31" font-weight="600"');
svg("causal-attention","Causal attention hides future inputs","Constructed five-input example BOS a b c d. Rows are query positions and columns are key positions. Filled cells allow the current or an earlier key. The highlighted query b can read BOS a b but cannot read c or d; c is its next-token target. This is autoregressive prediction, not reconstruction of a visible token.",1280,565,causal);

let capacity=text(20,42,`${packing.capacity.input_positions_per_document} valid inputs per document`,"",'font-size="33"');
packing.capacity.document_counts.forEach((count,row)=>{
  const {sequence_length:limit,input_positions_per_document:length}=packing.capacity,used=count*length,pad=limit-used,utilization=used/limit;
  const y=100+row*140;
  capacity+=`<g data-documents="${count}" data-inputs="${used}" data-padding="${pad}" data-utilization="${utilization}">`;
  capacity+=text(20,y+43,`${count} ${count===1?"document":"documents"}`,"",'font-size="29"');
  for(let i=0;i<limit/length;i++){
    const x=280+i*104,active=i<count;
    capacity+=`<rect x="${x}" y="${y}" width="98" height="65" rx="5" fill="${active?"#f2effe":"#f6f7f9"}" stroke="${active?"#b6a4f2":"#e5e7eb"}"/>`;
    capacity+=text(x+49,y+43,active?String.fromCharCode(65+i):"—",active?"accent":"muted",'font-size="29" text-anchor="middle"');
  }
  capacity+=text(1150,y+43,`${100*utilization}%`,"accent",'font-size="31" font-weight="600"');
  capacity+=text(280,y+103,`${comma(used)} real + ${comma(pad)} PAD = ${comma(limit)} positions`,"muted",'font-size="25"')+"</g>";
});
capacity+=text(20,550,"Batch: B blocks · Sequence length: L = 4,096 positions","accent",'font-size="28" font-weight="600"');
svg("packing-capacity","Fill a4096-position block with512-position documents","Constructed utilization example: each prepared document supplies512 valid inputs and aligned next-token targets, with boundary markers accounted for. One document uses512 real positions plus3584 padding,12.5percent utilization. Two use1024 real plus3072 padding,25percent. Eight fill4096 positions,100percent. Sequence length counts positions per block; batch size counts blocks. These are slot counts, not measured runtime speedups.",1280,565,capacity);

const realLabels=packed.segment.slice(0,realSlots).map((id,i)=>id+packed.position[i]);
let isolated=text(250,42,"Only causal","",'font-size="31" text-anchor="middle"');
isolated+=text(940,42,"Causal + same document","",'font-size="31" text-anchor="middle"');
isolated+=text(250,77,"Keys →","muted",'font-size="23" text-anchor="middle"')+text(940,77,"Keys →","muted",'font-size="23" text-anchor="middle"');
isolated+=maskGrid("packed-causal",100,130,realLabels,(i,j)=>j<=i,(i,j)=>j>i?"future":"");
isolated+=maskGrid("packed-isolated",790,130,realLabels,(i,j)=>j<=i&&packed.segment[i]===packed.segment[j],(i,j)=>j>i?"future":packed.segment[i]!==packed.segment[j]?"other-document":"");
isolated+='<rect x="790" y="130" width="150" height="150" fill="none" stroke="#7253ed" stroke-width="2.5"/><rect x="940" y="280" width="150" height="150" fill="none" stroke="#7253ed" stroke-width="2.5"/>';
[["Allowed","#c5b6f6"],["Future","#fff"],["Other doc","#e5e7eb"]].forEach(([label,fill],i)=>{
  const y=170+i*70;isolated+=`<rect x="505" y="${y}" width="30" height="30" fill="${fill}" stroke="#d6dae3"/>`+text(549,y+25,label,"muted",'font-size="25"');
});
isolated+=text(100,495,"B can read A","accent",'font-size="29" font-weight="600"');
isolated+=text(790,495,"A and B stay separate","accent",'font-size="29" font-weight="600"');
isolated+=text(20,552,"Independent documents: past/current AND same document","",'font-size="27"');
svg("packed-document-attention","Causal attention versus independent-document packing","Six real inputs: A0 BOS,A1 a,A2 b,B0 BOS,B1 c,B2 d. Rows query columns. Ordinary causal attention allows21 connections including9 B-to-A cross-document connections. Adding matching document identity allows12 within-document causal connections, arranged as two lower-triangular diagonal blocks. Grey crossed cells are blocked other-document reads; white cells are blocked future inputs. EOS or position resets alone do not create this isolation.",1280,565,isolated);

const packingHeaders=()=>{
  let body=text(12,42,"Packed slot","muted",'font-size="25"');
  for(let i=0;i<packing.block_length;i++)body+=text(295+i*120,42,i,"mono muted",'font-size="25" text-anchor="middle"');
  body+=text(415,81,"Document A","accent",'font-size="26" text-anchor="middle"')+text(775,81,"Document B","accent",'font-size="26" text-anchor="middle"')+text(1075,81,"Padding","muted",'font-size="26" text-anchor="middle"');
  body+='<path d="M595 92V447M955 92V447" stroke="#d6dae3" stroke-dasharray="5 6"/>';
  return body;
};
const packingRow=(label,field,values,y,emphasis=()=>false)=>{
  let body=`<g data-field="${field}" data-values="${esc(values.join(","))}">`+text(12,y+41,label,"",'font-size="28"');
  values.forEach((value,i)=>{
    const accent=emphasis(i),isPad=!packed.valid[i];
    body+=`<g data-slot="${i}" data-value="${esc(value)}"><rect x="${240+i*120}" y="${y}" width="110" height="60" rx="6" fill="${accent?"#f2effe":isPad?"#f6f7f9":"#fff"}" stroke="${accent?"#b6a4f2":"#d6dae3"}"/>`;
    body+=text(295+i*120,y+40,value,accent?"mono accent":isPad?"mono muted":"mono",'font-size="28" text-anchor="middle"')+"</g>";
  });return body+"</g>";
};
let lossVisual=packingHeaders()+packingRow("Input","input",packed.input,100);
lossVisual+=packingRow("Target","target",packed.target,235,i=>Boolean(packed.loss[i]));
lossVisual+=packingRow("Loss mask","loss",packed.loss,370,i=>Boolean(packed.loss[i]));
lossVisual+=text(12,497,"Context-only targets: a, c","muted",'font-size="28"')+text(880,497,"4 scored targets","accent",'font-size="28"');
svg("packing-loss-mask","Loss mask selects shifted targets, not attention visibility","The same eight-slot pre-shifted fixture: inputs BOS a b BOS c d PAD PAD, targets a b EOS c d EOS PAD PAD, loss mask0 1 1 0 1 1 0 0. This constructed context/answer policy ignores targets a and c but leaves their input tokens visible to later allowed queries. Four targets are scored. Full-document pretraining could score all six real targets. A loss mask is not an attention barrier.",1280,565,lossVisual);
let paddingVisual=packingHeaders()+packingRow("Input","input",packed.input,100);
paddingVisual+=packingRow("Real input?","valid",packed.valid,235,i=>Boolean(packed.valid[i]));
paddingVisual+=packingRow("Target","target",packed.target,370);
paddingVisual+=text(12,497,"PAD keys: hidden from real queries","",'font-size="29"');
svg("packing-padding-mask","Padding flags separate real input positions from unused storage","Six real input slots followed by two PAD slots. One-means-real validity flags are1 1 1 1 1 1 0 0; API Boolean conventions can differ. Combine validity with causal and same-document attention so real queries cannot read padding keys. Padding targets do not contribute to loss. Padding query outputs are ignored, but attention rows must remain numerically defined. Validity flags are not the context/answer loss mask.",1280,565,paddingVisual);
let positionsVisual=packingHeaders()+packingRow("Input","input",packed.input,100);
positionsVisual+=packingRow("Document","segment",packed.segment,235);
positionsVisual+=packingRow("Position ID","position",packed.position,370,i=>packed.valid[i]&&packed.position[i]===0);
positionsVisual+=text(12,497,"A starts at 0; B starts at 0","",'font-size="29"')+text(770,497,"PAD: filler coordinates","muted",'font-size="26"');
svg("packing-position-ids","Reset position coordinates within each independent document","The same inputs BOS a b BOS c d PAD PAD have segments A A A B B B and no document at the padding slots. Position IDs are0 1 2 0 1 2 0 0. A and B each begin at zero; the final zeros are ignored filler coordinates for padding, not new documents. This is the chosen independent-document position policy, not an attention boundary or loss mask. Check checkpoint compatibility separately.",1280,565,positionsVisual);
console.log(`Rendered ${figureCount} lecture figures in ${fileURLToPath(new URL("public/lecture-6/",root))}`);
