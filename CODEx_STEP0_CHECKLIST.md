# Step 0 – “The First Look” (Codex checklist)

1. Ensure branch: `step_0` (create/switch if needed).
2. State source: use `Step0Provider`/`useStep0Store` from `src/features/discovery/step0Store.tsx`; no local `useState` for Step 0.
3. UI: render `Step0FirstLook` (`src/features/discovery/Step0FirstLook.tsx`) inside `Step0Provider`.
4. Hydration (later): allow optional `initialState` to prefill from project data.
5. Persistence (later): debounce/save Step 0 state to project model (e.g., `updateProject(projectId, { step0 })`).
6. Files to track: `src/features/discovery/Step0FirstLook.tsx`, `src/features/discovery/step0Store.tsx` (and any routing/screen hook-ups).
7. Do not commit local/AI configs (e.g., `.claude/settings.local.json`); add to `.gitignore` and untrack if needed.
8. Git steps: stage the Step 0 files → commit (`"Add Step 0 – The First Look discovery flow"`) → `git push origin step_0`.
9. PR title suggestion: “Add Step 0 – The First Look”; note state lives in `step0Store`, persistence TBD.
