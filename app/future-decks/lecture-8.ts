import type { LectureDeck } from "./robotics-types";

const deck: LectureDeck = {
  "number": 8,
  "title": "Robot learning and vision-language-action models",
  "textAnchor": "robot-policies",
  "slides": [
    {
      "title": "Part 1 — Robot policies and their data",
      "section": "Part I — Robot policies and their data",
      "textAnchor": "robot-policies",
      "kind": "divider",
      "notes": "Introduce the observation-to-action interface before comparing models. Keep the distinction between recognizing an object and producing commands for a particular physical robot explicit.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      }
    },
    {
      "title": "Robot policies operate in a feedback loop",
      "section": "1. Observation, action, and feedback",
      "textAnchor": "control-loop",
      "kind": "image",
      "notes": "The policy selects commands; a controller executes them on the physical robot. Each action changes the next observation, so prediction errors can change the states the policy encounters.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "image": {
        "src": "lecture-8/robot-feedback-loop.svg?v=5b4077df372e",
        "alt": "Closed loop: observe images and robot state, predict commands, execute through a controller, change the scene, and observe again."
      }
    },
    {
      "title": "A VLM outputs text or spatial data",
      "section": "2. Perception models and action policies",
      "textAnchor": "vlm-interface",
      "kind": "image",
      "notes": "The output here is an answer or image geometry. A location in pixels is not a joint target; moving to it requires a separate action policy or skill.",
      "source": {
        "label": "Functional VLM schema · Perception outputs"
      },
      "image": {
        "src": "lecture-8/vlm-interface.svg?v=7bb163b99b68",
        "alt": "The output here is an answer or image geometry. A location in pixels is not a joint target; moving to it requires a separate action policy or skill."
      }
    },
    {
      "title": "A tool-using agent calls an existing robot skill",
      "section": "2. Perception models and action policies",
      "textAnchor": "tool-agent-interface",
      "kind": "image",
      "notes": "The skill call is a schematic example, not a vendor API signature. The motion skill may contain a planner or learned policy; it supplies commands that the robot controller executes.",
      "source": {
        "label": "Functional tool-use schema · Perceptron interface",
        "url": "https://www.perceptron.inc/blog/introducing-perceptron-mk1-5"
      },
      "image": {
        "src": "lecture-8/tool-agent-interface.svg?v=90a0c3f59d70",
        "alt": "The skill call is a schematic example, not a vendor API signature. The motion skill may contain a planner or learned policy; it supplies commands that the robot controller executes."
      }
    },
    {
      "title": "ACT outputs numerical joint-target chunks",
      "section": "2. Perception models and action policies",
      "textAnchor": "act-interface",
      "kind": "image",
      "notes": "This diagram shows inference, with the training-only CVAE encoder removed and the latent set to the prior mean. Original ACT uses images and joint state without language. Restore action scale and select or ensemble commands before the controller tracks joint targets.",
      "source": {
        "label": "Original ACT · Schematic action values",
        "url": "https://tonyzhaozh.github.io/aloha/"
      },
      "image": {
        "src": "lecture-8/act-interface.svg?v=79544f5ca72a",
        "alt": "This diagram shows inference, with the training-only CVAE encoder removed and the latent set to the prior mean. Original ACT uses images and joint state without language. Restore action scale and select or ensemble commands before the controller tracks joint targets."
      }
    },
    {
      "title": "A token-based VLA decodes tokens into actions",
      "section": "2. Perception models and action policies",
      "textAnchor": "token-vla-interface",
      "kind": "image",
      "notes": "Token IDs index action bins. The fixed decoder maps them to bin centers and unnormalizes them with dataset statistics. End-effector translation, rotation, and gripper values still require a robot controller to produce joint movement; action semantics depend on the training dataset.",
      "source": {
        "label": "Original OpenVLA · Deterministic action decoder",
        "url": "https://github.com/openvla/openvla/blob/main/prismatic/extern/hf/modeling_prismatic.py"
      },
      "image": {
        "src": "lecture-8/token-vla-interface.svg?v=be5cf3df09f4",
        "alt": "Token IDs index action bins. The fixed decoder maps them to bin centers and unnormalizes them with dataset statistics. End-effector translation, rotation, and gripper values still require a robot controller to produce joint movement; action semantics depend on the training dataset."
      }
    },
    {
      "title": "A continuous VLA outputs numerical action chunks",
      "section": "2. Perception models and action policies",
      "textAnchor": "continuous-vla-interface",
      "kind": "image",
      "notes": "Shown is the joint-target interface used with an ALOHA-style embodiment. The flow action expert generates continuous chunks. Normalization and robot-specific transformations are undone before selected commands reach the controller; continuous output does not imply direct motor torque prediction.",
      "source": {
        "label": "π0 / openpi · Joint-target interface; schematic values",
        "url": "https://github.com/Physical-Intelligence/openpi/blob/main/src/openpi/policies/aloha_policy.py"
      },
      "image": {
        "src": "lecture-8/continuous-vla-interface.svg?v=86c19388bf9c",
        "alt": "Shown is the joint-target interface used with an ALOHA-style embodiment. The flow action expert generates continuous chunks. Normalization and robot-specific transformations are undone before selected commands reach the controller; continuous output does not imply direct motor torque prediction."
      }
    },
    {
      "title": "Demonstrations align observations and commands",
      "section": "3. A demonstration is a timed trajectory",
      "textAnchor": "trajectory-data",
      "kind": "specimen",
      "notes": "This is a constructed record, not a hardware configuration. Camera timing, measured robot state, and commanded targets must refer to the intended decision; joint units and action semantics travel with the data.",
      "source": {
        "label": "Constructed example · Trajectory record"
      },
      "specimens": [
        {
          "label": "One step in an episode",
          "text": "episode: cup-012; step: 40\ninstruction: put the cup in the tray\nimages: front frame + wrist frame\nstate: measured joints + gripper\naction: commanded joints + gripper\nmetadata: units, frames, frequency"
        }
      ]
    },
    {
      "title": "A policy can predict several future actions",
      "section": "4. Policies can predict action chunks",
      "textAnchor": "action-chunks",
      "kind": "formula",
      "notes": "The dots inside the action sequence mean consecutive commands. The centered dot denotes the action argument of the conditional distribution; a deterministic policy chooses one output, and original ACT omits the language input.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "formulaAnchor": "chunk-equations",
      "termMath": {
        "πθ, θ": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>π</mi><mi>θ</mi></msub><mo>,</mo><mi>θ</mi></math>"
      },
      "formula": "Aₜ = (aₜ, …, aₜ₊H₋₁)\nAₜ ∼ πθ(· | oₜ, sₜ, ℓ)",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "Aₜ, aₜ",
          "Action chunk; one action vector"
        ],
        [
          "t, H",
          "Control step; predicted step count"
        ],
        [
          "oₜ, sₜ",
          "Visual observations; robot state"
        ],
        [
          "ℓ",
          "Language instruction"
        ],
        [
          "πθ, θ",
          "Policy distribution; learned parameters"
        ],
        [
          "∼, ·",
          "Sampled from; action argument"
        ]
      ],
      "formulaLayout": "legend",
      "formulaExplanation": "The bar | means ‘given’; … continues the action sequence."
    },
    {
      "title": "Example: prediction and feedback horizons",
      "section": "4. Policies can predict action chunks",
      "textAnchor": "chunk-example",
      "kind": "table",
      "notes": "Assume sensing and inference are fast enough to deliver the chosen feedback interval. A longer predicted trajectory does not by itself increase the rate at which new observations influence control.",
      "source": {
        "label": "Constructed example · Action chunk timing"
      },
      "headers": [
        "Quantity",
        "Constructed value"
      ],
      "rows": [
        [
          "Control rate",
          "20 commands / second"
        ],
        [
          "Predicted chunk",
          "10 commands · 0.5 seconds"
        ],
        [
          "Executed before replanning",
          "2 commands · 0.1 seconds"
        ]
      ]
    },
    {
      "title": "Part 2 — Model families and training",
      "section": "Part II — Model families and training",
      "textAnchor": "model-families",
      "kind": "divider",
      "notes": "Compare models by their inputs, action representation, and training supervision. Behavior cloning describes a learning goal, while ACT, token prediction, diffusion, and flow matching implement it differently.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      }
    },
    {
      "title": "Behavior cloning learns from demonstrated actions",
      "section": "5. Demonstration learning and model types",
      "textAnchor": "imitation-learning",
      "kind": "formula",
      "notes": "This is a general probabilistic objective, not a claim that all implementations optimize this exact expression directly. ACT uses reconstruction and latent regularization, diffusion learns denoising, and flow matching learns a velocity field.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "formulaAnchor": "bc-equation",
      "termMath": {
        "θ, pθ": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><mi>θ</mi><mo>,</mo><msub><mi>p</mi><mi>θ</mi></msub></math>",
        "ℒBC": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\"><msub><mi>ℒ</mi><mtext>BC</mtext></msub></math>"
      },
      "formula": "ℒBC(θ) = −(1/N) Σᵢ log pθ(Aᵢ | cᵢ)",
      "headers": [
        "Term",
        "Meaning"
      ],
      "rows": [
        [
          "i, N, Σᵢ",
          "Window index; window count; sum"
        ],
        [
          "Aᵢ",
          "Demonstrated action chunk"
        ],
        [
          "cᵢ",
          "Observations, state, and any instruction"
        ],
        [
          "θ, pθ",
          "Parameters; conditional action distribution"
        ],
        [
          "ℒBC",
          "Mean negative log-likelihood"
        ],
        [
          "log",
          "Natural logarithm"
        ]
      ],
      "formulaLayout": "legend",
      "formulaExplanation": "The bar | means ‘given’. Models use different practical losses."
    },
    {
      "title": "ACT learns vision-and-state action chunks",
      "section": "6. ACT predicts chunks from vision and state",
      "textAnchor": "act",
      "kind": "table",
      "notes": "Original ACT is not language-conditioned. Its conditional variational autoencoder learns variation in demonstrations; at deployment the training encoder is removed, and overlapping chunk predictions can be temporally ensembled.",
      "source": {
        "label": "ACT · Zhao et al. 2023",
        "url": "https://tonyzhaozh.github.io/aloha/"
      },
      "headers": [
        "Stage",
        "Original ACT"
      ],
      "rows": [
        [
          "Inputs",
          "Camera images and joint positions"
        ],
        [
          "Training",
          "Action reconstruction + latent regularization"
        ],
        [
          "Inference",
          "Latent fixed to prior mean"
        ],
        [
          "Output",
          "Joint-target chunks"
        ],
        [
          "Conditioning",
          "No language input in original ACT"
        ]
      ]
    },
    {
      "title": "Action representations vary across policy families",
      "section": "7. Actions can be generated in different ways",
      "textAnchor": "action-models",
      "kind": "table",
      "notes": "These rows compare action interfaces rather than rank overall capability. Language conditioning is separate: original ACT and Diffusion Policy are visuomotor methods, while original OpenVLA and pi-zero explicitly condition on language.",
      "source": {
        "label": "ACT; Diffusion Policy; OpenVLA; π0 · Primary sources in chapter"
      },
      "headers": [
        "Model",
        "Actions",
        "Generation"
      ],
      "rows": [
        [
          "ACT",
          "Joint-target chunks",
          "Latent imitation model"
        ],
        [
          "Diffusion Policy",
          "Continuous sequences",
          "Iterative denoising"
        ],
        [
          "Original OpenVLA",
          "Action tokens",
          "Autoregressive prediction"
        ],
        [
          "π0",
          "Continuous chunks",
          "Flow-based action expert"
        ]
      ]
    },
    {
      "title": "π0 connects a VLM to continuous robot actions",
      "section": "8. π0 transfers visual and language representations",
      "textAnchor": "pi0",
      "kind": "flow",
      "notes": "A pretrained VLM supplies visual and language representations; robot trajectories train their connection to continuous actions. Flow matching learns to transform a noisy chunk into an action prediction, and adaptation specializes a compatible base policy.",
      "source": {
        "label": "π0 · Physical Intelligence",
        "url": "https://www.pi.website/blog/pi0"
      },
      "items": [
        "Pretrained vision-language model",
        "Robot trajectory training",
        "Flow-based action expert",
        "Adaptation to target data"
      ]
    },
    {
      "title": "Different data sources teach different capabilities",
      "section": "8. π0 transfers visual and language representations",
      "textAnchor": "pi0",
      "kind": "table",
      "notes": "Pi-zero-point-five uses heterogeneous co-training to improve generalization. The table describes the role of each data type; none alone establishes reliable control on every robot and task.",
      "source": {
        "label": "π0.5 · Physical Intelligence",
        "url": "https://www.pi.website/blog/pi05"
      },
      "headers": [
        "Data",
        "Learning signal"
      ],
      "rows": [
        [
          "Image and language data",
          "Objects, concepts, instructions"
        ],
        [
          "Robot trajectories",
          "Observation-to-action behavior"
        ],
        [
          "Semantic task labels",
          "Subtask and goal structure"
        ],
        [
          "Local demonstrations",
          "Target setup and task behavior"
        ]
      ]
    },
    {
      "title": "Perceptron models expose different action interfaces",
      "section": "9. Perceptron separates agent tools and action generation",
      "textAnchor": "perceptron",
      "kind": "table",
      "notes": "The public descriptions distinguish Mk1.5 tool-based embodied applications from Isaac 0.5 action decoders. Both can contribute to a robot system, but a tool call depends on the skill or controller exposed behind it.",
      "source": {
        "label": "Perceptron release descriptions · Checked 30 October 2026",
        "url": "https://www.perceptron.inc/blog/introducing-perceptron-mk1-5"
      },
      "headers": [
        "Model",
        "Interface",
        "Robot connection"
      ],
      "rows": [
        [
          "Mk1.5",
          "Text, spatial outputs, tool calls",
          "Invoke exposed skills"
        ],
        [
          "Isaac 0.5",
          "Flow chunks or FAST action tokens",
          "Learn robot action generation"
        ]
      ]
    },
    {
      "title": "Isaac 0.5 combines video and robot supervision",
      "section": "9. Perceptron separates agent tools and action generation",
      "textAnchor": "perceptron",
      "kind": "table",
      "notes": "Perceptron describes joint training on perception, future semantic descriptions, and control through a shared backbone. Its reported reduction in teleoperation data is tied to an action-loss target, not a guarantee of equal robot success or a universal local demonstration budget.",
      "source": {
        "label": "Isaac 0.5 · Perceptron",
        "url": "https://www.perceptron.inc/blog/introducing-isaac-0-5"
      },
      "headers": [
        "Training signal",
        "What it contributes"
      ],
      "rows": [
        [
          "Video and spatial grounding",
          "Scene and object relations"
        ],
        [
          "Task progress and future descriptions",
          "Temporal and semantic structure"
        ],
        [
          "Robot state and action trajectories",
          "Physical action supervision"
        ],
        [
          "Shared backbone",
          "Representations used by action decoders"
        ]
      ]
    },
    {
      "title": "Part 3 — Adapting to a local robot and task",
      "section": "Part III — Adapting to a local robot and task",
      "textAnchor": "local-adaptation",
      "kind": "divider",
      "notes": "A pretrained model can transfer useful representations while still mismatching the deployment setup. Identify the difference, repair interfaces, and use local data where learned behavior needs adaptation.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      }
    },
    {
      "title": "Local conditions change the control problem",
      "section": "10. General knowledge does not specify local controls",
      "textAnchor": "adaptation-gap",
      "kind": "table",
      "notes": "Fine-tuning often helps when deployment differs from training, but some compatible policies generalize without it. Action-unit and joint-order mistakes are interface bugs to correct before fitting a model.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "headers": [
        "Difference",
        "Required evidence"
      ],
      "rows": [
        [
          "Robot and gripper",
          "Reachable motions and grasps"
        ],
        [
          "Cameras",
          "Appearance-to-motion relation"
        ],
        [
          "Action convention",
          "Units, joint order, coordinate frames"
        ],
        [
          "Timing",
          "Frequency and physical response"
        ],
        [
          "Task and environment",
          "Outcomes and recovery behavior"
        ]
      ]
    },
    {
      "title": "Example: moving a camera changes observations",
      "section": "10. General knowledge does not specify local controls",
      "textAnchor": "camera-example",
      "kind": "table",
      "notes": "This constructed example keeps robot geometry and the task fixed while changing the visual mapping. Compare restoring the expected camera configuration with adaptation on new-view demonstrations before assuming a larger dataset is the only remedy.",
      "source": {
        "label": "Constructed example · Camera placement shift"
      },
      "headers": [
        "Condition",
        "Possible result"
      ],
      "rows": [
        [
          "Original camera view",
          "Grasps match the learned mapping"
        ],
        [
          "Moved camera",
          "Object recognized; grasp misaligned"
        ],
        [
          "New-view demonstrations",
          "Evidence for adapting the policy"
        ]
      ]
    },
    {
      "title": "Adapt a compatible policy using local demonstrations",
      "section": "10. General knowledge does not specify local controls",
      "textAnchor": "adaptation-gap",
      "kind": "flow",
      "notes": "Fine-tuning updates a pretrained policy; training an ACT task policy may instead start from a visual backbone and newly learned action modules. Keep a compatible baseline and measure whether local adaptation improves complete trials.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "items": [
        "Check observation and action interfaces",
        "Collect aligned demonstrations",
        "Update policy parameters",
        "Compare held-out robot trials"
      ]
    },
    {
      "title": "Demonstrations should cover deployment variation",
      "section": "11. Collect variation that matches the task",
      "textAnchor": "local-data",
      "kind": "table",
      "notes": "Coverage matters more than repeating an identical recording. For language conditioning, comparable scenes with different requested targets provide evidence that the instruction affects the desired behavior.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "headers": [
        "Vary",
        "Purpose"
      ],
      "rows": [
        [
          "Object poses and starting states",
          "Reach and grasp coverage"
        ],
        [
          "Lighting and backgrounds",
          "Appearance variation"
        ],
        [
          "Instructions and target objects",
          "Language grounding"
        ],
        [
          "Small disturbances and corrections",
          "Recovery coverage"
        ],
        [
          "Acquisition sessions",
          "Reduce session-specific shortcuts"
        ]
      ]
    },
    {
      "title": "Check the data contract before fitting the policy",
      "section": "11. Collect variation that matches the task",
      "textAnchor": "local-data",
      "kind": "points",
      "notes": "A timestamp error can pair a frame with an inappropriate command, and an incorrect inverse normalization can change execution. Preserve the adapters and training-split statistics with the checkpoint so the deployed policy matches the training contract.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "items": [
        "Synchronize observations and commands",
        "Validate units, frames, and joint order",
        "Identify failed and truncated episodes",
        "Preserve normalization and inverse transforms"
      ]
    },
    {
      "title": "Evaluate complete trials on held-out conditions",
      "section": "12. Adaptation must improve closed-loop behavior",
      "textAnchor": "robot-evaluation",
      "kind": "table",
      "notes": "Split by episode and appropriate collection conditions rather than adjacent frames. Compare the baseline and adapted policy under matched trials, retaining failures in the denominator and logging interventions.",
      "source": {
        "label": "Lecture 7.5 · Robot learning and VLAs"
      },
      "headers": [
        "Measure",
        "Why"
      ],
      "rows": [
        [
          "Task success",
          "Did the physical goal occur?"
        ],
        [
          "Completion time",
          "How efficiently was it completed?"
        ],
        [
          "Interventions",
          "How much assistance was required?"
        ],
        [
          "Failure categories",
          "Which new data may help?"
        ]
      ]
    }
  ]
};

export default deck;
