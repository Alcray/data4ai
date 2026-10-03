export type SlideSpec = {
  title: string;
  section: string;
  /** Manually chosen destination in the lecture text. */
  textAnchor?: string;
  kind: "points" | "flow" | "comparison" | "table" | "formula" | "code" | "question" | "bars" | "specimen" | "image" | "reading";
  items?: string[];
  headers?: string[];
  rows?: string[][];
  formula?: string;
  code?: string;
  specimens?: { label: string; text: string }[];
  image?: { src: string; alt: string; caption: string };
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
  subtitle: string;
  textAnchor?: string;
  outlineTextAnchor?: string;
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
