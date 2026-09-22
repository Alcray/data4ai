export function KarginBenchPage() {
  return (
    <article className="main-content lecture-content course-section-page">
      <h1>KarginBench</h1>

      <p>
        Your goal is to design, build, validate, and evaluate a benchmark that measures how well
        language models understand culturally recognizable expressions from <em>Կարգին
        հաղորդում</em>.
      </p>

      <p>The benchmark should investigate at least two capabilities:</p>

      <ol>
        <li>
          <strong>Recognition / recall</strong> — whether a model can recognize or complete a
          familiar expression from an appropriate cue.
        </li>
        <li>
          <strong>Contextual use</strong> — whether a model can appropriately use such an
          expression in a new situation that was not taken directly from the original material.
        </li>
      </ol>

      <p>You are responsible for deciding the benchmark methodology.</p>

      <p>This includes decisions about:</p>

      <ul>
        <li>benchmark structure;</li>
        <li>data representation;</li>
        <li>source selection and provenance;</li>
        <li>annotation guidelines;</li>
        <li>handling of spelling, wording, and transliteration variants;</li>
        <li>treatment of ambiguous or multiple valid answers;</li>
        <li>quality-control procedures;</li>
        <li>division of work among team members;</li>
        <li>evaluation metrics;</li>
        <li>automatic versus human evaluation;</li>
        <li>benchmark splits;</li>
        <li>model selection;</li>
        <li>error analysis.</li>
      </ul>

      <h2>Requirements</h2>

      <p>The final benchmark must:</p>

      <ul>
        <li>use only material permitted for the project;</li>
        <li>provide traceable provenance for source-dependent items;</li>
        <li>distinguish source-derived material from newly created test situations;</li>
        <li>include a documented quality-control procedure;</li>
        <li>prevent obvious leakage between evaluation subsets;</li>
        <li>include an evaluation procedure that can be reproduced;</li>
        <li>evaluate multiple language models;</li>
        <li>report the limitations of the benchmark;</li>
        <li>preserve information about individual authorship and review of benchmark items.</li>
      </ul>

      <p>The team must justify important methodological choices rather than simply state them.</p>

      <h2>Individual responsibility</h2>

      <p>
        The work must be divided into substantial and approximately equal individual
        contributions.
      </p>

      <p>
        Each team member must have clearly attributable responsibilities and evidence of their
        work.
      </p>

      <p>
        The division does not need to be identical for every student. For example, technical
        benchmark engineering may be an appropriate substantial contribution for a student who
        does not speak Armenian.
      </p>

      <p>
        Each student will individually defend their contribution and demonstrate understanding
        of the relevant methodological decisions.
      </p>

      <h2>Final deliverables</h2>

      <p>The group should submit:</p>

      <ul>
        <li>the benchmark dataset;</li>
        <li>annotation and data-collection guidelines;</li>
        <li>provenance information;</li>
        <li>quality-control and review records;</li>
        <li>evaluation code;</li>
        <li>outputs from evaluated models;</li>
        <li>quantitative results;</li>
        <li>qualitative error analysis;</li>
        <li>documentation describing methodology and limitations;</li>
        <li>a contribution statement identifying each student&apos;s work.</li>
      </ul>

      <h2>Evaluation</h2>

      <p>The project will be assessed primarily on:</p>

      <ul>
        <li>benchmark validity;</li>
        <li>data and annotation quality;</li>
        <li>methodological reasoning;</li>
        <li>reproducibility;</li>
        <li>quality of evaluation;</li>
        <li>handling of ambiguity and failure cases;</li>
        <li>quality of individual contributions;</li>
        <li>ability to defend methodological decisions.</li>
      </ul>

      <p>Dataset size alone is not a measure of project quality.</p>
    </article>
  );
}
