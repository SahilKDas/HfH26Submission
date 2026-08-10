# Accessibility verification checklist

Automated coverage lives in `e2e/accessibility.spec.js` and runs in desktop Chromium and a 393px mobile viewport. Axe must report no serious or critical violations on the home, check-in, Method, and open Constraint Lab surfaces.

## Keyboard and focus

- [x] Skip link reaches main content.
- [x] Check-in, guided mode, and crisis support contain focus while open.
- [x] Escape closes dialogs and returns focus to the invoking control.
- [x] Guided controls expose Previous, Next, Start/Pause, Restart, Stop, persistent exit, and crisis support.
- [x] Visible focus uses a three-pixel outline that is not encoded by color alone.
- [x] Interactive controls use native buttons, links, inputs, selects, details, and summaries.

## Perception and reflow

- [x] Primary automated surfaces have no serious or critical Axe violations.
- [x] Reduced-motion media query removes nonessential animation and smooth scrolling.
- [x] Increased-contrast media query strengthens borders and dark surfaces.
- [x] Compact layouts reflow at 760px and 390px without two-column form dependencies.
- [x] Offline, radio, guided transitions, Model Room job progress, and completion have text or live-region equivalents.
- [ ] Perform a final manual 200% and 400% browser-zoom pass before submission recording.

## Screen-reader rehearsal

Run locally on Windows with NVDA before the final video:

1. Traverse header navigation and activate “Find my next step.”
2. Confirm the dialog name and three-step progress are announced.
3. Complete a check-in without a mouse and inspect “Why this step.”
4. Enter guided mode; verify instruction changes and pause/completion announcements.
5. Open crisis support and confirm it interrupts the recommendation path.
6. Open the Constraint Lab and verify changed ranking text is announced.
7. Verify radio status and third-party disclosure before pressing Play.

Manual screen-reader rehearsal is performed by the solo builder and is not represented as independent accessibility validation.
