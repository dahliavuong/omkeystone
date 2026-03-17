# Opportunity Solution Tree (OST) Board

Structured React + TypeScript + Vite implementation of a workshop-ready Opportunity Solution Tree.

## Architecture choices

- **Custom hierarchical layout (not React Flow):** the tree is rendered with deterministic rows/columns so it looks like a strategic planning board instead of a freeform node graph.
- **Typed, data-driven model:** OST entities are validated by `src/types/ost.ts`, and the live board state is managed inside `OSTBoard`.
- **Reusable components:**
  - `OSTBoard` orchestrates layout and node registration
  - `TreeBranch` renders one independent opportunity-space branch
  - `OSTCard` provides semantic card variants (Outcome, Opportunities, Solutions, Assumptions)
  - `LegendPanel` provides the sticky left guide
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
- It reviews generated suggestions line-by-line in one continuous sequence and proposes improved lines.
- It evaluates suggestions using available context from imported notes (no separate project-context form).
- It always includes all six OST levels in the improved output and proposes ideas for any blank levels.
- Actions:
  - Run AI review in-app (structured critique output)
  - Copy full evaluation prompt for use in external LLM tools
- Prompt and API integration logic is in `src/utils/aiReview.ts`.
- OST snapshot serialization for review is in `src/utils/ostSerialize.ts`.

### AI API configuration

Set environment variables before running dev/preview:

```bash
VITE_OST_LLM_API_KEY=your_api_key
# Optional overrides
VITE_OST_LLM_BASE_URL=https://api.openai.com/v1
VITE_OST_LLM_MODEL=gpt-4o-mini
```

Compatibility fallbacks are also supported (`VITE_LLM_API_KEY`, `VITE_LLM_API_URL`, `VITE_LLM_MODEL`).
If no API key is configured, the assistant automatically falls back to an in-app **offline advisory review mode** and still returns a structured critique.

## Run locally

```bash
npm install
npm run dev
```
