"use client";

import { useState } from "react";

type DecisionOption = {
  label: string;
  feedback: string;
};

type LectureLab = {
  title: string;
  prompt: string;
  options: readonly DecisionOption[];
  bestOption: number;
  artifact: string;
};

const lectureLabs: Record<number, LectureLab> = {
  2: {
    title: "Choose the test that earns the first training run",
    prompt:
      "A new decoder-only implementation trains without crashing, but its generated Armenian text is incoherent. Which test has the highest diagnostic value before using more GPUs?",
    bestOption: 0,
    options: [
      {
        label: "Overfit one tiny packed batch and compare cached with full-sequence logits",
        feedback:
          "This jointly probes target shifting, the causal mask, optimization, and incremental generation. Failure localizes an implementation error before scale hides it.",
      },
      {
        label: "Increase the learning rate until the loss moves faster",
        feedback:
          "A larger update may move the loss while preserving a masking, target-shift, or cache bug—and can add instability of its own.",
      },
      {
        label: "Train on ten times more tokens",
        feedback:
          "Scale is not a correctness test. An incorrect implementation can consume more data while remaining incorrect.",
      },
    ],
    artifact: "A tested minimal Transformer with a tiny-data overfit and cache-equivalence report.",
  },
  3: {
    title: "Admit a source—or quarantine it",
    prompt:
      "A large Armenian news crawl has excellent language quality, but its terms do not grant redistribution or model-training rights. What belongs in corpus version 1?",
    bestOption: 2,
    options: [
      {
        label: "Use it because the pages are publicly accessible",
        feedback:
          "Public accessibility is not a license. This choice creates release and deletion risk that a quality score cannot resolve.",
      },
      {
        label: "Use it but remove source URLs from the manifest",
        feedback:
          "Removing provenance makes later rights review and deletion harder; it does not change the underlying rights.",
      },
      {
        label: "Quarantine it pending permission and train on cleared sources",
        feedback:
          "The source remains measurable without silently entering training. A later permission decision can promote a versioned snapshot.",
      },
    ],
    artifact: "A source registry with rights, provenance, retention, and deletion fields.",
  },
  4: {
    title: "Find the language your filter deletes",
    prompt:
      "A quality classifier keeps 82% of Eastern Armenian documents but only 39% of a reviewed Western Armenian slice. Aggregate precision is high. What should the team do?",
    bestOption: 1,
    options: [
      {
        label: "Keep the global threshold because aggregate precision is high",
        feedback:
          "The aggregate hides a severe coverage failure. It would encode the classifier's dialect preference into the model distribution.",
      },
      {
        label: "Audit features and calibrate by documented language variety",
        feedback:
          "Slice-specific error analysis can reveal script, orthography, or source artifacts and supports an explicit retention policy.",
      },
      {
        label: "Remove the Western Armenian slice from evaluation",
        feedback:
          "Deleting the measurement hides the failure while leaving the training distribution unchanged.",
      },
    ],
    artifact: "A filter report with reviewed positive and negative slices by source and Armenian variety.",
  },
  5: {
    title: "Decontaminate beyond exact matches",
    prompt:
      "No exact ArmBench question appears in the corpus, but many training documents contain translated questions with the same answer choices. What is the defensible conclusion?",
    bestOption: 2,
    options: [
      {
        label: "The benchmark is clean because hashes do not match",
        feedback:
          "Exact hashes miss translations, formatting changes, extracted answer keys, and near-duplicate question families.",
      },
      {
        label: "Drop every document containing any benchmark word",
        feedback:
          "This has extreme false positives and can remove the legitimate knowledge required to answer the benchmark.",
      },
      {
        label: "Run exact, substring, MinHash, and inspected semantic checks",
        feedback:
          "Layered checks expose different leakage modes. The report should include thresholds, reviewed matches, and residual uncertainty.",
      },
    ],
    artifact: "A versioned duplicate graph and benchmark-contamination report.",
  },
  6: {
    title: "Choose a mixture with evidence, not appetite",
    prompt:
      "The team has 2.4B candidate Armenian tokens and a 20B-token training budget. Which mixture decision is scientifically strongest?",
    bestOption: 0,
    options: [
      {
        label: "Compare several mixtures on proxy models at fixed compute",
        feedback:
          "Proxy runs can measure transfer, repetition, and interference before the expensive run. The winning mixture is selected by target and retention metrics.",
      },
      {
        label: "Repeat Armenian data until it fills the entire budget",
        feedback:
          "Repetition may help at first, but uncontrolled epochs increase memorization and narrow coverage. The useful repetition rate is an empirical question.",
      },
      {
        label: "Match the language proportions found on the web",
        feedback:
          "Web prevalence reflects availability, not the course objective. It would leave a low-resource target language nearly invisible.",
      },
    ],
    artifact: "A compute-matched mixture sweep and a precommitted selection rule.",
  },
  7: {
    title: "Treat tokenizer fertility as a resource cost",
    prompt:
      "The inherited tokenizer uses 2.3 times as many tokens for Armenian as for comparable English sentences. What should happen before the main run?",
    bestOption: 1,
    options: [
      {
        label: "Accept it because byte fallback prevents unknown tokens",
        feedback:
          "Coverage prevents failure, but poor fertility still shortens effective context and spends more training and inference compute per sentence.",
      },
      {
        label: "Compare tokenizer adaptation against embedding transfer costs",
        feedback:
          "A cohort model trained from scratch can choose a better joint vocabulary. Continued pretraining must weigh fertility gains against changed embeddings and compatibility.",
      },
      {
        label: "Transliterate Armenian into Latin characters",
        feedback:
          "Transliteration changes the user task, loses orthographic information, and does not establish that the resulting segmentation is better.",
      },
    ],
    artifact: "A tokenizer report covering fertility, byte fallback, scripts, varieties, and context efficiency.",
  },
  8: {
    title: "Prove that a checkpoint can resume",
    prompt:
      "After a preemption, training resumes with a sudden loss jump even though model weights were restored. Which missing state is the first suspect?",
    bestOption: 0,
    options: [
      {
        label: "Optimizer, scheduler, sampler, and random-number states",
        feedback:
          "A resumable checkpoint is a state transition, not only a weight file. These states determine the next update and data sequence.",
      },
      {
        label: "The final model-card wording",
        feedback:
          "Documentation matters, but it does not determine the numerical update immediately after resumption.",
      },
      {
        label: "The benchmark prompt template",
        feedback:
          "Evaluation prompts cannot explain a discontinuity in training loss.",
      },
    ],
    artifact: "A fault-injection run that resumes from a manifest and reproduces the uninterrupted loss curve.",
  },
  9: {
    title: "Freeze the protocol before comparing checkpoints",
    prompt:
      "The new checkpoint wins on Armenian multiple choice only after its prompt is translated differently. Can the team report a model improvement?",
    bestOption: 2,
    options: [
      {
        label: "Yes—the final user experience is better",
        feedback:
          "That may be a product improvement, but the experiment changed both model and prompt. It cannot attribute the gain to the checkpoint.",
      },
      {
        label: "Yes—if the average score is higher",
        feedback:
          "An aggregate score does not remove the protocol confounder or show whether the change is statistically stable.",
      },
      {
        label: "No—run both checkpoints under both prompt versions",
        feedback:
          "A small factorial comparison separates checkpoint, prompt, and interaction effects while preserving the useful prompt discovery.",
      },
    ],
    artifact: "An immutable evaluation manifest with prompts, decoding, graders, costs, and confidence intervals.",
  },
  10: {
    title: "Separate knowledge adaptation from instruction behavior",
    prompt:
      "Continued pretraining lowers Armenian validation loss but makes the model worse at following bilingual instructions. Which experiment best identifies the repair?",
    bestOption: 1,
    options: [
      {
        label: "Continue pretraining for more steps",
        feedback:
          "This may deepen the same behavior regression. Lower language-model loss does not imply instruction retention.",
      },
      {
        label: "Compare CPT, SFT, and CPT→SFT from one base checkpoint",
        feedback:
          "The factorial sequence distinguishes domain adaptation from behavior shaping and measures whether SFT restores instruction following.",
      },
      {
        label: "Evaluate only Armenian perplexity",
        feedback:
          "Perplexity measures the adapted distribution but cannot reveal instruction-format regressions.",
      },
    ],
    artifact: "A staged CPT/SFT experiment with retention and target-language slices.",
  },
  11: {
    title: "Remove length from the preference shortcut",
    prompt:
      "Annotators choose the longer Armenian response 74% of the time, and the reward model strongly correlates with output length. What should happen next?",
    bestOption: 0,
    options: [
      {
        label: "Create length-controlled pairs and inspect agreement by criterion",
        feedback:
          "This tests whether the model learned response quality or a presentation shortcut and improves the preference protocol itself.",
      },
      {
        label: "Train longer so the reward model learns the exception",
        feedback:
          "More optimization reinforces the observed label correlation unless the data or objective changes.",
      },
      {
        label: "Cap every response at the same character count",
        feedback:
          "A hard cap suppresses one symptom but can truncate valid answers and does not repair ambiguous criteria.",
      },
    ],
    artifact: "A preference-data audit with agreement, position, length, language, and annotator slices.",
  },
  12: {
    title: "Charge reasoning for the attempts it uses",
    prompt:
      "Self-consistency raises math accuracy from 31% to 45% using sixteen sampled traces. Which comparison belongs in the report?",
    bestOption: 2,
    options: [
      {
        label: "45% versus the original model's 31% only",
        feedback:
          "This hides a sixteen-sample inference intervention and makes the improvement look like a checkpoint gain.",
      },
      {
        label: "45% versus a larger model at one sample only",
        feedback:
          "The result may be useful, but unmatched token and latency budgets prevent a clean efficiency comparison.",
      },
      {
        label: "A quality curve over samples, tokens, verifier calls, and latency",
        feedback:
          "The curve reveals marginal gains and allows comparisons at matched budgets rather than one favorable operating point.",
      },
    ],
    artifact: "A test-time compute curve with inspected trace and verifier disagreements.",
  },
  13: {
    title: "Detect a learned verifier exploit",
    prompt:
      "RLVR reward rises throughout training, but accuracy on hidden tests falls. Which diagnosis has priority?",
    bestOption: 1,
    options: [
      {
        label: "The policy needs a larger learning rate",
        feedback:
          "The policy is already optimizing the supplied reward. Faster optimization can intensify exploitation of the public verifier.",
      },
      {
        label: "The public reward is incomplete or exploitable",
        feedback:
          "Reward–correctness divergence is direct evidence that the environment contract does not capture the intended task.",
      },
      {
        label: "The hidden tests should be added to training immediately",
        feedback:
          "That removes the independent audit. First repair the task generator and verifier while preserving a private test set.",
      },
    ],
    artifact: "A versioned RLVR environment with public, private, and adversarial verifier suites.",
  },
  14: {
    title: "Audit what synthetic filtering removed",
    prompt:
      "A strict judge raises synthetic-answer precision from 81% to 96%, yet the trained model does not improve. What is the most informative audit?",
    bestOption: 0,
    options: [
      {
        label: "Measure retained task diversity, difficulty, and rejected-correct cases",
        feedback:
          "Selection may have produced a precise but narrow and easy distribution. These slices test the quality–coverage trade-off.",
      },
      {
        label: "Generate ten times more candidates with the same judge",
        feedback:
          "Volume can reproduce the same selection bias at greater cost without adding useful task families.",
      },
      {
        label: "Report 96% precision as the downstream result",
        feedback:
          "Filter precision describes the selected dataset, not whether training on it changes held-out capability.",
      },
    ],
    artifact: "A synthetic-data card with generator, verifier, novelty, diversity, and token-matched ablations.",
  },
  15: {
    title: "Put the student on a quality–cost frontier",
    prompt:
      "A distilled model is twice as fast per generated token but produces three times as many tokens and loses four accuracy points. Is it more efficient?",
    bestOption: 2,
    options: [
      {
        label: "Yes—per-token latency is the only serving cost",
        feedback:
          "Total latency and compute depend on output length, retries, and the required quality operating point.",
      },
      {
        label: "No—any quality loss invalidates distillation",
        feedback:
          "A smaller model may be preferable at some quality and cost constraints. The decision requires the full frontier.",
      },
      {
        label: "Not yet—compare end-to-end quality, tokens, latency, memory, and retries",
        feedback:
          "These quantities determine whether the student dominates at any practical operating point.",
      },
    ],
    artifact: "A teacher–student Pareto frontier under matched prompts and inference budgets.",
  },
  16: {
    title: "Apply a release gate when the average looks good",
    prompt:
      "The final model improves the average benchmark score but fails the predeclared memorization gate on rare Armenian passages. What is the release decision?",
    bestOption: 1,
    options: [
      {
        label: "Release because the aggregate capability gain is larger",
        feedback:
          "This turns a predeclared gate into a post-hoc preference and leaves the identified privacy or memorization risk unresolved.",
      },
      {
        label: "Hold release, trace the affected data, remediate, and rerun the gate",
        feedback:
          "Lineage makes the failure actionable. The gate remains meaningful because it controls the decision even when other metrics improve.",
      },
      {
        label: "Remove the failed metric from the public model card",
        feedback:
          "Suppressing a known failure undermines the release evidence and does not reduce the underlying risk.",
      },
    ],
    artifact: "A signed release decision with gates, failures, owners, remediation, and rollback instructions.",
  },
};

export function InteractiveLearning({ lectureNumber }: { lectureNumber: number }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const lab = lectureLabs[lectureNumber];

  if (!lab) return null;

  const result = selectedOption === null ? null : lab.options[selectedOption];
  const isBest = selectedOption === lab.bestOption;

  return (
    <section className="interactive-learning" aria-labelledby={`lab-${lectureNumber}`}>
      <p className="interactive-learning-kicker">
        Interactive checkpoint · shared Armenian model
      </p>
      <h2 id={`lab-${lectureNumber}`}>{lab.title}</h2>
      <p>{lab.prompt}</p>

      <div className="interactive-learning-options" role="group" aria-label="Choose a response">
        {lab.options.map((option, optionIndex) => (
          <button
            aria-pressed={selectedOption === optionIndex}
            className={selectedOption === optionIndex ? "selected" : ""}
            key={option.label}
            onClick={() => setSelectedOption(optionIndex)}
            type="button"
          >
            <span>{String.fromCharCode(65 + optionIndex)}</span>
            {option.label}
          </button>
        ))}
      </div>

      <div className="interactive-learning-result" aria-live="polite">
        {result ? (
          <>
            <strong>{isBest ? "Defensible next step" : "Reconsider the evidence"}</strong>
            <p>{result.feedback}</p>
            <small>Project artifact: {lab.artifact}</small>
          </>
        ) : (
          <p>Commit to a decision before reading the design consequence.</p>
        )}
      </div>
    </section>
  );
}
