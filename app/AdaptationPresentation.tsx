import { useState } from "react";
import { Slide } from "@revealjs/react";
import Presentation from "./Lecture1Presentation";
import lecture10 from "./future-decks/lecture-10";
import { lecture10Html } from "./generated/lecture-10";
import type { LectureDeck, SlideSpec } from "./future-decks/types";
import { parseSlidePosition, setReturnSlidePosition } from "./lecture-navigation";
import "./FutureLecturePresentation.css";
import "./AdaptationPresentation.css";

const decks: Record<number, LectureDeck> = { 10: lecture10 };

function Question({ slide }: { slide: SlideSpec }) {
  const [revealed, setRevealed] = useState(false);
  return <div className="future-question">
    <p className="future-prompt">{slide.prompt}</p>
    <button type="button" aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>
      {revealed ? "Hide explanation" : "Reveal explanation"}
    </button>
    {revealed && (slide.answerCode
      ? <pre className="future-answer future-answer-code" aria-live="polite"><code>{slide.answerCode}</code></pre>
      : <p className="future-answer" aria-live="polite">{slide.answer}</p>)}
  </div>;
}

function Points({ items = [] }: { items?: string[] }) {
  return <ol className="future-points">{items.map((item, index) =>
    <li key={index}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
  )}</ol>;
}

const formulaChapters: Record<number, string> = { 10: lecture10Html };
const formulaDocuments = new Map<number, Document>();

function chapterFormulas(lectureNumber: number, anchor: string) {
  const html = formulaChapters[lectureNumber];
  if (!html) return "";
  let chapter = formulaDocuments.get(lectureNumber);
  if (!chapter) {
    chapter = new DOMParser().parseFromString(html, "text/html");
    formulaDocuments.set(lectureNumber, chapter);
  }
  // Only native math from our generated chapter; never user-supplied HTML.
  return [...(chapter.getElementById(anchor)?.querySelectorAll("math") ?? [])].map(math => math.outerHTML).join("");
}

function Table({ slide }: { slide: SlideSpec }) {
  return <div className="future-table-wrap"><table className="future-table">
    <thead><tr>{slide.headers?.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr></thead>
    <tbody>{slide.rows?.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) =>
      column === 0 ? <th key={column} scope="row">{slide.termMath?.[cell]
        ? <span className="future-formula-term-math" dangerouslySetInnerHTML={{ __html: slide.termMath[cell] }} />
        : cell}</th> : <td key={column}>{cell}</td>
    )}</tr>)}</tbody>
  </table></div>;
}

function Content({ slide, lectureNumber }: { slide: SlideSpec; lectureNumber: number }) {
  switch (slide.kind) {
    case "question": return <Question slide={slide} />;
    case "flow": return <ol className={`future-flow${(slide.items?.length ?? 0) > 4 ? " future-flow-wrapped" : ""}`}>
      {slide.items?.map((item, index) => <li key={index}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></li>)}
    </ol>;
    case "comparison":
    case "table": return slide.rows ? <Table slide={slide} /> : <Points items={slide.items} />;
    case "formula": {
      const math = slide.formulaAnchor ? chapterFormulas(lectureNumber, slide.formulaAnchor) : "";
      const formula = math
        ? <div className="future-formula future-formula-native" dangerouslySetInnerHTML={{ __html: math }} />
        : <div className="future-formula" role="math" aria-label={slide.formula}>{slide.formula}</div>;
      const explainedFormula = slide.formulaLayout === "legend" ? <div className="future-formula-detail">
        {formula}
        {slide.formulaExplanation && <p className="future-formula-explanation">{slide.formulaExplanation}</p>}
        {slide.items?.length ? <Points items={slide.items} /> : null}
      </div> : formula;
      return <div className="future-formula-layout">
        {slide.rows ? <div className={`future-formula-table-layout${slide.formulaLayout === "legend" ? " future-formula-table-legend" : ""}`}><Table slide={slide} />{explainedFormula}</div> : explainedFormula}
        {slide.formulaLayout !== "legend" && <Points items={slide.items} />}
      </div>;
    }
    case "code": return <div className="future-code-layout"><pre><code>{slide.code}</code></pre><Points items={slide.items} /></div>;
    case "specimen": return <div className="future-specimen-layout">
      <div className={`future-specimens${slide.specimens?.length === 3 ? " future-specimens-three" : ""}`}>{slide.specimens?.map((specimen, index) =>
        <figure key={index}><figcaption>{specimen.label}</figcaption><pre><code>{specimen.text}</code></pre></figure>
      )}</div><Points items={slide.items} />
    </div>;
    case "image": return <div className={"future-image-layout" + (slide.items?.length ? "" : " future-image-only")}>
      {slide.image && <figure><img src={import.meta.env.BASE_URL + slide.image.src} alt={slide.image.alt} /><figcaption>{slide.image.caption}</figcaption></figure>}
      {slide.items?.length ? <Points items={slide.items} /> : null}
    </div>;
    case "bars": {
      const maximum = slide.unit === "%" ? 100 : Math.max(1, ...(slide.bars ?? []).map((bar) => bar.value));
      return <div className="future-bars">
        <div className="future-bar-axis" aria-hidden="true"><span /><div><span>0</span><span>{maximum}{slide.unit === "%" ? "%" : ""}</span></div><span /></div>
        {slide.bars?.map((bar, index) => <div className="future-bar-row" key={index}>
        <span>{bar.label}</span><div className="future-bar-track"><div style={{ width: `${100 * bar.value / maximum}%` }} /></div>
        <strong>{bar.value}{slide.unit === "%" ? "%" : null}{slide.unit && slide.unit !== "%" && <small>{slide.unit}</small>}</strong>
      </div>)}<Points items={slide.items} /></div>;
    }
    default: return <Points items={slide.items} />;
  }
}

export default function AdaptationPresentation({ lectureNumber, onExit }: { lectureNumber: number; onExit: () => void }) {
  const deck = decks[lectureNumber];
  if (!deck) return null;
  const isDraft = deck.number > 10;
  const displayNumber = deck.number === 17 ? "9.1" : deck.number === 8 ? "7.5" : deck.number >= 9 ? deck.number - 1 : deck.number;
  const openText = (deck.number === 4 || deck.number === 10 || deck.number === 17) ? (anchor: string, slideHash: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lecture", String(displayNumber));
    url.searchParams.delete("mode");
    const position = parseSlidePosition(slideHash);
    if (position) setReturnSlidePosition(url, position);
    url.hash = anchor;
    window.open(url.href, "_blank", "noopener,noreferrer");
  } : undefined;
  const parts = (deck.parts ?? []).map((part) => ({
    ...part,
    slideId: `lecture-${deck.number}-${part.id}`,
    startIndex: deck.slides.findIndex((slide) => slide.title === part.startAt),
  }));
  const slideContent = <>
    <Slide className="lecture-presentation-slide lp-title-slide future-slide" data-text-anchor={deck.textAnchor} notes={`Lecture ${displayNumber}: ${deck.title}. The chapter contains the full explanations and references. Use the presentation to discuss its examples and figures.`}>
      <div className="lp-title-shell future-title">
        <p className="lp-kicker">DATA FOR AI · LECTURE {displayNumber}{deck.number !== 8 && deck.number !== 17 && deck.number !== 10 && " OF 15"}{isDraft && " · DRAFT"}</p>
        <h1>{deck.title}</h1>
        {deck.number !== 10 && <p className="lp-title-hint">→ arrows to navigate · O overview · S speaker view · F full screen · Q exit</p>}
      </div>
    </Slide>
    {deck.slides.flatMap((slide, index) => {
      const part = parts.findLast((candidate) => candidate.startIndex <= index);
      const contentSlide = <Slide className={`lecture-presentation-slide future-slide future-lecture-${deck.number} future-slide-${slide.kind}`} key={`${deck.number}-${index}`} data-part={part?.id} data-text-anchor={slide.textAnchor} notes={slide.notes}>
        {slide.kind === "divider" ? <div className="lp-title-shell future-part-title">
          {deck.number !== 17 && deck.number !== 10 && <p className="lp-kicker">{isDraft && "DRAFT · "}LECTURE {displayNumber}</p>}
          <h2>{slide.title}</h2>
        </div> : slide.kind === "reading" ? <div className="future-reading-exercise">
          <h2 className="future-reading-title">{slide.title}</h2>
          <p lang="hy">{slide.readingText}</p>
        </div> : <div className="lp-slide-shell">
          <header className="lp-slide-header"><p className="lp-kicker">{isDraft && "DRAFT · "}LECTURE {displayNumber} · {part ? `${part.label.toUpperCase()} · ${part.title}` : slide.section}</p><h2>{slide.title}</h2></header>
          <div className="lp-slide-body"><Content slide={slide} lectureNumber={deck.number} /></div>
          {((deck.number !== 17 && deck.number !== 10) || slide.source?.url) && (deck.number !== 10 || slide.source?.url || slide.source?.label !== "Lecture 9 · Continued pretraining and SFT") && <footer className="lp-source">{slide.source?.url ? <a href={slide.source.url} target="_blank" rel="noreferrer">{slide.source.label}</a> : slide.source?.label ?? `Lecture ${displayNumber} · ${slide.section}`}</footer>}
        </div>}
      </Slide>;
      if (!part || part.startIndex !== index) return [contentSlide];
      return [
        <Slide id={part.slideId} className="lecture-presentation-slide future-slide future-slide-part" key={part.slideId} data-text-anchor={deck.number === 4 ? part.id : undefined} notes={part.notes}>
          <div className="lp-title-shell future-part-title">
            <p className="lp-kicker">{isDraft && "DRAFT · "}LECTURE {displayNumber} · {part.label.toUpperCase()}</p>
            <h2>{part.title}</h2>
            <p className="future-part-topics">{part.topics.join(" · ")}</p>
          </div>
        </Slide>,
        contentSlide,
      ];
    })}
  </>;
  return <Presentation key={lectureNumber} lectureNumber={lectureNumber} onExit={onExit} onGoToText={openText} rememberPosition={deck.number === 4 || deck.number === 10 || deck.number === 17} slideContent={slideContent} scrollActivationWidth={parts.length > 0 || deck.number === 10 || deck.number === 17 ? 0 : undefined} />;
}
