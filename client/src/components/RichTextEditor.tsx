import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered, Link2, Link2Off,
  RemoveFormatting, Undo, Redo,
} from "lucide-react";

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`h-7 w-7 flex items-center justify-center rounded transition-colors text-sm
        ${active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

// ─── Link Dialog ─────────────────────────────────────────────────────────────
function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const currentLink = editor.getAttributes("link").href as string | undefined;
  const hasLink = editor.isActive("link");

  const applyLink = () => {
    if (!url.trim()) return;
    const href = url.startsWith("http") ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank" }).run();
    setOpen(false);
    setUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setUrl(currentLink ?? ""); }}>
      <PopoverTrigger asChild>
        <span>
          <ToolbarButton
            onClick={() => setOpen((v) => !v)}
            active={hasLink}
            title="Insert / edit link"
          >
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://nsds.io"
            className="h-8 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={applyLink} disabled={!url.trim()}>
            Apply
          </Button>
          {hasLink && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={removeLink}>
              <Link2Off className="h-3 w-3" />
              Remove
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 rounded-t-md">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Link */}
      <LinkPopover editor={editor} />

      <div className="w-px h-4 bg-border mx-1" />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear formatting"
      >
        <RemoveFormatting className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

// ─── Plain-text → HTML converter ─────────────────────────────────────────────
export function plainTextToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<p></p>";
      return `<p>${trimmed
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
      }</p>`;
    })
    .join("");
}

// ─── Main Component ───────────────────────────────────────────────────────────
export type RichTextEditorProps = {
  value: string;           // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;      // px
  className?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 220,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading — emails don't need h1/h2
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
  });

  // Sync external value changes (e.g. when AI redrafts)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== value) {
      // Preserve cursor position by only updating when content actually differs
      editor.commands.setContent(value, false as any);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={`border border-border rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring transition-shadow ${className}`}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="px-3 py-2 text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit]
          [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-2
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-2
          [&_.ProseMirror_li]:mb-0.5
          [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline
          [&_.ProseMirror_strong]:font-semibold
          [&_.ProseMirror_em]:italic
          [&_.ProseMirror_u]:underline
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground
          [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}
