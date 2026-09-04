"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Deck, Slide } from "@revealjs/react";
import type { RevealApi } from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes";
import "reveal.js/reveal.css";
import "./Lecture1Presentation.css";
import { AiMarketMoments } from "./AiMarketMoments";
import { lecture1Html } from "./generated/lecture-1";

type PreferenceExample = {
  answers: Array<{ html: string; label: string }>;
  promptHtml: string;
  rankingHtml: string;
  title: string;
};

type ModelMoment = {
  date: string;
  description: string;
  title: string;
};

type TimelineRelease = {
  cluster?: TimelineRelease[];
  date: string;
  dateValue: number;
  family?: string;
  href: string;
  id: string;
  label: string;
  name: string;
  note: string;
  radius: number;
  restricted: boolean;
  sourceLabel: string;
};

type TimelineProvider = {
  key: string;
  logoHref: string;
  name: string;
  releases: TimelineRelease[];
};

const overviewClusterWindowDays = 28;
const overviewMarkerGap = 5;

function clusterTimelineReleases(
  releases: TimelineRelease[],
  xForDate: (date: number) => number,
): TimelineRelease[] {
  const clusterWindow = overviewClusterWindowDays * 24 * 60 * 60 * 1000;
  const sorted = [...releases].sort((a, b) => a.dateValue - b.dateValue);
  const groups: TimelineRelease[][] = [];
  let current: TimelineRelease[] = [];
  let windowStart = Number.NaN;

  sorted.forEach((release) => {
    if (!current.length) {
      current.push(release);
      windowStart = release.dateValue;
      return;
    }

    const currentLast = current.at(-1)!.dateValue;
    const currentMidpoint = windowStart + (currentLast - windowStart) / 2;
    const currentMarkerRadius =
      current.length === 1
        ? current[0].radius
        : current.some((candidate) => candidate.radius >= 3.75)
          ? 4
          : 3;
    const visuallyClose =
      xForDate(release.dateValue) - xForDate(currentMidpoint) <=
      currentMarkerRadius + release.radius + overviewMarkerGap;

    if (release.dateValue - windowStart <= clusterWindow && visuallyClose) {
      current.push(release);
      return;
    }

    groups.push(current);
    current = [release];
    windowStart = release.dateValue;
  });
  if (current.length) groups.push(current);

  return groups.map((group) => {
    if (group.length === 1) return group[0];

    const first = group[0];
    const last = group.at(-1)!;
    const majorLabels = group
      .filter((release) => release.radius >= 3.75 && release.label)
      .map((release) => release.label);

    return {
      cluster: group,
      date: `${first.date} – ${last.date}`,
      dateValue: first.dateValue + (last.dateValue - first.dateValue) / 2,
      family: `Grouped because these ${group.length} releases would compete for the same visual space in the compressed overview; the full span is no more than four weeks.`,
      href: first.href,
      id: `cluster-${first.id}-${last.id}`,
      label:
        majorLabels.length > 1
          ? `${majorLabels[0]} + ${majorLabels.length - 1}`
          : majorLabels[0] ?? "",
      name: `${group.length} releases`,
      note: "The compound marker replaces overlapping dots while preserving each release in the breakdown.",
      radius: majorLabels.length ? 4 : 3,
      restricted: false,
      sourceLabel: "Release cluster",
    };
  });
}

const asset = (path: string) => `${import.meta.env.BASE_URL}lecture-1/${path}`;

function parseReleaseTimeline(document: Document): TimelineProvider[] {
  const template = document.querySelector<HTMLTemplateElement>("[data-release-cadence-source]");
  const source: ParentNode = template?.content ?? document;
  const svg = source.querySelector<SVGSVGElement>(".release-cadence-plot");
  if (!svg) return [];

  const providerGroup = svg.querySelector<SVGGElement>(".cadence-providers");
  const logos = Array.from(providerGroup?.children ?? []).filter(
    (element): element is SVGImageElement => element.tagName.toLowerCase() === "image",
  );
  const names = Array.from(providerGroup?.children ?? []).filter(
    (element): element is SVGTextElement => element.tagName.toLowerCase() === "text",
  );

  return Array.from(svg.querySelectorAll<SVGGElement>(".cadence-series"), (series, providerIndex) => {
    const key = Array.from(series.classList).find((name) => name !== "cadence-series") ?? "provider";
    const logo = logos[providerIndex];
    const releases = Array.from(
      series.querySelectorAll<SVGAElement>("[data-release-name]"),
      (release, releaseIndex): TimelineRelease => {
        const circle = release.querySelector<SVGCircleElement>("circle");
        const date = release.getAttribute("data-release-date") ?? "";
        const dateValue = Date.parse(`${date} UTC`);
        return {
          date,
          dateValue,
          family: release.getAttribute("data-release-family") ?? undefined,
          href: release.getAttribute("href") ?? "",
          id: `${key}-${releaseIndex}`,
          label:
            release.querySelector("text")?.textContent?.trim() ??
            release.getAttribute("data-release-label") ??
            "",
          name: release.getAttribute("data-release-name") ?? "Model release",
          note: release.getAttribute("data-release-note") ?? "",
          radius: Number(circle?.getAttribute("r") ?? 3),
          restricted: circle?.classList.contains("restricted") ?? false,
          sourceLabel: release.getAttribute("data-source-label") ?? "Primary source",
        };
      },
    ).filter((release) => Number.isFinite(release.dateValue));

    return {
      key,
      logoHref: logo?.getAttribute("href") ?? "",
      name: names[providerIndex]?.textContent?.trim() ?? key,
      releases,
    };
  });
}

function parseLectureVisuals() {
  const document = new DOMParser().parseFromString(lecture1Html, "text/html");
  const outerHtml = (selector: string) =>
    document.querySelector(selector)?.outerHTML ?? "";
  const preferenceExamples: PreferenceExample[] = Array.from(
    document.querySelectorAll<HTMLElement>(".preference-example"),
    (example) => ({
      answers: Array.from(example.querySelectorAll<HTMLElement>(".candidate-answer"), (answer) => ({
        html: answer.querySelector("p")?.innerHTML ?? "",
        label: answer.querySelector("strong")?.textContent?.trim() ?? "",
      })),
      promptHtml: example.querySelector<HTMLElement>(".preference-prompt")?.innerHTML ?? "",
      rankingHtml: example.querySelector<HTMLElement>(".preference-ranking")?.innerHTML ?? "",
      title: example.querySelector("h3")?.textContent?.trim() ?? "Preference comparison",
    }),
  );
  const moments: ModelMoment[] = Array.from(
    document.querySelectorAll<HTMLElement>(".moment-list .moment"),
    (moment) => ({
      date: moment.querySelector("time")?.textContent?.trim() ?? "",
      description: moment.querySelector("p")?.textContent?.trim() ?? "",
      title: moment.querySelector("strong")?.textContent?.trim() ?? "Model release",
    }),
  );

  return {
    arena: outerHtml(".arena-comparison"),
    moments,
    preferenceExamples,
    replication: outerHtml(".benchmark-replication"),
    timeline: parseReleaseTimeline(document),
  };
}

function ResponsiveReleaseTimeline({ providers }: { providers: TimelineProvider[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 430, width: 1180 });
  const [active, setActive] = useState<{
    provider: string;
    release: TimelineRelease;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { clientHeight: height, clientWidth: width } = container;
      if (width > 0 && height > 0) {
        setSize({ height: Math.round(height), width: Math.round(width) });
      }
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    updateSize();
    return () => observer.disconnect();
  }, []);

  const graphWidth = Math.max(720, size.width);
  const graphHeight = Math.max(360, size.height);
  const plotStart = Math.max(126, Math.min(154, graphWidth * 0.12));
  const plotEnd = graphWidth - 18;
  const plotTop = 22;
  const plotBottom = graphHeight - 34;
  const start = Date.UTC(2022, 10, 30);
  const end = Date.UTC(2026, 8, 4, 23, 59, 59);
  const xForDate = (date: number) =>
    plotStart + ((date - start) / (end - start)) * (plotEnd - plotStart);
  const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value));
  const laneGap = providers.length > 1 ? (plotBottom - plotTop) / (providers.length - 1) : 0;
  const maxLabelsPerLane = graphWidth >= 1050 ? 2 : 1;
  const yearMarks = [2023, 2024, 2025, 2026];

  const positionedReleases = providers.map((provider, providerIndex) => {
    const laneY = plotTop + providerIndex * laneGap;
    const clustered = clusterTimelineReleases(provider.releases, xForDate);
    const positions = clustered.map((release) => ({
      release,
      x: xForDate(release.dateValue),
      y: laneY,
    }));
    return {
      laneY,
      provider,
      releases: positions.map((position, index) => {
        const previousGap =
          index > 0 ? position.x - positions[index - 1].x : Infinity;
        const nextGap =
          index < positions.length - 1 ? positions[index + 1].x - position.x : Infinity;
        const nearestGap = Math.min(previousGap, nextGap);
        return {
          ...position,
          hitRadius: Math.min(
            9,
            Math.max(position.release.radius + 2, (nearestGap - 1) / 2),
          ),
        };
      }),
    };
  });

  const labelsByProvider = positionedReleases.map(({ releases }) => {
    const candidates = releases.filter(
      ({ release }) => release.label && release.radius >= 3.75,
    );
    const prioritized = candidates
      .map((candidate, index) => ({
        ...candidate,
        priority:
          (index === candidates.length - 1 ? 10_000 : 0) +
          (index === 0 ? 4_000 : 0) +
          (candidate.release.radius >= 4 ? 1_000 : 0) +
          index,
      }))
      .sort((a, b) => b.priority - a.priority);
    const selected: Array<(typeof prioritized)[number] & { left: number; right: number }> = [];

    for (const candidate of prioritized) {
      const estimatedWidth = clamp(candidate.release.label.length * 5.7, 34, 145);
      const left = clamp(candidate.x - estimatedWidth / 2, plotStart, plotEnd - estimatedWidth);
      const right = left + estimatedWidth;
      const fits = selected.every((other) => right + 14 < other.left || left > other.right + 14);
      if (fits) selected.push({ ...candidate, left, right });
      if (selected.length === maxLabelsPerLane) break;
    }

    return new Map(selected.map((candidate) => [candidate.release.id, candidate]));
  });

  const resolveLogo = (href: string) =>
    /^(?:https?:)?\/\//.test(href)
      ? href
      : `${import.meta.env.BASE_URL}${href.replace(/^\//, "")}`;

  return (
    <div className="lp-responsive-timeline" ref={containerRef}>
      <svg
        aria-labelledby="lp-cadence-title lp-cadence-description"
        className="release-cadence-plot"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
      >
        <title id="lp-cadence-title">Selected model releases by provider and date</title>
        <desc id="lp-cadence-description">
          Thirteen provider lanes show public model releases from November 2022 through 4 September 2026. Nearby same-provider releases that would crowd the compressed view use a ring with a center dot and an interactive breakdown; labels are selected according to the available width.
        </desc>

        <g className="cadence-grid" aria-hidden="true">
          {yearMarks.map((year) => {
            const x = xForDate(Date.UTC(year, 0, 1));
            return <line key={`grid-${year}`} x1={x} x2={x} y1={plotTop - 12} y2={plotBottom + 10} />;
          })}
          {positionedReleases.map(({ laneY, provider }) => (
            <line key={`lane-${provider.key}`} x1={plotStart} x2={plotEnd} y1={laneY} y2={laneY} />
          ))}
        </g>

        <g className="cadence-axis" aria-hidden="true">
          {yearMarks.map((year) => {
            const labelDate = year === 2026 ? Date.UTC(2026, 4, 1) : Date.UTC(year, 6, 1);
            return (
              <text key={`year-${year}`} textAnchor="middle" x={xForDate(labelDate)} y={graphHeight - 8}>
                {year}
              </text>
            );
          })}
        </g>

        {positionedReleases.map(({ laneY, provider, releases }, providerIndex) => {
          const selectedLabels = labelsByProvider[providerIndex];
          return (
            <g key={provider.key}>
              <g className="cadence-providers" aria-hidden="true">
                <image height="20" href={resolveLogo(provider.logoHref)} width="20" x="5" y={laneY - 10} />
                <text x="33" y={laneY + 4}>{provider.name}</text>
              </g>
              <g className={`cadence-series ${provider.key}`}>
                {releases.map(({ hitRadius, release, x, y }) => {
                  const label = selectedLabels.get(release.id);
                  const estimatedWidth = label ? label.right - label.left : 0;
                  const anchor =
                    !label || x < plotStart + estimatedWidth / 2 + 3
                      ? "start"
                      : x > plotEnd - estimatedWidth / 2 - 3
                        ? "end"
                        : "middle";
                  return (
                    <a
                      aria-label={`${release.name}, ${release.date}`}
                      className={`cadence-marker${release.cluster ? " cadence-cluster-marker" : ""}`}
                      data-release-name={release.name}
                      href={release.href}
                      key={release.id}
                      onBlur={() => setActive(null)}
                      onFocus={() => setActive({ provider: provider.name, release, x, y })}
                      onPointerEnter={() => setActive({ provider: provider.name, release, x, y })}
                      onPointerLeave={() => setActive(null)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <circle className="cadence-marker-hit" cx={x} cy={y} r={hitRadius} />
                      {release.cluster ? (
                        <>
                          <circle className="cadence-marker-shape cadence-cluster-ring" cx={x} cy={y} r={release.radius} />
                          <circle className="cadence-cluster-core" cx={x} cy={y} r="1.4" />
                        </>
                      ) : (
                        <circle
                          className={`cadence-marker-shape${release.restricted ? " restricted" : ""}`}
                          cx={x}
                          cy={y}
                          r={release.radius}
                        />
                      )}
                      {label && (
                        <text textAnchor={anchor} x={x} y={laneY - 9}>
                          {release.label}
                        </text>
                      )}
                    </a>
                  );
                })}
              </g>
            </g>
          );
        })}
      </svg>

      {active && (
        <div
          className={`lp-timeline-popover ${active.y > graphHeight * 0.55 ? "above" : "below"}`}
          style={{
            left: clamp(active.x - 140, 8, graphWidth - 288),
            top: active.y > graphHeight * 0.55 ? active.y - 11 : active.y + 11,
          }}
        >
          <div><strong>{active.release.name}</strong><time>{active.release.date}</time></div>
          <span>
            {active.provider} · {active.release.cluster ? "close-release cluster" : active.release.sourceLabel}
          </span>
          {active.release.cluster ? (
            <ul className="lp-timeline-cluster-list">
              {active.release.cluster.map((release) => (
                <li key={release.id}>
                  <strong>{release.name}</strong>
                  <time>{release.date}</time>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {active.release.family && <p>{active.release.family}</p>}
              {active.release.note && <p>{active.release.note}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SlideFrame({
  children,
  className = "",
  kicker,
  notes,
  source,
  title,
}: {
  children: ReactNode;
  className?: string;
  kicker: string;
  notes: string;
  source?: ReactNode;
  title: string;
}) {
  return (
    <Slide className={`lecture-presentation-slide ${className}`} notes={notes}>
      <div className="lp-slide-shell">
        <header className="lp-slide-header">
          <p className="lp-kicker">{kicker}</p>
          <h2>{title}</h2>
        </header>
        <div className="lp-slide-body">{children}</div>
        {source && <footer className="lp-source">{source}</footer>}
      </div>
    </Slide>
  );
}

function PreferenceComparisons({ examples }: { examples: PreferenceExample[] }) {
  const [selected, setSelected] = useState(0);
  const [ranking, setRanking] = useState<string[]>([]);
  const [rankingVisible, setRankingVisible] = useState(false);
  const example = examples[selected];

  if (!example) return null;

  return (
    <div className="lp-preference-lab">
      <div className="lp-preference-tabs" aria-label="Preference examples">
        {examples.map((item, index) => (
          <button
            aria-pressed={selected === index}
            key={item.title}
            onClick={() => {
              setSelected(index);
              setRanking([]);
              setRankingVisible(false);
            }}
            type="button"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="lp-preference-prompt" dangerouslySetInnerHTML={{ __html: example.promptHtml }} />
      <div className="lp-preference-answers">
        {example.answers.map((answer) => {
          const rank = ranking.indexOf(answer.label);
          return (
          <button
            aria-label={`${answer.label}${rank >= 0 ? `, ranked ${rank + 1}` : ", not ranked"}`}
            aria-pressed={rank >= 0}
            key={answer.label}
            onClick={() => {
              setRanking((current) => current.includes(answer.label)
                ? current.filter((label) => label !== answer.label)
                : [...current, answer.label]);
              setRankingVisible(false);
            }}
            type="button"
          >
            <strong>{rank >= 0 ? rank + 1 : answer.label}</strong>
            <span className="lp-preference-answer-copy" dangerouslySetInnerHTML={{ __html: answer.html }} />
          </button>
          );
        })}
      </div>
      <div className="lp-preference-result">
        <span>CHOOSE FROM BEST TO WORST</span>
        <div className="lp-preference-order" aria-live="polite">
          {example.answers.map((_, index) => <b key={index}>{ranking[index] ?? "—"}</b>)}
        </div>
        <div className="lp-preference-actions">
          <button disabled={ranking.length === 0} onClick={() => { setRanking([]); setRankingVisible(false); }} type="button">Reset</button>
          <button disabled={ranking.length !== example.answers.length} onClick={() => setRankingVisible((visible) => !visible)} type="button">
            {rankingVisible ? "Hide source ranking" : "Compare with source"}
          </button>
        </div>
        {rankingVisible && <p dangerouslySetInnerHTML={{ __html: example.rankingHtml }} />}
      </div>
    </div>
  );
}

function MomentGrid({ moments }: { moments: ModelMoment[] }) {
  return (
    <div className="lp-moment-list">
      {moments.map((moment) => (
        <div key={`${moment.date}-${moment.title}`} title={moment.description}>
          <time>{moment.date}</time>
          <strong>{moment.title}</strong>
        </div>
      ))}
    </div>
  );
}

const lifecycle = [
  "Corpus construction",
  "Representation & architecture",
  "Pretraining",
  "Evaluation",
  "Post-training",
  "Release",
];

const objectives = [
  "Reconstruct the model lifecycle",
  "Explain the ChatGPT discontinuity",
  "Describe the RLHF pipeline",
  "Interpret benchmark scores",
  "Place releases on one timeline",
  "Separate evidence from speculation",
];

export default function Lecture1Presentation({
  onExit,
  presentationRootRef,
}: {
  onExit: () => void;
  presentationRootRef?: RefObject<HTMLElement | null>;
}) {
  const deckRef = useRef<RevealApi | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOverview, setIsOverview] = useState(false);
  const visuals = useMemo(() => parseLectureVisuals(), []);

  function setPresentationRoot(node: HTMLDivElement | null) {
    rootRef.current = node;
    if (presentationRootRef) presentationRootRef.current = node;
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "q") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onExit();
        return;
      }
      if (key === "o") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const deck = deckRef.current;
        if (deck?.isPaused()) deck.togglePause(false);
        setIsOverview((current) => !current);
        return;
      }
      if (isOverview && event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsOverview(false);
        return;
      }
      if (isOverview && event.key !== "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          deckRef.current?.layout();
        });
      });
    };
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [isOverview, onExit]);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    if (deck.isPaused()) deck.togglePause(false);
    if (deck.isOverview()) deck.toggleOverview(false);

    if (isOverview) {
      window.requestAnimationFrame(() => {
        deck.getCurrentSlide()?.scrollIntoView({ block: "center", inline: "center" });
      });
    } else {
      window.requestAnimationFrame(() => deck.layout());
    }
  }, [isOverview]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await rootRef.current?.requestFullscreen();
    }
    deckRef.current?.layout();
  }

  function toggleOverview() {
    const deck = deckRef.current;
    if (!deck) return;
    if (deck.isPaused()) deck.togglePause(false);
    if (deck.isOverview()) deck.toggleOverview(false);
    setIsOverview((current) => !current);
  }

  function selectOverviewSlide(event: ReactMouseEvent<HTMLDivElement>) {
    if (!isOverview || !(event.target instanceof Element)) return;
    const slide = event.target.closest<HTMLElement>(".slides > section");
    if (!slide) return;
    const slides = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(".slides > section") ?? []);
    const index = slides.indexOf(slide);
    if (index < 0) return;

    event.preventDefault();
    event.stopPropagation();
    setIsOverview(false);
    window.requestAnimationFrame(() => {
      deckRef.current?.slide(index);
      deckRef.current?.layout();
    });
  }

  function closePresentation() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().finally(onExit);
      return;
    }
    onExit();
  }

  return (
    <div
      aria-label="Lecture 1 presentation"
      className={`lecture-presentation${isOverview ? " lp-custom-overview" : ""}`}
      onClickCapture={selectOverviewSlide}
      ref={setPresentationRoot}
      tabIndex={-1}
    >
      {isOverview && (
        <div className="lp-overview-heading">
          <strong>Slide overview</strong>
          <span>Choose a slide to continue</span>
        </div>
      )}
      <nav className="lp-toolbar" aria-label="Presentation controls">
        <button onClick={toggleOverview} type="button">
          {isOverview ? "Close overview" : "Overview"}
        </button>
        <button onClick={() => void toggleFullscreen()} type="button">
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
        <button className="lp-exit" onClick={closePresentation} type="button">
          Exit
        </button>
      </nav>

      <Deck
        className="lecture-deck"
        config={{
          center: false,
          controls: true,
          hash: true,
          height: 720,
          margin: 0.02,
          overview: false,
          pause: false,
          progress: true,
          slideNumber: "c/t",
          transition: "fade",
          transitionSpeed: "fast",
          width: 1280,
        }}
        deckRef={deckRef}
        onReady={(deck) => {
          if (deck.isPaused()) deck.togglePause(false);
          deck.layout();
        }}
        plugins={[RevealNotes]}
      >
        <Slide
          className="lecture-presentation-slide lp-title-slide"
          notes="Lecture 1 of 16. Use the releases from 2022 onward as a map of the full model lifecycle: product jumps trace back to data, optimization, evaluation, inference, or system design."
        >
          <div className="lp-title-shell">
            <p className="lp-kicker">DATA FOR AI · LECTURE 1 OF 16</p>
            <h1>
              The frontier <span>language-model lifecycle</span>
            </h1>
            <div className="lp-title-logos" aria-label="Model providers represented in this lecture">
              {visuals.timeline.map((provider) => (
                <img
                  alt={provider.name}
                  height="30"
                  key={provider.key}
                  src={`${import.meta.env.BASE_URL}${provider.logoHref.replace(/^\//, "")}`}
                  width="30"
                />
              ))}
            </div>
            <p className="lp-title-hint">→ arrows to navigate · S speaker view · F full screen · Q exit</p>
          </div>
        </Slide>

        <SlideFrame
          kicker="LECTURE 1 · OBJECTIVES"
          notes="Six objectives. The practical thread is reconstruction: for any model, ask what evidence identifies its data, training, evaluation, post-training, and release path."
          title="What you should be able to do"
        >
          <div className="lp-objectives">
            {objectives.map((objective, index) => (
              <div key={objective}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <span>{objective}</span>
              </div>
            ))}
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · THE LIFECYCLE"
          notes="Walk through the six stages, then emphasize that this is a graph rather than an assembly line. Evaluation changes the next data mixture; post-training failures create demonstrations; incidents cause new filters and checkpoints."
          title="The lifecycle behind the moments"
        >
          <div className="lp-lifecycle-grid">
            {lifecycle.map((stage, index) => (
              <div key={stage}>
                <b>{index + 1}</b>
                <strong>{stage}</strong>
              </div>
            ))}
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-chatgpt-slide"
          kicker="LECTURE 1 · NOVEMBER 2022"
          notes="ChatGPT launched on 30 November 2022 as a GPT-3.5-series dialogue product. Instruction tuning and RLHF had predecessors; the frictionless conversational interface created the visible discontinuity."
          source={<a href="https://x.com/sama/status/1598038815599661056">Sam Altman · 30 Nov 2022</a>}
          title="The ChatGPT moment"
        >
          <div className="lp-facts-image">
            <div className="lp-fact-stack">
              <div><strong>30 November 2022</strong><span>GPT-3.5 behind a chat interface</span></div>
              <div><strong>Instruction tuning</strong><span>requests become tasks</span></div>
              <div><strong>RLHF</strong><span>the InstructGPT recipe</span></div>
            </div>
            <img alt="Sam Altman's launch post for ChatGPT" src={asset("sam-altman-chatgpt-launch.png")} />
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · THE CHATGPT MOMENT"
          notes="This is an interface example, not a claim that base models cannot answer questions. Instruction tuning makes the request-response pattern explicit and reliable."
          title="Base model and instruction-tuned model"
        >
          <div className="lp-model-compare">
            <div>
              <span>BASE MODEL · COMPLETES TEXT</span>
              <dl><dt>Prompt</dt><dd>The capital of France is</dd><dt>Continuation</dt><dd>Paris.</dd></dl>
            </div>
            <div className="is-accented">
              <span>INSTRUCTION-TUNED · ANSWERS</span>
              <dl><dt>User</dt><dd>What is the capital of France?</dd><dt>Assistant</dt><dd>Paris.</dd></dl>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · ONE SHARED INTERFACE"
          notes="The article describes a shared, programmable interface. These tasks no longer require the user to move between separate products, although the underlying system can still contain specialized components. The request can state the task, output format, audience, and constraints together."
          title="One shared, programmable interface"
        >
          <table className="lp-table lp-task-table">
            <thead><tr><th>Classical task</th><th>Task-specific system</th><th>Instruction to one model</th></tr></thead>
            <tbody>
              <tr><td>Sentence classification</td><td>label set · classifier</td><td>“Label each review positive, neutral, or negative.”</td></tr>
              <tr><td>Information extraction</td><td>fields · spans · tagger</td><td>“Extract the parties, dates, and payment terms as JSON.”</td></tr>
              <tr><td>Summarization</td><td>task-specific summarizer</td><td>“Summarize this for a lawyer in five bullets.”</td></tr>
              <tr><td>Question answering</td><td>QA pipeline</td><td>“Answer from this passage and cite the supporting sentence.”</td></tr>
              <tr><td>Translation & rewriting</td><td>dedicated transformation model</td><td>target language · tone · audience · constraints</td></tr>
            </tbody>
          </table>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · RLHF"
          notes="The InstructGPT recipe has five conceptual stages: demonstrations, supervised fine-tuning, candidate answers, human rankings, a learned reward model, then policy optimization. Ranking turns vague goals into comparisons."
          title="Teaching a model what people prefer"
        >
          <div className="lp-rlhf-flow">
            {["Demonstrations", "Supervised fine-tuning", "Rankings", "Reward model", "Policy optimization"].map((step, index) => (
              <div key={step}><b>{index + 1}</b><strong>{step}</strong></div>
            ))}
          </div>
          <p className="lp-equation">r<sub>φ</sub>(x, y<sub>A</sub>) &gt; r<sub>φ</sub>(x, y<sub>B</sub>)</p>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · RLHF"
          notes="Use the three source examples to ask the room for a ranking before revealing the article's likely order. The examples separate audience fit, factual fidelity, and safe redirection. Many comparisons of this kind supply the data used to train a reward model."
          title="Human preference comparisons"
        >
          <PreferenceComparisons examples={visuals.preferenceExamples} />
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · PREFERENCE VS TRUTH"
          notes="A reward model estimates annotator preference, not truth. If the protocol rewards confidence or length, optimization can produce sycophancy, verbosity, and reward hacking. The Eiffel Tower pair makes that distinction concrete."
          title="Preference is not truth"
        >
          <div className="lp-preference-grid">
            <div className="lp-preference-thesis">
              <strong>Failure modes</strong>
              <ul><li>sycophancy</li><li>verbosity</li><li>reward hacking</li></ul>
            </div>
            <div className="lp-answer-pair">
              <p className="lp-prompt">When was the Eiffel Tower moved from Paris to Lyon?</p>
              <div><span>ANSWER A</span><p>“It was moved in 1987 for the Lyon World Exposition.”</p><b>accepts a false premise</b></div>
              <div className="is-better"><span>ANSWER B</span><p>“It was not moved. The Eiffel Tower has remained in Paris since 1889.”</p><b>verifies the premise</b></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · PREFERENCE VS TRUTH"
          notes="FairEval scored 80 answer pairs in both positions. GPT-4 favored the first slot while ChatGPT strongly favored the second. Balanced position calibration means score both orders."
          source={<a href="https://arxiv.org/abs/2305.17926">Wang et al., 2023 · FairEval</a>}
          title="Position bias in a published evaluator experiment"
        >
          <div className="lp-bias-layout">
            <div className="lp-bias-chart" aria-label="Vicuna-13B win rate by slot order">
              <div><strong>GPT-4 judge</strong><span><i style={{ width: "51.3%" }}>51.3%</i></span><span><i className="is-dark" style={{ width: "23.8%" }}>23.8%</i></span></div>
              <div><strong>ChatGPT judge</strong><span><i style={{ width: "2.5%" }}>2.5%</i></span><span><i className="is-dark" style={{ width: "82.5%" }}>82.5%</i></span></div>
              <p><b /> answer in slot 1 <b className="is-dark" /> answer in slot 2</p>
            </div>
            <div className="lp-bias-numbers">
              <div><strong>37 / 80</strong><span>order-swap conflicts · GPT-4</span></div>
              <div><strong>66 / 80</strong><span>order-swap conflicts · ChatGPT</span></div>
              <p><strong>Balanced position calibration</strong><br />score both orders.</p>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · FEBRUARY 2019"
          notes="The Guardian headline records the public framing. The often repeated phrase ‘too scary to release’ has no primary source. OpenAI released 117M first, then the full 1.5B model nine months later."
          source={<a href="https://openai.com/index/gpt-2-1-5b-release/">OpenAI staged-release announcements · 2019</a>}
          title="Before ChatGPT: the GPT-2 staged release"
        >
          <div className="lp-gpt2-layout">
            <img alt="The Guardian's February 2019 GPT-2 headline" src={asset("guardian-gpt2-2019.png")} />
            <div className="lp-mini-timeline">
              <div><time>14 February 2019</time><p>Paper + 117M checkpoint<br /><span>1.5B withheld</span></p></div>
              <div><time>5 November 2019</time><p>Full 1.5B weights<br /><span>+ code released</span></p></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BENCHMARKS"
          notes="A benchmark is dataset plus protocol plus metric. The score changes when checkpoint, prompt, sampling, tools, budget, grader, or dataset version changes. GSM8K and MATH show what the grader actually extracts."
          title="Turning “better” into a measurement"
        >
          <div className="lp-score-function">
            <code>score = f(</code>
            {['checkpoint', 'prompt', 'sampling', 'tools', 'budget', 'grader', 'dataset version'].map((item) => <span key={item}>{item}</span>)}
            <code>)</code>
          </div>
          <div className="lp-benchmark-specimens">
            <div>
              <header><strong>GSM8K</strong><a href="https://github.com/openai/grade-school-math">8,500 problems</a></header>
              <div className="lp-specimen-problem"><span>PROBLEM</span><p>What is fifteen more than a quarter of 48?</p></div>
              <div className="lp-specimen-answer"><span>WORKED REFERENCE ANSWER</span><pre>A quarter of 48 is 48/4 = 12.{"\n"}The number is 12 + 15 = 27.{"\n"}<b>#### 27</b></pre></div>
            </div>
            <div>
              <header><strong>MATH</strong><a href="https://arxiv.org/abs/2103.03874">12,500 problems</a></header>
              <div className="lp-specimen-problem"><span>PROBLEM</span><p>∑ₙ₌₀∞ cos²ⁿθ = 5. What is cos 2θ?</p></div>
              <div className="lp-specimen-answer"><span>WORKED REFERENCE ANSWER</span><pre>1/(1 − cos²θ) = 5  →  cos²θ = 4/5{"\n"}cos 2θ = 2·cos²θ − 1 = 3/5{"\n"}<b>{"\\boxed{3/5}"}</b></pre></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BENCHMARKS"
          notes="Pass@k and majority@k answer different questions. Pass@k asks whether at least one of several generated programs passes the hidden tests. Majority@k extracts the final answer from several reasoning paths and lets those answers vote; a single correct minority answer is not enough."
          source={<><a href="https://arxiv.org/abs/2107.03374">HumanEval</a> · <a href="https://arxiv.org/abs/2203.11171">self-consistency</a></>}
          title="pass@k and majority@k"
        >
          <div className="lp-sampling-grid">
            <div className="lp-sampling-panel">
              <header><strong>pass@3</strong><span>program synthesis</span></header>
              <ol>
                <li><b>candidate 1</b><span>fails a hidden test</span></li>
                <li className="is-success"><b>candidate 2</b><span>passes every hidden test</span></li>
                <li><b>candidate 3</b><span>fails a hidden test</span></li>
              </ol>
              <code>at least one passes → success</code>
              <small>1 − C(n − c, k) / C(n, k)</small>
            </div>
            <div className="lp-sampling-panel">
              <header><strong>majority@5</strong><span>final-answer reasoning</span></header>
              <div className="lp-vote-row"><span>27</span><span>27</span><span>26</span><span>27</span><span>25</span></div>
              <dl><dt>vote counts</dt><dd>27 × 3 · 26 × 1 · 25 × 1</dd><dt>majority</dt><dd>27</dd><dt>reference</dt><dd>27</dd></dl>
              <code>majority is correct → success</code>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BENCHMARKS"
          notes="An exact math answer, a multiple-choice label, a runnable program, a repaired repository, and a preferred chat answer are different objects. Their metrics should not be compared across rows."
          title="Match the metric to the task"
        >
          <table className="lp-table lp-metric-table">
            <thead><tr><th>Task family</th><th>Benchmarks</th><th>Protocol</th></tr></thead>
            <tbody>
              <tr><td>Final-answer mathematics</td><td>GSM8K · MATH</td><td>exact match · majority@k</td></tr>
              <tr><td>Multiple choice</td><td>MMLU · GPQA</td><td>accuracy</td></tr>
              <tr><td>Program synthesis</td><td>HumanEval</td><td>pass@k</td></tr>
              <tr><td>Repository repair</td><td>SWE-bench Verified</td><td>resolved rate</td></tr>
              <tr><td>Chat preference</td><td>LMArena</td><td>blind pairwise wins → rating</td></tr>
            </tbody>
          </table>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BENCHMARKS"
          notes="Seven failure modes. The response is not to abandon evaluation: publish reproducible detail and pair public benchmarks with private, frequently refreshed tests."
          title="What can make a benchmark lie?"
        >
          <div className="lp-failure-grid">
            {[
              ["Data contamination", "questions in the training data"],
              ["Protocol drift", "unequal tools, tokens, attempts"],
              ["Prompt sensitivity", "a template flips the result"],
              ["Grader failure", "parser or judge mis-scores"],
              ["Selection effects", "favorable runs only"],
              ["Saturation", "everyone passes"],
              ["Hidden uncertainty", "noise looks like a ranking"],
            ].map(([heading, detail]) => <div key={heading}><strong>{heading}</strong><span>{detail}</span></div>)}
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-native-figure-slide"
          kicker="LECTURE 1 · CASE STUDY · APRIL 2025"
          notes="The released Llama 4 Maverick checkpoint was mostly reproduced on conventional benchmarks. Separate evaluation pipelines are evidence about reproducibility, not proof of intent. Protocol changes can dwarf the displayed gaps."
          source={<><a href="https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct">Meta model card</a> · <a href="https://huggingface.co/nvidia/Llama-4-Maverick-17B-128E-Instruct-FP8">NVIDIA evaluation</a></>}
          title="Llama 4: reported and independent scores"
        >
          <div className="lp-native-figure" dangerouslySetInnerHTML={{ __html: visuals.replication }} />
        </SlideFrame>

        <SlideFrame
          className="lp-native-figure-slide"
          kicker="LECTURE 1 · MODEL IDENTITY"
          notes="The controversy centered on an experimental private chat variant rather than the downloadable checkpoint. Style control removes much of the preference advantage, but not all of it. The documented issue is identity and disclosure."
          source={<a href="https://huggingface.co/spaces/lmarena-ai/arena-leaderboard/blob/8fdb292d7f6ac9cc36b1d7398a767216f0ff9b95/elo_results_20250409.pkl">LMArena archived snapshot · 9 Apr 2025</a>}
          title="The public checkpoint was not the Arena variant"
        >
          <div className="lp-native-figure" dangerouslySetInnerHTML={{ __html: visuals.arena }} />
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · LLAMA 4 AFTERMATH"
          notes="The article treats the Llama 4 launch as one catalyst in a wider reset, not a demonstrated single cause. Meta invested $14.3 billion for a 49 percent Scale AI stake in June 2025, recruited Alexandr Wang, and formed Meta Superintelligence Labs. Muse Spark 1.3 arrived through Muse Code and the Meta Model API on 2 September 2026; Muse Glimmer remained the open-weight line, while Meta listed Spark open weights as future work."
          source={<><a href="https://apnews.com/article/4b55aabf7ea018e38ffdccb66e37cf26">AP · June 2025</a> · <a href="https://research.meta.ai/blog/introducing-muse-spark-1-3">Meta · September 2026</a></>}
          title="What changed at Meta afterward"
        >
          <div className="lp-meta-timeline">
            <div><time>June 2025</time><strong>$14.3B · 49% of Scale AI</strong><span>Alexandr Wang · Meta Superintelligence Labs</span></div>
            <div><time>April 2026</time><strong>Muse Spark</strong><span>Meta AI · private API preview</span></div>
            <div><time>September 2026</time><strong>Muse Spark 1.3</strong><span>Muse Code · Meta Model API</span></div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BENCHMARK AUDITING"
          notes="A credible result is an auditable experiment, not just a table of numbers. It identifies the exact model and every evaluation setting that can change the score, reports uncertainty, and checks behavior that was not used to select the model. Internal evaluations remain necessary because public leaderboards are insufficient for steering expensive training runs."
          title="What a credible benchmark report includes"
        >
          <div className="lp-audit-list">
            {[
              "checkpoint + revision",
              "chat template",
              "sampling settings",
              "tools",
              "test-time budget",
              "grader version",
              "dataset version",
              "number of runs",
              "uncertainty",
              "held-out behavior",
            ].map((item) => <div key={item}>{item}</div>)}
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-ecosystem-slide"
          kicker="LECTURE 1 · THE GLOBAL ECOSYSTEM"
          notes="The Stanford AI Index counted 40 notable models from United States institutions, 15 from China, and 3 from France in 2024. Those dated counts support a layered map rather than a permanent league table. Frontier training, regional sovereignty, and language-centric adaptation are different objectives."
          source={<a href="https://hai.stanford.edu/ai-index/2025-ai-index-report">Stanford AI Index 2025 · 2024 model counts</a>}
          title="The global model ecosystem"
        >
          <div className="lp-ecosystem-map">
            <div className="lp-ecosystem-stats" aria-label="Notable models in 2024">
              <div><strong>40</strong><span>United States</span></div>
              <div><strong>15</strong><span>China</span></div>
              <div><strong>3</strong><span>France</span></div>
            </div>
            <div className="lp-ecosystem-layers">
              <div><strong>Frontier-scale</strong><span>United States · China</span></div>
              <div><strong>Regional and sovereign</strong><span>Europe · Russia · India</span></div>
              <div><strong>Language-centric adaptation</strong><span>Armenia · underrepresented-language communities</span></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · OPENNESS"
          notes="These labels describe what is released, not capability. OLMo 2 publishes weights, data, code, recipes, evaluations, and intermediate checkpoints. NVIDIA's Nemotron ecosystem also publishes weights, training datasets, technical reports, and training recipes, although the license of each artifact still has to be checked separately."
          source={<><a href="https://allenai.org/olmo2">Ai2 · OLMo 2</a> · <a href="https://developer.nvidia.com/topics/ai/nemotron">NVIDIA · Nemotron</a></>}
          title="Open source, open weights, or closed"
        >
          <div className="lp-openness-cards">
            <div><strong>Open source AI</strong><p>parameters + code + data</p><span>OLMo 2 · NVIDIA Nemotron</span></div>
            <div><strong>Open weights</strong><p>downloadable parameters</p><span>Llama · Qwen · DeepSeek</span></div>
            <div><strong>Closed / proprietary</strong><p>API or product access</p><span>GPT · Claude · Gemini</span></div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · ARMENIA"
          notes="HyGPT was released in 2025 by Gen2B with contributions from Armenia's National Center for AI and Innovation Technologies. It continued training from Gemma 2 9B on roughly 10 billion Armenian tokens and then used instruction tuning. The statement that it is the first Armenian LLM is a developer claim, not an independent global ranking."
          source={<a href="https://gen2b.ai/hygpt-release-1-0">HyGPT release · Gen2B, 2025</a>}
          title="Armenia: adaptation can be the contribution"
        >
          <div className="lp-armenia-flow">
            <div><span>BASE MODEL</span><strong>Gemma 2 9B</strong></div>
            <b aria-hidden="true">→</b>
            <div><span>CONTINUED TRAINING</span><strong>~10B Armenian tokens</strong></div>
            <b aria-hidden="true">→</b>
            <div><span>POST-TRAINING</span><strong>Instruction tuning</strong></div>
          </div>
          <div className="lp-armenia-result"><strong>HyGPT</strong><span>Eastern Armenian coverage · terminology · local access</span></div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · ARMENIA · SEPTEMBER 2026"
          notes="COPA released an Armenian corpus, a verified STEM corpus, a continued-pretrained Gemma-4 base model, and the complete training and evaluation code on 4 September 2026. ArmWeb contains 4.37 million documents and 3.3 billion Gemma-4 tokens. ArmSTEM contains 373,000 parallel problem pairs, including 324,000 worked solutions, while arm-gemma-e4b is a base model after 10 billion continued-pretraining tokens. The corpus, STEM data, model, and code use separate licenses, so inspectability and reuse rights must still be checked artifact by artifact."
          source={<><a href="https://huggingface.co/blog/osoblanco/from-zero-to-hero-an-open-llm-ecosystem-for-armeni">COPA release</a> · <a href="https://arxiv.org/abs/2609.03350">paper</a> · <a href="https://github.com/COPATeam/armenian_llm_ecosystem">code</a></>}
          title="COPA: an open Armenian LLM ecosystem"
        >
          <div className="lp-copa-artifacts">
            <div><strong>ArmWeb</strong><b>4.37M documents</b><span>3.3B tokens · deduplicated · decontaminated</span></div>
            <div><strong>ArmSTEM</strong><b>373K EN–HY pairs</b><span>324K worked solutions · blind re-solving</span></div>
            <div><strong>arm-gemma-e4b</strong><b>10B training tokens</b><span>Gemma-4-E4B · base model</span></div>
          </div>
          <div className="lp-copa-release"><span>corpus</span><span>weights</span><span>training code</span><span>recipe</span><span>evaluation</span></div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · ARMENIA · CONTINUED PRETRAINING"
          notes="The controlled experiment isolates a central risk of continued pretraining: target-language fluency can improve while other knowledge is forgotten. On Belebele, the Gemma-4-E4B base scored 0.619; a news-focused run at a learning rate of 10 to the minus 4 fell to 0.407; the documented ArmSTEM mixture at the gentler learning rate reached 0.716. The corpus scan separately found document-level benchmark overlap in three public Armenian web corpora, concentrated in perplexity-style held-out text."
          source={<a href="https://arxiv.org/abs/2609.03350">Arakelyan et al., 2026 · single-run results</a>}
          title="Data mixture and evaluation"
        >
          <div className="lp-copa-evidence">
            <section>
              <header>BELEBELE ACCURACY</header>
              {[
                ["Gemma-4-E4B base", "0.619", "61.9%"],
                ["News-focused CPT", "0.407", "40.7%"],
                ["ArmSTEM mixture", "0.716", "71.6%"],
              ].map(([label, value, width]) => <div className="lp-copa-score" key={label}><span>{label}</span><i><b style={{ width }}>{value}</b></i></div>)}
            </section>
            <section>
              <header>BENCHMARK-CONTAMINATED DOCUMENTS</header>
              <div className="lp-contamination-stats">
                <div><strong>7.9%</strong><span>CulturaX-hy</span></div>
                <div><strong>10.9%</strong><span>HPLT-v2-hy</span></div>
                <div><strong>17.4%</strong><span>FineWeb-2-hy</span></div>
              </div>
            </section>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · ARMENIA · SPEECH EVALUATION"
          notes="ArmBench-ASR version 1.0 evaluates more than 30 systems on 10,113 clips totaling about 20.7 hours. It uses five speech domains and reports strict and normalized WER and CER under one preprocessing procedure. Gemini 2.5 Pro led the strict combined WER table at 13.80 percent; NVIDIA Armenian FastConformer was the strongest open model at 19.86 percent."
          source={<><a href="https://huggingface.co/blog/Metric-AI/armbench-asr">Metric-AI · 20 Aug 2026</a> · <a href="https://metric-ai-armbench-asr.static.hf.space/">interactive leaderboard</a></>}
          title="ArmBench-ASR"
        >
          <div className="lp-asr-layout">
            <div className="lp-asr-stats"><div><strong>10,113</strong><span>clips</span></div><div><strong>20.7 h</strong><span>audio</span></div><div><strong>30+</strong><span>systems</span></div></div>
            <div className="lp-asr-domains"><span>Common Voice</span><span>FLEURS</span><span>poems</span><span>movies</span><span>news</span></div>
            <div className="lp-asr-results">
              <div><span>STRICT COMBINED WER</span><strong>13.80%</strong><b>Gemini 2.5 Pro</b></div>
              <div><span>BEST OPEN MODEL</span><strong>19.86%</strong><b>NVIDIA Armenian FastConformer</b></div>
            </div>
            <p>WER · CER · normalized WER · normalized CER</p>
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-timeline-slide"
          kicker="LECTURE 1 · ONE TIMELINE, MANY FAMILIES"
          notes="This is release cadence, not a capability ranking. Each provider remains on one horizontal lane and each dot is a dated public release. Notice the shift from one or two generations per year to families, previews, specialists, and point updates weeks or days apart."
          source="Provider announcements · Nov 2022–4 Sep 2026"
          title="One timeline, many model families"
        >
          <ResponsiveReleaseTimeline providers={visuals.timeline} />
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · FOUNDATIONAL MOMENTS"
          notes="These are the first eight named moments in the article. ChatGPT changed the public interface; LLaMA and Llama 2 changed distribution and local adaptation; function calling made structured tool use easier to ship. Gemini 1.5 foregrounded long context, GPT-4o joined speech, vision, and text, o1 exposed inference-time reasoning, and Cursor moved coding toward delegated work."
          title="Foundational moments · 2022–2024"
        >
          <MomentGrid moments={visuals.moments.slice(0, 8)} />
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · FOUNDATIONAL MOMENTS"
          notes="The next seven moments are also copied from the article's chronology. DeepSeek-R1 made open-weight reasoning and a wider geography of frontier competition visible; Claude Code made long-running tool use part of daily software work; native image and Veo 3 integrated new media. GPT-5 routing automated a product-level model choice, Opus 4.6 foregrounded teams of coding agents, and Mythos made restricted access a capability-dependent release decision."
          title="Foundational moments · 2025–2026"
        >
          <MomentGrid moments={visuals.moments.slice(8)} />
        </SlideFrame>

        <SlideFrame
          className="lp-market-slide"
          kicker="LECTURE 1 · THE MARKET · INTERACTIVE"
          notes="Use the tabs to compare the product catalyst, Nvidia guidance, the DeepSeek shock, and the broadening hardware bottleneck. The chart shows price paths, not company size, and events do not by themselves prove causality."
          source="Weekly closes · event and filing sources are linked in each interactive view"
          title="The market follows the bottleneck"
        >
          <AiMarketMoments />
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · BEYOND TEXT"
          notes="An LLM maps text to text. A VLM connects an instruction to visual evidence. Here the output is grounded in explicit regions, making the link between words and pixels visible."
          source={<a href="https://github.com/ultralytics/assets/blob/main/im/bus.jpg">Ultralytics example asset</a>}
          title="VLM: ground an image"
        >
          <div className="lp-vlm-layout">
            <div className="lp-vlm-image">
              <img alt="A city bus with several people walking in front of it" src={asset("vlm-street-scene.jpg")} />
              <span className="lp-box lp-box-bus"><b>bus</b></span>
              <span className="lp-box lp-box-a"><b>person</b></span>
              <span className="lp-box lp-box-b"><b>person</b></span>
              <span className="lp-box lp-box-c"><b>person</b></span>
            </div>
            <div className="lp-vlm-copy">
              <p><span>LLM</span><strong>text → text</strong></p>
              <p className="is-accented"><span>VLM</span><strong>instruction + image → regions</strong></p>
              <div><small>instruction</small><strong>“Locate the bus and people.”</strong><small>output</small><strong>one bus box · three person boxes</strong></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-media-slide"
          kicker="LECTURE 1 · BEYOND TEXT"
          notes="A multimodal model can integrate evidence across a sequence and return another medium. The opening is only visible by comparing early and late frames, so a single image is not enough. The example output is a text summary of the full five-second clip."
          source={<a href="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">MDN Web Docs · CC0 sample video</a>}
          title="Multimodal model: summarize a video"
        >
          <div className="lp-video-summary">
            <div className="lp-video-input">
              <video controls loop muted playsInline poster={asset("multimodal-flower-poster.jpg")} preload="metadata">
                <source src={asset("multimodal-flower.mp4")} type="video/mp4" />
              </video>
            </div>
            <div className="lp-video-output"><span>TEXT OUTPUT</span><p>“A close-up time-lapse shows a red flower opening from a closed bud.”</p><small>Evidence is combined across the sequence.</small></div>
          </div>
        </SlideFrame>

        <SlideFrame
          className="lp-media-slide"
          kicker="LECTURE 1 · BEYOND TEXT"
          notes="A vision-language-action model changes the prediction target. Camera observations, a language instruction, and robot state produce an action sequence that changes the environment. RT-2 transferred web-scale vision-language knowledge into robotic control; OpenVLA later released a 7B open model trained on robot demonstrations."
          source={<>Demo: <a href="https://www.youtube.com/watch?v=7Q-FHj2r4NU">Robohand</a> · <a href="https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/">RT-2</a> · <a href="https://github.com/openvla/openvla">OpenVLA</a></>}
          title="VLA: turn perception into action"
        >
          <div className="lp-vla-layout">
            <div>
              <div className="lp-youtube-frame"><iframe allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" src="https://www.youtube-nocookie.com/embed/7Q-FHj2r4NU?rel=0" title="Robohand autonomously throwing away trash" /></div>
            </div>
            <div className="lp-vla-copy">
              <p>(camera frames, instruction, robot state)<br />→ (a<sub>1</sub>, a<sub>2</sub>, …, a<sub>T</sub>)</p>
              <div><strong>RT-2</strong><span>web-scale vision-language knowledge → robotic control</span></div>
              <div><strong>OpenVLA</strong><span>7B · open · trained on robot demonstrations</span></div>
            </div>
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · SPECIALIZATION"
          notes="The adaptation recipe used for Armenian can also target a historical language such as Old English. The research question is whether the model preserves morphology, meaning, uncertainty, and source evidence on material it did not memorize. Domain experts and held-out texts are therefore part of the evaluation."
          source={<a href="https://aclanthology.org/2025.loreslm-1.21/">Low-resource language-model research · 2025</a>}
          title="Specialization is another axis of progress"
        >
          <div className="lp-specialization-flow">
            {[
              ["01", "Tokenizer", "inspect fragmentation"],
              ["02", "Corpus", "clean · licensed · documented"],
              ["03", "Pretraining", "continue from a suitable base"],
              ["04", "Instruction tuning", "translation · morphology · retrieval · annotation"],
              ["05", "Evaluation", "held-out texts · domain experts"],
            ].map(([number, heading, detail]) => <div key={number}><b>{number}</b><strong>{heading}</strong><span>{detail}</span></div>)}
          </div>
        </SlideFrame>

        <SlideFrame
          kicker="LECTURE 1 · CLOSING"
          notes="Review the seven claims in the same order as the article. The common method is to connect product behavior to training and evaluation evidence, and to keep model identity, protocol, and release conditions explicit."
          title="What to remember"
        >
          <div className="lp-takeaways">
            {[
              "Shared request–response interface",
              "Demonstrations · rankings · reward model · policy optimization",
              "Checkpoint · protocol · uncertainty",
              "Llama 4: checkpoint identity · disclosure",
              "Frontier-scale · regional · language-centric objectives",
              "Training · inference · infrastructure bottlenecks",
              "VLM regions · multimodal sequences · VLA actions",
            ].map((takeaway, index) => <div key={takeaway}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{takeaway}</span></div>)}
          </div>
        </SlideFrame>
      </Deck>
    </div>
  );
}
