"use client";

import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";

const trainingStages = ["Read prefix", "Predict", "Compare", "Update"] as const;

const articleTokens = [
  "Lake",
  "Sevan",
  "supports",
  "communities",
  "across",
  "Armenia",
  ".",
] as const;

const tokenExamples = [
  {
    targetIndex: 2,
    topPrediction: "connects",
    candidates: [
      { token: "connects", before: 0.31, after: 0.25 },
      { token: "supports", before: 0.18, after: 0.29 },
      { token: "contains", before: 0.12, after: 0.11 },
    ],
  },
  {
    targetIndex: 3,
    topPrediction: "tourism",
    candidates: [
      { token: "tourism", before: 0.33, after: 0.27 },
      { token: "communities", before: 0.21, after: 0.32 },
      { token: "wildlife", before: 0.15, after: 0.14 },
    ],
  },
  {
    targetIndex: 4,
    topPrediction: "near",
    candidates: [
      { token: "near", before: 0.29, after: 0.24 },
      { token: "across", before: 0.24, after: 0.34 },
      { token: "throughout", before: 0.17, after: 0.16 },
    ],
  },
] as const;

function NextTokenTrainingLab() {
  const frameCount = tokenExamples.length * trainingStages.length;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(() =>
    typeof window === "undefined"
      ? false
      : !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % frameCount);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [frameCount, playing]);

  const exampleIndex = Math.floor(frame / trainingStages.length);
  const stageIndex = frame % trainingStages.length;
  const example = tokenExamples[exampleIndex];
  const target = articleTokens[example.targetIndex];
  const targetCandidate = example.candidates.find((candidate) => candidate.token === target);
  const probabilityBefore = targetCandidate?.before ?? 0;
  const probabilityAfter = targetCandidate?.after ?? probabilityBefore;
  const visibleCandidates = stageIndex >= 1;
  const compared = stageIndex >= 2;
  const updated = stageIndex >= 3;

  const move = (direction: number) => {
    setPlaying(false);
    setFrame((current) => (current + direction + frameCount) % frameCount);
  };

  return (
    <div role="region" className="token-training-lab" aria-label="Interactive next-token training walkthrough">
      <header className="token-training-header">
        <div>
          <span>Training example</span>
          <strong>
            Target {exampleIndex + 1} of {tokenExamples.length}
          </strong>
        </div>
        <button type="button" onClick={() => setPlaying((current) => !current)}>
          {playing ? "Pause" : "Play"}
        </button>
      </header>

      <div className="token-article">
        <span>Source article</span>
        <p aria-label={`Lake Sevan supports communities across Armenia. Current target: ${target}.`}>
          {articleTokens.map((token, tokenIndex) => {
            const tokenState =
              tokenIndex < example.targetIndex
                ? "context"
                : tokenIndex === example.targetIndex
                  ? "target"
                  : "future";

            return (
              <span data-state={tokenState} key={`${token}-${tokenIndex}`}>
                {token}
              </span>
            );
          })}
        </p>
      </div>

      <div className="token-training-stages" aria-label="Training stages">
        {trainingStages.map((stage, index) => (
          <button
            aria-current={stageIndex === index ? "step" : undefined}
            className={stageIndex === index ? "active" : stageIndex > index ? "complete" : ""}
            key={stage}
            onClick={() => {
              setPlaying(false);
              setFrame(exampleIndex * trainingStages.length + index);
            }}
            type="button"
          >
            <span>{index + 1}</span>
            {stage}
          </button>
        ))}
      </div>

      <div className="token-training-work">
        <div className={`token-probabilities${visibleCandidates ? " visible" : ""}`}>
          <span>Model distribution</span>
          {example.candidates.map((candidate) => {
            const probability = updated ? candidate.after : candidate.before;
            const isTarget = candidate.token === target;

            return (
              <div className={isTarget && compared ? "target" : ""} key={candidate.token}>
                <p>
                  <strong>{candidate.token}</strong>
                  <small>{Math.round(probability * 100)}%</small>
                </p>
                <i aria-hidden="true">
                  <b style={{ width: `${probability * 100}%` }} />
                </i>
              </div>
            );
          })}
        </div>

        <div className="token-training-result" aria-live="polite">
          {stageIndex === 0 && (
            <>
              <span>Context</span>
              <strong>{articleTokens.slice(0, example.targetIndex).join(" ")}</strong>
              <p>The next article token is hidden from the model.</p>
            </>
          )}
          {stageIndex === 1 && (
            <>
              <span>Top prediction</span>
              <strong>{example.topPrediction}</strong>
              <p>The decoder assigns a probability to every vocabulary token.</p>
            </>
          )}
          {stageIndex === 2 && (
            <>
              <span>Compare with article</span>
              <strong>
                {example.topPrediction} <i>≠</i> {target}
              </strong>
              <p>
                The target probability is {Math.round(probabilityBefore * 100)}%, so the loss is
                −ln({probabilityBefore.toFixed(2)}) = {(-Math.log(probabilityBefore)).toFixed(2)}.
              </p>
            </>
          )}
          {stageIndex === 3 && (
            <>
              <span>After one illustrative update</span>
              <strong>
                p({target}): {Math.round(probabilityBefore * 100)}% → {Math.round(probabilityAfter * 100)}%
              </strong>
              <p>The gradient changes shared weights, then training advances to another position.</p>
            </>
          )}
        </div>
      </div>

      <footer className="token-training-footer">
        <p>
          The article supplies the target automatically. Probabilities are illustrative; a real
          optimizer update changes parameters shared across all positions.
        </p>
        <div>
          <button type="button" onClick={() => move(-1)} aria-label="Previous training step">
            ←
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next training step">
            →
          </button>
        </div>
      </footer>
    </div>
  );
}

const annotationLabels = [
  "Account access",
  "Delivery problem",
  "Billing",
  "Other / unclear",
] as const;

type AnnotationLabel = (typeof annotationLabels)[number];

const annotationTasks: readonly {
  id: string;
  text: string;
}[] = [
  {
    id: "ARM-SUPPORT-041",
    text: "I changed phones and now the verification code never arrives.",
  },
  {
    id: "ARM-SUPPORT-042",
    text: "The parcel arrived on time, but the display was cracked inside the box.",
  },
  {
    id: "ARM-SUPPORT-043",
    text: "I was charged twice for the same monthly subscription.",
  },
];

function LabelingLab() {
  const [taskIndex, setTaskIndex] = useState(0);
  const [selection, setSelection] = useState<AnnotationLabel | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [savedLabels, setSavedLabels] = useState<Array<AnnotationLabel | null>>(() =>
    annotationTasks.map(() => null),
  );

  const task = annotationTasks[taskIndex];
  const submittedCount = savedLabels.filter(Boolean).length;

  const submit = () => {
    if (!selection) return;
    setSavedLabels((current) =>
      current.map((label, index) => (index === taskIndex ? selection : label)),
    );
    setSubmitted(true);
  };

  const nextTask = () => {
    const nextIndex = (taskIndex + 1) % annotationTasks.length;
    setTaskIndex(nextIndex);
    setSelection(savedLabels[nextIndex]);
    setSubmitted(false);
  };

  return (
    <div role="region" className="labeling-lab labeling-lab-labeler" aria-label="Interactive labeler view">
      <div className="labeling-record">
        <div className="labeling-record-meta">
          <span>{task.id}</span>
          <span>
            Record {taskIndex + 1} of {annotationTasks.length} · {submittedCount} saved
          </span>
        </div>
        <p className="labeling-prompt">Choose the single label that best describes the primary problem.</p>
        <blockquote>{task.text}</blockquote>
        <fieldset>
          <legend>Apply one label</legend>
          <div className="labeling-options" role="radiogroup" aria-label="Available labels">
            {annotationLabels.map((label) => (
              <button
                aria-checked={selection === label}
                className={selection === label ? "selected" : ""}
                key={label}
                onClick={() => {
                  setSelection(label);
                  setSubmitted(false);
                }}
                role="radio"
                type="button"
              >
                <span aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="labeling-actions">
          <button disabled={!selection} onClick={submit} type="button">
            Save label
          </button>
          <button onClick={() => setSelection("Other / unclear")} type="button">
            Mark unclear
          </button>
        </div>
      </div>

      <div className={`labeling-saved${submitted ? " visible" : ""}`} aria-live="polite">
        {submitted && selection ? (
          <>
            <p><span>Saved</span><strong>{selection}</strong></p>
            <button type="button" onClick={nextTask}>
              {taskIndex === annotationTasks.length - 1 ? "Return to first record" : "Next record"} →
            </button>
          </>
        ) : <p>Your choice remains private until it is saved.</p>}
      </div>
    </div>
  );
}

const synthesisStages = {
  math: [
    {
      label: "Seed",
      title: "Start from a real problem",
      copy: "A human-written item supplies the structure that the generator will vary.",
    },
    {
      label: "Generate",
      title: "Create a related question",
      copy: "The context and numbers change while the underlying multiplication skill stays recognizable.",
    },
    {
      label: "Screen",
      title: "Reject weak or contaminated items",
      copy: "Deterministic checks and similarity filters decide whether the new question may continue.",
    },
    {
      label: "Sample",
      title: "Ask for 32 independent solutions",
      copy: "Agreement among sampled answers becomes a proxy label when the generated question has no answer key.",
    },
    {
      label: "Retain",
      title: "Write one verified SFT record",
      copy: "Only solutions matching the selected answer are kept with the generated prompt.",
    },
  ],
  code: [
    {
      label: "Prompt",
      title: "Specify behavior, not an answer",
      copy: "The task asks for an implementation whose correctness can be checked externally.",
    },
    {
      label: "Draft",
      title: "Sample a candidate program",
      copy: "The first model response is plausible-looking but reverses the parity test.",
    },
    {
      label: "Execute",
      title: "Let the test expose the failure",
      copy: "An executable verifier supplies evidence that another language model cannot manufacture by agreement.",
    },
    {
      label: "Repair",
      title: "Condition the revision on feedback",
      copy: "The failed assertion becomes context for a second attempt with a one-token correction.",
    },
    {
      label: "Retain",
      title: "Store the accepted trajectory",
      copy: "The prompt, passing answer, and verifier result become a supervised training record.",
    },
  ],
} as const;

type SynthesisKind = keyof typeof synthesisStages;

function MathSynthesisFrame({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <div className="synthesis-record-frame synthesis-seed-frame">
        <span className="synthesis-record-id">MATH-SEED / 000184</span>
        <p>
          Three boxes hold <mark>8</mark> apricots each. How many apricots are there?
        </p>
        <code>skill: multiplication · answer: 24</code>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className="synthesis-rewrite-frame">
        <div>
          <span>Seed</span>
          <p>
            Three <del>boxes</del> hold <del>8 apricots</del> each.
          </p>
        </div>
        <i aria-hidden="true">→</i>
        <div>
          <span>Generated variant</span>
          <p>
            Five <ins>trays</ins> hold <ins>7 pastries</ins> each.
          </p>
        </div>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="synthesis-gates" aria-label="Three screening checks">
        <div className="pass">
          <span>Syntax</span>
          <strong>well formed</strong>
          <i aria-hidden="true" />
        </div>
        <div className="pass">
          <span>Answerability</span>
          <strong>solver agrees</strong>
          <i aria-hidden="true" />
        </div>
        <div className="pass">
          <span>Test-set distance</span>
          <strong>below threshold</strong>
          <i aria-hidden="true" />
        </div>
        <p>All gates passed · send to solution sampling</p>
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="synthesis-vote-frame">
        <div className="synthesis-votes" aria-label="Thirty-two sampled answers">
          {Array.from({ length: 32 }, (_, index) => (
            <i
              className={index < 27 ? "winner" : index < 30 ? "minority-a" : "minority-b"}
              key={index}
              style={{ animationDelay: `${index * 26}ms` }}
            />
          ))}
        </div>
        <div className="synthesis-tally">
          <span>Majority vote</span>
          <strong>27 / 32 → 35</strong>
          <p>5 × 7 = 35, so there are <b>35</b> pastries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="synthesis-json-frame">
      <span>accepted / train-000184.jsonl</span>
      <pre>
        <code>{`{
  "prompt": "Five trays hold 7 pastries each…",
  "response": "5 × 7 = 35, so there are \\boxed{35} pastries.",
  "verifier": { "vote": "35", "support": 27 },
  "split": "train"
}`}</code>
      </pre>
    </div>
  );
}

function CodeRepairFrame({ stage }: { stage: number }) {
  if (stage === 0) {
    return (
      <div className="repair-prompt-frame">
        <span>USER / coding task</span>
        <p>Implement <code>is_even(n)</code>. Return a Boolean for any integer.</p>
        <small>Verifier available: unit tests</small>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className="repair-code-frame">
        <span>candidate.py</span>
        <pre><code>{`def is_even(n: int) -> bool:
    return n % 2 == 1`}</code></pre>
        <p><i aria-hidden="true" /> candidate sampled · not yet trusted</p>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="repair-test-frame">
        <span>$ pytest -q</span>
        <pre><code>{`assert is_even(2) is True
E  assert False is True

1 failed, 3 passed in 0.04s`}</code></pre>
        <strong>FAIL</strong>
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="repair-diff-frame">
        <span>revision.diff</span>
        <code><del>- return n % 2 == 1</del></code>
        <code><ins>+ return n % 2 == 0</ins></code>
        <p>Failure feedback changes one token and the program’s behavior.</p>
      </div>
    );
  }

  return (
    <div className="repair-pass-frame">
      <div className="repair-pass-mark" aria-hidden="true">✓</div>
      <div>
        <span>VERIFIER / accepted</span>
        <strong>4 passed in 0.04s</strong>
        <p>Prompt + repaired answer + test outcome → training record</p>
      </div>
    </div>
  );
}

function SyntheticPipelineLab() {
  const [kind, setKind] = useState<SynthesisKind>("math");
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(() =>
    typeof window === "undefined"
      ? false
      : !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const stages = synthesisStages[kind];

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setStage((current) => (current + 1) % stages.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [playing, stages.length]);

  const chooseKind = (nextKind: SynthesisKind) => {
    setKind(nextKind);
    setStage(0);
  };

  const current = stages[stage];
  const progress = (stage / (stages.length - 1)) * 100;

  return (
    <div role="region" className="synthesis-lab" aria-label="Interactive synthetic-data production pipelines">
      <header className="synthesis-lab-header">
        <div className="synthesis-tabs" role="tablist" aria-label="Choose a pipeline">
          <button
            aria-selected={kind === "math"}
            onClick={() => chooseKind("math")}
            role="tab"
            type="button"
          >
            <span>01</span> Math synthesis
          </button>
          <button
            aria-selected={kind === "code"}
            onClick={() => chooseKind("code")}
            role="tab"
            type="button"
          >
            <span>02</span> Code repair
          </button>
        </div>
        <button className="synthesis-play" onClick={() => setPlaying((value) => !value)} type="button">
          <i className={playing ? "pause" : "play"} aria-hidden="true" />
          {playing ? "Pause" : "Replay"}
        </button>
      </header>

      <div className="synthesis-rail" style={{ "--synthesis-progress": `${progress}%` } as CSSProperties}>
        <i aria-hidden="true" />
        {stages.map((item, index) => (
          <button
            aria-current={stage === index ? "step" : undefined}
            className={index < stage ? "complete" : stage === index ? "active" : ""}
            key={item.label}
            onClick={() => {
              setStage(index);
              setPlaying(false);
            }}
            type="button"
          >
            <span>{index + 1}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="synthesis-workspace" key={`${kind}-${stage}`}>
        <div className="synthesis-stage-copy">
          <span>Stage {stage + 1} / {stages.length}</span>
          <h4>{current.title}</h4>
          <p>{current.copy}</p>
        </div>
        <div className="synthesis-visual">
          {kind === "math" ? <MathSynthesisFrame stage={stage} /> : <CodeRepairFrame stage={stage} />}
        </div>
      </div>

      <footer className="synthesis-lab-footer">
        <p>
          Generation proposes records; the checker decides what earns the right to train the model.
        </p>
        <div>
          <button
            aria-label="Previous synthesis stage"
            onClick={() => {
              setPlaying(false);
              setStage((currentStage) => (currentStage - 1 + stages.length) % stages.length);
            }}
            type="button"
          >←</button>
          <button
            aria-label="Next synthesis stage"
            onClick={() => {
              setPlaying(false);
              setStage((currentStage) => (currentStage + 1) % stages.length);
            }}
            type="button"
          >→</button>
        </div>
      </footer>
    </div>
  );
}

type BenchmarkChallenge = {
  id: string;
  name: string;
  group: "Static" | "Public system";
  version: string;
  prompt: string;
  promptNote: string;
  sourceUrl: string;
  sourceLabel: string;
  grader: string;
  mode: "choice" | "text" | "code";
  options?: readonly string[];
  accepted?: readonly string[];
  requiredFragments?: readonly string[];
  reference: string;
  explanation: string;
  compareOnly?: boolean;
};

const benchmarkChallenges: readonly BenchmarkChallenge[] = [
  {
    id: "mmlu",
    name: "MMLU",
    group: "Static",
    version: "elementary_mathematics / test row 0",
    prompt: "What is the value of p in 24 = 2p?",
    promptNote: "Exact public item text; choices are part of the record. A full MMLU run may add subject-specific demonstrations.",
    sourceUrl: "https://huggingface.co/datasets/cais/mmlu",
    sourceLabel: "MMLU record",
    grader: "Exact answer-choice match",
    mode: "choice",
    options: ["A · p = 4", "B · p = 8", "C · p = 12", "D · p = 24"],
    accepted: ["c", "p=12", "p = 12", "12"],
    reference: "C · p = 12",
    explanation: "Dividing both sides of 24 = 2p by 2 gives p = 12.",
  },
  {
    id: "gsm8k",
    name: "GSM8K",
    group: "Static",
    version: "official test.jsonl / row 1",
    prompt: "A robe takes 2 bolts of blue fiber and half that much white fiber. How many bolts in total does it take?",
    promptNote: "Exact question field from the public record. The dataset stores a worked rationale and a final answer after ####.",
    sourceUrl: "https://github.com/openai/grade-school-math/blob/master/grade_school_math/data/test.jsonl",
    sourceLabel: "GSM8K test data",
    grader: "Extract and exactly match the final number",
    mode: "text",
    accepted: ["3", "3 bolts", "3 bolts of fabric"],
    reference: "3",
    explanation: "White fiber is half of 2, or 1 bolt; 2 + 1 = 3.",
  },
  {
    id: "math",
    name: "MATH",
    group: "Static",
    version: "algebra / test row 4",
    prompt: "If 2⁸ = 4ˣ, what is the value of x?",
    promptNote: "Exact mathematical content from the public test record, typeset with Unicode here rather than TeX markup.",
    sourceUrl: "https://huggingface.co/datasets/EleutherAI/hendrycks_math",
    sourceLabel: "MATH test data",
    grader: "Extract the boxed final answer",
    mode: "text",
    accepted: ["4", "x=4", "x = 4"],
    reference: "x = 4",
    explanation: "Because 4ˣ = (2²)ˣ = 2²ˣ, equality with 2⁸ requires 2x = 8.",
  },
  {
    id: "humaneval",
    name: "HumanEval",
    group: "Static",
    version: "HumanEval/2",
    prompt: `def truncate_number(number: float) -> float:
    """Given a positive floating point number, return its decimal part.
    >>> truncate_number(3.5)
    0.5
    """`,
    promptNote: "The public function signature and task are shown in executable-prompt form; submit only the function body.",
    sourceUrl: "https://github.com/openai/human-eval/blob/master/data/HumanEval.jsonl.gz",
    sourceLabel: "HumanEval data",
    grader: "Run hidden unit tests in a sandbox",
    mode: "code",
    requiredFragments: ["number", "%", "1"],
    reference: "return number % 1.0",
    explanation: "The remainder after division by 1 is the fractional part for a positive number.",
  },
  {
    id: "gpqa",
    name: "GPQA Diamond",
    group: "Public system",
    version: "diamond / zero-shot / seed 0",
    prompt: `What is the correct answer to this question: Which of the following physical theories never requires regularization at high energies?

Choices:
(A) Quantum Chromodynamics
(B) Classical Electrodynamics
(C) Quantum Electrodynamics
(D) Superstring Theory

Format your response as follows: "The correct answer is (insert answer here)"`,
    promptNote: "Exact public item inserted into GPQA’s official zero-shot template; seed 0 fixes this option order.",
    sourceUrl: "https://github.com/idavidrein/gpqa",
    sourceLabel: "GPQA data and prompt code",
    grader: "Parse one answer letter",
    mode: "choice",
    options: ["A · Quantum Chromodynamics", "B · Classical Electrodynamics", "C · Quantum Electrodynamics", "D · Superstring Theory"],
    accepted: ["d", "superstring theory", "the correct answer is (d)"],
    reference: "D · Superstring Theory",
    explanation: "This is the dataset’s reference answer; the challenge is domain knowledge plus strict output formatting.",
  },
  {
    id: "livebench",
    name: "LiveBench",
    group: "Public system",
    version: "2024-11-25 / spatial",
    prompt: "Suppose I have a physical, solid square with vertices ABCD, and I make two cuts through AC and BD. How many pieces are there after the cuts? Think step by step, and then put your answer in bold as a single integer. If you don't know, guess.",
    promptNote: "Public, date-stamped task text; the original markdown bolding instruction is rendered as plain text in this lab.",
    sourceUrl: "https://huggingface.co/datasets/livebench/reasoning",
    sourceLabel: "LiveBench reasoning data",
    grader: "Extract one bold integer",
    mode: "text",
    accepted: ["4", "**4**"],
    reference: "**4**",
    explanation: "The two diagonals intersect inside the square and divide it into four triangular pieces.",
  },
  {
    id: "swebench",
    name: "SWE-bench",
    group: "Public system",
    version: "Lite / pallets__flask-4045",
    prompt: "Raise error when blueprint name contains a dot. This is required since every dot is now significant since blueprints can be nested. An error was already added for endpoint names in 1.0, but should have been added for this as well.",
    promptNote: "Exact public issue statement. A real run also supplies the pinned Flask repository and its tools to the agent.",
    sourceUrl: "https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite",
    sourceLabel: "SWE-bench Lite record",
    grader: "Apply the patch, then run fail-to-pass and regression tests",
    mode: "code",
    requiredFragments: ["if", ".", "name", "raise", "valueerror"],
    reference: `if "." in name:
    raise ValueError("'name' may not contain a dot '.' character.")`,
    explanation: "The reference patch validates the blueprint name during construction and raises ValueError.",
    compareOnly: true,
  },
  {
    id: "terminalbench",
    name: "Terminal-Bench 2.0",
    group: "Public system",
    version: "count-dataset-tokens",
    prompt: "Tell me how many deepseek tokens are there in the science domain of the ryanmarten/OpenThoughts-1k-sample dataset on Hugging Face. Use the Qwen2.5-1.5B-Instruct tokenizer and write the integer to /app/answer.txt.",
    promptNote: "Condensed display of the public task instruction; the real agent receives a container, README hint, file target, and exact success criteria.",
    sourceUrl: "https://github.com/harbor-framework/terminal-bench-2/tree/main/count-dataset-tokens",
    sourceLabel: "Terminal-Bench task",
    grader: "Inspect /app/answer.txt after the agent exits",
    mode: "text",
    accepted: ["79586"],
    reference: "79586",
    explanation: "The reference solution filters chemistry, biology, and physics records, then sums tokenizer counts for reasoning and solution fields.",
  },
  {
    id: "bfcl",
    name: "BFCL V4",
    group: "Public system",
    version: "simple_python_0",
    prompt: `Available function:
calculate_triangle_area(base: integer, height: integer, unit?: string)

User: Find the area of a triangle with a base of 10 units and height of 5 units.`,
    promptNote: "Exact user query with the public function schema reduced to its signature for readability.",
    sourceUrl: "https://github.com/ShishirPatil/gorilla/blob/main/berkeley-function-call-leaderboard/bfcl_eval/data/BFCL_v4_simple_python.json",
    sourceLabel: "BFCL V4 record",
    grader: "Parse the call and compare its abstract syntax tree",
    mode: "code",
    requiredFragments: ["calculate_triangle_area", "base", "10", "height", "5"],
    reference: "calculate_triangle_area(base=10, height=5)",
    explanation: "The benchmark grades selection of the supplied tool and its arguments, not the numeric area written as prose.",
  },
] as const;

const normalizeBenchmarkAnswer = (value: string) =>
  value.toLowerCase().trim().replace(/[\s"'`*_()]+/g, "").replace(/[.,;:]+$/g, "");

function BenchmarkChallengeLab() {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const challenge = benchmarkChallenges[challengeIndex];

  const selectChallenge = (index: number) => {
    setChallengeIndex(index);
    setAnswer("");
    setRevealed(false);
  };

  const normalized = normalizeBenchmarkAnswer(answer);
  const matchesAccepted = challenge.accepted?.some(
    (candidate) => normalizeBenchmarkAnswer(candidate) === normalized,
  );
  const matchesFragments = challenge.requiredFragments?.every((fragment) =>
    answer.toLowerCase().includes(fragment.toLowerCase()),
  );
  const matches = Boolean(matchesAccepted || matchesFragments);

  return (
    <div role="region" className="benchmark-lab" aria-label="Interactive public benchmark demonstrations">
      <header className="benchmark-lab-header">
        <div>
          <span>Public benchmark sampler</span>
          <strong>Try the task before seeing the reference</strong>
        </div>
        <p>{challengeIndex + 1} / {benchmarkChallenges.length}</p>
      </header>

      <nav className="benchmark-picker" aria-label="Choose a benchmark challenge">
        {benchmarkChallenges.map((item, index) => (
          <button
            aria-current={index === challengeIndex ? "page" : undefined}
            className={index === challengeIndex ? "active" : ""}
            key={item.id}
            onClick={() => selectChallenge(index)}
            type="button"
          >
            <span>{item.group}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="benchmark-lab-body">
        <aside className="benchmark-protocol">
          <span>Protocol card</span>
          <dl>
            <div><dt>Version</dt><dd>{challenge.version}</dd></div>
            <div><dt>Grader</dt><dd>{challenge.grader}</dd></div>
            <div><dt>Runs here</dt><dd>Browser only</dd></div>
          </dl>
          <a href={challenge.sourceUrl} target="_blank" rel="noreferrer">{challenge.sourceLabel} ↗</a>
        </aside>

        <div className="benchmark-console">
          <div className="benchmark-console-bar">
            <span>{challenge.name}</span>
            <code>{challenge.id}.prompt</code>
          </div>
          <pre className="benchmark-prompt"><code>{challenge.prompt}</code></pre>
          <p className="benchmark-prompt-note">{challenge.promptNote}</p>

          <div className="benchmark-response">
            <label htmlFor={`benchmark-answer-${challenge.id}`}>Your answer</label>
            {challenge.mode === "choice" && challenge.options ? (
              <div className="benchmark-choices" role="radiogroup" aria-label="Answer choices">
                {challenge.options.map((option) => {
                  const letter = option.slice(0, 1);
                  return (
                    <button
                      aria-checked={answer === letter}
                      className={answer === letter ? "selected" : ""}
                      key={option}
                      onClick={() => {
                        setAnswer(letter);
                        setRevealed(false);
                      }}
                      role="radio"
                      type="button"
                    >{option}</button>
                  );
                })}
              </div>
            ) : (
              <textarea
                id={`benchmark-answer-${challenge.id}`}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setRevealed(false);
                }}
                placeholder={challenge.mode === "code" ? "Write the completion, patch, or tool call…" : "Enter your answer…"}
                rows={challenge.mode === "code" ? 5 : 3}
                spellCheck={false}
                value={answer}
              />
            )}

            <div className="benchmark-response-actions">
              <button disabled={!answer.trim()} onClick={() => setRevealed(true)} type="button">
                Submit and reveal
              </button>
              <button
                onClick={() => {
                  setAnswer("");
                  setRevealed(false);
                }}
                type="button"
              >Reset</button>
            </div>
          </div>

          <div className={`benchmark-reference${revealed ? " visible" : ""}`} aria-live="polite">
            {revealed ? (
              <>
                <div>
                  <span>{challenge.compareOnly ? "Reference patch" : matches ? "Matches reference" : "Reference answer"}</span>
                  <pre><code>{challenge.reference}</code></pre>
                </div>
                <p>{challenge.explanation}</p>
                {challenge.compareOnly && <small>A browser text comparison cannot replace the repository test harness.</small>}
              </>
            ) : (
              <p>The reference remains sealed until you submit a response.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="benchmark-lab-footer">
        These are exposed teaching records. Do not reuse them as held-out evidence for a model score.
      </footer>
    </div>
  );
}

export function Lecture2DataLabs({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const [nextTokenTarget, setNextTokenTarget] = useState<Element | null>(null);
  const [labelingTarget, setLabelingTarget] = useState<Element | null>(null);
  const [synthesisTarget, setSynthesisTarget] = useState<Element | null>(null);
  const [benchmarkTarget, setBenchmarkTarget] = useState<Element | null>(null);

  useEffect(() => {
    let frame: number | undefined;
    let observer: MutationObserver | undefined;

    const connect = () => {
      const root = rootRef.current;

      if (!root) {
        frame = window.requestAnimationFrame(connect);
        return;
      }

      const syncTargets = () => {
        const nextToken = root.querySelector("[data-next-token-lab]");
        const labeling = root.querySelector("[data-labeling-lab]");
        const synthesis = root.querySelector("[data-synthetic-pipelines]");
        const benchmark = root.querySelector("[data-benchmark-lab]");

        setNextTokenTarget((current) => (current === nextToken ? current : nextToken));
        setLabelingTarget((current) => (current === labeling ? current : labeling));
        setSynthesisTarget((current) => (current === synthesis ? current : synthesis));
        setBenchmarkTarget((current) => (current === benchmark ? current : benchmark));
      };

      syncTargets();
      observer = new MutationObserver(syncTargets);
      observer.observe(root, { childList: true, subtree: true });
    };

    connect();

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [rootRef]);

  return (
    <>
      {nextTokenTarget && createPortal(<NextTokenTrainingLab />, nextTokenTarget)}
      {labelingTarget && createPortal(<LabelingLab />, labelingTarget)}
      {synthesisTarget && createPortal(<SyntheticPipelineLab />, synthesisTarget)}
      {benchmarkTarget && createPortal(<BenchmarkChallengeLab />, benchmarkTarget)}
    </>
  );
}
