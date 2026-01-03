import React, { useMemo } from "react";
import sections from "../data/sections";

function calcSectionStats(section) {
  const total = section.topics.length;
  const completed = section.topics.filter(
    (t) => localStorage.getItem(`completed_${section.sectionSlug}_${t.topicSlug}`) === "true"
  ).length;
  return { total, completed };
}

export default function Dashboard() {
  const data = useMemo(() => {
    let totalAll = 0;
    let completedAll = 0;

    const rows = sections.map((s) => {
      const { total, completed } = calcSectionStats(s);
      totalAll += total;
      completedAll += completed;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      return { ...s, total, completed, percent };
    });

    return { rows, totalAll, completedAll };
  }, []);

  return (
    <div className="min-h-[calc(100vh-84px)]">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="mt-2 opacity-70">
        Total completed: <span className="font-semibold">{data.completedAll}</span> / {data.totalAll}
      </div>

      <div className="mt-8 grid gap-4">
        {data.rows.map((r) => (
          <div key={r.sectionSlug} className="bg-[var(--card)] border border-black/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm opacity-70">
                {r.completed}/{r.total} ({r.percent}%)
              </div>
            </div>
            <div className="mt-3 w-full h-2 rounded bg-black/10 overflow-hidden">
              <div
                className="h-2 rounded"
                style={{ width: `${r.percent}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
