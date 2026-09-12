"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AiMarketMoments } from "./AiMarketMoments";
import {
  ProjectsPage,
  ReadingClubPage,
} from "./CoursePages";
import { InteractiveLearning } from "./InteractiveLearning";
import { Lecture2DataLabs } from "./Lecture2DataLabs";
import { ReleaseCadenceChartMount } from "./ReleaseCadenceChart";
import { curriculumHtml } from "./generated/curriculum";
import { introductionHtml } from "./generated/introduction";
import { lecture1Html } from "./generated/lecture-1";
import { lecture2Html } from "./generated/lecture-2";
import { lecture3Html } from "./generated/lecture-3";
import { lecture4Html } from "./generated/lecture-4";
import { lecture5Html } from "./generated/lecture-5";
import { lecture6Html } from "./generated/lecture-6";
import { lecture7Html } from "./generated/lecture-7";
import { lecture8Html } from "./generated/lecture-8";
import { lecture9Html } from "./generated/lecture-9";
import { lecture10Html } from "./generated/lecture-10";
import { lecture11Html } from "./generated/lecture-11";
import { lecture12Html } from "./generated/lecture-12";
import { lecture13Html } from "./generated/lecture-13";
import { lecture14Html } from "./generated/lecture-14";
import { lecture15Html } from "./generated/lecture-15";
import { lecture16Html } from "./generated/lecture-16";

const Lecture1Presentation = lazy(() => import("./Lecture1Presentation"));
const Lecture2Presentation = lazy(() => import("./Lecture2Presentation"));

const navigation = [
  "Home",
  "Calendar",
  "Lectures",
  "Reading Club (NLP)",
  "Projects",
] as const;

const lecturePages = [
  { name: "Introduction", html: introductionHtml },
  { name: "Lecture 1: Model lifecycle", html: lecture1Html },
  { name: "Lecture 2: Data and capabilities", html: lecture2Html },
  { name: "Lecture 3 (draft): Corpus acquisition", html: lecture3Html },
  { name: "Lecture 4 (draft): Extraction and filtering", html: lecture4Html },
  { name: "Lecture 5 (draft): Deduplication and privacy", html: lecture5Html },
  { name: "Lecture 6 (draft): Mixtures and scaling", html: lecture6Html },
  { name: "Lecture 7 (draft): Multilingual pretraining", html: lecture7Html },
  { name: "Lecture 8 (draft): Training systems", html: lecture8Html },
  { name: "Lecture 9 (draft): Evaluation", html: lecture9Html },
  { name: "Lecture 10 (draft): CPT and SFT", html: lecture10Html },
  { name: "Lecture 11 (draft): Preference alignment", html: lecture11Html },
  { name: "Lecture 12 (draft): Reasoning supervision", html: lecture12Html },
  { name: "Lecture 13 (draft): Long reasoning and RLVR", html: lecture13Html },
  { name: "Lecture 14 (draft): Synthetic data", html: lecture14Html },
  { name: "Lecture 15 (draft): Distillation", html: lecture15Html },
  { name: "Lecture 16 (draft): Capstone and release", html: lecture16Html },
] as const;

const lecturePhases = [
  {
    name: "Foundations",
    range: "01–02",
    families: [{ name: null, lectures: lecturePages.slice(1, 3) }],
  },
  {
    name: "Pretraining",
    range: "03–08",
    families: [
      { name: "Corpus engineering", lectures: lecturePages.slice(3, 6) },
      { name: "Pretraining at scale", lectures: lecturePages.slice(6, 9) },
    ],
  },
  {
    name: "Post-training",
    range: "09–16",
    families: [
      { name: "Evaluation and adaptation", lectures: lecturePages.slice(9, 12) },
      { name: "Reasoning and experience", lectures: lecturePages.slice(12, 15) },
      { name: "Transfer and release", lectures: lecturePages.slice(15, 17) },
    ],
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

function lecture2PresentationRequested() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("lecture") === "2" && params.get("mode") === "presentation";
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
  const startsInLecture2Presentation = lecture2PresentationRequested();
  const [lecture2Presenting, setLecture2Presenting] = useState(startsInLecture2Presentation);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lecturesOpen, setLecturesOpen] = useState(true);
  const [active, setActive] = useState<PageName>(
    startsInLecture1Presentation ? "Lecture 1: Model lifecycle" : startsInLecture2Presentation ? "Lecture 2: Data and capabilities" : "Home",
  );
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [lecture1Presenting, setLecture1Presenting] = useState(
    startsInLecture1Presentation,
  );
  const lecture1Ref = useRef<HTMLElement>(null);
  const activeLectureRef = useRef<HTMLElement>(null);
  const activeLecture = lecturePages.find((lecture) => lecture.name === active);
  const activeLectureNumber = lecturePages.findIndex(
    (lecture) => lecture.name === active,
  );

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [...navigation, ...lectures].filter((item) =>
      item.toLowerCase().includes(normalized),
    );
  }, [query]);

  function choosePage(item: PageName) {
    setLecture2Presenting(false);
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

  function setLecture2Presentation(presenting: boolean) {
    setLecture2Presenting(presenting);
    const url = new URL(window.location.href);
    if (presenting) {
      url.searchParams.set("lecture", "2");
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
          ) : activeLectureNumber === 2 && lecture2Presenting ? (
            <Suspense fallback={null}>
              <Lecture2Presentation onExit={() => setLecture2Presentation(false)} />
            </Suspense>
          ) : activeLecture ? (
            <>
              {activeLectureNumber === 2 && (
                <div className="lecture-present-launch">
                  <button type="button" onClick={() => setLecture2Presentation(true)}>Present lecture</button>
                </div>
              )}
              <article
                className="main-content lecture-content"
                dangerouslySetInnerHTML={{ __html: activeLecture.html }}
                ref={activeLectureRef}
              />
              {activeLectureNumber === 2 && (
                <Lecture2DataLabs rootRef={activeLectureRef} />
              )}
              {activeLectureNumber > 2 && (
                <InteractiveLearning
                  key={activeLectureNumber}
                  lectureNumber={activeLectureNumber}
                />
              )}
            </>
          ) : active === "Reading Club (NLP)" ? (
            <ReadingClubPage />
          ) : active === "Projects" ? (
            <ProjectsPage />
          ) : active === "Calendar" ? (
            <article className="main-content lecture-content">
              <h1>{active}</h1>
              <p>To be announced soon.</p>
            </article>
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
