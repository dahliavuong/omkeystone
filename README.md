# Opportunity Solution Tree (OST) Board

Structured React + TypeScript + Vite implementation of a workshop-ready Opportunity Solution Tree.

## Architecture choices

- **Custom hierarchical layout (not React Flow):** the tree is rendered with deterministic rows/columns so it looks like a strategic planning board instead of a freeform node graph.
- **Typed, data-driven model:** all board content lives in `src/data/ostData.ts` and is validated by types in `src/types/ost.ts`.
- **Reusable components:**
  - `OSTBoard` orchestrates layout and node registration
  - `TreeBranch` renders one independent opportunity-space branch
  - `OSTCard` provides semantic card variants (Outcome, Opportunities, Solutions, Assumptions)
  - `LegendPanel` provides the sticky left guide
  - `ConnectorLayer` draws thin SVG connectors between registered nodes

## How to add or edit branches

1. Open `src/data/ostData.ts`.
2. Add or edit:
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

## Run locally

```bash
npm install
npm run dev
```
