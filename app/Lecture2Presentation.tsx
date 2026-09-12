import { useMemo, useRef, type ReactNode } from "react";
import { Slide } from "@revealjs/react";
import Presentation from "./Lecture1Presentation";
import { Lecture2DataLabs } from "./Lecture2DataLabs";
import { lecture2Html } from "./generated/lecture-2";
import "./Lecture2Presentation.css";

function readArticle() {
  const doc = new DOMParser().parseFromString(lecture2Html, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3, h4"));
  const notes = (heading: string) => {
    const start = headings.find((node) => node.textContent?.trim() === heading);
    const paragraphs: string[] = [];
    let node = start?.nextElementSibling;
    while (node && !/^H[234]$/.test(node.tagName)) {
      const text = node.textContent?.trim();
      if (text) paragraphs.push(text);
      node = node.nextElementSibling;
    }
    return paragraphs.join("\n\n");
  };
  return {
    notes,
    html: (selector: string) => doc.querySelector(selector)?.outerHTML ?? "",
    math: Array.from(doc.querySelectorAll('math[display="block"]'), (node) => node.outerHTML),
  };
}

function Points({ items }: { items: string[] }) {
  return <div className="lp-takeaways">{items.map((item, i) => <div key={item}><strong>{String(i + 1).padStart(2, "0")}</strong><span>{item}</span></div>)}</div>;
}

function Flow({ items }: { items: string[] }) {
  return <div className="l2-flow">{items.map((item, i) => <div key={item}><small>{i + 1}</small><strong>{item}</strong></div>)}</div>;
}

function Comparison({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return <table className="l2-table"><thead><tr>{headers.map((text) => <th key={text}>{text}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((text, i) => <td key={i}>{text}</td>)}</tr>)}</tbody></table>;
}

export default function Lecture2Presentation({ onExit }: { onExit: () => void }) {
  const root = useRef<HTMLElement | null>(null);
  const article = useMemo(() => readArticle(), []);
  const slide = (title: string, section: string, content: ReactNode, source?: ReactNode, lab = false) => (
    <Slide key={title} className={`lecture-presentation-slide l2-slide${lab ? " l2-lab-slide" : ""}`} notes={article.notes(section)}>
      <div className="lp-slide-shell">
        <header className="lp-slide-header"><p className="lp-kicker">LECTURE 2 · {lab ? "INTERACTIVE" : "DATA AND CAPABILITIES"}</p><h2>{title}</h2></header>
        <div className="lp-slide-body">{content}</div>
        {source && <footer className="lp-source">{source}</footer>}
      </div>
    </Slide>
  );
  const original = (selector: string) => <div className="l2-original" dangerouslySetInnerHTML={{ __html: article.html(selector) }} />;
  const formula = (index: number) => <div className="l2-formula" dangerouslySetInnerHTML={{ __html: article.math[index] ?? "" }} />;
  const lab = (attribute: string) => <div className="l2-lab lecture-content"><div {...{ [attribute]: "" }} /></div>;

  const slides = <>
    <Slide className="lecture-presentation-slide lp-title-slide" notes="Lecture 2 follows the article from data origin and supervision through collection, training, evaluation, distillation, specialized systems, and physical-world trajectories.">
      <div className="lp-title-shell"><p className="lp-kicker">DATA FOR AI · LECTURE 2 OF 16</p><h1>Data, training signals,<br /><span>and capability boundaries</span></h1><p className="lp-title-hint">→ arrows to navigate · O overview · S speaker view · F full screen · Q exit</p></div>
    </Slide>
    {slide("Learning objectives", "Learning objectives", <Points items={["Origin · modality · supervision · lifecycle role", "Storage and discovery of training data", "Pretraining · post-training · RL · distillation", "Human and synthetic labeling", "Benchmark protocols and capability claims", "Specialized models and classical baselines"]} />)}
    {slide("Start with two questions", "Start with origin and supervision", <div className="l2-question-pair">
      <div><small>01</small><strong>Origin</strong><p>Where did the record come from?</p><span>Observation or person</span><span>Model or simulator</span></div>
      <div><small>02</small><strong>Supervision</strong><p>Was the task signal attached?</p><span>Answer · class · ranking</span><span>Action · reward</span></div>
    </div>)}
    {slide("Origin × supervision", "Start with origin and supervision", <div className="l2-origin-matrix" role="table" aria-label="Four combinations of origin and supervision">
      <div className="l2-matrix-corner" aria-hidden="true"><span>Origin ↓</span><span>Supervision →</span></div>
      <div role="columnheader"><strong>Unlabeled</strong></div><div role="columnheader"><strong>Labeled</strong></div>
      <div role="rowheader"><strong>Observed or<br />human-produced</strong></div>
      <div role="cell"><b>Wikipedia paragraph</b><span>Self-supervised next tokens</span></div>
      <div role="cell"><b>Speech + transcript</b><span>Checked recognition target</span></div>
      <div role="rowheader"><strong>Synthetic or<br />simulated</strong></div>
      <div role="cell"><b>Generated documents</b><span>Filtered adaptation corpus</span></div>
      <div role="cell"><b>Verified solution</b><span>SFT or distillation target</span></div>
    </div>)}
    {slide("Then ask two more questions", "One record has several coordinates", <div className="l2-question-pair">
      <div><small>03</small><strong>Modality</strong><p>What does the record contain?</p><span>Text · code · audio · image</span><span>Video · LiDAR · actions</span></div>
      <div><small>04</small><strong>Lifecycle role</strong><p>What decision will it support?</p><span>Fit · select · test</span><span>Train · validate · evaluate</span></div>
    </div>)}
    {slide("One problem, different roles", "One record has several coordinates", <div className="l2-math-roles">
      <section className="l2-math-example"><small>PROBLEM</small><h3>Solve 3x + 5 = 20</h3><div className="l2-math-work"><span>3x + 5 − 5 = 20 − 5</span><span>3x = 15</span><span>x = 5</span></div></section>
      <div className="l2-role-stack">
        <div><span className="l2-role-input">Question + answer</span><b>Evaluation</b><p>Did the model return <strong>5</strong>?</p></div>
        <div><span className="l2-role-input">Question + worked solution</span><b>Supervised fine-tuning</b><p>Train the desired reasoning tokens</p></div>
        <div><span className="l2-role-input">Problem + answer checker</span><b>Reinforcement learning</b><p>Reward sampled solutions that pass</p></div>
      </div>
    </div>)}
    {slide("An article becomes a learning signal", "Watch an article become a learning signal", lab("data-next-token-lab"), undefined, true)}
    {slide("Self-supervised next-token loss", "Unlabeled data can train a base model", <>{formula(0)}<Flow items={["Earlier tokens", "Next-token distribution", "Actual next token", "Loss and weight update"]} /></>)}
    {slide("A supervised fine-tuning record", "Labeled data supplies a desired answer", <><pre className="l2-json-record"><code>{`{
  "messages": [
    {
      "role": "user",
      "content": "Solve $3x + 5 = 20$. Explain each step."
    },
    {
      "role": "assistant",
      "content": "Subtract 5 from both sides: $3x = 15$. Divide both sides by 3: $x = 5$. Therefore, $\\\\boxed{x = 5}$."
    }
  ]
}`}</code></pre>{formula(1)}</>)}
    {slide("Examples of data records", "Examples of data records", <Comparison headers={["Record", "Signal", "Use"]} rows={[["Wikipedia article", "Next tokens", "Pretraining"], ["Speech + transcript", "Checked text", "ASR"], ["Ranked responses", "Pairwise preference", "Reward model / DPO"], ["Teacher solution", "Trace + verifier", "SFT / distillation"], ["Robot trajectory", "Action / reward", "Imitation / offline RL"]]} />)}
    {slide("Operating history for sale", "Operating history can become training data", <figure className="l2-evidence-frame"><img src="/data4ai/lecture-2/evidence/project-lazarus-training-asset.png" alt="Turing Project Lazarus website describing a company's operating history as a training asset" /></figure>, <a href="https://lazarus.turing.com/">Project Lazarus · Turing</a>)}
    {slide("Free cleaning, valuable footage", "Physical work can become training data", <figure className="l2-evidence-frame"><img src="/data4ai/lecture-2/evidence/shift-free-cleaning-data.png" alt="Shift website offering free cleaning in exchange for first-person footage used to train robots" /></figure>, <a href="https://www.shiftapp.nyc/">Shift · free cleaning in exchange for first-person training footage</a>)}
    {slide("WARC · WAT · WET", "How data exists outside a training script", original(".archive-specimens"), <a href="https://github.com/commoncrawl/whirlwind-python">Common Crawl · one capture, three representations</a>)}
    {slide("Source formats and manifests", "How data exists outside a training script", <Comparison headers={["Source", "Representation", "Preserve"]} rows={[["Wikimedia", "XML · SQL · JSON · RDF", "Snapshot and version"], ["Common Voice / OpenSLR", "Audio + metadata + transcripts", "Speakers · consent · validation"], ["Dataset repositories", "JSONL · CSV · Parquet · Arrow", "Schema · license · transformations"]]} />, <a href="https://www.openslr.org/160/">OpenSLR 160 · Armenian speech</a>)}
    {slide("Three records in JSONL", "A JSONL file is a stream of records", <div className="l2-jsonl-example">
      <div className="l2-jsonl-rule"><strong>One line</strong><span>one complete JSON object</span></div>
      <div className="l2-jsonl-records" aria-label="Three example JSONL records">
        <div><span><b>01</b><small>TEXT RECORD</small></span><code>{`{"id":"hywiki-0184","text":"Armenian is an Indo-European language.","source":"hywiki-20260901","split":"train"}`}</code></div>
        <div><span><b>02</b><small>AUDIO + TRANSCRIPT</small></span><code>{`{"id":"cv-hy-9812","audio":"clips/9812.mp3","text":"Բարեւ աշխարհ","validated":true,"split":"train"}`}</code></div>
        <div><span><b>03</b><small>SFT + VERIFIER</small></span><code>{`{"id":"math-0142","messages":[{"role":"user","content":"Solve 3x + 5 = 20."},{"role":"assistant","content":"x = 5."}],"verifier":{"answer":"5"}}`}</code></div>
      </div>
    </div>)}
    {slide("Dataset, corpus, benchmark", "Dataset, corpus, and benchmark", <Comparison headers={["Object", "Definition"]} rows={[["Dataset", "Organized records"], ["Corpus", "Material assembled for training or analysis"], ["Benchmark", "Data + task protocol + metric"]]} />)}
    {slide("Data collection infrastructure", "Data collection is a global infrastructure project", <Comparison headers={["Initiative", "Contribution"]} rows={[["Common Crawl", "Repeated web snapshots"], ["Wikimedia", "Versioned knowledge"], ["Common Voice / OpenSLR", "Speech and validation"], ["BigScience ROOTS", "1.6 TB · 59 languages"], ["Masakhane", "African NLP communities and local expertise"], ["AI4Bharat", "Indian language corpora, speech, translation"]]} />, <a href="https://arxiv.org/abs/2303.03915">ROOTS · sources and governance</a>)}
    {slide("Labeling workstation", "Try labeling one record", lab("data-labeling-lab"), undefined, true)}
    {slide("Three records × three labelers", "From individual labels to consensus", <div className="l2-agreement-matrix">
      <div className="l2-agreement-head"><span>Record</span><span>A</span><span>B</span><span>C</span><span>Review</span></div>
      <div><strong>Verification code never arrives</strong><span className="access">Access</span><span className="access">Access</span><span className="access">Access</span><b className="unanimous">Unanimous</b></div>
      <div><strong>Charged twice and cannot sign in</strong><span className="billing">Billing</span><span className="access">Access</span><span className="billing">Billing</span><b className="review">Adjudicate</b></div>
      <div><strong>Parcel says delivered; item missing</strong><span className="delivery">Delivery</span><span className="delivery">Delivery</span><span className="delivery">Delivery</span><b className="unanimous">Unanimous</b></div>
    </div>)}
    {slide("The six labeling decisions", "Six labeling decisions", <div className="l2-label-pipeline"><Comparison headers={["Pipeline point", "Concrete decision"]} rows={[
      ["Task and rubric", "Define the primary problem; show verification, damage, billing, and mixed cases"],
      ["Sampling", "Include languages, terse messages, rare classes, and multi-issue requests"],
      ["Qualification", "Practice on reviewed cases; allow abstention when the rule is insufficient"],
      ["Overlap", "Two independent labels on a sample; adjudicate and revise the rubric"],
      ["Schema checks", "Allowed label ID · message ID · rubric version · annotator · timestamp"],
      ["Version and audit", "Keep v1 and corrected v2 labels with the reason for every change"],
    ]} /></div>)}
    {slide("Synthetic labeling pipelines", "Model-assisted and synthetic labeling", lab("data-synthetic-pipelines"), <a href="https://arxiv.org/abs/2410.01560">OpenMathInstruct-2 · published pipeline, illustrative records</a>, true)}
    {slide("Training stages and branches", "The lifecycle changes the learning signal", original(".lifecycle-figure"))}
    {slide("Data and objectives by stage", "The lifecycle changes the learning signal", <Comparison headers={["Stage", "Signal", "Weights"]} rows={[["Pretraining / continued pretraining", "Self-supervised sequences", "Updated"], ["SFT", "Desired response tokens", "Updated"], ["Preference optimization", "Ranked or scored candidates", "Updated"], ["Reinforcement learning", "Sampled actions + reward", "Updated"], ["Test-time compute", "Samples · search · tools · verification", "Fixed"]]} />)}
    {slide("Recursive improvement experiments", "The lifecycle changes the learning signal", <><Flow items={["Attempt", "External feedback", "Accepted correction", "Update and retry"]} /><Comparison headers={["SIA prototype", "Update"]} rows={[["Agent harness", "Feedback agent rewrites the harness"], ["Model weights", "Verifier-driven LoRA updates"], ["Evidence boundary", "Bounded experiments on specific tasks"]]} /></>, <a href="https://arxiv.org/abs/2605.27276">SIA · legal classification, CUDA kernels, RNA denoising</a>)}
    {slide("Benchmark protocol", "Benchmarks are capability claims with boundaries", <><div className="l2-coordinates">{["Checkpoint", "Prompt", "Tools", "Sampling", "Budget", "Grader", "Data version"].map((text) => <strong key={text}>{text}</strong>)}</div><Points items={["A benchmark name does not specify the complete run configuration", "Harness, retries, time, sandbox, and context handling can change the result", "A composite score depends on which tasks are included and how they are weighted", "Report task success together with tokens, elapsed time, and cost"]} /></>, <><a href="https://www.youtube.com/watch?v=dGHLg9NfvEo">Caleb Writes Code · benchmark analysis</a> · <a href="https://www.youtube.com/watch?v=XvmixEXPT3Q">ARC-AGI-3 analysis</a></>)}
    {slide("Pinned and native harnesses", "Why a benchmark name is not a complete result", <Comparison headers={["Question", "Evaluation design", "Claim"]} rows={[
      ["Which checkpoint performs better?", "Pin harness · tools · budget · data · grader", "Controlled checkpoint comparison"],
      ["Which product completes the work?", "Fix workload; document each native product stack", "Model–harness system comparison"],
      ["Which system should be deployed?", "Use realistic tasks and safety constraints", "Success · latency · cost · failure severity"],
    ]} />, <><a href="https://www.youtube.com/watch?v=dGHLg9NfvEo">Model scores, harnesses, repetitions, and budgets</a></>)}
    {slide("ARC-AGI-3: infer a hidden game", "ARC-AGI-3: an interactive evaluation", <div className="l2-arc-replay">
      <figure><img src="/data4ai/lecture-2/evidence/arc-agi-3-public-replay.png" alt="Public ARC-AGI-3 ar25 replay with a blue game grid and a sequence of actions in the reasoning log" /></figure>
      <div><span><small>OBSERVE</small><b>Grid + available actions</b></span><span><small>PROBE</small><b>Act, then inspect the next frame</b></span><span><small>INFER</small><b>Update the hidden-rule hypothesis</b></span><span><small>REMEMBER</small><b>Carry useful state across turns</b></span></div>
    </div>, <><a href="https://arxiv.org/abs/2603.24621">ARC-AGI-3 technical report</a> · <a href="https://arcprize.org/replay/c28b4a3f-69b3-416e-8137-3890497bc089">public demonstration replay</a></>)}
    {slide("Same checkpoint, two ARC-AGI-3 results", "ARC-AGI-3: an interactive evaluation", <><div className="l2-harness-score">
      <div><small>ARC PRIZE · STANDARD HARNESS</small><strong>62.71%</strong><b>Provider-neutral evaluation</b><p>Text history + visible model notes</p></div>
      <div><small>OPENAI · RESPONSES API HARNESS</small><strong>98.55%</strong><b>Provider Adapter evaluation</b><p>Native reasoning state + compaction</p></div>
    </div><div className="l2-harness-constant"><span><b>Held constant</b> GPT-6 Astra · Max reasoning · semi-private tasks · limits · scoring</span><span><b>Changed</b> Context-management harness</span></div></>, <><a href="https://arcprize.org/results/openai-gpt-6-astra">ARC Prize verified results</a> · <a href="https://openai.com/index/gpt-6-astra/">OpenAI model report</a> · <a href="https://github.com/arcprize/arc-agi-3-benchmarking">Harness definitions</a></>)}
    {slide("Classical static tests", "Classical static tests", <Comparison headers={["Benchmark", "Task", "Boundary"]} rows={[["MMLU", "Multiple choice · 57 subjects", "Fixed question format"], ["GSM8K / MATH", "Worked mathematics", "Answer grading"], ["HumanEval", "164 Python functions", "Function-level tests"]]} />, <><a href="https://arxiv.org/abs/2009.03300">MMLU</a> · <a href="https://arxiv.org/abs/2107.03374">HumanEval</a></>)}
    {slide("Public system tests", "Current public system tests", <Comparison headers={["Benchmark", "Task", "System dependency"]} rows={[["GPQA Diamond / LiveBench", "Science / refreshed questions", "Question selection and grader"], ["SWE-bench", "Repository patches", "Harness + tests"], ["Terminal-Bench", "Container tasks", "Tools + final state"], ["BFCL", "Function calling", "Accuracy · latency · cost"]]} />)}
    {slide("Private product evaluation", "Private product evaluation", <><Comparison headers={["CursorBench 3.2", "Online experiments"]} rows={[["Real, multi-file coding tasks", "Live user population"], ["Score · cost · tokens · steps", "Success · corrections · abandonment"], ["Private data limits reproduction", "Regressions · latency · incidents"]]} /></>, <a href="https://cursor.com/evals">Cursor evaluation methodology</a>)}
    {slide("Try the public tasks", "Try the public tasks", lab("data-benchmark-lab"), undefined, true)}
    {slide("Capability boundaries", "What models can and cannot do today", <Comparison headers={["Useful capabilities", "Persistent difficulties"]} rows={[["Text and code generation", "Long-horizon state tracking"], ["Structured mathematics and science", "Recovery from early mistakes"], ["Tools and repository editing", "Calibrated uncertainty"], ["Multi-step tasks with verifiers", "Novel tasks with costly verification"]]} />)}
    {slide("Two forms of distillation", "Distillation turns one model's behavior into data", <div className="l2-distillation-types">
      <div className="l2-distillation-card"><small>PROBABILITY / LOGIT</small><h3>Match the teacher distribution</h3><div className="l2-token-probs"><span><b>there</b> .54</span><span><b>here</b> .31</span><span><b>away</b> .09</span></div><em>Requires teacher probabilities</em></div>
      <div className="l2-distillation-card"><small>OUTPUT / TRAJECTORY</small><h3>Train on selected teacher behavior</h3><Flow items={["Prompts", "Teacher traces", "Verify", "SFT student"]} /><em>Black-box outputs can be sufficient</em></div>
    </div>, <><a href="https://arxiv.org/abs/1503.02531">Hinton et al.</a> · <a href="https://arxiv.org/abs/2501.12948">DeepSeek-R1</a> · <a href="https://arxiv.org/abs/2505.09388">Qwen3</a></>)}
    {slide("Twenty traces teach reasoning behavior", "SFT on reasoning traces: what 20 examples showed", <div className="l2-reasoning-study">
      <div className="l2-reasoning-pipeline" aria-label="QwQ-32B-Preview creates twenty reasoning traces. The traces supply supervised fine-tuning data for Qwen2.5-32B, producing a reasoning student.">
        <div className="l2-pipe-box l2-pipe-base"><small>BASE MODEL</small><strong>Qwen2.5-32B</strong></div>
        <i className="l2-pipe-arrow l2-pipe-arrow-base" aria-hidden="true">→</i>
        <div className="l2-pipe-box l2-pipe-sft"><small>TRAIN</small><strong>Supervised fine-tuning</strong></div>
        <i className="l2-pipe-arrow l2-pipe-arrow-student" aria-hidden="true">→</i>
        <div className="l2-pipe-box l2-pipe-student"><small>STUDENT</small><strong>Qwen2.5-32B</strong><span>Long reasoning behavior</span></div>
        <div className="l2-pipe-feed" aria-hidden="true"><span>↑</span><small>TRAINING DATA ENTERS SFT</small></div>
        <div className="l2-pipe-box l2-pipe-teacher"><small>TEACHER</small><strong>QwQ-32B-Preview</strong><span>solves 20 problems</span></div>
        <i className="l2-pipe-arrow l2-pipe-arrow-data" aria-hidden="true">→</i>
        <div className="l2-pipe-box l2-pipe-traces"><small>TRAINING DATA</small><strong>20 long reasoning traces</strong></div>
      </div>
      <div className="l2-study-comparison"><div><small>32B STUDENT</small><strong>Reasoning-tuned Qwen2.5</strong></div><b>OUTPERFORMED</b><div><small>72B BASELINE</small><strong>Qwen2.5-Math-72B-Instruct</strong></div></div>
    </div>, <><a href="https://arxiv.org/abs/2507.09850">Du et al. · 2025</a> · <a href="https://developer.nvidia.com/blog/?p=103512">NVIDIA NeMo SFT recipe</a></>)}
    {slide("GRPO and trace distillation", "GRPO and trace distillation are different training loops", original(".grpo-distill-compare"), <><a href="https://arxiv.org/abs/2402.03300">DeepSeekMath · GRPO</a> · <a href="https://research.nvidia.com/labs/adlr/Synergy/">NVIDIA · pretraining, SFT, and RL study</a></>)}
    {slide("Published claims and anti-distillation code", "Cross-lab output distillation: claim and implementation clue", original(".distillation-screenshots"), <><a href="https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks">Anthropic disclosure</a> · <a href="https://www.anthropic.com/news/position-open-weights-models">Dario Amodei post</a> · <a href="https://github.com/alex000kim/claude-code/blob/main/src/services/api/claude.ts#L301-L313">Claude Code source mirror</a></>)}
    {slide("Tabular data: tune trees first", "Case 1: tune trees before using a language model", <div className="l2-baseline-case">
      <div className="l2-case-flow"><div><small>INPUT</small><strong>Typed table row</strong><span>income · age · balance</span></div><i>→</i><div className="l2-specialist"><small>BASELINE</small><strong>CatBoost / XGBoost</strong><span>tuned on the same split</span></div><i>→</i><div><small>TARGET</small><strong>Risk score</strong><span>fixed numeric output</span></div></div>
      <div className="l2-paper-evidence"><div><strong>45</strong><b>datasets</b><span>Trees led on typical medium-sized tabular data</span></div><div><strong>176</strong><b>datasets · 19 algorithms</b><span>Light tree tuning often mattered more than model family</span></div></div>
      <div className="l2-case-takeaway"><b>First experiment</b><span>Make the LLM beat a tuned tree under the same metric and budget.</span></div>
    </div>, <><a href="https://proceedings.neurips.cc/paper_files/paper/2022/hash/0378c7692da36807bdec87ab043cdadc-Abstract-Datasets_and_Benchmarks.html">Grinsztajn et al. · NeurIPS 2022</a> · <a href="https://proceedings.neurips.cc/paper_files/paper/2023/hash/f06d5ebd4ff40b40dd97e30cee632123-Abstract-Datasets_and_Benchmarks.html">McElfresh et al. · NeurIPS 2023</a></>)}
    {slide("Time series: ablate the LLM", "Case 2: remove the LLM from a time-series forecaster", <div className="l2-baseline-case">
      <div className="l2-series-flow"><div><small>INPUT</small><svg viewBox="0 0 180 50" role="img" aria-label="Past electricity-load measurements"><polyline points="2,40 24,31 46,35 68,14 90,23 112,8 134,27 156,18 178,22" /></svg><span>past load values</span></div><i>→</i><div className="l2-removed-model"><small>ABLATION</small><strong>Remove the LLM</strong><span>patching + basic attention</span></div><i>→</i><div><small>OUTPUT</small><svg viewBox="0 0 180 50" role="img" aria-label="Forecast values"><polyline points="2,28 24,22 46,31 68,16 90,20 112,12 134,24 156,15 178,19" /></svg><span>next 96 values</span></div></div>
      <div className="l2-ablation-results"><div><strong>26/26</strong><span>Time-LLM</span></div><div><strong>22/26</strong><span>CALF</span></div><div><strong>19/26</strong><span>OneFitsAll</span></div><div className="l2-speed-result"><strong>up to 1,000×</strong><span>less train / inference time</span></div></div>
      <div className="l2-case-takeaway"><b>Ablation wins</b><span>13 datasets × 2 error metrics · simpler variants beat the LLM versions in most comparisons.</span></div>
    </div>, <a href="https://arxiv.org/abs/2406.16964">Tan et al. · NeurIPS 2024</a>)}
    {slide("Chess: use an engine to play", "Case 3: use a chess engine to play chess", <div className="l2-chess-decision">
      <div className="l2-chess-evidence"><small>LLM CHESS EVALUATION</small><div className="l2-chess-test"><span>50+ language models</span><i>→</i><span>chess harness</span><i>→</i><span>random legal agent</span></div><div className="l2-chess-stats"><div><strong>35</strong><span>models: 0% win / loss rate<br />vs the random agent</span></div><div><strong>≈758</strong><span>peak adjusted Elo<br />for best tested model</span></div></div></div>
      <div className="l2-task-choice"><small>CHOOSE BY REQUIREMENT</small><div><span>PLAY</span><strong>Chess engine + search</strong><p>legal moves · tactics · validation</p></div><div><span>EXPLAIN</span><strong>LLM + chess engine</strong><p>conversation · plans · teaching</p></div></div>
    </div>, <a href="https://arxiv.org/abs/2512.01992">Kolasani et al. · LLM CHESS · 2025</a>)}
    {slide("Teacher offline, tree online", "Case 4: use the teacher offline, deploy the tree", <div className="l2-deployment-case">
      <div className="l2-deployment-flow"><div><small>OFFLINE TEACHER</small><strong>TabICLv2</strong><span>produce soft targets</span></div><i>→</i><div><small>TRAINING DATA</small><strong>153 datasets</strong><span>original labels + teacher signal</span></div><i>→</i><div className="l2-specialist"><small>ONLINE STUDENT</small><strong>XGBoost</strong><span>serve without the teacher</span></div></div>
      <div className="l2-deployment-stats"><div><strong>0.882</strong><span>macro-mean AUC</span></div><div><strong>96.5%</strong><span>teacher AUC retained</span></div><div><strong>1.9 ms</strong><span>per example · CPU</span></div><div><strong>38–860×</strong><span>reported speedup range</span></div></div>
      <div className="l2-case-takeaway"><b>System boundary</b><span>A foundation model can create supervision without serving every request.</span></div>
    </div>, <a href="https://arxiv.org/abs/2605.18654">Tanna et al. · 2026 · reported paper protocol</a>)}
    {slide("What to remember", "What to remember", <Points items={["Origin · supervision · modality · role", "Sequence targets and task labels", "Snapshots · extraction · licenses · lineage", "Training signals and fixed-checkpoint inference", "Evaluation protocols and capability boundaries", "Verified selection of synthetic data", "Strong specialized baseline before an LLM"]} />)}
  </>;

  return <><Presentation lectureNumber={2} onExit={onExit} presentationRootRef={root} slideContent={slides} /><Lecture2DataLabs rootRef={root} /></>;
}
