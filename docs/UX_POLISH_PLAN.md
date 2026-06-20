# AI Travel Board UX Polish Plan

## Goal

Make the board feel like a focused travel product before enabling paid AI generation. The work prioritizes clarity, visual quality, and confidence over adding new APIs.

## Product principles

- A first-time visitor should understand the primary action within a few seconds.
- The next useful action should always be visually obvious.
- The itinerary, places, and map should behave as one connected system.
- The interface should feel calm and premium in both light and dark themes.
- Mock mode must remain fully usable without any AI cost.

## Design direction

### Theme

Use a midnight-travel palette instead of the current green-led palette.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Background | `#F7F7FC` | `#10111A` | App canvas |
| Surface | `#FFFFFF` | `#191B27` | Panels and cards |
| Text | `#202331` | `#F4F5FA` | Primary content |
| Primary | `#6366F1` | `#A5B4FC` | Main actions and selection |
| Accent | `#F97360` | `#FDA4AF` | Day, time, and emphasis |
| Border | `#E4E6F0` | `#2C3040` | Structure without noise |

### Typography

- Use `Pretendard` as the Korean UI font with reliable system fallbacks.
- Use a restrained type scale: strong page title, clear section titles, readable body text.
- Reduce excessive `800` and `900` font weights; reserve them for key actions and headings.

## Phases

### Phase 1 — Visual foundation and dark mode

Scope:

- Theme tokens for light and dark modes.
- Sun/moon toggle in the top-level UI.
- Respect system preference on first visit and persist the user choice in localStorage.
- New palette, panel treatment, focus states, and typography foundation.

Done when:

- Theme switch is keyboard-accessible and has an accessible label.
- No light-only colors remain in shared components.
- Reloading the page preserves the selected theme.

### Phase 2 — First-use flow and information hierarchy

Scope:

- Make the trip condition form the unmistakable first action.
- Replace technical status copy with human-centered feedback.
- Add three starter examples to the empty state.
- De-emphasize secondary panels until an itinerary exists.

Done when:

- A new visitor can create a sample itinerary without interpreting internal terms such as mock or fallback.
- Empty, loading, error, and generated states have distinct visual hierarchy.

### Phase 3 — Connected board interactions

Scope:

- Selecting a timeline item highlights its place card and map marker.
- Selecting a place card highlights its timeline item and map marker.
- Make selected state visible without relying on color alone.
- Keep the map route labeled as visit order, not real road navigation.

Done when:

- Users can always tell which place is selected and where it appears in the day plan.

### Phase 4 — Content and component polish

Scope:

- Refine place cards, badges, buttons, and empty states.
- Add concise helper text and useful button labels.
- Improve loading skeletons and error recovery actions.
- Normalize spacing, border radius, and hover/focus behavior.

Done when:

- Repeated UI patterns share a consistent visual language.
- Interactive elements have clear hover, focus, disabled, and selected states.

### Phase 5 — Responsive and accessibility pass

Scope:

- Convert the desktop three-column layout into an intentional small-screen flow.
- Verify keyboard navigation, focus visibility, contrast, and control labels.
- Test common desktop and mobile viewport widths.

Done when:

- The primary generate, select-place, chat-edit, save, and map actions work without a mouse.
- Small screens retain the trip-building flow without horizontal overflow.

## Deferred work

- OpenAI API activation and cost controls.
- Road-aware route and travel-time calculation through Routes API.
- Place photos, reviews, and opening-hours detail calls.
- Account sync and cloud persistence.

## Verification per phase

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

For UI phases, also manually verify light/dark mode and the empty, loading, generated, error, and editing states.
