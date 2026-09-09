const readingClubSchedule = [
  {
    theme: "Architecture",
    presenter: "Armen Vahanyan",
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
    presenter: "Tatevik Minasyan",
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
    presenter: "Anastasia Vorobyeva",
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
    presenter: "Vladimir Avanyan",
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
    presenter: "Roman Sahakyan",
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
    presenter: "Mikayel Saghatelyan",
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
                <td>{block.presenter}</td>
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
