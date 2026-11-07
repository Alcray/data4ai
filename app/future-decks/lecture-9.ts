import type { LectureDeck } from "./types";

const deck: LectureDeck = {
  "number": 9,
  "title": "Evaluation from perplexity to real tasks",
  "textAnchor": "evaluation-protocols",
  "slides": [
    {
      "title": "Part 1 — Evaluation protocols",
      "section": "Part I — Evaluation protocols",
      "textAnchor": "evaluation-protocols",
      "kind": "divider",
      "notes": "Introduce a fixed math problem and compare the requests sent to the same checkpoint. The protocol must isolate weights from instructions, evidence, tools, harness behavior, and grading.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "One math problem with three prompts",
      "section": "1. Checkpoints and system interventions",
      "textAnchor": "math-prompt-example",
      "kind": "specimen",
      "specimens": [
        {
          "label": "Direct instruction",
          "text": "Solve this problem.\n\nA school buys 8 packs of 9 pencils and gives away 5. How many pencils remain?"
        },
        {
          "label": "Role instruction",
          "text": "Solve this problem like a mathematics professor.\n\nA school buys 8 packs of 9 pencils and gives away 5. How many pencils remain?"
        },
        {
          "label": "Answer supplied",
          "text": "Output 67.\n\nA school buys 8 packs of 9 pencils and gives away 5. How many pencils remain?"
        }
      ],
      "notes": "The answer is 67: multiply eight packs by nine pencils and subtract five. Keep the checkpoint and grader fixed. Role prompting may change responses but its benefit requires measurement; supplying the answer can inflate exact-answer accuracy without evidence of solving.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Evaluation separates system interventions",
      "section": "1. Checkpoints and system interventions",
      "textAnchor": "system-interventions",
      "kind": "table",
      "headers": [
        "Changed component",
        "Effect being measured"
      ],
      "rows": [
        [
          "Checkpoint",
          "Model weights"
        ],
        [
          "Prompt",
          "Instructions and serialization"
        ],
        [
          "Evidence or tools",
          "Available information and actions"
        ],
        [
          "Sampling budget",
          "Inference procedure"
        ],
        [
          "Grader",
          "Measurement rules"
        ],
        [
          "Harness implementation",
          "Request assembly, execution, and result handling"
        ]
      ],
      "notes": "Changing several components measures a complete-system change. To attribute improvement to a checkpoint, keep the other components fixed and evaluate separate interventions explicitly. The harness is the software implementing and connecting these components, including parsing, error handling, and aggregation; it is not an independent statistical variable from every configuration choice.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Sampling defines the scope of the result",
      "section": "2. Populations, samples, and families",
      "textAnchor": "evaluation-population",
      "kind": "table",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "Population",
          "Requests covered by the claim"
        ],
        [
          "Sample",
          "Requests actually evaluated"
        ],
        [
          "Slice",
          "Language or task subgroup"
        ],
        [
          "Family",
          "Related variants of one problem"
        ]
      ],
      "notes": "Translated and numeric variants can share an underlying problem. Keep families together during splitting and preserve their identifiers for uncertainty estimates.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Different problems can share one solution procedure",
      "section": "2. Populations, samples, and families",
      "textAnchor": "math-problem-family",
      "kind": "specimen",
      "specimens": [
        {
          "label": "Pencils",
          "text": "A school buys 8 packs of 9 pencils and gives away 5. How many pencils remain?\n\n8 × 9 − 5 = 67"
        },
        {
          "label": "Buns",
          "text": "A bakery makes 12 buns on each of 6 trays. After 7 buns are sold, how many are left?\n\n6 × 12 − 7 = 65"
        },
        {
          "label": "Seats",
          "text": "A hall has 5 rows of 14 seats. Nine seats are blocked. How many seats are available?\n\n5 × 14 − 9 = 61"
        }
      ],
      "items": [
        "Multiply groups by items per group, then subtract unavailable items.",
        "Keep related variants in one split when testing new families."
      ],
      "notes": "These are constructed elementary word problems, not quoted benchmark items. All use the same multiply-then-subtract structure despite different entities, wording, and numbers. A shared family identifier prevents these variants from being treated as independent families in split design.",
      "source": {
        "label": "Constructed math family · Lecture 8"
      }
    },
    {
      "title": "Freeze the evaluation protocol",
      "section": "3. Protocol and failure definitions",
      "textAnchor": "evaluation-protocol",
      "kind": "points",
      "items": [
        "Checkpoint and tokenizer identities",
        "Task set and documentation snapshot",
        "Prompts, retrieval, tools, and budgets",
        "Parser, grader, and aggregation",
        "Timeout, retry, and truncation rules"
      ],
      "notes": "Version the complete protocol before evaluation. Exact requests and raw responses are needed to distinguish model errors from changed evidence or measurement behavior.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Every requested task receives an outcome",
      "section": "3. Protocol and failure definitions",
      "textAnchor": "evaluation-protocol",
      "kind": "table",
      "headers": [
        "Outcome",
        "Aggregate treatment"
      ],
      "rows": [
        [
          "Correct response",
          "Success"
        ],
        [
          "Parse or schema error",
          "Failure"
        ],
        [
          "Tool timeout",
          "Declared failure or retry policy"
        ],
        [
          "Missing response",
          "Retained in the denominator"
        ],
        [
          "Truncated response",
          "Grade under the fixed rule"
        ]
      ],
      "notes": "Dropping malformed or missing responses can inflate success rates. Retrying is allowed only within the declared budget, and the cost of failed attempts remains part of the record.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Part 2 — Likelihood and task metrics",
      "section": "Part II — Likelihood and task metrics",
      "textAnchor": "evaluation-metrics",
      "kind": "divider",
      "notes": "Separate prediction of held-out text from task success. Each metric needs a precise denominator, and abstention and confidence require events defined by the task contract.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Negative log-likelihood scores observed tokens",
      "section": "4. Negative log-likelihood and perplexity",
      "textAnchor": "likelihood",
      "kind": "formula",
      "formula": "L = −Σₜ mₜ log pθ(xₜ | x<ₜ)",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "t, T",
          "Position index; total positions"
        ],
        [
          "xₜ, x<ₜ",
          "Observed token; allowed context"
        ],
        [
          "pθ",
          "Predictive probability; parameters θ"
        ],
        [
          "mₜ",
          "One if scored; zero otherwise"
        ],
        [
          "L",
          "Total negative log-likelihood"
        ],
        [
          "Σₜ, log",
          "Sum over positions; natural logarithm"
        ]
      ],
      "formulaExplanation": "Score each intended target exactly once.",
      "notes": "The allowed context and loss mask are fixed by the evaluation protocol. Repeated window overlap may supply context without adding repeated contributions to the loss.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "nll-equation",
      "termMath": {
        "pθ": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>p</mi><mi>θ</mi></msub></math>"
      }
    },
    {
      "title": "Perplexity exponentiates the mean loss",
      "section": "4. Negative log-likelihood and perplexity",
      "textAnchor": "likelihood",
      "kind": "formula",
      "formula": "N = Σₜ mₜ\nL̄ = L / N\nPPL = exp(L̄)",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "t, T, mₜ",
          "Position; position count; scoring mask"
        ],
        [
          "N, Σₜ",
          "Target count; sum over positions"
        ],
        [
          "L",
          "Total negative log-likelihood, in nats"
        ],
        [
          "L̄",
          "Mean negative log-likelihood"
        ],
        [
          "PPL",
          "Perplexity"
        ],
        [
          "exp",
          "Exponential with base e"
        ]
      ],
      "formulaExplanation": "Lower is better under fixed tokens and context.",
      "notes": "Perplexity is a transformation of predictive loss rather than a task-success percentage. Tokenizer changes alter the prediction units and invalidate a direct per-token comparison.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "perplexity-equations"
    },
    {
      "title": "Bits per byte uses a shared length unit",
      "section": "5. Byte-normalized likelihood",
      "textAnchor": "byte-normalization",
      "kind": "formula",
      "formula": "bpb = L / (B log 2)",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "bpb",
          "Bits per evaluated byte"
        ],
        [
          "L",
          "Total negative log-likelihood, in nats"
        ],
        [
          "B",
          "UTF-8 bytes of the scored content"
        ],
        [
          "log 2",
          "Conversion from nats to bits"
        ]
      ],
      "formulaExplanation": "Use the same text and boundary convention.",
      "notes": "Exclude unscored prompt bytes and align special-token and truncation rules. Irreversible preprocessing changes the represented string, and this is not a sum over all possible tokenizations.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "bpb-equation"
    },
    {
      "title": "Concrete tasks need different checks",
      "section": "6. Task success and component checks",
      "textAnchor": "task-contract-examples",
      "kind": "table",
      "headers": [
        "Task type",
        "Example prompt",
        "Check"
      ],
      "rows": [
        [
          "Multiple-choice knowledge",
          "Closest planet? A: Mars; B: Mercury.",
          "Option B"
        ],
        [
          "Math reasoning",
          "6 boxes of 8 markers; give away 13. Left?",
          "35 markers"
        ],
        [
          "Code generation",
          "Implement square(n).",
          "Tests: square(3)=9; square(−2)=4"
        ],
        [
          "Documentation",
          "Upload limit? Manual: 20 MB.",
          "20 MB + supporting citation"
        ]
      ],
      "notes": "These are constructed task examples, not quoted benchmark questions. Knowledge selects an option; arithmetic yields a numerical result and units; code is tested on positive and negative inputs; the documentation answer also needs evidence from the approved source.",
      "source": {
        "label": "Constructed task examples · Lecture 8"
      }
    },
    {
      "title": "Coverage and selective risk measure abstention",
      "section": "7. Abstention and confidence calibration",
      "textAnchor": "abstention",
      "kind": "formula",
      "formula": "coverage = (Σᵢ aᵢ) / n\nrisk = Σᵢ aᵢ(1 − zᵢ) / Σᵢ aᵢ",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, n",
          "Request index; request count"
        ],
        [
          "aᵢ",
          "One if answered; zero if abstained"
        ],
        [
          "zᵢ",
          "One if answer is correct"
        ],
        [
          "Σᵢ",
          "Sum over all requests"
        ],
        [
          "coverage",
          "Fraction of requests answered"
        ],
        [
          "risk",
          "Error fraction among answers"
        ]
      ],
      "formulaExplanation": "Risk is undefined if no requests are answered.",
      "notes": "Set correctness to zero for abstentions; the answer indicator removes them from selective risk. Overall task success may separately reward correct abstention on unanswerable requests.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "abstention-equations"
    },
    {
      "title": "Example: abstention changes the denominator",
      "section": "7. Abstention and confidence calibration",
      "textAnchor": "abstention-example",
      "kind": "table",
      "headers": [
        "Measurement",
        "Result"
      ],
      "rows": [
        [
          "Requests",
          "100"
        ],
        [
          "Answered; correct",
          "80; 72"
        ],
        [
          "Coverage",
          "80%"
        ],
        [
          "Errors among answered requests",
          "8 / 80 = 10%"
        ],
        [
          "Correct answers across all requests",
          "72%"
        ]
      ],
      "notes": "These metrics describe different aspects of the same response policy. Correct abstention on unanswerable requests needs its own task label and should not be conflated with correct answered requests.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Brier score measures probability error",
      "section": "7. Abstention and confidence calibration",
      "textAnchor": "confidence-calibration",
      "kind": "formula",
      "formula": "Brier = (1/n) Σᵢ(cᵢ − zᵢ)²",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, n",
          "Prediction index; prediction count"
        ],
        [
          "cᵢ",
          "Predicted probability of correctness"
        ],
        [
          "zᵢ",
          "Observed correctness: zero or one"
        ],
        [
          "Σᵢ",
          "Sum over evaluated predictions"
        ],
        [
          "Brier",
          "Mean squared probability error"
        ]
      ],
      "formulaExplanation": "Lower is better; define correctness first.",
      "notes": "The Brier score reflects probability accuracy, including calibration and discrimination. It does not isolate calibration, and generated-answer confidence needs an explicit event definition.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "brier-equation"
    },
    {
      "title": "Example: probability error",
      "section": "7. Abstention and confidence calibration",
      "textAnchor": "confidence-calibration",
      "kind": "table",
      "headers": [
        "Prediction",
        "Confidence",
        "Correct",
        "Squared error"
      ],
      "rows": [
        [
          "A",
          "0.9",
          "1",
          "0.01"
        ],
        [
          "B",
          "0.6",
          "0",
          "0.36"
        ],
        [
          "Mean",
          "—",
          "—",
          "0.185"
        ]
      ],
      "notes": "Confidence is about correctness under the task contract. Fit confidence mappings and answer thresholds on development data before evaluating held-out predictions.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Part 3 — Sampling and inference cost",
      "section": "Part III — Sampling and inference cost",
      "textAnchor": "sampling-cost",
      "kind": "divider",
      "notes": "Compare oracle candidate availability with majority-vote accuracy and other response-selection rules. Sampling spends additional inference work and can generate correlated mistakes. A correct candidate in the pool does not ensure a correct delivered response.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Example: pass at five and majority at five",
      "textAnchor": "majority-vote-example",
      "section": "8. Candidate generation and selection",
      "kind": "image",
      "image": {
        "src": "lecture-9/majority-vote-example.svg?v=618ad39a62a6",
        "alt": "Start with the same five generated answers: 65,65,67,65,66. The correct answer is 67. Pass at five asks whether any answer is correct and succeeds; majority at five checks the most frequent answer,65,and fails. Define k as the number of generated answers before introducing the formal estimators."
      },
      "notes": "Start with the same five generated answers: 65,65,67,65,66. The correct answer is 67. Pass at five asks whether any answer is correct and succeeds; majority at five checks the most frequent answer,65,and fails. Define k as the number of generated answers before introducing the formal estimators.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Pass at k estimates candidate availability",
      "section": "8. Candidate generation and selection",
      "textAnchor": "pass-at-k",
      "kind": "formula",
      "formula": "pass@k = 1 − C(n − c, k) / C(n, k)\nn ≥ k",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "n",
          "Generated samples for one task"
        ],
        [
          "c",
          "Samples passing the grader"
        ],
        [
          "k",
          "Number of candidate draws"
        ],
        [
          "Binomial coefficient",
          "Number of b-item subsets of a items"
        ],
        [
          "pass@k",
          "Estimated chance of any correct candidate"
        ],
        [
          "Hat",
          "Marks an estimate from samples"
        ]
      ],
      "formulaExplanation": "A binomial coefficient is zero when its lower count exceeds its upper count.",
      "notes": "The estimator is unbiased for k independent completions under the same sampling distribution when the original n completions are independent. Compute it per task, then aggregate.",
      "source": {
        "label": "HumanEval · Chen et al. 2021",
        "url": "https://arxiv.org/abs/2107.03374"
      },
      "formulaAnchor": "passk-equation",
      "termMath": {
        "Binomial coefficient": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mrow><mo>(</mo><mfrac linethickness=\"0\"><mi>a</mi><mi>b</mi></mfrac><mo>)</mo></mrow></math>",
        "pass@k": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mover accent=\"true\"><mrow><mtext>pass@</mtext><mi>k</mi></mrow><mo>^</mo></mover></math>"
      }
    },
    {
      "title": "Majority at k grades the most frequent answer",
      "section": "8. Candidate generation and selection",
      "textAnchor": "majority-at-k",
      "kind": "formula",
      "formula": "vᵢ = mode(aᵢ₁, …, aᵢₖ)\nmajority@k = (1/M) Σᵢ 1[vᵢ = yᵢ]",
      "formulaAnchor": "majority-equations",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, M; j, k",
          "Task index / count; candidate index / count"
        ],
        [
          "aᵢⱼ",
          "Normalized final answer from candidate j on task i"
        ],
        [
          "vᵢ, mode",
          "Most frequent answer; fixed tie rule"
        ],
        [
          "yᵢ",
          "Reference answer for task i"
        ],
        [
          "1[·]",
          "One for a match; zero otherwise"
        ],
        [
          "Σᵢ",
          "Sum the outcomes over all M tasks"
        ]
      ],
      "formulaExplanation": "Vote without the reference; grade the selected answer afterward.",
      "notes": "Majority here means mode or plurality, not a requirement to exceed half of the votes. Fix normalization, tie-breaking, and invalid-output handling before evaluation. The displayed accuracy averages exact normalized matches across tasks; other tasks use the declared grader.",
      "source": {
        "label": "Self-consistency · Wang et al. 2023",
        "url": "https://arxiv.org/abs/2203.11171"
      }
    },
    {
      "title": "Cost per success includes failed requests",
      "section": "9. Quality and inference cost",
      "textAnchor": "inference-cost",
      "kind": "formula",
      "formula": "Csuccess = (Σᵢ Cᵢ) / (Σᵢ zᵢ)",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, Σᵢ",
          "Request index; sum over requests"
        ],
        [
          "Cᵢ",
          "Total cost incurred by request i"
        ],
        [
          "zᵢ",
          "One if final task success"
        ],
        [
          "Csuccess",
          "Cost per successful task"
        ]
      ],
      "formulaExplanation": "Report undefined when there are no successes.",
      "notes": "Include generation, selection, tools, and retries in incurred cost. The ratio describes resource efficiency, not the consequence of incorrect answers or the latency distribution.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "cost-equation",
      "termMath": {
        "Csuccess": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>C</mi><mtext>success</mtext></msub></math>"
      }
    },
    {
      "title": "Example: quality and cost under two budgets",
      "section": "9. Quality and inference cost",
      "textAnchor": "inference-cost",
      "kind": "table",
      "headers": [
        "Procedure",
        "Successes / 100",
        "Total cost",
        "Cost/success"
      ],
      "rows": [
        [
          "One response",
          "60",
          "20 units",
          "0.333"
        ],
        [
          "Four plus selection",
          "75",
          "80 units",
          "1.067"
        ]
      ],
      "notes": "These constructed operating points show that higher success can require more spending per solved task. Evaluate latency separately and compare checkpoints at matched budgets when isolating model quality.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Part 4 — Statistical comparisons",
      "section": "Part IV — Statistical comparisons",
      "textAnchor": "statistical-comparisons",
      "kind": "divider",
      "notes": "Use paired outcomes to estimate a change and preserve dependence when quantifying uncertainty. A point estimate needs a population, an independent sampling unit, and a decision threshold.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Paired differences estimate the mean change",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-comparison",
      "kind": "formula",
      "formula": "dᵢ = bᵢ − aᵢ\nd̄ = (1/n) Σᵢ dᵢ",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, n",
          "Task index; paired task count"
        ],
        [
          "aᵢ, bᵢ",
          "Correctness of systems A and B"
        ],
        [
          "dᵢ",
          "Paired difference on task i"
        ],
        [
          "d̄",
          "Mean improvement of B over A"
        ],
        [
          "Σᵢ",
          "Sum over the same task pairs"
        ]
      ],
      "formulaExplanation": "Preserve both outcomes for every task.",
      "notes": "Pairing controls the task sample rather than creating independence. If related variants share a family, uncertainty must also account for their dependence.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "paired-difference-equations"
    },
    {
      "title": "Example: 80% and 82% on the same 500 questions",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-mean-example",
      "kind": "image",
      "image": {
        "src": "lecture-9/paired-mean-example.svg?v=c49e9493f657",
        "alt": "Both correct: 380; A only: 20; B only: 30; both wrong: 70. Ten net gains out of 500 give two percentage points."
      },
      "notes": "These are hypothetical model outcomes on the 500-question MATH-500 benchmark. A has 400 successes and B has 410. Count 30 gains minus 20 losses, then divide by 500; the 450 ties contribute zero.",
      "source": {
        "label": "Hypothetical MATH-500 results · 500 paired questions"
      }
    },
    {
      "title": "Standard error uses paired variation",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-comparison",
      "kind": "formula",
      "formula": "s²d = Σᵢ(dᵢ − d̄)² / (n − 1)\nSE = sd / √n",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "dᵢ, d̄",
          "Paired difference; its sample mean"
        ],
        [
          "i, n",
          "Pair index; number of pairs"
        ],
        [
          "s²d, sd",
          "Sample variance; standard deviation"
        ],
        [
          "SE",
          "Standard error of the mean"
        ],
        [
          "Σᵢ, √",
          "Sum over pairs; square root"
        ]
      ],
      "formulaExplanation": "Assume independent task pairs.",
      "notes": "The standard error describes sampling variation under the stated model. It does not include judge error, prompt selection, contamination, or dependence between related tasks.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "paired-se-equations",
      "termMath": {
        "s²d, sd": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mrow><msup><msub><mi>s</mi><mi>d</mi></msub><mn>2</mn></msup><mo>,</mo><msub><mi>s</mi><mi>d</mi></msub></mrow></math>"
      }
    },
    {
      "title": "Example: standard error for the same questions",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-se-example",
      "kind": "image",
      "image": {
        "src": "lecture-9/paired-se-example.svg?v=2ddd62468a87",
        "alt": "The 500 paired differences have squared deviations totaling 49.8; the standard error is 1.41 percentage points."
      },
      "notes": "Continue the same 30 gains, 20 losses, and 450 ties. Their squared deviations from the mean 0.02 sum to 49.8. Divide by 499, take the square root, then divide by the square root of 500 to obtain SE 0.01413.",
      "source": {
        "label": "Hypothetical MATH-500 results · 500 paired questions"
      }
    },
    {
      "title": "An interval expresses sampling uncertainty",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-comparison",
      "kind": "formula",
      "formula": "d̄ ± z₁₋α/₂ · SE",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "d̄",
          "Estimated mean paired difference"
        ],
        [
          "SE",
          "Estimated standard error"
        ],
        [
          "α",
          "Tail probability excluded in total"
        ],
        [
          "z₁₋α/₂",
          "Standard-normal critical value"
        ],
        [
          "±",
          "Lower and upper endpoints"
        ]
      ],
      "formulaExplanation": "Normal approximation; check sample adequacy.",
      "notes": "This interval relies on a useful normal approximation for the paired mean. Small samples, rare disagreements, or correlated families can make this calculation unreliable.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "paired-interval-equation",
      "termMath": {
        "z₁₋α/₂": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>z</mi><mrow><mn>1</mn><mo>−</mo><mfrac><mi>α</mi><mn>2</mn></mfrac></mrow></msub></math>"
      }
    },
    {
      "title": "Example: an interval for the two-point gain",
      "section": "10. Paired differences and uncertainty",
      "textAnchor": "paired-interval-example",
      "kind": "image",
      "image": {
        "src": "lecture-9/paired-interval-example.svg?v=beebc76a7269",
        "alt": "A two-point gain plus or minus 2.77 points gives an approximate interval from minus 0.77 to plus 4.77 percentage points."
      },
      "notes": "Use the same estimate and standard error: 0.02 plus or minus 1.96 times 0.01413. The interval crosses zero, so this hypothetical sample does not establish a positive population gain. The fixed scores are exact for the saved benchmark outputs; generalization requires the stated sampling model.",
      "source": {
        "label": "Hypothetical MATH-500 results · 500 paired questions"
      }
    },
    {
      "title": "Bootstrap independent families as paired units",
      "section": "11. Family-level bootstrap",
      "textAnchor": "family-bootstrap",
      "kind": "flow",
      "items": [
        "Group related requests",
        "Sample families with replacement",
        "Keep both systems and variants",
        "Recompute the same statistic"
      ],
      "notes": "A family bootstrap carries translated and paraphrased variants together. Resampling A and B separately destroys pairing, while resampling each variant independently ignores dependence.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Example: related problems form a benchmark family",
      "section": "11. Family-level bootstrap",
      "textAnchor": "benchmark-families-example",
      "kind": "image",
      "image": {
        "src": "lecture-9/benchmark-families-example.svg?v=a192cd84ce34",
        "alt": "Three constructed families contain equation, rectangle-area, and remainder variants. One bootstrap draw selects F2, F2, F1."
      },
      "notes": "Each constructed family contains related versions of one seed problem. A bootstrap draw selects families with replacement and carries every variant and both models’ outcomes together. These are not official MATH-500 family labels; broad subjects alone do not establish dependency groups.",
      "source": {
        "label": "Constructed variants · Toy family resample"
      }
    },
    {
      "title": "The same 80% and 82% can have different uncertainty",
      "section": "11. Family-level bootstrap",
      "textAnchor": "math500-gain-uncertainty",
      "kind": "table",
      "headers": [
        "Hypothetical pairs",
        "Only B correct",
        "Only A correct",
        "Approx. 95% interval"
      ],
      "rows": [
        [
          "Continuing example",
          "30",
          "20",
          "−0.77 to +4.77 points"
        ],
        [
          "B keeps all A successes",
          "10",
          "0",
          "+0.77 to +3.23 points"
        ]
      ],
      "notes": "Both hypothetical cases have A correct on 400 of 500 questions and B correct on 410. The different numbers of disagreements change the paired standard error. These are independent-task normal intervals, not family-bootstrap results; rare disagreements need care. A family-aware interval requires paired question-level results and verified family IDs, which aggregate scores cannot provide.",
      "source": {
        "label": "Hypothetical MATH-500 outcomes · Independent-task normal intervals"
      }
    },
    {
      "title": "Aggregation weights define the estimand",
      "section": "11. Family-level bootstrap",
      "textAnchor": "family-bootstrap",
      "kind": "table",
      "headers": [
        "Family weighted",
        "Request weighted"
      ],
      "rows": [
        [
          "Mean of family means",
          "Total difference / total requests"
        ],
        [
          "Equal influence per family",
          "Influence follows request count"
        ],
        [
          "Bootstrap family means",
          "Bootstrap clusters and recompute ratio"
        ]
      ],
      "notes": "Unequal family sizes can make these estimates differ. Choose the population interpretation first and preserve that statistic inside each resample.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    },
    {
      "title": "Plan precision for a single proportion",
      "section": "12. Precision and decision thresholds",
      "textAnchor": "precision-planning",
      "kind": "formula",
      "formula": "n ≈ z²₁₋α/₂ p(1 − p) / h²",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "n",
          "Required independent trial count"
        ],
        [
          "p",
          "Assumed success proportion"
        ],
        [
          "h",
          "Desired interval half-width"
        ],
        [
          "α",
          "Error probability"
        ],
        [
          "z₁₋α/₂",
          "Standard-normal critical value"
        ],
        [
          "≈",
          "Normal-approximation calculation"
        ]
      ],
      "formulaExplanation": "Assume independent trials with a common success probability.",
      "notes": "This is precision planning for one independent proportion. Paired comparisons use disagreement variance; clustered requests require a design that accounts for the independent family count.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "sample-size-equation",
      "termMath": {
        "z₁₋α/₂": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>z</mi><mrow><mn>1</mn><mo>−</mo><mfrac><mi>α</mi><mn>2</mn></mfrac></mrow></msub></math>"
      }
    },
    {
      "title": "Example: planning a proportion estimate",
      "section": "12. Precision and decision thresholds",
      "textAnchor": "precision-planning",
      "kind": "table",
      "headers": [
        "Assumption",
        "Value"
      ],
      "rows": [
        [
          "Confidence level",
          "95%"
        ],
        [
          "Normal critical value",
          "1.96"
        ],
        [
          "Planning proportion",
          "0.5"
        ],
        [
          "Desired half-width",
          "5 percentage points"
        ],
        [
          "Independent trials",
          "At least 385"
        ]
      ],
      "notes": "Round the continuous approximation upward. This is a planning example, not a guarantee for clustered observations, rare events, or an arbitrary paired comparison.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Zero failures still permit a positive failure rate",
      "section": "12. Precision and decision thresholds",
      "textAnchor": "precision-planning",
      "kind": "formula",
      "formula": "pupper = 1 − α^(1/n)",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "pupper",
          "One-sided failure-rate upper bound"
        ],
        [
          "n",
          "Independent trials with zero failures"
        ],
        [
          "α",
          "Probability excluded above the bound"
        ],
        [
          "1 − α",
          "Confidence level"
        ],
        [
          "α^(1/n)",
          "The nth root of α"
        ]
      ],
      "formulaExplanation": "Assume independent trials with a common rate.",
      "notes": "Set the probability of observing zero failures equal to alpha and solve for the event probability. The bound describes uncertainty even when the observed rate is zero.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      },
      "formulaAnchor": "zero-failure-equation",
      "termMath": {
        "pupper": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>p</mi><mtext>upper</mtext></msub></math>",
        "α^(1/n)": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msup><mi>α</mi><mfrac><mn>1</mn><mi>n</mi></mfrac></msup></math>"
      }
    },
    {
      "title": "Example: zero failures in a finite sample",
      "section": "12. Precision and decision thresholds",
      "textAnchor": "precision-planning",
      "kind": "table",
      "headers": [
        "Observation",
        "One-sided 95% upper bound"
      ],
      "rows": [
        [
          "0 failures in 100 trials",
          "2.95%"
        ],
        [
          "0 failures in 1,000 trials",
          "0.299%"
        ]
      ],
      "notes": "A larger independent sample narrows the bound, but zero observed failures never proves zero population risk. The intended decision threshold determines whether the evidence is sufficient.",
      "source": {
        "label": "Constructed example · Lecture 8"
      }
    },
    {
      "title": "Set decision thresholds before final testing",
      "section": "12. Precision and decision thresholds",
      "textAnchor": "precision-planning",
      "kind": "points",
      "items": [
        "Minimum worthwhile primary gain",
        "Maximum tolerated slice regression",
        "Failure-rate and latency constraints",
        "Validation for selecting variants",
        "Independent confirmation after selection"
      ],
      "notes": "Repeated prompt and checkpoint search selects favorable noise along with real improvements. Reserve confirmation data and report exploratory analyses separately from predeclared decision tests.",
      "source": {
        "label": "Lecture 8 · Evaluation from perplexity to real tasks"
      }
    }
  ]
};

export default deck;
