export type ImportedNoteSource = 'file' | 'paste';

export type ImportedNoteFormat = 'txt' | 'docx' | 'pasted-text';

export type ImportedNote = {
  id: string;
  source: ImportedNoteSource;
  format: ImportedNoteFormat;
  content: string;
  fileName?: string;
  importedAt: string;
  characterCount: number;
  lineCount: number;
};

export type NoteImportResult =
  | {
      ok: true;
      note: ImportedNote;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };
