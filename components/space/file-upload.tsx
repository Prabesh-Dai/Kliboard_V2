"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Upload, X, FileText, FileSpreadsheet, FileIcon, Check, FolderOpen, CircleAlert, Music, Maximize2, Loader2 } from "lucide-react";
import { ALLOWED_MIME_TYPES, AUDIO_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { fileItemVariants, baseTransition } from "@/lib/animations";
import { AudioPlayer } from "@/components/space/audio-player";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PendingFile } from "@/components/space/file-list";

const ALLOWED_MIME_TYPE_SET = new Set(ALLOWED_MIME_TYPES);
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const TEXT_TYPES = ["text/plain", "text/markdown", "text/csv", "application/json"];

function isImageFile(mimeType: string) {
  return IMAGE_TYPES.includes(mimeType);
}

function isAudioFile(mimeType: string) {
  return AUDIO_MIME_TYPES.includes(mimeType) || mimeType.startsWith("audio/");
}

function isPdfFile(mimeType: string) {
  return mimeType === "application/pdf";
}

function isTextFile(mimeType: string) {
  return TEXT_TYPES.includes(mimeType);
}

function isPopupPreviewable(mimeType: string) {
  return isImageFile(mimeType) || isPdfFile(mimeType) || isTextFile(mimeType);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeIcon(mimeType: string) {
  if (AUDIO_MIME_TYPES.includes(mimeType) || mimeType.startsWith("audio/")) return Music;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType === "text/markdown") return FileText;
  return FileIcon;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  pendingFiles?: PendingFile[];
  onRemovePending?: (id: string) => void;
  uploading?: boolean;
  full?: boolean;
  progress?: { completed: number; total: number };
  disabled?: boolean;
}

export function FileUpload({ onFilesSelected, maxFiles, pendingFiles = [], onRemovePending, uploading, full, progress, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<PendingFile | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<{ status: "loading" | "ready" | "error"; value: string } | null>(null);
  const [mediaStatus, setMediaStatus] = useState<"loading" | "ready" | "error">("loading");
  const textReqRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const activePreview =
    previewFile && pendingFiles.some((p) => p.id === previewFile.id) ? previewFile : null;

  useEffect(() => {
    if (!pdfUrl) return;
    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  function openPreview(pending: PendingFile) {
    const { file } = pending;
    setPreviewFile(pending);
    setMediaStatus("loading");
    setPdfUrl(isPdfFile(file.type) ? URL.createObjectURL(file) : null);
    if (isTextFile(file.type)) {
      const req = ++textReqRef.current;
      setTextContent({ status: "loading", value: "" });
      file
        .text()
        .then((value) => {
          if (textReqRef.current === req) setTextContent({ status: "ready", value });
        })
        .catch((err) => {
          console.error("Failed to read text file for preview", err);
          if (textReqRef.current === req) setTextContent({ status: "error", value: "" });
        });
    } else {
      setTextContent(null);
    }
  }

  function closePreview() {
    textReqRef.current++;
    setPreviewFile(null);
    setPdfUrl(null);
    setTextContent(null);
  }

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;

      const accepted: File[] = [];
      for (const file of Array.from(fileList)) {
        if (!ALLOWED_MIME_TYPE_SET.has(file.type)) {
          toast.error(`${file.name}: File type not allowed`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`${file.name}: File too large (max 10MB)`);
          continue;
        }
        accepted.push(file);
      }

      const limited = maxFiles !== undefined ? accepted.slice(0, maxFiles) : accepted;
      if (limited.length < accepted.length) {
        toast.error(`Only ${maxFiles} more file(s) allowed`);
      }
      if (limited.length) onFilesSelected(limited);
    },
    [onFilesSelected, maxFiles]
  );

  useEffect(() => {
    if (disabled) return;
    function handlePaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (!files?.length) return;
      const hasImages = Array.from(files).some((f) => f.type.startsWith("image/"));
      if (!hasImages) return;
      e.preventDefault();
      handleFiles(files);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFiles, disabled]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      className={`relative flex flex-1 flex-col overflow-hidden rounded-lg bg-surface-container-low transition-colors ${
        disabled
          ? "border-0"
          : dragging
            ? "border border-dashed border-primary/40 bg-primary/5"
            : "border border-dashed border-ghost-border"
      } ${pendingFiles.length > 0 ? "p-4" : "p-3 md:items-center md:justify-center md:p-6 md:text-center"}`}
    >
      {dragging && pendingFiles.length > 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-low/90 backdrop-blur-[2px]">
          <Upload className="size-5 text-primary/70" />
          <p className="text-xs font-medium text-muted-foreground">Drop files here</p>
        </div>
      )}
      {pendingFiles.length > 0 || uploading ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {uploading && progress && progress.total > 0
                ? `Uploading ${progress.completed} / ${progress.total}`
                : `${pendingFiles.length} file${pendingFiles.length !== 1 ? "s" : ""} ready`}
            </p>
            {!full && !uploading && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                Add more
              </button>
            )}
          </div>
          {uploading && progress && progress.total > 0 && (
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{
                  width: `${Math.min(100, (progress.completed / progress.total) * 100)}%`,
                }}
              />
            </div>
          )}
          <div className="min-h-0 max-h-[70dvh] flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AnimatePresence initial={false} mode="popLayout">
                {(uploading ? [] : pendingFiles).map((pending) => {
                  const { id, file, previewUrl, exiting, error } = pending;
                  const Icon = getFileTypeIcon(file.type);
                  const hasError = Boolean(error);
                  const isImage = isImageFile(file.type) && Boolean(previewUrl);
                  const isAudio = isAudioFile(file.type) && Boolean(previewUrl);
                  const canPreview =
                    !hasError && !exiting && (isImage || isPdfFile(file.type) || isTextFile(file.type));
                  return (
                    <motion.div
                      key={id}
                      layout={reduceMotion ? false : "position"}
                      variants={fileItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={baseTransition}
                      className="group flex min-w-0 flex-col gap-1.5"
                    >
                      <div
                        role={canPreview ? "button" : undefined}
                        tabIndex={canPreview ? 0 : undefined}
                        aria-label={canPreview ? `Preview ${file.name}` : undefined}
                        onClick={canPreview ? () => openPreview(pending) : undefined}
                        onKeyDown={
                          canPreview
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openPreview(pending);
                                }
                              }
                            : undefined
                        }
                        className={`relative overflow-hidden rounded-md outline-none ${
                          canPreview ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/60" : ""
                        } ${isAudio ? "" : "aspect-4/3"} ${
                          hasError
                            ? "bg-destructive/10 ring-1 ring-destructive/40"
                            : "bg-surface-container-high/50"
                        }`}
                      >
                        {isAudio ? (
                          <AudioPlayer src={previewUrl} variant="hero" caption={formatFileSize(file.size)} />
                        ) : isImage ? (
                          <img src={previewUrl} alt={file.name} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center">
                            <Icon className="size-7 text-muted-foreground" />
                            <span className="font-mono text-[9px] text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                        )}

                        {isImage && (
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-surface-container-low/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground backdrop-blur-sm">
                            {formatFileSize(file.size)}
                          </span>
                        )}

                        {canPreview && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="flex size-9 items-center justify-center rounded-full bg-surface-container-low/80 text-foreground shadow-sm backdrop-blur-sm">
                              <Maximize2 className="size-4" />
                            </span>
                          </div>
                        )}

                        {hasError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/40">
                            <CircleAlert className="size-6 text-destructive" />
                          </div>
                        )}
                        {exiting && !hasError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                            <Check className="size-6 text-primary" />
                          </div>
                        )}

                        {!exiting && onRemovePending && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePending(id);
                            }}
                            aria-label={`Remove ${file.name}`}
                            className="absolute right-1.5 top-1.5 z-20 flex size-6 cursor-pointer items-center justify-center rounded bg-surface-container-low/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="truncate px-0.5 text-[10px] text-muted-foreground" title={file.name}>
                        {file.name}
                      </p>
                      {hasError && (
                        <p className="px-0.5 text-[10px] leading-snug text-destructive">{error}</p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : full ? (
        <>
          <div className="flex items-center gap-2.5 md:hidden">
            <Upload className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">File limit reached</p>
          </div>
          <p className="hidden text-sm font-medium text-muted-foreground md:block">File limit reached</p>
          <p className="mt-1.5 hidden text-xs text-muted-foreground md:block">Maximum files per space</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-container-high">
                <Upload className="size-4 text-primary/70" />
              </div>
              <p className="truncate font-heading text-sm font-medium">Upload Files</p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground ring-1 ring-ghost-border transition-colors hover:text-foreground hover:ring-primary/30"
            >
              <FolderOpen className="size-3" />
              Browse
            </button>
          </div>
          <Upload
            strokeWidth={4}
            className="pointer-events-none absolute inset-0 m-auto hidden size-36 text-foreground opacity-[0.06] md:block"
          />
          <div className="relative hidden flex-col items-center md:flex">
            <p className="font-heading text-sm font-medium">Upload Files</p>
            <p className="mt-1.5 text-xs font-normal text-muted-foreground/60">Drag. Drop. Paste.</p>
            <div aria-hidden className="mt-3 h-px w-16 bg-foreground/15" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-container-low px-5 py-2 text-[10px] uppercase tracking-widest text-muted-foreground ring-1 ring-ghost-border transition-colors hover:text-foreground hover:ring-primary/30"
            >
              <FolderOpen className="size-3" />
              Browse Files
            </button>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        aria-label="Upload files"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      <Dialog open={Boolean(activePreview)} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-3 sm:max-w-3xl">
          {activePreview && (
            <>
              <DialogTitle className="truncate pr-8 text-sm">{activePreview.file.name}</DialogTitle>
              <div className="min-h-0 flex-1 overflow-auto">
                {isImageFile(activePreview.file.type) && activePreview.previewUrl ? (
                  <div className="relative flex min-h-[40dvh] items-center justify-center">
                    {mediaStatus === "loading" && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {mediaStatus === "error" ? (
                      <p className="py-10 text-center text-xs text-destructive">Could not load this image.</p>
                    ) : (
                      <img
                        src={activePreview.previewUrl}
                        alt={activePreview.file.name}
                        onLoad={() => setMediaStatus("ready")}
                        onError={() => setMediaStatus("error")}
                        className={`mx-auto max-h-[72dvh] w-auto rounded-md object-contain ${
                          reduceMotion ? "" : "transition-opacity duration-200"
                        } ${mediaStatus === "ready" ? "opacity-100" : "opacity-0"}`}
                      />
                    )}
                  </div>
                ) : isPdfFile(activePreview.file.type) ? (
                  <div className="relative">
                    {mediaStatus === "loading" && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {pdfUrl && (
                      <iframe
                        src={pdfUrl}
                        title={activePreview.file.name}
                        onLoad={() => setMediaStatus("ready")}
                        className="h-[72dvh] w-full rounded-md bg-surface-container"
                      />
                    )}
                  </div>
                ) : isTextFile(activePreview.file.type) ? (
                  textContent?.status === "ready" ? (
                    <pre className="max-h-[72dvh] overflow-auto rounded-md bg-surface-container p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
                      {textContent.value}
                    </pre>
                  ) : textContent?.status === "error" ? (
                    <p className="py-10 text-center text-xs text-destructive">Could not read this file.</p>
                  ) : (
                    <div className="flex h-[40dvh] items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  )
                ) : (
                  <p className="py-10 text-center text-xs text-muted-foreground">No preview available.</p>
                )}
              </div>
              <p className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {formatFileSize(activePreview.file.size)}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
