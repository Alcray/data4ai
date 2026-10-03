import { useState } from "react";
import { Slide } from "@revealjs/react";
import Presentation from "./Lecture1Presentation";
import lecture4 from "./future-decks/lecture-4";
import type { LectureDeck, SlideSpec } from "./future-decks/types";
import { parseSlidePosition, setReturnSlidePosition } from "./lecture-navigation";
import "./FutureLecturePresentation.css";

const decks: Record<number, LectureDeck> = { 4: lecture4 };

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

function Content({ slide }: { slide: SlideSpec }) {
  switch (slide.kind) {
    case "question": return <Question slide={slide} />;
    case "flow": return <ol className={`future-flow${(slide.items?.length ?? 0) > 4 ? " future-flow-wrapped" : ""}`}>
      {slide.items?.map((item, index) => <li key={index}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></li>)}
    </ol>;
    case "comparison":
    case "table": return slide.rows ? <div className="future-table-wrap"><table className="future-table">
      <thead><tr>{slide.headers?.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr></thead>
      <tbody>{slide.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) =>
        column === 0 ? <th key={column} scope="row">{cell}</th> : <td key={column}>{cell}</td>
      )}</tr>)}</tbody>
    </table></div> : <Points items={slide.items} />;
    case "formula": return <div className="future-formula-layout"><div className="future-formula" role="math" aria-label={slide.formula}>{slide.formula}</div><Points items={slide.items} /></div>;
    case "code": return <div className="future-code-layout"><pre><code>{slide.code}</code></pre><Points items={slide.items} /></div>;
    case "specimen": return <div className="future-specimen-layout">
      <div className="future-specimens">{slide.specimens?.map((specimen, index) =>
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

export default function FutureLecturePresentation({ lectureNumber, onExit }: { lectureNumber: number; onExit: () => void }) {
  const deck = decks[lectureNumber];
  if (!deck) return null;
  const openText = deck.number === 4 ? (anchor: string, slideHash: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lecture", "4");
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
    <Slide className="lecture-presentation-slide lp-title-slide future-slide" data-text-anchor={deck.textAnchor} notes={`Lecture ${deck.number}: ${deck.title}. ${deck.subtitle} Use the chapter for the complete derivations and the practical exercise; pause at the question slides before revealing the explanation.`}>
      <div className="lp-title-shell future-title">
        <p className="lp-kicker">DATA FOR AI · LECTURE {deck.number} OF 16 · DRAFT</p>
        <h1>{deck.title}</h1><p className="future-subtitle">{deck.subtitle}</p>
        <p className="lp-title-hint">→ arrows to navigate · O overview · S speaker view · F full screen · Q exit</p>
      </div>
    </Slide>
    {parts.length > 0 && <Slide className="lecture-presentation-slide future-slide future-slide-outline" data-text-anchor={deck.outlineTextAnchor} notes={`Follow the same five parts as the chapter: ${parts.map((part) => `${part.label}: ${part.title}`).join("; ")}. Begin with document recovery, then move through representation, quality decisions, corpus-level effects, and the assembled pipeline. Select a part to jump to its opening slide.`}>
      <div className="lp-slide-shell">
        <header className="lp-slide-header"><p className="lp-kicker">DRAFT · LECTURE {deck.number} · OUTLINE</p><h2>From acquired objects to an audited corpus</h2></header>
        <div className="lp-slide-body">
          <ol className="future-points future-part-outline">{parts.map((part) => <li key={part.id}>
            <span aria-hidden="true">{part.label.replace("Part ", "")}</span>
            <p><a href={`#/${part.slideId}`} aria-label={`${part.label}: ${part.title}`}>{part.title}</a></p>
          </li>)}</ol>
        </div>
        <footer className="lp-source">Lecture {deck.number} · Select a part to jump to its opening slide</footer>
      </div>
    </Slide>}
    {deck.slides.flatMap((slide, index) => {
      const part = parts.findLast((candidate) => candidate.startIndex <= index);
      const contentSlide = <Slide className={`lecture-presentation-slide future-slide future-slide-${slide.kind}`} key={`${deck.number}-${index}`} data-part={part?.id} data-text-anchor={slide.textAnchor} notes={slide.notes}>
        {slide.kind === "reading" ? <div className="future-reading-exercise">
          <h2 className="future-reading-title">{slide.title}</h2>
          <p lang="hy">{slide.readingText}</p>
        </div> : <div className="lp-slide-shell">
          <header className="lp-slide-header"><p className="lp-kicker">DRAFT · LECTURE {deck.number} · {part ? `${part.label.toUpperCase()} · ${part.title}` : slide.section}</p><h2>{slide.title}</h2></header>
          <div className="lp-slide-body"><Content slide={slide} /></div>
          <footer className="lp-source">{slide.source?.url ? <a href={slide.source.url} target="_blank" rel="noreferrer">{slide.source.label}</a> : slide.source?.label ?? `Lecture ${deck.number} · ${slide.section}`}</footer>
        </div>}
      </Slide>;
      if (!part || part.startIndex !== index) return [contentSlide];
      return [
        <Slide id={part.slideId} className="lecture-presentation-slide future-slide future-slide-part" key={part.slideId} data-text-anchor={deck.number === 4 ? part.id : undefined} notes={part.notes}>
          <div className="lp-title-shell future-part-title">
            <p className="lp-kicker">DRAFT · LECTURE {deck.number} · {part.label.toUpperCase()}</p>
            <h2>{part.title}</h2>
            <p className="future-part-topics">{part.topics.join(" · ")}</p>
          </div>
        </Slide>,
        contentSlide,
      ];
    })}
  </>;
  return <Presentation key={lectureNumber} lectureNumber={lectureNumber} onExit={onExit} onGoToText={openText} rememberPosition={deck.number === 4} slideContent={slideContent} scrollActivationWidth={parts.length > 0 ? 0 : undefined} />;
}
