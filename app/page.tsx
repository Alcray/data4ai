"use client";

import { useMemo, useState } from "react";

const navigation = [
  "Home",
  "Calendar",
  "Lectures",
  "Paper reviews",
  "Paper discussions",
  "Projects",
] as const;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<(typeof navigation)[number]>("Home");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return navigation.filter((item) => item.toLowerCase().includes(normalized));
  }, [query]);

  function choosePage(item: (typeof navigation)[number]) {
    setActive(item);
    setQuery("");
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <div className="course-shell">
      <aside className="side-bar">
        <header className="site-header">
          <button className="site-title" onClick={() => choosePage("Home")}>
            CS324
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
                  <span className="nav-list-expander" aria-hidden="true" />
                )}
                <button
                  className={`nav-list-link${active === item ? " active" : ""}`}
                  type="button"
                  onClick={() => choosePage(item)}
                >
                  {item}
                </button>
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
                placeholder="Search CS324"
                aria-label="Search CS324"
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
          <div className="main-content" aria-hidden="true" />
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
