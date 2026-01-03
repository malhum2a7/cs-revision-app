// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { THEME_KEYS, THEMES } from "../themeConfig";

function applyTheme(key) {
  const theme = THEMES[key];
  if (!theme) return;

  const el = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => el.style.setProperty(k, v));
  localStorage.setItem("cs_theme", key);
}

export default function Navbar() {
  const loc = useLocation();
  const [curTheme, setCurTheme] = useState(
    localStorage.getItem("cs_theme") || "notion"
  );

  useEffect(() => {
    applyTheme(curTheme);
  }, [curTheme]);

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--card)]/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-3 text-2xl font-bold"
            style={{ fontFamily: "Lobster, cursive" }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="CS Revision logo"
              className="h-10 w-10 rounded-md object-cover"
              style={{ width: 40, height: 40 }} // fallback even if tailwind breaks
            />
            CS Revision
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-full border hover:shadow-sm transition ${
                loc.pathname === "/dashboard" ? "bg-black/5" : ""
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/flashcards"
              className={`px-3 py-1.5 rounded-full border hover:shadow-sm transition ${
                loc.pathname === "/flashcards" ? "bg-black/5" : ""
              }`}
            >
              Flashcards
            </Link>

            <Link
              to="/about"
              className={`px-3 py-1.5 rounded-full border hover:shadow-sm transition ${
                loc.pathname === "/about" ? "bg-black/5" : ""
              }`}
            >
              About
            </Link>
          </nav>
        </div>

        <select
          value={curTheme}
          onChange={(e) => setCurTheme(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white/60"
        >
          {THEME_KEYS.map((k) => (
            <option key={k} value={k}>
              {THEMES[k].name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
