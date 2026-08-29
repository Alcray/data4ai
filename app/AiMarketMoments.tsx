"use client";

import { useId, useMemo, useState, type PointerEvent } from "react";
import { marketHistory } from "./ai-market-data";
import { marketWeeklyHistory } from "./ai-market-weekly-data";

const chartWidth = 760;
const chartHeight = 390;
const plot = { top: 40, right: 20, bottom: 48, left: 58 };

const tickers = [
  { id: "NVDA", name: "Nvidia", color: "#7253ed" },
  { id: "INTC", name: "Intel", color: "#177184" },
  { id: "MU", name: "Micron", color: "#b45d2f" },
  { id: "SNDK", name: "Sandisk", color: "#a14f70" },
  { id: "WDC", name: "Western Digital", color: "#4d6fa9" },
  { id: "STX", name: "Seagate", color: "#4f8247" },
  { id: "SPY", name: "S&P 500 ETF", color: "#77727e" },
] as const;

type TickerId = (typeof tickers)[number]["id"];
type Metric = "relative" | "price";
type ViewId = "long" | "chatgpt" | "guidance" | "deepseek" | "broadens";

type MarketView = {
  id: ViewId;
  label: string;
  title: string;
  start: string;
  end: string;
  defaultTickers: TickerId[];
  description: string;
  events: { date: string; label: string; row?: number }[];
  sources: { label: string; href: string }[];
};

const views: MarketView[] = [
  {
    id: "long",
    label: "2020–today",
    title: "The whole AI hardware cycle",
    start: "2020-01-02",
    end: "2026-08-28",
    defaultTickers: ["NVDA", "INTC", "MU", "WDC", "STX", "SPY"],
    description:
      "Weekly closes reveal the long arc from the pre-ChatGPT market through GPU repricing and the later memory, storage, and CPU cycle. Sandisk is optional because its current standalone ticker begins only in 2025.",
    events: [
      { date: "2022-11-30", label: "ChatGPT", row: 0 },
      { date: "2023-05-24", label: "Nvidia guidance", row: 1 },
      { date: "2025-01-27", label: "DeepSeek shock", row: 0 },
      { date: "2026-04-23", label: "Bottleneck broadens", row: 1 },
    ],
    sources: [
      {
        label: "Sandisk listing history",
        href: "https://investor.sandisk.com/news-releases/news-release-details/sandisk-celebrates-nasdaq-listing-after-completing-separation",
      },
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    title: "A product catalyst",
    start: "2022-10-03",
    end: "2023-02-03",
    defaultTickers: ["NVDA", "SPY"],
    description:
      "The launch is a useful marker for the product era, but not a clean one-day experiment: macroeconomic news moved the whole market at the same time.",
    events: [{ date: "2022-11-30", label: "ChatGPT launches" }],
    sources: [
      {
        label: "Launch source",
        href: "https://openai.com/index/chatgpt/",
      },
    ],
  },
  {
    id: "guidance",
    label: "Nvidia guidance",
    title: "AI demand enters guidance",
    start: "2023-04-03",
    end: "2023-07-31",
    defaultTickers: ["NVDA", "SPY"],
    description:
      "Nvidia forecast $11 billion of quarterly revenue and explicitly connected the outlook to accelerated computing and generative AI. The next session made the repricing visible.",
    events: [{ date: "2023-05-24", label: "Nvidia reports" }],
    sources: [
      {
        label: "Nvidia results",
        href: "https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2024/",
      },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    title: "An efficiency shock",
    start: "2024-12-02",
    end: "2025-03-14",
    defaultTickers: ["NVDA", "SPY"],
    description:
      "DeepSeek-R1 changed expectations about the cost of capable reasoning. The market shock arrived a week after release and was much sharper for Nvidia than for the broad index.",
    events: [{ date: "2025-01-27", label: "Market shock" }],
    sources: [
      {
        label: "R1 release",
        href: "https://api-docs.deepseek.com/news/news250120/",
      },
    ],
  },
  {
    id: "broadens",
    label: "Bottleneck broadens",
    title: "The scarce input moves outward",
    start: "2026-01-02",
    end: "2026-08-28",
    defaultTickers: ["INTC", "MU", "SNDK", "WDC", "STX", "SPY"],
    description:
      "By 2026, the market was also testing a CPU, memory, and storage thesis. Earnings releases help locate the repricing, but they do not prove that AI demand caused every move.",
    events: [
      { date: "2026-04-23", label: "Intel Q1", row: 0 },
      { date: "2026-04-30", label: "Sandisk Q3", row: 1 },
    ],
    sources: [
      {
        label: "Intel results",
        href: "https://www.intc.com/news-events/press-releases/detail/1767/intel-reports-first-quarter-2026-financial-results",
      },
      {
        label: "Sandisk results",
        href: "https://investor.sandisk.com/news-releases/news-release-details/sandisk-reports-fiscal-third-quarter-2026-financial-results",
      },
    ],
  },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const yearFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  timeZone: "UTC",
});

function timestamp(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(timestamp(date)));
}

function formatSigned(value: number) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

function niceTicks(minimum: number, maximum: number, count = 5) {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return [0];
  if (minimum === maximum) return [minimum - 1, minimum, maximum + 1];

  const rough = (maximum - minimum) / Math.max(1, count - 1);
  const power = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / power;
  const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * power;
  const start = Math.floor(minimum / step) * step;
  const end = Math.ceil(maximum / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Number(value.toFixed(8)));
  }
  return ticks;
}

export function AiMarketMoments() {
  const descriptionId = useId();
  const [viewId, setViewId] = useState<ViewId>("long");
  const [metric, setMetric] = useState<Metric>("relative");
  const [selectedTickers, setSelectedTickers] = useState<TickerId[]>(
    views.find((view) => view.id === "long")!.defaultTickers,
  );
  const [cursorDate, setCursorDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const view = views.find((candidate) => candidate.id === viewId)!;
  const startTime = timestamp(view.start);
  const endTime = timestamp(view.end);

  const series = useMemo(
    () =>
      tickers.map((ticker) => {
        const history = view.id === "long" ? marketWeeklyHistory : marketHistory;
        const rows = history[ticker.id].filter(
          (row) =>
            row.date >= view.start &&
            row.date <= view.end &&
            (ticker.id !== "SNDK" || view.id !== "long" || row.date >= "2025-02-24"),
        );
        const base = rows[0]?.close ?? 1;
        return {
          ...ticker,
          rows: rows.map((row) => ({
            ...row,
            relative: ((row.close / base) - 1) * 100,
          })),
        };
      }),
    [view.end, view.id, view.start],
  );

  const plottedSeries = series.filter(
    (item) => selectedTickers.includes(item.id) && item.rows.length > 0,
  );
  const values = plottedSeries.flatMap((item) =>
    item.rows.map((row) => (metric === "relative" ? row.relative : row.close)),
  );
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const range = Math.max(1, rawMaximum - rawMinimum);
  const paddedMinimum = metric === "relative"
    ? Math.min(0, rawMinimum - range * 0.08)
    : Math.max(0, rawMinimum - range * 0.08);
  const paddedMaximum = metric === "relative"
    ? Math.max(0, rawMaximum + range * 0.08)
    : rawMaximum + range * 0.08;
  const yTicks = view.id === "long" && metric === "relative"
    ? [
        Math.floor(Math.min(-100, rawMinimum) / 100) * 100,
        ...niceTicks(0, paddedMaximum, 6).filter((tick) => tick >= 0),
      ]
    : niceTicks(paddedMinimum, paddedMaximum);
  const yMinimum = yTicks[0];
  const yMaximum = yTicks[yTicks.length - 1];
  const innerWidth = chartWidth - plot.left - plot.right;
  const innerHeight = chartHeight - plot.top - plot.bottom;
  const x = (date: string) =>
    plot.left + ((timestamp(date) - startTime) / (endTime - startTime)) * innerWidth;
  const y = (value: number) =>
    plot.top + ((yMaximum - value) / (yMaximum - yMinimum)) * innerHeight;

  const allDates = Array.from(
    new Set(plottedSeries.flatMap((item) => item.rows.map((row) => row.date))),
  ).sort();
  const activeDate = pinnedDate ?? cursorDate;
  const activeIndex = activeDate ? Math.max(0, allDates.indexOf(activeDate)) : 0;
  const activeRows = activeDate
    ? plottedSeries.flatMap((item) => {
        const row = item.rows.find((candidate) => candidate.date === activeDate);
        return row ? [{ ...item, row }] : [];
      })
    : [];
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const value = startTime + ((endTime - startTime) * index) / 4;
    return { value, x: plot.left + (innerWidth * index) / 4 };
  });

  function dateAtPointer(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * chartWidth;
    const ratio = Math.min(1, Math.max(0, (svgX - plot.left) / innerWidth));
    const target = startTime + ratio * (endTime - startTime);
    return allDates.reduce((nearest, date) =>
      Math.abs(timestamp(date) - target) < Math.abs(timestamp(nearest) - target)
        ? date
        : nearest,
    allDates[0]);
  }

  function chooseView(nextView: MarketView) {
    setViewId(nextView.id);
    setSelectedTickers(nextView.defaultTickers);
    setCursorDate(null);
    setPinnedDate(null);
  }

  function toggleTicker(ticker: TickerId) {
    setSelectedTickers((current) => {
      if (current.includes(ticker)) {
        return current.length === 1 ? current : current.filter((item) => item !== ticker);
      }
      return [...current, ticker];
    });
    setCursorDate(null);
    setPinnedDate(null);
  }

  function moveCursor(direction: -1 | 1) {
    if (allDates.length === 0) return;
    const nextIndex = Math.min(
      allDates.length - 1,
      Math.max(0, (activeDate ? activeIndex : direction > 0 ? -1 : allDates.length) + direction),
    );
    setPinnedDate(allDates[nextIndex]);
    setCursorDate(null);
  }

  const tooltipWidth = 190;
  const tooltipHeight = 42 + activeRows.length * 20;
  const activeX = activeDate ? x(activeDate) : 0;
  const tooltipX = activeX > chartWidth - tooltipWidth - 30
    ? activeX - tooltipWidth - 12
    : activeX + 12;

  return (
    <figure className="ai-market-moments" aria-describedby={descriptionId}>
      <div className="market-view-controls" role="tablist" aria-label="Market moment">
        {views.map((candidate) => (
          <button
            aria-selected={view.id === candidate.id}
            className={view.id === candidate.id ? "active" : ""}
            key={candidate.id}
            onClick={() => chooseView(candidate)}
            role="tab"
            type="button"
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <div className="market-view-heading">
        <div>
          <strong>{view.title}</strong>
          <p>{view.description}</p>
        </div>
        <div className="market-view-sources">
          {view.sources.map((source) => (
            <a href={source.href} key={source.href}>{source.label} →</a>
          ))}
        </div>
      </div>

      <div className="market-metric-row">
        <div className="market-metric-controls" aria-label="Chart measure">
          <span>Measure</span>
          <button
            aria-pressed={metric === "relative"}
            className={metric === "relative" ? "active" : ""}
            onClick={() => setMetric("relative")}
            type="button"
          >
            Relative change
          </button>
          <button
            aria-pressed={metric === "price"}
            className={metric === "price" ? "active" : ""}
            onClick={() => setMetric("price")}
            type="button"
          >
            Share price ($)
          </button>
        </div>
        <span className="market-interaction-hint">
          Hover or use ← →. Select the plot to pin a date.
        </span>
      </div>

      <div className="market-ticker-controls" aria-label="Companies shown">
        {series.map((item) => (
          <button
            aria-pressed={selectedTickers.includes(item.id)}
            className={selectedTickers.includes(item.id) ? "active" : ""}
            disabled={item.rows.length === 0}
            key={item.id}
            onClick={() => toggleTicker(item.id)}
            title={item.rows.length === 0 ? "No data in this window" : item.name}
            type="button"
          >
            <span style={{ background: item.color }} aria-hidden="true" />
            {item.id}
          </button>
        ))}
      </div>

      <div className="market-svg-wrap">
        <svg
          className="ai-market-svg"
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          aria-labelledby={`${descriptionId}-title ${descriptionId}`}
        >
          <title id={`${descriptionId}-title`}>
            Closing-price comparison for {view.label}
          </title>
          <desc>
            Select companies, change between relative performance and share price, and inspect individual trading dates.
          </desc>

          <g className="ai-market-grid">
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={plot.left} x2={chartWidth - plot.right} y1={y(tick)} y2={y(tick)} />
                <text x={plot.left - 10} y={y(tick) + 4} textAnchor="end">
                  {metric === "relative" ? `${tick > 0 ? "+" : ""}${tick.toFixed(0)}%` : `$${tick.toFixed(tick < 20 ? 1 : 0)}`}
                </text>
              </g>
            ))}
          </g>

          <g className="ai-market-x-axis">
            {xTicks.map((tick, index) => (
              <text
                key={tick.value}
                textAnchor={index === 0 ? "start" : index === xTicks.length - 1 ? "end" : "middle"}
                x={tick.x}
                y={chartHeight - 18}
              >
                {(view.id === "long" ? yearFormatter : shortDateFormatter).format(new Date(tick.value))}
              </text>
            ))}
          </g>

          <text className="ai-market-axis-title" x={plot.left} y={18}>
            {metric === "relative" ? "Change from first available close" : "Split-adjusted close (USD)"}
          </text>

          <g className="ai-market-events">
            {view.events.map((event) => {
              const eventX = x(event.date);
              const alignRight = eventX > chartWidth - 120;
              return (
                <g key={`${event.date}-${event.label}`}>
                  <line x1={eventX} x2={eventX} y1={plot.top} y2={chartHeight - plot.bottom} />
                  <text
                    textAnchor={alignRight ? "end" : "start"}
                    x={eventX + (alignRight ? -5 : 5)}
                    y={plot.top + 13 + (event.row ?? 0) * 14}
                  >
                    {event.label}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="ai-market-series">
            {plottedSeries.map((item) => {
              const path = item.rows.map((row, index) => {
                const value = metric === "relative" ? row.relative : row.close;
                return `${index === 0 ? "M" : "L"}${x(row.date).toFixed(2)},${y(value).toFixed(2)}`;
              }).join(" ");
              return (
                <path
                  d={path}
                  key={item.id}
                  style={{ stroke: item.color }}
                  className={item.id === "SPY" ? "benchmark" : undefined}
                />
              );
            })}
          </g>

          {activeDate && (
            <g className="ai-market-cursor" pointerEvents="none">
              <line x1={activeX} x2={activeX} y1={plot.top} y2={chartHeight - plot.bottom} />
              {activeRows.map((item) => {
                const value = metric === "relative" ? item.row.relative : item.row.close;
                return (
                  <circle
                    cx={activeX}
                    cy={y(value)}
                    key={item.id}
                    r={4}
                    style={{ stroke: item.color }}
                  />
                );
              })}
              <g className="ai-market-tooltip" transform={`translate(${tooltipX} ${plot.top + 8})`}>
                <rect width={tooltipWidth} height={tooltipHeight} rx={3} />
                <text className="tooltip-date" x={12} y={20}>{formatDate(activeDate)}</text>
                {activeRows.map((item, index) => (
                  <g key={item.id} transform={`translate(0 ${36 + index * 20})`}>
                    <circle cx={14} cy={0} r={3} style={{ fill: item.color }} />
                    <text x={24} y={4}>{item.id}</text>
                    <text className="tooltip-value" x={tooltipWidth - 12} y={4} textAnchor="end">
                      {metric === "relative" ? formatSigned(item.row.relative) : `$${item.row.close.toFixed(2)}`}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          )}

          <rect
            aria-label="Inspect chart date"
            aria-valuemax={Math.max(0, allDates.length - 1)}
            aria-valuemin={0}
            aria-valuenow={activeIndex}
            aria-valuetext={activeDate ? formatDate(activeDate) : "No date selected"}
            className="ai-market-hit-area"
            height={innerHeight}
            onBlur={() => {
              if (!pinnedDate) setCursorDate(null);
            }}
            onClick={(event) => {
              const date = dateAtPointer(event);
              setPinnedDate((current) => current === date ? null : date);
              setCursorDate(date);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveCursor(-1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                moveCursor(1);
              } else if (event.key === "Escape") {
                setPinnedDate(null);
                setCursorDate(null);
              }
            }}
            onPointerLeave={() => {
              if (!pinnedDate) setCursorDate(null);
            }}
            onPointerMove={(event) => {
              if (!pinnedDate) setCursorDate(dateAtPointer(event));
            }}
            role="slider"
            tabIndex={0}
            width={innerWidth}
            x={plot.left}
            y={plot.top}
          />
        </svg>
      </div>

      <figcaption id={descriptionId}>
        {view.id === "long" ? "Weekly" : "Daily"} closing prices through 28 August 2026. Relative change—the default—sets each line to 0% at its first available session in the selected window. It compares trajectories, not company size, and excludes dividends. Share-price mode shows split-adjusted closes as supplied by Nasdaq. Sandisk begins with its first regular-trading week in February 2025. Source: <a href="https://www.nasdaq.com/market-activity/stocks/nvda/historical">Nasdaq historical data</a>.
      </figcaption>
    </figure>
  );
}
