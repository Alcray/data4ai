import type { LectureDeck } from "./types";

const source = { label: "Lecture 5 · Corpus integrity" };
const example = { label: "Constructed example · Lecture 5" };
const minhash = { label: "Mining of Massive Datasets · Similarity search", url: "https://www.mmds.org/" };
const deck: LectureDeck = {
  number: 5,
  title: "Corpus integrity—deduplication, contamination, and privacy",
  slides: [
    {
      title: "Collected data needs an integrity pass",
      section: "Running example: the Armenian technical-language corpus",
      kind: "table",
      headers: ["After acquisition and extraction", "Next question"],
      rows: [
        ["Deduplication", "Which copies add redundant exposure?"],
        ["Decontamination", "Which evaluation boundaries must hold?"],
        ["Privacy-oriented processing", "Which sensitive content needs action?"],
      ],
      notes: "We have collected and extracted readable candidate documents. Before admitting them to training, check redundant exposure, protected evaluation boundaries, and specified sensitive material. This opening identifies the three tasks; the sequence developed now addresses deduplication, starting with the simplest exact comparison.",
      source,
    },
    {
      title: "Copies change what the model sees",
      section: "12.1 Deduplication changes the training distribution",
      kind: "specimen",
      specimens: [
        { label: "Before: five equal-length records", text: "A  A  A  A  B\n\nArticle A: 4/5 → 80%\nArticle B: 1/5 → 20%" },
        { label: "After: one copy of each", text: "A  B\n\nArticle A: 1/2 → 50%\nArticle B: 1/2 → 50%" },
      ],
      notes: "Assume uniform sampling of equal-length records. Four copies of A give it four times the sampling exposure of the one B record, allocating more training examples to repeated content. Deduplication changes that distribution. These are constructed exposure probabilities, not a universal guarantee about memorization; weighted or token-based sampling requires its own calculation.",
      source: example,
    },
    {
      title: "Quadratic work grows quickly",
      section: "4.2 Put a time scale on the quadratic term",
      kind: "table",
      headers: ["Documents N", "Pairs: N(N − 1)/2", "At 10 μs per pair"],
      rows: [
        ["1,000", "499,500", "≈ 5 seconds"],
        ["10,000", "49,995,000", "≈ 8.3 minutes"],
        ["100,000", "4,999,950,000", "≈ 13.9 hours"],
        ["1,000,000", "499,999,500,000", "≈ 57.9 days"],
      ],
      notes: "The time column assumes an illustrative average of ten microseconds per pair on one worker and excludes I/O, normalization, and memory traffic. Ten times more documents creates about a hundred times more pair work. Pair count is quadratic; worst-case full-text equality adds a document-length factor, O(N²L). These values are projections, not measured benchmarks.",
      source: { label: "Constructed timing · 10 μs/pair · One worker · No I/O" },
    },
    {
      title: "Same bytes produce the same digest",
      section: "2.5 SHA-256 is a deterministic fingerprint of bytes",
      kind: "specimen",
      specimens: [
        { label: "doc-A · UTF-8", text: "force equals mass times acceleration\n\nSHA-256 prefix:\n5562f586477a…" },
        { label: "doc-C · UTF-8", text: "force equals mass times acceleration\n\nSHA-256 prefix:\n5562f586477a…" },
      ],
      notes: "These are two source records containing the same exact single-line string. Their complete SHA-256 digests are identical. The twelve-character prefixes shown here abbreviate computed full digests; implementations use the full value and retain both source identities. Plain SHA-256 has no per-run randomness or salt.",
      source: { label: "Computed SHA-256 example · Digest prefixes shown" },
    },
    {
      title: "Group matching keys in a hash table",
      section: "2.6 A digest key and a hash-table slot have different roles",
      kind: "image",
      image: {
        src: "lecture-5/exact-hash-groups.svg",
        alt: "Documents A and C with identical text map to one SHA-256 key and member list; document B has a different key.",
        caption: "Digest key → member IDs · Displayed digests are abbreviated",
      },
      notes: "For each record, compute its content digest and look up that full key in a hash table. Matching text from A and C enters the same key group; B ends with velocity and enters another group. The diagram represents logical key groups, not physical storage slots. Preserve record identities and verify underlying payload equality before collision-safe exact merging.",
      source: example,
    },
    {
      title: "Hashing is linear in the input size",
      section: "2.4 Exact grouping is also a data-movement problem",
      kind: "table",
      headers: ["Operation", "Cost", "1 million documents · 10 KB each"],
      rows: [
        ["Hash one L-byte document", "O(L)", "Read its 10,000 bytes"],
        ["Look up its fixed-size digest", "Expected O(1)", "One hash-table lookup"],
        ["Process all N documents", "Expected O(NL + N)", "10 GB read + 1M lookups"],
        ["Hold document size fixed", "Expected O(N)", "2× documents → 2× basic work"],
      ],
      notes: "SHA-256 must read each document: a fixed-size output does not make hashing a variable-length input constant-time. An ordinary in-memory hash table performs expected constant-time lookup or insertion on that fixed-size digest. For N documents of L bytes each, the base grouping cost is expected O(NL + N); for varying sizes it is O(B + N), with B total bytes. The constructed decimal-unit example reads 10 billion bytes and performs one million table lookups, not all document pairs. Doubling N at fixed L doubles this base work, not necessarily wall-clock time; memory pressure, I/O, skew, and payload verification add costs.",
      source: { label: "Constructed workload · 1 KB = 1,000 bytes · In-memory table" },
    },
    {
      title: "One symbol changes the exact-match key",
      section: "2.5 SHA-256 is a deterministic fingerprint of bytes",
      kind: "specimen",
      specimens: [
        { label: "Without a final period", text: "force equals mass times acceleration\n\n5562f586477a…" },
        { label: "One period added", text: "force equals mass times acceleration.\n\n0c3747143d75…" },
      ],
      notes: "The actual inputs are single-line strings that differ only by one appended period. Their computed SHA-256 digests differ greatly, while their meaning is essentially unchanged. Changed punctuation, titles, or footers therefore defeat exact hash equality. Different inputs are not mathematically guaranteed different digests because collisions are possible, but digest resemblance still has no useful lexical interpretation.",
      source: { label: "Computed SHA-256 example · One added period · Prefixes shown" },
    },
    {
      title: "Shingling slides a window across the text",
      section: "Worked example: overlapping windows",
      kind: "image",
      image: {
        src: "lecture-5/shingling-window.svg",
        alt: "The five words force equals mass times acceleration yield three overlapping three-word windows.",
        caption: "Five word tokens · Width 3 · Move one token at a time",
      },
      notes: "Keep the example visible while identifying each word-level window. Five tokens yield three length-three shingles: force equals mass, equals mass times, and mass times acceleration. The word mass belongs to all three windows. The selected windows become a set of token tuples, retaining local order while discarding repeated occurrences.",
      source: example,
    },
    {
      title: "Jaccard measures shared shingles",
      section: "6. Jaccard similarity and directional containment",
      kind: "formula",
      formula: "J(A, B) = shared shingles / distinct shingles in either\n                 = |A ∩ B| / |A ∪ B|",
      notes: "A and B now denote shingle sets, not raw documents or SHA digests. The numerator is their intersection and the denominator their union. Counting a shared shingle twice in the denominator would calculate a different metric. A score is evidence about this representation; the final duplicate threshold and retention policy remain choices.",
      source: minhash,
    },
    {
      title: "Five shared shingles; seven in the union",
      section: "Worked example",
      kind: "image",
      image: {
        src: "lecture-5/jaccard-shared-shingles.svg",
        alt: "Document A contains shingle IDs a,b,c,d,e. Document B contains a,b,c,d,e,f,g. The five shared IDs are highlighted; f and g occur only in B. The intersection has five elements and the union seven, so Jaccard is 5/7, approximately 0.714.",
        caption: "Letters label distinct shingles, not individual words",
      },
      notes: "After constructing the shingle sets, measure their overlap. Each letter is an ID for one distinct shingle, rather than a word token or its occurrence count. A has five elements and B has seven; their intersection contains a through e, and their union contains a through g. Thus Jaccard is 5/7, approximately 0.714. The aligned rows make both the common fragments and B's additional fragments visible; no removal threshold is implied.",
      source: example,
    },
    {
      title: "One changed word: two shared shingles",
      section: "Worked example: one changed word",
      kind: "image",
      image: {
        src: "lecture-5/shingle-overlap.svg",
        alt: "Acceleration and velocity variants share shingle IDs 1 and 2; their union contains IDs 1, 2, 3, and 4, giving Jaccard 0.5.",
        caption: "A = {1,2,3} · B = {1,2,4} · Shared fragments survive an edit",
      },
      notes: "Return to the actual three-word shingles from the sentence example. The acceleration and velocity variants share their first two shingles and differ in the last one. Their intersection has two elements and their union four, giving Jaccard 0.5. Next consider the work required to compare full sets before constructing a compact signature. The changed ending changes the physical claim, so overlap arithmetic alone is not a safe removal decision.",
      source: example,
    },
    {
      title: "Comparing shingles one by one is slow",
      section: "6.3 The cost of comparing full shingle sets",
      kind: "formula",
      formula: "1,000 shingles × 1,000 shingles\n= 1,000,000 equality checks for one pair",
      items: ["Compare each A shingle with every B shingle", "Naive nested scan: O(S²)"],
      notes: "For one pair with S distinct shingles in each document, a full nested-loop scan compares every shingle in A against every shingle in B: S² equality tests. With 1,000 shingles per set that is one million checks. These are constructed operation counts, assuming fixed-size shingle identifiers and excluding preprocessing. This describes a naive implementation, not a lower bound for exact set intersection. Use it to motivate representing a document with a short signature for approximate comparison; the detailed chapter retains faster exact-intersection methods and corpus-level costs.",
      source: { label: "Constructed comparison · S = 1,000 distinct shingles · Full nested scan" },
    },
    {
      title: "Hash every shingle with the same functions",
      section: "Worked example: two hash functions",
      kind: "image",
      image: {
        src: "lecture-5/minhash-hash-values.svg",
        alt: "Document A has whole-shingle IDs a,b,c,d and B has a,b,c,e. Two shared toy functions map a to 7,2; b to 14,8; c to 3,6; d to 20,14; and e to 18,1.",
        caption: "Letters are whole shingles · Reuse both functions for both documents",
      },
      notes: "Use two small sets of whole-shingle IDs, A={a,b,c,d} and B={a,b,c,e}. The letters are not individual words or occurrence counts. Each shared function maps the same shingle to the same value regardless of which document contains it. The five rows show illustrative values for two different functions, not actual BLAKE2b outputs. MinHash will keep the smallest value in each column over the rows belonging to a document; retaining the document's membership is essential because d and e belong to different sets.",
      source: { label: "Constructed MinHash example · Illustrative hash values" },
    },
    {
      title: "Column minima become a document signature",
      section: "Worked example: two hash functions",
      kind: "image",
      image: {
        src: "lecture-5/minhash-two-signatures.svg",
        alt: "For A={a,b,c,d}, Hash 1 values 7,14,3,20 have minimum 3 and Hash 2 values 2,8,6,14 have minimum 2. For B={a,b,c,e}, the minima are 3 and 1. Signatures (3,2) and (3,1) match only in their first coordinate.",
        caption: "One minimum per function · Compare corresponding coordinates",
      },
      notes: "A keeps min(7,14,3,20)=3 for Hash 1 and min(2,8,6,14)=2 for Hash 2. B keeps min(7,14,3,18)=3 and min(2,8,6,1)=1. The signatures are therefore A=(3,2) and B=(3,1): their first coordinates match and their second differ. The two-coordinate Jaccard estimate is 1/2, whereas exact set Jaccard is 3/5; the small sketch need not recover the exact value. Compare corresponding positions rather than averaging hash values. Two coordinates explain the construction, not a sufficient production sketch.",
      source: { label: "Constructed MinHash example · Same two functions" },
    },
    {
      title: "Three functions give three coordinates",
      section: "Worked example: from three functions to 128 seeds",
      kind: "image",
      image: {
        src: "lecture-5/minhash-three-coordinates.svg",
        alt: "A separate toy document has four shingles. Three functions give rows (42,8,31), (15,63,19), (83,29,7), and (27,51,44). The column minima are 15,8,7, producing a three-coordinate signature.",
        caption: "Separate toy document · Four shingles · Three column minima",
      },
      notes: "Use one separate toy document to isolate how signature length is determined. Every function hashes all four shingles. The first column keeps 15, the second 8, and the third 7, so the signature is (15,8,7). These minima come from different shingle rows: the second, first, and third respectively. Three functions create three coordinates, not four coordinates just because the document has four shingles. The next diagram scales the same operation to a 128-coordinate recipe.",
      source: { label: "Constructed example · Illustrative values for three functions" },
    },
    {
      title: "128 seeds give 128 coordinates",
      section: "Worked example: from three functions to 128 seeds",
      kind: "image",
      image: {
        src: "lecture-5/minhash-128-coordinates.svg",
        alt: "A document with 10,000 unique shingles is processed under 128 seeds. Each seed hashes every shingle with BLAKE2b and retains its minimum. Illustrative minima 145,892,...,317 become a signature with 128 coordinates.",
        caption: "128 is a recipe choice, not the shingle count · Reuse the seeds across documents",
      },
      notes: "For a document with 10,000 distinct shingles, reuse the basic operation under a recipe containing 128 seeds. Each seed defines a reproducible coordinate, hashes every shingle, and retains one minimum; the result has 128 values, independent of document shingle count. The displayed 145,892,...,317 are illustrative placeholders, not computed BLAKE2b outputs. The basic implementation performs 10,000×128 hash evaluations to build the sketch once; comparing two compatible signatures then checks 128 positions. Seeded practical hashing approximates the ideal construction, rather than proving independent random permutations. A compact signature still needs candidate retrieval at corpus scale; next, LSH groups likely pairs into bands.",
      source: { label: "Illustrative seed diagram · Not computed BLAKE2b outputs" },
    },
    {
      title: "LSH matches one complete band",
      section: "9.5 A small, inspectable LSH candidate generator",
      kind: "code",
      code: "Separate four-coordinate example:\n\n       band 0    band 1\nX      (1, 1)    (1, 2)\nY      (1, 1)    (2, 1)\nZ      (3, 2)    (1, 1)\n\nCandidate: (X, Y) through band 0",
      notes: "Use a separate four-coordinate fixture, not the two-function A/B example. X and Y correspond to the chapter's shared-order records A and B, while Z corresponds to C={3,4}; their minimum-rank signatures are (1,1,1,2), (1,1,2,1), and (3,2,1,1). Two rows form one band; all rows within at least one corresponding band must match. Only X and Y match a band. Z's band 1 equals X's band 0, but different band positions are not compared. Deduplicate pair IDs before verification and keep band position in the key.",
      source: example,
    },
    {
      title: "Banding controls recall and candidate volume",
      section: "9.4 Choose parameters from a recall target",
      kind: "table",
      headers: ["128 coordinates: bands × rows", "Retrieve at J = 0.5", "Retrieve at J = 0.8"],
      rows: [["8 × 16", "0.012%", "20.4%"], ["16 × 8", "6.07%", "94.7%"], ["32 × 4", "87.3%", ">99.9999%"]],
      notes: "For similarity s, independent ideal coordinates give a full-band match probability s^r, and matching at least one of b bands has probability 1-(1-s^r)^b. Shorter bands raise retrieval recall and can also flood the verifier with weaker pairs. These are theoretical candidate probabilities rather than deterministic thresholds; the chapter derives recall-target inversion and memory budgets.",
      source: example,
    },
    {
      title: "LSH complexity depends on candidate volume",
      section: "9.7 Runtime depends on the emitted candidates",
      kind: "table",
      headers: ["LSH stage", "Expected time", "What it counts"],
      rows: [
        ["Index N signatures", "O(Nk)", "k coordinates/doc; b bands"],
        ["Emit + deduplicate pairs", "O(P)", "P raw bucket-pair emissions"],
        ["Verify C unique candidates", "O(CS)", "At most S shingles per set"],
        ["Total after MinHash", "O(Nk + P + CS)", "P can grow as b × N²"],
      ],
      notes: "Start with precomputed compatible k-coordinate MinHash signatures and original shingle sets for N documents. Constructing and hashing b bands of r coordinates reads br=k values per document, giving expected O(Nk) index work. P is the total raw pair emissions across all band buckets, including repeats; emitting and hash-deduplicating them takes expected O(P). C is the unique candidate count and S bounds each set's size, giving expected O(CS) exact verification with ordinary hash-set membership. Thus the hash-based model costs expected O(Nk+P+CS) after MinHash. One large bucket can make P quadratic in N; across b bands the worst case is b times the all-pairs count. This is not a universal linear-time guarantee. MinHash construction, deterministic sorting, storage I/O, and distributed shuffle are separate costs detailed in the chapter.",
      source: { label: "Derived hash-bucket cost · Precomputed inputs · Sorting and I/O excluded" },
    },
    {
      title: "Retrieve, verify, then decide",
      section: "9.2 Candidate generation pipeline",
      kind: "flow",
      items: ["Shingles", "MinHash", "Band buckets", "Unique candidate pairs", "Exact similarity", "Retention policy"],
      notes: "Candidate retrieval proposes which pairs to examine, exact set comparison measures their lexical overlap, and the policy interprets whether their relationship justifies removing one copy. A perfect verifier cannot recover pairs omitted by retrieval. Preserve compatible text versions and evidence throughout; the chapter's integer overlap bound gives a deterministic Jaccard verifier.",
      source,
    },
    {
      title: "Near-duplicate links are not transitive",
      section: "7. Near-duplicate similarity is not transitive",
      kind: "image",
      image: {
        src: "lecture-5/clustering-verified-chain.svg",
        alt: "Document graph A–B–C: A–B and B–C each have Jaccard 5/6, above 0.8. A–C has Jaccard 4/6, below 0.8, so there is no A–C edge.",
      },
      notes: "Documents are graph nodes, and a solid undirected edge means the pair passed exact verification at threshold 0.8. The chapter's sets give A–B and B–C Jaccard 5/6, but A–C only 4/6; the dashed annotation marks a missing edge, not another match. Following a path therefore does not establish that its endpoints directly match. The graph gives evidence, while the next slide chooses what that evidence permits us to remove.",
      source: { label: "Constructed Jaccard graph · Threshold 0.8 · Section 7" },
    },
    {
      title: "Cluster policy controls what is removed",
      section: "11.2 Alternative cluster policies",
      kind: "image",
      image: {
        src: "lecture-5/clustering-policy-groups.svg",
        alt: "Three policies on the same A–B–C graph. Connected components group all three and retain A. Representative-centered priority A,B,C retains A and C, removing B using A. A stricter all-pairs-consistent example groups A,B and leaves C; grouping all three is forbidden because A–C does not match.",
      },
      notes: "Hold the verified graph fixed and choose A as the retained representative where the policy permits it. Connected components collapse A,B,C by reachability, so C can be removed without directly matching A. Representative-centered priority A,B,C removes B against retained A and keeps C; the arrow records B's retained witness. The all-pairs-consistent example chooses the valid group A,B and singleton C: every pair inside a collapsed group must match, so A,B,C is forbidden. That strict partition is one possible choice, not a unique answer; a partition and representative-selection rule must still be specified.",
      source: { label: "Constructed policy comparison · Same verified graph · Section 11.2" },
    },
    {
      title: "Representative priority changes survivors",
      section: "11.3 Deterministic clustering needs an explicit witness",
      kind: "image",
      image: {
        src: "lecture-5/clustering-representative-order.svg",
        alt: "Two copies of the same verified graph. Priority A,B,C keeps A and C with removal witness B→A. Priority B,A,C keeps B with witnesses A→B and C→B. Filled nodes are retained; hollow nodes are removed.",
      },
      notes: "Process the same graph in two fixed priority orders. With A first, remove B using retained A; C has no edge to A and survives, because removed B cannot become a retained witness. With B first, retain B and remove both endpoints using their direct edges to B. Arrows show removal witnesses, not the direction of similarity or document ancestry. Fix provenance, completeness, and version priorities with a stable ID tie-break, and store the witness score and text versions.",
      source: { label: "Constructed representative-centered trace · Section 11.3" },
    },
    {
      title: "Branches expose the removal policy",
      section: "11.4 Following a branch versus retaining a witness",
      kind: "image",
      image: {
        src: "lecture-5/clustering-branch-policies.svg",
        alt: "Branched graph with exactly edges A–B, B–C, B–D and D–E. Connected components retain A alone. Representative-centered priority A,B,C,D,E retains A,C,D, removes B using A, and removes E using D. Removed B cannot justify removal of C or D.",
      },
      notes: "Extend the same sets with D={1,2,3,4,5,6,7} and E={1,2,3,4,5,6,7,8}. At threshold 0.8 the only verified edges are A–B, B–C, B–D and D–E. Connected components follow every branch and place all five in one group; choosing A retains only A. Representative-centered priority A,B,C,D,E keeps A,C,D, with B→A and E→D as direct retained witnesses; removed B cannot propagate removal to C or D. The chapter computes the four edge scores and also traces B-first priority, which keeps B and E.",
      source: { label: "Constructed branched Jaccard graph · Threshold 0.8 · Section 11.4" },
    },
    {
      title: "Decontamination",
      section: "Part II — Contamination",
      kind: "divider",
      notes: "The deduplication part has covered exact grouping, approximate retrieval, graph-based cluster policies, and retained removal witnesses. Now move to the chapter's Part II: contamination and the protected evaluation boundary. Decontamination aims to prevent held-out evaluation information from entering training, rather than simply removing redundant copies. Begin by deciding which evaluation unit and source family must be protected.",
      source,
    },
    {
      "title": "Define the protected boundary",
      "section": "14. Contamination is not “similarity with a benchmark”",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-boundary.svg",
        "alt": "Training corpus and protected benchmarks are separated by a boundary. The arrow from protected questions, answers, and covered derivatives into training is crossed out."
      },
      "notes": "Pin the benchmark version, protected split, and unit of exclusion before scanning: the boundary can cover questions, answers, or source families and their derivatives. The diagram shows the forbidden flow from protected evaluation information into the training corpus. Topic knowledge can still be legitimate training material; a task's translation or derived solution is different from an independent task on the same subject. The following examples keep that distinction concrete.",
      "source": {
        "label": "Lecture 5 · Protected evaluation boundary · Section 14"
      }
    },
    {
      "title": "The same task can change its surface",
      "section": "17. Worked contamination example",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-task-variants.svg",
        "alt": "The protected tank problem has 40 liters, a loss of 5 liters per hour, and a question after 6 hours. Three constructed variants preserve the task: liters becomes L, English wording changes, and the prompt is translated into Armenian."
      },
      "notes": "All three constructed examples preserve the protected problem's quantities, operation, and requested answer. A narrow exact normalization does not turn liters into L, and a translation can have very little lexical overlap with the English prompt. These are prohibited exposures under a task-and-derivatives boundary when dependence on that protected task is established. Merely sharing the topic of water tanks or arithmetic is not sufficient evidence, which is why verification follows retrieval.",
      "source": {
        "label": "Constructed task variants · 40 liters / 5 per hour / 6 hours · Section 17"
      }
    },
    {
      "title": "Provenance graph and protected closure",
      "section": "15.2 Traverse dependency edges, not just matching strings",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-provenance.svg",
        "alt": "Directed graph: protected task to collected mirror using original-source metadata; protected task to Armenian translation using a logged parent ID; translation to synthetic solution using logged generation input. All known descendants join the protected closure."
      },
      "notes": "Collected original-source IDs or verified parent metadata can reveal dependence; pipeline-controlled translation and generation should log their input IDs directly. Arrows are parent-to-dependent-output relations, unlike the undirected similarity edges used in deduplication. Protect the chosen root and all known reachable descendants; a generated record with any protected parent is dependent, but an unrelated co-parent is not automatically a descendant. Missing ancestry does not prove independence, so text-based detection remains necessary.",
      "source": {
        "label": "Constructed provenance graph · Collected metadata + logged transformations · Section 15"
      }
    },
    {
      "title": "Layer 1: exact normalized matching",
      "section": "16.2 Detection layer 1: exact normalized matching",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-exact-matching.svg",
        "alt": "Protected prompt and training copy use the same NFC, casefold, whitespace-collapse normalization and SHA-256. Extra whitespace leaves the same canonical text and digest prefix 87efa3b8f082. Compare protected keys against training keys and verify the canonical text."
      },
      "notes": "Reuse exact-key matching from deduplication, now comparing the protected set against training rather than training against itself. The declared contamination_key preserves numbers, units, and punctuation while applying NFC, casefolding, and whitespace collapse. The two full constructed prompts normalize to the same text and computed SHA-256 digest; only excerpts and the digest prefix appear in the figure. Verify canonical text when keys agree, and do not expect this policy to make liters and L, paraphrases, or translations identical.",
      "source": {
        "label": "Computed SHA-256 example · Full canonical prompt · Excerpts shown"
      }
    },
    {
      "title": "Layer 2: substring / containment matching",
      "section": "16.3 Detection layer 2: substring / containment matching",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-substring.svg",
        "alt": "The protected tank question is highlighted inside a longer training tutorial between introduction and answer/discussion. The protected passage matches even though full-document keys differ and whole-document similarity may be low."
      },
      "notes": "Look for the protected passage inside a larger record, using compatible local fingerprints, informative substrings, or benchmark-side shingle containment. Full-document equality and high whole-document Jaccard are not required for this exposure. Verify source text and measure the union of covered intervals on the protected item so overlapping hits are not double counted. Generic instructional phrases alone are weak evidence; unit rewrites require other evidence unless an explicit representation makes them equivalent.",
      "source": {
        "label": "Constructed embedded-question example · Local protected-side coverage · Section 16.3"
      }
    },
    {
      "title": "Layer 3: approximate lexical retrieval",
      "section": "16.4 Detection layer 3: approximate lexical retrieval",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-lexical.svg",
        "alt": "Protected and training variants share tank contains 40, water, and loses 5 but differ in units and formatting. Shingles with MinHash-LSH or BM25-like retrieval produce candidate passages, which still need task and source verification."
      },
      "notes": "Reuse the lexical retrieval machinery from deduplication, with protected items as queries into training records or passages. Shared informative wording can retrieve reformatted or lightly edited variants such as liters versus L. MinHash-LSH and BM25-like methods are alternative candidate generators, not a fixed serial pipeline or a guarantee of finding every rewrite. Calibrate retrieval on real variants and false positives, then verify the quantities, operation, requested answer, and source evidence before making an exclusion decision.",
      "source": {
        "label": "Constructed lexical variants · No retrieval score asserted · Section 16.4"
      }
    },
    {
      title: "BM25: inverted index, TF, and IDF",
      section: "16.4 Detection layer 3: approximate lexical retrieval",
      textAnchor: "l5-bm25-retrieval",
      kind: "formula",
      headers: ["Inverted index", "Document IDs"],
      rows: [
        ["tank", "A, B, F, G"],
        ["40", "A, F"],
        ["liters", "A, B, F"],
        ["hour", "A, F, H"],
      ],
      formula: "TF(t,D) = f(t,D)\nIDF(t) = ln(1 + (N − df(t) + 0.5)/(df(t) + 0.5))\nTFnorm(t,D) = f(t,D)(k₁ + 1)/(f(t,D) + k₁(1 − b + b|D|/avgdl))\nBM25(D,Q) = ∑ₜ∈Q IDF(t) · TFnorm(t,D)",
      formulaAnchor: "l5-bm25-formulas",
      items: [
        "f: term occurrences · N: documents · df: documents containing the term",
        "|D| / avgdl: document / mean length · k₁: saturation · b: length normalization",
      ],
      notes: "An inverted index maps each analyzed term to postings for documents containing it; the four rows are selected lists from a constructed A–H collection. A query accesses those lists rather than scanning every full text, then BM25 ranks matching records using raw occurrence counts, IDF, saturated term frequency, and document-length normalization; ranked hits need not contain every query term. Here N is the indexed document count, df is the count containing the term, and k₁ and b control saturation and length normalization. The displayed score uses distinct query terms with unit weights and a nonnegative smoothed IDF convention; BM25 is not plain TF×IDF. These are contamination candidates, not exclusion decisions.",
      source: {
        label: "Manning et al. 2008 · Lucene IDF convention · Constructed index",
        url: "https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html",
      },
    },
    {
      "title": "Layer 4: semantic / cross-lingual retrieval",
      "section": "16.5 Detection layer 4: semantic / cross-lingual retrieval",
      "kind": "image",
      "image": {
        "src": "lecture-5/decontamination-semantic.svg",
        "alt": "A protected English question and multilingual training passages are encoded by a compatible embedding model. Query and document vectors feed cosine-similarity search, which retrieves top-k semantic candidates for verification and human review. Vector coordinates are illustrative, not computed embeddings."
      },
      "notes": "Encode the protected question as a query vector and precompute training-passage vectors using a compatible multilingual model and representation. Search the document-vector index by cosine similarity and retrieve the top-k nearest candidates; the displayed coordinates illustrate the format and are not computed text embeddings. k is a retrieval budget, not a confidence threshold or a contamination decision, and approximate search can miss neighbors. Verify the retrieved task details and known source dependencies before deciding whether a protected item or derivative entered training.",
      "source": {
        "label": "Sentence Transformers · Semantic search · Illustrative coordinates, not measured embeddings",
        "url": "https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html"
      }
    },
    {
      "title": "Similar vectors can hide different tasks",
      "section": "16.8 Verification and human review",
      "kind": "specimen",
      "specimens": [
        {
          "label": "Protected task · 40 L",
          "text": "A tank contains 40 L of water.\nIt loses 5 L each hour.\nHow much remains after 6 hours?\n\nAnswer: 10 L"
        },
        {
          "label": "Retrieved candidate · 100 L",
          "text": "A reservoir contains 100 L.\nIt gains 5 L each hour.\nHow much is present after 6 hours?\n\nAnswer: 130 L"
        }
      ],
      "items": [
        "Embedding similarity ≠ task identity",
        "Check quantities, operation, question, and provenance"
      ],
      "notes": "Both problems discuss water, a container, an hourly change, and a six-hour question, so an embedding model may rank them close; no measured cosine score is asserted. The protected task loses water, giving 40 − 5 × 6 = 10 L, while the candidate gains water, giving 100 + 5 × 6 = 130 L. Inspect the numbers, units, direction of change, requested answer, and provenance instead of treating a vector match as contamination. Changed numbers or operations do not prove independence: the candidate could still be a parameterized derivative covered by the protected-family policy. Verify source evidence and review unresolved cases before making the membership decision.",
      "source": {
        "label": "Constructed 40 L / 100 L tasks · Similarity possible, not a measured embedding result"
      }
    },
    {
      title: "Privacy-Oriented Processing",
      section: "Part III — Privacy-oriented processing",
      kind: "divider",
      notes: "Decontamination protected held-out evaluation information; now move to privacy-oriented processing. PII means personally identifiable information, and the chapter also considers credentials and other specified sensitive material. Define the detector scope, languages, and allowed actions before transforming records. Detection and masking are limited corpus controls, not a formal privacy guarantee.",
      source,
    },
    {
      title: "Mask an email; substitute a name",
      section: "19. Define the privacy scope before building detectors",
      textAnchor: "l5-privacy-transformation-examples",
      kind: "image",
      image: {
        src: "lecture-5/privacy-transformation-examples.svg",
        alt: "Two fabricated before-and-after examples: Contact physlab@example.org becomes Contact EMAIL placeholder, preserving the physics-lab sentence; fictional Mariam Petrosyan becomes the synthetic alias Anna Harutyunyan, preserving joined the lab.",
      },
      notes: "The classroom policy replaces the email-format span with <EMAIL> while preserving the surrounding document; a role mailbox is not automatically personal data solely because of its format. The second example substitutes a synthetic name rather than another real person's identity, with both names treated as fictional fixtures. Keep repeated mentions consistent within the chosen scope and protect any retained identity-to-alias mapping. These transformations illustrate policy actions, not a guarantee of anonymity or a claim about the person named in a transformed record.",
      source: { label: "Fabricated classroom text · Synthetic names · Reserved example.org address" },
    },
    {
      title: "Rule-based and model-based detection",
      section: "20.1 Context-aware and learned detectors",
      textAnchor: "l5-privacy-detector-families",
      kind: "image",
      image: {
        src: "lecture-5/privacy-detector-families.svg",
        alt: "Input text branches into rule-based detection using regex, checksums, lists, and context rules, and model-based detection using NER and context-aware models. Both feed combined sensitive span detections before policy review and transformation.",
      },
      notes: "Rule-based recognizers use patterns, checksums, lists, and contextual conditions; learned recognizers include named-entity recognition, abbreviated NER, and context-aware models. Run compatible detectors on the same named text version, preserving offsets, entity types, scores, and detector evidence when combining their outputs. The families are not mutually exclusive, and combining them does not eliminate correlated misses or false positives. The next slide separates these span suggestions from the policy that chooses a transformation.",
      source: { label: "Presidio Analyzer · Rule-based and model-based recognizers", url: "https://presidio.dataprivacystack.org/analyzer/" },
    },
    {
      title: "A detector proposes; a policy acts",
      section: "22. Detection and action are separate decisions",
      kind: "flow",
      items: ["Detect span", "Record type + offsets", "Resolve overlap", "Choose action", "Transform + audit"],
      notes: "The action may be masking, block removal, document removal, access restriction, or review. Keep detection evidence separate from the decision and avoid copying sensitive payloads into public logs or dashboards.",
      source,
    },
    {
      title: "Choose how to handle sensitive data",
      section: "22. Detection and action are separate decisions",
      textAnchor: "l5-privacy-action-examples",
      kind: "table",
      headers: ["Action", "Before", "After"],
      rows: [
        ["Masking", "maya@example.org", "<EMAIL>"],
        ["Synthetic replacement", "Mariam joined the lab.", "Anna joined the lab."],
        ["Sentence removal", "The lab is open. Email: maya@example.org.", "The lab is open."],
        ["Document removal", "Private chat: Mariam’s diagnosis…", "Not admitted to training"],
      ],
      notes: "All four examples are fabricated classroom fixtures, and example.org is a reserved documentation domain. Masking replaces the approved email span with a placeholder; synthetic replacement supplies a fictional alias rather than another real person's identity, and repeated mentions should remain consistent within the chosen scope. Sentence removal drops the entire contact sentence while retaining the first sentence; document removal excludes the whole private-chat fixture from the training corpus rather than deleting all stored evidence. The action is selected under a declared policy, not inferred solely from a detector hit. Substitution is not a claim of anonymity, and exclusion from future training does not reverse an already-trained model's parameter updates.",
      source: { label: "Fabricated classroom examples · Placeholder / synthetic alias / removal" },
    },
  ],
};

export default deck;
