import mammoth from 'mammoth/mammoth.browser';
import type { ImportedNote, NoteImportResult } from '../types/noteImport';

const MIN_READABLE_CHARACTERS = 12;

const buildImportedNote = (
  input: Pick<ImportedNote, 'source' | 'format' | 'content' | 'fileName'>,
): ImportedNote => {
  const normalizedContent = input.content.trim();
  return {
    id: crypto.randomUUID(),
    source: input.source,
    format: input.format,
    content: normalizedContent,
    fileName: input.fileName,
    importedAt: new Date().toISOString(),
    characterCount: normalizedContent.length,
    lineCount: normalizedContent.split(/\n+/).filter(Boolean).length,
  };
};

const hasReadableCharacters = (content: string): boolean => {
  const readableMatches = content.match(/[\p{L}\p{N}]/gu) ?? [];
  return readableMatches.length >= MIN_READABLE_CHARACTERS;
};

export const validateReadableContent = (rawContent: string): NoteImportResult => {
  const content = rawContent.replace(/\u0000/g, '').trim();

  if (!content) {
    return {
      ok: false,
      message: 'No readable content found. Add notes before importing.',
    };
  }

  if (!hasReadableCharacters(content)) {
    return {
      ok: false,
      message:
        'Imported content looks invalid or too sparse. Please provide clearer workshop notes.',
    };
  }

  return {
    ok: true,
    note: buildImportedNote({
      source: 'paste',
      format: 'pasted-text',
      content,
    }),
    message: 'Notes imported successfully.',
  };
};

const parseTextFile = async (file: File): Promise<string> => {
  return file.text();
};

const parseDocxFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const getFileExtension = (fileName: string): string | undefined => {
  const extension = fileName.split('.').pop();
  return extension?.toLowerCase();
};

export const importNoteFromFile = async (file: File): Promise<NoteImportResult> => {
  const extension = getFileExtension(file.name);

  if (!extension || !['txt', 'docx'].includes(extension)) {
    return {
      ok: false,
      message: 'Unsupported file type. Please upload a .txt or .docx file.',
    };
  }

  try {
    const rawContent =
      extension === 'docx' ? await parseDocxFile(file) : await parseTextFile(file);

    const validated = validateReadableContent(rawContent);
    if (!validated.ok) {
      return validated;
    }

    return {
      ok: true,
      note: buildImportedNote({
        source: 'file',
        format: extension,
        fileName: file.name,
        content: validated.note.content,
      }),
      message: `Imported ${file.name} successfully.`,
    };
  } catch {
    return {
      ok: false,
      message:
        'Import failed. The file may be corrupted or unreadable. Try another file or paste notes directly.',
    };
  }
};

export const importNoteFromPastedText = (text: string): NoteImportResult => {
  const validated = validateReadableContent(text);
  if (!validated.ok) {
    return validated;
  }

  return {
    ok: true,
    note: buildImportedNote({
      source: 'paste',
      format: 'pasted-text',
      content: validated.note.content,
    }),
    message: 'Pasted notes imported successfully.',
  };
};
