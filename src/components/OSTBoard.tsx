import { useCallback, useMemo, useRef, useState } from 'react';
import type { ImportedNote } from '../types/noteImport';
import type { GeneratedOSTSuggestions } from '../types/ostSuggestion';
import type { OSTData } from '../types/ost';
import { buildConnections } from '../utils/connector';
import { getMaxBigOpportunities, getNodeId } from '../utils/layout';
import { generateOSTSuggestionsFromImportedNote } from '../utils/ostSuggestion';
import { ConnectorLayer } from './ConnectorLayer';
import { LegendPanel } from './LegendPanel';
import { LevelRow } from './LevelRow';
import { NotesImportPanel } from './NotesImportPanel';
import { OSTCard } from './OSTCard';
import { OSTSuggestionsPanel } from './OSTSuggestionsPanel';
import { TreeBranch } from './TreeBranch';

type OSTBoardProps = {
  data: OSTData;
};

export function OSTBoard({ data }: OSTBoardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [nodeVersion, setNodeVersion] = useState(0);
  const [importedNote, setImportedNote] = useState<ImportedNote | null>(null);
  const [suggestions, setSuggestions] = useState<GeneratedOSTSuggestions | null>(null);

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

  const connections = useMemo(() => buildConnections(data), [data]);
  const maxBigOpportunityCount = getMaxBigOpportunities(data);
  const branchWidth = Math.max(maxBigOpportunityCount * 360 + (maxBigOpportunityCount - 1) * 32, 1120);

  const handleImportedNote = (note: ImportedNote) => {
    setImportedNote(note);
    setSuggestions(null);
  };

  const handleClearImportedNote = () => {
    setImportedNote(null);
    setSuggestions(null);
  };

  const handleGenerateSuggestions = () => {
    if (!importedNote) {
      return;
    }
    setSuggestions(generateOSTSuggestionsFromImportedNote(importedNote));
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-800">
      <div className="flex">
        <LegendPanel />

        <main className="flex-1 overflow-auto">
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
              <OSTSuggestionsPanel suggestions={suggestions} />
            </div>
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
                      title={data.outcome}
                      variant="outcome"
                      className="w-[560px] py-4 text-center text-base"
                      nodeId={getNodeId.outcome()}
                      registerNode={registerNode}
                    />
                  </div>
                </LevelRow>

                <LevelRow title="Opportunity Spaces">
                  <div className="flex items-start justify-center gap-12">
                    {data.opportunitySpaces.map((space) => (
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
    </div>
  );
}
