"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type CadenceRange = "overview" | "2024" | "2025" | "2026";

type CadenceRelease = {
  cluster?: CadenceRelease[];
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

type CadenceProvider = {
  key: string;
  logoHref: string;
  name: string;
  releases: CadenceRelease[];
};

type PositionedRelease = {
  hitRadius: number;
  label?: {
    anchor: "end" | "middle" | "start";
    y: number;
  };
  release: CadenceRelease;
  x: number;
};

type PopoverDetails = {
  left: number;
  maxHeight: number;
  placement: "above" | "below";
  provider: string;
  release: CadenceRelease;
  top: number;
};

const DAY = 24 * 60 * 60 * 1000;
const PLOT_START = 140;
const PLOT_END = 850;
const PLOT_TOP = 48;
const PLOT_BOTTOM = 910;
const CHART_HEIGHT = 948;
const OVERVIEW_CLUSTER_WINDOW = 28 * DAY;
const YEAR_CLUSTER_WINDOW = 7 * DAY;
const OVERVIEW_MARKER_GAP = 5;

const rangeBounds: Record<CadenceRange, { end: number; start: number }> = {
  overview: {
    end: Date.parse("2026-09-04T23:59:59Z"),
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
    end: Date.parse("2026-09-04T23:59:59Z"),
    start: Date.parse("2026-01-01T00:00:00Z"),
  },
};

const rangeLabels: Array<{ label: string; range: CadenceRange }> = [
  { label: "Overall", range: "overview" },
  { label: "2024", range: "2024" },
  { label: "2025", range: "2025" },
  { label: "2026", range: "2026" },
];

function parseDate(date: string) {
  return Date.parse(`${date} UTC`);
}

function positionForDate(date: number, start: number, end: number) {
  return PLOT_START + ((date - start) / (end - start)) * (PLOT_END - PLOT_START);
}

function formatClusterDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(timestamp);
}

function resolveAsset(path: string) {
  if (/^(?:https?:)?\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function parseReleaseCadence(root: ParentNode): CadenceProvider[] {
  const template = root.querySelector<HTMLTemplateElement>("[data-release-cadence-source]");
  const source: ParentNode = template?.content ?? root;
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
    const releases = Array.from(
      series.querySelectorAll<SVGAElement>("[data-release-name]"),
      (release, releaseIndex): CadenceRelease => {
        const circle = release.querySelector<SVGCircleElement>("circle");
        const date = release.getAttribute("data-release-date") ?? "";
        return {
          date,
          dateValue: parseDate(date),
          family: release.getAttribute("data-release-family") ?? undefined,
          href: release.getAttribute("href") ?? "",
          id: `${key}-${releaseIndex}`,
          label:
            release.getAttribute("data-release-label") ??
            release.querySelector("text")?.textContent?.trim() ??
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
      logoHref: logos[providerIndex]?.getAttribute("href") ?? "",
      name: names[providerIndex]?.textContent?.trim() ?? key,
      releases,
    };
  });
}

function clusterReleases(
  releases: CadenceRelease[],
  range: CadenceRange,
  start: number,
  end: number,
) {
  const candidates = releases
    .filter((release) => release.dateValue >= start && release.dateValue <= end)
    .sort((a, b) => a.dateValue - b.dateValue);
  const groups: CadenceRelease[][] = [];
  const clusterWindow = range === "overview" ? OVERVIEW_CLUSTER_WINDOW : YEAR_CLUSTER_WINDOW;
  let current: CadenceRelease[] = [];
  let windowStart = Number.NaN;

  candidates.forEach((candidate) => {
    if (!current.length) {
      current = [candidate];
      windowStart = candidate.dateValue;
      return;
    }

    const currentLast = current.at(-1)!.dateValue;
    const currentMidpoint = windowStart + (currentLast - windowStart) / 2;
    const currentMarkerRadius =
      current.length === 1
        ? current[0].radius
        : current.some((release) => release.radius >= 3.75)
          ? 4
          : 3;
    const visuallyClose =
      positionForDate(candidate.dateValue, start, end) -
        positionForDate(currentMidpoint, start, end) <=
      currentMarkerRadius + candidate.radius + OVERVIEW_MARKER_GAP;
    const withinWindow = candidate.dateValue - windowStart <= clusterWindow;

    if (withinWindow && (range !== "overview" || visuallyClose)) {
      current.push(candidate);
      return;
    }

    groups.push(current);
    current = [candidate];
    windowStart = candidate.dateValue;
  });
  if (current.length) groups.push(current);

  return groups.map((group): CadenceRelease => {
    if (group.length === 1) return group[0];

    const first = group[0];
    const last = group.at(-1)!;
    const midpoint = first.dateValue + (last.dateValue - first.dateValue) / 2;
    const majorLabels = group
      .filter((release) => release.radius >= 3.75)
      .map((release) => release.label || release.name);

    return {
      cluster: group,
      date: `${formatClusterDate(first.dateValue)} – ${formatClusterDate(last.dateValue)}`,
      dateValue: midpoint,
      family:
        range === "overview"
          ? `Grouped because these ${group.length} releases would compete for the same visual space in the compressed overview; the full span is no more than four weeks.`
          : `Grouped because these ${group.length} releases arrived from the same provider within one week.`,
      href: "",
      id: `cluster-${first.id}-${last.id}-${range}`,
      label:
        majorLabels.length > 1
          ? `${majorLabels[0]} + ${majorLabels.length - 1}`
          : majorLabels[0] ?? "",
      name: `${group.length} releases`,
      note: "The compound marker replaces crowded dots; the breakdown preserves every release.",
      radius: majorLabels.length ? 4 : 3,
      restricted: false,
      sourceLabel: "Release cluster",
    };
  });
}

function selectedLabelIds(releases: CadenceRelease[], range: CadenceRange) {
  const major = releases.filter((release) => release.radius >= 3.75 && release.label);
  if (range !== "overview") return new Set(major.map((release) => release.id));

  const kept = new Set<string>();
  if (major.length) kept.add(major[0].id);
  const byYear = new Map<number, CadenceRelease[]>();
  major.forEach((release) => {
    const year = new Date(release.dateValue).getUTCFullYear();
    const yearReleases = byYear.get(year) ?? [];
    yearReleases.push(release);
    byYear.set(year, yearReleases);
  });
  byYear.forEach((yearReleases) => kept.add(yearReleases.at(-1)!.id));
  return kept;
}

function positionLabels(
  releases: CadenceRelease[],
  selected: Set<string>,
  laneY: number,
  start: number,
  end: number,
) {
  const rowEnds = [-Infinity, -Infinity, -Infinity, -Infinity];
  const rowOffsets = [-13, 16, -25, 28];
  const layouts = new Map<string, PositionedRelease["label"]>();

  releases
    .filter((release) => selected.has(release.id))
    .sort((a, b) => a.dateValue - b.dateValue)
    .forEach((release) => {
      const x = positionForDate(release.dateValue, start, end);
      const width = Math.max(20, release.label.length * 5.2);
      const anchor: "end" | "middle" | "start" =
        x < PLOT_START + width / 2 + 5
          ? "start"
          : x > PLOT_END - width / 2 - 5
            ? "end"
            : "middle";
      const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
      const right = anchor === "start" ? x + width : anchor === "end" ? x : x + width / 2;
      let row = rowEnds.findIndex((rowEnd) => left > rowEnd + 18);
      if (row === -1) row = rowEnds.indexOf(Math.min(...rowEnds));
      rowEnds[row] = right;
      layouts.set(release.id, { anchor, y: laneY + rowOffsets[row] });
    });

  return layouts;
}

function gridForRange(range: CadenceRange) {
  if (range === "overview") {
    return {
      axis: [
        { date: Date.UTC(2023, 6, 1), label: "2023" },
        { date: Date.UTC(2024, 6, 1), label: "2024" },
        { date: Date.UTC(2025, 6, 1), label: "2025" },
        { date: Date.UTC(2026, 3, 15), label: "2026" },
      ],
      lines: [
        rangeBounds.overview.start,
        Date.UTC(2023, 0, 1),
        Date.UTC(2024, 0, 1),
        Date.UTC(2025, 0, 1),
        Date.UTC(2026, 0, 1),
        rangeBounds.overview.end,
      ],
    };
  }

  const year = Number(range);
  const end = rangeBounds[range].end;
  const months = [0, 3, 6, 9]
    .map((month) => ({ date: Date.UTC(year, month, 1), label: ["Jan", "Apr", "Jul", "Oct"][month / 3] }))
    .filter((mark) => mark.date <= end);
  if (range === "2026") months.push({ date: end, label: "4 Sep" });
  return { axis: months, lines: months.map((mark) => mark.date) };
}

function ReleaseCadenceChart({ providers }: { providers: CadenceProvider[] }) {
  const [range, setRange] = useState<CadenceRange>("overview");
  const [details, setDetails] = useState<PopoverDetails | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const lastPointerTypeRef = useRef("");
  const touchArmedRef = useRef<string | null>(null);
  const { end, start } = rangeBounds[range];
  const grid = gridForRange(range);

  const positionedProviders = useMemo(
    () =>
      providers.map((provider, providerIndex) => {
        const laneY = 86 + providerIndex * 66;
        const clustered = clusterReleases(provider.releases, range, start, end);
        const selected = selectedLabelIds(clustered, range);
        const labels = positionLabels(clustered, selected, laneY, start, end);
        const positions = clustered.map((release) => ({
          release,
          x: positionForDate(release.dateValue, start, end),
        }));
        return {
          laneY,
          provider,
          releases: positions.map((position, index): PositionedRelease => {
            const previousGap =
              index > 0 ? position.x - positions[index - 1].x : Infinity;
            const nextGap =
              index < positions.length - 1 ? positions[index + 1].x - position.x : Infinity;
            const nearestGap = Math.min(previousGap, nextGap);
            const visibleRadius =
              position.release.radius >= 3.75
                ? 6.25
                : position.release.radius >= 2.95
                  ? 4.75
                  : 4.1;
            return {
              hitRadius: Math.min(
                10,
                Math.max(visibleRadius, (nearestGap - 1) / 2),
              ),
              label: labels.get(position.release.id),
              ...position,
            };
          }),
        };
      }),
    [end, providers, range, start],
  );

  const cancelHide = () => {
    if (hideTimerRef.current !== undefined) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
  };

  const hideDetails = () => {
    cancelHide();
    setDetails(null);
  };

  const scheduleHide = () => {
    cancelHide();
    hideTimerRef.current = window.setTimeout(() => setDetails(null), 180);
  };

  const showDetails = (provider: string, release: CadenceRelease, marker: Element) => {
    cancelHide();
    const shape = marker.querySelector<SVGCircleElement>(".cadence-marker-shape");
    if (!shape) return;
    const rect = shape.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const estimatedHeight = release.cluster ? 130 + release.cluster.length * 62 : 180;
    const spaceAbove = Math.max(0, rect.top - 22);
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 22);
    const placement =
      spaceAbove >= estimatedHeight || spaceAbove > spaceBelow ? "above" : "below";
    setDetails({
      left: Math.min(
        window.innerWidth - popoverWidth - 12,
        Math.max(12, rect.left + rect.width / 2 - popoverWidth / 2),
      ),
      maxHeight: Math.max(120, placement === "above" ? spaceAbove : spaceBelow),
      placement,
      provider,
      release,
      top: placement === "above" ? rect.top - 10 : rect.bottom + 10,
    });
  };

  const changeRange = (nextRange: CadenceRange) => {
    hideDetails();
    touchArmedRef.current = null;
    setRange(nextRange);
  };

  const playPronunciation = () => {
    audioRef.current?.pause();
    const audio = new Audio(resolveAsset("lecture-1/audio/qwen-pronunciation-v2.mp3"));
    const finish = () => {
      if (audioRef.current !== audio) return;
      audioRef.current = null;
      setSpeaking(false);
    };
    audioRef.current = audio;
    setSpeaking(true);
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    void audio.play().catch(finish);
  };

  useEffect(() => {
    const hide = () => setDetails(null);
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      cancelHide();
      audioRef.current?.pause();
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  return (
    <>
      <div className="release-cadence-controls" aria-label="Timeline detail level">
        <span>View</span>
        {rangeLabels.map((item) => (
          <button
            aria-pressed={range === item.range}
            data-cadence-range={item.range}
            key={item.range}
            onClick={() => changeRange(item.range)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <svg
        aria-labelledby="cadence-title cadence-description"
        className="release-cadence-plot"
        data-range={range}
        role="img"
        viewBox={`0 0 880 ${CHART_HEIGHT}`}
      >
        <title id="cadence-title">Selected model releases by provider and date</title>
        <desc id="cadence-description">
          Thirteen horizontal provider lanes show dated public model releases from November 2022 through 4 September 2026. Every visible marker is a native vector circle. A ring with a center dot opens a breakdown of nearby same-provider releases.
        </desc>

        <g className="cadence-grid" aria-hidden="true">
          {grid.lines.map((date) => {
            const x = positionForDate(date, start, end);
            return <line key={`grid-${date}`} x1={x} x2={x} y1={PLOT_TOP} y2={PLOT_BOTTOM} />;
          })}
          {positionedProviders.map(({ laneY, provider }) => (
            <line key={`lane-${provider.key}`} x1={PLOT_START} x2={PLOT_END} y1={laneY} y2={laneY} />
          ))}
        </g>

        <g className="cadence-axis" aria-hidden="true">
          {grid.axis.map((mark) => {
            const x = positionForDate(mark.date, start, end);
            const anchor = x <= PLOT_START + 2 ? "start" : x >= PLOT_END - 2 ? "end" : "middle";
            return (
              <text key={`axis-${mark.date}`} textAnchor={anchor} x={x} y="931">
                {mark.label}
              </text>
            );
          })}
        </g>

        <g className="cadence-providers">
          {positionedProviders.map(({ laneY, provider }) => (
            <g key={`provider-${provider.key}`}>
              <image height="24" href={resolveAsset(provider.logoHref)} width="24" x="18" y={laneY - 12} />
              <text x="50" y={laneY + 4}>{provider.name}</text>
              {provider.key === "qwen" && (
                <g
                  aria-label="Hear Qwen pronounced in Mandarin"
                  className="cadence-pronunciation"
                  data-speaking={speaking || undefined}
                  onClick={playPronunciation}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      playPronunciation();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  transform={`translate(94 ${laneY - 8})`}
                >
                  <title>Play the Qwen pronunciation from Dr. Franz Lang&apos;s guide</title>
                  <circle className="cadence-pronunciation-hit" cx="8" cy="8" r="16" />
                  <circle className="cadence-pronunciation-surface" cx="8" cy="8" r="8" />
                  <path className="cadence-pronunciation-speaker" d="M3.7 6.4h2.5L9.4 4v8L6.2 9.6H3.7Z" />
                  <path className="cadence-pronunciation-wave cadence-pronunciation-wave--near" d="M11 6.1c1 .9 1 2.9 0 3.8" />
                  <path className="cadence-pronunciation-wave cadence-pronunciation-wave--far" d="M13 4.6c2 1.8 2 5 0 6.8" />
                </g>
              )}
            </g>
          ))}
        </g>

        {positionedProviders.map(({ laneY, provider, releases }) => (
          <g className={`cadence-series ${provider.key}`} key={`series-${provider.key}`}>
            {releases.map(({ hitRadius, label, release, x }) => {
              const marker = (
                <>
                  <circle className="cadence-marker-hit" cx={x} cy={laneY} r={hitRadius} />
                  {release.cluster ? (
                    <>
                      <circle className="cadence-marker-shape cadence-cluster-ring" cx={x} cy={laneY} r={release.radius} />
                      <circle className="cadence-cluster-core" cx={x} cy={laneY} r="1.4" />
                    </>
                  ) : (
                    <circle
                      className={`cadence-marker-shape${release.restricted ? " restricted" : ""}`}
                      cx={x}
                      cy={laneY}
                      r={release.radius}
                    />
                  )}
                  {label && (
                    <text textAnchor={label.anchor} x={x} y={label.y}>
                      {release.label}
                    </text>
                  )}
                </>
              );
              if (release.cluster) {
                return (
                  <g
                    aria-describedby={details?.release.id === release.id ? "release-cadence-popover" : undefined}
                    aria-label={`${release.name}, ${release.date}`}
                    className="cadence-marker cadence-cluster-marker"
                    data-cadence-cluster-marker=""
                    data-release-name={release.name}
                    data-release-size={release.cluster.length}
                    key={release.id}
                    onBlur={scheduleHide}
                    onFocus={(event) => showDetails(provider.name, release, event.currentTarget)}
                    onPointerDown={(event) => {
                      lastPointerTypeRef.current = event.pointerType;
                      if (event.pointerType === "touch") {
                        showDetails(provider.name, release, event.currentTarget);
                      }
                    }}
                    onPointerEnter={(event) =>
                      showDetails(provider.name, release, event.currentTarget)
                    }
                    onPointerLeave={scheduleHide}
                    role="button"
                    tabIndex={0}
                  >
                    {marker}
                  </g>
                );
              }

              return (
                <a
                  aria-describedby={details?.release.id === release.id ? "release-cadence-popover" : undefined}
                  aria-label={`${release.name}, ${release.date}`}
                  className="cadence-marker"
                  data-release-name={release.name}
                  href={release.href}
                  key={release.id}
                  onClick={(event) => {
                    if (lastPointerTypeRef.current !== "touch") return;
                    if (touchArmedRef.current !== release.id) {
                      event.preventDefault();
                      touchArmedRef.current = release.id;
                      showDetails(provider.name, release, event.currentTarget);
                    }
                  }}
                  onBlur={scheduleHide}
                  onFocus={(event) => showDetails(provider.name, release, event.currentTarget)}
                  onPointerDown={(event) => {
                    lastPointerTypeRef.current = event.pointerType;
                    if (event.pointerType === "touch") {
                      showDetails(provider.name, release, event.currentTarget);
                    }
                  }}
                  onPointerEnter={(event) =>
                    showDetails(provider.name, release, event.currentTarget)
                  }
                  onPointerLeave={scheduleHide}
                  rel="noreferrer"
                  target="_blank"
                >
                  {marker}
                </a>
              );
            })}
          </g>
        ))}
      </svg>

      {details &&
        createPortal(
          <aside
            aria-label={`Release details for ${details.release.name}`}
            className={`release-cadence-popover ${details.placement}`}
            id="release-cadence-popover"
            onPointerEnter={cancelHide}
            onPointerLeave={scheduleHide}
            style={{ left: details.left, maxHeight: details.maxHeight, top: details.top }}
          >
            <div className="release-cadence-popover-heading">
              <strong>{details.release.name}</strong>
              <time>{details.release.date}</time>
            </div>
            <p className="release-cadence-family">
              {details.provider}
              {details.release.cluster ? " · close-release cluster" : ""}
            </p>
            {details.release.family && <p className="release-cadence-family">{details.release.family}</p>}
            {details.release.note && <p>{details.release.note}</p>}
            {details.release.cluster ? (
              <ul className="release-cadence-cluster-list">
                {details.release.cluster.map((release) => (
                  <li key={release.id}>
                    <div>
                      <strong>{release.name}</strong>
                      <time>{release.date}</time>
                    </div>
                    <a
                      href={release.href}
                      onBlur={scheduleHide}
                      onFocus={cancelHide}
                      onPointerEnter={cancelHide}
                      onPointerLeave={scheduleHide}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {release.sourceLabel} →
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <a
                href={details.release.href}
                onBlur={scheduleHide}
                onFocus={cancelHide}
                onPointerEnter={cancelHide}
                onPointerLeave={scheduleHide}
                rel="noreferrer"
                target="_blank"
              >
                {details.release.sourceLabel} →
              </a>
            )}
          </aside>,
          document.body,
        )}
    </>
  );
}

export function ReleaseCadenceChartMount({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const [mount, setMount] = useState<{
    providers: CadenceProvider[];
    target: Element;
  } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const root = rootRef.current;
      const target = root?.querySelector("[data-release-cadence-chart]");
      if (!root || !target) return;
      setMount({ providers: parseReleaseCadence(root), target });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [rootRef]);

  return mount
    ? createPortal(<ReleaseCadenceChart providers={mount.providers} />, mount.target)
    : null;
}
