import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import sections from "../data/sections";
import ProgressPie from "../components/ProgressPie";
import TopicSlotRoller from "../components/TopicSlotRoller";

export default function Mindmap() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const centerRef = useRef(null);
  const nodeRefs = useRef({}); // key -> element
  const [paths, setPaths] = useState([]);

  const all = useMemo(() => sections.slice().sort((a, b) => a.id - b.id), []);
  const left = useMemo(() => all.filter((s) => s.paper === 1), [all]);
  const right = useMemo(() => all.filter((s) => s.paper === 2), [all]);

  const globalProgress = useMemo(() => {
    const total = all.reduce((acc, s) => acc + s.topics.length, 0);
    const done = all.reduce((acc, s) => {
      const completed = s.topics.filter(
        (t) =>
          localStorage.getItem(`completed_${s.sectionSlug}_${t.topicSlug}`) === "true"
      ).length;
      return acc + completed;
    }, 0);
    return { total, done };
  }, [all]);

  function rectLocal(el, wrapEl) {
    const r = el.getBoundingClientRect();
    const w = wrapEl.getBoundingClientRect();
    return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
  }

  function makeCurve(from, to) {
    const dx = Math.abs(to.x - from.x);
    const c = Math.max(90, Math.min(220, dx * 0.55));
    const c1 = { x: from.x + (to.x > from.x ? c : -c), y: from.y };
    const c2 = { x: to.x + (to.x > from.x ? -c : c), y: to.y };
    return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  }

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const center = centerRef.current;
    if (!wrap || !center) return;

    let raf = 0;

    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrapEl = wrapRef.current;
        const centerEl = centerRef.current;
        if (!wrapEl || !centerEl) return;

        const c = rectLocal(centerEl, wrapEl);
        const centerLeft = { x: c.x, y: c.y + c.h / 2 };
        const centerRight = { x: c.x + c.w, y: c.y + c.h / 2 };

        const next = [];

        left.forEach((s) => {
          const el = nodeRefs.current[`section-${s.sectionSlug}`];
          if (!el) return;
          const r = rectLocal(el, wrapEl);
          const to = { x: r.x + r.w, y: r.y + r.h / 2 }; // right edge of left card
          const from = { x: centerLeft.x, y: centerLeft.y };
          const stroke = s.id <= 6 ? "var(--accent)" : "var(--accent2)";
          next.push({ key: `L-${s.sectionSlug}`, d: makeCurve(from, to), stroke });
        });

        right.forEach((s) => {
          const el = nodeRefs.current[`section-${s.sectionSlug}`];
          if (!el) return;
          const r = rectLocal(el, wrapEl);
          const to = { x: r.x, y: r.y + r.h / 2 }; // left edge of right card
          const from = { x: centerRight.x, y: centerRight.y };
          const stroke = "var(--accent2)";
          next.push({ key: `R-${s.sectionSlug}`, d: makeCurve(from, to), stroke });
        });

        setPaths(next);
      });
    };

    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);

    // fonts/images can shift layout after first paint
    setTimeout(recompute, 50);
    setTimeout(recompute, 250);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [left, right]);

  const CardButton = ({ s, side }) => {
    const isBlue = s.id <= 6 && side === "left";
    const stroke = side === "left" ? (isBlue ? "#2563eb" : "#ef4444") : "#ef4444";
    const completed = s.topics.filter(
      (t) => localStorage.getItem(`completed_${s.sectionSlug}_${t.topicSlug}`) === "true"
    ).length;

    return (
      <button
        ref={(el) => (nodeRefs.current[`section-${s.sectionSlug}`] = el)}
        onClick={() => navigate(`/section/${s.sectionSlug}`)}
        className={[
          "group w-full text-left rounded-2xl border bg-[var(--card)]",
          "px-5 py-4 shadow-sm transition",
          "hover:shadow-md hover:-translate-y-[1px]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
        ].join(" ")}
        style={{
          borderColor: side === "left"
            ? (isBlue ? "rgba(37,99,235,0.25)" : "rgba(239,68,68,0.25)")
            : "rgba(239,68,68,0.25)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold text-[15px] truncate">{s.name}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {s.topics.length} topics
            </div>
          </div>
          <div className="mt-0.5 shrink-0">
            <ProgressPie completed={completed} total={s.topics.length} size={22} stroke={stroke} />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full min-h-[calc(100vh-64px)] px-8 py-10"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            stroke={p.stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
        ))}
      </svg>

      {/* Top bar */}
      <div className="absolute left-8 right-8 top-6 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          
        </div>

        <div className="flex items-center gap-3 bg-[var(--card)] border rounded-xl px-4 py-2.5 shadow-sm">
          <ProgressPie completed={globalProgress.done} total={globalProgress.total} size={52} />
          <div className="text-sm text-[var(--muted)]">
            {globalProgress.done}/{globalProgress.total}
          </div>
        </div>
      </div>

            {/* 3-column balanced layout */}
      <div className="relative z-10 mt-10 grid grid-cols-[minmax(260px,420px)_minmax(260px,360px)_minmax(260px,420px)] gap-8 items-center justify-center">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {left.map((s) => (
            <CardButton key={s.sectionSlug} s={s} side="left" />
          ))}
        </div>

        {/* Center */}
        <div className="flex items-center justify-center">
          <div
            ref={centerRef}
            className="px-10 py-6 rounded-full border bg-[var(--card)] shadow-md text-center"
          >
            <div className="text-3xl font-bold" style={{ fontFamily: "Lobster, cursive" }}>
              Computer Science
            </div>
            <div className="text-sm text-[var(--muted)] mt-1">
              Paper 1 • Paper 2
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {right.map((s) => (
            <CardButton key={s.sectionSlug} s={s} side="right" />
          ))}
        </div>
      </div>

      {/* 🎰 Random Topic Slot (bottom-right) */}
      <div className="fixed z-50" style={{ right: 18, bottom: 18 }}>
        <TopicSlotRoller />
      </div>
    </div>
  );
}
