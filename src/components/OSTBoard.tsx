import { useCallback, useMemo, useRef, useState } from 'react';
import type { ImportedNote } from '../types/noteImport';
import type { DraftSuggestionCard, GeneratedOSTSuggestions } from '../types/ostSuggestion';
import type { OSTData } from '../types/ost';
import { buildConnections } from '../utils/connector';
import { getMaxBigOpportunities, getNodeId } from '../utils/layout';
import {
  applySelectedSuggestionsToOST,
  createBlankOSTData,
  type ApplyStructureSeeds,
} from '../utils/ostDraft';
import { generateOSTSuggestionsFromText } from '../utils/ostSuggestion';
import { ConnectorLayer } from './ConnectorLayer';
import { LevelRow } from './LevelRow';
import { NotesImportPanel } from './NotesImportPanel';
import { OSTCard } from './OSTCard';
import { OSTSuggestionsPanel } from './OSTSuggestionsPanel';
import { TreeBranch } from './TreeBranch';

type OSTBoardProps = {
  initialData?: OSTData;
};

export function OSTBoard({ initialData }: OSTBoardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [nodeVersion, setNodeVersion] = useState(0);
  const [ostData, setOstData] = useState<OSTData>(initialData ?? createBlankOSTData());
  const [importedNote, setImportedNote] = useState<ImportedNote | null>(null);
  const [suggestions, setSuggestions] = useState<GeneratedOSTSuggestions | null>(null);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);

  const registerNode = useCallback((id: string, element: HTMLDivElement | null) => {
    const current = nodeElementsRef.current.get(id);

    if (element && current !== element) {
      nodeElementsRef.current.set(id, element);
      setNodeVersion((value) => value + 1);
      return;
    }

    if (!element && current) {
      nodeElementsRef.current.delete(id);
      setNodeVersion((value) => value + 1);
    }
  }, []);

  const connections = useMemo(() => buildConnections(ostData), [ostData]);
  const maxBigOpportunityCount = getMaxBigOpportunities(ostData);
  const branchWidth = Math.max(
    maxBigOpportunityCount * 360 + (maxBigOpportunityCount - 1) * 32,
    1120,
  );

  const handleImportedNote = (note: ImportedNote) => {
    setImportedNote(note);
    setSuggestions(null);
    setApplyStatus(null);
  };

  const handleClearImportedNote = () => {
    setImportedNote(null);
    setSuggestions(null);
    setApplyStatus(null);
  };

  const handleGenerateSuggestions = (sourceText?: string) => {
    if (!importedNote) {
      return;
    }
    const inputText = sourceText?.trim() || importedNote.content;
    setSuggestions(generateOSTSuggestionsFromText(inputText, importedNote.id));
    setApplyStatus(null);
  };

  const handleApplySelectedSuggestions = (
    selectedCards: DraftSuggestionCard[],
    seeds?: ApplyStructureSeeds,
  ) => {
    if (selectedCards.length === 0) {
      setApplyStatus('Select at least one suggestion card to apply.');
      return;
    }

    setOstData((current) => applySelectedSuggestionsToOST(current, selectedCards, seeds));
    setApplyStatus(`Applied ${selectedCards.length} selected suggestion(s) to the OST.`);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-800">
      <main className="overflow-auto">
        <div className="relative min-h-screen min-w-max p-10">
          <div className="mx-auto mb-6 w-full max-w-[1800px] min-w-[980px]">
            <NotesImportPanel
              importedNote={importedNote}
              onImported={handleImportedNote}
              onClearImportedNote={handleClearImportedNote}
              onGenerateSuggestions={handleGenerateSuggestions}
            />
          </div>
          <div className="mx-auto mb-6 w-full max-w-[1800px] min-w-[980px]">
            <OSTSuggestionsPanel
              suggestions={suggestions}
              onApplySelected={handleApplySelectedSuggestions}
              ostData={ostData}
              projectContext={importedNote?.content ?? ''}
            />
          </div>
          {applyStatus ? (
            <div className="mx-auto mb-6 w-full max-w-[1800px] min-w-[980px] rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {applyStatus}
            </div>
          ) : null}
          <div
            ref={canvasRef}
            className="relative mx-auto flex min-w-max flex-col items-center gap-14 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm"
          >
            <ConnectorLayer
              canvasRef={canvasRef}
              nodeElementsRef={nodeElementsRef}
              connections={connections}
              version={nodeVersion}
            />

            <div className="relative z-10 flex w-full flex-col items-center gap-12">
              <LevelRow title="Outcome">
                <div className="flex justify-center">
                  <OSTCard
                    title={ostData.outcome || 'Outcome not set yet'}
                    subtitle={
                      ostData.outcome
                        ? undefined
                        : 'Apply selected suggestions to start building the tree'
                    }
                    variant="outcome"
                    className="w-[560px] py-4 text-center text-base"
                    nodeId={getNodeId.outcome()}
                    registerNode={registerNode}
                  />
                </div>
              </LevelRow>

              <LevelRow title="Opportunity Spaces">
                <div className="flex items-start justify-center gap-12">
                  {ostData.opportunitySpaces.length === 0 ? (
                    <div className="w-[620px] rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                      The OST is blank. Generate suggestions from imported notes, then apply
                      selected cards to create your first branch.
                    </div>
                  ) : null}
                  {ostData.opportunitySpaces.map((space) => (
                    <div key={space.id} style={{ width: `${branchWidth}px` }}>
                      <TreeBranch opportunitySpace={space} registerNode={registerNode} />
                    </div>
                  ))}
                </div>
              </LevelRow>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
