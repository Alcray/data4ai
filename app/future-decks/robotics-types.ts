export type SlideSpec = {
  title: string;
  section: string;
  /** Manually chosen destination in the lecture text. */
  textAnchor?: string;
  kind: "points" | "flow" | "comparison" | "table" | "formula" | "code" | "question" | "bars" | "specimen" | "image" | "reading" | "divider";
  items?: string[];
  headers?: string[];
  rows?: string[][];
  formula?: string;
  /** ID of a trusted, authored MathML block in the rendered lecture chapter. */
  formulaAnchor?: string;
  /** Wider term legend for formulas with several defined quantities. */
  formulaLayout?: "legend";
  /** Authored inline MathML for legend labels that need structured notation. */
  termMath?: Record<string, string>;
  /** Plain-language interpretation displayed beside the formula. */
  formulaExplanation?: string;
  code?: string;
  specimens?: { label: string; text: string }[];
  image?: { src: string; alt: string; caption?: string };
  prompt?: string;
  answer?: string;
  answerCode?: string;
  readingText?: string;
  bars?: { label: string; value: number }[];
  unit?: string;
  notes: string;
  source?: { label: string; url?: string };
};

export type LectureDeck = {
  number: number;
  title: string;
  textAnchor?: string;
  parts?: {
    id: string;
    label: string;
    title: string;
    /** Title of the first existing content slide in this part. */
    startAt: string;
    topics: string[];
    notes: string;
  }[];
  slides: SlideSpec[];
};
