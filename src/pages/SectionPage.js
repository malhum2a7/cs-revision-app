import React, { useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import sections from "../data/sections";
import ProgressPie from "../components/ProgressPie";
import ConfidenceRag from "../components/ConfidenceRag";

export default function SectionPage() {
  const { sectionSlug } = useParams();
  const navigate = useNavigate();

  const section = useMemo(
    () => sections.find((s) => s.sectionSlug === sectionSlug),
    [sectionSlug]
  );

  const progress = useMemo(() => {
    if (!section) return { completed: 0, total: 0 };
    const total = section.topics.length;
    const completed = section.topics.filter(
      (t) => localStorage.getItem(`completed_${section.sectionSlug}_${t.topicSlug}`) === "true"
    ).length;
    return { completed, total };
  }, [section]);

  if (!section) return <div className="p-10">Section not found.</div>;

  // Layout slots (prevents overlap)
  const slots = Math.max(6, section.topics.length);
  const topicSlots = section.topics.map((t, i) => ({
    ...t,
    yPct: ((i + 1) / (slots + 1)) * 100,
  }));

// Theme-driven colours
const branchStroke = section.paper === 1 ? "var(--accent)" : "var(--accent2)";

// Theme-driven borders/text (no Tailwind colour classes)
const borderStyle = {
  borderColor:
    section.paper === 1 ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                        : "color-mix(in srgb, var(--accent2) 30%, transparent)",
};

const hoverBorderStyle = {
  "--hover-border":
    section.paper === 1 ? "color-mix(in srgb, var(--accent) 55%, transparent)"
                        : "color-mix(in srgb, var(--accent2) 55%, transparent)",
};

const textStyle = { color: section.paper === 1 ? "var(--accent)" : "var(--accent2)" };

  return (
    <div className="relative min-h-[calc(100vh-64px)] page">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
<h1 className="text-3xl font-bold" style={textStyle}>
  {section.name}
   <ConfidenceRag storageKey={`section:${section.sectionSlug}`} />
</h1>
          <div className="text-sm text-muted">Topics mindmap</div>
        </div>

        <div className="flex items-center gap-3 bg-card border rounded-2xl px-3 py-2">
          <ProgressPie completed={progress.completed} total={progress.total} color={branchStroke} />
          <div className="text-sm">
            <div className="font-semibold">Section progress</div>
            <div className="text-muted">
              {progress.completed}/{progress.total} complete
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="ml-3 px-3 py-2 rounded-xl border bg-card hover:bg-black/5"
          >
            Home
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative min-h-[560px] rounded-3xl border bg-card overflow-hidden">
        {/* SVG overlay in percent-space */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {topicSlots.map((t) => (
            <path
              key={t.topicSlug}
              // section node ~x=78,y=50 -> topic node ~x=22,y=yPct
              d={`M78,50 C68,50 62,${t.yPct} 22,${t.yPct}`}
              stroke={branchStroke}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.95"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Section node (right) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-[320px]">
          <div
  className="rounded-3xl border bg-card shadow-sm p-5"
  style={borderStyle}
>
  <div className="text-xl font-bold" style={textStyle}>Section</div>

            <div className="mt-1 font-semibold">{section.name}</div>
          </div>
        </div>

       {/* Topic nodes (left) — positioned to match yPct */}
<div className="absolute inset-0 z-20">
  {topicSlots.map((t) => {
    const done =
      localStorage.getItem(`completed_${section.sectionSlug}_${t.topicSlug}`) === "true";

    return (
      <Link
        key={t.topicSlug}
        to={`/section/${section.sectionSlug}/${t.topicSlug}`}
        className="rounded-2xl border bg-card px-4 py-3 shadow-sm hover:shadow transition flex items-center justify-between hover:[border-color:var(--hover-border)]"
        style={{
          ...borderStyle,
          ...hoverBorderStyle,

          // 👇 THIS is the missing alignment
          position: "absolute",
          left: "6%",
          top: `${t.yPct}%`,
          transform: "translateY(-50%)",
          width: "44%",
          maxWidth: "560px",
        }}
      >
        <div className="min-w-0">
  <div className="font-semibold truncate">{t.name}</div>
  <div className="text-xs text-muted">{done ? "Completed" : "Not completed"}</div>
</div>

<div className="flex items-center gap-3 shrink-0">
  <ConfidenceRag
    storageKey={`topic:${section.sectionSlug}:${t.topicSlug}`}
    compact
    label={false}
  />
  <div className="text-lg">{done ? "✅" : "⬜️"}</div>
</div>

      </Link>
    );
  })}
</div>

      </div>
    </div>
  );
}
