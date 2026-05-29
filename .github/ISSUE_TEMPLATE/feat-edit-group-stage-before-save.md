---
name: 'Allow Editing Group Stage Predictions Before Saving Best Third-Placed Teams'
about: 'Navigation between prediction stages, dynamic recalculation, and knockout phase'
title: '[FEAT] Allow editing Group Stage predictions before saving Best Third-Placed teams + knockout navigation'
labels: ['enhancement', 'predictions', 'ux']
assignees: ''
---

## User Story
As a user, I want to be able to go back and reorder my Group Stage predictions while selecting the best 8 third-placed teams, so that I can adjust my tournament prediction before saving it and generating the knockout bracket.

---

## Requirements

### 1. Allow Back Navigation to Group Stage
- Add a "Back" or "Edit Group Stage" action on the Best Third-Placed Teams screen.
- When clicked, the user returns to the Group Stage ordering screen.
- Previously selected group rankings must be preserved.
- The user can reorder teams again using drag and drop.
- After editing, the list of third-placed teams must be recalculated.

### 2. Refresh Third-Placed Teams After Edits
- If the user changes any group ranking, the third-placed teams list must update accordingly.
- Previously selected third-place teams should only remain selected if they are still valid third-place teams.
- Invalid previous selections must be removed automatically.

### 3. Validate Best 8 Third-Placed Teams
- The user must select exactly 8 third-placed teams.
- The validation button should be disabled until exactly 8 teams are selected.
- Prevent selecting more than 8 teams.
- Show clear feedback if the selection is incomplete.

### 4. Save Prediction
When the user validates the selection:
- Save the final Group Stage ranking.
- Save the selected 8 best third-placed teams.
- Persist the completed Group Stage prediction state.
- Mark this step as completed.

### 5. Navigate to Knockout Phase
After successful save:
- Navigate the user to the Knockout Phase screen.
- Generate and display the initial knockout bracket based on:
  - Group winners
  - Group runners-up
  - Selected best third-placed teams
- The bracket must reflect the user's final Group Stage choices.

### 6. Allow Editing Previous Stages from Knockout Phase
- From Knockout Phase: "Edit Best 3rd-Placed Teams" and "Edit Group Stage" actions.
- Preserve all selections when navigating back.
- Allow modifications and return to Knockout.

### 7. Dynamic Recalculation Rules
- If Group Stage changes, recalculate: qualified teams, third-placed teams, refresh eligible selections, remove invalid ones, rebuild bracket.
- If third-place selections change, recalculate knockout qualification, regenerate bracket, preserve valid picks, remove invalid ones.

### 8. Final Prediction Locking
- Prediction is fully editable until "Submit Final Prediction" is clicked.
- After submission, all stages are locked.

---

## Acceptance Criteria

### Scenario 1 — Back to Group Stage
Given the user is on Best Third-Placed Teams screen
When they click "Edit Group Stage"
Then they return to Group Stage with rankings preserved.

### Scenario 2 — Third-place list updates after edits
Given user edits group order
When they return to Third-Placed screen
Then third-placed teams are recalculated.

### Scenario 3 — Invalid selections auto-removed
Given a previously selected third-place team
When that team is no longer 3rd in its group
Then it is removed from selection.

### Scenario 4 — Validation disabled until 8 selected
Given fewer than 8 teams selected
Then the save button is disabled.

### Scenario 5 — Cannot select more than 8
Given 8 teams already selected
When trying to select another
Then the system prevents it.

### Scenario 6 — Save + navigate to Knockout
Given exactly 8 teams selected
When clicking "Save & Continue"
Then bracket is generated and user sees Knockout Phase.

### Scenario 7 — Edit from Knockout
Given user is on Knockout Phase
When clicking "Edit Best 3rd-Placed Teams" or "Edit Group Stage"
Then they navigate back with selections preserved.

### Scenario 8 — Bracket updates after edits
Given user edited previous stages
When returning to Knockout Phase
Then bracket is regenerated.

### Scenario 9 — Invalid knockout picks removed
Given a knockout pick is no longer qualified
When returning to Knockout
Then that pick is cleared.

### Scenario 10 — Locked after submit
Given user submitted final prediction
When trying to edit
Then system prevents modifications.

---

## Technical Tasks

- [ ] Extend store: add 'knockout' step, `bracketPicks`, `pruneThirdPlaceSelections()`, `submitted` flag
- [ ] Add `goToStep` and `setBracketPick` to store
- [ ] Modify `setGroupOrder` to auto-prune invalid third-place selections
- [ ] Create `getThirdPlaceTeams()` helper (exported from constants or store)
- [ ] Update `GroupsView`: accept optional `onBack` prop
- [ ] Update `ThirdPlacedView`: add back button, save & continue CTA, auto-prune on mount
- [ ] Create `KnockoutView` component: bracket display, bracket picks, edit buttons, submit
- [ ] Update `PredictionsFlow`: add knockout step to the step indicator and rendering
- [ ] Add `pruneInvalidKnockoutPicks()` when groups or third-place change
- [ ] Build verification

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/lib/predictions/store.ts` | Modify — extend Step, add bracketPicks, prune, submitted |
| `src/components/predictions/groups-view.tsx` | Modify — add onBack prop |
| `src/components/predictions/third-placed-view.tsx` | Modify — back button, save CTA, auto-prune |
| `src/components/predictions/knockout-view.tsx` | **Create** — bracket display + picks |
| `src/components/predictions/predictions-flow.tsx` | Modify — add knockout step |
