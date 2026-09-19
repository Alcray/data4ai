import { useMemo, type ReactNode } from "react";
import { Slide } from "@revealjs/react";
import Presentation from "./Lecture1Presentation";
import { lecture3Html } from "./generated/lecture-3";
import "./Lecture3Presentation.css";

function readArticle() {
  const doc = new DOMParser().parseFromString(lecture3Html, "text/html");
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
  const intro: string[] = [];
  let node = doc.querySelector("header")?.nextElementSibling;
  while (node && node.tagName !== "H2") {
    const text = node.textContent?.trim();
    if (text) intro.push(text);
    node = node.nextElementSibling;
  }
  return { notes, intro: intro.join("\n\n") };
}

function Objectives({ items }: { items: string[] }) {
  return <div className="l3-objectives">{items.map((item, index) => <div key={item}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item}</span></div>)}</div>;
}

function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <table className="l3-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>;
}

function Arrow() {
  return <i className="l3-arrow" aria-hidden="true">→</i>;
}

const receipt = [
  "repo_id   organization/dataset",
  "revision  0123456789abcdef…",
  "path      data/train-000.parquet",
  "bytes     184234182",
  "sha256    f61d…",
  "status    verified",
].join("\n");

const generatedReceipt = [
  "{",
  '  "record_id": "response-0042",',
  '  "parent_ids": ["seed-0007"],',
  '  "teacher_run": "teacher-run-017",',
  '  "request": {',
  '    "prompt": "Solve 3x + 5 = 20.",',
  '    "temperature": 0.7',
  "  },",
  '  "response": "... x = 5",',
  '  "review": {',
  '    "status": "accepted",',
  '    "verifier": "equation-check-v1"',
  "  }",
  "}",
].join("\n");

const frozenPlan = [
  '{',
  '  "plan_id": "technical-web-pilot-v1",',
  '  "crawl": "CC-MAIN-YYYY-NN",',
  '  "url": "https://example.edu/physics/lesson-7",',
  '  "filename": "crawl-data/.../file.warc.gz",',
  '  "offset": 120000,',
  '  "length": 8000,',
  '  "capture_time": "2026-02-14T08:31:04Z"',
  '}',
].join("\n");

const repositorySpec = [
  'source_spec = {',
  '  "repo_id": "organization/example-dataset",',
  '  "commit": "0123456789abcdef…",',
  '  "files": ["data/*.parquet", "README.md"]',
  '}',
  '',
  'snapshot_download(',
  '  revision=source_spec["commit"],',
  '  allow_patterns=source_spec["files"]',
  ')',
].join("\n");

const rightsRecord = [
  '{',
  '  "artifact": "source-release-2026-09",',
  '  "notice_version": "2026-09-03",',
  '  "reviewed_uses": {',
  '    "internal_analysis": "approved",',
  '    "training": "approved",',
  '    "text_redistribution": "restricted"',
  '  },',
  '  "review_date": "2026-09-18",',
  '  "conditions": ["preserve attribution"]',
  '}',
].join("\n");

export default function Lecture3Presentation({ onExit }: { onExit: () => void }) {
  const article = useMemo(() => readArticle(), []);
  const slide = (title: string, section: string, content: ReactNode, source?: ReactNode) => (
    <Slide key={title} className="lecture-presentation-slide l3-slide" notes={article.notes(section)}>
      <div className="lp-slide-shell">
        <header className="lp-slide-header"><p className="lp-kicker">LECTURE 3 · CORPUS ENGINEERING</p><h2>{title}</h2></header>
        <div className="lp-slide-body">{content}</div>
        {source && <footer className="lp-source">{source}</footer>}
      </div>
    </Slide>
  );

  const slides = <>
    <Slide className="lecture-presentation-slide lp-title-slide" notes={article.intro}>
      <div className="lp-title-shell l3-title-shell">
        <p className="lp-kicker">DATA FOR AI · LECTURE 3 OF 16</p>
        <h1>Corpus design, acquisition,<br /><span>and provenance</span></h1>
        <p className="lp-title-hint">→ arrows to navigate · O overview · S speaker view · F full screen · Q exit</p>
      </div>
    </Slide>

    {slide("What you should be able to do", "Learning objectives", <Objectives items={[
      "Specify population, frame, and stop rule",
      "Separate collection, audit, and training",
      "Freeze reproducible source snapshots",
      "Separate record and content identity",
      "Test failure and restart behavior",
      "Estimate yield and uncertainty",
      "Measure coverage and ancestry",
      "Propagate exclusions and withdrawals",
    ]} />)}

    {slide("Acquisition has two jobs", "Running example: multilingual technical language", <div className="l3-two-jobs">
      <div><small>STATISTICAL DESIGN</small><strong>What should be covered?</strong><span>languages · domains · registers · time</span></div>
      <b aria-hidden="true">+</b>
      <div><small>DATA ENGINEERING</small><strong>Which objects were obtained?</strong><span>versions · bytes · failures · receipts</span></div>
      <Arrow />
      <div className="l3-accent-panel"><small>OUTPUT</small><strong>Documented corpus</strong><span>what was sought · what arrived</span></div>
    </div>)}

    {slide("Example: strengthen technical Arabic and Swahili", "Running example: multilingual technical language", <div className="l3-example-grid l3-example-three">
      <div><small>STARTING MODEL</small><strong>Fluent general language</strong><span>English is strong<br />Arabic and Swahili news is fluent</span></div>
      <div className="emphasis"><small>CAPABILITY GAP</small><strong>Weak technical explanation</strong><span>mathematics · science<br />Arabic + Swahili</span></div>
      <div><small>ACQUISITION OBJECTIVE</small><strong>Add technical exposure</strong><span>preserve native text<br />mark translated + generated</span></div>
    </div>)}

    {slide("First define the material you want", "Target population, acquisition frame, and acquired inventory", <div className="l3-concept-lesson">
      <div className="l3-concept-definition"><small>TARGET POPULATION</small><strong>The kinds of records the model should encounter</strong><span>A design goal, before choosing websites or files.</span></div>
      <div className="l3-concept-example"><small>IN OUR EXAMPLE</small><strong>Arabic + Swahili technical explanations</strong><span>Mathematics and science; substantial native writing, with translated and generated material identified separately.</span></div>
      <div className="l3-concept-contrast"><small>NOT THE TARGET POPULATION</small><span>“Everything we can download”</span><span>“Any page labeled science”</span></div>
    </div>)}

    {slide("Then define where you can actually look", "Target population, acquisition frame, and acquired inventory", <div className="l3-concept-lesson">
      <div className="l3-concept-definition"><small>ACQUISITION FRAME</small><strong>The reachable, specified collection of possible records</strong><span>Give it a release, query, date, or approved source list so another person could find the same candidates.</span></div>
      <div className="l3-concept-example"><small>IN OUR EXAMPLE</small><strong>Three bounded source lists</strong><span>Fixed educational repository revision · dated web-archive query · approved university sitemaps.</span></div>
      <div className="l3-concept-contrast"><small>WHAT IT CAN MISS</small><span>Uncrawled university pages</span><span>Books outside the named release</span><span>Native writing absent from these sources</span></div>
    </div>)}

    {slide("Select candidates; record what arrives", "Target population, acquisition frame, and acquired inventory", <div className="l3-concept-lesson l3-concept-pair">
      <div className="l3-concept-definition"><small>SELECTED CANDIDATES</small><strong>The frozen list to attempt</strong><span>Choose eligible record IDs from the frame. Save the list and selection rule before retrieval.</span><code>plan-v1: 12,000 source IDs</code></div>
      <div className="l3-concept-example"><small>ACQUIRED INVENTORY</small><strong>Exact objects successfully received</strong><span>Verified files and captures have bytes, digests, and receipts. Failed attempts stay in the ledger.</span><code>11,420 received · 580 failed</code></div>
      <div className="l3-concept-contrast"><small>COUNTS ARE ILLUSTRATIVE</small><span>Selected ≠ received</span><span>Received ≠ approved for training</span></div>
    </div>, "Illustrative record counts")}

    {slide("From intent to acquired objects", "Target population, acquisition frame, and acquired inventory", <div className="l3-stage-flow" aria-label="Target population to acquisition frame to selected candidates to acquired inventory">
      <div><small>01 · GOAL</small><strong>Target population</strong><span>technical explanations</span></div><Arrow />
      <div className="emphasis"><small>02 · REACH</small><strong>Acquisition frame</strong><span>fixed source lists</span></div><Arrow />
      <div><small>03 · PLAN</small><strong>Selected candidates</strong><span>frozen record IDs</span></div><Arrow />
      <div><small>04 · RESULT</small><strong>Acquired inventory</strong><span>verified bytes + receipts</span></div>
    </div>)}

    {slide("Example: a valid sample can still be narrow", "Target population, acquisition frame, and acquired inventory", <div className="l3-example-grid l3-example-two">
      <div><small>FRAME A</small><strong>News only</strong><span>random sampling remains news-heavy</span><b>Cannot produce textbook coverage</b></div>
      <div><small>FRAME B</small><strong>Translated science only</strong><span>technical topics may be present</span><b>Cannot establish native authorship</b></div>
    </div>)}

    {slide("Candidate ≠ acquired ≠ admitted", "Candidate, acquired, and admitted inventories", <div className="l3-inventory-slide">
      <Table headers={["Inventory", "Question", "Example"]} rows={[
        ["Candidate", "Worth attempting?", "12 approved educational domains"],
        ["Acquired", "What arrived?", "8,942 captures with receipts"],
        ["Admitted", "What proceeds?", "8,310 records under policy v3"],
      ]} />
    </div>)}

    {slide("Write the acquisition specification first", "A practical specification", <div className="l3-specification">
      <div className="l3-spec-fields">{[
        ["contribution", "Swahili science"], ["unit", "article or pair"],
        ["language", "sw + retained en"], ["time", "2020–2026"],
        ["frame", "pinned release"], ["origin", "native · translated · generated"],
        ["selection", "all or seeded sample"], ["protected", "families + descendants"],
      ].map(([field, value]) => <div key={field}><code>{field}</code><span>{value}</span></div>)}</div>
      <div className="l3-stop-rule"><small>STOP RULE</small><strong>Choose before collection</strong><span>frame exhaustion · resource cap · date · coverage target · yield threshold</span><code>seed 17 → frozen order → 100,000 successes or exhaustion</code></div>
    </div>)}

    {slide("Examples of complete stopping rules", "A practical specification", <div className="l3-example-list">{[
      ["FRAME EXHAUSTION", "Attempt every file in revision 012345…"],
      ["RESOURCE CAP", "Stop after 50 GB of verified objects"],
      ["TIME BOUNDARY", "Include captures through 2026-06-30"],
      ["COVERAGE TARGET", "Reach 5,000 records per language × domain cell"],
      ["YIELD THRESHOLD", "Stop below 20 accepted records per 1,000 attempts"],
    ].map(([label, detail]) => <div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div>)}

    {slide("What does representative mean?", "Representativeness: what are we trying to cover?", <div className="l3-example-grid l3-example-three">
      <div><small>SITUATIONS</small><strong>Which kinds of texts?</strong><span>news · textbooks · forums<br />scientific articles · dialogue</span></div>
      <div className="emphasis"><small>LANGUAGE WITHIN TEXTS</small><strong>Which forms of expression?</strong><span>technical terms · derivations<br />code-switching · long explanations</span></div>
      <div><small>MODEL UTILITY</small><strong>Did training help?</strong><span>test separately with a controlled training and evaluation comparison</span></div>
    </div>, <><a href="https://doi.org/10.1093/llc/7.1.1">Atkins et al. · 1992</a> · <a href="https://doi.org/10.1093/llc/8.4.243">Biber · 1993</a></>)}

    {slide("Three claims—do not collapse them", "Representativeness: what are we trying to cover?", <div className="l3-claim-stack">
      <div><small>01</small><strong>We acquired textbooks</strong><span>source or situational claim</span></div>
      <div><small>02</small><strong>The corpus contains long derivations</strong><span>corpus-content claim</span></div>
      <div><small>03</small><strong>Training improves reasoning</strong><span>model-effect claim</span></div>
    </div>, <><a href="https://doi.org/10.1093/llc/7.1.1">Atkins et al. · 1992</a> · <a href="https://doi.org/10.1093/llc/8.4.243">Biber · 1993</a></>)}

    {slide("Example: write an auditable acquisition hypothesis", "Representativeness: what are we trying to cover?", <div className="l3-example-hypothesis">
      <small>RUNNING HYPOTHESIS</small>
      <blockquote>Educational sources should add independently authored technical explanations that are underrepresented in the news-heavy corpus.</blockquote>
      <div><span>Audit now</span><strong>authorship · domain · explanation length</strong></div>
      <div><span>Claim later</span><strong>model improvement requires a controlled experiment</strong></div>
    </div>)}

    {slide("Collect, audit, and train are different", "Collection, audit, and training are different distributions", <div className="l3-distributions">
      <div><small>WHAT ENTERS STORAGE?</small><strong>q<sub>collect</sub>(d)</strong><span>attempt · retrieve</span></div>
      <div className="emphasis"><small>WHAT GETS INSPECTED?</small><strong>q<sub>audit</sub>(d)</strong><span>sample · label</span></div>
      <div><small>WHAT REACHES OPTIMIZATION?</small><strong>q<sub>train</sub>(d)</strong><span>mix · pack · repeat</span></div>
    </div>)}

    {slide("The same group can carry different weights", "Collection, audit, and training are different distributions", <div className="l3-weight-matrix">
      <div className="corner">DISTRIBUTION</div>{["Broad web", "Rare technical", "Restricted", "Held-out eval"].map((item) => <strong key={item}>{item}</strong>)}
      {[
        ["qcollect", "attempted", 90, 25, 35, 20],
        ["qaudit", "inspected", 35, 90, 70, 45],
        ["qtrain", "exposed", 55, 80, 0, 0],
      ].map(([label, detail, ...weights]) => <div className="l3-weight-row" key={String(label)}><div><code>{label}</code><span>{detail}</span></div>{weights.map((weight, index) => <i key={index} className={Number(weight) === 0 ? "zero" : ""} style={Number(weight) === 0 ? undefined : { width: `${18 + Number(weight) * .55}px`, height: `${18 + Number(weight) * .55}px` }}>{Number(weight) === 0 ? "—" : ""}</i>)}</div>)}
    </div>)}

    {slide("A stratum is a pre-defined subgroup", "Stratified audits", <div className="l3-example-stratum">
      <code>Swahili × science × translated</code>
      <div><small>SOURCE</small><strong>Repository B</strong></div><div><small>LANGUAGE</small><strong>Swahili</strong></div><div><small>DOMAIN</small><strong>Science</strong></div><div><small>ORIGIN</small><strong>Translated</strong></div>
    </div>)}

    {slide("Example: precision determines audit size", "Stratified audits", <div className="l3-example-precision">
      <code>n₀ ≈ z²p*(1 − p*) / ε²</code>
      <div><strong>96</strong><span>records for roughly<br /><b>±10 points</b></span></div>
      <div><strong>385</strong><span>records for roughly<br /><b>±5 points</b></span></div>
      <div className="l3-precision-assumption"><small>ASSUMPTION</small><span>95% confidence · large stratum · p* = 0.5</span></div>
    </div>)}

    {slide("Balanced inspection, unbalanced corpus", "Stratified audits", <div className="l3-stratified">
      <div className="l3-source-sample"><small>SOURCE A</small><strong>9,000 documents</strong><span>80 / 100 pass</span></div>
      <div className="l3-source-sample"><small>SOURCE B</small><strong>1,000 documents</strong><span>20 / 100 pass</span></div>
      <div className="l3-estimate"><strong>50%</strong><span>equal-source average</span></div>
      <div className="l3-estimate emphasis"><strong>74%</strong><span>document-weighted estimate</span></div>
      <code>0.9(0.8) + 0.1(0.2) = 0.74</code>
    </div>)}

    {slide("Ten examples can tell you almost nothing", "Why a few examples do not establish rare coverage", <div className="l3-rare">
      <code>P(0) = (1 − p)<sup>n</sup></code>
      <div><div><strong>0.5%</strong><span>category prevalence</span></div><div><strong>10</strong><span>random records</span></div><div><strong>95.1%</strong><span>chance of seeing none</span></div><div><strong>598</strong><span>draws for 95% chance of ≥1</span></div></div>
    </div>)}

    {slide("Different sources cover different blind spots", "Build a source portfolio", <Table headers={["Source family", "Typical route", "Preserve"]} rows={[
      ["Broad web", "Dated crawl or release", "URL · capture · archive locator"],
      ["Reference · books", "Dump or permitted edition", "Revision · page · edition · rights"],
      ["Science · math", "Papers and problem banks", "Version · equations · original split"],
      ["Code", "Repository snapshot", "Commit · path · notices"],
      ["Conversation", "Approved export", "Thread · time · authority"],
      ["Translated · generated", "Fixed release or run", "Parents · model · prompt · review"],
    ]} />, <a href="https://arxiv.org/abs/2402.00159">Dolma · Soldaini et al. · 2024</a>)}

    {slide("Example: reuse a corpus or acquire the source?", "Reuse a corpus or acquire the source?", <div className="l3-example-grid l3-example-two">
      <div><small>RELEASED CORPUS</small><strong>Faster and cheaper</strong><span>inherits upstream reachability<br />filters · discarded structure<br />missing timestamps</span></div>
      <div className="emphasis"><small>RAW SOURCE</small><strong>More options, more work</strong><span>storage · extraction<br />normalization · review<br />rights evidence</span></div>
    </div>)}

    {slide("One label hides different acquisition histories", "Multilingual source landscapes", <div className="l3-source-cards">
      <div className="emphasis"><small>FineWeb2</small><strong>1,000+</strong><span>language–script slices<br />Common Crawl</span></div>
      <div className="emphasis"><small>CulturaX</small><strong>167</strong><span>languages<br />mC4 + OSCAR</span></div>
      <div className="emphasis"><small>HPLT</small><strong>mono + parallel</strong><span>web + archives</span></div>
      <div><small>Wikimedia</small><strong>revisioned</strong><span>language dumps</span></div>
      <div><small>OPUS</small><strong>aligned</strong><span>many collections</span></div>
    </div>, <><a href="https://arxiv.org/abs/2506.20920">FineWeb2</a> · <a href="https://arxiv.org/abs/2309.09400">CulturaX</a> · <a href="https://arxiv.org/abs/2403.14009">HPLT</a></>)}

    {slide("Dataset names do not define a union", "Different releases can share upstream data", <div className="l3-overlap">
      <div className="l3-overlap-venn" aria-label="Three named corpora overlap around the same underlying web page"><span>FineWeb2</span><span>CulturaX</span><span>HPLT</span><strong>same page</strong></div>
      <div className="l3-overlap-fields"><small>PRESERVE UPSTREAM IDENTITY</small>{["collection or crawl", "original URL", "capture or publication time", "source record ID", "repository path or commit"].map((item) => <span key={item}>{item}</span>)}</div>
    </div>)}

    {slide("WARC, WAT, and WET are not interchangeable", "WARC, WAT, and WET", <div className="l3-format-cards">
      <div><small>WARC</small><strong>Raw response</strong><span>HTTP headers<br />HTML · media<br />crawl metadata</span><b>most evidence</b></div>
      <div><small>WAT</small><strong>Derived metadata</strong><span>links<br />headers<br />computed fields</span><b>structure</b></div>
      <div><small>WET</small><strong>Extracted text</strong><span>plaintext<br />minimal metadata<br />no original layout</span><b>convenience</b></div>
    </div>, <a href="https://commoncrawl.org/get-started">Common Crawl · data formats</a>)}

    {slide("Example: WET may have already removed the evidence", "WARC, WAT, and WET", <div className="l3-example-grid l3-example-two">
      <div><small>QUESTION</small><strong>Does this lesson contain a results table?</strong><span>layout · header cells · links · document boundary</span></div>
      <div className="emphasis"><small>STARTING FROM WET</small><strong>Only extracted plaintext remains</strong><span>table structure may be flattened<br />links may be absent<br />original HTML is unavailable</span></div>
    </div>)}

    {slide("A URL is a location—not a frozen object", "URL, capture, and record are different identities", <div className="l3-web-identities">
      <div><small>LOCATION</small><strong>URL</strong><code>example.edu/lesson-7</code><span>can change or redirect</span></div><Arrow />
      <div className="emphasis"><small>TIME + ARCHIVE</small><strong>Capture</strong><code>2026-02-14 08:31Z</code><span>points to one observed response</span></div><Arrow />
      <div><small>STORED OBJECT</small><strong>WARC record</strong><code>file + offset + length</code><span>identifies retrieved crawl bytes</span></div>
    </div>)}

    {slide("Discover → freeze → retrieve", "Discover, freeze, retrieve", <div className="l3-freeze-flow">
      <div><small>01</small><strong>Discover</strong><span>crawl · query · constraints</span></div><Arrow />
      <div className="emphasis"><small>02</small><strong>Freeze</strong><span>immutable membership plan</span></div><Arrow />
      <div><small>03</small><strong>Retrieve</strong><span>payloads · attempts · receipts</span></div>
      <code>offset 120,000 + length 8,000 → bytes 120000–127999</code>
    </div>)}

    {slide("Example: Monday and Friday are different frames", "Discover, freeze, retrieve", <div className="l3-example-timeline">
      <div><small>MONDAY</small><strong>Live sitemap</strong><span>download first 5,000 eligible URLs</span></div><Arrow />
      <div className="emphasis"><small>BETWEEN RUNS</small><strong>The site changes</strong><span>new pages · removed pages · redirects · recovered servers</span></div><Arrow />
      <div><small>FRIDAY</small><strong>Different membership</strong><span>new successes silently replace old failures</span></div>
    </div>)}

    {slide("Example: freeze one archive record", "Discover, freeze, retrieve", <div className="l3-code-example"><pre><code>{frozenPlan}</code></pre><div><small>THE PLAN LOCKS</small><span>crawl</span><span>URL</span><span>archive file</span><span>offset + length</span><span>capture time</span></div></div>)}

    {slide("Example: retrieve the exact byte range", "Discover, freeze, retrieve", <div className="l3-range-example">
      <code>end = offset + length − 1</code>
      <div><strong>120,000</strong><span>offset</span><b>+</b><strong>8,000</strong><span>length</span><b>→</b><strong>120000–127999</strong><span>inclusive HTTP range</span></div>
      <p><span>Require HTTP 206</span><span>verify Content-Range</span><span>read exactly 8,000 bytes</span></p>
    </div>)}

    {slide("Pin the object—not the landing page", "Dataset repositories: pin the object, not the landing page", <div className="l3-pin-object">
      <div className="l3-receipt"><small>REPOSITORY RECEIPT</small><code>{receipt}</code></div>
      <div className="l3-frontier"><small>CRAWL FRONTIER</small><div><span>seed domains</span><span>sitemaps + feeds</span><span>link rules</span><span>depth + domain budgets</span><span>rate + stop rules</span></div></div>
    </div>)}

    {slide("Example: pin repository inputs in code", "Dataset repositories: pin the object, not the landing page", <div className="l3-code-example"><pre><code>{repositorySpec}</code></pre><div><small>RECEIPT AFTER TRANSFER</small><span>exact path</span><span>file size</span><span>SHA-256</span><span>verified status</span></div></div>)}

    {slide("Example: one fast publisher can dominate", "Direct crawling and institutional exports", <div className="l3-crawl-example">
      <div><small>PUBLISHER A</small><strong>1,000</strong><span>new pages per day</span></div>
      <div><small>PUBLISHER B</small><strong>10</strong><span>new pages per day</span></div>
    </div>)}

    {slide("Example: every request becomes an attempt record", "Direct crawling and institutional exports", <Table headers={["Attempt field", "Recorded value"]} rows={[
      ["requested_url", "https://example.edu/lesson-7"],
      ["final_url", "https://www.example.edu/lesson-7"],
      ["status · MIME", "200 · text/html"],
      ["bytes · time", "184,203 · 2026-02-14 08:31Z"],
      ["failure · retries", "none · 0"],
    ]} />)}

    {slide("Example: access permission is not training permission", "Direct crawling and institutional exports", <div className="l3-example-list l3-policy-example">{[
      ["CRAWLER ACCESS", "May this client request this path now?"],
      ["TRAINING USE", "May this artifact update model weights?"],
      ["REDISTRIBUTION", "May the raw or transformed text be published?"],
    ].map(([label, detail]) => <div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div>, <a href="https://www.rfc-editor.org/rfc/rfc9309.html">RFC 9309 · Robots Exclusion Protocol</a>)}

    {slide("Location, record, and content answer different questions", "A URL is not a record ID, and a record ID is not a content hash", <div className="l3-identities">
      <div><small>WHERE?</small><strong>Location</strong><code>https://example.org/article/42</code></div>
      <div><small>WHICH SOURCE OBJECT?</small><strong>Record</strong><code>source + revision + upstream ID</code></div>
      <div><small>WHICH EXACT BYTES?</small><strong>Content</strong><code>SHA-256(bytes)</code></div>
    </div>)}

    {slide("Example: preserve field boundaries in identity", "A URL is not a record ID, and a record ID is not a content hash", <div className="l3-identity-example">
      <div><code>{'("ab", "c")'}</code><span>naive concatenation</span><strong>{'"abc"'}</strong></div>
      <div><code>{'("a", "bc")'}</code><span>naive concatenation</span><strong>{'"abc"'}</strong></div>
      <div className="l3-identity-fix"><small>FIX</small><code>[source, revision, upstream_id]</code><span>Serialize field boundaries before hashing.</span></div>
    </div>)}

    {slide("Acquisition state is not admission state", "The acquisition state machine", <div className="l3-state-machine">
      <small>ACQUISITION STATE</small>
      <div className="l3-machine-flow">{["planned", "fetching", "received", "verified", "committed"].map((item, index) => <span className={index === 4 ? "emphasis" : ""} key={item}>{item}</span>)}</div>
      <div className="l3-machine-branch"><span>fetch / verification exception</span><i>↘</i><b>failed</b><b>quarantined</b><i>↗</i><span>retry / review</span></div>
      <hr />
      <small>ADMISSION STATE</small>
      <div className="l3-admission-flow"><span>pending</span><span className="emphasis">admitted</span><span>restricted</span><span>withdrawn</span></div>
    </div>)}

    {slide("Commit receipts only after bytes are safe", "Transaction boundaries", <div className="l3-transactions">
      <div className="l3-small-flow">{["temp write", "close", "verify", "hash", "atomic move", "commit receipt"].map((item, index) => <div className={index === 5 ? "emphasis" : ""} key={item}><small>{String(index + 1).padStart(2, "0")}</small><strong>{item}</strong></div>)}</div>
      <small>ACQUISITION STATE</small>
      <div className="l3-state-flow">{["planned", "fetching", "received", "verified", "committed"].map((item, index) => <span className={index === 4 ? "emphasis" : ""} key={item}>{item}</span>)}</div>
      <em>failed / quarantined</em>
    </div>)}

    {slide("A retry loop is not a restart strategy", "Idempotency and failure injection", <div className="l3-failure-table">
      <Table headers={["Injected failure", "Expected state"]} rows={[
        ["Before any bytes", "plan remains pending"],
        ["Halfway through temporary write", "no committed receipt"],
        ["After object move, before receipt", "orphan object may exist"],
        ["After receipt commit", "restart recognizes completion"],
      ]} />
      <p><strong>Same immutable plan twice</strong><span>stable record identity · stable content identity · no duplicate membership</span></p>
    </div>)}

    {slide("A hash identifies bytes—evidence gives it meaning", "What does a checksum prove?", <div className="l3-checksum">
      <code>h = SHA256(x)</code>
      <div><strong>No independent digest</strong><span>stable content identity<br />≠ proof of intended payload</span></div><Arrow />
      <div className="emphasis"><strong>Expected digest h*</strong><span>h = h*<br />supports expected-byte claim</span></div>
    </div>)}

    {slide("Example: one source can have several valid digests", "What does a checksum prove?", <div className="l3-example-list">{[
      ["RAW CAPTURE", "compressed WARC record"],
      ["HTTP PAYLOAD", "decompressed response body"],
      ["EXTRACTED TEXT", "UTF-8 article text"],
      ["NORMALIZED TEXT", "policy-versioned transformation"],
      ["TRAINING SHARD", "Parquet or packed-token artifact"],
    ].map(([label, detail]) => <div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div>)}

    {slide("Estimate usable tokens before scaling", "Estimate acquisition yield before scaling", <div className="l3-yield">
      <code>T̂ = N × p̂<sub>f</sub> × p̂<sub>a|f</sub> × ℓ̄<sub>a</sub></code>
      <div><div><strong>1,000,000</strong><span>candidate records</span></div><div><strong>0.97</strong><span>fetch succeeds</span></div><div><strong>0.60</strong><span>retained if fetched</span></div><div><strong>500</strong><span>mean retained tokens</span></div></div>
      <div className="result"><strong>291,000,000</strong><span>estimated retained tokens</span></div>
    </div>, "Illustrative pilot calculation—not a measured corpus result")}

    {slide("Example: retries help transient—not permanent—failures", "Estimate acquisition yield before scaling", <div className="l3-example-grid l3-example-two">
      <div className="emphasis"><small>TRANSIENT</small><strong>Retry can help</strong><span>dropped connection<br />temporary 503<br />short-lived timeout</span></div>
      <div><small>PERMANENT OR POLICY</small><strong>Retry cannot repair</strong><span>404 / 410 · authentication<br />crawler rejection<br />corrupt archived object</span></div>
    </div>)}

    {slide("Example: estimate heterogeneous yield by stratum", "Heterogeneous sources", <div className="l3-yield-rows">
      <Table headers={["Source", "Candidates", "Fetch", "Retain | fetched", "Mean tokens"]} rows={[
        ["Pinned repository", "100k", "99%", "82%", "650"],
        ["Historical web", "600k", "76%", "48%", "420"],
        ["Publisher export", "300k", "96%", "71%", "780"],
      ]} />
      <code>T̂ = Σ<sub>h</sub> N<sub>h</sub> p̂<sub>f,h</sub> p̂<sub>a|f,h</sub> ℓ̄<sub>a,h</sub></code>
    </div>, "Illustrative planning values")}

    {slide("A convenient pilot can mislead", "Uncertainty and sampling bias", <div className="l3-uncertainty">
      <div className="l3-uncertainty-formula"><code>Var(p̂) ≈ (1 − n/N) · s²<sub>y</sub> / n</code><span>random-sampling uncertainty</span></div>
      <div className="l3-uncertainty-cards"><div><strong>Sample first</strong><span>before knowing retrieval success</span></div><div><strong>Report clusters</strong><span>domain · date · file type</span></div><div><strong>4× the sample</strong><span>roughly halves standard error</span></div></div>
    </div>)}

    {slide("Documents and tokens tell different stories", "Document-weighted and token-weighted views", <div className="l3-share-chart">
      <div className="l3-chart-head"><span>COMPONENT</span><span>DOCUMENTS</span><span>TOKENS</span></div>
      {[["Arabic news",42,61],["Native Arabic science",4,2],["Translated Arabic STEM",18,13],["English science",21,17],["Code",15,7]].map(([label, docs, tokens]) => <div className="l3-chart-row" key={String(label)}><strong>{label}</strong><span><i style={{ width: String(Number(docs) * 1.4) + "%" }} />{docs}%</span><span><i style={{ width: String(tokens) + "%" }} />{tokens}%</span></div>)}
    </div>, "Illustrative corpus shares from the lecture")}

    {slide("Example: effective source count reveals concentration", "Source concentration", <div className="l3-concentration-example">
      <div><small>BALANCED</small><strong>25% · 25% · 25% · 25%</strong><code>H = 0.25 · N<sub>eff</sub> = 4</code></div>
      <div className="emphasis"><small>DOMINATED</small><strong>91% · 3% · 3% · 3%</strong><code>N<sub>eff</sub> approaches 1</code></div>
    </div>)}

    {slide("A language count is not a coverage report", "Coverage matrices", <div className="l3-coverage"><Table headers={["Acquired material", "English", "Arabic", "Swahili"]} rows={[
      ["Native news", "20,000", "80,000", "12,000"],
      ["Native science", "25,000", "900", "40"],
      ["Translated STEM", "0", "15,000", "5,000"],
      ["Informal conversation", "4,000", "0", "0"],
    ]} /><code>language × domain × register × origin × source</code></div>, "Illustrative acquired-record counts from the lecture")}

    {slide("Example: inspect what drives the aggregate", "Aggregate counts need inspectable examples", <div className="l3-example-grid l3-example-four">
      <div><strong>Repeated navigation</strong><span>topic words in menus</span></div>
      <div><strong>Copied glossary</strong><span>many pages, one source</span></div>
      <div><strong>Very long documents</strong><span>token share without breadth</span></div>
      <div className="emphasis"><strong>Explanatory prose</strong><span>the intended evidence</span></div>
    </div>)}

    {slide("Language and origin are relationships", "Original, translated, parallel, comparable, and generated are relationships", <div className="l3-ancestry">
      <div className="l3-english"><strong>English problem</strong><span>original seed</span></div><i className="l3-down" aria-hidden="true">↓ <small>translation</small></i><div className="l3-swahili emphasis"><strong>Swahili problem</strong><span>translated descendant</span></div><i className="l3-right" aria-hidden="true">→ <small>teacher generation</small></i><div className="l3-solution emphasis"><strong>Worked solution</strong><span>translated + generated ancestry</span></div>
      <div><strong>7</strong><span>descendant records</span><strong>1</strong><span>independent seed family</span></div>
    </div>)}

    {slide("Example: 2,400 records can come from 1,000 ideas", "Family identity versus record identity", <div className="l3-family-math">
      <div><strong>1,000</strong><span>seed problems</span></div><b>×</b><div><strong>4</strong><span>teacher candidates each</span></div><b>×</b><div><strong>0.60</strong><span>retained</span></div><b>=</b><div className="emphasis"><strong>2,400</strong><span>accepted records</span></div>
    </div>)}

    {slide("A teacher model can become a source", "Corpora built from teacher models", <div className="l3-teacher-corpora">
      <div className="l3-corpus-card"><strong>Cosmopedia</strong><span>topics + formats + audiences</span><b>model-generated educational text</b></div>
      <div className="l3-corpus-card emphasis"><strong>Nemotron-CC</strong><span>curated web + synthetic rephrasing</span><b>6.3T released tokens</b></div>
      <div><strong>1.9T</strong><span>reported synthetic tokens</span></div>
    </div>, <><a href="https://huggingface.co/blog/cosmopedia">Cosmopedia</a> · <a href="https://arxiv.org/abs/2412.02595">Nemotron-CC</a> · <a href="https://developer.nvidia.com/blog/announcing-nemotron-cc-a-trillion-token-english-language-dataset-for-llm-pretraining/">NVIDIA release</a></>)}

    {slide("Example: one worked solution, three training roles", "Corpora built from teacher models", <div className="l3-example-grid l3-example-three">
      <div><small>CONTINUATION</small><strong>Pretraining text</strong><span>serialize prompt + solution<br />ordinary next-token loss</span></div>
      <div><small>LABELED TARGET</small><strong>Supervised fine-tuning</strong><span>prompt → worked solution<br />desired response behavior</span></div>
      <div className="emphasis"><small>TEACHER BEHAVIOR</small><strong>Distillation</strong><span>selected trajectory<br />possibly with soft targets</span></div>
    </div>)}

    {slide("One token hides the alternatives", "Why soft targets can be more sample-efficient", <div className="l3-soft-targets">
      <div><small>HARD TOKEN</small><p>The capital of France is <strong>Paris</strong></p><div className="l3-token-bars"><span><b style={{ width: "100%" }} />Paris <em>1.00</em></span><span><b style={{ width: "0%" }} />Lyon <em>0.00</em></span><span><b style={{ width: "0%" }} />France <em>0.00</em></span></div></div>
      <div className="emphasis"><small>TEACHER DISTRIBUTION</small><p>The capital of France is …</p><div className="l3-token-bars"><span><b style={{ width: "62%" }} />Paris <em>.62</em></span><span><b style={{ width: "8%" }} />Lyon <em>.08</em></span><span><b style={{ width: "7%" }} />France <em>.07</em></span></div></div>
      <code>L = (1 − λ)L<sub>hard</sub> + λL<sub>KD</sub></code>
    </div>, <a href="https://arxiv.org/abs/1503.02531">Hinton et al. · 2015</a>)}

    {slide("Sequences and probabilities require different artifacts", "Two ways to create teacher-derived pretraining data", <div className="l3-distillation-artifacts">
      <div className="l3-artifact-card"><strong>Sequence distillation</strong><span>prompt</span><span>teacher response or trajectory</span><span>selection + verifier evidence</span></div>
      <div className="l3-artifact-card emphasis"><strong>Token-probability distillation</strong><span>teacher distributions</span><span>token IDs + vocabulary identity</span><span>teacher–student alignment</span></div>
    </div>)}

    {slide("Example: direct pretraining remains the baseline", "Why not give the student the teacher's entire corpus?", <div className="l3-example-grid l3-example-two">
      <div><small>DIRECT PRETRAINING</small><strong>Replay the original corpus</strong><span>strong baseline when data is available<br />raw one-hot targets<br />same student compute budget</span></div>
      <div className="emphasis"><small>DISTILLATION</small><strong>Compress or reshape supervision</strong><span>soft relationships among alternatives<br />targeted explanations<br />teacher-selected sequences</span></div>
    </div>)}

    {slide("Example: an API teacher exposes only part of the artifact", "Why not give the student the teacher's entire corpus?", <div className="l3-api-boundary">
      <div><small>COMMONLY AVAILABLE</small><span>sampled completion</span><span>limited top-token log probabilities</span><span>provider model ID</span></div>
      <div className="emphasis"><small>OFTEN UNAVAILABLE</small><span>full logits</span><span>complete vocabulary mapping</span><span>stable tokenizer</span><span>immutable checkpoint revision</span></div>
    </div>)}

    {slide("Keep the input, output, attempts, and review", "Generated-data receipts", <div className="l3-generated-receipt">
      <pre><code>{generatedReceipt}</code></pre>
      <div className="l3-teacher-run"><small>TEACHER-RUN RECORD</small>{["model / provider version","prompt-template version","tokenizer if exposed","decoding settings","request date + terms","failed · truncated · repaired"].map((item) => <span key={item}>{item}</span>)}</div>
    </div>)}

    {slide("Example: a verifier checks one claim—not all quality", "Generated-data receipts", <div className="l3-verifier-example">
      <div className="emphasis"><small>CHECKED</small><strong>3 × 5 + 5 = 20</strong><span>the final value satisfies the equation</span></div>
      <div><small>NOT ESTABLISHED</small><span>every reasoning step is valid</span><span>the explanation is pedagogically good</span><span>the teacher&apos;s training provenance is known</span></div>
    </div>)}

    {slide("A source string cannot show propagation", "Provenance is a graph, not a source string", <div className="l3-provenance" role="img" aria-label="Source problem branches into translation and teacher solution, which become admitted records, a shard, and a training run">
      <div className="source"><strong>source problem</strong><span>seed_2917</span></div>
      <i className="to-translation" aria-hidden="true">→</i><div className="translation"><strong>translation</strong><span>sw_v2</span></div>
      <i className="to-solution" aria-hidden="true">↘</i><div className="solution"><strong>teacher solution</strong><span>solution_3</span></div>
      <i className="from-translation" aria-hidden="true">↘</i><i className="from-solution" aria-hidden="true">↗</i><div className="records emphasis"><strong>admitted records</strong><span>921a · b817</span></div>
      <i className="l3-arrow to-shard" aria-hidden="true">→</i><div className="shard emphasis"><strong>shard</strong><span>0042</span></div><i className="l3-arrow to-run" aria-hidden="true">→</i><div className="run emphasis"><strong>run</strong><span>step 18k</span></div>
      <code>record → derivative → shard → run</code>
    </div>)}

    {slide("Example: store the graph as edge records", "Provenance is a graph, not a source string", <Table headers={["parent_id", "child_id", "relation"]} rows={[
      ["source_problem_2917", "sw_translation_v2", "translated_to"],
      ["sw_translation_v2", "record_921a", "admitted_as"],
      ["source_problem_2917", "teacher_solution_3", "generated_from"],
      ["teacher_solution_3", "record_b817", "admitted_as"],
      ["record_921a · record_b817", "shard_0042", "packed_into"],
      ["shard_0042", "checkpoint_step_18000", "consumed_by"],
    ]} />)}

    {slide("Reserve evaluation at the family level", "Protected evaluation families", <div className="l3-protected-family">
      <div className="seed emphasis"><small>PROTECTED SEED</small><strong>problem_2917</strong></div><i>→</i>
      <div className="descendants"><span>translation</span><span>teacher solution</span><span>repaired version</span><span>packed record</span></div>
      <code>A = S ∪ Descendants(S)</code>
    </div>)}

    {slide("Withdrawal publishes a new inventory", "Withdrawal", <div className="l3-withdrawal">
      {["mark sources", "traverse descendants", "block new builds", "rebuild shards", "supersede inventory", "identify affected runs"].map((item, index) => <div key={item}><small>{String(index + 1).padStart(2, "0")}</small><strong>{item}</strong></div>)}
    </div>)}

    {slide("Permission belongs to an artifact and a use", "Rights and use decisions belong to artifacts", <div className="l3-rights">
      {[["Access","Can we retrieve it?"],["Store","Can we retain a copy?"],["Transform","Can we create derivatives?"],["Train","Can it enter optimization?"],["Redistribute","Can we release the text?"],["Release model","Can we publish the result?"]].map(([title, question], index) => <div className={index === 3 || index === 4 ? "emphasis" : ""} key={title}><strong>{title}</strong><span>{question}</span></div>)}
    </div>, <a href="https://doi.org/10.1145/3458723">Gebru et al. · Datasheets for Datasets · 2021</a>)}

    {slide("Example: preserve the reviewed rights decision", "Rights and use decisions belong to artifacts", <div className="l3-code-example"><pre><code>{rightsRecord}</code></pre><div><small>WHY THIS MATTERS</small><span>artifact identity</span><span>notice version</span><span>decision per use</span><span>review date</span><span>conditions</span></div></div>, <a href="https://doi.org/10.1145/3458723">Gebru et al. · Datasheets for Datasets · 2021</a>)}

    {slide("The deliverable is an acquisition dossier", "A complete acquisition dossier", <div className="l3-dossier">
      <pre><code>{`corpus_project/
├── source_specs/
├── discovery/
├── plans/
├── objects/sha256/
├── receipts/
├── attempts/
├── provenance/
├── audits/
└── locks/`}</code></pre>
      <div><small>ANOTHER ENGINEER CAN ANSWER</small>{["What population was sought?", "What was the actual frame?", "Which attempts failed?", "Which bytes were committed?", "Which records share ancestry?", "Which limits remain visible?"].map((item) => <span key={item}>{item}</span>)}</div>
    </div>)}

    {slide("Execute somebody else's acquisition plan", "Practical checkpoint: execute somebody else's plan", <div className="l3-practical">
      {[["01","Specify","population · frame · stop rule"],["02","Swap","surface hidden assumptions"],["03","Acquire","fixture · attempts · receipts"],["04","Break","interrupt · corrupt · retry"],["05","Audit","weights · coverage · examples"],["06","Withdraw","traverse known descendants"]].map(([number, title, detail]) => <div key={number}><small>{number}</small><strong>{title}</strong><span>{detail}</span></div>)}
    </div>)}

    {slide("Example: swap plans and surface hidden state", "Part B — Swap plans", <div className="l3-example-list">{[
      ["01", "Which exact domains are included?"],
      ["02", "Does a corrected translation replace or version the row?"],
      ["03", "Do redirects count as success?"],
      ["04", "What happens when a planned file is missing?"],
      ["05", "Is the record limit global or per source?"],
    ].map(([label, detail]) => <div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div>)}

    {slide("Example: break the pipeline on purpose", "Part D — Test failure behavior", <div className="l3-example-grid l3-example-four">
      <div><small>01</small><strong>Interrupt</strong><span>before object commitment</span></div>
      <div><small>02</small><strong>Corrupt</strong><span>a stored object after hashing</span></div>
      <div><small>03</small><strong>Retry</strong><span>the same immutable plan</span></div>
      <div className="emphasis"><small>04</small><strong>Conflict</strong><span>different bytes, same record identity</span></div>
    </div>)}

    {slide("Example: a coverage audit reports more than totals", "Part E — Audit coverage", <div className="l3-audit-deliverable">{[
      "language + variety", "source + domain", "register", "origin", "missing metadata", "acquisition failures", "document shares", "token shares", "concentration", "five contextual inspections",
    ].map((item) => <span key={item}>{item}</span>)}</div>)}

    {slide("What to remember", "What to remember", <div className="l3-takeaways">{[
      "Population ≠ frame ≠ inventory",
      "Collect ≠ audit ≠ train",
      "Freeze membership before transfer",
      "Failures are part of the result",
      "A hash identifies bytes",
      "Documents and tokens differ",
      "Count records and source families",
      "Provenance is a graph",
    ].map((item, index) => <div key={item}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item}</span></div>)}</div>)}
  </>;

  return <Presentation lectureNumber={3} onExit={onExit} slideContent={slides} />;
}
