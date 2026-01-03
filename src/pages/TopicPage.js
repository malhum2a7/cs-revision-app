import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import sections from "../data/sections";
import RichEditor from "../components/RichEditor";
import SummariserPopover from "../components/SummariserPopover";
import TextbookViewer from "../components/TextbookViewer";
import { idbGetNote, idbSetNote, idbDeleteNote } from "../utils/idbNotes";

const notesKey = (sectionSlug, topicSlug, tab) => `notes_${sectionSlug}_${topicSlug}_${tab}`;
const completedKey = (sectionSlug, topicSlug) => `completed_${sectionSlug}_${topicSlug}`;
const flashKey = (sectionSlug, topicSlug) => `flashcards_${sectionSlug}_${topicSlug}`;

export default function TopicPage() {
  const { sectionSlug, topicSlug } = useParams();
  const navigate = useNavigate();

  const section = useMemo(
    () => sections.find((s) => s.sectionSlug === sectionSlug),
    [sectionSlug]
  );

  const topic = useMemo(
    () => section?.topics.find((t) => t.topicSlug === topicSlug),
    [section, topicSlug]
  );

  const [tab, setTab] = useState("mynotes");
  const [html, setHtml] = useState("");
  const [completed, setCompleted] = useState(false);
  const [flashcards, setFlashcards] = useState([]);

  // Summariser
  const editorRef = useRef(null);
  const [sumOpen, setSumOpen] = useState(false);
  const [sumInitial, setSumInitial] = useState("");

  // Flashcard modal (replaces prompt)
  const [fcOpen, setFcOpen] = useState(false);
  const [fcTerm, setFcTerm] = useState("");
  const [fcDef, setFcDef] = useState("");
  const [fcEditingId, setFcEditingId] = useState(null);

  // LOAD (notes + completed + flashcards)
  useEffect(() => {
    // If invalid route, don't try to load storage
    if (!section || !topic) return;

    setCompleted(localStorage.getItem(completedKey(sectionSlug, topicSlug)) === "true");

    (async () => {
      const key = notesKey(sectionSlug, topicSlug, tab);
      const saved = await idbGetNote(key);
      setHtml(saved || "");
    })().catch(console.error);

    const cards = JSON.parse(localStorage.getItem(flashKey(sectionSlug, topicSlug)) || "[]");
    setFlashcards(cards);
  }, [section, topic, sectionSlug, topicSlug, tab]);

  // SAVE notes (debounced)
  useEffect(() => {
    if (!section || !topic) return;

    const key = notesKey(sectionSlug, topicSlug, tab);

    const t = setTimeout(() => {
      idbSetNote(key, html || "").catch((e) => {
        console.error(e);
        alert("Couldn’t save notes (IndexedDB error). Check console.");
      });
    }, 250);

    return () => clearTimeout(t);
  }, [html, section, topic, sectionSlug, topicSlug, tab]);

  // SAVE completed
  useEffect(() => {
    if (!section || !topic) return;
    localStorage.setItem(completedKey(sectionSlug, topicSlug), completed ? "true" : "false");
  }, [completed, section, topic, sectionSlug, topicSlug]);

  // SAVE flashcards
  useEffect(() => {
    if (!section || !topic) return;
    localStorage.setItem(flashKey(sectionSlug, topicSlug), JSON.stringify(flashcards));
  }, [flashcards, section, topic, sectionSlug, topicSlug]);

  // ---------- helpers ----------
  async function clearNotes() {
    if (!window.confirm("Clear this note page? This cannot be undone.")) return;
    setHtml("");
    if (!section || !topic) return;
    await idbDeleteNote(notesKey(sectionSlug, topicSlug, tab));
  }

  // ✅ ONLY selected text; if nothing selected => ""
  function getSelectedTextOnly() {
    const ed = editorRef.current;
    if (!ed) return "";
    const { from, to } = ed.state.selection;
    if (from === to) return "";
    return ed.state.doc.textBetween(from, to, " ").trim();
  }

  function openNewFlashcardModal() {
    const selected = getSelectedTextOnly(); // ✅ not whole notes
    setFcEditingId(null);
    setFcTerm("");
    setFcDef(selected || "");
    setFcOpen(true);
  }

  function openEditFlashcardModal(card) {
    setFcEditingId(card.id);
    setFcTerm(card.term || "");
    setFcDef(card.def || "");
    setFcOpen(true);
  }

  function closeFlashcardModal() {
    setFcOpen(false);
    setFcEditingId(null);
    setFcTerm("");
    setFcDef("");
  }

  function saveFlashcard() {
    const term = (fcTerm || "").trim();
    const def = (fcDef || "").trim();
    if (!term) return;

    if (fcEditingId == null) {
      setFlashcards((prev) => [{ id: Date.now(), term, def }, ...prev]);
    } else {
      setFlashcards((prev) => prev.map((x) => (x.id === fcEditingId ? { ...x, term, def } : x)));
    }

    closeFlashcardModal();
  }

  // ---------- computed UI state ----------
  const hasNotes = (html || "").replace(/<[^>]*>/g, " ").trim().length > 0;

  const status = completed
    ? { label: "Completed", bg: "rgba(34,197,94,0.15)", bd: "rgba(34,197,94,0.55)", fg: "rgba(22,101,52,1)" }
    : hasNotes
    ? { label: "In progress", bg: "rgba(245,158,11,0.15)", bd: "rgba(245,158,11,0.55)", fg: "rgba(146,64,14,1)" }
    : { label: "Not started", bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.55)", fg: "rgba(153,27,27,1)" };

  // ✅ NOW we can safely early-return (after hooks)
  if (!section) return <div className="p-8">Section not found.</div>;
  if (!topic) return <div className="p-8">Topic not found.</div>;

  // ---------- render ----------
  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h1" style={{ fontFamily: "Lobster, cursive" }}>
              {topic.name}
            </div>

            {/* ✅ Hide status when on textbook tab */}
            {tab !== "textbook" ? (
              <div
                className="px-3 py-1 rounded-full border text-sm font-semibold"
                style={{ background: status.bg, borderColor: status.bd, color: status.fg }}
              >
                {status.label}
              </div>
            ) : null}
          </div>

          <div className="p-muted mt-1">{section.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/section/${section.sectionSlug}`)} className="btn">
            Back
          </button>

          <button
            onClick={() => setCompleted((c) => !c)}
            className="btn"
            style={{
              borderColor: completed ? "rgba(34,197,94,0.6)" : "rgba(15,23,42,0.12)",
              background: completed ? "rgba(34,197,94,0.10)" : "var(--card)",
            }}
          >
            {completed ? "Mark Incomplete" : "Mark Completed"}
          </button>
        </div>
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button className="btn" onClick={() => setTab("textbook")}>Textbook</button>
        <button className="btn" onClick={() => setTab("mynotes")}>MyNotes</button>

        <div className="w-4" />

        <button onClick={clearNotes} className="btn">Clear</button>

        <button onClick={openNewFlashcardModal} className="btn">
          Make Flashcard
        </button>

        <button
          className="btn"
          onClick={() => {
            const sel = getSelectedTextOnly();
            if (!sel) {
              alert("Select some text in your notes to summarise.");
              return;
            }
            setSumInitial(sel);
            setSumOpen(true);
          }}
        >
          Summarise
        </button>

        <button onClick={() => navigate(`/practice/${sectionSlug}/${topicSlug}`)} className="btn">
          Practice
        </button>
      </div>

      {/* Content */}
      {tab === "textbook" ? (
        <TextbookViewer
          pdfUrl="/textbook.pdf"
          bookStart={topic?.textbookStart}
          bookEnd={topic?.textbookEnd}
          offset={9}
        />
      ) : (
        <div className="card p-5">
          <RichEditor
            valueHTML={html}
            onChangeHTML={setHtml}
            onReady={(ed) => (editorRef.current = ed)}
          />
        </div>
      )}

      {/* Flashcards */}
      <div className="mt-6 card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Flashcards</div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/flashcards")} className="btn">
              View all
            </button>
          </div>
        </div>

        {flashcards.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No flashcards yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {flashcards.map((c) => (
              <div key={c.id} className="rounded-xl border p-3 bg-white/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{c.term}</div>
                    <div className="text-sm text-[var(--muted)] mt-1">{c.def}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="btn" onClick={() => openEditFlashcardModal(c)}>
                      Edit
                    </button>

                    <button
                      className="btn"
                      onClick={() => {
                        if (!window.confirm("Delete this flashcard?")) return;
                        setFlashcards((prev) => prev.filter((x) => x.id !== c.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flashcard Modal */}
      {fcOpen ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeFlashcardModal();
          }}
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <div className="w-full max-w-xl rounded-2xl border bg-[var(--card)] shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">{fcEditingId == null ? "New Flashcard" : "Edit Flashcard"}</div>
              <button className="btn" onClick={closeFlashcardModal}>Close</button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">(front)</div>
                <input
                  value={fcTerm}
                  onChange={(e) => setFcTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none"
                  placeholder="Fill the front..."
                  autoFocus
                />
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">(back)</div>
                <textarea
                  value={fcDef}
                  onChange={(e) => setFcDef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none min-h-[140px]"
                  placeholder="Fill the back..."
                />
                <div className="text-xs text-[var(--muted)] mt-1">
                  {fcEditingId == null
                    ? "Tip: select text in your notes to pre-fill this."
                    : "Editing an existing flashcard."}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button className="btn" onClick={closeFlashcardModal}>Cancel</button>
              <button
                className="btn"
                onClick={saveFlashcard}
                disabled={!fcTerm.trim()}
                style={{
                  opacity: fcTerm.trim() ? 1 : 0.6,
                  cursor: fcTerm.trim() ? "pointer" : "not-allowed",
                }}
              >
                {fcEditingId == null ? "Save" : "Update"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SummariserPopover
        open={sumOpen}
        initialText={sumInitial}
        onClose={() => setSumOpen(false)}
      />
    </div>
  );
}
