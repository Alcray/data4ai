/** Native SVGs for the three sampling approaches in Lecture 7. */
import { mkdirSync, writeFileSync } from "node:fs";

const output = new URL("../public/lecture-7/", import.meta.url);
mkdirSync(output, { recursive: true });
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const text = (x, y, value, cls = "", extra = "") => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(value)}</text>`;
const centered = (x, y, value, cls = "") => text(x, y, value, cls, 'text-anchor="middle"');
const box = (x, y, width, height, cls = "box") => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" class="${cls}"/>`;
const edge = path => `<path class="edge" d="${path}"/>`;
const rail = path => `<path class="rail" d="${path}"/>`;
const style = `text{font-family:"Segoe UI",Arial,sans-serif;fill:#111827;font-size:25px}.muted{fill:#6b7280;font-size:21px}.small{fill:#6b7280;font-size:18px}.accent{fill:#5b3fd4}.math{font-family:"Cambria Math",Georgia,serif;font-size:26px}.box{fill:#fff;stroke:#e5e7eb;stroke-width:2}.code{fill:#f2effe;stroke:#b6a4f2;stroke-width:2}.prose{fill:#f6f7f9;stroke:#cbd5e1;stroke-width:2}.rail,.edge{fill:none;stroke:#7253ed;stroke-width:2.5}.edge{marker-end:url(#arrow)}`;
function write(name, title, description, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 440" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#7253ed"/></marker></defs><style>${style}</style>${body}</svg>\n`;
  writeFileSync(new URL(name + ".svg", output), svg);
}

const joinInputs = rail("M270 115H320V200") + rail("M270 285H320V200") + edge("M320 200H355");
let staticMix = `<g data-approach="token-static" data-code-tokens="1200000" data-text-tokens="800000" data-block-length="4096" data-boundaries="preserved">`;
staticMix += box(20, 70, 250, 90, "code") + centered(145, 108, "Code stream", "accent") + centered(145, 139, "1.2M tokens", "muted");
staticMix += box(20, 240, 250, 90, "prose") + centered(145, 278, "Text stream") + centered(145, 309, "0.8M tokens", "muted");
staticMix += joinInputs;
staticMix += box(365, 145, 220, 110) + centered(475, 183, "Shuffle") + centered(475, 212, "documents") + centered(475, 240, "Keep boundaries", "small");
staticMix += edge("M585 200H640");
staticMix += centered(780, 126, "Joined token stream") + box(650, 160, 260, 80);
const segments = [["code", 72], ["prose", 48], ["code", 36], ["prose", 24], ["code", 36], ["prose", 24]];
let x = 660;
for (const [cls, width] of segments) {
  staticMix += `<rect class="${cls}" x="${x}" y="172" width="${width}" height="56"/>`;
  x += width;
}
staticMix += centered(780, 276, "Order shown schematically", "small") + edge("M910 200H985");
staticMix += centered(1120, 84, "Stored training blocks");
for (const y of [110, 180, 250]) staticMix += box(1000, y, 240, 50) + centered(1120, y + 33, "4,096 positions", "muted");
staticMix += centered(1120, 333, "…", "muted");
staticMix += centered(780, 392, "Full retained stream: 60% code tokens", "accent");
staticMix += "</g>";
write("static-mix-and-chunk", "Approach 1: token-static sampling", "Code documents provide 1.2 million tokens and other text provides 0.8 million. Shuffle whole documents, join them while retaining document boundaries, and pack a fixed token mixture into stored 4,096-position training blocks. The full retained stream contains 60 percent code tokens. Colored segments indicate schematic ordering, not individual documents. Tail targets are retained, not discarded.", staticMix);

const documentPools = box(20, 70, 250, 90, "code") + centered(145, 108, "Code documents", "accent") + centered(145, 139, "Source pool", "muted")
  + box(20, 240, 250, 90, "prose") + centered(145, 278, "Text documents") + centered(145, 309, "Source pool", "muted") + joinInputs;
let staticDocuments = `<g data-approach="document-static" data-block-length="4096" data-boundaries="preserved">` + documentPools;
staticDocuments += box(365, 145, 230, 110) + centered(480, 186, "Choose a source") + centered(480, 225, "qᵢ", "math accent");
staticDocuments += edge("M595 200H650");
staticDocuments += box(665, 145, 230, 110) + centered(780, 186, "Draw a document") + centered(780, 225, "μᵢ: mean length", "muted");
staticDocuments += edge("M895 200H950");
staticDocuments += box(965, 145, 280, 110) + centered(1105, 186, "Pack training blocks") + centered(1105, 225, "4,096 positions", "muted");
staticDocuments += `<path class="edge" stroke-dasharray="8 6" d="M1105 265V340H480V265"/>`;
staticDocuments += centered(795, 392, "Fixed qᵢ for all document draws", "accent") + "</g>";
write("static-document-sampling", "Approach 2: document-static sampling", "For each document draw, choose a source with fixed probability q_i, draw a document whose source has mean token length mu_i, then pack training blocks. Repeat the draws with the same source probabilities. Static refers to the fixed allocation rule, even when documents are loaded during training. Document boundaries are preserved.", staticDocuments);

let dynamicDocuments = `<g data-approach="document-dynamic" data-feedback="consumed-targets" data-block-length="4096" data-boundaries="preserved">` + documentPools;
dynamicDocuments += box(365, 145, 230, 110) + centered(480, 186, "Choose a source") + centered(480, 225, "Largest deficit", "muted");
dynamicDocuments += edge("M595 200H650");
dynamicDocuments += box(665, 145, 230, 110) + centered(780, 186, "Draw a document") + centered(780, 225, "Keep boundaries", "muted");
dynamicDocuments += edge("M895 200H950");
dynamicDocuments += box(965, 145, 280, 110) + centered(1105, 186, "Pack and consume") + centered(1105, 225, "4,096 positions", "muted");
dynamicDocuments += edge("M1105 265V350H965");
dynamicDocuments += box(655, 312, 295, 76) + centered(802, 343, "Update counts") + centered(802, 373, "Scored targets consumed", "muted");
dynamicDocuments += `<path class="edge" stroke-dasharray="8 6" d="M645 350H480V265"/>`;
dynamicDocuments += centered(802, 430, "Choose again using updated deficits", "accent") + "</g>";
write("dynamic-document-sampling", "Approach 3: document-dynamic sampling", "Choose the source furthest behind its target allocation, draw a document, and pack and consume its training blocks. Count scored targets actually consumed, then feed those updated counts back to the source selector before choosing the next document. This feedback changes document selection during the run; document boundaries are preserved.", dynamicDocuments);
console.log("Rendered three Lecture 7 sampling diagrams.");
