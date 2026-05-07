"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { ResizableImage } from "@/components/ui/tiptap-resizable-image";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const getEditorContentClassName = (compact: boolean, editorClassName?: string) =>
  cn(
    "max-w-none p-4 text-sm leading-7 text-foreground focus:outline-none",
    compact ? "min-h-[140px]" : "min-h-[300px]",
    "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight",
    "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug",
    "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_li>p]:mb-0",
    "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:italic",
    "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_hr]:my-6 [&_hr]:border-border [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md",
    editorClassName
  );

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  mediaFolder?: string;
  compact?: boolean;
  className?: string;
  editorClassName?: string;
}

export function RichTextEditor({
  content,
  onChange,
  mediaFolder,
  compact = false,
  className,
  editorClassName,
}: RichTextEditorProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageTitle, setImageTitle] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      ResizableImage,
    ],
    content,
    editorProps: {
      attributes: {
        class: getEditorContentClassName(compact, editorClassName),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content prop with editor state
  // Only update if the content is different and the editor is not focused
  // to avoid cursor jumping issues while typing.
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: trimmedUrl,
          marks: [{ type: "link", attrs: { href: trimmedUrl } }],
        })
        .run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmedUrl })
      .run();
  };

  const resetImageDialog = () => {
    setImageSrc(null);
    setImageAlt("");
    setImageTitle("");
  };

  const addImage = () => {
    setIsImageDialogOpen(true);
  };

  const insertImage = () => {
    const trimmedSrc = imageSrc?.trim() ?? "";

    if (!trimmedSrc) {
      toast("Ajoute une URL ou téléverse une image.");
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: trimmedSrc,
        alt: imageAlt.trim() || undefined,
        title: imageTitle.trim() || undefined,
      })
      .run();

    setIsImageDialogOpen(false);
    resetImageDialog();
  };

  const handleToolbarMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const hasPartialInlineSelection = () => {
    const { selection } = editor.state;

    if (selection.empty || !selection.$from.parent.isTextblock || !selection.$to.parent.isTextblock) {
      return false;
    }

    const startsAtBoundary = selection.$from.parentOffset === 0;
    const endsAtBoundary = selection.$to.parentOffset === selection.$to.parent.content.size;

    return !(startsAtBoundary && endsAtBoundary);
  };

  const runBlockCommand = (command: () => void) => {
    if (hasPartialInlineSelection()) {
      toast("Sélectionne tout le paragraphe pour appliquer une structure de bloc.");
      return;
    }

    command();
  };

  const clearFormatting = () => {
    if (hasPartialInlineSelection()) {
      editor.chain().focus().unsetAllMarks().run();
      return;
    }

    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  return (
    <>
      <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
        <div className={cn("bg-muted border-b flex flex-wrap gap-1", compact ? "p-1.5" : "p-2")}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-accent" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-accent" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "bg-accent" : ""}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={editor.isActive("code") ? "bg-accent" : ""}
          >
            <Code className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().setParagraph().run();
            })}
            className={editor.isActive("paragraph") ? "bg-accent" : ""}
          >
            <span className="text-xs font-semibold">P</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            })}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            })}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            })}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
          >
            <span className="text-xs font-semibold">H3</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleBulletList().run();
            })}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleOrderedList().run();
            })}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-accent" : ""}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleBlockquote().run();
            })}
            disabled={!editor.can().chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "bg-accent" : ""}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().toggleCodeBlock().run();
            })}
            disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "bg-accent" : ""}
          >
            <span className="text-[11px] font-semibold">&lt;/&gt;</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runBlockCommand(() => {
              editor.chain().focus().setHorizontalRule().run();
            })}
            disabled={!editor.can().chain().focus().setHorizontalRule().run()}
          >
            <span className="text-sm font-semibold">—</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={clearFormatting}
          >
            <span className="text-[11px] font-semibold">Tx</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={addLink}
            className={editor.isActive("link") ? "bg-accent" : ""}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={addImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <EditorContent editor={editor} className="bg-background" />
      </div>

      <Dialog
        open={isImageDialogOpen}
        onOpenChange={(open) => {
          setIsImageDialogOpen(open);

          if (!open) {
            resetImageDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
            <DialogDescription>
              Ajoute une URL ou téléverse une image dans le dossier média associé à ce contenu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ImageUpload
              label="Image"
              value={imageSrc}
              onChange={setImageSrc}
              folder={mediaFolder ?? "blog"}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Texte alternatif (optionnel)"
              />
              <Input
                value={imageTitle}
                onChange={(event) => setImageTitle(event.target.value)}
                placeholder="Titre (optionnel)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImageDialogOpen(false);
                resetImageDialog();
              }}
            >
              Annuler
            </Button>
            <Button type="button" onClick={insertImage} disabled={!imageSrc?.trim()}>
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
