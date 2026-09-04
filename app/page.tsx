"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AiMarketMoments } from "./AiMarketMoments";
import { ReleaseCadenceChartMount } from "./ReleaseCadenceChart";
import { curriculumHtml } from "./generated/curriculum";
import { introductionHtml } from "./generated/introduction";
import { lecture1Html } from "./generated/lecture-1";

const Lecture1Presentation = lazy(() => import("./Lecture1Presentation"));

const navigation = [
  "Home",
  "Lectures",
] as const;

const lecturePages = [
  { name: "Introduction", html: introductionHtml },
  { name: "Lecture 1: Model lifecycle", html: lecture1Html },
] as const;

const lecturePhases = [
  {
    name: "Foundations",
    range: "01",
    families: [{ name: null, lectures: lecturePages.slice(1, 2) }],
  },
] as const;

type LectureName = (typeof lecturePages)[number]["name"];
type PageName = (typeof navigation)[number] | LectureName;
const lectures = lecturePages.map((lecture) => lecture.name);

function lecture1PresentationRequested() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("lecture") === "1" && params.get("mode") === "presentation";
}

function AiMarketMomentsMount({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTarget(rootRef.current?.querySelector("[data-ai-market-moments]") ?? null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [rootRef]);

  return target ? createPortal(<AiMarketMoments />, target) : null;
}

export default function Home() {
  const startsInLecture1Presentation = lecture1PresentationRequested();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lecturesOpen, setLecturesOpen] = useState(true);
  const [active, setActive] = useState<PageName>(
    startsInLecture1Presentation ? "Lecture 1: Model lifecycle" : "Home",
  );
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [lecture1Presenting, setLecture1Presenting] = useState(
    startsInLecture1Presentation,
  );
  const lecture1Ref = useRef<HTMLElement>(null);
  const activeLecture = lecturePages.find((lecture) => lecture.name === active);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [...navigation, ...lectures].filter((item) =>
      item.toLowerCase().includes(normalized),
    );
  }, [query]);

  function choosePage(item: PageName) {
    setLecture1Presentation(false);
    setActive(item);
    if (lectures.includes(item as LectureName)) {
      setLecturesOpen(true);
    }
    setQuery("");
    setSearchOpen(false);
    setMenuOpen(false);
  }

  function setLecture1Presentation(presenting: boolean) {
    setLecture1Presenting(presenting);
    const url = new URL(window.location.href);
    if (presenting) {
      url.searchParams.set("lecture", "1");
      url.searchParams.set("mode", "presentation");
    } else {
      url.searchParams.delete("lecture");
      url.searchParams.delete("mode");
    }
    window.history.replaceState({}, "", url);
  }

  return (
    <div className="course-shell">
      <aside className="side-bar">
        <header className="site-header">
          <button className="site-title" onClick={() => choosePage("Home")}>
            Data for AI
          </button>
          <button
            className="site-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-icon" aria-hidden="true" />
          </button>
        </header>

        <nav
          aria-label="Main"
          className={`site-nav${menuOpen ? " nav-open" : ""}`}
        >
          <ul className="nav-list">
            {navigation.map((item) => (
              <li className="nav-list-item" key={item}>
                {item === "Lectures" && (
                  <button
                    className={`nav-list-expander${lecturesOpen ? " expanded" : ""}`}
                    type="button"
                    aria-label={lecturesOpen ? "Collapse lectures" : "Expand lectures"}
                    aria-expanded={lecturesOpen}
                    onClick={() => setLecturesOpen((open) => !open)}
                  />
                )}
                <button
                  className={`nav-list-link${active === item ? " active" : ""}`}
                  type="button"
                  onClick={() => choosePage(item)}
                >
                  {item}
                </button>
                {item === "Lectures" && lecturesOpen && (
                  <ul className="nav-list nav-list-nested lecture-nav">
                    <li className="nav-list-item lecture-introduction">
                      <button
                        className={`nav-list-link${active === lecturePages[0].name ? " active" : ""}`}
                        type="button"
                        onClick={() => choosePage(lecturePages[0].name)}
                      >
                        {lecturePages[0].name}
                      </button>
                    </li>
                    {lecturePhases.map((phase, phaseIndex) => {
                      const phaseLabelId = `lecture-phase-${phaseIndex}`;
                      const phaseIsActive = phase.families.some((family) =>
                        family.lectures.some((lecture) => lecture.name === active),
                      );

                      return (
                        <li
                          className={`lecture-phase${phaseIsActive ? " active" : ""}`}
                          key={phase.name}
                        >
                          <div className="lecture-phase-heading">
                            <span id={phaseLabelId}>{phase.name}</span>
                            <small>{phase.range}</small>
                          </div>
                          <ul
                            aria-labelledby={phaseLabelId}
                            className="nav-list lecture-phase-list"
                          >
                            {phase.families.map((family, familyIndex) => {
                              const familyIsActive = family.lectures.some(
                                (lecture) => lecture.name === active,
                              );

                              if (family.name === null) {
                                return (
                                  <li
                                    className={`lecture-phase-direct${familyIsActive ? " active" : ""}`}
                                    key={`${phase.name}-lectures`}
                                  >
                                    <ul className="nav-list">
                                      {family.lectures.map((lecture) => (
                                        <li className="nav-list-item" key={lecture.name}>
                                          <button
                                            className={`nav-list-link${active === lecture.name ? " active" : ""}`}
                                            type="button"
                                            onClick={() => choosePage(lecture.name)}
                                          >
                                            {lecture.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                );
                              }

                              const familyLabelId = `lecture-family-${phaseIndex}-${familyIndex}`;

                              return (
                                <li
                                  className={`lecture-family${familyIsActive ? " active" : ""}`}
                                  key={family.name}
                                >
                                  <span
                                    className="lecture-family-marker"
                                    id={familyLabelId}
                                  >
                                    <span>{family.name}</span>
                                  </span>
                                  <ul
                                    aria-labelledby={familyLabelId}
                                    className="nav-list lecture-family-list"
                                  >
                                    {family.lectures.map((lecture) => (
                                      <li className="nav-list-item" key={lecture.name}>
                                        <button
                                          className={`nav-list-link${active === lecture.name ? " active" : ""}`}
                                          type="button"
                                          onClick={() => choosePage(lecture.name)}
                                        >
                                          {lecture.name}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <footer className="site-footer">
          This site uses{" "}
          <a href="https://github.com/just-the-docs/just-the-docs">
            Just the Docs
          </a>
          , a documentation theme for Jekyll.
        </footer>
      </aside>

      <main className="main" id="top">
        <header className={`main-header${menuOpen ? " nav-open" : ""}`}>
          <div className="search">
            <div className="search-input-wrap">
              <input
                className="search-input"
                type="search"
                placeholder="Search Data for AI"
                aria-label="Search Data for AI"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    event.currentTarget.blur();
                  }
                }}
              />
              <span className="search-label" aria-hidden="true">
                <span className="search-icon" />
              </span>
            </div>

            {searchOpen && query.trim() && (
              <div className="search-results" role="listbox" aria-label="Search results">
                {results.length > 0 ? (
                  results.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={active === item}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choosePage(item)}
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <p>No results found</p>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="main-content-wrap" aria-label={`${active} content`}>
          {active === "Home" ? (
            <article className="main-content lecture-content">
              <h1>Data for AI</h1>
              <p>
                Data for AI is a graduate course that will be taught at
                Russian-Armenian University in Fall 2026.
              </p>
              <p>
                The course examines how modern large language models are
                trained, what data they use, and how that data is collected,
                curated, and evaluated. By the end of the course, students
                should be prepared to contribute across the LLM training
                lifecycle, including pretraining, post-training, and
                reinforcement learning.
              </p>
            </article>
          ) : active === "Lectures" ? (
            <article
              className="main-content lecture-content"
              dangerouslySetInnerHTML={{ __html: curriculumHtml }}
            />
          ) : active === "Lecture 1: Model lifecycle" ? (
            lecture1Presenting ? (
              <Suspense fallback={null}>
                <Lecture1Presentation
                  onExit={() => setLecture1Presentation(false)}
                  presentationRootRef={lecture1Ref}
                />
              </Suspense>
            ) : (
              <>
                <div className="lecture-present-launch">
                  <button type="button" onClick={() => setLecture1Presentation(true)}>
                    Present lecture
                  </button>
                </div>
                <article
                  className="main-content lecture-content"
                  dangerouslySetInnerHTML={{ __html: lecture1Html }}
                  ref={lecture1Ref}
                />
                <AiMarketMomentsMount rootRef={lecture1Ref} />
                <ReleaseCadenceChartMount rootRef={lecture1Ref} />
              </>
            )
          ) : activeLecture ? (
            <article
              className="main-content lecture-content"
              dangerouslySetInnerHTML={{ __html: activeLecture.html }}
            />
          ) : (
            <div className="main-content" aria-hidden="true" />
          )}
        </div>

        {searchOpen && query.trim() && (
          <button
            className="search-overlay"
            aria-label="Close search"
            type="button"
            onClick={() => setSearchOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
