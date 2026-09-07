"use client";

import { useMemo, useState } from "react";

const readingClubSchedule = [
  {
    theme: "Architecture",
    foundation: {
      date: "12 September",
      dateTime: "2026-09-12",
      title: "Attention Is All You Need",
      authors: "Vaswani et al., 2017",
      href: "https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf",
    },
    frontier: {
      date: "24 October",
      dateTime: "2026-10-24",
      title: "Gated Attention for Large Language Models",
      authors: "Qiu et al., NeurIPS 2025",
      href: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/904e89bb4e632e75fb47f093b620b257-Abstract-Conference.html",
    },
  },
  {
    theme: "Learning from missing text",
    foundation: {
      date: "19 September",
      dateTime: "2026-09-19",
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: "Devlin et al., NAACL 2019",
      href: "https://aclanthology.org/N19-1423/",
    },
    frontier: {
      date: "31 October",
      dateTime: "2026-10-31",
      title: "Large Language Diffusion Models (LLaDA)",
      authors: "Nie et al., NeurIPS 2025",
      href: "https://arxiv.org/abs/2502.09992",
    },
  },
  {
    theme: "Training data and compute",
    foundation: {
      date: "26 September",
      dateTime: "2026-09-26",
      title: "Training Compute-Optimal Large Language Models (Chinchilla)",
      authors: "Hoffmann et al., 2022",
      href: "https://arxiv.org/abs/2203.15556",
    },
    frontier: {
      date: "7 November",
      dateTime: "2026-11-07",
      title: "FineWeb2: One Pipeline to Scale Them All",
      authors: "Penedo et al., COLM 2025",
      href: "https://openreview.net/forum?id=jnRBe6zatP",
    },
  },
  {
    theme: "Retrieval and evidence",
    foundation: {
      date: "3 October",
      dateTime: "2026-10-03",
      title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
      authors: "Lewis et al., 2020",
      href: "https://papers.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html",
    },
    frontier: {
      date: "14 November",
      dateTime: "2026-11-14",
      title: "Synthesizing Scientific Literature with Retrieval-Augmented Language Models",
      authors: "Asai et al., Nature 2026",
      href: "https://www.nature.com/articles/s41586-025-10072-4",
    },
  },
  {
    theme: "Reasoning",
    foundation: {
      date: "10 October",
      dateTime: "2026-10-10",
      title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
      authors: "Wei et al., 2022",
      href: "https://arxiv.org/abs/2201.11903",
    },
    frontier: {
      date: "21 November",
      dateTime: "2026-11-21",
      title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
      authors: "DeepSeek-AI, 2025",
      href: "https://arxiv.org/abs/2501.12948",
    },
  },
  {
    theme: "Evaluation",
    foundation: {
      date: "17 October",
      dateTime: "2026-10-17",
      title: "Beyond Accuracy: Behavioral Testing of NLP Models with CheckList",
      authors: "Ribeiro et al., ACL 2020",
      href: "https://aclanthology.org/2020.acl-main.442/",
    },
    frontier: {
      date: "28 November",
      dateTime: "2026-11-28",
      title: "LLMs Get Lost in Multi-Turn Conversation",
      authors: "Laban et al., ICLR 2026; first preprint 2025",
      href: "https://openreview.net/forum?id=VKGTGGcwl6",
    },
  },
] as const;

const assignments = [
  {
    id: "A0",
    lectures: "Before L1",
    title: "Baseline and research contract",
    output: "Reproduce one checkpoint evaluation; create the repository, run manifest, and contribution rules.",
  },
  {
    id: "A1",
    lectures: "L1–2",
    title: "Language-model core",
    output: "Implement and test the tokenizer boundary, Transformer, optimizer, generation, and tiny-data overfit.",
  },
  {
    id: "A2",
    lectures: "L3–5",
    title: "Armenian corpus factory",
    output: "Build source manifests, extraction, language/variety labels, filtering, deduplication, and contamination audits.",
  },
  {
    id: "A3",
    lectures: "L6–7",
    title: "Tokenizer and mixture tournament",
    output: "Run 30–150M proxy models across tokenizer and language-mixture conditions under fixed compute.",
  },
  {
    id: "A4",
    lectures: "L8",
    title: "Systems qualification",
    output: "Profile distributed training, verify checkpoint recovery, and pass a 24-hour fault-injection rehearsal.",
  },
  {
    id: "A5",
    lectures: "After L8",
    title: "Cohort pretraining run",
    output: "Freeze data, tokenizer, architecture, and acceptance gates; operate one shared 0.8–1.1B run in monitored shifts.",
  },
  {
    id: "A6",
    lectures: "L9–10",
    title: "Evaluation, CPT, and SFT",
    output: "Freeze Armenian and retention suites; compare base, CPT, SFT, and CPT→SFT checkpoints.",
  },
  {
    id: "A7",
    lectures: "L11–13",
    title: "Preference and RLVR stage",
    output: "Audit preference pairs, train one direct-preference branch, and build one verifiable Armenian task environment.",
  },
  {
    id: "A8",
    lectures: "L14–16",
    title: "Data ablation and release",
    output: "Test synthetic or distilled data, red-team the selected checkpoint, and ship the reproducibility bundle and defense.",
  },
] as const;

export function ReadingClubPage() {
  return (
    <article className="main-content lecture-content course-section-page">
      <h1>Reading Club (NLP)</h1>
      <p>
        Each student is assigned one theme and presents its foundation paper in Round 1 and its
        frontier paper in Round 2.
      </p>

      <h2>Paper schedule <small>Fall 2026</small></h2>
      <p>
        The first round establishes the foundations. The second round returns to the same themes
        through newer work from the research frontier. Presenter assignments will be added after
        preference registration.
      </p>

      <div className="reading-club-table-wrap">
        <table className="reading-club-table" aria-label="Reading Club NLP paper schedule">
          <colgroup>
            <col className="reading-club-theme-column" />
            <col className="reading-club-paper-column" />
            <col className="reading-club-paper-column" />
            <col className="reading-club-presenter-column" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Theme</th>
              <th scope="col">Round 1: Foundations</th>
              <th scope="col">Round 2: Frontier</th>
              <th scope="col">Presenter</th>
            </tr>
          </thead>
          <tbody>
            {readingClubSchedule.map((block, index) => (
              <tr key={block.theme}>
                <th scope="row">
                  <span className="reading-club-block-number">Block {index + 1}</span>
                  {block.theme}
                </th>
                {[block.foundation, block.frontier].map((paper) => (
                  <td key={paper.title}>
                    <time dateTime={paper.dateTime}>{paper.date}</time>
                    <a href={paper.href} rel="noreferrer" target="_blank">
                      <em>{paper.title}</em>
                    </a>
                    <small>{paper.authors}</small>
                  </td>
                ))}
                <td><span className="reading-club-pending">Pending registration</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Pass criteria</h2>
      <ol className="reading-club-criteria">
        <li>
          <strong>Two satisfactory presentations</strong>
          <span>Present both assigned papers to the satisfactory standard below.</span>
        </li>
        <li>
          <strong>Attendance at 9 of 12 sessions</strong>
          <span>Presenting counts as attendance. Legitimate absences are handled individually.</span>
        </li>
        <li>
          <strong>Active participation</strong>
          <span>Contribute substantive questions or comments throughout the paper discussions.</span>
        </li>
      </ol>

      <h2>What counts as a satisfactory presentation</h2>
      <p>A satisfactory presentation demonstrates that the student can:</p>
      <ul>
        <li>explain the problem addressed by the paper;</li>
        <li>explain the main method;</li>
        <li>interpret the key experiments;</li>
        <li>identify at least one limitation; and</li>
        <li>answer reasonable questions about the paper.</li>
      </ul>

      <p>
        The presentation does not need to be perfect. If a presentation is not yet satisfactory,
        the student may revise it or present the relevant part again, subject to class
        availability.
      </p>
    </article>
  );
}

function ComputePlanner() {
  const [parameters, setParameters] = useState(1);
  const [tokens, setTokens] = useState(22);
  const [gpus, setGpus] = useState(8);
  const [throughput, setThroughput] = useState(24);

  const estimate = useMemo(() => {
    const wallHours = (tokens * 1_000_000_000) / (gpus * throughput * 1_000 * 3600);
    return {
      wallHours,
      gpuHours: wallHours * gpus,
      eflops: 6 * parameters * tokens,
    };
  }, [gpus, parameters, throughput, tokens]);

  return (
    <section className="compute-planner" aria-labelledby="compute-planner-title">
      <p className="interactive-learning-kicker">Planning tool</p>
      <h3 id="compute-planner-title">Pretraining budget estimator</h3>
      <p>
        Move the assumptions, not the conclusion. Throughput is sustained tokens per second
        per GPU; the default 24k follows the public TinyLlama A100 report.
      </p>

      <div className="compute-controls">
        <label>
          <span>Parameters <strong>{parameters.toFixed(1)}B</strong></span>
          <input
            max="1.2"
            min="0.2"
            onChange={(event) => setParameters(Number(event.target.value))}
            step="0.1"
            type="range"
            value={parameters}
          />
        </label>
        <label>
          <span>Training tokens <strong>{tokens}B</strong></span>
          <input
            max="40"
            min="2"
            onChange={(event) => setTokens(Number(event.target.value))}
            step="1"
            type="range"
            value={tokens}
          />
        </label>
        <label>
          <span>GPUs <strong>{gpus}</strong></span>
          <input
            max="16"
            min="1"
            onChange={(event) => setGpus(Number(event.target.value))}
            step="1"
            type="range"
            value={gpus}
          />
        </label>
        <label>
          <span>Throughput / GPU <strong>{throughput}k tok/s</strong></span>
          <input
            max="40"
            min="5"
            onChange={(event) => setThroughput(Number(event.target.value))}
            step="1"
            type="range"
            value={throughput}
          />
        </label>
      </div>

      <div className="compute-result" aria-live="polite">
        <div><strong>{estimate.wallHours.toFixed(1)} h</strong><span>ideal wall time</span></div>
        <div><strong>{estimate.gpuHours.toFixed(0)}</strong><span>GPU-hours</span></div>
        <div><strong>{estimate.eflops.toFixed(0)}</strong><span>training EFLOPs</span></div>
      </div>
      <small>
        Planning estimate: tokens ÷ sustained aggregate throughput. Reserve additional budget
        for proxy runs, failures, evaluation, SFT, and RL rollouts.
      </small>
    </section>
  );
}

export function ProjectsPage() {
  return (
    <article className="main-content lecture-content course-section-page">
      <h1>Projects</h1>
      <p>
        The project portfolio combines a detailed cohort proposal with early-stage ideas that
        could become future course projects.
      </p>

      <h2>Project ideas</h2>
      <p>
        The following directions are exploratory. Their scope, data requirements, evaluation,
        and infrastructure still need to be defined before they become assignments.
      </p>
      <div className="assignment-sequence">
        <section>
          <span>Idea</span>
          <div>
            <small>Corpus infrastructure</small>
            <strong>Research-grade Armenian book corpus</strong>
            <p>
              Build a versioned, machine-readable corpus from Armenian books. The pipeline
              would ingest born-digital and scanned works, recover text and layout, attach
              edition-level provenance and rights metadata, deduplicate content, and report
              quality and coverage. Training releases would include only public-domain,
              licensed, or explicitly permissioned works.
            </p>
          </div>
        </section>
        <section>
          <span>Idea</span>
          <div>
            <small>Reinforcement learning competition</small>
            <strong>RL racing arena</strong>
            <p>
              Build a racing game in which participants train agents—primarily through
              reinforcement learning—and compete on held-out tracks and randomized conditions.
              The instructor provides full environment access and a strong reference agent.
              Teams may use any model, LLM, algorithm, or development tool, provided submitted
              agents follow a common interface and evaluation budget.
            </p>
          </div>
        </section>
        <section>
          <span>Idea</span>
          <div>
            <small>Reinforcement learning strategy game</small>
            <strong>Hex-grid strategy agent</strong>
            <p>
              Build a turn-based strategy environment on a hexagonal map where agents capture
              territory, manage income, upgrade units, and construct defensive buildings.
              Students would design the observation and action spaces, mask illegal actions,
              compare sparse and shaped rewards, and train agents through actor–critic methods
              or self-play. Final agents would compete across map sizes and unseen scenarios.
              The project is inspired by the PyData case study <a href="https://www.youtube.com/watch?v=Cp2KOlwDix8">Mastering the Hex</a>.
            </p>
          </div>
        </section>
        <section>
          <span>Idea</span>
          <div>
            <small>Reasoning distillation</small>
            <strong>Synthetic reasoning traces for a smaller model</strong>
            <p>
              Use a frontier reasoning teacher, such as Kimi K3 or GLM-5.3, to generate long,
              explicit solution traces for a verifiable mathematics or coding dataset. Filter
              the traces by correctness, diversity, and contamination checks, then use
              supervised fine-tuning to teach smaller open models to produce their own reasoning
              traces. Compare base, answer-only, human-written, and teacher-trace training across
              several student sizes; evaluate accuracy, majority-vote performance, reasoning
              length, generalization, and generation cost. The experiment extends <a href="https://arxiv.org/abs/2507.09850">The Challenge of Teaching Reasoning to LLMs Without RL or Distillation</a> and uses only reasoning output the teacher intentionally exposes under its access and licensing terms.
            </p>
          </div>
        </section>
      </div>

      <h2>Shared Armenian model project <small>(draft)</small></h2>
      <p>
        The cohort will build one inspectable Armenian-focused language model together. Every
        student contributes to the same evidence chain; no student’s grade depends on whether
        one expensive run happens to produce a high benchmark score.
      </p>

      <div className="project-verdict">
        <strong>Feasibility verdict</strong>
        <p>
          A 0.8–1.1B model trained on roughly 20–30B tokens is technically feasible with a
          reserved multi-GPU cluster. It is not feasible as sixteen independent projects, and
          it is not credible if Wikipedia is treated as the entire corpus.
        </p>
      </div>

      <ComputePlanner />

      <h3>One project, three scales</h3>
      <div className="protocol-table">
        <table>
          <thead>
            <tr>
              <th>Scale</th>
              <th>Purpose</th>
              <th>Promotion gate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10–50M</td>
              <td>Unit tests, overfitting, pipeline integration, and fast failure</td>
              <td>Correctness and reproducibility</td>
            </tr>
            <tr>
              <td>30–150M</td>
              <td>Tokenizer, filters, mixtures, schedules, and scaling proxies</td>
              <td>Compute-matched target and retention evidence</td>
            </tr>
            <tr>
              <td>0.8–1.1B</td>
              <td>One cohort pretraining run followed by shared post-training branches</td>
              <td>Frozen artifacts, cluster rehearsal, and funded retry budget</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Armenian data program</h3>
      <p>
        Armenian Wikipedia is a high-quality, attributable seed—not a complete pretraining
        distribution. Wikimedia provides reproducible dumps and free-content licensing. The
        CulturaX dataset card reports approximately 2.4B Armenian tokens after its cleaning
        pipeline. Those facts make a 20B-token Armenian-first mixture possible only through
        additional cleared sources, controlled repetition, and multilingual transfer.
      </p>
      <ul>
        <li><strong>Open core:</strong> Armenian Wikipedia, Wikisource, Wikibooks, and other source-level compatible Wikimedia material.</li>
        <li><strong>Audited web:</strong> Armenian portions of multilingual corpora, retained only with source manifests and rights review.</li>
        <li><strong>Permissioned collections:</strong> educational, governmental, scientific, cultural, and institutional text with explicit terms.</li>
        <li><strong>Multilingual transfer:</strong> Armenian, English, and Russian proportions selected through proxy experiments rather than intuition.</li>
        <li><strong>Coverage:</strong> Eastern and Western Armenian, orthographies, code-switching, and domain slices are labelled and evaluated separately.</li>
      </ul>
      <p>
        Random websites are not admitted merely because they can be scraped. Every source must
        pass rights, provenance, privacy, quality, duplication, and evaluation-contamination
        gates.
      </p>

      <h3>Assignment sequence</h3>
      <div className="assignment-sequence">
        {assignments.map((assignment) => (
          <section key={assignment.id}>
            <span>{assignment.id}</span>
            <div>
              <small>{assignment.lectures}</small>
              <strong>{assignment.title}</strong>
              <p>{assignment.output}</p>
            </div>
          </section>
        ))}
      </div>

      <h3>Cohort organization</h3>
      <p>
        Students rotate through six groups: source and rights; extraction and quality;
        tokenizer and mixtures; training systems; evaluation; and post-training and safety.
        The shared repository accepts changes through reviewed pull requests. Data, model, and
        evaluation versions are frozen at explicit promotion gates.
      </p>

      <h3>Individual accountability inside one model</h3>
      <ul>
        <li>one owned artifact with tests and a reviewer;</li>
        <li>one reviewed contribution to another group;</li>
        <li>an individual experiment log including failed runs;</li>
        <li>two satisfactory Reading Club presentations;</li>
        <li>attendance at 9 of the 12 Reading Club paper sessions;</li>
        <li>active participation in Reading Club discussions;</li>
        <li>an oral defense connecting the contribution to a measured model decision.</li>
      </ul>

      <h3>Useful means evaluated</h3>
      <p>
        The target is not “a chatbot that speaks some Armenian.” The release should improve
        held-out Armenian language modeling and at least two declared user tasks while retaining
        multilingual competence. Candidate evaluation includes tokenizer fertility, held-out
        perplexity, Armenian reading comprehension and reasoning, FLORES translation, native
        human preference, memorization, and contamination tests.
      </p>

      <h3>Primary planning references</h3>
      <ul>
        <li><a href="https://github.com/jzhang38/TinyLlama">TinyLlama training throughput and 1.1B reference implementation</a></li>
        <li><a href="https://dumps.wikimedia.org/hywiki/latest/">Official Armenian Wikipedia dumps</a></li>
        <li><a href="https://developer.wikimedia.org/use-content/content/">Wikimedia content reuse guidance</a></li>
        <li><a href="https://huggingface.co/datasets/uonlp/CulturaX">CulturaX dataset card and Armenian statistics</a></li>
        <li><a href="https://github.com/facebookresearch/flores/blob/main/flores200/README.md">FLORES-200 Armenian evaluation resources</a></li>
        <li><a href="https://arxiv.org/abs/2406.14425">SynDARin Armenian reasoning benchmark</a></li>
      </ul>
    </article>
  );
}
