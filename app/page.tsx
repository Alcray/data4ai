"use client";

import { useMemo, useState } from "react";
import { introductionHtml } from "./generated/introduction";
import { lecture1Html } from "./generated/lecture-1";

const navigation = [
  "Home",
  "Calendar",
  "Lectures",
  "Paper reviews",
  "Paper discussions",
  "Projects",
] as const;

const lectures = ["Introduction", "Lecture 1"] as const;
type PageName = (typeof navigation)[number] | (typeof lectures)[number];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lecturesOpen, setLecturesOpen] = useState(true);
  const [active, setActive] = useState<PageName>("Home");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [...navigation, ...lectures].filter((item) =>
      item.toLowerCase().includes(normalized),
    );
  }, [query]);

  function choosePage(item: PageName) {
    setActive(item);
    if (lectures.includes(item as (typeof lectures)[number])) {
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
                  <ul className="nav-list nav-list-nested">
                    {lectures.map((lecture) => (
                      <li className="nav-list-item" key={lecture}>
                        <button
                          className={`nav-list-link${active === lecture ? " active" : ""}`}
                          type="button"
                          onClick={() => choosePage(lecture)}
                        >
                          {lecture}
                        </button>
                      </li>
                    ))}
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

        <div
          className="main-content-wrap"
          aria-label={`${active} content`}
          onClick={() => setSearchOpen(false)}
        >
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
          ) : active === "Introduction" ? (
            <article
              className="main-content lecture-content"
              dangerouslySetInnerHTML={{ __html: introductionHtml }}
            />
          ) : active === "Lecture 1" ? (
            <article
              className="main-content lecture-content"
              dangerouslySetInnerHTML={{ __html: lecture1Html }}
            />
          ) : active === "Calendar" ||
            active === "Paper reviews" ||
            active === "Paper discussions" ||
            active === "Projects" ? (
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
