import type { LectureDeck } from "./types";

const deck: LectureDeck = {
  "number": 10,
  "title": "Continued pretraining, SFT, and instruction data",
  "textAnchor": "introduction",
  "slides": [
    {
      "title": "Part 1 — Introduction",
      "section": "Introduction",
      "textAnchor": "introduction",
      "kind": "divider",
      "notes": "This part covers introduction. Use the chapter for the full discussion and references."
    },
    {
      "title": "One request, three outputs",
      "section": "Introduction",
      "textAnchor": "assistant-output-examples",
      "kind": "image",
      "notes": "The same request requires both a correct value and JSON formatting. Three retries follow the initial attempt, so four is the correct total. These constructed outputs separate two properties the evaluation can score independently.",
      "image": {
        "src": "lecture-10/assistant-output-examples.svg",
        "alt": "Three retries plus the initial attempt gives four attempts. Compare wrong value, wrong format and correct JSON."
      }
    },
    {
      "title": "Methods for improving model answers",
      "section": "Introduction",
      "textAnchor": "adaptation-methods",
      "kind": "image",
      "notes": "The left branch changes what the model reads while keeping weights fixed. The right branch changes parameters through CPT or SFT. LoRA is a parameterization of the update, usable with either training objective.",
      "image": {
        "src": "lecture-10/adaptation-methods.svg",
        "alt": "Prompting and retrieval change the input; CPT and SFT change weights, using full fine-tuning or LoRA."
      }
    },
    {
      "title": "Part 2 — Continued pretraining",
      "section": "Continued pretraining",
      "textAnchor": "continued-pretraining",
      "kind": "divider",
      "notes": "This part covers continued pretraining. Use the chapter for the full discussion and references."
    },
    {
      "title": "CPT continues next-token training",
      "section": "Continued pretraining",
      "textAnchor": "cpt-token-loop",
      "kind": "image",
      "notes": "CPT resumes the same next-token prediction task on additional text. It starts at trained weights, rather than random initialization. No question–answer annotation is needed: the next corpus token is the target.",
      "image": {
        "src": "lecture-10/cpt-token-loop.svg",
        "alt": "New text supplies a prefix and next-token target; prediction error updates the pretrained weights."
      }
    },
    {
      "title": "Code Llama starts from Llama 2",
      "section": "Continued pretraining",
      "textAnchor": "code-llama-stages",
      "kind": "table",
      "notes": "The first code stage reuses Llama 2 weights. The 500B budget applies to the original 7B, 13B and 34B models; the 70B model used 1T. Python specialization is a variant, not a mandatory stage for every model. The instruction stage uses SFT.",
      "headers": [
        "Stage",
        "Additional data",
        "Tokens"
      ],
      "rows": [
        [
          "Code Llama",
          "85% code; 15% natural language",
          "500B"
        ],
        [
          "Python variant",
          "75% Python mixture",
          "100B"
        ],
        [
          "Long context",
          "16,384-token sequences",
          "20B"
        ],
        [
          "Instruct variant",
          "Instruction–response pairs",
          "≈5B"
        ]
      ],
      "source": {
        "label": "Code Llama · Rozière et al.",
        "url": "https://arxiv.org/abs/2308.12950"
      }
    },
    {
      "title": "Reusing pretrained weights reduces training cost",
      "section": "Continued pretraining",
      "textAnchor": "cpt-reuse",
      "kind": "image",
      "notes": "The paper compares code training from Llama 2 with training from random initialization. The random 7B model finished at a loss the pretrained initialization had reached about 240B tokens earlier. Code Llama 7B also performed approximately like Llama 2 70B on the reported Python benchmarks.",
      "image": {
        "src": "lecture-10/cpt-reuse.svg",
        "alt": "A pretrained checkpoint reuses general training before domain adaptation."
      },
      "source": {
        "label": "Code Llama · Rozière et al.",
        "url": "https://arxiv.org/abs/2308.12950"
      }
    },
    {
      "title": "CPT adapts models to Armenian",
      "section": "Continued pretraining",
      "textAnchor": "armenian-models",
      "kind": "table",
      "notes": "These are two Armenian adaptation projects described in the chapter. HyGPT includes an instruction-tuning stage after continued pretraining. The COPA release documents both news and verified mathematics and science in its training mixture.",
      "headers": [
        "Model",
        "Starting checkpoint",
        "Armenian training"
      ],
      "rows": [
        [
          "HyGPT",
          "Gemma 2 9B",
          "≈10B tokens, then SFT"
        ],
        [
          "arm-gemma-e4b",
          "Gemma-4-E4B",
          "10B tokens; news + verified problems"
        ]
      ],
      "source": {
        "label": "HyGPT · COPA model card",
        "url": "https://huggingface.co/COPA-AI/arm-gemma-e4b"
      }
    },
    {
      "title": "Long-context training uses longer sequences",
      "section": "Continued pretraining",
      "textAnchor": "cpt-context",
      "kind": "image",
      "notes": "Code Llama expands the training sequence from 4,096 to 16,384 tokens. It also changes the rotary embedding base period from 10,000 to 1,000,000. The paper reports inputs up to 100,000 tokens; training length and tested input length are different quantities.",
      "image": {
        "src": "lecture-9-1/cpt-context.svg",
        "alt": "Training sequence length grows from 4096 to 16384 tokens."
      },
      "source": {
        "label": "Code Llama · Rozière et al.",
        "url": "https://arxiv.org/abs/2308.12950"
      }
    },
    {
      "title": "Domain pretraining also improves RoBERTa",
      "section": "Continued pretraining",
      "textAnchor": "roberta-domains",
      "kind": "table",
      "notes": "Do not restrict the idea of continued pretraining to decoder language models. Don’t Stop Pretraining applied domain-adaptive pretraining to RoBERTa and improved eight classification tasks across these four domains. Its pretraining objective follows the encoder model rather than causal next-token prediction.",
      "headers": [
        "Additional corpus",
        "Evaluation domain"
      ],
      "rows": [
        [
          "Biomedical papers",
          "Biomedical classification"
        ],
        [
          "Computer science papers",
          "Computer science classification"
        ],
        [
          "News articles",
          "News classification"
        ],
        [
          "Reviews",
          "Review classification"
        ]
      ],
      "source": {
        "label": "Don’t Stop Pretraining · Gururangan et al.",
        "url": "https://aclanthology.org/2020.acl-main.740/"
      }
    },
    {
      "title": "Code training can reduce general accuracy",
      "section": "Continued pretraining",
      "textAnchor": "cpt-forgetting",
      "kind": "image",
      "notes": "These are full fine-tuning results for Llama-2-7B on Python code. The right panel averages HellaSwag, WinoGrande and ARC-Challenge. Both axes measure percentages, and higher is better. Fix both target and retained evaluations before training so a target improvement does not hide forgetting.",
      "image": {
        "src": "lecture-9-1/cpt-forgetting.svg",
        "alt": "HumanEval rises from 15.2% to 26.3%; general accuracy falls from 62.5% to 54.5% as code training grows."
      },
      "source": {
        "label": "LoRA Learns Less and Forgets Less · Biderman et al.",
        "url": "https://arxiv.org/abs/2405.09673"
      }
    },
    {
      "title": "Armenian news adaptation reduces Belebele accuracy",
      "section": "Continued pretraining",
      "textAnchor": "armenian-forgetting",
      "kind": "bars",
      "notes": "In the COPA experiment, news-focused continued pretraining used a learning rate of 10⁻⁴. Armenian fluency improved but Belebele reading comprehension fell from 61.9% to 40.7%. These are two checkpoints measured on the same evaluation.",
      "unit": "%",
      "bars": [
        {
          "label": "Starting model · Belebele",
          "value": 61.9
        },
        {
          "label": "News-focused CPT",
          "value": 40.7
        }
      ],
      "source": {
        "label": "From Zero to Hero · COPA",
        "url": "https://arxiv.org/abs/2609.03350"
      }
    },
    {
      "title": "Replay mixes two training losses",
      "section": "Continued pretraining",
      "textAnchor": "replay-objective",
      "kind": "formula",
      "notes": "Replay includes text resembling earlier pretraining data. The weights here count training tokens, not documents. Learning rate and training length also affect how far parameters move.",
      "formula": "Lmix = α Ltarget + (1 − α) Lreplay",
      "formulaAnchor": "replay-objective",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "Lmix",
          "Combined average training loss"
        ],
        [
          "Ltarget",
          "Average loss on new-domain text"
        ],
        [
          "Lreplay",
          "Average loss on replay text"
        ],
        [
          "α",
          "New-domain share of training tokens"
        ],
        [
          "1 − α",
          "Replay share of training tokens"
        ]
      ],
      "formulaExplanation": "The token shares weight the two average losses.",
      "termMath": {
        "Lmix": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>ℒ</mi><mi>mix</mi></msub></math>",
        "Ltarget": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>ℒ</mi><mi>target</mi></msub></math>",
        "Lreplay": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>ℒ</mi><mi>replay</mi></msub></math>"
      }
    },
    {
      "title": "A replay budget counts tokens",
      "section": "Continued pretraining",
      "textAnchor": "replay-budget",
      "kind": "image",
      "notes": "With a domain share of 0.7, a 10M-token budget assigns 7M tokens to the domain and 3M to replay. Document lengths differ, so the same percentage of documents will not generally give this token split. Code Llama is a real mixture example: its initial code stage retains 15% natural language.",
      "image": {
        "src": "lecture-9-1/replay-budget.svg",
        "alt": "Ten million training tokens contain seven million domain and three million replay tokens."
      }
    },
    {
      "title": "Changing the Armenian mixture improves Belebele accuracy",
      "section": "Continued pretraining",
      "textAnchor": "armenian-mixture",
      "kind": "bars",
      "notes": "The revised COPA configuration replaces six percentage points of news with verified mathematics and science problems and also lowers the learning rate. Belebele rises to 71.6%, above the starting 61.9%. Since two factors changed, these results do not isolate the contribution of either change alone.",
      "unit": "%",
      "bars": [
        {
          "label": "Starting model · Belebele",
          "value": 61.9
        },
        {
          "label": "News-focused CPT",
          "value": 40.7
        },
        {
          "label": "Revised mixture + lower LR",
          "value": 71.6
        }
      ],
      "source": {
        "label": "From Zero to Hero · COPA",
        "url": "https://arxiv.org/abs/2609.03350"
      }
    },
    {
      "title": "Part 3 — Supervised fine-tuning",
      "section": "Supervised fine-tuning",
      "textAnchor": "supervised-fine-tuning",
      "kind": "divider",
      "notes": "This part covers supervised fine-tuning. Use the chapter for the full discussion and references."
    },
    {
      "title": "SFT trains on desired responses",
      "section": "Supervised fine-tuning",
      "textAnchor": "sft-demonstration",
      "kind": "image",
      "notes": "Each example contains an input and the response we want the assistant to produce. The input can include earlier messages, instructions and retrieved evidence. Training raises the probability of the desired response given that input.",
      "image": {
        "src": "lecture-9-1/sft-demonstration.svg",
        "alt": "The request is context; the desired response supplies training targets that update the model."
      }
    },
    {
      "title": "A base model continues the supplied text",
      "section": "Supervised fine-tuning",
      "textAnchor": "base-continuation",
      "kind": "specimen",
      "notes": "This is the base-model prompt and continuation shown in Meta’s format specification. It continues a sentence rather than answering as an assistant. SFT trains the model to produce assistant turns in a conversation.",
      "specimens": [
        {
          "label": "Base-model prompt",
          "text": "<|begin_of_text|>\nColor of sky is blue but\nsometimes can also be"
        },
        {
          "label": "Continuation",
          "text": "red, orange, yellow, green,\npurple, pink, brown, gray,\nblack, …"
        }
      ],
      "source": {
        "label": "Llama 3.1 prompt format · Meta",
        "url": "https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md"
      }
    },
    {
      "title": "Instruction datasets vary in size",
      "section": "Supervised fine-tuning",
      "textAnchor": "sft-dataset-sizes",
      "kind": "table",
      "notes": "These numbers describe different datasets and tasks, not a controlled scaling comparison. InstructGPT also has later preference-training stages; this row refers only to its supervised demonstrations. LIMA shows a small curated setting, while OpenMath2 uses large-scale synthetic demonstrations.",
      "headers": [
        "Model",
        "Starting model · Belebele",
        "SFT data"
      ],
      "rows": [
        [
          "InstructGPT",
          "GPT-3",
          "≈13,000 human demonstrations"
        ],
        [
          "LIMA",
          "LLaMA 65B",
          "1,000 curated pairs"
        ],
        [
          "Code Llama Instruct",
          "Code Llama",
          "≈5B instruction-data tokens"
        ],
        [
          "OpenMath2",
          "Llama 3.1 8B base",
          "14M mathematics pairs"
        ]
      ]
    },
    {
      "title": "Code instructions and code text train different behavior",
      "section": "Supervised fine-tuning",
      "textAnchor": "cpt-sft-comparison",
      "kind": "table",
      "notes": "The instruction dataset pairs requests with programs, matching the form of the evaluation tasks. Its token count is roughly 270 times smaller, but this is not an equal-budget causal comparison of objectives. SFT can teach task behavior and factual content; the distinction is not an absolute knowledge-versus-format boundary.",
      "headers": [
        "Llama-2-7B training",
        "Data",
        "HumanEval pass@1"
      ],
      "rows": [
        [
          "CPT on Python",
          "20B tokens",
          "26.3%"
        ],
        [
          "SFT on coding instructions",
          "110K pairs · 73M tokens",
          "49.7%"
        ]
      ],
      "source": {
        "label": "LoRA Learns Less and Forgets Less · Biderman et al.",
        "url": "https://arxiv.org/abs/2405.09673"
      }
    },
    {
      "title": "An OpenMathInstruct-2 training pair",
      "section": "Supervised fine-tuning",
      "textAnchor": "openmathinstruct-2",
      "kind": "specimen",
      "notes": "This record comes from the released dataset and is marked augmented_gsm8k. The teacher generated the problem and its solution. The input is the problem; the training response includes the intermediate steps and boxed final answer.",
      "specimens": [
        {
          "label": "Problem",
          "text": "120 small stones are needed to fill a decorative vase. Emma has already collected 45 stones, but she needs to fill 3 vases. How many more stones must Emma collect?"
        },
        {
          "label": "Solution",
          "text": "Emma needs 120 stones per vase, and she needs to fill 3 vases. \nSo, she needs 3 * 120 = 360 stones in total.\nShe already has 45 stones, so she needs 360 - 45 = 315 more stones.\nThus, Emma must collect \\boxed{315} more stones."
        }
      ],
      "source": {
        "label": "OpenMathInstruct-2 · released dataset",
        "url": "https://huggingface.co/datasets/nvidia/OpenMathInstruct-2"
      }
    },
    {
      "title": "OpenMath2 improves mathematics benchmark scores",
      "section": "Supervised fine-tuning",
      "textAnchor": "openmath-scores",
      "kind": "table",
      "notes": "OpenMath2 fine-tunes the base model on 14M pairs spanning about 600K distinct problems. Llama-3.1-405B-Instruct supplies solutions and new problems; newly generated problems use majority answers from 32 solutions. These are the paper’s reported benchmark scores.",
      "headers": [
        "Llama 3.1 8B model",
        "MATH (competition problems)",
        "GSM8K (grade-school word problems)"
      ],
      "rows": [
        [
          "Meta Instruct",
          "51.9%",
          "84.2%"
        ],
        [
          "OpenMath2",
          "67.8%",
          "91.7%"
        ]
      ],
      "source": {
        "label": "OpenMathInstruct-2 · Toshniwal et al.",
        "url": "https://arxiv.org/abs/2410.01560"
      }
    },
    {
      "title": "Demonstration properties affect learning",
      "section": "Supervised fine-tuning",
      "textAnchor": "openmath-properties",
      "kind": "table",
      "notes": "These are separate ablations with different settings, not rows of one common leaderboard. Short solutions average 237 tokens versus 331 in the default style. Robustness to some wrong solutions does not establish that correctness never matters or that SFT only learns format.",
      "headers": [
        "Comparison",
        "MATH validation result"
      ],
      "rows": [
        [
          "Short / default solutions",
          "44.5% / 40.6%"
        ],
        [
          "405B teacher / 8B base teacher",
          "37.9% / 30.1%"
        ],
        [
          "Filter 6–12% wrong solutions",
          "43–44%; unfiltered 43.6%"
        ],
        [
          "Add up to 20% wrong solutions",
          "Little change at ≥256K pairs"
        ],
        [
          "6,500 / 1,000 distinct problems",
          "+10.5 points at 256K pairs"
        ]
      ],
      "source": {
        "label": "OpenMathInstruct-2 · Toshniwal et al.",
        "url": "https://arxiv.org/abs/2410.01560"
      }
    },
    {
      "title": "Llama 3.1 Instruct serializes conversation roles",
      "section": "Supervised fine-tuning",
      "textAnchor": "llama-template",
      "kind": "code",
      "notes": "Follow the template shipped with the selected checkpoint. Special tokens delimit messages and identify roles; whitespace shown at message boundaries matters. Gemma names the assistant model and has no system role in this format.",
      "code": "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nYou are a helpful assistant<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nCapital of France?<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\nParis.<|eot_id|>",
      "source": {
        "label": "Llama 3.1 Instruct · chat format",
        "url": "https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/prompt_format.md"
      }
    },
    {
      "title": "Qwen2.5 Instruct serializes conversation roles",
      "section": "Supervised fine-tuning",
      "textAnchor": "qwen-template",
      "kind": "code",
      "notes": "Follow the template shipped with the selected checkpoint. Special tokens delimit messages and identify roles; whitespace shown at message boundaries matters. Gemma names the assistant model and has no system role in this format.",
      "code": "<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\n<|im_start|>user\nCapital of France?<|im_end|>\n<|im_start|>assistant\nParis.<|im_end|>",
      "source": {
        "label": "Qwen2.5 Instruct · chat format",
        "url": "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/blob/main/tokenizer_config.json"
      }
    },
    {
      "title": "Gemma 2 serializes conversation roles",
      "section": "Supervised fine-tuning",
      "textAnchor": "gemma-template",
      "kind": "code",
      "notes": "Follow the template shipped with the selected checkpoint. Special tokens delimit messages and identify roles; whitespace shown at message boundaries matters. Gemma names the assistant model and has no system role in this format.",
      "code": "<bos><start_of_turn>user\nCapital of France?<end_of_turn>\n<start_of_turn>model\nParis.<end_of_turn>",
      "source": {
        "label": "Gemma 2 · chat format",
        "url": "https://ai.google.dev/gemma/docs/core/prompt-structure"
      }
    },
    {
      "title": "SFT scores the response tokens",
      "section": "Supervised fine-tuning",
      "textAnchor": "sft-objective",
      "kind": "formula",
      "notes": "The assistant response includes its end-of-turn token. System, user and tool text remain visible context, but do not contribute target terms under response-only training. The formula describes teacher-forced training on the desired response.",
      "formula": "LSFT(θ) = −(1/|A|) Σt∈A log pθ(zt | z<t)",
      "formulaAnchor": "sft-objective",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "LSFT, θ",
          "Average response loss; model parameters"
        ],
        [
          "t, zt",
          "Position; token at that position"
        ],
        [
          "z<t",
          "All preceding context tokens"
        ],
        [
          "A, |A|",
          "Response positions; their count"
        ],
        [
          "pθ",
          "Probability of the target token"
        ],
        [
          "Σt∈A, log",
          "Sum over response positions; natural log"
        ]
      ],
      "formulaExplanation": "Average the prediction penalty over the response.",
      "termMath": {
        "LSFT, θ": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>ℒ</mi><mi>SFT</mi></msub><mo>,</mo><mi>θ</mi></math>",
        "t, zt": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>t</mi><mo>,</mo><msub><mi>z</mi><mi>t</mi></msub></math>",
        "z<t": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>z</mi><mi>&lt;t</mi></msub></math>",
        "pθ": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>p</mi><mi>θ</mi></msub></math>",
        "Σt∈A, log": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mo>∑</mo><mrow><mi>t</mi><mo>∈</mo><mi>A</mi></mrow></msub><mo>,</mo><mi>log</mi></math>"
      }
    },
    {
      "title": "The Qwen response supplies three scored pieces",
      "section": "Supervised fine-tuning",
      "textAnchor": "response-mask",
      "kind": "image",
      "notes": "The chapter divides the response into Paris, punctuation and the end-of-turn token. Masked positions are commonly assigned label −100 in PyTorch cross-entropy. This is a loss mask: it does not hide the question from attention.",
      "image": {
        "src": "lecture-9-1/response-mask.svg",
        "alt": "Paris, punctuation and the end-of-turn token are scored; system, user and assistant header pieces are masked."
      }
    },
    {
      "title": "Tool results remain context with masked loss",
      "section": "Supervised fine-tuning",
      "textAnchor": "tool-result-mask",
      "kind": "image",
      "notes": "The assistant generates both the call and the final response, so those turns are targets. The external tool generates the observation, so that turn is masked. The final response still attends to the tool result.",
      "image": {
        "src": "lecture-9-1/tool-result-mask.svg",
        "alt": "The user and external tool result are masked; assistant tool call and final answer are scored."
      }
    },
    {
      "title": "More SFT epochs can reduce both scores",
      "section": "Supervised fine-tuning",
      "textAnchor": "sft-training-length",
      "kind": "image",
      "notes": "One epoch is one pass through the dataset. These are full fine-tuning results on 110K coding instructions. HumanEval peaks at 49.7% after eight epochs and falls to 41.6% at sixteen, while general accuracy declines from 59.5% to 41.4%. Use the fixed target and retention evaluation to choose training length.",
      "image": {
        "src": "lecture-9-1/sft-epochs.svg",
        "alt": "HumanEval peaks at eight epochs and falls at sixteen; general accuracy declines throughout."
      },
      "source": {
        "label": "LoRA Learns Less and Forgets Less · Biderman et al.",
        "url": "https://arxiv.org/abs/2405.09673"
      }
    },
    {
      "title": "Part 4 — LoRA",
      "section": "LoRA",
      "textAnchor": "lora",
      "kind": "divider",
      "notes": "This part covers lora. Use the chapter for the full discussion and references."
    },
    {
      "title": "Full fine-tuning stores a complete model per task",
      "section": "LoRA",
      "textAnchor": "full-tuning-cost",
      "kind": "table",
      "notes": "These are the original LoRA paper’s GPT-3 figures for its specified training setup. Full fine-tuning updates all weights and stores a full checkpoint per task. The memory numbers include training state and are not universal estimates for every optimizer or precision.",
      "headers": [
        "GPT-3 175B",
        "Full fine-tuning"
      ],
      "rows": [
        [
          "Training GPU memory",
          "1.2 TB"
        ],
        [
          "Checkpoint for one task",
          "350 GB"
        ],
        [
          "100 task checkpoints",
          "35 TB"
        ]
      ],
      "source": {
        "label": "LoRA · Hu et al.",
        "url": "https://arxiv.org/abs/2106.09685"
      }
    },
    {
      "title": "LoRA learns a low-rank weight update",
      "section": "LoRA",
      "textAnchor": "lora-update",
      "kind": "formula",
      "notes": "Only the factor matrices are trained for this update. A starts random and B starts at zero, so the initial correction is zero. Alpha here scales LoRA and is unrelated to the earlier replay share. The training objective can still be CPT or SFT.",
      "formula": "W′ = W₀ + (α/r)BA; B ∈ ℝ^(dout×r), A ∈ ℝ^(r×din)",
      "formulaAnchor": "lora-update",
      "formulaLayout": "legend",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "W₀, W′",
          "Frozen matrix; adapted matrix"
        ],
        [
          "A, B",
          "Two trainable factor matrices"
        ],
        [
          "din, dout",
          "Input width; output width"
        ],
        [
          "r",
          "Shared inner dimension (rank)"
        ],
        [
          "α, α/r",
          "Scale constant; update multiplier"
        ],
        [
          "BA",
          "Factor product: weight correction"
        ],
        [
          "ℝ, ∈, ×",
          "Real numbers; membership; dimensions"
        ]
      ],
      "formulaExplanation": "Add the scaled factor product to the frozen matrix.",
      "termMath": {
        "din, dout": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>d</mi><mi>in</mi></msub><mo>,</mo><msub><mi>d</mi><mi>out</mi></msub></math>"
      }
    },
    {
      "title": "Rank 16 uses 131,072 trainable parameters",
      "section": "LoRA",
      "textAnchor": "lora-matrices",
      "kind": "image",
      "notes": "Each factor has 65,536 values: 4,096 times 16. Together they have 131,072 values compared with 16,777,216 in the full matrix, or 0.78125%. The drawing emphasizes the thin factor dimensions rather than exact scale; the original matrix remains stored and frozen.",
      "image": {
        "src": "lecture-9-1/lora-matrices.svg",
        "alt": "A 4096 by 4096 weight matrix has 16777216 parameters; rank-16 factors total 131072, or 0.78%."
      }
    },
    {
      "title": "LoRA reduces adaptation storage and training memory",
      "section": "LoRA",
      "textAnchor": "lora-costs",
      "kind": "table",
      "notes": "The paper uses rank four on query and value projections for these figures. LoRA task checkpoints store adapters; the shared base still has to be stored. The paper also reports about 25% faster training, and merging the correction into the base weights avoids an additional inference branch.",
      "headers": [
        "GPT-3 175B",
        "Full fine-tuning",
        "LoRA"
      ],
      "rows": [
        [
          "Training GPU memory",
          "1.2 TB",
          "350 GB"
        ],
        [
          "Task checkpoint",
          "350 GB",
          "35 MB"
        ],
        [
          "100 task variants",
          "35 TB",
          "354 GB"
        ]
      ],
      "source": {
        "label": "LoRA · Hu et al.",
        "url": "https://arxiv.org/abs/2106.09685"
      }
    },
    {
      "title": "LoRA retains more general ability during code CPT",
      "section": "LoRA",
      "textAnchor": "lora-tradeoff",
      "kind": "table",
      "notes": "The target benchmark is HumanEval; general accuracy averages HellaSwag, WinoGrande and ARC-Challenge. In this CPT setting, every tested LoRA rank learns less code performance than full fine-tuning but preserves more general performance. This is a result of the reported setup, not a universal guarantee.",
      "headers": [
        "20B code tokens",
        "HumanEval pass@1 (Python code)",
        "Mean accuracy: HellaSwag, WinoGrande, ARC-Challenge"
      ],
      "rows": [
        [
          "Full fine-tuning",
          "26.3%",
          "54.5%"
        ],
        [
          "LoRA rank 16",
          "16.2%",
          "63.5%"
        ],
        [
          "LoRA rank 64",
          "19.6%",
          "62.6%"
        ],
        [
          "LoRA rank 256",
          "22.4%",
          "61.7%"
        ]
      ],
      "source": {
        "label": "LoRA Learns Less and Forgets Less · Biderman et al.",
        "url": "https://arxiv.org/abs/2405.09673"
      }
    },
    {
      "title": "Higher-rank LoRA can match full SFT",
      "section": "LoRA",
      "textAnchor": "lora-tradeoff",
      "kind": "table",
      "notes": "HumanEval tests Python functions against unit tests; pass@1 measures success for one generated solution. The general score averages HellaSwag (event continuations), WinoGrande (pronoun resolution) and ARC-Challenge (science questions). At four SFT epochs rank 256 matches or exceeds the reported full-fine-tuning target score while retaining more general accuracy. Lower ranks underperform on the target in this setting. The authors recommend LoRA for SFT, full fine-tuning for CPT, and testing rank and learning rate rather than treating a small adapter as automatically sufficient.",
      "headers": [
        "4 SFT epochs",
        "HumanEval pass@1 (Python code)",
        "Mean accuracy: HellaSwag, WinoGrande, ARC-Challenge"
      ],
      "rows": [
        [
          "Full fine-tuning",
          "47.0%",
          "51.2%"
        ],
        [
          "LoRA rank 16",
          "35.8%",
          "65.2%"
        ],
        [
          "LoRA rank 64",
          "41.7%",
          "63.2%"
        ],
        [
          "LoRA rank 256",
          "49.8%",
          "63.1%"
        ]
      ],
      "source": {
        "label": "LoRA Learns Less and Forgets Less · Biderman et al.",
        "url": "https://arxiv.org/abs/2405.09673"
      }
    }
  ]
};

export default deck;
