import type { LectureDeck } from "./types";

const source = { label: "Lecture 6 · Tokenization and sequence construction" };
const example = { label: "Constructed example · Lecture 6" };
const selectionExample = { label: "Illustrative outcomes · Not measured training runs · Lecture 6" };
const bpe = { label: "Subword BPE · Sennrich et al. 2016", url: "https://aclanthology.org/P16-1162/" };
const releases = { label: "Pinned Qwen / DeepSeek / GLM / Kimi artifacts · 13 Oct 2026 · Section 2.3" };
const measured = { label: "Measured text-only fixtures · Pinned artifacts and exact IDs · Section 14.1" };
const trace = { label: "Qwen3.8-27B · Measured text-only trace · 16 Oct 2026", url: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0/tokenizer.json" };
const unicode = { label: "Unicode normalization · UAX #15, revision 58", url: "https://www.unicode.org/reports/tr15/tr15-58.html" };

const deck: LectureDeck = {
  number: 6,
  title: "Tokenization and sequence construction",
  slides: [
    {
      title: "From text to a language model",
      section: "1.1 From text to model inputs",
      textAnchor: "text-to-model",
      kind: "image",
      image: { src: "lecture-6/text-to-model.svg", alt: "A measured Qwen3.8 example breaks Café prices change. into six colored pieces: C, af, é, space-prices, space-change, and a period. Aligned IDs 34, 2492, 933, 7336, 2222, and 13 enter an embedding lookup and transformer. Colors track pieces to IDs; the space symbol is a display aid." },
      notes: "Follow one real text string instead of beginning with a list of processing abstractions. Café spans three model tokens, while a space belongs to each following word token in this fixture. Colors are only tracking aids; the exact pieces and integer IDs are measured from the pinned Qwen3.8-27B tokenizer, without inserted boundaries or chat formatting. The embedding lookup and transformer are schematic: IDs select learned vectors before transformer computation.",
      source: trace,
    },
    {
      title: "Follow the text through the tokenizer",
      section: "One text through the tokenizer",
      textAnchor: "tokenizer-text-stages",
      kind: "image",
      image: { src: "lecture-6/tokenizer-text-stages.svg", alt: "Five measured stages for the same sentence. NFC converts e plus a combining acute accent to é; pre-tokenization produces four regions, BPE produces six colored pieces, the pieces map to IDs 34, 2492, 933, 7336, 2222, 13, and decoding returns normalized Café prices change. The input accent is displayed with its Unicode escape." },
      notes: "The input contains an e followed by a combining acute accent, displayed as a Unicode escape so the distinction is visible. NFC produces composed é. Four word-like pre-tokenization regions become six BPE pieces; matching colors connect those pieces to their IDs. Decode returns normalized text, not the original decomposed code-point sequence. These stages describe a measured encoding and decoder check, not tokenizer fitting or a requirement to decode during every forward pass.",
      source: trace,
    },
    {
      title: "Text before and after",
      section: "Text before and after",
      textAnchor: "normalization-overview",
      kind: "image",
      image: { src: "lecture-6/normalization-overview.svg", alt: "Seven examples with only the original and transformed text: e plus acute to é; full-width a to a; ffi ligature to ffi; circled one to 1; HELLO to hello; եվ to և; 7 to seven." },
      notes: "NFC means Normalization Form C; NFKC means Normalization Form KC, where C denotes composition and K compatibility. Both decompose, order combining marks, and canonically compose; their decomposition mappings differ. Lowercasing and custom spelling/number rewrites are separate choices, not mandatory additions to a checkpoint's pipeline. NFKC expands և to եւ, not եվ; the Armenian custom rule is different. Keep the detailed algorithms, context caveats, and executable checks in the chapter.",
      source: { label: "Unicode mappings · Constructed language rules", url: unicode.url },
    },
    {
      title: "Pre-tokenization: split before BPE",
      section: "Pre-tokenize hello world before BPE",
      textAnchor: "pretokenization-hello",
      kind: "code",
      code: '"hello world"  -> ["hello", "·world"]\n"hello world!" -> ["hello", "·world", "!"]\n\n· = a preserved space (display only)',
      items: ["Choose boundaries before BPE", "BPE stays within each region"],
      notes: "The pinned Qwen3.8 and DeepSeek-V4 pre-tokenizers both yield these human-readable regions. The dot makes a leading space visible; the actual region begins with a space, not a dot. A naive whitespace split can discard separators, so preserve spacing through the declared representation. These regions are selected before the main segmentation algorithm and are not guaranteed final model tokens.",
      source: { label: "Pinned Qwen3.8 / DeepSeek-V4 · Measured pre-tokenization probes · Section 9" },
    },
    {
      title: "Pre-tokenization: one digit or three?",
      section: "9.1 Real number-splitting rules",
      textAnchor: "released-number-splits",
      kind: "table",
      headers: ["123456789", "Pre-tokenizer regions", "Max digits / region"],
      rows: [["Qwen3.8", "1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9", "1"], ["DeepSeek-V4", "123 / 456 / 789", "3"]],
      notes: "This comparison shows pre-tokenizer regions, before BPE, measured from the pinned JSON artifacts. Qwen's regex isolates single numeric characters; DeepSeek's allows regions of up to three. BPE cannot merge across those boundaries. A three-digit region is not a promised final token: the chapter's GLM example further splits 456 and 789. This fixture does not establish arithmetic quality.",
      source: { label: "Pinned Qwen3.8 / DeepSeek-V4 · Measured pre-tokenization probes · Section 9.1" },
    },
    {
      title: "UTF-8: one character, different bytes",
      section: "One character, different UTF-8 byte lengths",
      textAnchor: "utf8-character-bytes",
      kind: "image",
      image: { src: "lecture-6/utf8-character-bytes.svg", alt: "English A becomes one UTF-8 byte, hex 41. Russian Я becomes two bytes, D0 AF. Chinese 中 becomes three bytes, E4 B8 AD. Each colored box is one byte." },
      notes: "These are exact UTF-8 encodings verified with both Node and Python, not token IDs. Basic Latin letters such as A occupy one byte; Russian Cyrillic letters such as Я occupy two; this common Chinese character occupies three. Do not generalize the last row to every Han character: supplementary-plane characters can require four bytes. An accented Latin character can also use more than one byte. Distinguish characters from bytes before showing BPE merges.",
      source: { label: "UTF-8 · Unicode Standard · Exact byte sequences verified locally", url: "https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/" },
    },
    {
      title: "Byte-level BPE starts with UTF-8 bytes",
      section: "Byte-level BPE starts from UTF-8",
      textAnchor: "byte-level-bpe",
      kind: "image",
      image: { src: "lecture-6/byte-bpe-utf8.svg", alt: "Colored UTF-8 byte tokens for café: hex 63, 61, 66, C3, A9. c, a, f each use one byte; é begins as separate C3 and A9 byte tokens. One illustrative merge joins C3 and A9 into the byte sequence for é. A base byte need not be a complete Unicode character." },
      notes: "This constructed example shows the byte representation, not a frequency-trained merge or Qwen's vocabulary. All 256 byte values are available initially; each visible ASCII letter uses one byte, whereas é uses two. The illustrative merge combines those two bytes. Decode concatenated byte strings, because individual byte pieces can be invalid UTF-8 on their own; the next slides show how training actually chooses merges by corpus counts.",
      source: example,
    },
    {
      title: "Byte BPE: count the most frequent pair",
      section: "Watch byte BPE learn two merges",
      textAnchor: "bpe-visual-counts",
      kind: "image",
      image: { src: "lecture-6/byte-bpe-merge-1.svg", alt: "Three separate training documents banana, banana, and band begin as colored ASCII byte tokens. Adjacent pair counts are a plus n: 5; n plus a: 4; b plus a: 3; n plus d: 1. Select a plus n and assign an new ID 256. Selected tokens have violet outlines." },
      notes: "This is fitting a tokenizer on three separate documents, not encoding with an existing model. Pre-tokenization has produced one word-region per document here: banana, banana and band. Count pairs inside each region, then aggregate counts across the corpus without inventing pairs across region or document boundaries. The five a,n occurrences beat b,a at three and n,a at four. The next slide replaces all five non-overlapping occurrences; colors track token identities and outlines select the adjacent pair.",
      source: { label: "Constructed byte-BPE corpus · Counts reproduced by the chapter's algorithm", url: bpe.url },
    },
    {
      title: "Merge a + n, then recount",
      section: "Watch byte BPE learn two merges",
      textAnchor: "bpe-visual-recount",
      kind: "image",
      image: { src: "lecture-6/byte-bpe-merge-2.svg", alt: "After a plus n becomes an, the two banana documents are b, an, an, a and band is b, an, d. Recomputed counts are b plus an: 3; an plus a: 2; an plus an: 2; an plus d: 1. Select b plus an and assign ban new ID 257. The selected token pairs are outlined." },
      notes: "Each an chip now represents the two original bytes as one token. Count again on these new sequences; old n,a counts are no longer the current pair statistics. The next unique winner is b plus an, occurring once in each of the three documents. Replacing it illustrates that later BPE merges can join an existing multi-byte token with a base byte.",
      source: example,
    },
    {
      title: "Merge b + an: two rules learned",
      section: "Watch byte BPE learn two merges",
      textAnchor: "bpe-visual-result",
      kind: "image",
      image: { src: "lecture-6/byte-bpe-merge-result.svg", alt: "After b plus an becomes ban, each banana is ban, an, a and band is ban, d. Stop at a two-merge teaching budget. The learned order is a plus n to an, ID 256; then b plus an to ban, ID 257. Training recounts pairs; encoding new text replays learned merge priorities." },
      notes: "Stop deliberately after two merges so students can see the final pieces and the two-rule vocabulary extension. The token ban contains three UTF-8 bytes, even though the starting alphabet was individual bytes. More training would recount again, using the declared tie rule if necessary. At inference, do not learn a new most-frequent pair from each sentence: replay the frozen merge priorities described in the chapter.",
      source: example,
    },
    {
      title: "Four releases: BPE, four different contracts",
      section: "2.3 What recent Chinese model releases actually use",
      textAnchor: "released-tokenizer-artifacts",
      kind: "table",
      headers: ["Release", "BPE entries", "Loaded IDs", "Embedding rows"],
      rows: [["Qwen3.8", "248,044", "248,077", "248,320"], ["DeepSeek-V4", "128,000", "129,280", "129,280"], ["GLM-5.3", "154,820", "154,856", "154,880"], ["Kimi K3", "163,584", "163,840", "163,840"]],
      notes: "All four inspected text artifacts use byte-level BPE, but the three inventory columns count different things. DeepSeek's BPE vocabulary already includes three boundary/padding entries; Kimi's first column counts mergeable byte ranks. The newer Qwen, GLM, and Kimi checkpoints retain the inspected predecessors' ordinary-text fixture IDs, but their serialization/configuration artifacts differ. Kimi K3 uses a Python XTML encoder, not the older Jinja template. These are pinned examples, not evidence about an undisclosed fitting corpus.",
      source: releases,
    },
    {
      title: "Added IDs are not extra BPE merges",
      section: "Added IDs and embedding capacity",
      textAnchor: "added-ids-embedding-capacity",
      kind: "image",
      image: { src: "lecture-6/tokenizer-added-ids.svg", alt: "Pinned Qwen3.8 has 248044 BPE entries plus 33 added entries, yielding 248077 loaded IDs. Exact added examples are im-start 248045, im-end 248046, think 248068 and closing-think 248069. Its configuration allocates 248320 embedding rows, leaving 243 row slots without tokenizer IDs. The matrix is schematic; no checkpoint weight values are shown." },
      notes: "The actual spellings are <think> and </think>, not a universal <thinking> wrapper. They are added entries with special:false in this JSON; do not assume all added entries have identical special-token recognition rules. Qwen's 33 added IDs and 243 additional matrix rows explain the two gaps in the preceding table. Extra allocated rows contain numeric vectors, not empty cells; tokenizer/config inspection does not establish zeros, random values or training history. Padding or parallel alignment can motivate extra capacity, but the exact publisher rationale is not established here.",
      source: { label: "Pinned Qwen3.8 tokenizer + config · Exact IDs · Weights not inspected", url: trace.url },
    },
    {
      title: "One sentence, four tokenizations",
      section: "One sentence through four tokenizers",
      textAnchor: "released-tokenizer-comparison",
      kind: "image",
      image: { src: "lecture-6/model-tokenization-comparison.svg", alt: "The exact sentence The tokenizer sees 123456. passes through Qwen3.8, DeepSeek-V4, GLM-5.3, and Kimi K3. Colored chips show measured token pieces and IDs. Qwen splits the digits singly; DeepSeek uses 123 and 456 but splits tokenizer into token and izer; GLM uses 123, 45, 6; Kimi uses 123 and 456. Dots make spaces visible." },
      notes: "All rows use the identical ordinary-text sentence, with no boundary insertion or chat wrapper. The pieces and IDs are measured from the pinned artifacts, not inferred from vocabulary sizes. Spaces are preserved, with a dot as a display aid; each row has its own ID vocabulary, so equal colors do not assert equal learned meanings. This one fixture demonstrates both word-piece and numeric differences, not a tokenizer-quality ranking.",
      source: { label: "Pinned Qwen / DeepSeek / GLM / Kimi · Measured shared sentence · 16 Oct 2026" },
    },
    {
      title: "Build the hash map one pair at a time",
      section: "Count pairs as the scan advances",
      textAnchor: "bpe-hashmap-scan",
      kind: "image",
      image: { src: "lecture-6/bpe-hashmap-scan.svg", alt: "Scan the adjacent pairs of Doc1 abab. First a,b creates count 1; b,a creates count 1; the second a,b increments its count to 2. Continuing with Doc2 abac gives global counts: a,b occurs 3 times; b,a twice; a,c once. Separate documents never contribute a boundary-spanning pair." },
      notes: "Start a fresh teaching run on the chapter's abab and abac corpus, with base byte IDs a=97, b=98, c=99. Move the highlighted window one position at a time: insert a missing pair with count 1, otherwise increment its existing hash-map entry. Adjacent windows overlap during counting. Doc2 contributes one more a,b, one b,a, and one a,c; no edge joins the two documents. The figures are generated from a tested local trace, not a publisher's private trainer.",
      source: example,
    },
    {
      title: "Build the inverted index as you scan",
      section: "Record each pair's locations",
      textAnchor: "bpe-build-inverted-index",
      kind: "image",
      image: { src: "lecture-6/bpe-build-inverted-index.svg", alt: "The initial scan appends a location for each pair. D1:n0 adds a,b at D1:n0; D1:n1 adds b,a; D1:n2 appends a second a,b location. After Doc2, the index maps a,b to D1:n0,D1:n2,D2:n0; b,a to D1:n1,D2:n1; and a,c to D2:n2. Each handle identifies the pair's left token node." },
      notes: "Perform this location append in the same initial pass as the count increment; separate figures make the two responsibilities easier to see. A posting D1:n2 identifies Doc1's stable node2, the left node of a pair. It is not an offset into an ever-shorter string. The final posting-list lengths equal the hash-map counts. We can now locate a winning pair without searching every document again.",
      source: example,
    },
    {
      title: "Choose (a,b); create token 256",
      section: "Allocate the next token ID",
      textAnchor: "bpe-create-merged-token",
      kind: "image",
      image: { src: "lecture-6/bpe-create-merged-token.svg", alt: "The hash map contains counts: a,b has 3; b,a has 2; a,c has 1. Select the unique maximum a,b and concatenate the byte strings of IDs 97 and 98. Add the rule (97,98) to 256; new token 256 spells ab. Its inverted-index lookup returns D1:n0, D1:n2, D2:n0." },
      notes: "This is a new tokenizer run, so its first learned token is 256 even though the earlier banana example assigned 256 to an. IDs 0 through 255 are the base bytes. The unique most frequent pair is (97,98), occurring three times. Allocate 256 for their concatenated bytes ab and snapshot its three indexed occurrences. A max-heap can select candidates efficiently; the chapter retains the implementation details and stale-entry checks.",
      source: example,
    },
    {
      title: "Follow an occurrence; update its neighbors",
      section: "Replace one indexed occurrence",
      textAnchor: "bpe-indexed-replacement",
      kind: "image",
      image: { src: "lecture-6/bpe-indexed-replacement.svg", alt: "Follow the first posting D1:n0 to a,b in abab. Replace nodes n0,n1 with token 256 at n0, unlink n1, and keep n2,n3. Remove pair a,b at D1:n0 and b,a at D1:n1; add 256,a at D1:n0. Their global counts change 3 to 2, 2 to 1, and 0 to 1. The a,b occurrence at D1:n2 stays indexed." },
      notes: "Process the first posting in deterministic document/node order. The current sequence [a,b,a,b] becomes [256,a,b]; node 0 survives and its next link skips inactive node 1 to node 2. Remove the consumed edge a,b and the old right-neighbor edge b,a, then insert (256,a) in both the frequency map and occurrence index. There is no left-neighbor edge at the document boundary. The second a,b occurrence remains at stable handle D1:n2, even though it has a different sequence position after the merge.",
      source: example,
    },
    {
      title: "Visit the remaining postings, not every text",
      section: "Finish the indexed replacement pass",
      textAnchor: "bpe-indexed-result",
      kind: "image",
      image: { src: "lecture-6/bpe-indexed-result.svg", alt: "Process the remaining a,b postings D1:n2 and D2:n0 using their current neighbors. Final Doc1 is [256,256]; Doc2 is [256,a,c]. Current pairs each occur once: (256,256) at D1:n0; (256,a) at D2:n0; (a,c) at D2:n2. The old a,b postings are empty. No full-corpus recount is required." },
      notes: "At D1:n2, the current left neighbor is already 256, not the original b. Remove (256,a) and (a,b), then add (256,256). At D2:n0, remove (a,b) and (b,a), add (256,a), and leave (a,c) untouched. Both the count map and inverted index now describe the transformed corpus. The implementation revalidates live adjacent nodes before each replacement; its full-scan consistency check is only a test oracle, not the normal update algorithm.",
      source: example,
    },
    {
      title: "Other tokenization techniques",
      section: "Segmentation methods at a glance",
      textAnchor: "segmentation-methods",
      kind: "table",
      headers: ["Method", "Encoding choice"],
      rows: [["BPE", "Learned merge priorities"], ["Unigram", "Highest-probability path"], ["WordPiece", "Greedy longest vocabulary match"], ["Byte Latent Transformer", "Adaptive byte patches; no fixed subwords"]],
      notes: "After any normalization and pre-tokenization boundaries, distinguish how units are selected. BPE replays merge priorities, unigram chooses a probability-maximizing path, and WordPiece uses greedy longest-match vocabulary lookup. BLT is an architectural alternative with byte patches rather than a fixed subword vocabulary, not a drop-in tokenizer for these four checkpoints. Byte-level BPE is the implementation focus for the class.",
      source: { label: "BPE · Sennrich 2016; unigram · Kudo 2018; WordPiece · BERT 2019; BLT · Pagnoni 2024" },
    },
    {
      title: "Part 2 — Choosing a tokenizer",
      section: "Choosing a tokenizer",
      textAnchor: "choosing-tokenizer",
      kind: "divider",
      notes: "The mechanics section has covered normalization, bytes, segmentation algorithms, released-tokenizer behavior, and efficient BPE training. Now change the question from how a tokenizer works to which tokenizer fits the project. Compare vocabulary cost, language and domain coverage, measured behavior, and checkpoint compatibility before freezing the contract.",
      source,
    },
    {
      title: "BPE vocabulary size: diminishing returns",
      section: "Three vocabulary sizes on the same unseen text",
      textAnchor: "vocabulary-size-experiment",
      kind: "image",
      image: { src: "lecture-6/bpe-vocabulary-size.svg", alt: "Illustrative, not measured: fit three BPE tokenizers on the same 100,000 documents and encode an identical held-out corpus excluded from fitting. Vocabularies of 32,000, 64,000 and 128,000 IDs yield assumed totals of 50M, 40M and 38M tokens. The reductions are 20% then 5%. A 64k vocabulary may be a better cost tradeoff; 40M is its evaluation token count, not its vocabulary size." },
      notes: "Hold the fitting documents, normalization, pre-tokenization, byte alphabet and special-token policy fixed; vary only vocabulary size. Evaluate all three on the same disjoint held-out text. These assigned 50M, 40M and 38M totals are a constructed teaching case, not results of training three tokenizers. Going from 64k to 128k doubles vocabulary capacity for only 5% fewer pieces here. A 64k choice can be reasonable under an embedding/output cost budget, but downstream quality and measured system cost still decide. The parameter derivation remains in the chapter.",
      source: selectionExample,
    },
    {
      title: "Two 10 GB samples; two 64k BPEs",
      section: "Two tokenizer-fitting samples from a 100 GB pool",
      textAnchor: "tokenizer-sampling-example",
      kind: "image",
      image: { src: "lecture-6/bpe-sampling-mixtures.svg", alt: "A separate controlled example uses a 100 GB eligible pool: English 80 GB, Spanish 15 GB, code 5 GB. Sample A preserves 80/15/5 proportions in 10 GB: 8, 1.5, 0.5 GB. Sample B uses 50/40/10 proportions: 5, 4, 1 GB. Fit one BPE on each sample with the same 64,000-ID vocabulary and preprocessing. This changes tokenizer fitting, not the model's later training mixture." },
      notes: "The sizes are decimal GB of uncompressed UTF-8 text, not document counts or already-tokenized lengths. Reserve evaluation documents before forming the eligible 100 GB pool, then draw two 10 GB fitting samples. A contains 8 GB English, 1.5 GB Spanish and 0.5 GB code; B contains 5 GB English, 4 GB Spanish and 1 GB code. Hold BPE settings and the 64,000-ID target fixed. Only fitting-sample composition changes; its proportions do not prescribe the later model-training mixture. This is separate from the preceding 100,000-document vocabulary-size experiment.",
      source: selectionExample,
    },
    {
      title: "Compare A and B on identical unseen text",
      section: "Compare the two samples on held-out slices",
      textAnchor: "tokenizer-sampling-heldout",
      kind: "image",
      image: { src: "lecture-6/bpe-sampling-evaluation.svg", alt: "Illustrative, not measured outcomes for two 64k BPEs. The same held-out English text has 100,000 reference words: A uses 130,000 tokens, 1.30 per word; B 138,000, 1.38. Spanish has 100,000 words: A 180,000 tokens, 1.80; B 145,000, 1.45. Code has 100,000 reference lexemes: A 165,000 tokens, 1.65; B 140,000, 1.40. B increases English token count 6.2%, reduces Spanish 19.4%, and reduces code 15.2%." },
      notes: "Each row reuses exactly the same unseen text for A and B, excluded from both fitting samples. The counts are explicitly assigned illustrative outcomes: byte proportions and a 64k vocabulary cannot predict them. Prose uses fixed whitespace-delimited diagnostic word-like units; code uses Python tokenize NAME, NUMBER, STRING and OP lexemes, not natural-language words. B trades a 6.2% English expansion for a 19.4% Spanish and 15.2% code reduction in this case. Compare per-slice costs and downstream behavior; do not weight tokens-per-word ratios by 80/15/5 byte shares or declare a universal winner.",
      source: selectionExample,
    },
    {
      title: "Part 3 — Additional tokens and multimodality",
      section: "Part VII — Additional tokens and multimodality",
      textAnchor: "serializing-content",
      kind: "divider",
      notes: "The tokenizer mapping is fixed. Now examine the additional structure needed for conversations: message boundaries and roles, each model's chat format, reasoning and tool-call delimiters, then the separate image-processing path. These formats define the model's input interface.",
      source: {
        label: "Pinned Qwen / DeepSeek / GLM / Kimi chat artifacts · 17 Oct 2026"
      }
    },
    {
      title: "Qwen: message borders and roles",
      section: "19.2 Chat, reasoning, and tools are serialized contracts",
      textAnchor: "chat-reasoning-contract",
      kind: "code",
      code: "<|im_start|>system\\nBe concise.<|im_end|>\\n\n\n<|im_start|>user\\nHello<|im_end|>\\n\n\n<|im_start|>assistant\\n<think>\\n\\n</think>\\n\\nHi.<|im_end|>\\n",
      items: [
        "Message start → role → body → message end",
        "\\n = newline; blank rows separate display fragments"
      ],
      notes: "Use the same system instruction Be concise., user Hello and assistant Hi. throughout the four-model comparison. This is the pinned Qwen template rendered locally, with enable_thinking=False, preserve_thinking=False and no generation prefix; its current assistant branch still emits an empty think block. The visible backslash-n sequences stand for actual newlines, and blank rows separate display fragments; concatenate decoded fragments to recover the exact fixture. im_start and im_end are boundary IDs, while system, user and assistant name the role in ordinary header text. A system prompt is instruction text inside a role-marked message, not a universal SYS token.",
      source: {
        label: "Pinned Qwen3.8 · Sandboxed template render · 17 Oct 2026",
        url: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0/chat_template.jinja"
      }
    },
    {
      title: "DeepSeek: BOS, roles, and assistant EOS",
      section: "DeepSeek V4 chat format",
      textAnchor: "deepseek-chat-template",
      kind: "code",
      code: "<｜begin▁of▁sentence｜>Be concise.\n\n<｜User｜>Hello\n\n<｜Assistant｜></think>Hi.<｜end▁of▁sentence｜>",
      items: [
        "System prompt: Be concise. — after BOS",
        "Chat mode: </think> selects a direct answer",
        "BOS / EOS are control tokens, not XML tags"
      ],
      notes: "The text-only chat-mode fixture is reconstructed from the pinned DeepSeek V4 encoder's inspected literal constants and simple branch; no publisher Python is imported or executed. The publisher's Basic Chat example explicitly places </think> immediately after the Assistant marker to bypass reasoning, without an earlier opening think marker in this mode. Be concise. is the system message body directly after BOS; there is no separate system role marker in this simple format. BOS and the assistant-turn EOS are atomic control tokens, not XML elements needing matching closing tags. Preserve the full-width bars and byte spellings. Blank display rows are not inserted newline bytes.",
      source: {
        label: "Pinned DeepSeek V4 · Published Basic Chat format · 17 Oct 2026",
        url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/raw/b5968e9190ef611bbf34a7229255be88a0e937c1/encoding/README.md"
      }
    },
    {
      title: "GLM: explicit role markers",
      section: "GLM 5.3 chat format",
      textAnchor: "glm-chat-template",
      kind: "code",
      code: "[gMASK]<sop>\n\n<|system|>Reasoning Effort: Max\n\n<|system|>Be concise.\n\n<|user|>Hello\n\n<|assistant|><think></think>Hi.",
      items: [
        "[gMASK]<sop> begins this template",
        "Role tokens separate message bodies"
      ],
      notes: "This is a local sandboxed render of the pinned GLM template, with the same three message dictionaries as Qwen. It inserts a separate Reasoning Effort: Max system block before the supplied system text; GLM does not interpret Qwen's enable_thinking option as a shared interface. Its assistant fixture contains an empty think span. The displayed fragments join without extra newline bytes, and this rendered training sequence does not append a turn-closing token after Hi. Check generation settings separately instead of inventing a universal EOS wrapper.",
      source: {
        label: "Pinned GLM-5.3 · Sandboxed template render · 17 Oct 2026",
        url: "https://huggingface.co/zai-org/GLM-5.3/blob/c5087a76d148760811ffbdedfe6ff9f194e46e38/chat_template.jinja"
      }
    },
    {
      title: "Kimi: XTML structure and message endings",
      section: "Kimi K3 chat format",
      textAnchor: "kimi-chat-template",
      kind: "code",
      code: "<|open|>message role=\"system\"<|sep|>Be concise.<|close|>message<|sep|><|end_of_msg|>\n\n<|open|>message role=\"user\"<|sep|>Hello<|close|>message<|sep|><|end_of_msg|>\n\n<|open|>message role=\"assistant\"<|sep|><|open|>think<|sep|><|close|>think<|sep|><|open|>response<|sep|>Hi.<|close|>response<|sep|><|close|>message<|sep|><|end_of_msg|>",
      items: [
        "Open / close / separator / end-of-message IDs"
      ],
      notes: "The simple text-only fixture is reconstructed from the reviewed pinned Kimi K3 encoder, without importing or executing publisher Python. Structural markers have their own encoding branch; message, role names and the think/response tag names are ordinary text between those markers. The assistant uses separate think and response regions, including an empty think region in this fixture. Blank display rows separate fragments; they are not added newline bytes. Production callers must use Kimi's direct segment-aware tokenization so literal user content cannot become structural control merely by looking like a marker.",
      source: {
        label: "Pinned Kimi K3 · Inspected XTML text branch · 17 Oct 2026",
        url: "https://huggingface.co/moonshotai/Kimi-K3/blob/f831ab66814297da540d832a5235f8e904f29d06/encoding_k3.py"
      }
    },
    {
      title: "Thinking has model-specific boundaries",
      section: "Reasoning delimiters are part of the format",
      textAnchor: "reasoning-format-controls",
      kind: "table",
      headers: [
        "Model",
        "Reasoning opens",
        "Reasoning closes"
      ],
      rows: [
        [
          "Qwen3.8",
          "<think>",
          "</think>"
        ],
        [
          "DeepSeek-V4",
          "<think>",
          "</think>"
        ],
        [
          "GLM-5.3",
          "<think>",
          "</think>"
        ],
        [
          "Kimi K3",
          "<|open|>think<|sep|>",
          "<|close|>think<|sep|>"
        ]
      ],
      notes: "These are delimiter spellings from the inspected artifacts, not a claim that each displayed string is one special ID. Qwen's think entries are added IDs flagged special:false. Kimi's complete opening string includes a structural open marker, ordinary think text and a separator; its response region is separately tagged. Reasoning settings and history retention vary across models and APIs. The delimiters structure a reasoning channel; they do not guarantee correctness or define which positions should receive training loss.",
      source: {
        label: "Pinned Qwen / DeepSeek / GLM / Kimi chat artifacts · 17 Oct 2026"
      }
    },
    {
      title: "Tool-call syntax is not shared",
      section: "Tool-call and result formats",
      textAnchor: "tool-call-formats",
      kind: "table",
      headers: [
        "Model",
        "Call structure",
        "Result structure"
      ],
      rows: [
        [
          "Qwen3.8",
          "<tool_call>\n<function=...>",
          "user + <tool_response>"
        ],
        [
          "DeepSeek-V4",
          "<｜DSML｜tool_calls>\n<｜DSML｜invoke ...>",
          "<｜User｜>\n<tool_result>"
        ],
        [
          "GLM-5.3",
          "<tool_call>\n<arg_key> / <arg_value>",
          "<|observation|>\n<tool_response>"
        ],
        [
          "Kimi K3",
          "<|open|>call\ntool=\"...\"",
          "message role=\"tool\""
        ]
      ],
      notes: "These cells are labeled format fragments, not complete runnable prompts or assertions of one-ID tokenization. Qwen emits nested function and parameter tags; GLM emits function text with arg_key/arg_value tags. DeepSeek V4 uses DSML tool_calls/invoke/parameter markup, not the older tool_calls_begin family. Kimi uses XTML tools/call/argument structure and role=tool result messages. The pinned fixture includes complete empty-argument clock calls and example results; declared tool schemas and matching call IDs remain part of the real protocol.",
      source: {
        label: "Pinned Qwen / DeepSeek / GLM / Kimi chat artifacts · 17 Oct 2026"
      }
    },
    {
      title: "A tool request is not the tool's answer",
      section: "A tool call and its returned result",
      textAnchor: "tool-roundtrip-example",
      kind: "code",
      code: "Assistant body:\n<tool_call>\n<function=clock>\n</function>\n</tool_call>\n\nTool-result body:\n<tool_response>\n12:00\n</tool_response>",
      items: [
        "Application executes the requested function",
        "Result returns as context; assistant continues"
      ],
      notes: "These are Qwen body fragments from a local template render with an illustrative zero-argument clock call; outer message boundaries, an empty reasoning span and tool schemas are omitted here. No clock function was executed: 12:00 is assigned fixture content. The model serializes a request, an application validates and executes the selected tool, and its result is serialized back into context for a following assistant turn. A tool-call delimiter does not itself run code or make tool output authoritative.",
      source: {
        label: "Pinned Qwen format · Constructed clock fixture · No tool execution",
        url: "https://huggingface.co/Qwen/Qwen3.8-27B/blob/1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0/chat_template.jinja"
      }
    },
    {
      title: "Images follow a separate numerical path",
      section: "19.3 Multimodal tokens need a processor, not just a text count",
      textAnchor: "multimodal-token-contract",
      kind: "image",
      image: {
        src: "lecture-6/image-processing-path.svg",
        alt: "Two paths meet before the language model. Text and image-position markers become text IDs and embedding lookups. An RGB image passes through image processing into pixel tensors and grid metadata, then a model vision encoder produces visual features. Those visual features fill the indicated image positions in the embedding sequence. A printed image marker does not contain the pixels; image preprocessing and vision encoding are distinct steps."
      },
      notes: "The diagram is schematic, not a measured patch count or a statement that all architectures merge features identically. Qwen's template emits vision_start/image_pad/vision_end placeholders; compatible processing supplies image pixels and grid metadata, and the model's vision component computes features at corresponding positions. Kimi's inspected processor returns pixel_values and grid_thws and preserves its segment-aware text path; this pinned wrapper accepts image media, not arbitrary video inputs. Resizing, crops and model settings affect visual positions, so count processed outputs rather than the BPE length of a placeholder. Pixel preprocessing is not itself the learned vision encoder.",
      source: {
        label: "Pinned Qwen / Kimi image paths · Schematic, no fixed patch budget",
        url: "https://huggingface.co/docs/transformers/en/chat_templating_multimodal"
      }
    },
    {
      title: "Big picture: images become embeddings",
      section: "Big picture: images become embeddings",
      textAnchor: "multimodal-big-picture",
      kind: "image",
      image: {
        src: "lecture-6/multimodal-big-picture.svg",
        alt: "An image becomes patches, then a vision encoder and projector produce visual embeddings. The prompt becomes token IDs and text embeddings through a separate lookup. Both streams join an ordered embedding sequence that the language model consumes. Shaded columns represent numerical vectors, not words or fixed patch counts."
      },
      notes: "Follow the image and the question as two inputs to one model. Preprocessing prepares image patches; a vision encoder computes features, and a projector or merger adapts them to the language backbone's input width. The prompt follows text tokenization and an embedding lookup. Visual and text vectors join an ordered input sequence, with the model's position and attention rules, before the language model generates a response conditioned on both. This is a common encoder–projector pattern, not a universal architecture: cross-attention and other fusion designs also exist. Vector columns are schematic, not measured values or a fixed token count; the image is not first converted into an ordinary text caption.",
      source: {
        label: "Common encoder–projector pattern · LLaVA architecture · Schematic vectors",
        url: "https://llava-vl.github.io/"
      }
    },
    {
      title: "Part 4 — Packing and context",
      section: "Part IX — Document boundaries and packing semantics",
      textAnchor: "packing-and-context",
      kind: "divider",
      notes: "Start with the autoregressive next-token target, then show its past-only attention constraint. Pack short documents into a physical sequence without changing their intended contexts, and distinguish document isolation, loss masks, padding flags, and position coordinates with one aligned example. Sequence length counts positions per block; batch size counts blocks.",
      source,
    },
    {
      title: "Shift once: every arrow is a target",
      section: "20. A causal model predicts the next token",
      textAnchor: "next-token-targets",
      kind: "code",
      code: "Serialized: [BOS, a, b, EOS]\n\nInput:      [BOS, a, b]\nTarget:     [a,   b, EOS]\n\nBOS -> a\na   -> b\nb   -> EOS",
      notes: "Build these three pairs by hand before calling a model API. Some APIs perform the shift internally, so pre-shifting labels there would skip the intended immediate-next-token target.",
      source: example,
    },
    {
      title: "Predict the next token without seeing it",
      section: "Causal attention hides the future",
      textAnchor: "causal-attention-example",
      kind: "image",
      image: { src: "lecture-6/causal-attention.svg", alt: "A lower-triangular attention matrix permits the current and earlier inputs. At query b in BOS a b c d, only BOS a b are visible; c is the next-token target, not an allowed input to that prediction." },
      notes: "This is autoregressive next-token prediction, not an autoencoder reconstructing a visible input. Each training query can read itself and earlier keys, but not future inputs. The selected query b has prefix BOS a b and target c; the target exists in the training sequence but is hidden from that query's attention. All query positions can be trained in parallel under the causal constraint.",
      source: example,
    },
    {
      title: "Fill a 4,096-position block",
      section: "Fill a 4,096-position block",
      textAnchor: "packing-capacity-example",
      kind: "image",
      image: { src: "lecture-6/packing-capacity.svg", alt: "One document contributes 512 valid input positions in a 4,096-position block, leaving 3,584 padding positions. Two documents fill 25 percent; eight fill 100 percent. Sequence length is positions per block, not batch size." },
      notes: "Each prepared document in this constructed example supplies 512 valid input positions and aligned next-token targets, with boundary markers already accounted for. One document fills 12.5 percent of a 4,096-position sequence; two fill only 25 percent, and eight fill the block. Batch size is the number of blocks, so the input tensor shape is B by L. Reduced padding is a utilization benefit, not a promise of a proportional runtime speedup; independent documents still require the intended attention boundaries.",
      source: example,
    },
    {
      title: "Block the future and the other document",
      section: "From a causal triangle to isolated documents",
      textAnchor: "packed-document-attention",
      kind: "image",
      image: { src: "lecture-6/packed-document-attention.svg", alt: "Compare two six-position attention matrices for A BOS a b and B BOS c d. Causal attention alone lets B read A. Adding the same-document condition leaves two triangular diagonal blocks and removes nine B-to-A attention connections." },
      notes: "The same six real positions are shown in both matrices: A contributes BOS a b and B contributes BOS c d. Ordinary causal attention allows B's queries to read all earlier A keys. For independent-document packing, require both past-or-current position and matching document identity, blocking those nine cross-document edges. EOS and reset position IDs alone do not do this. Dense matrices are teaching diagrams; efficient sequence-boundary kernels can enforce the same semantics without materializing them.",
      source: example,
    },
    {
      title: "Loss mask: which targets count?",
      section: "Loss mask: choose which targets count",
      textAnchor: "packing-loss-mask",
      kind: "image",
      image: { src: "lecture-6/packing-loss-mask.svg", alt: "Inputs BOS a b BOS c d PAD PAD align with next-token targets a b EOS c d EOS PAD PAD and loss mask 0 1 1 0 1 1 0 0. Context targets a and c are not scored; b, d, and both EOS targets are scored." },
      notes: "This is an illustrative context/answer supervision policy, not the only valid pretraining mask. Arrays are already shifted within each document before packing; the loss mask selects target entries, so masking prediction of a does not remove a from the input context used to predict b. Four targets are scored and the two padding targets are ignored. Full-document pretraining could score all six real targets instead. Neither choice changes attention permissions.",
      source: example,
    },
    {
      title: "Padding mask: which slots are real?",
      section: "Padding mask: distinguish real inputs from storage",
      textAnchor: "packing-padding-mask",
      kind: "image",
      image: { src: "lecture-6/packing-padding-mask.svg", alt: "The shared eight-slot sequence contains six real inputs and two PAD slots. Valid-input flags are 1 1 1 1 1 1 0 0. Exclude padding keys from real-query attention and ignore padding targets in the loss." },
      notes: "These one-means-real flags describe the concept; library mask arguments can use opposite Boolean conventions. Combine validity with causal and same-document permissions so real queries cannot read padding keys, and also exclude padding targets from loss. Padding-query outputs are unused but their implementation must remain numerically defined; a fully masked naive softmax row can yield NaNs. A zero loss mask does not itself hide padding from attention.",
      source: example,
    },
    {
      title: "Position IDs: restart each document at zero",
      section: "Position IDs: assign coordinates within each document",
      textAnchor: "packing-position-ids",
      kind: "image",
      image: { src: "lecture-6/packing-position-ids.svg", alt: "Inputs BOS a b BOS c d PAD PAD align with segments A A A B B B and positions 0 1 2 0 1 2 0 0. The second document restarts at zero; padded-slot coordinates are ignored filler values." },
      notes: "For this independent-document teaching policy, assign positions 0 1 2 within each document; padding slots use filler zero coordinates and are otherwise ignored. Position IDs are coordinates for the model's positional mechanism, not loss-selection flags or attention barriers. Resetting B's position does not stop B reading A under an ordinary causal mask. The reset policy must remain compatible with the checkpoint and the attention implementation.",
      source: example,
    },
    {
      title: "Masks and positions answer different questions",
      section: "25. The loss mask answers a different question",
      kind: "table",
      headers: ["Mechanism", "Question"],
      rows: [["Attention permissions", "Who can read whom?"], ["Loss mask", "Which predictions count?"], ["Padding policy", "Which positions are real?"], ["Position IDs", "Which coordinate is assigned?"]],
      notes: "A prefix can be visible to later queries while its own predictions are unscored. Keep the four concepts separate even if a framework packages some of them into similarly named mask arguments.",
      source,
    },
    {
      title: "Every target survives; its context may not",
      section: "30. Non-overlapping chunking preserves targets but loses context",
      kind: "code",
      code: "Document: [BOS, a, b, c, d, e, EOS]\n\nChunk 1 input:  [BOS, a, b, c]\nChunk 1 target: [a,   b, c, d]\n\nChunk 2 input:  [d, e]\nChunk 2 target: [e, EOS]\n\nPrediction d -> e no longer sees BOS a b c.",
      notes: "Chunk the list of prediction pairs, not a token array in a way that accidentally drops boundary pairs. Even exact target conservation does not preserve the full-document conditioning context.",
      source: example,
    },
  ],
};

export default deck;
