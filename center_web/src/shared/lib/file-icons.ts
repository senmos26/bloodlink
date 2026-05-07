import type { ElementType } from "react";
import {
  File as FileGeneric,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileAudio2,
  FileVideo,
  FileCode,
} from "lucide-react";

const mimeToIcon: Record<string, ElementType> = {
  // Documents
  "application/pdf": FileText,
  "text/plain": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    FileText,

  // Spreadsheets
  "text/csv": FileSpreadsheet,
  "application/vnd.ms-excel": FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    FileSpreadsheet,

  // Archives
  "application/zip": FileArchive,
  "application/x-zip-compressed": FileArchive,
  "application/x-rar-compressed": FileArchive,
  "application/x-7z-compressed": FileArchive,

  // Code/JSON
  "application/json": FileCode,
};

/**
 * Returns a Lucide icon component appropriate for the provided MIME type.
 * Includes coarse-grained fallbacks for image/video/audio families.
 */
export function getIconForFileType(mimeType?: string): ElementType {
  if (!mimeType) return FileGeneric;

  const family = mimeType.split("/")[0];
  if (family === "image") return FileImage;
  if (family === "video") return FileVideo;
  if (family === "audio") return FileAudio2;

  return mimeToIcon[mimeType] ?? FileGeneric;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}