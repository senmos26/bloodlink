"use client";

import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Maximize2, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_DIMENSION = 80;

function parseDimension(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(MIN_DIMENSION, Math.round(value));
  }

  if (typeof value === "string") {
    const numeric = Number.parseInt(value, 10);

    if (Number.isFinite(numeric)) {
      return Math.max(MIN_DIMENSION, Math.round(numeric));
    }
  }

  return null;
}

function parseStyleDimension(element: HTMLElement, property: "width" | "height") {
  const rawValue = element.style[property];

  if (!rawValue) {
    return null;
  }

  const match = rawValue.match(/(\d+(?:\.\d+)?)px/);

  if (!match) {
    return null;
  }

  return parseDimension(match[1]);
}

function getSafeRatio(imageElement: HTMLImageElement | null, width: number | null, height: number | null) {
  if (imageElement?.naturalWidth && imageElement.naturalHeight) {
    return imageElement.naturalWidth / imageElement.naturalHeight;
  }

  if (width && height) {
    return width / height;
  }

  return 1;
}

function getMaxAvailableWidth(container: HTMLDivElement | null) {
  if (!container?.parentElement) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.max(MIN_DIMENSION, Math.floor(container.parentElement.clientWidth - 8));
}

function ResizableImageView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resizeStateRef = useRef<{ width: number; height: number } | null>(null);

  const width = parseDimension(node.attrs.width);
  const height = parseDimension(node.attrs.height);

  const [draftWidth, setDraftWidth] = useState<number | null>(width);
  const [draftHeight, setDraftHeight] = useState<number | null>(height);
  const [widthInput, setWidthInput] = useState(width ? String(width) : "");
  const [heightInput, setHeightInput] = useState(height ? String(height) : "");
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setDraftWidth(width);
    setDraftHeight(height);
    setWidthInput(width ? String(width) : "");
    setHeightInput(height ? String(height) : "");
  }, [width, height]);

  const applyDimensions = (nextWidth: number, nextHeight: number) => {
    const safeWidth = Math.max(MIN_DIMENSION, Math.round(nextWidth));
    const maxWidth = getMaxAvailableWidth(containerRef.current);
    const constrainedWidth = Math.min(safeWidth, maxWidth);
    const constrainedHeight = Math.max(MIN_DIMENSION, Math.round(nextHeight));

    setDraftWidth(constrainedWidth);
    setDraftHeight(constrainedHeight);
    setWidthInput(String(constrainedWidth));
    setHeightInput(String(constrainedHeight));
    updateAttributes({ width: constrainedWidth, height: constrainedHeight });
  };

  const applyWidth = (rawWidth: number) => {
    const ratio = getSafeRatio(imageRef.current, draftWidth, draftHeight);
    applyDimensions(rawWidth, rawWidth / ratio);
  };

  const applyHeight = (rawHeight: number) => {
    const ratio = getSafeRatio(imageRef.current, draftWidth, draftHeight);
    applyDimensions(rawHeight * ratio, rawHeight);
  };

  const handleReset = () => {
    setDraftWidth(null);
    setDraftHeight(null);
    setWidthInput("");
    setHeightInput("");
    updateAttributes({ width: null, height: null });
  };

  const handleImageLoad = () => {
    const imageElement = imageRef.current;

    if (!imageElement) {
      return;
    }

    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      return;
    }

    if (width && !height) {
      applyDimensions(width, width / (naturalWidth / naturalHeight));
      return;
    }

    if (!width && height) {
      applyDimensions(height * (naturalWidth / naturalHeight), height);
    }
  };

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const imageElement = imageRef.current;

    if (!imageElement) {
      return;
    }

    const startRect = imageElement.getBoundingClientRect();
    const startX = event.clientX;
    const startWidth = startRect.width;
    const ratio = getSafeRatio(imageElement, draftWidth, draftHeight);

    resizeStateRef.current = {
      width: Math.round(startWidth),
      height: Math.round(startWidth / ratio),
    };
    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const maxWidth = getMaxAvailableWidth(containerRef.current);
      const nextWidth = Math.min(maxWidth, Math.max(MIN_DIMENSION, startWidth + (moveEvent.clientX - startX)));
      const nextHeight = Math.max(MIN_DIMENSION, Math.round(nextWidth / ratio));

      resizeStateRef.current = {
        width: Math.round(nextWidth),
        height: nextHeight,
      };
      setDraftWidth(Math.round(nextWidth));
      setDraftHeight(nextHeight);
      setWidthInput(String(Math.round(nextWidth)));
      setHeightInput(String(nextHeight));
    };

    const handlePointerUp = () => {
      const finalDimensions = resizeStateRef.current;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setIsResizing(false);

      if (finalDimensions) {
        applyDimensions(finalDimensions.width, finalDimensions.height);
      }

      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <NodeViewWrapper className="my-6" contentEditable={false}>
      <div
        ref={containerRef}
        className={`relative inline-block max-w-full ${selected ? "ring-2 ring-primary/30 ring-offset-2" : ""}`}
      >
        {selected ? (
          <div
            className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>L</span>
              <Input
                value={widthInput}
                inputMode="numeric"
                className="h-8 w-20"
                onChange={(event) => setWidthInput(event.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => {
                  const nextWidth = Number(widthInput);

                  if (Number.isFinite(nextWidth) && nextWidth > 0) {
                    applyWidth(nextWidth);
                    return;
                  }

                  setWidthInput(draftWidth ? String(draftWidth) : "");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const nextWidth = Number(widthInput);

                    if (Number.isFinite(nextWidth) && nextWidth > 0) {
                      applyWidth(nextWidth);
                    }
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>H</span>
              <Input
                value={heightInput}
                inputMode="numeric"
                className="h-8 w-20"
                onChange={(event) => setHeightInput(event.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => {
                  const nextHeight = Number(heightInput);

                  if (Number.isFinite(nextHeight) && nextHeight > 0) {
                    applyHeight(nextHeight);
                    return;
                  }

                  setHeightInput(draftHeight ? String(draftHeight) : "");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const nextHeight = Number(heightInput);

                    if (Number.isFinite(nextHeight) && nextHeight > 0) {
                      applyHeight(nextHeight);
                    }
                  }
                }}
              />
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={handleReset}>
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => deleteNode()}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? ""}
          width={draftWidth ?? undefined}
          height={draftHeight ?? undefined}
          onLoad={handleImageLoad}
          draggable={false}
          className={`block max-w-full rounded-md border bg-background shadow-sm ${isResizing ? "cursor-se-resize" : ""}`}
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {selected ? (
          <button
            type="button"
            aria-label="Redimensionner l'image"
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 cursor-se-resize items-center justify-center rounded-full border bg-background shadow-md"
            onPointerDown={handleResizePointerDown}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => parseDimension(element.getAttribute("width")) ?? parseStyleDimension(element as HTMLElement, "width"),
        renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (element) => parseDimension(element.getAttribute("height")) ?? parseStyleDimension(element as HTMLElement, "height"),
        renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width = parseDimension(HTMLAttributes.width);
    const height = parseDimension(HTMLAttributes.height);
    const styleValue = [HTMLAttributes.style, "max-width: 100%", "height: auto", "display: block"].filter(Boolean).join("; ");

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, width ? { width } : {}, height ? { height } : {}, styleValue ? { style: styleValue } : {}),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
