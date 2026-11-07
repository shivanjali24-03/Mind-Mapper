# Code review checklist

How changes to Mind Mapper are reviewed. Every pull request is checked against this list.

## 1. Correctness
- Does it do what the linked issue asks? Are edge cases handled (empty map, one idea, huge map)?
- Are errors shown to the user in plain words, not swallowed?

## 2. Readability
- Clear names, small functions, no dead code.
- Pure logic lives in `src/lib/` and has unit tests; components stay thin.

## 3. Tests
- New logic has tests. Bug fixes include a test that fails without the fix.

## 4. Security and privacy
- Input is validated on the server; no secrets in code; no real personal data in demo content.

## 5. Performance
- No unnecessary re-renders on the canvas; heavy libraries are loaded only when needed.

## 6. Accessibility and UX
- Keyboard works, focus is visible, buttons have labels, colours have enough contrast.
- Works in light and dark mode and on small screens.

## How feedback is written
- Be kind and specific. Explain *why*, and suggest a fix.
- Label comments: **must-fix**, **suggestion** or **question**.
