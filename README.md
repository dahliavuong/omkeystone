# Opportunity Solution Tree (OST) Board

Structured React + TypeScript + Vite implementation of a workshop-ready Opportunity Solution Tree.

## Architecture choices

- **Custom hierarchical layout (not React Flow):** the tree is rendered with deterministic rows/columns so it looks like a strategic planning board instead of a freeform node graph.
- **Typed, data-driven model:** OST entities are validated by `src/types/ost.ts`, and the live board state is managed inside `OSTBoard`.
- **Reusable components:**
  - `OSTBoard` orchestrates layout and node registration
  - `TreeBranch` renders one independent opportunity-space branch
  - `OSTCard` provides semantic card variants (Outcome, Opportunities, Solutions, Assumptions)
  - `ConnectorLayer` draws thin SVG connectors between registered nodes

## How to add or edit branches

The board now starts **blank by default**. You can populate it by applying generated suggestions or by setting your own state update flow in `OSTBoard`.

1. Open `src/components/OSTBoard.tsx`.
2. Update `ostData` state with:
   - `opportunitySpaces`
   - `bigOpportunities`
   - `smallerOpportunities`
   - `solutions`
   - `assumptions`
3. Keep IDs unique within each level.
4. The UI and connectors update automatically because:
   - layout uses array lengths for columns/stacks
   - connector pairs are generated from the data tree in `src/utils/connector.ts`

## How layout and connectors work

- Layout is top-down and symmetric:
  - Outcome row
  - Opportunity Spaces row
  - Big opportunities row per space
  - Smaller opportunities, then solutions, then assumptions below each parent
- `ConnectorLayer` computes each card’s center anchor via DOM refs and draws orthogonal SVG paths (`M -> V -> H -> V`) so relationships stay readable and thin.

## Raw notes import workflow

- Import from **file** (`.txt`, `.docx`) or **paste raw text** directly in `NotesImportPanel`.
- File and pasted content both pass through shared validation in `src/utils/noteImport.ts`.
- Validation blocks empty/sparse/unreadable content and returns clear error messages.
- Successful imports display source metadata, character/line counts, and a preview to confirm input quality before OST refinement.
- Run **Generate OST suggestions** to create draft cards auto-detected from imported notes:
  - opportunities (problem/opportunity signals)
  - solutions (action/initiative signals)
  - assumptions (belief/hypothesis signals)
- Select any subset of draft cards and click **Apply selected to OST** to populate the blank tree.
- Suggestion generation logic lives in `src/utils/ostSuggestion.ts`, and suggestion-to-tree mapping logic lives in `src/utils/ostDraft.ts`.

## AI assistant preview step (context resonance review)

- AI assistant is embedded directly in `OSTSuggestionsPanel` (not a separate panel).
- It automatically reviews generated suggestions line-by-line and proposes improved lines under each item.
- It evaluates suggestions using available context from imported notes (no separate project-context form).
- It highlights improved lines and adds comment/recommendation text per line item.
- It includes a complete 6-level OST structure check and recommends content for any blank level.
- Line improvement logic is in `src/utils/suggestionReview.ts`.

### AI API configuration

The embedded line-by-line reviewer works in-app without external API configuration.

## Run locally

```bash
npm install
npm run dev
```
