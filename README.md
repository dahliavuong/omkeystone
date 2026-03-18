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
- Successful imports display source metadata, character/line counts, and an auto-detected **draft OST bullet preview** in this exact hierarchy:
  - Outcome
  - Opps space
  - Big opp
  - Small opp
  - Solution
  - Assumption
- Missing draft parts remain blank initially to make incompleteness visible.
- The preview box is **editable**.
- Use **AI review & refine preview** to improve/fill the draft preview before generation.
- Use **Generate OST** to build the board directly from the reviewed preview text.
- Draft preview logic lives in `src/utils/draftPreview.ts`.

### AI API configuration

The preview refinement step can use an API key if configured, and falls back to offline refinement when key/config is unavailable.

## Run locally

```bash
npm install
npm run dev
```
