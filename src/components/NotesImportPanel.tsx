import { useMemo, useState } from 'react';
import type { ImportedNote } from '../types/noteImport';
import { importNoteFromFile, importNoteFromPastedText } from '../utils/noteImport';

type NotesImportPanelProps = {
  importedNote: ImportedNote | null;
  onImported: (note: ImportedNote) => void;
  onClearImportedNote: () => void;
  onGenerateSuggestions: () => void;
};

type Status = {
  type: 'success' | 'error';
  message: string;
};

const statusStyles: Record<Status['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function NotesImportPanel({
  importedNote,
  onImported,
  onClearImportedNote,
  onGenerateSuggestions,
}: NotesImportPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [isImportingFile, setIsImportingFile] = useState(false);

  const importedAtText = useMemo(() => {
    if (!importedNote) {
      return '';
    }
    return new Date(importedNote.importedAt).toLocaleString();
  }, [importedNote]);

  const handleImportFile = async () => {
    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Choose a .txt or .docx file before importing.',
      });
      return;
    }

    setIsImportingFile(true);
    setStatus(null);
    const result = await importNoteFromFile(selectedFile);
    setIsImportingFile(false);

    if (!result.ok) {
      setStatus({ type: 'error', message: result.message });
      return;
    }

    onImported(result.note);
    setStatus({ type: 'success', message: result.message });
  };

  const handleImportPastedText = () => {
    setStatus(null);
    const result = importNoteFromPastedText(pastedText);

    if (!result.ok) {
      setStatus({ type: 'error', message: result.message });
      return;
    }

    onImported(result.note);
    setStatus({ type: 'success', message: result.message });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Import raw notes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload workshop notes (.txt, .docx) or paste unstructured text directly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerateSuggestions}
            disabled={!importedNote}
            className="rounded-lg bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-700/45"
          >
            Generate OST suggestions
          </button>
          {importedNote ? (
            <button
              type="button"
              onClick={onClearImportedNote}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear imported note
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {importedNote
          ? 'Ready to generate draft opportunities, solutions, and assumptions.'
          : 'Import or paste notes first, then generate OST suggestions.'}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">Paste raw notes</p>
          <p className="mt-1 text-xs text-slate-600">
            Paste transcripts, workshop dumps, or brainstorm notes.
          </p>

          <textarea
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
            rows={7}
            placeholder="Paste raw workshop notes here..."
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          <button
            type="button"
            onClick={handleImportPastedText}
            className="mt-4 rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Import pasted notes
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">Import from file</p>
          <p className="mt-1 text-xs text-slate-600">Supported formats: .txt, .docx</p>

          <label className="mt-4 block rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-700">
            <span className="font-medium">Choose note file</span>
            <input
              type="file"
              accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <span className="mt-2 block text-xs text-slate-500">
                Selected: {selectedFile.name}
              </span>
            ) : null}
          </label>

          <button
            type="button"
            onClick={handleImportFile}
            disabled={isImportingFile}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImportingFile ? 'Importing file...' : 'Import file'}
          </button>
        </div>
      </div>

      {status ? (
        <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${statusStyles[status.type]}`}>
          {status.message}
        </div>
      ) : null}

      {importedNote ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
              Source: {importedNote.source === 'file' ? 'File import' : 'Pasted text'}
            </span>
            <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
              Format: {importedNote.format}
            </span>
            <span>{importedNote.characterCount.toLocaleString()} characters</span>
            <span>{importedNote.lineCount.toLocaleString()} lines</span>
            <span>Imported at: {importedAtText}</span>
          </div>
          {importedNote.fileName ? (
            <p className="mt-2 text-xs text-slate-600">File: {importedNote.fileName}</p>
          ) : null}
          <p className="mt-3 text-sm font-medium text-slate-800">Imported note preview</p>
          <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
            {importedNote.content.slice(0, 800)}
            {importedNote.content.length > 800 ? '…' : ''}
          </p>
        </div>
      ) : null}
    </section>
  );
}
