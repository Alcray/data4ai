# Course authoring style

This guide defines how agents should write and design material for this course. It applies to every file under `content/lectures/`.

## 1. Write for the student

- Address the subject directly and explain it as part of the lesson.
- Assume the reader is learning the concept for the first time, but do not speak down to them.
- Introduce terminology before relying on it.
- Prefer concrete explanations and small examples over vague summaries.
- Connect each paragraph to the surrounding argument. Avoid isolated facts that do not advance the lesson.
- Do not discuss prompts, authoring decisions, revisions, or mistakes in the lecture itself.

The lecture should read as if it was intentionally written in its final form, not produced from a conversation or editing session.

## 2. Treat user input as authoring notes

User-provided text establishes the intended topic, emphasis, examples, and approximate level. It is not necessarily final copy.

When turning notes into a lecture:

1. preserve the intended idea and scope;
2. verify and correct factual claims;
3. reorganize the material into a coherent explanation;
4. rewrite unclear or ungrammatical passages; and
5. remove conversational or internal-note language.

Do not reproduce a misconception merely to stay close to the user's wording.

## 3. Handle factual corrections cleanly

State the correct fact directly in the course material. Do not frame it as a correction to the author unless the contrast is itself pedagogically important.

Preferred course text:

> BART and T5 are encoder–decoder models, like the original Transformer.

Avoid:

> BART and T5 are not encoder-only models.

The second version exposes an authoring mistake instead of teaching the architecture directly.

When a user's note contains a meaningful factual slip:

- silently use the correct fact in the lecture; and
- mention the correction briefly in the chat handoff, separate from the student-facing material.

Do not emphasize ordinary spelling mistakes or rough phrasing in the chat handoff.

## 4. Keep the presentation minimal

Use the least elaborate format that explains the idea well. Prefer formats in this order:

1. clear prose;
2. a short example, equation, or code block;
3. a simple list or table when comparison is the point; and
4. a visual only when spatial, sequential, or quantitative relationships are meaningfully clearer visually.

Do not create a visual merely because a section contains multiple categories.

Avoid by default:

- decorative cards or dashboard-style grids;
- repeated boxes that restate nearby prose;
- large callouts for ordinary information;
- animation without a specific teaching purpose;
- multiple visualizations of the same data;
- ornamental arrows, badges, gradients, or excessive accent colors; and
- a new component when an existing course pattern already works.

When a visual is justified:

- make it explain one clear relationship;
- keep labels short and student-facing;
- use neutral colors for ordinary elements and accent color only for meaningful emphasis;
- keep related diagrams visually consistent;
- provide an accurate accessible label or caption; and
- ensure the surrounding prose remains understandable without relying only on color.

## 5. Maintain a consistent lecture structure

Follow nearby lectures and existing course conventions before inventing a new structure. A typical lecture should contain:

1. a clear title and short opening motivation;
2. learning objectives when useful;
3. sections that move from prerequisite ideas to the main concept;
4. examples immediately after difficult abstractions;
5. a concise summary or "What to remember" section; and
6. references generated from the shared bibliography.

Use sentence case for headings. Keep heading depth shallow unless the material genuinely needs more levels.

## 6. Use restrained emphasis

- Use bold text for a genuinely important term or conclusion, not for entire sentences.
- Use italics for paper titles and conventional emphasis.
- Use inline code for literal tokens, commands, filenames, and values such as `<BOS>`.
- Do not highlight words merely to make a layout look more active.
- Prefer a short paragraph over a custom block when both communicate the same information.

## 7. Place citations where the claim appears

- Link the paper title or named method when a stable primary source is available.
- Put the author–year citation immediately after the linked paper title, benchmark name, model name, or method name that it identifies. In QMD source, write the citation token directly after the closing link—for example, `[GSM8K](paper-url) [@cobbe2021gsm8k]`—rather than at the end of the surrounding sentence or paragraph.
- Apply this placement consistently to every paper reference in the lecture, including references inside tables and captions.
- Do not place a citation at the distant end of a sentence when it is unclear which paper it supports.
- Prefer original papers and authoritative primary sources.
- Keep bibliographic data in `content/references.bib` rather than manually reproducing full references in lecture prose.

Preferred pattern:

> The [sequence-to-sequence model](paper-url) (Sutskever et al. 2014) used a deep LSTM encoder and decoder.

## 8. Preserve technical precision

- Distinguish historical architectures from their later variants.
- Do not collapse related but different terms for convenience.
- Explain limitations with appropriate scope; avoid universal claims based on one benchmark.
- When reporting metrics, state what is measured and whether higher or lower is better.
- Use `encoder–decoder` for the architecture and preserve established model names such as BERT, RoBERTa, BART, T5, and GPT.
- If a claim is uncertain or potentially current, verify it before publishing it as course content.

## 9. Editing workflow

Before editing a lecture:

1. read this guide;
2. inspect the lecture's existing structure and nearby formatting patterns;
3. check whether the requested change can be made with existing components; and
4. identify factual corrections that should be reported only in chat.

After editing:

1. update the QMD source rather than generated TypeScript;
2. run `npm run content:render`;
3. run `npm run build`;
4. confirm generated content reflects the source; and
5. keep the work local unless deployment was explicitly requested.

## 10. Final authoring check

Before handing the work back, confirm:

- the lecture speaks directly to the student;
- factual mistakes were corrected without exposing the author's slip;
- the explanation follows a coherent teaching sequence;
- no unnecessary visual or decorative component was added;
- citations sit next to the papers or claims they support;
- terminology and formatting match the rest of the course; and
- the rendered lecture and local build succeed.
