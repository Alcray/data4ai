"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AiMarketMoments } from "./AiMarketMoments";
import { PaperDiscussionsPage, PaperReviewsPage, ProjectsPage } from "./CoursePages";
import { InteractiveLearning } from "./InteractiveLearning";
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

const navigation = [
  "Home",
  "Calendar",
  "Lectures",
  "Paper reviews",
  "Paper discussions",
  "Projects",
] as const;

const lecturePages = [
  { name: "Introduction", html: introductionHtml },
  { name: "Lecture 1: Model lifecycle", html: lecture1Html },
  { name: "Lecture 2 (draft): Transformer from scratch", html: lecture2Html },
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

const lectureFamilies = [
  { name: "Foundations", lectures: lecturePages.slice(1, 3) },
  { name: "Corpus engineering", lectures: lecturePages.slice(3, 6) },
  { name: "Pretraining at scale", lectures: lecturePages.slice(6, 9) },
  { name: "Evaluation and adaptation", lectures: lecturePages.slice(9, 12) },
  { name: "Reasoning and experience", lectures: lecturePages.slice(12, 15) },
  { name: "Transfer and release", lectures: lecturePages.slice(15, 17) },
] as const;

type LectureName = (typeof lecturePages)[number]["name"];
type PageName = (typeof navigation)[number] | LectureName;
const lectures = lecturePages.map((lecture) => lecture.name);

type ReleaseDetails = {
  date: string;
  family?: string;
  href: string;
  left: number;
  name: string;
  note: string;
  placement: "above" | "below";
  sourceLabel: string;
  top: number;
};

function ReleaseCadencePopover({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const [details, setDetails] = useState<ReleaseDetails | null>(null);
  const activeReleaseRef = useRef<Element | null>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const lastPointerTypeRef = useRef("");
  const touchArmedRef = useRef<Element | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const releases = root.querySelectorAll("[data-release-name]");
    const chart = root.querySelector<SVGSVGElement>(".release-cadence-plot");
    const rangeButtons = root.querySelectorAll<HTMLButtonElement>("[data-cadence-range]");
    const gridLines = root.querySelectorAll<SVGLineElement>("[data-cadence-grid-date]");
    const axisLabels = root.querySelectorAll<SVGTextElement>("[data-cadence-label-date]");
    const rangeBounds = {
      overview: {
        end: Date.parse("2026-08-14T00:00:00Z"),
        start: Date.parse("2022-11-30T00:00:00Z"),
      },
      "2024": {
        end: Date.parse("2024-12-31T23:59:59Z"),
        start: Date.parse("2024-01-01T00:00:00Z"),
      },
      "2025": {
        end: Date.parse("2025-12-31T23:59:59Z"),
        start: Date.parse("2025-01-01T00:00:00Z"),
      },
      "2026": {
        end: Date.parse("2026-08-14T00:00:00Z"),
        start: Date.parse("2026-01-01T00:00:00Z"),
      },
    } as const;
    type CadenceRange = keyof typeof rangeBounds;
    const plotStart = 140;
    const plotEnd = 850;
    const svgNamespace = "http://www.w3.org/2000/svg";
    const generatedLabels: SVGTextElement[] = [];
    let speakingButton: Element | null = null;
    let pronunciationAudio: HTMLAudioElement | null = null;

    releases.forEach((release) => {
      const name = release.getAttribute("data-release-name") ?? "Model release";
      const date = release.getAttribute("data-release-date") ?? "";
      release.setAttribute("aria-label", `${name}, ${date}`);

      if (!release.querySelector("text")) {
        const label = document.createElementNS(svgNamespace, "text");
        label.textContent = release.getAttribute("data-release-label") ?? name;
        label.setAttribute("data-cadence-generated-label", "");
        release.append(label);
        generatedLabels.push(label);
      }
    });

    const releaseFromEvent = (event: Event) =>
      event.target instanceof Element
        ? event.target.closest("[data-release-name]")
        : null;

    const cancelHide = () => {
      if (hideTimerRef.current !== undefined) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = undefined;
      }
    };

    const showRelease = (release: Element) => {
      cancelHide();
      if (activeReleaseRef.current && activeReleaseRef.current !== release) {
        activeReleaseRef.current.removeAttribute("aria-describedby");
      }

      activeReleaseRef.current = release;
      release.setAttribute("aria-describedby", "release-cadence-popover");
      const rect = release.getBoundingClientRect();
      const popoverWidth = Math.min(320, window.innerWidth - 24);
      const placement = rect.top > 230 ? "above" : "below";
      const left = Math.min(
        window.innerWidth - popoverWidth - 12,
        Math.max(12, rect.left + rect.width / 2 - popoverWidth / 2),
      );

      setDetails({
        date: release.getAttribute("data-release-date") ?? "",
        family: release.getAttribute("data-release-family") ?? undefined,
        href: release.getAttribute("href") ?? "",
        left,
        name: release.getAttribute("data-release-name") ?? "Model release",
        note: release.getAttribute("data-release-note") ?? "",
        placement,
        sourceLabel: release.getAttribute("data-source-label") ?? "Primary source",
        top: placement === "above" ? rect.top - 10 : rect.bottom + 10,
      });
    };

    const hideRelease = () => {
      activeReleaseRef.current?.removeAttribute("aria-describedby");
      activeReleaseRef.current = null;
      setDetails(null);
    };

    const clearSpeakingState = () => {
      speakingButton?.removeAttribute("data-speaking");
      speakingButton = null;
    };

    const stopPronunciation = () => {
      pronunciationAudio?.pause();
      pronunciationAudio = null;
      clearSpeakingState();
    };

    const playPronunciation = (button: Element) => {
      const audioSource = button.getAttribute("data-pronounce-audio");
      if (!audioSource) return;

      stopPronunciation();

      const audio = new Audio(audioSource);
      const finishPlayback = () => {
        if (pronunciationAudio !== audio) return;
        pronunciationAudio = null;
        clearSpeakingState();
      };

      pronunciationAudio = audio;
      speakingButton = button;
      button.setAttribute("data-speaking", "true");
      audio.preload = "auto";
      audio.addEventListener("ended", finishPlayback, { once: true });
      audio.addEventListener("error", finishPlayback, { once: true });
      void audio.play().catch(finishPlayback);
    };

    const parseReleaseDate = (value: string | null) =>
      value ? Date.parse(`${value} UTC`) : Number.NaN;

    const positionForDate = (date: number, start: number, end: number) =>
      plotStart + ((date - start) / (end - start)) * (plotEnd - plotStart);

    const isInScope = (element: Element, range: CadenceRange) => {
      const scopes = element.getAttribute("data-cadence-scopes");
      return !scopes || scopes.split(/\s+/).includes(range);
    };

    const layoutLabels = () => {
      root.querySelectorAll<SVGGElement>(".cadence-series").forEach((series) => {
        const circleYs = Array.from(
          series.querySelectorAll<SVGCircleElement>("circle"),
          (circle) => Number(circle.getAttribute("cy") ?? 0),
        ).sort((a, b) => a - b);
        const laneY = circleYs[Math.floor(circleYs.length / 2)] ?? 0;
        const rowEnds = [-Infinity, -Infinity, -Infinity, -Infinity];
        const rowOffsets = [-13, 16, -25, 28];
        const labeledReleases = Array.from(
          series.querySelectorAll<SVGElement>("[data-release-name]:not([hidden])"),
        )
          .filter((release) => !release.querySelector("text")?.hasAttribute("hidden"))
          .sort(
            (a, b) =>
              parseReleaseDate(a.getAttribute("data-release-date")) -
              parseReleaseDate(b.getAttribute("data-release-date")),
          );

        labeledReleases.forEach((release) => {
          const label = release.querySelector<SVGTextElement>("text");
          const circle = release.querySelector<SVGCircleElement>("circle");
          if (!label || !circle) return;

          const x = Number(circle.getAttribute("cx") ?? plotStart);
          const width = Math.max(
            label.getComputedTextLength(),
            (label.textContent?.length ?? 0) * 5.2,
          );
          const anchor =
            x < plotStart + width / 2 + 5
              ? "start"
              : x > plotEnd - width / 2 - 5
                ? "end"
                : "middle";
          const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
          const right = anchor === "start" ? x + width : anchor === "end" ? x : x + width / 2;
          let row = rowEnds.findIndex((rowEnd) => left > rowEnd + 7);

          if (row === -1) {
            row = rowEnds.indexOf(Math.min(...rowEnds));
          }

          rowEnds[row] = right;
          label.setAttribute("x", String(x));
          label.setAttribute("y", String(laneY + rowOffsets[row]));
          label.setAttribute("text-anchor", anchor);
          label.querySelectorAll<SVGTSpanElement>("tspan").forEach((line) => {
            line.setAttribute("x", String(x));
          });
        });
      });
    };

    const applyCadenceRange = (range: CadenceRange) => {
      hideRelease();
      const { end, start } = rangeBounds[range];
      chart?.setAttribute("data-range", range);

      rangeButtons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.getAttribute("data-cadence-range") === range),
        );
      });

      gridLines.forEach((line) => {
        const date = Date.parse(`${line.getAttribute("data-cadence-grid-date")}T00:00:00Z`);
        const visible = isInScope(line, range) && date >= start && date <= end;
        line.toggleAttribute("hidden", !visible);
        if (visible) {
          const x = positionForDate(date, start, end);
          line.setAttribute("x1", String(x));
          line.setAttribute("x2", String(x));
        }
      });

      axisLabels.forEach((label) => {
        const date = Date.parse(`${label.getAttribute("data-cadence-label-date")}T00:00:00Z`);
        const visible = isInScope(label, range) && date >= start && date <= end;
        label.toggleAttribute("hidden", !visible);
        if (visible) label.setAttribute("x", String(positionForDate(date, start, end)));
      });

      releases.forEach((release) => {
        const date = parseReleaseDate(release.getAttribute("data-release-date"));
        const visible = Number.isFinite(date) && date >= start && date <= end;
        release.toggleAttribute("hidden", !visible);
        if (!visible) return;

        const x = positionForDate(date, start, end);
        const circles = release.querySelectorAll<SVGCircleElement>("circle");
        circles.forEach((circle) => circle.setAttribute("cx", String(x)));

        const radius = Math.max(
          ...Array.from(circles, (circle) => Number(circle.getAttribute("r") ?? 0)),
        );
        const showLabel = range !== "overview" || radius >= 3.9;
        release.querySelectorAll<SVGTextElement>("text").forEach((label) => {
          label.toggleAttribute("hidden", !showLabel);
          label.setAttribute("x", String(x));
          label.querySelectorAll<SVGTSpanElement>("tspan").forEach((line) => {
            line.setAttribute("x", String(x));
          });
        });
      });

      layoutLabels();
    };

    applyCadenceRange("overview");

    const scheduleHide = () => {
      cancelHide();
      hideTimerRef.current = window.setTimeout(hideRelease, 180);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const release = releaseFromEvent(event);
      if (release) showRelease(release);
    };

    const handlePointerOut = (event: PointerEvent) => {
      const release = releaseFromEvent(event);
      if (!release) return;
      if (event.relatedTarget instanceof Node && release.contains(event.relatedTarget)) return;
      scheduleHide();
    };

    const handlePointerDown = (event: PointerEvent) => {
      lastPointerTypeRef.current = event.pointerType;
      const release = releaseFromEvent(event);
      if (release && event.pointerType === "touch") showRelease(release);
    };

    const handleClick = (event: MouseEvent) => {
      const pronunciationButton =
        event.target instanceof Element
          ? event.target.closest("[data-pronounce-audio]")
          : null;
      if (pronunciationButton) {
        event.preventDefault();
        playPronunciation(pronunciationButton);
        return;
      }

      const rangeButton =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>("[data-cadence-range]")
          : null;
      const range = rangeButton?.getAttribute("data-cadence-range");
      if (range && range in rangeBounds) {
        applyCadenceRange(range as CadenceRange);
        return;
      }

      const release = releaseFromEvent(event);
      if (!release || lastPointerTypeRef.current !== "touch") return;
      if (touchArmedRef.current !== release) {
        event.preventDefault();
        touchArmedRef.current = release;
        showRelease(release);
      } else {
        touchArmedRef.current = null;
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const release = releaseFromEvent(event);
      if (release) showRelease(release);
    };

    const handleFocusOut = (event: FocusEvent) => {
      const release = releaseFromEvent(event);
      if (!release) return;
      if (event.relatedTarget instanceof Node && release.contains(event.relatedTarget)) return;
      scheduleHide();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const pronunciationButton =
        event.target instanceof Element
          ? event.target.closest("[data-pronounce-audio]")
          : null;
      if (pronunciationButton && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        playPronunciation(pronunciationButton);
        return;
      }
      if (event.key === "Escape") hideRelease();
    };

    const handleViewportChange = () => hideRelease();

    root.addEventListener("pointerover", handlePointerOver);
    root.addEventListener("pointerout", handlePointerOut);
    root.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("click", handleClick, true);
    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);
    root.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      cancelHide();
      stopPronunciation();
      activeReleaseRef.current?.removeAttribute("aria-describedby");
      releases.forEach((release) => release.removeAttribute("aria-label"));
      generatedLabels.forEach((label) => label.remove());
      root.removeEventListener("pointerover", handlePointerOver);
      root.removeEventListener("pointerout", handlePointerOut);
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("click", handleClick, true);
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
      root.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [rootRef]);

  if (!details) return null;

  return (
    <aside
      aria-label={`Release details for ${details.name}`}
      className={`release-cadence-popover ${details.placement}`}
      id="release-cadence-popover"
      onPointerEnter={() => {
        if (hideTimerRef.current !== undefined) {
          window.clearTimeout(hideTimerRef.current);
          hideTimerRef.current = undefined;
        }
      }}
      onPointerLeave={() => {
        hideTimerRef.current = window.setTimeout(() => {
          activeReleaseRef.current?.removeAttribute("aria-describedby");
          activeReleaseRef.current = null;
          setDetails(null);
        }, 180);
      }}
      style={{ left: details.left, top: details.top }}
    >
      <div className="release-cadence-popover-heading">
        <strong>{details.name}</strong>
        <time>{details.date}</time>
      </div>
      {details.family && <p className="release-cadence-family">{details.family}</p>}
      <p>{details.note}</p>
      <a href={details.href}>{details.sourceLabel} →</a>
    </aside>
  );
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [lecturesOpen, setLecturesOpen] = useState(true);
  const [active, setActive] = useState<PageName>("Home");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const lecture1Ref = useRef<HTMLElement>(null);
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
    setActive(item);
    if (lectures.includes(item as LectureName)) {
      setLecturesOpen(true);
    }
    setQuery("");
    setSearchOpen(false);
    setMenuOpen(false);
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
                    {lectureFamilies.map((family, familyIndex) => {
                      const familyLabelId = `lecture-family-${familyIndex}`;
                      const familyIsActive = family.lectures.some(
                        (lecture) => lecture.name === active,
                      );

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
            <>
              <article
                className="main-content lecture-content"
                dangerouslySetInnerHTML={{ __html: lecture1Html }}
                ref={lecture1Ref}
              />
              <AiMarketMomentsMount rootRef={lecture1Ref} />
              <ReleaseCadencePopover rootRef={lecture1Ref} />
            </>
          ) : activeLecture ? (
            <>
              <article
                className="main-content lecture-content"
                dangerouslySetInnerHTML={{ __html: activeLecture.html }}
              />
              {activeLectureNumber > 0 && (
                <InteractiveLearning
                  key={activeLectureNumber}
                  lectureNumber={activeLectureNumber}
                />
              )}
            </>
          ) : active === "Paper reviews" ? (
            <PaperReviewsPage />
          ) : active === "Paper discussions" ? (
            <PaperDiscussionsPage />
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
