import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import ResizableImage from "./editor/ResizableImage";

/**
 * Compress image file -> dataURL
 * - resizes to maxWidth
 * - encodes JPEG at quality
 */
async function fileToCompressedDataURL(
  file,
  { maxWidth = 1600, photoQuality = 0.84, webpQuality = 0.92 } = {}
) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  if (typeof dataUrl !== "string") return "";
  if (file.type === "image/svg+xml") return dataUrl; // already compact + sharp

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const w = img.width || 1;
  const h = img.height || 1;

  const scale = w > maxWidth ? maxWidth / w : 1;
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, outW, outH);

  // Heuristic: screenshots/diagrams tend to be PNGs or have limited colour variation.
  const isLikelyScreenshot =
    file.type === "image/png" ||
    file.name?.toLowerCase().endsWith(".png") ||
    file.size < 700_000; // small-ish images often are diagrams/screenshots

  // Prefer WebP for diagrams too (very small, visually near-lossless)
  const webp = canvas.toDataURL("image/webp", webpQuality);

  // If WebP failed (older safari etc), it'll return "data:image/png..." or similar.
  const webpSupported = typeof webp === "string" && webp.startsWith("data:image/webp");

  if (isLikelyScreenshot) {
    if (webpSupported) return webp;
    return canvas.toDataURL("image/png");
  }

  // Photo path (lossy JPEG)
  return canvas.toDataURL("image/jpeg", photoQuality);
}


export default function RichEditor({
  valueHTML,
  onChangeHTML,
  placeholder = "Write your notes here…",
  onReady, // exposes TipTap editor instance to parent
}) {
  const ImageWithResize = useMemo(() => {
    return Image.extend({
      draggable: true,
      addAttributes() {
        return {
          ...this.parent?.(),
          width: { default: 420 },

          // alignment when NOT floating: left | center | right
          align: { default: "center" },

          // float behavior: none | left | right
          float: { default: "none" },
        };
      },
      addNodeView() {
        return ReactNodeViewRenderer(ResizableImage);
      },
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      ImageWithResize,
    ],
    content: valueHTML || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[520px] focus:outline-none prose max-w-none prose-headings:mt-4 prose-p:my-2",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChangeHTML?.(editor.getHTML());
    },
  });

  // expose editor instance to parent once ready
  useEffect(() => {
    if (!editor) return;
    onReady?.(editor);
  }, [editor, onReady]);

  // Keep editor in sync when switching tabs
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = valueHTML || "";
    if (current !== next) editor.commands.setContent(next, false);
  }, [editor, valueHTML]);

  const [color, setColor] = useState("#2563eb");
  const [hlColor, setHlColor] = useState("#fde68a");

  const onImageToolbar = editor?.isActive("image");

  function setImageAttr(patch) {
    if (!onImageToolbar) return;
    editor.chain().focus().updateAttributes("image", patch).run();
  }

  async function insertImageFromFile(file) {
    try {
      // Compress so it actually saves
      const src = await fileToCompressedDataURL(file, { maxWidth: 1400, quality: 0.82 });
      if (!src) return;

      editor?.chain().focus().setImage({ src, width: 420, align: "center", float: "none" }).run();

      // Force save (some nodeviews can delay updates)
      onChangeHTML?.(editor?.getHTML?.() || "");
    } catch (e) {
      console.error(e);
      alert("Could not load that image. Try a different file.");
    }
  }

  if (!editor) return null;

  return (
    <div className="rounded-2xl border bg-[var(--card)] shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b sticky top-[56px] bg-[var(--card)] z-10 rounded-t-2xl">
        <button className="btn" onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>
        <button className="btn" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </button>
        <button className="btn" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </button>

        <button className="btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </button>
        <button className="btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </button>
        <button className="btn" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>

        <div className="w-px h-7 bg-black/10 mx-1" />

        {/* Highlight colour picker */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hlColor}
            onChange={(e) => setHlColor(e.target.value)}
            className="w-9 h-9 rounded border bg-transparent cursor-pointer"
            title="Highlight colour"
          />
          <button
            className="btn"
            onClick={() => editor.chain().focus().toggleHighlight({ color: hlColor }).run()}
            title="Apply highlight"
          >
            Highlight
          </button>
          <button
            className="btn"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            title="Remove highlight"
          >
            Unhighlight
          </button>
        </div>

        <div className="w-px h-7 bg-black/10 mx-1" />

        {/* Text colour */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              editor.chain().focus().setColor(e.target.value).run();
            }}
            className="w-9 h-9 rounded border bg-transparent cursor-pointer"
            title="Text colour"
          />
          <button className="btn" onClick={() => editor.chain().focus().unsetColor().run()}>
            Reset color
          </button>
        </div>

        <div className="w-px h-7 bg-black/10 mx-1" />

        {/* Images */}
        <label className="btn cursor-pointer">
          Add image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) insertImageFromFile(f);
              // allow re-uploading same file
              e.target.value = "";
            }}
          />
        </label>

        <button
          className="btn"
          onClick={() => {
            const url = prompt("Paste an image URL:");
            if (url) editor.chain().focus().setImage({ src: url, width: 420, align: "center", float: "none" }).run();
          }}
        >
          Image URL
        </button>

        {/* Image controls (only when an image is selected) */}
        <div className="ml-auto flex items-center gap-2">
          {onImageToolbar ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-[var(--muted)] mr-1">Image:</div>

              {/* Float */}
              <button className="btn" onClick={() => setImageAttr({ float: "none" })} title="No float">
                Inline
              </button>
              <button className="btn" onClick={() => setImageAttr({ float: "left" })} title="Float left (text wraps)">
                Float L
              </button>
              <button className="btn" onClick={() => setImageAttr({ float: "right" })} title="Float right (text wraps)">
                Float R
              </button>

              <div className="w-px h-7 bg-black/10 mx-1" />

              {/* Align (only meaningful when float=none) */}
              <button className="btn" onClick={() => setImageAttr({ align: "left" })} title="Align left">
                Left
              </button>
              <button className="btn" onClick={() => setImageAttr({ align: "center" })} title="Align center">
                Center
              </button>
              <button className="btn" onClick={() => setImageAttr({ align: "right" })} title="Align right">
                Right
              </button>
            </div>
          ) : (
            <div className="text-xs text-[var(--muted)]">Select an image to edit alignment/float</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
