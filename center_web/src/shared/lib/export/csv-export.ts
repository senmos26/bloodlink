/**
 * CSV Export Utility
 *
 * @remarks
 * Production-ready CSV export functionality with proper escaping, BOM for Excel,
 * and internationalization support for 4 languages (EN, FR, DE, ES).
 *
 * Follows RFC 4180 CSV standard for maximum compatibility.
 *
 * @module shared/lib/export/csv-export
 */

/**
 * Column definition for CSV export.
 *
 * @property key - Data field key to extract from objects
 * @property header - Translated column header
 * @property formatter - Optional custom formatter function
 */
export type CSVColumn<T = Record<string, unknown>> = {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
};

/**
 * Options for CSV export.
 *
 * @property delimiter - Field delimiter (default: ',')
 * @property linebreak - Line break character (default: '\n')
 * @property includeBOM - Include UTF-8 BOM for Excel compatibility (default: true)
 */
export type CSVExportOptions = {
  delimiter?: string;
  linebreak?: string;
  includeBOM?: boolean;
};

/**
 * Escapes a value for CSV format according to RFC 4180.
 *
 * @remarks
 * - Wraps values containing delimiter, quotes, or linebreaks in double quotes
 * - Escapes existing double quotes by doubling them
 * - Handles null/undefined as empty strings
 *
 * @param value - Value to escape
 * @param delimiter - Field delimiter
 * @returns Escaped string safe for CSV
 */
function escapeCSVValue(value: unknown, delimiter: string = ","): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Check if escaping is needed
  const needsEscaping =
    stringValue.includes(delimiter) ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (!needsEscaping) {
    return stringValue;
  }

  // Escape double quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');

  // Wrap in double quotes
  return `"${escaped}"`;
}

/**
 * Converts an array of objects to CSV format.
 *
 * @remarks
 * Handles proper escaping, custom formatters, and BOM for Excel.
 * Follows RFC 4180 standard for maximum compatibility.
 *
 * @param data - Array of data objects
 * @param columns - Column definitions with headers and optional formatters
 * @param options - Export options (delimiter, BOM, etc.)
 * @returns CSV string ready for download
 *
 * @example
 * ```typescript
 * const data = [
 *   { name: "Ahmed Tazi", volume: 450, date: "2025-01-01" },
 *   { name: "Sara Mansouri", volume: 350, date: "2025-01-02" },
 * ];
 *
 * const columns: CSVColumn[] = [
 *   { key: "name", header: "Nom complet" },
 *   { key: "volume", header: "Volume (ml)", formatter: (v) => `${v} ml` },
 *   { key: "date", header: "Date" },
 * ];
 *
 * const csv = arrayToCSV(data, columns);
 * // Result: "Nom complet","Volume (ml)","Date"
 * //         "Ahmed Tazi","450 ml","2025-01-01"
 * //         "Sara Mansouri","350 ml","2025-01-02"
 * ```
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[],
  options: CSVExportOptions = {}
): string {
  const {
    delimiter = ",",
    linebreak = "\n",
    includeBOM = true,
  } = options;

  if (data.length === 0) {
    return "";
  }

  // Build header row
  const headers = columns.map((col) => escapeCSVValue(col.header, delimiter));
  const headerRow = headers.join(delimiter);

  // Build data rows
  const dataRows = data.map((row) => {
    const values = columns.map((col) => {
      const rawValue = row[col.key as keyof T];
      const formattedValue = col.formatter
        ? col.formatter(rawValue, row)
        : rawValue;
      return escapeCSVValue(formattedValue, delimiter);
    });
    return values.join(delimiter);
  });

  // Combine all rows
  const csvContent = [headerRow, ...dataRows].join(linebreak);

  // Add BOM for Excel UTF-8 compatibility
  if (includeBOM) {
    return "\uFEFF" + csvContent;
  }

  return csvContent;
}

/**
 * Triggers a browser download of CSV content.
 *
 * @remarks
 * Creates a temporary blob and link element to trigger download.
 * Automatically cleans up after download starts.
 *
 * @param csvContent - CSV string content
 * @param filename - Download filename (without extension)
 *
 * @example
 * ```typescript
 * const csv = arrayToCSV(data, columns);
 * downloadCSV(csv, "charges_export");
 * // Downloads: charges_export_2025-01-04_143022.csv
 * ```
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add timestamp to filename for uniqueness
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "")
    .slice(0, 15); // Format: 20250104T143022
  const fullFilename = `${filename}_${timestamp}.csv`;

  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create temporary download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fullFilename);
  link.style.visibility = "hidden";

  // Append, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release blob URL
  URL.revokeObjectURL(url);
}

/**
 * High-level export function combining conversion and download.
 *
 * @remarks
 * Convenience function that handles the full export pipeline:
 * data → CSV → download.
 *
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param filename - Download filename (without extension)
 * @param options - Export options
 *
 * @example
 * ```typescript
 * exportToCSV(
 *   charges,
 *   [
 *     { key: "id", header: "ID" },
 *     { key: "amount", header: "Montant", formatter: (v) => `${v} MAD` },
 *     { key: "status", header: "Statut" },
 *   ],
 *   "charges_overdue"
 * );
 * ```
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string,
  options?: CSVExportOptions
): void {
  const csv = arrayToCSV(data, columns, options);
  downloadCSV(csv, filename);
}
