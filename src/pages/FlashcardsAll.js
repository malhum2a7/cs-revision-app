import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import sections from "../data/sections";

export default function FlashcardsAll() {
  const [query, setQuery] = useState("");
  const [flipped, setFlipped] = useState({}); // key -> boolean
  const [refreshTick, setRefreshTick] = useState(0); // re-read localStorage after edits

  // Modal state (replaces prompt)
  const [fcOpen, setFcOpen] = useState(false);
  const [fcEditing, setFcEditing] = useState(null); // card object
  const [fcTerm, setFcTerm] = useState("");
  const [fcDef, setFcDef] = useState("");

  const all = useMemo(() => {
    // use refreshTick so list updates after edits without reload
    void refreshTick;

    const items = [];

    for (const s of sections) {
      for (const t of s.topics) {
        const k = `flashcards_${s.sectionSlug}_${t.topicSlug}`;
        const raw = localStorage.getItem(k);
        if (!raw) continue;

        try {
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) continue;

          for (const c of arr) {
            items.push({
              ...c,
              // support both shapes:
              definition: c.definition ?? c.def ?? "",
              sectionName: s.name,
              topicName: t.name,
              sectionSlug: s.sectionSlug,
              topicSlug: t.topicSlug,
              storageKey: k,
            });
          }
        } catch {
          // ignore bad JSON
        }
      }
    }

    // newest first (Date.now ids)
    return items.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;

    return all.filter((c) => {
      const hay = `${c.term} ${c.definition} ${c.sectionName} ${c.topicName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [all, query]);

  function saveBack(card, updater) {
    const raw = localStorage.getItem(card.storageKey);
    if (!raw) return false;

    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return false;

      const next = updater(arr);
      localStorage.setItem(card.storageKey, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }

  function onDelete(card) {
    if (!window.confirm("Delete this flashcard?")) return;

    const ok = saveBack(card, (arr) => arr.filter((x) => x.id !== card.id));
    if (ok) setRefreshTick((t) => t + 1);
  }

  function openEdit(card) {
    setFcEditing(card);
    setFcTerm(card.term ?? "");
    setFcDef(card.definition ?? "");
    setFcOpen(true);
  }

  function closeModal() {
    setFcOpen(false);
    setFcEditing(null);
    setFcTerm("");
    setFcDef("");
  }

  function saveModal() {
    const term = (fcTerm || "").trim();
    const def = (fcDef || "").trim();
    if (!term || !fcEditing) return;

    const ok = saveBack(fcEditing, (arr) =>
      arr.map((x) =>
        x.id === fcEditing.id
          ? { ...x, term, def, definition: undefined } // keep old compatibility
          : x
      )
    );

    if (ok) setRefreshTick((t) => t + 1);
    closeModal();
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Lobster, cursive" }}>
            All Flashcards
          </h1>
          <div className="text-sm text-[var(--muted)]">{filtered.length} cards</div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 rounded-2xl border bg-[var(--card)] w-full max-w-md"
          placeholder="Search cards…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">No flashcards found.</div>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {filtered.map((c) => {
            const key = `${c.sectionSlug}-${c.topicSlug}-${c.id}`;
            const isFlip = !!flipped[key];

            return (
              <div key={key} className="col-span-12 md:col-span-6 lg:col-span-4">
                <div className="bg-[var(--card)] border rounded-3xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--muted)]">{c.sectionName}</div>
                      <div className="text-xs text-[var(--muted)]">{c.topicName}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn" onClick={() => onDelete(c)}>Delete</button>
                    </div>
                  </div>

                  {/* Flip card */}
                  <button
                    className="mt-3 w-full text-left rounded-2xl border p-3 hover:shadow-sm transition"
                    onClick={() => setFlipped((p) => ({ ...p, [key]: !p[key] }))}
                    style={{
                      borderColor: "rgba(15,23,42,0.12)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    {!isFlip ? (
                      <>
                        <div className="font-semibold">{c.term}</div>
                        <div className="text-xs text-[var(--muted)] mt-1">
                          Click to reveal definition
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm whitespace-pre-wrap">
                          {c.definition || (
                            <span className="text-[var(--muted)]">No definition.</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-2">
                          Click to show term
                        </div>
                      </>
                    )}
                  </button>

                  <div className="mt-3">
                    <Link className="text-sm underline" to={`/section/${c.sectionSlug}/${c.topicSlug}`}>
                      Open topic
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {fcOpen ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <div className="w-full max-w-xl rounded-2xl border bg-[var(--card)] shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Edit Flashcard</div>
              <button className="btn" onClick={closeModal}>Close</button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">(front)</div>
                <input
                  value={fcTerm}
                  onChange={(e) => setFcTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none"
                  autoFocus
                />
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">(back)</div>
                <textarea
                  value={fcDef}
                  onChange={(e) => setFcDef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none min-h-[140px]"
                />
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button
                className="btn"
                onClick={saveModal}
                disabled={!fcTerm.trim()}
                style={{
                  opacity: fcTerm.trim() ? 1 : 0.6,
                  cursor: fcTerm.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
